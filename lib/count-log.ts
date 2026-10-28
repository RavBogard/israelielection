import { lifecycleStore } from "./election-lifecycle/store";
import type { SharedSeatContext } from "./election-lifecycle/types";

export type CountLogRow = {
  /** The committee file's own last-modified time, else when we captured it. */
  fileAt: string;
  /** Share of the expected final vote counted in that file; null for snapshots stored before we kept it. */
  counted: number | null;
  /** The projection's seats by bloc after that file. */
  blocs: Record<"net" | "opp" | "mid" | "arab", number>;
};

/** Seats by bloc from a context's own point seats and party blocs; lists with no known bloc are left out. */
export function blocSeats(context: Pick<SharedSeatContext, "pointSeats" | "parties">): CountLogRow["blocs"] {
  const out = { net: 0, opp: 0, mid: 0, arab: 0 };
  for (const p of context.parties) {
    const bloc = p.bloc as keyof typeof out | undefined;
    if (bloc && bloc in out) out[bloc] += context.pointSeats[p.id] ?? 0;
  }
  return out;
}

/** One row per stored committee count file, newest first: the last count-informed projection published after that file. */
export function countLogFrom(snapshots: readonly SharedSeatContext[]): CountLogRow[] {
  const byFile = new Map<string, { at: string; row: CountLogRow }>();
  for (const s of snapshots) {
    if (s.basis !== "partial_count") continue;
    const fileAt = s.countSourceUpdatedAt ?? s.observedAt;
    const prior = byFile.get(fileAt);
    if (prior && prior.at >= s.observedAt) continue;
    byFile.set(fileAt, { at: s.observedAt, row: { fileAt, counted: s.countCoverage ?? null, blocs: blocSeats(s) } });
  }
  return [...byFile.values()].map((v) => v.row).sort((a, b) => Date.parse(b.fileAt) - Date.parse(a.fileAt));
}

/** Server read of the lifecycle ledger the site already stores; unavailable store gives an empty log, never an error. */
export async function countLogRows(): Promise<CountLogRow[]> {
  try {
    const ledger = await lifecycleStore()?.load();
    return ledger ? countLogFrom(ledger.seatSnapshots) : [];
  } catch {
    return [];
  }
}
