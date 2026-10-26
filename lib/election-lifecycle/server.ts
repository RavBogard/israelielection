import { cache } from "react";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { fingerprint, lifecycleEnabled } from "./core";
import { emptyLedger, resolveLifecycle } from "./resolver";
import { lifecycleStore } from "./store";
import type {
  ElectionLifecycleSnapshot,
  LifecycleLedger,
  LifecycleSelection,
  SeatContextResult,
} from "./types";
let lastGood: LifecycleLedger | null = null;
const readCurrent = cache(async () => {
  const store = lifecycleStore();
  if (!lifecycleEnabled())
    return { store, ledger: emptyLedger(), coldFailure: false };
  // Enabled seat evidence is request-time even if credentials are missing or Redis is offline.
  // Keep this outside the data-error boundary so Next's rendering control flow propagates.
  await connection();
  if (!store) return { store, ledger: emptyLedger(), coldFailure: true };
  try {
    const ledger = (await store.load()) ?? emptyLedger();
    lastGood = structuredClone(ledger);
    return { store, ledger, coldFailure: false };
  } catch (error) {
    unstable_rethrow(error);
    const ledger = lastGood ? structuredClone(lastGood) : emptyLedger();
    const now = new Date().toISOString();
    ledger.health = ledger.health.map((h) => ({
      ...h,
      status: "unavailable" as const,
      reason: "source_unavailable" as const,
      checkedAt: now,
    }));
    if (!ledger.health.length)
      ledger.health = [
        {
          sourceId: "campaign-forecast",
          authority: "model",
          status: "unavailable",
          checkedAt: now,
          lastSuccessfulAt: null,
          reason: "source_unavailable",
        },
      ];
    return { store, ledger, coldFailure: !lastGood };
  }
});
export async function getElectionLifecycle(
  selection: LifecycleSelection = {},
): Promise<ElectionLifecycleSnapshot | null> {
  const { store, ledger, coldFailure } = await readCurrent(),
    now = new Date().toISOString();
  if (coldFailure && !selection.revision) return null;
  if (selection.revision) {
    if (!/^[a-f0-9]{64}$/.test(selection.revision)) return null;
    const baseline = resolveLifecycle(emptyLedger(), now);
    if (
      selection.revision === baseline.revision ||
      selection.revision === baseline.seatContext.revision
    )
      return {
        ...resolveLifecycle(ledger, now),
        seatContext: baseline.seatContext,
        selection: {
          mode: "pinned",
          seatRevision: baseline.seatContext.revision,
          politics: "current",
        },
      };
    if (!store) return null;
    try {
      const pinned = await store.pinned(selection.revision);
      if (!pinned) return null;
      // A shared revision pins the seat scenario only. Politics is explicitly current and always redacted.
      const current = resolveLifecycle(ledger, now),
        seatContext = "seatContext" in pinned ? pinned.seatContext : pinned;
      return {
        ...current,
        revision: fingerprint({
          current: current.revision,
          pinnedSeat: seatContext.revision,
        }),
        seatContext,
        selection: {
          mode: "pinned",
          seatRevision: seatContext.revision,
          politics: "current",
        },
      };
    } catch (error) {
      unstable_rethrow(error);
      return null;
    }
  }
  return resolveLifecycle(ledger, now);
}
export async function getSharedSeatContext(
  selection: LifecycleSelection = {},
): Promise<SeatContextResult> {
  const lifecycle = await getElectionLifecycle(selection);
  return lifecycle
    ? { state: "ready", context: lifecycle.seatContext, lifecycle }
    : {
        state: "unavailable",
        reason: selection.revision
          ? "pinned_unavailable"
          : "source_unavailable",
        revision: selection.revision ?? "",
      };
}
