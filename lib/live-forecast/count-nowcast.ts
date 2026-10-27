/**
 * Count-informed nowcast: the votes already counted plus a projection of the votes not yet counted.
 *
 * Reporting order is not random (small Jewish localities and kibbutzim report early, big cities and
 * double envelopes late), so the partial tally is a biased sample. Instead of extrapolating its shares,
 * each 2022 locality carries a prior profile (its 2022 vote pattern, reconciled to the exit-informed
 * national prior by `historicalProfiles`). In the counted places we compare what was counted with what
 * that profile expected; the per-list ratio (actual / expected) is the swing the prior missed. It is
 * shrunk toward 1 while little is counted and then applied to every uncounted locality's own profile.
 * A list that is strong where counting is early is therefore not overstated, and a list that
 * underperforms its profile everywhere is marked down everywhere, including where nothing is counted yet.
 *
 * Coverage: with the per-ballot-box file (expb.csv) each counted box carries its own eligible voters, so
 * the counted share of a locality is counted-box eligible / that locality's expected roll. With only the
 * per-locality file (expc.csv) a locality row's eligible may be its full roll even while partly counted,
 * so coverage there is measured as counted valid votes / the valid votes expected (2022 valid x turnout
 * ratio), never as eligible voters of reporting places.
 *
 * Below `minCoverage` the nowcast returns the prior unchanged (mode "prior").
 */
import { allocate } from "../results";
import { isEnvelopeCode, splitCsv, type VoteMapElection } from "../votemap";
import { historicalProfiles, PROFILES_2022, type ProfileMap } from "./geography";

export const OTHER = "other";
export type Observed = {
  code: number;
  valid: number;
  /** Party id (or OTHER) -> votes. */
  votes: Record<string, number>;
  /** Eligible voters of the counted ballot boxes (expb.csv only). */
  countedEligible?: number;
  boxes?: number;
};
export type CountObservation = { localities: Observed[]; envelope: { valid: number; votes: Record<string, number> }; source: "expb" | "expc" };

function integer(s: string | undefined) {
  if (s === undefined || !/^\d+$/.test(s)) throw new Error("count file: invalid number");
  return Number(s);
}
function readRows(csv: string, letters: Record<string, string>, boxLevel: boolean): CountObservation {
  const { head, rows } = splitCsv(csv);
  const col = (name: string) => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`count file: no "${name}" column`);
    return i;
  };
  const iCode = col("סמל ישוב"), iElig = col("בזב"), iValid = col("כשרים");
  // expb has two bookkeeping columns between "כשרים" and the ballot letters.
  const firstLetter = boxLevel ? Math.max(iValid, head.indexOf("חיצוניות"), head.indexOf("קלפי אחרת")) + 1 : iValid + 1;
  const letterCols = head.slice(firstLetter).map((l, k) => [firstLetter + k, letters[l] ?? OTHER] as const);
  const byCode = new Map<number, Observed>();
  const envelope = { valid: 0, votes: {} as Record<string, number> };
  for (const r of rows) {
    const code = integer(r[iCode]), valid = integer(r[iValid]);
    const votes: Record<string, number> = {};
    let sum = 0;
    for (const [i, id] of letterCols) {
      const n = integer(r[i]);
      votes[id] = (votes[id] ?? 0) + n;
      sum += n;
    }
    if (sum !== valid) throw new Error("count file: list votes do not sum to valid");
    if (isEnvelopeCode(code)) {
      envelope.valid += valid;
      for (const id in votes) envelope.votes[id] = (envelope.votes[id] ?? 0) + votes[id];
      continue;
    }
    const o = byCode.get(code) ?? { code, valid: 0, votes: {}, ...(boxLevel ? { countedEligible: 0, boxes: 0 } : {}) };
    if (!boxLevel && byCode.has(code)) throw new Error("count file: duplicate locality");
    o.valid += valid;
    for (const id in votes) o.votes[id] = (o.votes[id] ?? 0) + votes[id];
    if (boxLevel) {
      o.countedEligible! += integer(r[iElig]);
      o.boxes! += 1;
    }
    byCode.set(code, o);
  }
  return { localities: [...byCode.values()], envelope, source: boxLevel ? "expb" : "expc" };
}
/** expc.csv: one row per locality, aggregated over its counted boxes. Unmapped letters become OTHER. */
export const parseLocalities = (csv: string, letters: Record<string, string>) => readRows(csv, letters, false);
/** expb.csv: one row per counted ballot box with that box's own eligible voters. */
export const parseBoxes = (csv: string, letters: Record<string, string>) => readRows(csv, letters, true);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type NowcastResult = {
  mode: "prior" | "count";
  coverage: {
    /** Counted valid votes (localities, not envelopes) / valid votes expected in localities. */
    votes: number;
    /** Counted-box eligible / expected roll; null without the per-box file. */
    eligible: number | null;
    localitiesReporting: number;
    boxesCounted: number | null;
    envelopesCounted: number;
  };
  /** Turnout ratio used: 2026 valid votes / 2022 valid votes, per locality. */
  turnoutRatio: number;
  /** Per-list actual/expected ratio in the counted places, after shrinkage. */
  swing: Record<string, number>;
  counted: Record<string, number>;
  projected: Record<string, number>;
  shares: Record<string, number>;
  seats: Record<string, number>;
  /** 80% intervals from resampling the swing and turnout error of the uncounted part. */
  intervals: Record<string, { lo: number; hi: number }>;
};

export function countNowcast({
  history,
  prior,
  observation,
  threshold,
  agreements,
  profileMap = PROFILES_2022,
  rollGrowth = 1.045,
  turnoutRatio,
  minCoverage = 0.05,
  pseudoVotes = 150_000,
  draws = 1000,
  seed = 26,
}: {
  history: VoteMapElection;
  /** Exit-informed national vote shares by party id; may include OTHER for lists not modelled. */
  prior: Record<string, number>;
  observation: CountObservation;
  threshold: number;
  agreements: [string, string][];
  profileMap?: ProfileMap;
  /** 2026 roll / 2022 roll, used only to turn counted-box eligible into a locality coverage share. */
  rollGrowth?: number;
  /** Override for 2026/2022 valid votes per locality; otherwise estimated from the box file, else 1. */
  turnoutRatio?: number;
  minCoverage?: number;
  /** Prior strength in votes: how many counted votes it takes for the observed swing to count half. */
  pseudoVotes?: number;
  draws?: number;
  seed?: number;
}): NowcastResult {
  const otherShare = prior[OTHER] ?? 0;
  const named = Object.fromEntries(Object.entries(prior).filter(([id]) => id !== OTHER));
  const namedTotal = Object.values(named).reduce((a, b) => a + b, 0);
  const ids = Object.keys(named), all = otherShare > 0 ? [...ids, OTHER] : ids;
  const profiles = historicalProfiles(history, named, profileMap);
  const score = (p: (typeof profiles)[number], id: string) =>
    id === OTHER ? otherShare / (namedTotal + otherShare) : (p.scores[id] * namedTotal) / (namedTotal + otherShare);
  const histByCode = new Map(history.rows.map((r) => [r[0], r]));
  const obsByCode = new Map(observation.localities.map((o) => [o.code, o]));
  for (const code of obsByCode.keys()) if (!histByCode.has(code)) obsByCode.delete(code); // new localities: counted below, no profile

  // Turnout ratio: from boxes, counted valid over 2022 valid scaled to the share of the roll counted.
  let T = turnoutRatio ?? 1;
  if (turnoutRatio === undefined && observation.source === "expb") {
    let num = 0, den = 0;
    for (const o of obsByCode.values()) {
      const h = histByCode.get(o.code)!;
      if (!h[1] || !o.countedEligible) continue;
      num += o.valid;
      den += (h[3] * Math.min(1, o.countedEligible / (h[1] * rollGrowth)));
    }
    if (den > 50_000) T = (num + 200_000) / (den + 200_000); // shrink toward 1 early
  }

  // Remaining expected valid votes per locality.
  const rows = profiles.map((p) => {
    const h = histByCode.get(p.code)!, o = obsByCode.get(p.code);
    const expected = p.expectedValid * T;
    let fraction = 0;
    if (o) fraction = o.countedEligible !== undefined && h[1] ? Math.min(1, o.countedEligible / (h[1] * rollGrowth)) : Math.min(1, o.valid / Math.max(1, expected));
    return { p, o, expected, remaining: expected * (1 - fraction) };
  });

  const expectedLocal = rows.reduce((n, r) => n + r.expected, 0);
  const countedLocal = observation.localities.reduce((n, o) => n + o.valid, 0);
  const coverageVotes = Math.min(1, countedLocal / Math.max(1, expectedLocal));
  const coverageEligible =
    observation.source === "expb"
      ? Math.min(1, observation.localities.reduce((n, o) => n + (o.countedEligible ?? 0), 0) / (history.national.eligible * rollGrowth))
      : null;

  // Swing in counted places: actual votes per list vs what the locality's prior profile expected.
  const actual: Record<string, number> = Object.fromEntries(all.map((id) => [id, 0]));
  const expectedThere: Record<string, number> = Object.fromEntries(all.map((id) => [id, 0]));
  let c = 0;
  for (const r of rows) {
    if (!r.o) continue;
    c += r.o.valid;
    for (const id of all) {
      actual[id] += r.o.votes[id] ?? 0;
      expectedThere[id] += r.o.valid * score(r.p, id);
    }
  }
  const weight = c / (c + pseudoVotes);
  const swing = Object.fromEntries(all.map((id) => [id, expectedThere[id] > 0 ? 1 + weight * (actual[id] / expectedThere[id] - 1) : 1]));

  const envHistoryValid = history.envelopes.valid * T;
  const envRemaining = Math.max(0, envHistoryValid - observation.envelope.valid);
  // Envelope prior: 2022 envelope pattern rescaled by each list's national prior / 2022 national share.
  const envScore = (() => {
    const out: Record<string, number> = {};
    const natValid = history.national.valid;
    for (const id of ids) {
      const idx = profileMap[id].map((l) => history.lists.findIndex((x) => x.letters === l));
      const env = idx.reduce((n, i) => n + (history.envelopes.votes[i] ?? 0), 0) / Math.max(1, history.envelopes.valid);
      const nat = idx.reduce((n, i) => n + history.lists[i].votes, 0) / natValid;
      out[id] = Math.max(1e-8, nat > 0 ? (env / nat) * named[id] : named[id]);
    }
    if (otherShare > 0) out[OTHER] = otherShare;
    const s = Object.values(out).reduce((a, b) => a + b, 0);
    for (const id in out) out[id] /= s;
    return out;
  })();

  const counted: Record<string, number> = Object.fromEntries(all.map((id) => [id, 0]));
  for (const o of observation.localities) for (const id of all) counted[id] += o.votes[id] ?? 0;
  for (const id of all) counted[id] += observation.envelope.votes[id] ?? 0;
  const countedOther = [...observation.localities, observation.envelope].reduce(
    (n, o) => n + Object.entries(o.votes).filter(([id]) => !all.includes(id)).reduce((m, [, v]) => m + v, 0),
    0,
  );

  const project = (sw: Record<string, number>, turnoutScale: number) => {
    const v: Record<string, number> = Object.fromEntries(all.map((id) => [id, counted[id]]));
    for (const r of rows) {
      if (!r.remaining) continue;
      const w = all.map((id) => score(r.p, id) * sw[id]), s = w.reduce((a, b) => a + b, 0);
      all.forEach((id, k) => (v[id] += (r.remaining * turnoutScale * w[k]) / s));
    }
    const ew = all.map((id) => envScore[id] * sw[id]), es = ew.reduce((a, b) => a + b, 0);
    all.forEach((id, k) => (v[id] += (envRemaining * turnoutScale * ew[k]) / es));
    return v;
  };
  const seatsOf = (v: Record<string, number>) => {
    const valid = Object.values(v).reduce((a, b) => a + b, 0) + countedOther;
    const lists = Object.fromEntries(Object.entries(v).filter(([id]) => id !== OTHER));
    return allocate(lists, valid, threshold, agreements).seats;
  };

  const mode = coverageVotes >= minCoverage ? "count" : "prior";
  const usedSwing = mode === "count" ? swing : Object.fromEntries(all.map((id) => [id, 1]));
  const point = project(usedSwing, 1);
  const total = Object.values(point).reduce((a, b) => a + b, 0) + countedOther;
  const seats = seatsOf(point);

  // Uncertainty on the uncounted part: list swing error shrinks as more is counted; locality-level
  // correlation is not modelled, so the spread is widened by a fixed factor.
  const random = rng(seed), normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random());
  const sd = 0.12 * Math.sqrt(1 - weight) + 0.03;
  const samples: Record<string, number[]> = Object.fromEntries(ids.map((id) => [id, []]));
  for (let d = 0; d < draws; d++) {
    const sw = Object.fromEntries(all.map((id) => [id, usedSwing[id] * Math.exp(sd * normal())]));
    const s = seatsOf(project(sw, Math.exp(0.05 * normal())));
    for (const id of ids) samples[id].push(s[id] ?? 0);
  }
  const q = (xs: number[], p: number) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
  };
  return {
    mode,
    coverage: {
      votes: coverageVotes,
      eligible: coverageEligible,
      localitiesReporting: observation.localities.length,
      boxesCounted: observation.source === "expb" ? observation.localities.reduce((n, o) => n + (o.boxes ?? 0), 0) : null,
      envelopesCounted: observation.envelope.valid,
    },
    turnoutRatio: T,
    swing: usedSwing,
    counted,
    projected: point,
    shares: Object.fromEntries(Object.entries(point).map(([id, v]) => [id, v / total])),
    seats,
    intervals: Object.fromEntries(ids.map((id) => [id, { lo: q(samples[id], 0.1), hi: q(samples[id], 0.9) }])),
  };
}
