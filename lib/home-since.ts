/** Home "Since yesterday": the newest polls as slips, one computed finding, and the hero's citation. */
import { MAJORITY } from "./coalition";
import { longDate, shortDate } from "./format";
import { BLOC_SEAT_ORDER, blocTotals, byNewest, isExit, pollLabel, seatFigure } from "./polls";
import type { BlocId, Party, Poll } from "./types";
import type { Lang } from "./i18n";
import { list, plural } from "./i18n/he-grammar";
import { pollsterText } from "./i18n/overlays";

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
export function pollSlip(poll: Poll, parties: Party[], blocs: Bloc[], lang: Lang = "en"): Slip {
  const t = blocTotals(poll, parties);
  const rows = BLOC_SEAT_ORDER.map((id) => ({ id, label: blocs.find((b) => b.id === id)?.label ?? id, seats: t[id], majority: t[id] >= MAJORITY }));
  return { id: poll.id, label: pollLabel(poll, lang), date: poll.published, url: poll.url && /^https?:\/\//i.test(poll.url) ? poll.url : null, blocs: rows, majority: rows.filter((r) => r.majority).map((r) => r.id) };
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
export function findingSentence(polls: Poll[], parties: Party[], blocs: Bloc[], id: BlocId = "net", lang: Lang = "en"): string | null {
  if (!polls.length) return null;
  if (lang === "he") return findingHe(polls, parties, blocs, id);
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

/**
 * The Hebrew finding, written for the Hebrew desk rather than translated (STYLE.md): a bloc is masculine singular
 * (גוש נתניהו נשאר), the Arab lists feminine plural; pollsters are credited by outlet inside "בסקר ...", so no verb
 * agrees with them. `blocs` carries the labels to print (the caller passes the Hebrew ones).
 */
function findingHe(polls: Poll[], parties: Party[], blocs: Bloc[], id: BlocId): string {
  const label = blocs.find((b) => b.id === id)?.label ?? id;
  const outlet = (p: Poll) => pollsterText(p.pollster, "he").text;
  const over: string[] = [], unclear: string[] = [];
  let short = 0;
  for (const p of polls) {
    const seats = blocTotals(p, parties)[id];
    if (seats >= MAJORITY) over.push(outlet(p));
    else if (seats + crossBloc(p, parties) >= MAJORITY) unclear.push(outlet(p));
    else short++;
  }
  const fem = id === "arab";
  const stays = fem ? "נשארות" : "נשאר", reaches = fem ? "מגיעות" : "מגיע";
  const n = polls.length - unclear.length;
  const all = n === 1 ? "בסקר העדכני היחיד" : n === 2 ? "בשני הסקרים העדכניים" : `בכל ${n} הסקרים העדכניים`;
  const from = n === 2 ? "משני הסקרים העדכניים" : `מתוך ${n} הסקרים העדכניים`;
  const some = (k: number) => `${k === 1 ? "באחד" : k === 2 ? "בשניים" : `ב-${k}`} ${from}`;
  const inPolls = (xs: string[]) => (xs.length === 1 ? `בסקר ${xs[0]}` : `בסקרים של ${list(xs)}`);
  let s: string;
  if (!n) s = `באף סקר עדכני אי אפשר לחשב את ${label} בנפרד מול רף ה-${MAJORITY}`;
  else if (!over.length) s = `${label} ${stays} מתחת ל-${MAJORITY} ${all}`;
  else if (!short) s = `${label} ${reaches} ל-${MAJORITY} ומעלה ${all}`;
  else s = `${label} ${stays} מתחת ל-${MAJORITY} ${some(short)}; ${MAJORITY} ומעלה ${over.length === 1 ? "רק " : ""}${inPolls(over)}`;
  if (unclear.length && n) s += unclear.length === 1 ? `. סקר ${unclear[0]} לא נכלל, כי הוא מדווח יחד על רשימות מגושים שונים` : `. סקרי ${list(unclear)} לא נכללו, כי הם מדווחים יחד על רשימות מגושים שונים`;
  return `${s}.`;
}

/** The hero's citation: the average, its date, the bloc figure and the poll count. */
export function citeText(average: Poll, count: number, blocLabel: string, seats: number, site?: string, lang: Lang = "en"): string {
  if (lang === "he")
    return `ממוצע הסקרים של פתק 2026, ${longDate(average.published, "he")}: ${blocLabel} ${seatFigure(seats)} מתוך 120 מנדטים (${plural(count, { one: "סקר אחד", two: "שני סקרים", other: `${count} סקרים` })}). ${site ?? "israelielection.org/he/polls"}`;
  site ??= "israelielection.org/polls";
  return `Israel Votes 2026 polling average, ${longDate(average.published)}: ${blocLabel} ${seatFigure(seats)} of 120 seats (${count} ${pollWord(count)}). ${site}`;
}

/** "No new polls since Oct 5", dated by the newest poll. */
export const noNewLabel = (newest: Poll | undefined, lang: Lang = "en") =>
  lang === "he" ? (newest ? `אין סקרים חדשים מאז ${shortDate(newest.published, "he")}` : "עדיין אין סקרים") : newest ? `No new polls since ${shortDate(newest.published)}` : "No polls yet";
