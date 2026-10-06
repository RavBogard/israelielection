import { pollKey, validatePolls, type Problem } from "./validate";
import { parseTable, seatTables, type RawPoll } from "./wikipolls";
import type { Poll, PollResult, PollsFile } from "./types";

export type WikiSources = {
  page: string;
  importFrom: string;
  headerMap: Record<string, string>;
  untracked: string[];
  publisherMap: Record<string, string>;
  /** Poll keys ("Pollster|YYYY-MM-DD") Daniel has rejected; never proposed again. */
  ignore?: string[];
  /**
   * Election day and the close (from data/results.json, set by the job). A row on election day, or shaded in the
   * table's "Exit poll" colour, is an exit poll: no campaign poll may be published that day.
   */
  election?: string;
  pollsClose?: string;
};

const DAY = 86_400_000;
/** "[[Target|label]]" or "[[Target]]" → plain text. */
const plain = (s: string | null) => s && s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/''/g, "").trim();
/** Wikipedia is editable by anyone: only http(s) URLs are kept as links. */
export function safeUrl(u: string | null): string | null {
  if (!u) return null;
  try {
    const p = new URL(u);
    return p.protocol === "https:" || p.protocol === "http:" ? p.href : null;
  } catch {
    return null;
  }
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function toPoll(raw: RawPoll, src: WikiSources, revision: number | string): Poll {
  // A publisher cell of {{N/A}} means the firm published the poll itself.
  const label = raw.publisherLabel.startsWith("{{") ? "" : raw.publisherLabel;
  const pollster = (raw.publisherTarget && src.publisherMap[raw.publisherTarget]) || label || raw.firm;
  const refOk = raw.ref.date && raw.ref.date >= raw.end && Date.parse(raw.ref.date) - Date.parse(raw.end) <= 7 * DAY;
  const published = refOk ? raw.ref.date! : raw.end;
  const results: Record<string, PollResult> = {};
  for (const [target, r] of raw.readings) {
    if (!r) continue;
    const id = src.headerMap[target];
    if (!id) {
      // Untracked lists: a below-threshold reading is dropped; seats send the poll to review.
      if ("seats" in r) results[`untracked:${target}`] = { seats: r.seats };
      continue;
    }
    const prev = results[id];
    if ("seats" in r) results[id] = { seats: (prev?.seats ?? 0) + r.seats };
    else if (!prev) results[id] = { seats: 0, belowThreshold: true, ...(r.pct ? { pct: r.pct } : {}) };
  }
  const exit = raw.shaded || (!!src.election && raw.end === src.election);
  const poll: Poll = {
    id: exit ? `${slug(pollster)}-exit-${published}` : `${slug(pollster)}-${published}`,
    pollster,
    firm: raw.firm || null,
    fieldwork: raw.fieldwork,
    published,
    via: plain(raw.ref.work),
    url: safeUrl(raw.ref.url),
    n: raw.sample,
    margin: null,
    note: `${exit ? "Exit poll imported" : "Imported"} from Wikipedia (revision ${revision}).`,
    results,
    combined: [],
  };
  return exit ? { ...poll, kind: "exit", ...(src.pollsClose ? { broadcastAt: src.pollsClose } : {}) } : poll;
}

const sameSeats = (a: Poll, b: Poll) => {
  const ids = new Set([...Object.keys(a.results), ...Object.keys(b.results)]);
  return [...ids].every((id) => (a.results[id]?.seats ?? 0) === (b.results[id]?.seats ?? 0) && !!a.results[id]?.belowThreshold === !!b.results[id]?.belowThreshold);
};

/**
 * An exit poll as a new version, or null when the channel's latest version already has these numbers. The
 * channels revise their exit polls through the night (the 2022 updates came near midnight); each revision is
 * kept with the time this job first saw it, and the site shows the latest (lib/results-phase.ts exitRows).
 */
export function exitVersion(p: Poll, existing: Poll[], now: string): Poll | null {
  const mine = existing.filter((q) => q.kind === "exit" && q.pollster === p.pollster);
  const at = (q: Poll) => q.broadcastAt ?? q.published;
  const latest = mine.sort((a, b) => at(b).localeCompare(at(a)))[0];
  if (!latest) return p;
  if (sameSeats(latest, p)) return null;
  return { ...p, id: `${p.id}-${mine.length + 1}`, broadcastAt: now };
}

/** True when `p` is a poll we already hold: same pollster, within 3 days, and ≥80% of shared readings equal. */
export function alreadyHave(p: Poll, existing: Poll[]): boolean {
  return existing.some((q) => {
    if (pollKey(q) === pollKey(p)) return true;
    if (q.pollster !== p.pollster || Math.abs(Date.parse(q.published) - Date.parse(p.published)) > 3 * DAY) return false;
    const shared = Object.keys(p.results).filter((id) => q.results[id]);
    if (!shared.length) return false;
    const same = shared.filter((id) => q.results[id].seats === p.results[id].seats).length;
    return same / shared.length >= 0.8;
  });
}

export type ImportReport = {
  revision: number | string;
  accepted: Poll[];
  /** Polls that failed validation, with the reasons. */
  review: { poll: Poll; problems: Problem[] }[];
  /** Table-level problems (e.g. a new party column) that block import of a table. */
  blockers: string[];
};

export function importFromWikitext(
  wikitext: string,
  revision: number | string,
  src: WikiSources,
  file: PollsFile,
  partyIds: Set<string>,
  today: string,
  /** When this run happened (ISO), the broadcast time given to a revised exit poll. */
  now: string = new Date().toISOString()
): ImportReport {
  const report: ImportReport = { revision, accepted: [], review: [], blockers: [] };
  const known = new Set([...Object.keys(src.headerMap), ...src.untracked]);
  const ignore = new Set(src.ignore ?? []);
  const candidates: Poll[] = [];
  for (const [i, table] of seatTables(wikitext).entries()) {
    const parsed = parseTable(table);
    const recent = parsed.polls.filter((r) => r.end >= src.importFrom);
    if (!recent.length) continue;
    const unmapped = [...new Set(parsed.columns.filter((c) => c.kind === "party" && c.target && !known.has(c.target)).map((c) => c.target!))];
    if (unmapped.length) {
      report.blockers.push(`Table ${i + 1} has party columns with no mapping in data/poll-sources.json: ${unmapped.join(", ")}. Its ${recent.length} polls were not imported.`);
      continue;
    }
    for (const r of recent) {
      const raw = toPoll(r, src, revision);
      if (ignore.has(pollKey(raw))) continue;
      const p = raw.kind === "exit" ? exitVersion(raw, [...file.polls, ...candidates], now) : alreadyHave(raw, [...file.polls, ...candidates]) ? null : raw;
      if (p) candidates.push(p);
    }
  }
  // Oldest first, so each poll is checked against the reading before it.
  candidates.sort((a, b) => a.published.localeCompare(b.published));
  const accepted: Poll[] = [];
  for (const p of candidates) {
    const problems = validatePolls([p], [...file.polls, ...accepted], file.config, partyIds, today);
    if (problems.length) report.review.push({ poll: p, problems });
    else accepted.push(p);
  }
  report.accepted = accepted;
  return report;
}
