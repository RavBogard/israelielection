/** Home "Since yesterday": the newest polls as slips, one computed finding, and the hero's citation. */
import { MAJORITY } from "./coalition";
import { longDate, shortDate } from "./format";
import { BLOC_SEAT_ORDER, blocTotals, byNewest, isExit, pollLabel, seatFigure } from "./polls";
import type { BlocId, Party, Poll } from "./types";

type Bloc = { id: BlocId; label: string };
const DAY = 86_400_000;

/** A date as YYYY-MM-DD on the Israeli calendar. */
export const israelDate = (at: Date | number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(at);
const minusDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) - n * DAY).toISOString().slice(0, 10);

/**
 * Polls carry a publication date, not a time, so "the last 48 hours" is today and yesterday in Israel.
 * With none in that window, the newest campaign poll stands in and `fresh` is false.
 */
export function sincePolls(polls: Poll[], today: string): { polls: Poll[]; fresh: boolean; since: string } {
  const campaign = polls.filter((p) => !isExit(p) && p.published <= today).sort(byNewest);
  const since = minusDays(today, 1);
  const recent = campaign.filter((p) => p.published >= since);
  return recent.length ? { polls: recent, fresh: true, since } : { polls: campaign.slice(0, 1), fresh: false, since };
}

export type Slip = { id: string; label: string; date: string; url: string | null; blocs: { id: BlocId; label: string; seats: number; majority: boolean }[]; majority: BlocId[] };
export function pollSlip(poll: Poll, parties: Party[], blocs: Bloc[]): Slip {
  const t = blocTotals(poll, parties);
  const rows = BLOC_SEAT_ORDER.map((id) => ({ id, label: blocs.find((b) => b.id === id)?.label ?? id, seats: t[id], majority: t[id] >= MAJORITY }));
  return { id: poll.id, label: pollLabel(poll), date: poll.published, url: poll.url && /^https?:\/\//i.test(poll.url) ? poll.url : null, blocs: rows, majority: rows.filter((r) => r.majority).map((r) => r.id) };
}

/** Seats reported only for a group of lists from different blocs: they belong to no bloc's total. */
const crossBloc = (poll: Poll, parties: Party[]) => {
  const bloc = new Map(parties.map((p) => [p.id, p.bloc]));
  return poll.combined.filter((c) => new Set(c.parties.map((id) => bloc.get(id))).size > 1).reduce((n, c) => n + c.seats, 0);
};
const names = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const pollWord = (n: number) => (n === 1 ? "poll" : "polls");

/**
 * One sentence on the current polls and the 61 line, from their bloc totals. A poll whose cross-bloc
 * combined seats could carry a bloc over 61 is neither short nor over, and is set aside by name.
 */
export function findingSentence(polls: Poll[], parties: Party[], blocs: Bloc[], id: BlocId = "net"): string | null {
  if (!polls.length) return null;
  const label = blocs.find((b) => b.id === id)?.label ?? id;
  const over: string[] = [], unclear: string[] = [];
  let short = 0;
  for (const p of polls) {
    const seats = blocTotals(p, parties)[id];
    if (seats >= MAJORITY) over.push(p.pollster);
    else if (seats + crossBloc(p, parties) >= MAJORITY) unclear.push(p.pollster);
    else short++;
  }
  const n = polls.length - unclear.length;
  const all = n === 1 ? "the one current poll" : n === 2 ? "both current polls" : `all ${n} current polls`;
  let s: string;
  if (!n) s = `No current poll separates the ${label} clearly enough to compare with ${MAJORITY}`;
  else if (!over.length) s = `The ${label} is short of ${MAJORITY} in ${all}`;
  else if (!short) s = `The ${label} has ${MAJORITY} or more in ${all}`;
  else s = `The ${label} is short of ${MAJORITY} in ${short} of ${n} current ${pollWord(n)}; ${over.length === 1 ? "only " : ""}${names(over)} ${over.length === 1 ? "has" : "have"} it at ${MAJORITY} or more`;
  if (unclear.length && n) s += `. ${names(unclear)} ${unclear.length === 1 ? "reports" : "report"} lists from different blocs together and ${unclear.length === 1 ? "is" : "are"} left out`;
  return `${s}.`;
}

/** The hero's citation: the average, its date, the bloc figure and the poll count. */
export function citeText(average: Poll, count: number, blocLabel: string, seats: number, site = "israelielection.org/polls"): string {
  return `Israel Votes 2026 polling average, ${longDate(average.published)}: ${blocLabel} ${seatFigure(seats)} of 120 seats (${count} ${pollWord(count)}). ${site}`;
}

/** "No new polls since Oct 5", dated by the newest poll. */
export const noNewLabel = (newest: Poll | undefined) => (newest ? `No new polls since ${shortDate(newest.published)}` : "No polls yet");
