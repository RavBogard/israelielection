import type { CountSummary } from "@/app/api/count/route";
import { shortDate } from "./format";
import { blocTotals, seatFigure } from "./polls";
import { exitRows } from "./results-phase";
import type { BlocId, Party, Poll } from "./types";

export type NavFactInput = { newestPoll?: string; newestBriefing?: string };

/** A live line under a menu group, only where it changes: Polls and news carries the newest poll and briefing dates. */
export function navFacts(i: NavFactInput): Record<string, string> {
  const out: Record<string, string> = {};
  const dated = [i.newestPoll && `poll ${shortDate(i.newestPoll)}`, i.newestBriefing && `briefing ${shortDate(i.newestBriefing)}`].filter(Boolean).join(", ");
  if (dated) out.polls = dated[0].toUpperCase() + dated.slice(1);
  return out;
}

/** The masthead's seat meter: a figure, the words after it, the bloc seats for the bar, and where it links. */
export type Meter = { href: string; value: string | null; text: string; seats: Record<BlocId, number> | null; hatch?: boolean };
export type ExitMeter = { pollster: string; seats: Record<BlocId, number> };

/** Before close: the Netanyahu bloc in the average, dated by the newest poll in it. */
export const averageMeter = (seats: Record<BlocId, number>, date: string): Meter => ({ href: "/polls", value: seatFigure(seats.net), text: `Netanyahu bloc, average ${shortDate(date)}`, seats });

/** The first channel's exit poll on the night (Kan 11, then Channel 12, then Channel 13), as bloc seats. */
export function firstExit(polls: Poll[], parties: Party[]): ExitMeter | null {
  const row = exitRows(polls).find((r) => r.poll);
  return row?.poll ? { pollster: row.pollster, seats: blocTotals(row.poll, parties) } : null;
}

/**
 * After close the meter follows the night, in the strip's words: an exit poll (or "Polls have closed" until
 * one is entered), then the early count, then the count. Null before close, when the average stands.
 */
export function nightMeter(closed: boolean, summary: CountSummary | null, exit: ExitMeter | null): Meter | null {
  if (!closed) return null;
  if (summary?.state === "open") {
    const seats = Object.fromEntries(summary.blocs.map((b) => [b.id, b.seats])) as Record<BlocId, number>;
    const what = summary.freshness === "stale" ? "saved count (stale)" : summary.phase === "early" ? "early count" : "count so far";
    return { href: "/results", value: String(seats.net ?? 0), text: `Netanyahu bloc, ${what}`, seats, hatch: summary.phase === "early" };
  }
  if (exit) return { href: "/results", value: String(exit.seats.net), text: `Netanyahu bloc, ${exit.pollster} exit poll`, seats: exit.seats };
  return { href: "/results", value: null, text: "Polls have closed", seats: null };
}

/** Cut at a word boundary, with an ellipsis, for one-line captions. */
export const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/[\s,;:]+\S*$/, "")}…`);
