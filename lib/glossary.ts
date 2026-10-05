/** The glossary, data/glossary.json: terms in alphabetical order, each with a source. */

export type GlossaryTerm = {
  term: string;
  hebrew?: string;
  say?: string;
  def: string;
  see?: string[];
  source: { name: string; date: string; url: string };
};

export type Glossary = { checked: string; terms: GlossaryTerm[] };

export function filterTerms(terms: GlossaryTerm[], query: string, aliases: Record<string, string[]> = {}) {
  const normalize = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’'״־-]/g, "").replace(/\s+/g, " ").trim();
  const words = normalize(query).split(" ").filter(Boolean);
  return terms.filter((term) => {
    const text = normalize([term.term, term.hebrew ?? "", term.say ?? "", ...(aliases[term.term] ?? [])].join(" "));
    return words.every((word) => text.includes(word));
  });
}

/** The sort key: a leading "The" is ignored, as are case and diacritics. */
export const sortKey = (term: string) =>
  term
    .replace(/^The /, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** The letter a term is filed under. */
export const initialOf = (term: string) => sortKey(term).replace(/^[^a-z]+/, "").charAt(0).toUpperCase();

/** A stable fragment id for a term, so other pages can link /glossary#area-c. */
export const anchorOf = (term: string) =>
  sortKey(term)
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
