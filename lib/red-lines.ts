import { MAJORITY, pledgeConflicts } from "./coalition";
import type { BlocId, Party, PledgeRule } from "./types";

/**
 * Arithmetic for the Coalition Builder's "Red lines in play" panel: what each bloc needs to reach 61 on the
 * seats in view, and, for every smallest combination of blocs that reaches 61, the recorded pledges that stand
 * in the way. Never odds: the pledges are read from data/pledge-rules.json exactly as the builder's warnings are.
 */
export type BlocNeed = { bloc: BlocId; seats: number; gap: number };
export type RedLineCombo = { blocs: BlocId[]; parts: { bloc: BlocId; seats: number }[]; total: number; blockedBy: string[] };
export type RedLines = { needs: BlocNeed[]; combos: RedLineCombo[] };

/** A roll-up of the three individual "no Arab parties" pledges; listing it beside them would count one pledge twice. */
const ROLLUP_RULES = new Set(["zionist-opp-no-arab-parties"]);
const BLOC_ORDER: BlocId[] = ["net", "opp", "mid", "arab"];
const round1 = (n: number) => Math.round(n * 10) / 10;

export function redLines(seatsOf: (partyId: string) => number, parties: Party[], rules: PledgeRule[]): RedLines {
  const seated = parties.filter((p) => seatsOf(p.id) > 0);
  const seats = (b: BlocId) => round1(seated.filter((p) => p.bloc === b).reduce((n, p) => n + seatsOf(p.id), 0));
  const blocs = BLOC_ORDER.filter((b) => seats(b) > 0);
  const needs = blocs.map((bloc) => ({ bloc, seats: seats(bloc), gap: Math.max(0, round1(MAJORITY - seats(bloc))) }));
  const pledges = rules.filter((r) => r.kind === "pledge" && !ROLLUP_RULES.has(r.id));
  const reaches = (subset: BlocId[]) => round1(subset.reduce((n, b) => n + seats(b), 0)) >= MAJORITY;
  const subsets: BlocId[][] = [];
  for (let mask = 1; mask < 1 << blocs.length; mask++) subsets.push(blocs.filter((_, i) => mask & (1 << i)));
  const combos = subsets
    .filter(reaches)
    // Smallest first: a combination that only reaches 61 because a bloc it already clears 61 without is not listed.
    .filter((s) => !s.some((b) => reaches(s.filter((x) => x !== b))))
    .map((blocsIn) => {
      const chosen = new Set(seated.filter((p) => blocsIn.includes(p.bloc)).map((p) => p.id));
      const blockedBy = pledgeConflicts(chosen, parties, pledges).map((c) => c.warning.id);
      return { blocs: blocsIn, parts: blocsIn.map((bloc) => ({ bloc, seats: seats(bloc) })), total: round1(blocsIn.reduce((n, b) => n + seats(b), 0)), blockedBy };
    })
    .sort((a, b) => a.blocs.length - b.blocs.length || b.total - a.total);
  return { needs, combos };
}
