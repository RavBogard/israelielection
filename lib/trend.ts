import { average, currentPolls } from "./polls";
import type { Poll, PollsConfig } from "./types";

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
