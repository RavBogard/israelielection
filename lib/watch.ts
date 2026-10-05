import { KNESSET } from "./coalition";
import { allocate, results, type Count, type ResultsConfig } from "./results";
import { seatsIn } from "./polls";
import type { Party, Poll } from "./types";

/** A list the count puts within reach of the threshold, either side. */
export type ThresholdWatch = {
  partyId: string;
  letters: string;
  votes: number;
  pct: number;
  /** Votes above (positive) or below (negative) the threshold. */
  margin: number;
  passing: boolean;
  /** Seats it holds now, or would hold if it just crossed. */
  seatsAtThreshold: number;
};

/** Lists within `band` of the threshold (as a share of valid votes, so 0.005 is half a point). */
export function thresholdWatch(count: Count, config: ResultsConfig, band = 0.005): ThresholdWatch[] {
  if (!count.valid) return [];
  const { lists, alloc } = results(count, config);
  const pairs = config.agreements
    .map((a) => a.parties.map((id) => Object.entries(config.letters).find(([, pid]) => pid === id)?.[0]))
    .filter((p): p is [string, string] => p.length === 2 && p.every(Boolean));
  return lists
    .filter((l) => l.partyId && Math.abs(l.pct - config.threshold) <= band)
    .map((l) => {
      const passing = l.votes >= alloc.thresholdVotes;
      let seatsAtThreshold = l.seats;
      if (!passing) {
        // Lift the list to the threshold, valid votes held constant, and re-run the allocation to see what crossing would be worth.
        const lifted = { ...count.votes, [l.letters]: Math.ceil(alloc.thresholdVotes) };
        seatsAtThreshold = allocate(lifted, count.valid, config.threshold, pairs).seats[l.letters] ?? 0;
      }
      return { partyId: l.partyId!, letters: l.letters, votes: l.votes, pct: l.pct, margin: l.votes - alloc.thresholdVotes, passing, seatsAtThreshold };
    })
    .sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin));
}

/** Seats a threshold share is worth, for the pre-count line ("about 4 seats"). */
export const thresholdSeats = (threshold: number) => Math.round(threshold * KNESSET);

/** Before the count: parties the poll puts near the threshold, by average seats, plus those below it everywhere. */
export function pollWatch(poll: Poll, parties: Party[], threshold: number, within = 1.5): { party: Party; seats: number | null }[] {
  const edge = threshold * KNESSET;
  return parties
    .filter((p) => p.coalitionCard !== "hidden")
    .map((p) => ({ party: p, seats: seatsIn(poll, p.id) }))
    .filter(({ party, seats }) => (seats !== null && seats > 0 && seats <= edge + within) || (seats === null && party.coalitionCard === "out") || seats === 0)
    .sort((a, b) => (a.seats ?? 0) - (b.seats ?? 0));
}
