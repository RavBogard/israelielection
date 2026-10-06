export type SearchKind = "party" | "bloc" | "issue" | "community" | "guide" | "glossary" | "resource";
/** `figure` is a dated seat line ("Likud: 22.1 seats, polling average, Oct 5") shown before the description. */
export type SearchEntry = { href: string; title: string; description: string; kind: SearchKind; aliases: string[]; figure?: string };

export const normalizeSearch = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'״\"‘־]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Words that ask for a number rather than name a thing: "likud seats" is a query for Likud's figure. */
const FIGURE_WORDS = new Set(["seat", "seats", "poll", "polls", "polling", "average", "how", "many", "number", "numbers", "now", "today", "current"]);

/** A seat line for search: one decimal, dated by the average. */
export const figureLine = (name: string, seats: number | "below", date: string) => `${name}: ${seats === "below" ? "below the threshold" : `${(Math.round(seats * 10) / 10).toFixed(1)} seats`}, polling average, ${date}`;

/** Every query word must match; canonical titles outrank alternate names; an entry with a figure leads its ties. */
export function searchEntries(entries: SearchEntry[], query: string, kind = "all") {
  const full = normalizeSearch(query);
  const all = full.split(/\s+/).filter(Boolean);
  const core = all.filter((w) => !FIGURE_WORDS.has(w));
  return entries.filter((e) => kind === "all" || e.kind === kind || (kind === "party" && e.kind === "bloc")).map((entry) => {
    const asksFigure = !!entry.figure && core.length > 0 && core.length < all.length;
    const q = asksFigure ? core.join(" ") : full, words = asksFigure ? core : all;
    const title = normalizeSearch(entry.title);
    const aliases = entry.aliases.map(normalizeSearch);
    const haystack = [title, ...aliases, normalizeSearch(entry.description)].join(" ");
    const base = !q ? 1 : title === q ? 100 : title.startsWith(q) ? 80 : aliases.includes(q) ? 70 : title.includes(q) ? 60 : words.every((w) => haystack.includes(w)) ? 10 : 0;
    const score = base && entry.figure ? base + (asksFigure ? 5 : 1) : base;
    const matchedAlias = q ? entry.aliases.find((a) => normalizeSearch(a) !== title && normalizeSearch(a).includes(q)) : undefined;
    return { entry, score, matchedAlias };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
}
