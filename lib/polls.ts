import type { BlocId, Party, Poll, PollsConfig } from "./types";
import type { Lang } from "./i18n";
import { pollsterText } from "./i18n/overlays";

const DAY = 86_400_000;

/** Newest first; ties broken by pollster name so the order is stable. */
export function byNewest(a: Poll, b: Poll): number {
  return b.published.localeCompare(a.published) || a.pollster.localeCompare(b.pollster);
}

/**
 * The polls the site treats as "now": each pollster's latest poll, if published within
 * `currentWindowDays` of the newest poll overall. Every pollster on the whitelist is in
 * (ruling 111: firms are in or out by firm and stated method, never by result); the
 * Filber-free variant is a filter over this list, see `withoutVariantPolls`.
 */
/** An election-night exit poll rather than a campaign poll. */
export const isExit = (p: Poll) => p.kind === "exit";

export function currentPolls(polls: Poll[], config: PollsConfig): Poll[] {
  const sorted = polls.filter((p) => !isExit(p)).sort(byNewest);
  if (!sorted.length) return [];
  const cutoff = Date.parse(sorted[0].published) - config.currentWindowDays * DAY;
  const seen = new Set<string>();
  const out: Poll[] = [];
  for (const p of sorted) {
    if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue;
    seen.add(p.pollster);
    out.push(p);
  }
  return out;
}

/** True for a poll the second average leaves out (Shlomo Filber's firms). */
export function inWithoutVariant(poll: Poll, config: PollsConfig): boolean {
  return config.withoutVariant.pollsters.includes(poll.pollster);
}

/** The polls behind the second average: `polls` minus the pollsters named in `config.withoutVariant`. */
export function withoutVariantPolls(polls: Poll[], config: PollsConfig): Poll[] {
  return polls.filter((p) => !inWithoutVariant(p, config));
}

export function pollLabel(p: Poll, lang: Lang = "en"): string {
  if (lang === "he") {
    // Israeli desks credit the outlet ("חדשות 12"), the firm after it; an exit poll is the channel's מדגם.
    const outlet = pollsterText(p.pollster, "he").text;
    const firm = p.firm ? pollsterText(p.firm, "he").text : null;
    const heName = isExit(p) ? `מדגם ${outlet}` : outlet;
    return firm ? `${heName} / ${firm}` : heName;
  }
  const name = isExit(p) ? `${p.pollster} exit poll` : p.pollster;
  return p.firm ? `${name} / ${p.firm}` : name;
}

/** Seats for a party in a poll, or null when the poll did not report it separately. */
export function seatsIn(poll: Poll, partyId: string): number | null {
  const r = poll.results[partyId];
  return r ? r.seats : null;
}

export type Average = {
  /** Weighted mean seats over the polls where the list passed; 0 if it passed in none. */
  avg: number;
  /** Polls where the list passed the threshold (seats > 0, not below). */
  k: number;
  /** Polls that reported the list separately (passed or below). */
  n: number;
  /** Passed in fewer than half of the polls that reported it (ruling 110). */
  nearThreshold: boolean;
  /** What the list counts for in a seat total: `avg`, or 0 when near or below the threshold. */
  seats: number;
};

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Poll weights (ruling 111): the square root of the sample size. A poll whose sample size we do
 * not have gets the median known sample size of `polls`, so it counts as a typical poll of the set
 * rather than being dropped or over-counted; if no poll in the set has one, every poll weighs 1.
 */
export function pollWeights(polls: Poll[]): Map<Poll, number> {
  const known = polls.map((p) => p.n).filter((n): n is number => typeof n === "number" && n > 0);
  const fallback = known.length ? median(known) : 1;
  return new Map(polls.map((p) => [p, Math.sqrt(p.n && p.n > 0 ? p.n : fallback)]));
}

const passed = (r: Poll["results"][string] | undefined): boolean => !!r && r.seats > 0 && !r.belowThreshold;

/**
 * A list's average (ruling 110): the √n-weighted mean of its seats over the polls where it passed,
 * so a passing list never averages below 4. `k of n` says how many of the polls that reported it
 * had it passing; under half is "near the threshold" and counts 0 in seat totals. Null if no poll
 * reported the list separately.
 */
export function average(partyId: string, polls: Poll[]): Average | null {
  const w = pollWeights(polls);
  const reported = polls.filter((p) => p.results[partyId]);
  if (!reported.length) return null;
  const passing = reported.filter((p) => passed(p.results[partyId]));
  const wsum = passing.reduce((a, p) => a + w.get(p)!, 0);
  const avg = passing.length ? passing.reduce((a, p) => a + w.get(p)! * p.results[partyId].seats, 0) / wsum : 0;
  const k = passing.length;
  const n = reported.length;
  const nearThreshold = k > 0 && k < n / 2;
  return { avg, k, n, nearThreshold, seats: k === 0 || nearThreshold ? 0 : avg };
}

/** Seats by bloc in one poll, including seats reported only for a group of same-bloc parties. */
export function blocTotals(poll: Poll, parties: Party[]): Record<BlocId, number> {
  const t: Record<BlocId, number> = { net: 0, opp: 0, mid: 0, arab: 0 };
  const bloc = new Map(parties.map((p) => [p.id, p.bloc]));
  for (const [id, r] of Object.entries(poll.results)) {
    const b = bloc.get(id);
    if (b) t[b] += r.seats;
  }
  for (const c of poll.combined) {
    const b = bloc.get(c.parties[0]);
    if (b && c.parties.every((id) => bloc.get(id) === b)) t[b] += c.seats;
  }
  return t;
}

/** Total seats a poll accounts for (should be 120). */
export function pollTotal(poll: Poll): number {
  return (
    Object.values(poll.results).reduce((a, r) => a + r.seats, 0) +
    poll.combined.reduce((a, c) => a + c.seats, 0)
  );
}

export const AVERAGE_ID = "avg";

/**
 * The current average expressed as a pseudo-poll, so the Coalition Builder can count with it.
 * Seats are each list's average (see `average`) to one decimal; a list below the threshold in
 * every poll, or near it (passing in under half), is marked below and counts 0.
 */
export function averageAsPoll(polls: Poll[], partyIds: string[], opts: { id?: string; label?: string } = {}): Poll {
  const raw = new Map<string, number>();
  for (const id of partyIds) {
    const a = average(id, polls);
    if (a) raw.set(id, a.seats);
  }
  // Averaging each list only where it passed overcounts when small lists sometimes fail, so the
  // lists can add to more than 120. Coalition arithmetic needs 120: scale down in proportion.
  const sum = [...raw.values()].reduce((s, v) => s + v, 0);
  const scale = sum > 120 ? 120 / sum : 1;
  const results: Poll["results"] = {};
  for (const [id, v] of raw) {
    const seats = Math.round(v * scale * 10) / 10;
    results[id] = seats === 0 ? { seats: 0, belowThreshold: true } : { seats };
  }
  return {
    id: opts.id ?? AVERAGE_ID,
    pollster: opts.label ?? "Average",
    firm: null,
    fieldwork: null,
    published: [...polls].sort(byNewest)[0]?.published ?? "",
    via: null,
    url: null,
    n: null,
    margin: null,
    note: `Mean of ${polls.length} polls weighted by the square root of sample size, each list over the polls where it passed${scale < 1 ? `, scaled from ${Math.round(sum * 10) / 10} to 120 seats` : ""}: ${polls.map((p) => p.pollster).join(", ")}.`,
    results,
    combined: [],
  };
}

/** The bloc order for every list, key and table on the site: the two contenders first, as the home race reads. */
export const BLOC_ORDER: readonly BlocId[] = ["net", "opp", "mid", "arab"];
/** The same blocs along a 120-seat bar or grid, as the home mosaic draws them: the unaligned list sits between the two blocs. */
export const BLOC_SEAT_ORDER: readonly BlocId[] = ["net", "mid", "opp", "arab"];
export const blocRank = (b: BlocId) => BLOC_ORDER.indexOf(b);
/** What every average seat figure is called. The figures are each list's average scaled to 120 (see `averageAsPoll`). */
export const SEATS_LABEL = "Seats, polling average";
/** An average seat figure as the home race prints it: one decimal, always. Single polls print whole seats. */
export const seatFigure = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
/** A list's figure in the average poll: "below" when it counts 0 for the threshold, null when no poll reported it separately. */
export function seatText(poll: Poll, partyId: string, averaged = poll.id === AVERAGE_ID): string | null {
  const r = poll.results[partyId];
  if (!r) return null;
  return r.belowThreshold || r.seats === 0 ? "below" : averaged ? seatFigure(r.seats) : String(r.seats);
}
