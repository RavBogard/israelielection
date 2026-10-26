import { scheduledCycle } from "@/lib/election-lifecycle/scheduled-cycle";
import {
  rehearsalEnabled,
  runRehearsal,
} from "@/lib/election-lifecycle/rehearsal";
import { acquireDurableCount } from "@/lib/election-lifecycle/count-store";
import {
  configuredCycleStore,
  runCycle,
  pauseNightSchedule,
} from "@/lib/election-lifecycle/coordinator";
import { createHash } from "node:crypto";
import { verifyQStash } from "@/lib/live-forecast/auth";
import { lifecycleEnabled } from "@/lib/election-lifecycle/core";
import { lifecycleStore } from "@/lib/election-lifecycle/store";
import {
  probeLifecycleSources,
  probePrimaryExtraction,
} from "@/lib/election-lifecycle/probe";
import {
  runLifecycleWorker,
  type WorkerMode,
} from "@/lib/election-lifecycle/worker";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const body = await request.text(),
    destination = process.env.ELECTION_LIFECYCLE_WORKER_URL,
    keys = [
      process.env.QSTASH_CURRENT_SIGNING_KEY,
      process.env.QSTASH_NEXT_SIGNING_KEY,
    ].filter((s): s is string => !!s);
  if (
    !destination ||
    !verifyQStash(
      request.headers.get("upstash-signature"),
      body,
      destination,
      keys,
    )
  )
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    if (JSON.parse(body).mode === "cycle_rehearsal") {
      if (!rehearsalEnabled())
        return Response.json({ error: "not_found" }, { status: 404 });
      return Response.json(await runRehearsal(JSON.parse(body)), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (JSON.parse(body).mode === "pause_night")
      return Response.json(await pauseNightSchedule(), {
        headers: { "Cache-Control": "no-store" },
      });
    if (JSON.parse(body).mode === "extraction_probe")
      return Response.json(await probePrimaryExtraction(), {
        headers: { "Cache-Control": "no-store" },
      });
    if (JSON.parse(body).mode === "probe")
      return Response.json(
        { status: "probe", results: await probeLifecycleSources() },
        { headers: { "Cache-Control": "no-store" } },
      );
  } catch {
    return Response.json({ error: "invalid_probe_or_body" }, { status: 400 });
  }
  if (!lifecycleEnabled()) return Response.json({ status: "disabled" });
  const store = lifecycleStore();
  if (!store)
    return Response.json({ error: "store_unconfigured" }, { status: 503 });
  const payload = JSON.parse(body);
  if (payload.mode === "count_recovery") {
    if (
      typeof payload.operator !== "string" ||
      !payload.operator.trim() ||
      typeof payload.reason !== "string" ||
      !payload.reason.trim() ||
      payload.reason.length > 2000
    )
      return Response.json(
        { error: "recovery_audit_required" },
        { status: 400 },
      );
    try {
      return Response.json(
        await acquireDurableCount(new Date().toISOString(), {
          operator: payload.operator,
          reason: payload.reason,
        }),
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json({ error: "count_recovery_failed" }, { status: 503 });
    }
  }
  if (payload.mode === "cycle") {
    const cycles = configuredCycleStore();
    if (!cycles)
      return Response.json({ error: "store_unconfigured" }, { status: 503 });
    try {
      if (payload.window && !payload.cycleAt) {
        if (!["night", "regular"].includes(payload.window))
          throw new Error("invalid_window");
        const bound = await scheduledCycle(
          request.headers.get("upstash-message-id"),
          payload.window,
        );
        if (!bound.cycleAt)
          return Response.json(
            {
              status: "outside_schedule_window",
              scheduleId: bound.scheduleId,
              triggerAt: new Date(bound.createdAt).toISOString(),
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        payload.cycleAt = bound.cycleAt;
      } else if (!payload.cycleAt) throw new Error("explicit_cycle_required");
      const result = await runCycle(cycles, payload);
      return Response.json(result, {
        status: result.status === "busy" ? 503 : 200,
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      return Response.json({ error: "cycle_retry_required" }, { status: 503 });
    }
  }
  let mode: WorkerMode;
  try {
    mode = JSON.parse(body).mode ?? "election";
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!["election", "formation", "briefing"].includes(mode))
    return Response.json({ error: "invalid_mode" }, { status: 400 });
  const delivery = createHash("sha256")
    .update(request.headers.get("upstash-signature")!)
    .digest("hex");
  try {
    const result = await runLifecycleWorker(store, delivery, mode);
    return Response.json(result, {
      status: result.status === "busy" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "refresh_failed" }, { status: 503 });
  }
}
