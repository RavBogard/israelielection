import { seatTenths } from "./home-race";
import { averageAsPoll, blocTotals, byNewest, currentPolls, isExit } from "./polls";
import type { BlocId, Party, Poll, PollsConfig } from "./types";

const DAY = 86_400_000;
export type BlocPoint = { date: string; seats: Record<BlocId, number> };
export type BlocChange = { since: string; points: BlocPoint[]; delta: Record<BlocId, number> };

/** The home average's bloc totals as they stood on each poll date: the same current-polls rule and 120 scaling, in tenths. */
export function blocSeries(polls: Poll[], parties: Party[], config: PollsConfig): BlocPoint[] {
  const ids = parties.map((p) => p.id), campaign = polls.filter((p) => !isExit(p));
  const dates = [...new Set(campaign.map((p) => p.published))].sort();
  return dates.map((date) => {
    const t = blocTotals(averageAsPoll(currentPolls(campaign.filter((p) => p.published <= date), config), ids), parties);
    return { date, seats: { net: seatTenths(t.net), opp: seatTenths(t.opp), mid: seatTenths(t.mid), arab: seatTenths(t.arab) } };
  });
}

/**
 * The change since the average as it stood `days` before the newest poll date: the base is the last poll date on or
 * before that day, so the "since" date is always a real date in the series. Null when the series is not that long.
 */
export function blocChange(series: BlocPoint[], days = 7): BlocChange | null {
  const last = series.at(-1);
  if (!last) return null;
  const cut = Date.parse(last.date) - days * DAY;
  const i = series.findLastIndex((p) => Date.parse(p.date) <= cut);
  if (i < 0) return null;
  const base = series[i];
  const delta = Object.fromEntries((Object.keys(last.seats) as BlocId[]).map((b) => [b, seatTenths(last.seats[b] - base.seats[b])])) as Record<BlocId, number>;
  return { since: base.date, points: series.slice(i), delta };
}

/** "+0.8", "−1.2" (a true minus sign) or "No change". */
export const signedSeats = (d: number) => (d === 0 ? "No change" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}`);

/** The newest campaign poll (exit polls excluded). */
export const newestPoll = (polls: Poll[]) => polls.filter((p) => !isExit(p)).sort(byNewest)[0] ?? null;

/** Sparkline path for one bloc over the window, in a w×h box; the y range is shared so equal moves look equal. */
export function sparkPath(points: BlocPoint[], bloc: BlocId, w: number, h: number, range: number): string {
  if (points.length < 2) return "";
  const t0 = Date.parse(points[0].date), t1 = Date.parse(points.at(-1)!.date);
  const vs = points.map((p) => p.seats[bloc]), mid = (Math.max(...vs) + Math.min(...vs)) / 2, half = Math.max(range, 0.5) / 2;
  return points
    .map((p, i) => `${i ? "L" : "M"}${(((Date.parse(p.date) - t0) / Math.max(1, t1 - t0)) * w).toFixed(1)},${((1 - (p.seats[bloc] - mid + half) / (2 * half)) * h).toFixed(1)}`)
    .join("");
}

/** The largest single-bloc spread in the window, so every sparkline shares one seat scale. */
export const sparkRange = (points: BlocPoint[]) =>
  Math.max(...(["net", "opp", "mid", "arab"] as BlocId[]).map((b) => { const vs = points.map((p) => p.seats[b]); return Math.max(...vs) - Math.min(...vs); }));
