/**
 * Election-night results: the Central Elections Committee's per-locality CSV → national
 * votes per list → seats.
 *
 * Seats follow the Knesset Elections Law: lists under the threshold are dropped; the
 * passing lists share 120 seats by the Bader-Ofer method (whole quotients first, then each
 * remaining seat to the highest votes ÷ (seats + 1)), with a surplus-vote agreement counted
 * as one list and its seats then split between the two the same way. An agreement counts
 * only if both lists pass the threshold.
 */
import { KNESSET } from "./coalition";
import type { Poll } from "./types";
import type { Lang } from "./i18n";
import resultsText from "./i18n/results";

export type ResultsConfig = {
  updated: string;
  election: string;
  pollsClose: string;
  source: { url: string; label: string; note: string };
  threshold: number;
  thresholdSource: string;
  letters: Record<string, string>;
  lettersSource: string;
  agreements: { parties: string[]; status: "signed" | "reported" | string; source: string }[];
  agreementsNote: string;
  /** The committee's published total of eligible voters, once it is published. */
  roll?: { eligible: number; source: string };
};

export type Count = {
  /** Eligible voters in the localities counted so far. */
  eligible: number;
  voted: number;
  invalid: number;
  valid: number;
  /** Votes per ballot letter. */
  votes: Record<string, number>;
  localities: number;
  /** Double-envelope votes are not a geographic locality or a turnout denominator. */
  envelopes?: { present: boolean; voted: number; valid: number };
};

/** Parse the committee's expc.csv (one row per locality; columns after "כשרים" are ballot letters). */
export function parseExpc(csv: string): Count {
  const rows = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
  const head = rows[0];
  while (head.at(-1) === "") { head.pop(); rows.slice(1).forEach((r) => { if (r.at(-1) === "") r.pop(); }); }
  const col = (name: string) => { const i = head.indexOf(name); if (i < 0) throw new Error(`expc.csv: no "${name}" column`); return i; };
  const [iCode, iElig, iVoted, iInvalid, iValid] = [col("סמל ישוב"), col("בזב"), col("מצביעים"), col("פסולים"), col("כשרים")];
  if (iValid === head.length - 1 || new Set(head.slice(iValid + 1)).size !== head.length - iValid - 1) throw new Error("expc.csv: invalid ballot columns");
  const count: Count = { eligible: 0, voted: 0, invalid: 0, valid: 0, votes: {}, localities: 0, envelopes: { present: false, voted: 0, valid: 0 } };
  const seen = new Set<string>();
  const integer = (s: string) => { if (!/^\d+$/.test(s)) throw new Error("expc.csv: invalid vote number"); const n = Number(s); if (!Number.isSafeInteger(n)) throw new Error("expc.csv: unsafe vote number"); return n; };
  for (const row of rows.slice(1)) {
    if (row.length !== head.length || !row[iCode] || seen.has(row[iCode])) throw new Error("expc.csv: truncated or duplicate locality");
    seen.add(row[iCode]);
    const [eligible, voted, invalid, valid] = [iElig, iVoted, iInvalid, iValid].map((i) => integer(row[i]));
    const envelope = /^9{4,5}$/.test(row[iCode]);
    const votes = row.slice(iValid + 1).map(integer);
    if (voted !== valid + invalid || votes.reduce((a, b) => a + b, 0) !== valid || (!envelope && voted > eligible)) throw new Error("expc.csv: inconsistent totals");
    if (envelope) { count.envelopes!.present = true; count.envelopes!.voted += voted; count.envelopes!.valid += valid; }
    else { count.localities++; count.eligible += eligible; }
    count.voted += voted; count.invalid += invalid; count.valid += valid;
    votes.forEach((n, i) => { const letter = head[iValid + 1 + i]; count.votes[letter] = (count.votes[letter] ?? 0) + n; });
  }
  return count;
}

/** Bader-Ofer (equivalent to D'Hondt) over units with given votes. */
function share(units: { key: string; votes: number }[], seats: number): Record<string, number> {
  const out: Record<string, number> = {};
  const total = units.reduce((s, u) => s + u.votes, 0);
  if (!total || !seats) return Object.fromEntries(units.map((u) => [u.key, 0]));
  const quota = total / seats;
  let given = 0;
  for (const u of units) given += out[u.key] = Math.floor(u.votes / quota);
  while (given < seats) {
    let best = units[0];
    for (const u of units) if (u.votes / (out[u.key] + 1) > best.votes / (out[best.key] + 1)) best = u;
    out[best.key]++;
    given++;
  }
  return out;
}

export type Allocation = {
  /** Seats per ballot letter (passing lists only). */
  seats: Record<string, number>;
  passing: string[];
  thresholdVotes: number;
  /** Agreements that took effect (both lists passed). */
  agreements: [string, string][];
};

/** Allocate seats from votes per ballot letter. Agreements are given as letter pairs. */
export function allocate(votes: Record<string, number>, valid: number, threshold: number, agreements: [string, string][]): Allocation {
  const thresholdVotes = valid * threshold;
  const passing = Object.keys(votes).filter((k) => votes[k] >= thresholdVotes && votes[k] > 0);
  const live = agreements.filter(([a, b]) => passing.includes(a) && passing.includes(b));
  const paired = new Map<string, [string, string]>();
  for (const pair of live) for (const k of pair) paired.set(k, pair);
  // Whole quotients go to each list on its own (s. 81(b)); only the remaining seats are
  // shared out with an agreement counted as one list (s. 81(c)).
  const total = passing.reduce((s, k) => s + votes[k], 0);
  const quota = total / KNESSET;
  const units: { key: string; votes: number; seats: number }[] = [];
  for (const k of passing) {
    const pair = paired.get(k);
    if (!pair) units.push({ key: k, votes: votes[k], seats: Math.floor(votes[k] / quota) });
    else if (pair[0] === k)
      units.push({
        key: pair.join("+"),
        votes: votes[pair[0]] + votes[pair[1]],
        seats: Math.floor(votes[pair[0]] / quota) + Math.floor(votes[pair[1]] / quota),
      });
  }
  let given = units.reduce((s, u) => s + u.seats, 0);
  while (total && given < KNESSET) {
    let best = units[0];
    for (const u of units) if (u.votes / (u.seats + 1) > best.votes / (best.seats + 1)) best = u;
    best.seats++;
    given++;
  }
  const unitSeats = Object.fromEntries(units.map((u) => [u.key, u.seats]));
  const seats: Record<string, number> = {};
  for (const u of units) {
    const pair = u.key.includes("+") ? (u.key.split("+") as [string, string]) : null;
    if (!pair) seats[u.key] = unitSeats[u.key];
    else Object.assign(seats, share(pair.map((k) => ({ key: k, votes: votes[k] })), unitSeats[u.key]));
  }
  return { seats, passing, thresholdVotes, agreements: live };
}

export type PartyResult = { partyId: string | null; letters: string; votes: number; pct: number; seats: number };

/** The full picture for the page: lists by votes, mapped to party ids where known. */
export function results(count: Count, config: ResultsConfig) {
  const toLetter = Object.fromEntries(Object.entries(config.letters).map(([l, id]) => [id, l]));
  const pairs = config.agreements
    .map((a) => a.parties.map((id) => toLetter[id]))
    .filter((p): p is [string, string] => p.length === 2 && p.every(Boolean));
  const alloc = allocate(count.votes, count.valid, config.threshold, pairs);
  const lists: PartyResult[] = Object.entries(count.votes)
    .filter(([, v]) => v > 0)
    .map(([letters, votes]) => ({
      partyId: config.letters[letters] ?? null,
      letters,
      votes,
      pct: count.valid ? votes / count.valid : 0,
      seats: alloc.seats[letters] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  return { lists, alloc, unknownLetters: Object.keys(count.votes).filter((l) => !(l in config.letters)) };
}

/** Before polls close the committee's file holds test data, which must never be shown. */
export function resultsOpen(config: ResultsConfig, now = Date.now()): boolean {
  return now >= Date.parse(config.pollsClose);
}

export const RESULTS_ID = "results";

/** The count as a pseudo-poll, so the Coalition Builder can use it like any poll. */
export function resultsAsPoll(count: Count, config: ResultsConfig, fetchedAt: string, metadata?: { freshness: "fresh" | "stale"; sourceUpdatedAt: string | null }, lang: Lang = "en"): Poll {
  const { lists, alloc } = results(count, config);
  const out: Poll["results"] = {};
  for (const [letters, id] of Object.entries(config.letters)) {
    const l = lists.find((x) => x.letters === letters);
    const seats = l?.seats ?? 0;
    out[id] = seats ? { seats, pct: `${(l!.pct * 100).toFixed(2)}%` } : { seats: 0, belowThreshold: true, pct: l ? `${(l.pct * 100).toFixed(2)}%` : undefined };
  }
  return {
    id: RESULTS_ID,
    pollster: metadata?.freshness === "stale" ? "Saved results (stale)" : "Results",
    resultState: metadata ? { ...metadata, capturedAt: fetchedAt } : undefined,
    firm: null,
    fieldwork: null,
    published: fetchedAt.slice(0, 10),
    via: config.source.label,
    url: config.source.url,
    n: count.valid,
    margin: null,
    note: resultsText[lang].asPollNote(count.localities, fmtVotes(alloc.thresholdVotes)),
    results: out,
    combined: [],
  };
}

const fmtVotes = (n: number) => Math.round(n).toLocaleString("en-US");

/** Turnout among counted regular localities only; double envelopes have no matching denominator. */
export function countedTurnout(count: Count): number | null {
  return count.eligible ? (count.voted - (count.envelopes?.voted ?? 0)) / count.eligible : null;
}

/** Eligible voters in the localities counted so far, as a share of the committee's roll; null until the roll is published. */
export function rollCounted(count: Count | null, roll?: { eligible: number }): number | null {
  if (!count || !roll?.eligible) return null;
  return Math.min(1, count.eligible / roll.eligible);
}

export type VersusAverage = { partyId: string; seats: number | null; avg: number | null; diff: number | null };

/** Each tracked list's seats from the count beside its final polling average; difference = count seats minus average. */
export function versusAverage(ids: string[], average: Poll, lists: PartyResult[] | null): VersusAverage[] {
  return ids.map((id) => {
    const r = average.results[id];
    const avg = r ? (r.belowThreshold ? 0 : r.seats) : null;
    const seats = lists ? (lists.find((l) => l.partyId === id)?.seats ?? 0) : null;
    return { partyId: id, seats, avg, diff: seats !== null && avg !== null ? Math.round((seats - avg) * 10) / 10 : null };
  });
}
