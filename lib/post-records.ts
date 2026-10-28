import resultsConfig from "@/data/results.json";
import type { SharedSeatContext } from "./election-lifecycle/types";
import { blocTotals, isExit } from "./polls";
import { contextToPoll } from "./seat-context";
import type { Party, Poll, PollsConfig } from "./types";

/**
 * Pure helpers for the post-count record pages: the profile's "result against polls" line, the candidate marks,
 * surplus-pair status and the pollster accuracy table. Nothing here invents a figure: every number is read from the
 * saved polls, the shared seat context (count so far, or official) or data/outgoing-seats.json.
 */

/** Each pollster's latest campaign poll (exit polls never count), split into the main set and the pollsters kept apart. */
export function finalPolls(polls: Poll[], config: Pick<PollsConfig, "withoutVariant">): { main: Poll[]; apart: Poll[] } {
  const latest = new Map<string, Poll>();
  for (const p of polls) {
    if (isExit(p)) continue;
    const old = latest.get(p.pollster);
    if (!old || p.published > old.published) latest.set(p.pollster, p);
  }
  const all = [...latest.values()].sort((a, b) => a.pollster.localeCompare(b.pollster));
  const apart = new Set(config.withoutVariant.pollsters);
  return { main: all.filter((p) => !apart.has(p.pollster)), apart: all.filter((p) => apart.has(p.pollster)) };
}

export type SeatRange = { lo: number; hi: number; n: number };

/** The lowest and highest seats a list had in these polls (0 where a poll had it below the threshold); null when none reported it. */
export function seatRange(partyId: string, polls: Poll[]): SeatRange | null {
  const seats = polls.flatMap((p) => { const r = p.results[partyId]; return r ? [r.belowThreshold ? 0 : r.seats] : []; });
  return seats.length ? { lo: Math.min(...seats), hi: Math.max(...seats), n: seats.length } : null;
}

/** "26 to 27", or "27" when the two agree. */
export const rangeText = (r: { lo: number; hi: number }, to: string): string => (r.lo === r.hi ? String(r.lo) : `${r.lo}${to}${r.hi}`);

export type CandidateMark = "onTrack" | "elected" | "notElected" | null;

/**
 * A listed name's standing on the count: "on track" while the count is provisional, "elected" or "not elected" once it is official.
 * Only a numbered slot can be marked. A list with no seats gets no "on track" mark, ever.
 */
export function candidateMark(slot: string, seats: number, seatStatus: SharedSeatContext["seatStatus"]): CandidateMark {
  if (!/^\d+$/.test(slot)) return null;
  const position = Number(slot);
  if (seatStatus === "official") return position <= seats ? "elected" : "notElected";
  if (seats <= 0) return null;
  return position <= seats ? "onTrack" : null;
}

export type SurplusStatus = { partnerId: string; partnerName: string; both: boolean; official: boolean };

/** The surplus-vote agreement the list signed, and whether both lists are on course to pass (or did pass, once official). */
export function surplusStatus(id: string, parties: Pick<Party, "id" | "name">[], context: SharedSeatContext): SurplusStatus | null {
  const pair = (resultsConfig.agreements as { parties: string[] }[]).find((a) => a.parties.length === 2 && a.parties.includes(id));
  if (!pair) return null;
  const partnerId = pair.parties.find((x) => x !== id)!;
  const both = (context.pointSeats[id] ?? 0) > 0 && (context.pointSeats[partnerId] ?? 0) > 0;
  return { partnerId, partnerName: parties.find((p) => p.id === partnerId)?.name ?? partnerId, both, official: context.seatStatus === "official" };
}

export type PollsterAccuracy = {
  pollster: string;
  published: string;
  /** Lists the poll reported separately, the denominator of the mean error. */
  lists: number;
  /** Mean absolute difference, in seats, between the poll and the count projection, over those lists. */
  mae: number;
  /** Absolute difference in a bloc's total, in seats. */
  bloc: Record<"net" | "opp", number>;
  apart: boolean;
};

/**
 * Each pollster's final poll against the count projection: the mean absolute seat error over the lists it reported
 * separately (a list below the threshold counts 0), and the error of each contender bloc's total. Sorted by mean error.
 * Provisional while the context is: it follows the count and swaps to the official allocation by itself.
 */
export function pollsterAccuracy(polls: Poll[], parties: Party[], context: SharedSeatContext, config: Pick<PollsConfig, "withoutVariant">): PollsterAccuracy[] {
  const { main, apart } = finalPolls(polls, config);
  const truth = blocTotals(contextToPoll(context), parties);
  const known = new Set(parties.map((p) => p.id));
  const row = (p: Poll, isApart: boolean): PollsterAccuracy => {
    const errs = Object.entries(p.results).filter(([id]) => known.has(id)).map(([id, r]) => Math.abs((r.belowThreshold ? 0 : r.seats) - (context.pointSeats[id] ?? 0)));
    const t = blocTotals(p, parties);
    return {
      pollster: p.pollster,
      published: p.published,
      lists: errs.length,
      mae: errs.length ? Math.round((errs.reduce((a, b) => a + b, 0) / errs.length) * 10) / 10 : 0,
      bloc: { net: Math.abs(t.net - truth.net), opp: Math.abs(t.opp - truth.opp) },
      apart: isApart,
    };
  };
  return [...main.map((p) => row(p, false)), ...apart.map((p) => row(p, true))].sort((a, b) => Number(a.apart) - Number(b.apart) || a.mae - b.mae || a.pollster.localeCompare(b.pollster));
}

/** The count projection's bloc totals for the two contenders, for the polls page's reference line. */
export function countBlocTotals(context: SharedSeatContext, parties: Party[]): { net: number; opp: number } {
  const t = blocTotals(contextToPoll(context), parties);
  return { net: t.net, opp: t.opp };
}
