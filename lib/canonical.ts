import briefingsJson from "@/data/briefings/_index.json";
import type {Briefing} from "./briefing";
import {briefingSentence} from "./briefing-locale";
import type { Metadata } from "next";
import { HE_PUBLIC, LANGS, enPath, editionPath } from "./i18n";
import { sourceForPath,translatedReference,toolTextEdition } from "./reference/catalog";

/** The daily briefing's feed, linked from every English page. The feed is English only. */
export const RSS = { "application/rss+xml": [{ url: "/news/feed.xml", title: "Israel Votes 2026: daily briefing" }] };

/** hreflang links for a page with both editions; undefined for English-only pages. */
function languages(en: string, announce = HE_PUBLIC): Record<string, string> | undefined {
  if (!announce) return undefined;
  if (!editionPath(en, "he")) return undefined;
  const sourcePath=en.startsWith("/policies/")?en.replace("/policies/","/issues/"):en;
  const source=sourceForPath(sourcePath);
  const toolSources=en==="/start"?["tools:journeys","tools:voting-rights"]:en==="/match"?["tools:quiz"]:[];
  if(toolSources.length){const ready=LANGS.filter(lang=>lang==="en"||toolSources.every(id=>toolTextEdition(id,lang)?.state==="ready"));return ready.length>1?{...Object.fromEntries(ready.map(lang=>[lang,editionPath(en,lang)!])),"x-default":en}:undefined;}
  if(en==="/news"||en.startsWith("/news/")){const b=en==="/news"?(briefingsJson as Briefing[])[0]:(briefingsJson as Briefing[]).find(b=>b.date===en.slice(6));const ready=LANGS.filter(lang=>lang==="en"||b?.sentences.every(s=>briefingSentence(s,lang).text));return ready.length>1?{...Object.fromEntries(ready.map(lang=>[lang,editionPath(en,lang)!])),"x-default":en}:undefined;}
  const ready=source?LANGS.filter(lang=>lang==="en"||translatedReference(sourcePath,lang)?.state==="ready"):LANGS;
  if(ready.length===1)return undefined;
  return { ...Object.fromEntries(ready.map(lang => [lang, editionPath(en, lang)!])), "x-default": en };
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

export const localizedAlternates = heAlternates;
