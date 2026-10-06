import type { Metadata } from "next";

/** The daily briefing's feed, linked from every page. */
export const RSS = { "application/rss+xml": [{ url: "/news/feed.xml", title: "Israel Votes 2026: daily briefing" }] };

/**
 * A page's alternates: its canonical address (so ?with=, ?poll= and other query views do not index as
 * duplicates) and the feed link. Metadata merges shallowly, so a page that sets `alternates` must carry the feed too.
 */
export const alternates = (path: string): Metadata["alternates"] => ({ canonical: path, types: RSS });
