import type { NewsItem } from "./news";

/** A published daily briefing: every sentence carries the headlines it rests on. */
export type Briefing = {
  date: string;
  generatedAt: string;
  model: string;
  sentences: { text: string; sources: { outlet: string; title: string; url: string; published: string }[] }[];
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
const terms = (s: string) =>
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
