import { importFromWikitext } from "../pollimport";
import type { Poll, PollsFile } from "../types";
import frozen from "../../data/live-forecast-prior.json";
import sourceConfig from "../../data/poll-sources.json";
import type { LiveSource } from "./types";
import { hash, modelRevision } from "./model";
import { acquireDirect } from "./direct";
import { acquireOfficial } from "./official";

export const DIRECT_ADAPTERS = [
  { publisher: "N12", url: "https://www.mako.co.il/news-politics" },
  { publisher: "Channel 13", url: "https://13tv.co.il/news/politics/" },
  { publisher: "Kan", url: "https://www.kan.org.il/" },
] as const;
// News homepages are not data feeds. No scraping partial numbers or pretending an unverified endpoint succeeded.
export function latestPublisherRevisions(polls: Poll[]) {
  const latest = new Map<string, Poll>();
  for (const p of polls) {
    const old = latest.get(p.pollster);
    const timestamp = (q: Poll) => Date.parse(q.broadcastAt ?? q.published);
    const direct = (q: Poll) => q.via === "Channel 13 direct structured timeline" ? 1 : 0;
    if (!old || timestamp(p) > timestamp(old) || (timestamp(p) === timestamp(old) && (direct(p) > direct(old) || (direct(p) === direct(old) && hash(p) > hash(old))))) latest.set(p.pollster, p);
  }
  return [...latest.values()].sort((a, b) => a.pollster.localeCompare(b.pollster));
}
/** A successfully checked publisher's direct estimate is authoritative over a mirror's inferred observation time.
 * If that direct acquisition fails, retain the latest validated fallback/previous estimate instead.
 */
export function selectPublisherInputs(previous: Poll[], fallback: Poll[], currentDirect: Poll[]) {
  const selected = new Map(latestPublisherRevisions([...previous, ...fallback]).map((p) => [p.pollster, p]));
  for (const p of latestPublisherRevisions(currentDirect)) selected.set(p.pollster, p);
  return [...selected.values()].sort((a, b) => a.pollster.localeCompare(b.pollster));
}
export function validExit(p: Poll, now: number): boolean {
  const close = Date.parse(frozen.inputs.results.pollsClose), published = Date.parse(p.broadcastAt ?? frozen.inputs.results.pollsClose);
  const ids = new Set(frozen.inputs.partyFile.parties.map((p) => p.id));
  const entries = Object.entries(p.results);
  const allIds = [...entries.map(([id]) => id), ...p.combined.flatMap((g) => g.parties)];
  return p.kind === "exit" && now >= close && published >= close && published <= now && p.published === frozen.inputs.results.election && frozen.inputs.pollFile.config.pollsters.includes(p.pollster) && !frozen.inputs.pollFile.config.withoutVariant.pollsters.includes(p.pollster) && allIds.every((id) => ids.has(id)) && new Set(allIds).size === allIds.length && entries.every(([, r]) => Number.isInteger(r.seats) && r.seats >= 0) && p.combined.every((g) => g.parties.length > 0 && Number.isInteger(g.seats) && g.seats >= 0) && entries.reduce((n, [, r]) => n + r.seats, 0) + p.combined.reduce((n, g) => n + g.seats, 0) === 120;
}
export async function acquireSources(now: string, previousExits: Poll[] = []) {
  const [direct, official] = await Promise.all([acquireDirect(now), acquireOfficial(now)]);
  const directPolls = direct.polls.filter((p) => validExit(p, Date.parse(now)));
  const sources: LiveSource[] = direct.sources.map((s) => s.status === "valid" && !directPolls.some((p) => p.pollster === s.publisher) ? { ...s, status: "rejected", note: "Historical, future, or invalid exit estimate rejected" } : s);
  sources.push(official);
  try {
  // Wikipedia's revision timestamp describes the page; do not mislabel it as a broadcaster publication time.
  const page = sourceConfig.wikipedia.page;
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp|content&rvslots=main&format=json&titles=${encodeURIComponent(page)}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "IsraeliElection2026-live-forecast/1.0" } });
  if (!response.ok) throw new Error("Wikipedia acquisition failed");
  const payload = await response.json();
  const pages = Object.values(payload.query?.pages ?? {}) as { revisions?: { revid: number; timestamp: string; slots: { main: { "*": string } } }[] }[];
  const revision = pages[0]?.revisions?.[0];
  if (!revision || Date.parse(revision.timestamp) > Date.parse(now) || typeof revision.slots?.main?.["*"] !== "string") throw new Error("Malformed Wikipedia revision");
  const file = { ...frozen.inputs.pollFile, polls: [...frozen.inputs.pollFile.polls, ...previousExits] } as PollsFile;
  const report = importFromWikitext(revision.slots.main["*"], revision.revid, { ...sourceConfig.wikipedia, election: frozen.inputs.results.election, pollsClose: frozen.inputs.results.pollsClose }, file, new Set(frozen.inputs.partyFile.parties.map((p) => p.id)), now.slice(0, 10), now);
  if (report.blockers.length) throw new Error("Wikipedia validation blocked unmapped data");
  const exits = selectPublisherInputs(previousExits.filter((p) => validExit(p, Date.parse(now))), report.accepted.filter((p) => validExit(p, Date.parse(now))), directPolls);
  sources.push({ id: "wikipedia", publisher: "Wikipedia (validated broadcaster fallback)", transport: "wikipedia", url: `https://en.wikipedia.org/w/index.php?oldid=${revision.revid}`, revision: String(revision.revid), publishedAt: null, observedAt: now, status: "valid", note: report.review.length ? "Some candidates rejected by existing poll validation" : "Publication time is not supplied by the page revision timestamp" });
  return { exits, sources, revision: inputRevision(exits) };
  } catch {
    sources.push({id:"wikipedia",publisher:"Wikipedia",transport:"wikipedia",url:"https://en.wikipedia.org/wiki/" + encodeURIComponent(sourceConfig.wikipedia.page),revision:"unavailable",publishedAt:null,observedAt:now,status:"unavailable",note:"Fallback acquisition or validation failed"});
    if (!directPolls.length) throw new Error("No valid current acquisition");
    const exits = selectPublisherInputs(previousExits.filter((p) => validExit(p, Date.parse(now))), [], directPolls);
    return {exits,sources,revision:inputRevision(exits)};
  }
}

// Equivalent estimates from mirror transports do not double their weight or create a new model revision.
export const inputRevision = modelRevision;
