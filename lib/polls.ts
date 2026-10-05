import type { BlocId, Party, Poll } from "./types";

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
