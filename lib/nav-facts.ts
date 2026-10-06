import { shortDate } from "./format";
import { seatFigure } from "./polls";

export type NavFactInput = { newestPoll?: string; newestBriefing?: string; netSeats: number; localities: number; elections: readonly string[] };

/** One live line per menu group, computed from the site's data; a group with nothing to report gets no line. */
export function navFacts(i: NavFactInput): Record<string, string> {
  const out: Record<string, string> = {};
  const dated = [i.newestPoll && `newest poll ${shortDate(i.newestPoll)}`, i.newestBriefing && `briefing ${shortDate(i.newestBriefing)}`].filter(Boolean).join(", ");
  if (dated) out.polls = dated[0].toUpperCase() + dated.slice(1);
  if (Number.isFinite(i.netSeats) && i.netSeats > 0) out.parties = `Netanyahu bloc ${seatFigure(i.netSeats)} of 120, polling average`;
  if (i.localities > 0) out.places = `${i.localities.toLocaleString("en-US")} localities in the 2022 count`;
  const years = i.elections.map((d) => d.slice(0, 4)).sort();
  if (years.length > 1) out.how = `${years.length} elections from ${years[0]} to ${years.at(-1)}`;
  return out;
}

/** Cut at a word boundary, with an ellipsis, for one-line captions. */
export const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/[\s,;:]+\S*$/, "")}…`);
