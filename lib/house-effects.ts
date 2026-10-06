import { blocTotals, isExit } from "./polls";
import { blocTrend } from "./trend";
import type { BlocId, Party, Poll, PollsConfig } from "./types";

export type HouseEffect = { pollster: string; n: number; gap: Record<"net" | "opp", number>; polls: { poll: Poll; gap: Record<"net" | "opp", number> }[] };

/**
 * Each pollster's average gap from the site average: for every campaign poll, its own bloc total
 * minus the site's bloc average on its publication date (an average that includes that poll), then
 * the plain mean of those gaps over the pollster's polls. Positive means the pollster has shown the
 * bloc more seats than the site average did that day. Sorted by the Netanyahu-bloc gap, largest first.
 */
export function houseEffects(polls: Poll[], parties: Party[], config: PollsConfig): HouseEffect[] {
  const trend = new Map(blocTrend(polls, parties, config).map((t) => [t.date, t.avg]));
  const by = new Map<string, HouseEffect["polls"]>();
  for (const poll of polls) {
    if (isExit(poll)) continue;
    const avg = trend.get(poll.published);
    if (!avg) continue;
    const t = blocTotals(poll, parties);
    const gap = (b: BlocId) => t[b] - avg[b];
    by.set(poll.pollster, [...(by.get(poll.pollster) ?? []), { poll, gap: { net: gap("net"), opp: gap("opp") } }]);
  }
  const mean = (xs: number[]) => Math.round((xs.reduce((a, x) => a + x, 0) / xs.length) * 10) / 10;
  return [...by].map(([pollster, rows]) => ({ pollster, n: rows.length, gap: { net: mean(rows.map((r) => r.gap.net)), opp: mean(rows.map((r) => r.gap.opp)) }, polls: rows }))
    .sort((a, b) => b.gap.net - a.gap.net || a.pollster.localeCompare(b.pollster));
}
