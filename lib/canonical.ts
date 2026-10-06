import type { Metadata } from "next";
import { HE_PUBLIC, enPath, hePath } from "./i18n";

/** The daily briefing's feed, linked from every English page. The feed is English only. */
export const RSS = { "application/rss+xml": [{ url: "/news/feed.xml", title: "Israel Votes 2026: daily briefing" }] };

/** hreflang links for a page with both editions; undefined for English-only pages. */
function languages(en: string, announce = HE_PUBLIC): Record<string, string> | undefined {
  if (!announce) return undefined;
  const he = hePath(en);
  return he ? { en, he, "x-default": en } : undefined;
}

/**
 * A page's alternates: its canonical address (so ?with=, ?poll= and other query views do not index as
 * duplicates), the feed link, and, for the pages with a Hebrew edition (HE_PATHS in lib/i18n), hreflang
 * links to both editions. Metadata merges shallowly, so a page that sets `alternates` must carry the feed too.
 */
export const alternates = (path: string): Metadata["alternates"] => {
  const langs = languages(path);
  return langs ? { canonical: path, languages: langs, types: RSS } : { canonical: path, types: RSS };
};

/** A Hebrew page's alternates, from its Hebrew path ("/he/polls"): canonical to itself, hreflang to both editions. No feed. */
export const heAlternates = (path: string): Metadata["alternates"] => {
  const langs = languages(enPath(path));
  return langs ? { canonical: path, languages: langs } : { canonical: path };
};
