import { COUNT_TIMELINE } from "../political-record/elections";
import { createHash, randomUUID } from "node:crypto";
import { RedisLiveStore, configuredStore } from "../live-forecast/store";
import { runWorker, electionWindow } from "../live-forecast/worker";
import { acquireDurableCount } from "./count-store";
import { cycleAt } from "./cadence";
import { lifecycleStore, namespace } from "./store";
import { runLifecycleWorker } from "./worker";
export type CycleStage = "model" | "authority" | "count";
export interface CycleStore {
  status(cycle: string, stage: CycleStage): Promise<string | null>;
  claim(
    cycle: string,
    stage: CycleStage,
    token: string,
  ): Promise<"claimed" | "busy" | "superseded">;
  attempts(cycle: string, stage: CycleStage): Promise<number>;
  finish(
    cycle: string,
    stage: CycleStage,
    status: "done" | "failed",
  ): Promise<void>;
  release(cycle: string, stage: CycleStage, token: string): Promise<void>;
}
export class RedisCycleStore implements CycleStore {
  constructor(
    private db: RedisLiveStore,
    private prefix = namespace(),
  ) {}
  private key(cycle: string) {
    return this.prefix + "cycle:" + cycle;
  }
  async status(cycle: string, stage: CycleStage) {
    return this.db.command<string | null>("HGET", this.key(cycle), stage);
  }
  async claim(cycle: string, stage: CycleStage, token: string) {
    const r = await this.db.command<number>(
      "EVAL",
      "local last=redis.call('GET',KEYS[2]); if last and last>ARGV[2] then return -1 end if not redis.call('SET',KEYS[1],ARGV[1],'NX','EX',90) then return 0 end redis.call('SET',KEYS[2],ARGV[2]); return 1",
      2,
      this.key(cycle) + ":" + stage + ":lock",
      this.prefix + "cycle-latest:" + stage,
      token,
      cycle,
    );
    return r === 1 ? "claimed" : r === -1 ? "superseded" : "busy";
  }
  async attempts(cycle: string, stage: CycleStage) {
    return this.db.command<number>(
      "HINCRBY",
      this.key(cycle),
      stage + ":attempts",
      1,
    );
  }
  async finish(cycle: string, stage: CycleStage, status: "done" | "failed") {
    await this.db.command("HSET", this.key(cycle), stage, status);
    await this.db.command("EXPIRE", this.key(cycle), 604800);
  }
  async release(cycle: string, stage: CycleStage, token: string) {
    await this.db.command(
      "EVAL",
      "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",
      1,
      this.key(cycle) + ":" + stage + ":lock",
      token,
    );
  }
}
export function configuredCycleStore(prefix?: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token
    ? new RedisCycleStore(new RedisLiveStore(url, token), prefix)
    : null;
}
export async function enqueueSignedPayload(
  payload: Record<string, unknown>,
  delaySeconds = 0,
) {
  if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 600)
    throw new Error("queue_delay_invalid");
  const destination = process.env.ELECTION_LIFECYCLE_WORKER_URL,
    token = process.env.QSTASH_TOKEN;
  if (!destination || !token) throw new Error("cycle_queue_unconfigured");
  const base = new URL(process.env.QSTASH_URL ?? "https://qstash.upstash.io")
    .origin;
  if (!new URL(base).hostname.endsWith(".upstash.io"))
    throw new Error("queue_host_invalid");
  const body = JSON.stringify(payload);
  const response = await fetch(`${base}/v2/publish/${destination}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(process.env.VERCEL_ENV === "preview" &&
      process.env.ELECTION_PREVIEW_PROTECTION_BYPASS
        ? {
            "Upstash-Forward-x-vercel-protection-bypass":
              process.env.ELECTION_PREVIEW_PROTECTION_BYPASS,
          }
        : {}),
      "Upstash-Retries": "3",
      ...(delaySeconds ? { "Upstash-Delay": `${delaySeconds}s` } : {}),
      "Upstash-Deduplication-Id": createHash("sha256")
        .update(destination + body)
        .digest("hex"),
    },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("cycle_queue_unavailable");
}
export async function enqueueCycle(cycle: string, stage: CycleStage) {
  return enqueueSignedPayload({ mode: "cycle", stage, cycleAt: cycle });
}
export type CycleDependencies = {
  count?: (cycle: string, now: string) => Promise<void>;
  model: (cycle: string, now: string) => Promise<void>;
  authority: (cycle: string, now: string) => Promise<void>;
  enqueue: (cycle: string, stage: CycleStage) => Promise<void>;
};
const dependencies: CycleDependencies = {
  count: async (_cycle, now) => {
    await acquireDurableCount(now);
  },
  model: async (cycle, now) => {
    const model = configuredStore();
    if (!model) throw new Error("model_store_unconfigured");
    if (
      !electionWindow(Date.parse(now)) ||
      process.env.LIVE_FORECAST_ENABLED !== "true"
    )
      return;
    const result = await runWorker(model, "cycle:" + cycle, now);
    if (result.status === "busy") throw new Error("model_busy");
  },
  authority: async (cycle, now) => {
    const store = lifecycleStore();
    if (!store) throw new Error("lifecycle_store_unconfigured");
    const result = await runLifecycleWorker(
      store,
      "cycle:" + cycle,
      "cycle",
      now,
    );
    if (result.status === "busy") throw new Error("authority_busy");
  },
  enqueue: enqueueCycle,
};
/** Each bounded signed stage has independent progress; queue failure resumes without reacquiring completed inputs. */
export async function runCycle(
  store: CycleStore,
  request: {
    stage?: CycleStage;
    cycleAt?: string;
    window?: "night" | "regular";
  },
  now = new Date().toISOString(),
  deps: CycleDependencies = dependencies,
) {
  const current = cycleAt(Date.parse(now));
  if (current === null) return { status: "before_close" };
  if (request.window === "night" && current >= COUNT_TIMELINE.regularStart)
    return { status: "outside_night_window" };
  if (request.window === "regular" && current < COUNT_TIMELINE.regularStart)
    return { status: "before_regular_window" };
  const time = request.cycleAt ? Date.parse(request.cycleAt) : current;
  if (!Number.isFinite(time) || time > current || cycleAt(time) !== time)
    throw new Error("invalid_cycle");
  if (time < current)
    return { status: "superseded", cycleAt: new Date(time).toISOString() };
  const cycle = new Date(time).toISOString(),
    stage = request.stage ?? "model";
  if (!["model", "authority"].includes(stage)) throw new Error("invalid_stage");
  if (stage === "authority" && !(await store.status(cycle, "model")))
    throw new Error("model_stage_pending");
  const completed = await store.status(cycle, stage);
  if (completed) {
    if (stage === "model") await deps.enqueue(cycle, "authority");
    return { status: "duplicate", cycleAt: cycle, stage };
  }
  const token = randomUUID(),
    claim = await store.claim(cycle, stage, token);
  if (claim !== "claimed") return { status: claim, cycleAt: cycle, stage };
  try {
    if (
      stage === "model" &&
      deps.count &&
      !(await store.status(cycle, "count"))
    ) {
      try {
        await deps.count(cycle, now);
        await store.finish(cycle, "count", "done");
      } catch {
        await store.finish(cycle, "count", "failed");
      }
    }
    const attempt = await store.attempts(cycle, stage);
    try {
      await (stage === "model" ? deps.model : deps.authority)(cycle, now);
      await store.finish(cycle, stage, "done");
    } catch (error) {
      if (stage !== "model" || attempt < 3) throw error;
      await store.finish(cycle, stage, "failed");
    }
    // An unavailable model must not indefinitely block authoritative official seats/formation.
    if (stage === "model") await deps.enqueue(cycle, "authority");
    return { status: "completed", cycleAt: cycle, stage };
  } finally {
    await store.release(cycle, stage, token);
  }
}

/** Delayed signed maintenance action targets only the bounded intensive schedule. */
export async function pauseNightSchedule(now = new Date().toISOString()) {
  if (Date.parse(now) < COUNT_TIMELINE.regularStart)
    return { status: "before_pause_time" };
  const id = `lifecycle-${process.env.VERCEL_ENV ?? "development"}-night-2026`,
    base = new URL(process.env.QSTASH_URL ?? "https://qstash.upstash.io")
      .origin;
  if (
    !new URL(base).hostname.endsWith(".upstash.io") ||
    !process.env.QSTASH_TOKEN
  )
    throw new Error("queue_unconfigured");
  const response = await fetch(`${base}/v2/schedules/${id}/pause`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("night_pause_failed");
  return { status: "paused", scheduleId: id };
}
