import type { NewsItem } from "./news";

/** A published daily briefing: every sentence carries the headlines it rests on. */
export type Briefing = {
  date: string;
  generatedAt: string;
  model: string;
  /** `textHe`: the Hebrew edition's sentence (checkTranslation); null when the checks failed, absent on older files. */
  sentences: { text: string; textHe?: string | null; sources: { outlet: string; title: string; url: string; published: string }[] }[];
  /** Sentences the grounding check removed before publishing (kept for audit). */
  dropped: { text: string; reason: string }[];
};

/** What the model returns (structured output). */
export type Draft = { sentences: { text: string; sources: number[] }[] };

export const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    sentences: {
      type: "array",
      minItems: 3,
      maxItems: 9,
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "One plain sentence, no markdown, no links." },
          sources: { type: "array", minItems: 1, maxItems: 3, items: { type: "integer" }, description: "Numbers of the headlines this sentence states facts from." },
        },
        required: ["text", "sources"],
      },
    },
  },
  required: ["sentences"],
} as const;

export function briefingPrompt(items: NewsItem[], date: string): string {
  const list = items
    .map((it, i) => `[${i + 1}] ${it.outlet}, ${it.published.slice(0, 16).replace("T", " ")} UTC | ${it.title}${it.summary ? ` | ${it.summary}` : ""}`)
    .join("\n");
  return `You write the daily "what changed" briefing for israelielection.org, an English-language reference site on Israel's October 27, 2026 Knesset election for American readers.

Today is ${date}. Below are the last day's headlines from English-language outlets, numbered.

Write about 200 words (150–250) in 4–8 sentences on what changed in the campaign and in the events voters are reacting to. Rules:
- Every sentence states only facts found in the headlines and summaries you cite by number. Cite 1–3 numbers per sentence.
- Neutral reference voice. No opinion, no prediction, no adjectives of judgment, no "notably" or "importantly".
- Attribute claims: "X said", "according to Haaretz". Party names as written in the headlines.
- Lead with election news (parties, polls, lists, courts, coalition talk); then major events only if they bear on the campaign.
- Plain sentences: no markdown, no links, no bullet points, no headings.

Headlines:
${list}`;
}

const STOP = new Set("the a an and or of to in on for with at by from as is are was were be been it its that this he she they his her their after before over into than who what which said says will would not no new more israel israeli israelis".split(" "));
export const terms = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}' -]/gu, " ")
      .split(/\s+/)
      .map((w) => w.replace(/^'+|'+$/g, "").replace(/'s$/, ""))
      .filter((w) => w.length > 2 && !STOP.has(w))
  );

/**
 * Turns a model draft into a publishable briefing, or explains why not. A sentence is dropped
 * when it cites no real item or shares fewer than two content words with what it cites.
 */
export function checkDraft(draft: Draft, items: NewsItem[], meta: { date: string; model: string }): { briefing: Briefing | null; problems: string[] } {
  const problems: string[] = [];
  const kept: Briefing["sentences"] = [];
  const dropped: Briefing["dropped"] = [];
  for (const s of draft.sentences ?? []) {
    const text = String(s.text ?? "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (/https?:\/\/|\[|\]|\*|#/.test(text)) { dropped.push({ text, reason: "markup or link in text" }); continue; }
    const cited = [...new Set(s.sources ?? [])].filter((n) => Number.isInteger(n) && n >= 1 && n <= items.length).map((n) => items[n - 1]);
    if (!cited.length) { dropped.push({ text, reason: "cites no valid headline" }); continue; }
    const have = terms(cited.map((c) => `${c.title} ${c.summary} ${c.outlet}`).join(" "));
    const overlap = [...terms(text)].filter((w) => have.has(w)).length;
    if (overlap < 2) { dropped.push({ text, reason: "shares too little with its cited headlines" }); continue; }
    kept.push({ text, sources: cited.map(({ outlet, title, url, published }) => ({ outlet, title, url, published })) });
  }
  const words = kept.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
  if (kept.length < 3) problems.push(`Only ${kept.length} sentences survived the source check (need 3).`);
  if (words > 320) problems.push(`Too long: ${words} words.`);
  if (problems.length) return { briefing: null, problems };
  return { briefing: { date: meta.date, generatedAt: new Date().toISOString(), model: meta.model, sentences: kept, dropped }, problems };
}

/**
 * The Hebrew briefing (Daniel, 2026-10-06: published unreviewed, labelled "תורגם אוטומטית"). A second call writes each
 * checked English sentence again in Israeli news Hebrew; `checkTranslation` keeps it only when it is sentence for
 * sentence, carries the same numbers, and names each party the English names by the site's own Hebrew name.
 * Otherwise every `textHe` stays null and the Hebrew home shows the English sentences, marked as English.
 */
/** `he` is the name the model is told to use; `must` (default `he`) is what the Hebrew sentence must contain: the short name, so a sentence may use either. */
export type GlossaryEntry = { en: string[]; he: string; must?: string };
export type HeDraft = { sentences: string[] };

export const HE_SCHEMA = {
  type: "object",
  properties: { sentences: { type: "array", items: { type: "string", description: "The Hebrew sentence, in the same position as its English one." } } },
  required: ["sentences"],
} as const;

export function hebrewPrompt(sentences: string[], glossary: GlossaryEntry[]): string {
  return `אתה עורך חדשות בעיתון ישראלי. לפניך תדריך יומי קצר באנגלית על הבחירות לכנסת ב-27 באוקטובר 2026. כתוב כל משפט מחדש בעברית עיתונאית ישראלית טבעית, כמו בכאן חדשות, ynet או הארץ: לא תרגום מילולי, אלא אותה עובדה בניסוח שקורא ישראלי מצפה לו.

כללים:
- משפט עברי אחד לכל משפט אנגלי, באותו סדר. אל תאחד, אל תפצל, אל תוסיף ואל תשמיט עובדות.
- כל מספר שכתוב בספרות באנגלית נשאר אותו מספר בספרות. אל תהפוך מילים למספרים או מספרים למילים.
- קול ניטרלי. בלי דעה ובלי תחזית. ייחוס ("לדברי", "לפי הארץ") כמו במקור.
- מונחים ישראליים: High Court = בג"ץ או בית המשפט העליון, Central Election Committee = ועדת הבחירות המרכזית, Knesset = הכנסת.
- שמות כלי תקשורת בעברית: Haaretz = הארץ, Times of Israel = טיימס אוף ישראל, Jerusalem Post = ג'רוזלם פוסט, Ynet = ynet.
- שמות מפלגות ומנהיגים בדיוק כך:
${glossary.map((g) => `  ${g.en[0]} = ${g.he}`).join("\n")}
- טקסט רגיל בלבד: בלי markdown, בלי קישורים.

המשפטים:
${sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
}

/** Numbers as they appear, sorted: "5 petitions, 27 October 2026" → ["2026", "27", "5"]. */
const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, "")).sort();
/** Hebrew quote marks to plain ones, so ש״ס and ש"ס compare equal. */
const normHe = (s: string) => s.replace(/[״”“]/g, '"').replace(/[׳’]/g, "'");
/** A Hebrew name's stem: no leading definite article, no "!" (הליכוד → ליכוד, so בליכוד matches). */
const stem = (he: string) => normHe(he).replace(/^ה(?=\S{3,})/, "").replace(/!$/, "");

/** Keeps the Hebrew sentences when they pass every check; otherwise says why not. */
export function checkTranslation(en: string[], draft: HeDraft | null, glossary: GlossaryEntry[]): { he: string[] | null; problem: string | null } {
  const he = (draft?.sentences ?? []).map((s) => String(s ?? "").replace(/\s+/g, " ").trim());
  if (he.length !== en.length) return { he: null, problem: `${he.length} Hebrew sentences for ${en.length} English` };
  for (let i = 0; i < en.length; i++) {
    const h = he[i], n = i + 1;
    if (!h) return { he: null, problem: `sentence ${n} is empty` };
    if (/https?:\/\/|\[|\]|\*|#/.test(h)) return { he: null, problem: `sentence ${n} has markup or a link` };
    const hebrew = (h.match(/[֐-׿]/g) ?? []).length, latin = (h.match(/[A-Za-z]/g) ?? []).length;
    if (hebrew < 2 * latin || hebrew < 10) return { he: null, problem: `sentence ${n} is not mostly Hebrew` };
    if (numbers(en[i]).join() !== numbers(h).join()) return { he: null, problem: `sentence ${n}: numbers differ (${numbers(en[i]).join(" ") || "none"} / ${numbers(h).join(" ") || "none"})` };
    const missing = glossary.filter((g) => g.en.some((e) => en[i].includes(e)) && !normHe(h).includes(stem(g.must ?? g.he)));
    if (missing.length) return { he: null, problem: `sentence ${n} does not name ${missing.map((g) => g.he).join(", ")}` };
  }
  return { he, problem: null };
}
