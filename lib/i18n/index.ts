/**
 * The two editions. English is the site; Hebrew covers the tools (PLAN.md, docs/planning/2026-10-06-hebrew):
 * home, polls, Coalition Builder, Compare, party profiles and results, each at /he + the English path.
 * Everything else stays English, and Hebrew pages link to it.
 */
export type Lang = "en" | "he";

export const LANGS: readonly Lang[] = ["en", "he"];

/** The English paths with a Hebrew edition. `[id]` matches one segment (a party id). */
export const HE_PATHS = ["/", "/polls", "/coalition-builder", "/compare", "/parties/[id]", "/results"] as const;

/**
 * Whether the Hebrew edition is announced: hreflang links on English pages, sitemap entries, and indexing of
 * /he. On since 2026-10-06 (Daniel: "you can go live with the hebrew site").
 */
export const HE_PUBLIC = true;

/** The Hebrew edition's prefix. */
export const HE_PREFIX = "/he";

/** Splits "/polls?x=1#y" into the path and the query/fragment suffix. */
function split(href: string): [string, string] {
  const i = href.search(/[?#]/);
  return i < 0 ? [href, ""] : [href.slice(0, i), href.slice(i)];
}

/** "/polls/" → "/polls"; "" → "/". */
function trim(path: string): string {
  const p = path.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

const PATTERNS = HE_PATHS.map((p) => new RegExp(`^${p.replace(/\[[^\]/]+\]/g, "[^/]+")}$`));

/** Whether an English path (query and fragment ignored) has a Hebrew edition. */
export function hasHebrew(enHref: string): boolean {
  const path = trim(split(enHref)[0]);
  return PATTERNS.some((re) => re.test(path));
}

/** Whether a path is in the Hebrew edition: /he or under /he/. */
export function isHePath(href: string): boolean {
  const path = split(href)[0];
  return path === HE_PREFIX || path.startsWith(`${HE_PREFIX}/`);
}

/**
 * The Hebrew edition of an English path, keeping its query and fragment: "/" → "/he", "/polls?poll=x" → "/he/polls?poll=x".
 * Null when the page has no Hebrew edition (the guides, the news, the about page).
 */
export function hePath(enHref: string): string | null {
  if (isHePath(enHref)) return enHref;
  const [path, rest] = split(enHref);
  if (!hasHebrew(path)) return null;
  const p = trim(path);
  return `${p === "/" ? HE_PREFIX : `${HE_PREFIX}${p}`}${rest}`;
}

/** The English edition of a Hebrew path, keeping its query and fragment: "/he" → "/", "/he/polls" → "/polls". English paths pass through. */
export function enPath(heHref: string): string {
  if (!isHePath(heHref)) return heHref;
  const [path, rest] = split(heHref);
  return `${trim(path.slice(HE_PREFIX.length))}${rest}`;
}

/** The same page in the other edition, or null when it has none. */
export function otherEdition(href: string): { lang: Lang; href: string } | null {
  if (isHePath(href)) return { lang: "en", href: enPath(href) };
  const he = hePath(href);
  return he ? { lang: "he", href: he } : null;
}
