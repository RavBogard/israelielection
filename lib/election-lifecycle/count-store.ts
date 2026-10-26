import { RedisLiveStore } from "../live-forecast/store";
import { acquireCount, resultsConfig } from "../results-live";
import type { ResultsSnapshot } from "../results-snapshot";
import type { ErrorReason } from "../results-phase";
export type CountRecord = {
  recoveryAudit?: { operator: string; reason: string; at: string };
  current: ResultsSnapshot | null;
  previous: ResultsSnapshot | null;
  raw: string | null;
  health: {
    lastAttemptAt: string;
    lastSuccessfulAt: string | null;
    error: ErrorReason | null;
  };
};
export const countNamespace = () =>
  `election-count:2026:v1:${process.env.ELECTION_LIFECYCLE_NAMESPACE ?? process.env.VERCEL_ENV ?? "development"}:`;
function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? new RedisLiveStore(url, token) : null;
}
const lastGoodCounts = new Map<string, CountRecord>();
export async function readCountRecord(): Promise<CountRecord | null> {
  const db = redis(),
    key = countNamespace();
  if (!db) return null;
  try {
    const value = await db.command<string | null>("GET", key + "current");
    const record = value ? (JSON.parse(value) as CountRecord) : null;
    if (record) lastGoodCounts.set(key, structuredClone(record));
    return record;
  } catch (error) {
    const { unstable_rethrow } = await import("next/navigation");
    unstable_rethrow(error);
    const prior = lastGoodCounts.get(key);
    if (!prior) throw error;
    return {
      ...structuredClone(prior),
      health: {
        ...prior.health,
        lastAttemptAt: new Date().toISOString(),
        error: "unreachable",
      },
    };
  }
}
export async function acquireDurableCount(
  now: string,
  audit?: { operator: string; reason: string },
) {
  const db = redis();
  if (!db) throw new Error("count_store_unconfigured");
  const old = await readCountRecord();
  let raw: string | null = null;
  const result = await acquireCount(0, {
    now: Date.parse(now),
    store: old ?? {},
    onAcquired: (value) => {
      raw = value;
    },
  });
  if (result.state === "closed") return { status: "closed" };
  const success = result.state === "open" && result.freshness === "fresh";
  const current = success ? result.snapshot : (old?.current ?? null);
  const record: CountRecord = {
    ...(audit
      ? { recoveryAudit: { ...audit, at: now } }
      : old?.recoveryAudit
        ? { recoveryAudit: old.recoveryAudit }
        : {}),
    current,
    previous:
      success && old?.current?.hash !== current?.hash
        ? (old?.current ?? null)
        : (old?.previous ?? null),
    raw: success ? raw : (old?.raw ?? null),
    health: {
      lastAttemptAt: now,
      lastSuccessfulAt: success ? now : (old?.health.lastSuccessfulAt ?? null),
      error: success
        ? null
        : result.state === "error"
          ? result.reason
          : "unreachable",
    },
  };
  // A delayed request cannot replace a newer acquisition; genuine corrected vote totals may decrease.
  const written = await db.command<number>(
    "EVAL",
    "local old=redis.call('GET',KEYS[1]); if old and cjson.decode(old).health.lastAttemptAt>ARGV[2] then return 0 end redis.call('SET',KEYS[1],ARGV[1]); return 1",
    1,
    countNamespace() + "current",
    JSON.stringify(record),
    now,
  );
  return {
    status: written ? (success ? "acquired" : "retained") : "superseded",
    election: resultsConfig.election,
  };
}
