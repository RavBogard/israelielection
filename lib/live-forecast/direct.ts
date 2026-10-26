import type { Poll } from "../types";
import frozen from "../../data/live-forecast-prior.json";
import hebrewNames from "../../data/he/parties.json";
import type { LiveSource } from "./types";
import { hash } from "./model";

export const PARTY_ALIASES: Record<string, string> = Object.fromEntries(frozen.inputs.partyFile.parties.flatMap((p) => [[p.name, p.id], [p.short, p.id]]));
const translated = hebrewNames as Record<string, { name?: { text: string }; short?: { text: string } }>;
for (const p of frozen.inputs.partyFile.parties) for (const field of ["name", "short"] as const) {
  const name = translated[p.id]?.[field]?.text;
  if (name) PARTY_ALIASES[name.replace(/[״]/g, '"').replace(/[׳]/g, "'")] = p.id;
}
Object.assign(PARTY_ALIASES, { "הליכוד": "likud", "ליכוד": "likud", "שס": "shas", 'ש"ס': "shas", "יהדות התורה": "utj", "ישראל ביתנו": "yb", 'רע"מ': "raam", "עוצמה יהודית": "otzma", "הציונות הדתית": "rz", "ישר": "yashar", "ביחד": "byachad", "הדמוקרטים": "dem", "הרשימה המשותפת": "jl" });
const plain = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&quot;|&#34;|[״]/g, '"').replace(/&#0?39;|&apos;|[׳]/g, "'").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
/** Only isolated complete lists; never collect party numbers across a live article's different revisions. */
export function completeSeatParagraph(html: string, aliases = PARTY_ALIASES): Record<string, { seats: number }> | null {
  const paragraphs = [...html.matchAll(/<(?:p|table)\b[^>]*>([\s\S]*?)<\/(?:p|table)>/gi)].map((m) => plain(m[1]));
  for (const text of paragraphs) {
    const pairs = [...text.matchAll(/(?:^|[:,;،]|\s[–—]\s)\s*([^,:;،]+?)\s*[-–—:]\s*(\d{1,3})(?=\s|[,;،.]|$)/g)];
    if (pairs.length < 3) continue;
    const results: Record<string, { seats: number }> = {}; let invalid = false;
    for (const pair of pairs) {
      const label = pair[1].trim(), id = aliases[label];
      if (!id || id in results || Number(pair[2]) > 120) { invalid = true; break; }
      results[id] = { seats: Number(pair[2]) };
    }
    if (!invalid && Object.values(results).reduce((n, r) => n + r.seats, 0) === 120) return results;
  }
  return null;
}
type Timeline = { id?: string; post_title?: string; post_content?: string; createdOn?: string };
type ChannelPage = { props?: { pageProps?: { page?: { Content?: { Item?: { timeLines?: Record<string, { elements?: Timeline[] }> } } }; pageData?: { content?: { html?: string }[] } } } };
export function nextData(html: string): ChannelPage {
  const script = html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!script) throw new Error("Broadcaster structured page unavailable");
  return JSON.parse(script[1]);
}
export function channel13Candidates(html: string, url: string, aliases = PARTY_ALIASES, offset = "+02:00"): Poll[] {
  const timelines = nextData(html).props?.pageProps?.page?.Content?.Item?.timeLines;
  if (!timelines) return [];
  return Object.values(timelines).flatMap((t) => (t.elements ?? []).flatMap((e) => {
    if (!e.createdOn || !e.post_content || !/מדגם/.test(e.post_title ?? "")) return [];
    const results = completeSeatParagraph(e.post_content, aliases); if (!results) return [];
    const timestamp = e.createdOn.replace(" ", "T");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(timestamp)) return [];
    const broadcastAt = /(?:Z|[+-]\d{2}:?\d{2})$/.test(timestamp) ? timestamp : timestamp + offset;
    if (!Number.isFinite(Date.parse(broadcastAt))) return [];
    return [{ id: `live-channel13-${e.id ?? hash(results).slice(0, 12)}`, pollster: "Channel 13", firm: null, fieldwork: null, published: frozen.inputs.results.election, broadcastAt, via: "Channel 13 direct structured timeline", url, n: null, margin: null, note: null, results, combined: [], kind: "exit" as const }];
  }));
}
export const BROADCASTERS = [
  { publisher: "Channel 12", host: "www.mako.co.il", index: "https://www.mako.co.il/news-israel-elections/2026", env: "LIVE_N12_SOURCE_URL" },
  { publisher: "Channel 13", host: "13tv.co.il", index: "https://13tv.co.il/news/politics/", env: "LIVE_CHANNEL13_SOURCE_URL" },
  { publisher: "Kan 11", host: "www.kan.org.il", index: "https://www.kan.org.il/", env: "LIVE_KAN_SOURCE_URL" },
] as const;
async function read(url: string) {
  const r = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("Broadcaster request unavailable");
  const body = await r.text(); if (body.length > 4000000) throw new Error("Broadcaster response oversized"); return body;
}
export async function acquireDirect(now: string) {
  const results = await Promise.all(BROADCASTERS.map(async (b) => {
    let url: string = b.index;
    const base: LiveSource = { id: b.publisher, publisher: b.publisher, transport: "direct", url, revision: "unavailable", publishedAt: null, observedAt: now, status: "unavailable" };
    try {
      const configured = process.env[b.env];
      if (configured) url = configured;
      else {
        const index = await read(b.index);
        // Discovery is constrained to the known broadcaster host and current election/article paths.
        const links = [...index.matchAll(/href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter((m) => /מדגם/.test(plain(m[2]))).map((m) => new URL(m[1], b.index)).filter((u) => u.hostname === b.host && /(?:2026|Article-|\/item\/news\/)/.test(u.pathname));
        if (!links.length) throw new Error("No current exit-poll article discovered");
        url = links[0].href;
      }
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || parsed.hostname !== b.host || parsed.username || parsed.password) throw new Error("Broadcaster URL rejected");
      const html = await read(url);
      // N12's captured 2022 page has only an external story embed, not a complete structured estimate.
      // Kan is often403. These failures remain explicit rather than reading image text as a complete poll.
      const polls = (b.publisher === "Channel 13" ? channel13Candidates(html, url) : []).filter((p) => Date.parse(p.broadcastAt!) >= Date.parse(frozen.inputs.results.pollsClose) && Date.parse(p.broadcastAt!) <= Date.parse(now));
      const newest = polls.toSorted((a,b) => Date.parse(b.broadcastAt!) - Date.parse(a.broadcastAt!))[0];
      const source = { ...base, url, revision: hash(polls), publishedAt: newest?.broadcastAt ?? null, status: polls.length ? "valid" as const : "unavailable" as const, note: polls.length ? "Complete isolated structured timeline estimate" : "No supported complete structured estimate; image/embed-only data is not ingested" };
      return { polls, source };
    } catch { return { polls: [] as Poll[], source: { ...base, url, note: "Broadcaster acquisition or verified schema unavailable" } }; }
  }));
  return { polls: results.flatMap((r) => r.polls), sources: results.map((r) => r.source) };
}
