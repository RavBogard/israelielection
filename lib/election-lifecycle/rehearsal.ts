import {
  cadenceMetadata,
  cycleAt,
  CADENCE_START,
  REGULAR_START,
} from "./cadence";
import {
  configuredCycleStore,
  enqueueSignedPayload,
  runCycle,
  type CycleStage,
} from "./coordinator";
import { namespace } from "./store";
export const rehearsalEnabled = () =>
  process.env.VERCEL_ENV === "preview" &&
  process.env.ELECTION_CADENCE_REHEARSAL === "true";
export function rehearsalSelection(payload: Record<string, unknown>) {
  if (!rehearsalEnabled()) throw new Error("rehearsal_unavailable");
  const id = payload.rehearsalId,
    now = payload.testNow;
  if (
    typeof id !== "string" ||
    !/^[-a-zA-Z0-9_]{1,64}$/.test(id) ||
    typeof now !== "string"
  )
    throw new Error("rehearsal_input_invalid");
  const time = Date.parse(now);
  if (
    !Number.isFinite(time) ||
    time < CADENCE_START - 60_000 ||
    time > REGULAR_START + 3 * 60 * 60_000
  )
    throw new Error("rehearsal_clock_invalid");
  return {
    id,
    now: new Date(time).toISOString(),
    prefix: namespace() + "rehearsal:" + id + ":",
  };
}
/** Actual signed queue/progress rehearsal; never invokes acquisition or writes public seat/current records. */
export async function runRehearsal(payload: Record<string, unknown>) {
  const { id, now, prefix } = rehearsalSelection(payload),
    store = configuredCycleStore(prefix);
  if (!store) throw new Error("rehearsal_store_unconfigured");
  const at = cycleAt(Date.parse(now));
  if (payload.operation === "state") {
    const cycle = at === null ? null : new Date(at).toISOString();
    return {
      status: "rehearsal_state",
      rehearsalId: id,
      testNow: now,
      cadence: cadenceMetadata(now, null),
      stages: cycle
        ? {
            cycleAt: cycle,
            count: await store.status(cycle, "count"),
            model: await store.status(cycle, "model"),
            authority: await store.status(cycle, "authority"),
          }
        : null,
      publicWrites: 0,
    };
  }
  const result = await runCycle(
    store,
    {
      stage: payload.stage as CycleStage | undefined,
      cycleAt:
        typeof payload.cycleAt === "string" ? payload.cycleAt : undefined,
    },
    now,
    {
      count: async () => {},
      model: async () => {},
      authority: async () => {},
      enqueue: async (cycle, stage) =>
        enqueueSignedPayload({
          mode: "cycle_rehearsal",
          rehearsalId: id,
          testNow: now,
          stage,
          cycleAt: cycle,
        }),
    },
  );
  return { ...result, rehearsalId: id, testNow: now, publicWrites: 0 };
}
