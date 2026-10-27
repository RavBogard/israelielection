/**
 * English is the full site. The other editions cover home, polls, forecast, Coalition Builder,
 * Compare, party profiles and results. Other reference pages stay English.
 */
export type Lang = "en" | "he" | "ar" | "fa" | "de" | "fr" | "zh";
export type ToolLang = Exclude<Lang, "en">;

export const LANGS: readonly Lang[] = ["en", "he", "ar", "fa", "de", "fr", "zh"];
export const RTL_LANGS: readonly ToolLang[] = ["he", "ar", "fa"];
export const isLang = (value: string): value is Lang => LANGS.includes(value as Lang);
export const TOOL_LANGS = LANGS.filter((lang): lang is ToolLang => lang !== "en");
export const isRtl = (lang: Lang) => RTL_LANGS.includes(lang as ToolLang);
/** Gregorian dates and Latin digits keep election figures consistent across editions. */
export const locale = (lang: Lang) => ({ en: "en-US", he: "he-IL", ar: "ar-u-nu-latn", fa: "fa-u-ca-gregory-nu-latn", de: "de-DE", fr: "fr-FR", zh: "zh-CN" })[lang];

/** The English paths with a Hebrew edition. `[id]` matches one segment (a party id). */
export const HE_PATHS = ["/", "/polls", "/forecast", "/coalition-builder", "/compare", "/parties/[id]", "/results", "/government", "/elections", "/elections/[id]", "/parliament", "/policies", "/policies/[id]", "/changes", "/reference", "/issues", "/issues/[slug]", "/communities", "/communities/[slug]", "/how-it-works", "/how-it-works/[slug]", "/about", "/american-lens", "/search", "/news", "/news/[date]", "/subscriptions", "/subscriptions/confirm", "/subscriptions/preferences", "/subscriptions/unsubscribe", "/embed/grid", "/embed/average", "/embed/builder", "/export/[kind]", "/parties", "/ballot", "/start", "/match", "/glossary", "/corrections"] as const;

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
  const [path, rest] = split(heHref);
  const prefix = /^\/(he|ar|fa|de|fr|zh)(?=\/|$)/.exec(path)?.[0];
  return prefix ? `${trim(path.slice(prefix.length))}${rest}` : heHref;
}

/** The same tool in any edition; guides without a translated edition return null. */
export function editionPath(href: string, lang: Lang): string | null {
  const english = enPath(href);
  if (lang === "en") return english;
  const [path, suffix] = split(english);
  if (!hasHebrew(path)) return null;
  const normalized = trim(path);
  return `/${lang}${normalized === "/" ? "" : normalized}${suffix}`;
}

export function pathLang(href: string): Lang {
  return (/^\/(he|ar|fa|de|fr|zh)(?=\/|[?#]|$)/.exec(href)?.[1] as ToolLang | undefined) ?? "en";
}

/** The same page in the other edition, or null when it has none. */
export function otherEdition(href: string): { lang: Lang; href: string } | null {
  if (pathLang(href) !== "en") return { lang: "en", href: enPath(href) };
  const he = hePath(href);
  return he ? { lang: "he", href: he } : null;
}
