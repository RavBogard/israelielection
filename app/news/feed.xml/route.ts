import briefingsJson from "@/data/briefings/_index.json";
import { DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 900;

type FeedBriefing = {
  date: string;
  generatedAt: string;
  sentences: { text: string; sources: { outlet: string; title: string; url: string }[] }[];
};

const NEWS = "https://www.israelielection.org/news";
const DAY = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Escape text for XML element content and attribute values. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** CDATA cannot contain "]]>"; split it across two sections. */
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function itemHtml(b: FeedBriefing): string {
  return b.sentences
    .map((s) => {
      const srcs = s.sources.map((src) => `<a href="${esc(src.url)}">(${esc(src.outlet)}: ${esc(src.title)})</a>`).join(" ");
      return `<p>${esc(s.text)}${srcs ? ` ${srcs}` : ""}</p>`;
    })
    .join("");
}

function item(b: FeedBriefing): string {
  // The day's own page. The guid keeps the old anchor address so readers do not see every briefing again as new.
  const link = `${NEWS}/${b.date}`;
  const guid = `${NEWS}#${b.date}`;
  return [
    "<item>",
    `<title>${esc(`Briefing, ${DAY.format(new Date(`${b.date}T00:00:00Z`))}`)}</title>`,
    `<link>${esc(link)}</link>`,
    `<guid isPermaLink="false">${esc(guid)}</guid>`,
    `<pubDate>${new Date(b.generatedAt).toUTCString()}</pubDate>`,
    `<description>${cdata(itemHtml(b))}</description>`,
    "</item>",
  ].join("");
}

export function GET() {
  const briefings = [...(briefingsJson as FeedBriefing[])].sort((a, b) => b.date.localeCompare(a.date));
  const last = briefings[0] ? `<lastBuildDate>${new Date(briefings[0].generatedAt).toUTCString()}</lastBuildDate>` : "";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc("Israel Votes 2026: daily briefing")}</title>
<link>${NEWS}</link>
<atom:link href="${NEWS}/feed.xml" rel="self" type="application/rss+xml"/>
<description>${esc(DESCRIPTION)}</description>
<language>en-us</language>
${last}
${briefings.map(item).join("\n")}
</channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
