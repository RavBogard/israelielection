/**
 * The party comparison's words in both editions (/compare and /he/compare): the controls, the key, the matrix,
 * the open row and the generated reading of each row. Hebrew is written fresh in Israeli political-media Hebrew
 * (docs/planning/2026-10-06-hebrew/STYLE.md), doing each English element's job; Daniel reviews it here, in one place.
 * `he` is typed as `typeof en`, so both editions carry the same keys and template signatures.
 * Data text (party names, stances, the parties' words) comes from lib/i18n/overlays.ts, not from here.
 */
import { longDate } from "@/lib/format";
import type { AxisKey } from "@/lib/compare";
import type { IssueReading } from "@/lib/cohesion";
import { plural } from "./he-grammar";
import type { Lang } from "./index";
import type { Localized } from "./localize";
import { heText } from "./he-text";


const en = {
  title: "Compare the parties",
  description:
    "Every list's recorded answer on the draft, the courts, the October 7 inquiry, the West Bank, religion and state, the economy, a Palestinian state and Gaza, in one matrix, with the party's words, dates and sources.",
  standfirst: "Every list's recorded answer on the questions that divide this election, in one chart. Open a row for each party's own words.",
  presets: { all: "Every list", net: "Netanyahu bloc", opp: "Anti-Netanyahu bloc", core: "Core opposition", outgoing: "Outgoing government" },
  showGroup: "Lists to show",
  show: "Show",
  presetOption: (label: string, n: number) => `${label}, ${n} lists`,
  yourSetOption: (n: number) => `Your set, ${n} lists`,
  yourSet: "Your set",
  nLists: (n: number) => `${n} lists`,
  build: "Build this set in the Coalition Builder",
  pickOne: "Choose lists one by one",
  chosen: (n: number, atMin: boolean) => (atMin ? `${n} chosen. Two is the fewest to compare.` : `${n} chosen.`),
  ramp: "Each issue’s answers in order, from one end of the debate to the other. The same shade and number in a row is the same answer; the figure beside each answer is the seats its lists hold in the polling average.",
  glyphs: {
    none: "No position found",
    declined: "Declined to answer",
    unsorted: "Recorded, not classified",
    rec: "On the record, not a questionnaire answer",
    unst: "Not said publicly: from the record, see why",
    ink: "Priorities that can coexist, so no order",
  },
  tap: "Open any row for every list’s own words and source.",
  seatnote: "Under each list: its seats in the polling average.",
  blockey: "Bars over the columns mark the blocs:",
  caption: "Recorded answers by list. Rows are questions; columns are lists. Each cell opens its row with the list’s words and source.",
  seatsLabel: "Seats, polling average",
  letters: (l: string) => `Ballot letters: ${l}`,
  below: "below",
  heldTitle: "Seats these lists hold in the polling average",
  legendNone: "No answer recorded for these lists",
  cell: {
    declined: (name: string) => `${name}: declined to answer`,
    none: (name: string) => `${name}: no position found`,
    unsorted: (name: string) => `${name}: recorded, not classified`,
    stance: (name: string, label: string, record: boolean, unstated: boolean) => `${name}: ${label}${record ? ", on the record" : ""}${unstated ? ", not said publicly" : ""}`,
  },
  unsortedHead: "Recorded, not classified",
  quietHead: "Not established by these sources",
  noPosition: "No position found",
  declined: "Declined to answer",
  checked: (date: string) => `. Checked ${date}`,
  recordNote: " (on the record, because the party did not answer the questionnaire)",
  /** Before the source line in the open row; English has none. */
  sourcePrefix: "",
  /** The qualifier the row text leads with when the party has not said it publicly (lib/positions QUALIFIER.unstated). */
  unstatedPrefix: "Not said publicly: ",
  issuePage: "Read the issue page",
  exportQuestion: "Print or export this question",
  foot: "Each list is placed by the answer its own words or record support; the words are the party’s, quoted or summarised from the sources shown. Nothing recorded is itself a finding, and the site says when it last checked. Indented rows are narrower questions under the issue above them. A list’s broad answer is never carried down to them, so a blank there means these sources do not answer the narrow question. These classifications compare recorded answers; they are not a stability forecast, questions are not equally important, and differences may be negotiable.",
  exportAll: "Print or export the whole comparison for these lists",
  /** The seven rows' labels (lib/compare AXES). */
  axes: {
    draft: "Haredi draft",
    courts: "Courts and the judicial overhaul",
    war: "The October 7 inquiry",
    wb: "West Bank and annexation",
    relig: "Religion and state",
    econ: "Cost of living and the economy",
    pstate: "A Palestinian state",
  } as Record<AxisKey, string>,
};


const compareText = {
  en,
  /** Loaded on Hebrew pages only (lib/i18n/he/register.ts). */
  get he(): CompareText {
    return heText<CompareText>("compare");
  },
};
export default compareText;
export type CompareText = typeof en;

/**
 * The reading of one row in Hebrew (the English is readingText in lib/cohesion): whether the lists shown share an
 * answer, split, or have none on record. Nouns and colon frames, so no verb has to agree with a party name.
 */
export function readingHe(r: IssueReading, nameOf: (id: string) => string, stanceOf: (id: string) => string): string {
  const quiet = r.declined.length + r.none.length + r.unsorted.length;
  const quietNote = quiet ? `; ל-${quiet} מתוך ${r.selected} אין תשובה לשאלה הזו` : "";
  if (r.verdict === "agree") return `עמדה משותפת: ${stanceOf(r.groups[0].stance.id)} (${r.known} מתוך ${r.selected} תשובות).`;
  if (r.verdict === "partial") return r.known === 1 ? `רק תשובה מתועדת אחת (${nameOf(r.groups[0].parties[0])})${quietNote}.` : `העמדות המתועדות זהות${quietNote}.`;
  if (r.verdict === "split") return `עמדות שונות: ${plural(r.groups.length, { one: "תשובה אחת", two: "שתי תשובות", other: `${r.groups.length} תשובות` })}${quietNote}.`;
  if (r.verdict === "unsorted") return "סדרי עדיפויות שיכולים לדור בכפיפה אחת; אין כאן סיווג של הסכמה או מחלוקת.";
  return "אין די מידע: אין תשובות מתועדות לשאלה הזו.";
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const MONTH_YEAR = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const iso = (y: string, m: number, d: string | number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** "ב" before a date: hyphenated before a digit ("ב-27 במרץ"), joined before a word ("בספטמבר 2026"). */
export const inDate = (d: string) => (/^\d/.test(d) ? `ב-${d}` : `ב${d}`);

/** English words the data's date lines use, in the order they are replaced. */
const DATE_WORDS: [RegExp, (...m: string[]) => string][] = [
  [/^Undated; checked (.+)$/, (_, d) => `ללא תאריך; נבדק ${inDate(d)}`],
  [/^Undated$/, () => "ללא תאריך"],
  [/^Accessed (.+)$/, (_, d) => `נצפה ${inDate(d)}`],
  [/^(.+); reported (.+)$/, (_, a, d) => `${a}; דווח ${inDate(d)}`],
];

/**
 * A date as the data writes it ("Mar 27, 2025", "Sept 2026", "Undated; checked Oct 5, 2026", "2023; reported
 * Sep 22, 2026") in Hebrew ("27 במרץ 2025", "ספטמבר 2026"). Anything it cannot read whole stays English (lang "en").
 */
export function heDateText(s: string): Localized {
  let out = s.trim();
  out = out.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (\d{4})\b/g, (_, m: string, d: string, y: string) => longDate(iso(y, MONTHS[m.toLowerCase()], d), "he"));
  out = out.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]* (\d{4})\b/g, (_, m: string, y: string) => MONTH_YEAR.format(new Date(`${iso(y, MONTHS[m.toLowerCase()], 15)}T12:00:00Z`)));
  for (const [re, he] of DATE_WORDS) out = out.replace(re, he as (...m: string[]) => string);
  return /[A-Za-z]/.test(out) ? { text: s, lang: "en" } : { text: out, lang: "he" };
}

/** The evidence kinds lib/positions and data/gaza-security-evidence.json name, in Hebrew. A kind missing here shows in English. */
export const EVIDENCE_KINDS_HE: Record<string, string> = {
  "Legislative record": "תיעוד חקיקה",
  "Historical vote, not a current answer": "הצבעה מהעבר, לא תשובה עדכנית",
  "Party questionnaire answer": "תשובת המפלגה לשאלון",
  "Leader statement before the joint list": "הצהרה של ראש המפלגה לפני הריצה המשותפת",
  "Secondary policy summary": "סיכום מדיניות ממקור משני",
  "Undated party plan": "תוכנית מפלגתית ללא תאריך",
  "Leader statement": "הצהרה של ראש המפלגה",
  "Party plan reported in the press": "תוכנית המפלגה, כפי שדווחה בתקשורת",
  "Leader statement, reported": "הצהרה של ראש המפלגה, כפי שדווחה",
};

/** The evidence line's words (lib/positions evidenceLabel). English is the existing output, byte for byte. */
export const EVIDENCE = {
  en: {
    noRow: "No recorded answer in these sources",
    kind: (k: string) => k,
    date: (d: string) => d,
    checkedAt: (isoDate: string) => isoDate,
    evidence: (kind: string, date: string | null, checked: string) => `${kind}, ${date ?? "date unavailable"}; checked ${checked}`,
    record: "Record evidence: ",
    unavailable: (date: string | null) => `evidence date unavailable${date ? ` (${date})` : ""}`,
    published: (date: string) => `Source published ${date}`,
  },
  he: {
    noRow: "אין תשובה מתועדת במקורות האלה",
    kind: (k: string) => EVIDENCE_KINDS_HE[k] ?? k,
    date: (d: string) => heDateText(d).text,
    checkedAt: (isoDate: string) => longDate(isoDate, "he"),
    evidence: (kind: string, date: string | null, checked: string) => `${kind}, ${date ?? "ללא תאריך"}; נבדק ${inDate(checked)}`,
    record: "לפי הרקורד: ",
    unavailable: (date: string | null) => `תאריך הראיה לא ידוע${date ? ` (${date})` : ""}`,
    published: (date: string) => `המקור פורסם ${inDate(date)}`,
  },
} satisfies Record<Lang, unknown>;
