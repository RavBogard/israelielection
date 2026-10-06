/**
 * Election night as phases, one model for /results, the home hero and the masthead strip.
 * before: until polls close. exit: closed, the channels' exit polls, no usable count yet.
 * early: a count holding under EARLY_SHARE of the voter roll. count: past that.
 */
import { shortDate } from "./format";
import type { Lang } from "./i18n";
import { plural } from "./i18n/he-grammar";
import type { Count, ResultsConfig } from "./results";
import type { Poll } from "./types";

export type Phase = "before" | "exit" | "early" | "count";
/** closed: before close. waiting: no usable figures yet, within WAIT_HOURS of close. error: unreachable, or still nothing after the window. test: the dev fixture. */
export type NightStatus = "closed" | "waiting" | "error" | "fresh" | "stale" | "test";
export type ErrorReason = "unreachable" | "unusable";
export type LiveLike =
  | { state: "closed" }
  | { state: "error"; fetchedAt: string; reason?: ErrorReason }
  | { state: "open"; count: Count; freshness: "fresh" | "stale"; fixture?: boolean };

export const PHASES = [
  { id: "exit", label: "Exit polls 22:00" },
  { id: "early", label: "Early count" },
  { id: "count", label: "The count" },
] as const;
/** The phase labels in Hebrew (STYLE.md: מדגמי הערוצים at 22:00, then תוצאות אמת). Same ids and order as PHASES. */
export const PHASES_HE = [
  { id: "exit", label: "מדגמי הערוצים 22:00" },
  { id: "early", label: "תוצאות אמת ראשונות" },
  { id: "count", label: "ספירת הקולות" },
] as const;
/** The phase labels in the given edition. */
export const phases = (lang: Lang = "en") => (lang === "he" ? PHASES_HE : PHASES);

/** The committee's 2022 roll, 6,788,804 eligible in 1,215 localities (lib/fixtures/cec-2022-expc.csv): the denominator until the 2026 roll is published. */
export const PRIOR_ROLL = { eligible: 6_788_804, localities: 1_215, label: "the 2022 roll" };
/** PRIOR_ROLL.label in the given edition. */
export const priorRollLabel = (lang: Lang = "en") => (lang === "he" ? "פנקס הבוחרים של 2022" : PRIOR_ROLL.label);
/** A count is early while its localities hold under a tenth of the roll: too few places to read seats from. */
export const EARLY_SHARE = 0.1;
/** Until 02:00 Israel time (four hours after close) a file with no usable figures means waiting, not failure. */
export const WAIT_HOURS = 4;
/** The channels whose exit polls air at close (Ynet, Nov 1, 2022), by their pollster names in data/polls.json. */
export const EXIT_CHANNELS = ["Kan 11", "Channel 12", "Channel 13"];

export type Counted = { share: number; basis: "roll" | "prior" };
/** Eligible voters in the counted localities over the 2026 roll, or the 2022 roll until it is published. */
export function countedShare(count: Count | null, roll?: { eligible: number }): Counted | null {
  if (!count) return null;
  const basis = roll?.eligible ? "roll" : "prior";
  return { share: Math.min(1, count.eligible / (roll?.eligible || PRIOR_ROLL.eligible)), basis };
}

export type Night = { phase: Phase; status: NightStatus; counted: Counted | null; reason?: ErrorReason };
export function night(live: LiveLike, config: ResultsConfig, now: number): Night {
  if (live.state === "closed") return { phase: "before", status: "closed", counted: null };
  if (live.state === "error") {
    const reason = live.reason ?? "unreachable";
    const waiting = reason === "unusable" && now < Date.parse(config.pollsClose) + WAIT_HOURS * 3_600_000;
    return { phase: "exit", status: waiting ? "waiting" : "error", counted: null, reason };
  }
  const counted = countedShare(live.count, config.roll)!;
  return { phase: counted.share < EARLY_SHARE ? "early" : "count", status: live.fixture ? "test" : live.freshness, counted };
}

/** The page's sections in order: exit polls lead until the count is past early, then follow the board. */
export type Section = "exit" | "board" | "freshness" | "changes" | "threshold" | "pollWatch" | "watch" | "exitTable" | "letters" | "method";
export function sections(phase: Phase): Section[] {
  if (phase === "before") return ["board", "pollWatch", "watch", "exitTable", "letters", "method"];
  if (phase === "exit") return ["exit", "board", "exitTable", "pollWatch", "watch", "letters", "method"];
  if (phase === "early") return ["exit", "board", "freshness", "changes", "threshold", "exitTable", "method"];
  return ["board", "freshness", "changes", "threshold", "exit", "exitTable", "method"];
}

/** Home: the exit polls lead until the count is past early; the pre-election average only before close. */
export const homeHero = (phase: Phase): "average" | "exit" | "count" => (phase === "before" ? "average" : phase === "count" ? "count" : "exit");
export function headline(phase: Phase, days: number, lang: Lang = "en"): string {
  if (lang === "he") {
    if (phase === "exit") return "הקלפיות נסגרו.";
    if (phase !== "before") return "ישראל הצביעה.";
    return days > 1 ? `עוד ${plural(days, { one: "יום אחד", two: "יומיים", other: `${days} ימים` })} לבחירות.` : days === 1 ? "הבחירות מחר." : "הבחירות היום.";
  }
  if (phase === "exit") return "Polls have closed.";
  if (phase !== "before") return "Israel voted.";
  return days > 1 ? `Israel votes in ${days} days.` : days === 1 ? "Israel votes tomorrow." : "Israel votes today.";
}

/** The average beside the count: dated until election eve, "final" from then on (no new polls are published). */
export function averageLabel(config: ResultsConfig, latest: string, now: number, lang: Lang = "en"): string {
  const eve = Date.parse(`${config.election}T00:00:00+02:00`) - 86_400_000;
  if (lang === "he") return now >= eve ? "ממוצע הסקרים הסופי" : `ממוצע הסקרים, ${shortDate(latest, "he")}`;
  return now >= eve ? "Final poll average" : `Polling average, ${shortDate(latest)}`;
}

/** One row per channel: its latest exit poll, or null until it is added; other exit pollsters follow. */
export function exitRows(polls: Poll[]): { pollster: string; poll: Poll | null }[] {
  const latest = new Map<string, Poll>();
  const at = (p: Poll) => p.broadcastAt ?? p.published;
  for (const p of polls.filter((p) => p.kind === "exit")) {
    const seen = latest.get(p.pollster);
    if (!seen || at(p) > at(seen)) latest.set(p.pollster, p);
  }
  const others = [...latest.keys()].filter((k) => !EXIT_CHANNELS.includes(k)).sort();
  return [...EXIT_CHANNELS, ...others].map((pollster) => ({ pollster, poll: latest.get(pollster) ?? null }));
}
/** When an exit poll aired: its own broadcast time, else the close. */
export const exitTime = (poll: Poll, config: ResultsConfig) => poll.broadcastAt ?? config.pollsClose;
