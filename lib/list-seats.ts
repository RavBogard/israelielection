import type { SharedSeatContext } from "./election-lifecycle/types";
import { averagePoll, mainPolls, parties } from "./data";
import { average, blocTotals, seatFigure, seatText } from "./polls";
import type { BlocId } from "./types";

/**
 * One number per fact: a list's seats wherever the site prints them is its average scaled to 120
 * (`averagePoll`), one decimal, or "below" when it counts 0. The Party Map, profile, sparkline,
 * Compare, Coalition Builder, Polls and the menus all read from here.
 */
export type ListSeats = { seats: number; below: boolean; text: string | null; k: number; n: number; nearThreshold: boolean; passing: number | null };

export function listSeats(id: string, context?: SharedSeatContext | null): ListSeats {
  const r = averagePoll.results[id], a = average(id, mainPolls);
  if (context) { const seats = context.pointSeats[id] ?? 0; return { seats, below: seats === 0, text: String(seats), k: a?.k ?? 0, n: a?.n ?? 0, nearThreshold: context.seatStatus !== "official" && !!a?.nearThreshold, passing: a && a.k > 0 ? a.avg : null }; }
  return {
    seats: r && !r.belowThreshold ? r.seats : 0,
    below: !!r && (!!r.belowThreshold || r.seats === 0),
    text: seatText(averagePoll, id),
    k: a?.k ?? 0,
    n: a?.n ?? 0,
    nearThreshold: !!a?.nearThreshold,
    /** The unscaled mean over the polls where it passed, for "near the threshold" notes only. */
    passing: a && a.k > 0 ? a.avg : null,
  };
}

const totals = blocTotals(averagePoll, parties);
/** A bloc's seats in the average, as the home race adds them. */
export const blocSeats = (b: BlocId, context?: SharedSeatContext | null) => context ? parties.filter((party) => party.bloc === b).reduce((sum, party) => sum + (context.pointSeats[party.id] ?? 0), 0) : Math.round(totals[b] * 10) / 10;
export const blocText = (b: BlocId) => seatFigure(totals[b]);
