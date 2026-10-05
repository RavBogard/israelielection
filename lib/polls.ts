import type { BlocId, Party, Poll, PollsConfig } from "./types";

const DAY = 86_400_000;

/** Newest first; ties broken by pollster name so the order is stable. */
export function byNewest(a: Poll, b: Poll): number {
  return b.published.localeCompare(a.published) || a.pollster.localeCompare(b.pollster);
}

/**
 * The polls the site treats as "now": each pollster's latest poll, if published within
 * `currentWindowDays` of the newest poll overall. `main` feeds averages and the Coalition
 * Builder; `reference` holds excluded pollsters (Channel 14), shown but not averaged.
 */
export function currentPolls(polls: Poll[], config: PollsConfig): { main: Poll[]; reference: Poll[] } {
  const sorted = [...polls].sort(byNewest);
  if (!sorted.length) return { main: [], reference: [] };
  const cutoff = Date.parse(sorted[0].published) - config.currentWindowDays * DAY;
  const seen = new Set<string>();
  const main: Poll[] = [];
  const reference: Poll[] = [];
  for (const p of sorted) {
    if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue;
    seen.add(p.pollster);
    (config.excludedFromAverage.includes(p.pollster) ? reference : main).push(p);
  }
  return { main, reference };
}

export function pollLabel(p: Poll): string {
  return p.firm ? `${p.pollster} / ${p.firm}` : p.pollster;
}

/** Seats for a party in a poll, or null when the poll did not report it separately. */
export function seatsIn(poll: Poll, partyId: string): number | null {
  const r = poll.results[partyId];
  return r ? r.seats : null;
}

export type Average = { avg: number; n: number };

/** Mean seats across the polls that reported the party; null if none did. */
export function average(partyId: string, polls: Poll[]): Average | null {
  const vals = polls.map((p) => seatsIn(p, partyId)).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}

/** Seats by bloc in one poll, including seats reported only for a group of same-bloc parties. */
export function blocTotals(poll: Poll, parties: Party[]): Record<BlocId, number> {
  const t: Record<BlocId, number> = { net: 0, opp: 0, mid: 0, arab: 0 };
  const bloc = new Map(parties.map((p) => [p.id, p.bloc]));
  for (const [id, r] of Object.entries(poll.results)) {
    const b = bloc.get(id);
    if (b) t[b] += r.seats;
  }
  for (const c of poll.combined) {
    const b = bloc.get(c.parties[0]);
    if (b && c.parties.every((id) => bloc.get(id) === b)) t[b] += c.seats;
  }
  return t;
}

/** Total seats a poll accounts for (should be 120). */
export function pollTotal(poll: Poll): number {
  return (
    Object.values(poll.results).reduce((a, r) => a + r.seats, 0) +
    poll.combined.reduce((a, c) => a + c.seats, 0)
  );
}

export const AVERAGE_ID = "avg";

/**
 * The current average expressed as a pseudo-poll, so the Coalition Builder can count with it.
 * Seats are each party's mean across `polls`, to one decimal; a party every poll put below the
 * threshold is marked below.
 */
export function averageAsPoll(polls: Poll[], partyIds: string[]): Poll {
  const results: Poll["results"] = {};
  for (const id of partyIds) {
    const a = average(id, polls);
    if (!a) continue;
    const seats = Math.round(a.avg * 10) / 10;
    results[id] = seats === 0 ? { seats: 0, belowThreshold: true } : { seats };
  }
  return {
    id: AVERAGE_ID,
    pollster: "Average",
    firm: null,
    fieldwork: null,
    published: [...polls].sort(byNewest)[0]?.published ?? "",
    via: null,
    url: null,
    n: null,
    margin: null,
    note: `Mean of ${polls.length} polls: ${polls.map((p) => p.pollster).join(", ")}.`,
    results,
    combined: [],
  };
}
