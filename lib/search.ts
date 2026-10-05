export type SearchKind = "party" | "issue" | "community" | "guide" | "glossary" | "resource";
export type SearchEntry = { href: string; title: string; description: string; kind: SearchKind; aliases: string[] };

export const normalizeSearch = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’'״\"‘־]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Every query word must match; canonical titles outrank alternate names. */
export function searchEntries(entries: SearchEntry[], query: string, kind = "all") {
  const q = normalizeSearch(query);
  const words = q.split(/\s+/).filter(Boolean);
  return entries.filter((e) => kind === "all" || e.kind === kind).map((entry) => {
    const title = normalizeSearch(entry.title);
    const aliases = entry.aliases.map(normalizeSearch);
    const haystack = [title, ...aliases, normalizeSearch(entry.description)].join(" ");
    const score = !q ? 1 : title === q ? 100 : title.startsWith(q) ? 80 : aliases.includes(q) ? 70 : title.includes(q) ? 60 : words.every((w) => haystack.includes(w)) ? 10 : 0;
    const matchedAlias = q ? entry.aliases.find((a) => normalizeSearch(a).includes(q)) : undefined;
    return { entry, score, matchedAlias };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
}
