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
};

const DAY = 86_400_000;
/** "[[Target|label]]" or "[[Target]]" → plain text. */
const plain = (s: string | null) => s && s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/''/g, "").trim();
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
  return {
    id: `${slug(pollster)}-${published}`,
    pollster,
    firm: raw.firm || null,
    fieldwork: raw.fieldwork,
    published,
    via: plain(raw.ref.work),
    url: raw.ref.url,
    n: raw.sample,
    margin: null,
    note: `Imported from Wikipedia (revision ${revision}).`,
    results,
    combined: [],
  };
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
  today: string
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
      const p = toPoll(r, src, revision);
      if (ignore.has(pollKey(p)) || alreadyHave(p, [...file.polls, ...candidates])) continue;
      candidates.push(p);
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
