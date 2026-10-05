import { XMLParser } from "fast-xml-parser";

/**
 * Headlines from English-language outlets. No AI: titles, links and dates as the outlets publish
 * them. Feed URLs verified 2026-10-04. Kan English is left out: its only feed is the 9 MB podcast
 * feed. The Times of Israel main feed is behind a Cloudflare challenge; its politics feed is not.
 */
export type Feed = {
  outlet: string;
  url: string;
  /** General feeds keep only Israel-related items. */
  filter?: boolean;
};

export const FEEDS: Feed[] = [
  { outlet: "Times of Israel", url: "https://www.timesofisrael.com/israel-inside/feed/" },
  { outlet: "Times of Israel", url: "https://www.timesofisrael.com/topic/israeli-elections/feed/" },
  { outlet: "Haaretz", url: "https://www.haaretz.com/srv/israel-news-rss" },
  { outlet: "Jerusalem Post", url: "https://www.jpost.com/rss/rssfeedisraelelection2026" },
  { outlet: "+972 Magazine", url: "https://www.972mag.com/feed/" },
  { outlet: "JTA", url: "https://www.jta.org/category/israel/feed" },
  { outlet: "Jewish Insider", url: "https://jewishinsider.com/feed/", filter: true },
  { outlet: "The Forward", url: "https://forward.com/feed/", filter: true },
];

const ISRAEL =
  /\b(Israel|Israeli|Israelis|Knesset|Netanyahu|Likud|Gaza|West Bank|Hamas|Hezbollah|Jerusalem|Tel Aviv|Haredi|ultra-Orthodox|Eisenkot|Bennett|Lapid|Ben-Gvir|Ben Gvir|Smotrich|Lieberman|Deri|Golan|IDF|settler|settlement|Ra'am|Joint List)\b/i;

export type NewsItem = {
  outlet: string;
  title: string;
  url: string;
  /** ISO timestamp */
  published: string;
  summary: string;
};

const UA = "Mozilla/5.0 (compatible; israelielection.org news reader; +https://www.israelielection.org)";
const parser = new XMLParser({ ignoreAttributes: false, processEntities: true, htmlEntities: true });

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#8217": "’", "#8216": "‘", "#8220": "“", "#8221": "”", "#8211": "–", "#8212": "—", "#039": "'" };

/** HTML → plain text: tags removed, entities decoded, whitespace collapsed. */
export function toText(html: unknown, max = 280): string {
  const s = String(html ?? "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? (e.startsWith("#") ? String.fromCodePoint(Number(e.slice(1))) : m))
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : s;
}

const text = (v: unknown): string => (typeof v === "object" && v !== null && "#text" in v ? String((v as { "#text": unknown })["#text"]) : String(v ?? ""));

export function parseFeed(xml: string, feed: Feed): NewsItem[] {
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
  const items = Array.isArray(raw) ? raw : [raw];
  const out: NewsItem[] = [];
  for (const it of items) {
    const title = toText(text(it.title), 300);
    const link = typeof it.link === "object" && it.link?.["@_href"] ? it.link["@_href"] : text(it.link);
    const when = Date.parse(text(it.pubDate ?? it.published ?? it.updated ?? it["dc:date"]));
    if (!title || !/^https?:\/\//i.test(link) || Number.isNaN(when)) continue;
    const summary = toText(it.description ?? it.summary ?? "");
    if (feed.filter && !ISRAEL.test(`${title} ${summary}`)) continue;
    out.push({ outlet: feed.outlet, title, url: link.trim(), published: new Date(when).toISOString(), summary });
  }
  return out;
}

export type NewsResult = { items: NewsItem[]; failed: string[]; fetchedAt: string };

/** All feeds, merged, newest first, de-duplicated by URL. Feeds that fail are listed, not fatal. */
export async function fetchNews(opts: { sinceHours?: number; revalidate?: number } = {}): Promise<NewsResult> {
  const since = Date.now() - (opts.sinceHours ?? 72) * 3_600_000;
  const results = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
          signal: AbortSignal.timeout(10_000),
          ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : {}),
        } as RequestInit);
        if (!res.ok) throw new Error(String(res.status));
        return { f, items: parseFeed(await res.text(), f) };
      } catch {
        return { f, items: null };
      }
    })
  );
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const r of results)
    for (const it of r.items ?? []) {
      const key = it.url.replace(/[?#].*$/, "");
      if (seen.has(key) || Date.parse(it.published) < since) continue;
      seen.add(key);
      items.push(it);
    }
  items.sort((a, b) => b.published.localeCompare(a.published));
  const failed = [...new Set(results.filter((r) => !r.items).map((r) => r.f.outlet))];
  return { items, failed, fetchedAt: new Date().toISOString() };
}
