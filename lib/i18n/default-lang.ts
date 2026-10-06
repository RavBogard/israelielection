import type { Lang } from "./index";

/**
 * Which edition a visitor gets by default (proxy.ts). Readers in Israel, and readers whose browser puts Hebrew
 * first, arriving from outside the site at an English page that has a Hebrew edition, are sent to the Hebrew one.
 * A choice made on the masthead toggle (components/LangSwitch.tsx) is kept in a cookie and always wins, and a click
 * from one page of the site to another is never redirected, so the "English" links on Hebrew pages work.
 */

export const LANG_COOKIE = "lang";
/** A year: the toggle's choice outlasts the campaign. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Crawlers and link-preview fetchers index the edition at the address they asked for. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|whatsapp|telegram|discord|slack|lighthouse|headless/i;

/** The browser's first language: "he-IL,en;q=0.8" → "he". "iw" is Hebrew's old code, still sent by some systems. */
export function firstLanguage(acceptLanguage: string | null): string | null {
  const first = acceptLanguage
    ?.split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((x) => x.tag && x.tag !== "*" && x.q > 0)
    .sort((a, b) => b.q - a.q)[0];
  if (!first) return null;
  const base = first.tag.split("-")[0];
  return base === "iw" ? "he" : base;
}

export type Visit = {
  /** The cookie the toggle sets, if any. */
  cookie: string | undefined;
  /** Vercel's x-vercel-ip-country (two letters), if any. */
  country: string | null;
  acceptLanguage: string | null;
  userAgent: string | null;
  /** The Referer header: a same-site referer means the reader clicked a link on the site. */
  referer: string | null;
  /** The site's own origin, from the request URL. */
  origin: string;
};

/** The edition this visit should get, or null to serve the page asked for. */
export function defaultLang(v: Visit): Lang | null {
  if (v.cookie === "en" || v.cookie === "he") return v.cookie;
  if (v.userAgent && BOT.test(v.userAgent)) return null;
  if (v.referer && sameSite(v.referer, v.origin)) return null;
  if (v.country?.toUpperCase() === "IL") return "he";
  return firstLanguage(v.acceptLanguage) === "he" ? "he" : null;
}

function sameSite(referer: string, origin: string): boolean {
  try {
    const host = (h: string) => h.replace(/^www\./, "");
    return host(new URL(referer).host) === host(new URL(origin).host);
  } catch {
    return false;
  }
}
