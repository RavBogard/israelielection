import { locale, type Lang } from "./i18n";
import { EXIT_LINE } from "./i18n/exit-line";
import { EXIT_CHANNELS, exitRows } from "./results-phase";
import { blocTotals } from "./polls";
import type { BlocId, Party, Poll } from "./types";

export type ExitRange = { bloc: BlocId; min: number; max: number };
export type ExitLine = { ranges: ExitRange[]; sources: { pollster: string; seats: Record<BlocId, number> }[] };

/**
 * The exit-poll bloc line: each bloc's seat range across the latest version of each broadcaster's exit poll
 * (Channel 12, Channel 13, Kan 11). Channel 14 and i24NEWS (`excluded`) never enter it. Null with no exit poll.
 * The Between-the-blocs row is kept only if some broadcaster gave it seats.
 */
export function exitBlocLine(polls: Poll[], parties: Party[], excluded: readonly string[]): ExitLine | null {
  const sources = exitRows(polls.filter((p) => !excluded.includes(p.pollster)))
    .filter((r) => EXIT_CHANNELS.includes(r.pollster) && r.poll)
    .map((r) => ({ pollster: r.pollster, seats: blocTotals(r.poll!, parties) }));
  if (!sources.length) return null;
  const ranges = (["net", "opp", "mid", "arab"] as BlocId[]).map((bloc) => {
    const v = sources.map((s) => s.seats[bloc]);
    return { bloc, min: Math.min(...v), max: Math.max(...v) };
  }).filter((r) => r.bloc !== "mid" || r.max > 0);
  return { ranges, sources };
}

/** "50" or "52–53". */
export const rangeText = (r: { min: number; max: number }) => (r.min === r.max ? String(r.min) : `${r.min}–${r.max}`);

/**
 * A time on a share image: Israel time, labelled. The image is drawn once for every reader and cached, so it
 * cannot carry anyone's local time; the page itself shows both.
 */
export function israelTimeLabel(iso: string | null, lang: Lang, fallback: string): string {
  if (!iso) return fallback;
  if (!iso.includes("T")) return iso;
  const at = new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
  return `${at} ${EXIT_LINE[lang].israelTime}`;
}
