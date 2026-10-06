/**
 * The timeline, 1977–2026: Knesset elections, prime ministers and events from
 * data/timeline.json. Positions on the timeline are whole months since January 1977,
 * so the scrubber moves a month at a time.
 */

export type Source = { name: string; date: string; url: string };

export type Election = {
  date: string;
  knesset: number;
  first: { list: string; seats: number };
  second: { list: string; seats: number };
  turnout?: number;
  outcome: string;
  source: Source;
  /** Where the outcome comes from, when the results source does not say who formed the government. */
  outcomeSource?: Source;
};

export type Government = { pm: string; party: string; from: string; to: string; source: Source };

export type EventKind = "war" | "peace" | "politics" | "law" | "society";
export type TimelineEvent = { date: string; title: string; text: string; kind: EventKind; source: Source };

export type Timeline = { checked: string; elections: Election[]; governments: Government[]; events: TimelineEvent[] };

export const START_YEAR = 1977;

/** Months since January 1977 for an ISO date (the day is dropped). */
export function monthOf(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return (y - START_YEAR) * 12 + (m - 1);
}

/** The year and month name of a month index. */
export function labelOf(month: number): { year: number; month: string } {
  const year = START_YEAR + Math.floor(month / 12);
  const month0 = ((month % 12) + 12) % 12;
  return { year, month: MONTHS[month0] };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "May 17, 1977" for an ISO date. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** The government in office during a month: the last one sworn in at or before it. */
export function governmentAt(gs: Government[], month: number): Government | undefined {
  let found: Government | undefined;
  for (const g of gs) if (monthOf(g.from) <= month) found = g;
  return found;
}

/** The most recent Knesset election at or before a month. */
export function electionAt(es: Election[], month: number): Election | undefined {
  let found: Election | undefined;
  for (const e of es) if (monthOf(e.date) <= month) found = e;
  return found;
}

/** The index of the most recent event at or before a month, or -1 before the first. */
export function eventAt(evs: TimelineEvent[], month: number): number {
  let i = -1;
  evs.forEach((e, j) => {
    if (monthOf(e.date) <= month) i = j;
  });
  return i;
}

/** "1970s", "1980s", … for a date. */
export const decadeOf = (iso: string) => `${Math.floor(Number(iso.slice(0, 4)) / 10) * 10}s`;

/**
 * Lanes for marks along a track so none overlap: each mark (positions 0–1, in order) takes the lowest
 * lane whose last mark is at least `gap` (a share of the track) behind it.
 */
export function stackLanes(ats: number[], gap: number): number[] {
  const last: number[] = [];
  return ats.map((a) => {
    let lane = last.findIndex((x) => a - x >= gap - 1e-9);
    if (lane < 0) lane = last.push(a) - 1;
    else last[lane] = a;
    return lane;
  });
}
