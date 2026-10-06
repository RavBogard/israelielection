import directory from "@/data/ballot-directory.json";

export type BallotList = { id: string; name: string; letters: string; hebrew: string; source: string; leader: string | null; profile: string | null };
/** The original official Hebrew row stays alongside the editorial English name. */
export const ballotLists: BallotList[] = directory.lists.map(([id, name, letters, hebrew, record, leader, profile]) => ({
  id: id!, name: name!, letters: letters!, hebrew: hebrew!, source: `https://www.gov.il/he/pages/${record}`, leader, profile,
}));
export function filterBallot(lists: BallotList[], query: string, coverage: "all" | "profiled" | "other" = "all") {
  const q = query.normalize("NFKC").trim().toLocaleLowerCase();
  return lists.filter(l => (coverage === "all" || (coverage === "profiled" ? !!l.profile : !l.profile)) &&
    [l.name, l.hebrew, l.letters, l.leader ?? ""].some(value => value.normalize("NFKC").toLocaleLowerCase().includes(q)));
}
export type SlipOrder = "roster" | "polled";
/** Roster order as published, or the lists that win seats first (most seats first), the rest after them in roster order. */
export function orderSlips(lists: BallotList[], seats: (l: BallotList) => number, order: SlipOrder): BallotList[] {
  if (order === "roster") return lists;
  return lists.map((l, i) => ({ l, i, s: seats(l) })).sort((a, b) => b.s - a.s || a.i - b.i).map(({ l }) => l);
}
