import { average, averageAsPoll, blocTotals, currentPolls, isExit } from "./polls";
import type { BlocId, Party, Poll, PollsConfig } from "./types";

export type TrendPoint = { date: string; avg: number; n: number };

/**
 * The site's average as it stood on each poll date: the same "current polls" rule the
 * Coalition Builder and Party Map use, applied to the polls published up to that day.
 */
export function averageTrend(partyId: string, polls: Poll[], config: PollsConfig, from?: string): TrendPoint[] {
  const dates = [...new Set(polls.map((p) => p.published))].filter((d) => !from || d >= from).sort();
  const out: TrendPoint[] = [];
  for (const date of dates) {
    const main = currentPolls(polls.filter((p) => p.published <= date), config);
    const a = average(partyId, main);
    if (a) out.push({ date, avg: a.avg, n: a.n });
  }
  return out;
}

export type BlocPoint = { date: string; avg: Record<BlocId, number>; lo: Record<BlocId, number>; hi: Record<BlocId, number>; n: number };
const BLOC_IDS: BlocId[] = ["net", "opp", "mid", "arab"];

/**
 * Bloc totals over time: on each poll date, the bloc totals of the site average (each list's
 * average scaled to 120, as the Coalition Builder counts) and the lowest and highest bloc total
 * among the current polls that day. The low-high span is the range of the polls, not a confidence interval.
 */
export function blocTrend(polls: Poll[], parties: Party[], config: PollsConfig): BlocPoint[] {
  const campaign = polls.filter((p) => !isExit(p));
  const dates = [...new Set(campaign.map((p) => p.published))].sort();
  const ids = parties.map((p) => p.id);
  return dates.map((date) => {
    const main = currentPolls(campaign.filter((p) => p.published <= date), config);
    const avg = blocTotals(averageAsPoll(main, ids), parties);
    const each = main.map((p) => blocTotals(p, parties));
    const pick = (f: (xs: number[]) => number) => Object.fromEntries(BLOC_IDS.map((b) => [b, f(each.map((t) => t[b]))])) as Record<BlocId, number>;
    for (const b of BLOC_IDS) avg[b] = Math.round(avg[b] * 10) / 10;
    return { date, avg, lo: pick((xs) => Math.min(...xs)), hi: pick((xs) => Math.max(...xs)), n: main.length };
  });
}

/**
 * Each list's seats in the site average as it stood on each campaign poll date: `averageAsPoll` over
 * that day's current polls, so the last point is the figure printed everywhere else (one decimal,
 * scaled to 120). A list below or near the threshold that day is 0; a list no current poll reported
 * separately has no point that day.
 */
export function scaledTrends(polls: Poll[], partyIds: string[], config: PollsConfig): Map<string, TrendPoint[]> {
  const campaign = polls.filter((p) => !isExit(p));
  const out = new Map<string, TrendPoint[]>(partyIds.map((id) => [id, []]));
  for (const date of [...new Set(campaign.map((p) => p.published))].sort()) {
    const main = currentPolls(campaign.filter((p) => p.published <= date), config);
    const avg = averageAsPoll(main, partyIds);
    for (const id of partyIds) {
      const r = avg.results[id];
      if (r) out.get(id)!.push({ date, avg: r.belowThreshold ? 0 : r.seats, n: main.filter((p) => p.results[id]).length });
    }
  }
  return out;
}
