import { MAJORITY, pledgeConflicts, type Warning } from "./coalition";
import type { Party, PledgeRule, Poll } from "./types";

/*
 * Paths to 61: every combination of lists that reaches a majority in one poll, kept only when it is a
 * minimal winning coalition (drop any one list and it falls under 61). Supersets add a list nothing
 * needs, so they are left out: every larger majority is one of these plus spare lists. Ranked by fewest
 * lists, then most seats, then the lists' order in the data, so the order is deterministic.
 * Pledge conflicts come only from the declarative rules (data/pledge-rules.json).
 */

/** A list, or a group a poll reported only together, that can hold seats. */
export type Unit = { ids: string[]; seats: number };

export type Path = {
  ids: string[];
  seats: number;
  /** Pledge warnings this cabinet triggers, with the lists each rule names. */
  conflicts: { warning: Warning; ids: string[] }[];
  /** Every list named by one of those conflicts. */
  conflictIds: string[];
};

export type SupportPath = { cabinet: string[]; support: string[]; cabinetSeats: number; supportSeats: number; seats: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Lists with seats in the poll, in data order; lists under the threshold or unreported are left out. */
export function unitsOf(poll: Poll, parties: Party[]): Unit[] {
  const out: Unit[] = [];
  for (const p of parties) {
    const r = poll.results[p.id];
    if (r && !r.belowThreshold && r.seats > 0) out.push({ ids: [p.id], seats: r.seats });
  }
  for (const g of poll.combined) {
    if (g.seats > 0 && g.parties.every((id) => !poll.results[id])) out.push({ ids: [...g.parties], seats: g.seats });
  }
  return out;
}

/** Every minimal winning combination of units, ranked. */
export function minimalWinning(units: Unit[], majority = MAJORITY): { units: Unit[]; seats: number }[] {
  const n = units.length;
  if (n > 22) throw new Error("too many lists to enumerate");
  const out: { units: Unit[]; seats: number; order: number[] }[] = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const idx: number[] = [];
    let total = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { idx.push(i); total += units[i].seats; }
    total = r1(total);
    if (total < majority) continue;
    if (idx.some((i) => r1(total - units[i].seats) >= majority)) continue;
    out.push({ units: idx.map((i) => units[i]), seats: total, order: idx });
  }
  const size = (x: { units: Unit[] }) => x.units.reduce((a, u) => a + u.ids.length, 0);
  out.sort((a, b) => size(a) - size(b) || b.seats - a.seats || cmpOrder(a.order, b.order));
  return out.map(({ units, seats }) => ({ units, seats }));
}

function cmpOrder(a: number[], b: number[]) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

export function pathsTo61(poll: Poll, parties: Party[], rules: PledgeRule[], majority = MAJORITY): Path[] {
  return minimalWinning(unitsOf(poll, parties), majority).map(({ units, seats }) => {
    const ids = units.flatMap((u) => u.ids);
    const conflicts = pledgeConflicts(new Set(ids), parties, rules);
    return { ids, seats, conflicts, conflictIds: [...new Set(conflicts.flatMap((c) => c.ids))] };
  });
}

/**
 * Outside-support paths: for each path with pledge conflicts, the smallest move (fewest seats, then fewest
 * lists) of named lists from the cabinet to outside support that leaves the cabinet clear of every pledge
 * rule. The first vote then counts the same seats for, so it still reaches 61. A pledge not to join a cabinet
 * is not a promise of outside support; these are arithmetic, not forecasts.
 */
export function supportPaths(paths: Path[], parties: Party[], rules: PledgeRule[], poll: Poll): SupportPath[] {
  const seatsOf = (ids: string[]) => r1(ids.reduce((a, id) => a + (poll.results[id]?.seats ?? 0), 0));
  const seen = new Set<string>();
  const out: SupportPath[] = [];
  for (const p of paths) {
    if (!p.conflicts.length) continue;
    const named = p.conflictIds;
    const subsets: string[][] = [];
    for (let mask = 1; mask < 1 << named.length; mask++) subsets.push(named.filter((_, i) => mask & (1 << i)));
    subsets.sort((a, b) => seatsOf(a) - seatsOf(b) || a.length - b.length);
    for (const support of subsets) {
      const cabinet = p.ids.filter((id) => !support.includes(id));
      if (!cabinet.length || pledgeConflicts(new Set(cabinet), parties, rules).length) continue;
      const key = `${cabinet.join(",")}|${support.join(",")}`;
      if (!seen.has(key)) {
        seen.add(key);
        const order = (ids: string[]) => parties.map((x) => x.id).filter((id) => ids.includes(id));
        out.push({ cabinet: order(cabinet), support: order(support), cabinetSeats: seatsOf(cabinet), supportSeats: seatsOf(support), seats: p.seats });
      }
      break;
    }
  }
  return out.sort((a, b) => a.cabinet.length + a.support.length - (b.cabinet.length + b.support.length) || b.cabinetSeats - a.cabinetSeats || a.cabinet.join().localeCompare(b.cabinet.join()));
}
