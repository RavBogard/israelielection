/**
 * Count-informed nowcast: the votes already counted plus a projection of the votes not yet counted.
 *
 * Reporting order is not random (small Jewish localities and kibbutzim report early, big cities and
 * double envelopes late), so the partial tally is a biased sample. Instead of extrapolating its shares,
 * each 2022 locality carries a prior profile (its 2022 vote pattern, reconciled to the national prior by
 * `historicalProfiles`). In the counted places we compare what was counted with what that profile
 * expected; the per-list ratio (actual / expected) is the swing the prior missed. It is shrunk toward 1
 * per list while little of that list's base is counted and then applied to every uncounted locality's
 * own profile.
 *
 * Volume. Each locality's expected 2026 valid votes are its 2022 valid votes times a turnout ratio
 * estimated per sector (Arab, Haredi, other Jewish localities, classified from their 2022 vote) from the
 * counted ballot boxes: counted valid / the 2022 valid of the same share of the roll. When the expected
 * national valid vote is known (CEC turnout figure) the sector ratios are shrunk toward and rescaled to
 * it, so uncounted places are projected at tonight's volume even while little is counted. The 2022
 * baseline is scaled by those ratios before the prior is reconciled, so a sector's turnout change is met
 * by volume rather than by inflating its lists' shares everywhere.
 *
 * Coverage. Both CEC files carry the eligible voters (בזב) of the counted boxes: in expb per box, in
 * expc summed per locality row during the count (a row's eligible grows as its boxes are added). The
 * counted share of a locality is counted-box eligible / its expected roll, falling back to counted valid
 * / expected valid when the eligible figure is implausible for complete boxes.
 *
 * Double envelopes are a separate pool sized from the expected final vote, with a 2022 lean per list
 * (overridable for lists whose electorate the pooled profile misrepresents).
 *
 * Uncertainty: joint draws of sector turnout, envelope volume, per-list swing, envelope lean and the
 * exit prior give per-list and per-bloc 80% intervals and the probability of passing the threshold.
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
  /** Eligible voters of the counted ballot boxes (per box in expb; the locality row's בזב in expc). */
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
    const o = byCode.get(code) ?? { code, valid: 0, votes: {}, countedEligible: 0, ...(boxLevel ? { boxes: 0 } : {}) };
    if (!boxLevel && byCode.has(code)) throw new Error("count file: duplicate locality");
    o.valid += valid;
    for (const id in votes) o.votes[id] = (o.votes[id] ?? 0) + votes[id];
    o.countedEligible! += integer(r[iElig]);
    if (boxLevel) o.boxes! += 1;
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

export type Sector = "arab" | "haredi" | "jewish";
/** Sector of a 2022 locality from its own vote: Arab lists or the two Haredi lists above half of the valid vote. */
export function sectorOf2022(history: VoteMapElection): (row: number[]) => Sector {
  const idx = (ls: string[]) => ls.map((l) => history.lists.findIndex((x) => x.letters === l)).filter((i) => i >= 0);
  const arab = idx(["עם", "ום", "ד"]), haredi = idx(["ג", "שס"]);
  const share = (r: number[], ix: number[]) => ix.reduce((n, i) => n + r[4 + i], 0) / Math.max(1, r[3]);
  return (r) => (share(r, arab) > 0.5 ? "arab" : share(r, haredi) > 0.5 ? "haredi" : "jewish");
}
const SECTORS: Sector[] = ["arab", "haredi", "jewish"];

export type Interval80 = { lo: number; hi: number };
export type NowcastResult = {
  mode: "prior" | "count";
  coverage: {
    /** Counted valid votes (localities and envelopes) / the expected final valid vote. */
    votes: number;
    /** Counted-box eligible / expected roll; null when no row carries a usable eligible figure. */
    eligible: number | null;
    localitiesReporting: number;
    boxesCounted: number | null;
    envelopesCounted: number;
  };
  /** Expected 2026 valid votes in localities / 2022 valid votes in localities. */
  turnoutRatio: number;
  /** Per-list actual/expected ratio in the counted places, after shrinkage. */
  swing: Record<string, number>;
  counted: Record<string, number>;
  projected: Record<string, number>;
  /** Final shares used for the seats: the count projection blended with the exit prior when one is given. */
  shares: Record<string, number>;
  seats: Record<string, number>;
  /** 80% seat intervals per list from the joint draws. */
  intervals: Record<string, Interval80>;
  /** Turnout ratio per sector (2026 expected valid / 2022 valid in that sector's localities). */
  sectorTurnout?: Record<Sector, number>;
  /** Per-list shrinkage weight given to the observed swing. */
  swingWeight?: Record<string, number>;
  envelopes?: { expected: number; remaining: number; counted: number; lean: Record<string, number> };
  blend?: { weight: number; countShares: Record<string, number>; exitShares: Record<string, number> | null };
  blocIntervals?: Record<string, Interval80 & { median: number }>;
  /** Probability of clearing the threshold, from the joint draws. */
  passProbability?: Record<string, number>;
  /** Point projection per locality (only with `detail`). */
  localities?: { code: number; sector: Sector; expected: number; remaining: number; projected: Record<string, number> }[];
};

export type NowcastOptions = {
  history: VoteMapElection;
  /** National vote shares by party id used as the prior for every locality profile; may include OTHER. */
  prior: Record<string, number>;
  observation: CountObservation;
  threshold: number;
  agreements: [string, string][];
  profileMap?: ProfileMap;
  /** Columns that give a list's double-envelope lean when they differ from its locality profile. */
  envelopeProfiles?: ProfileMap;
  /** 2026 roll / 2022 roll, used to turn counted-box eligible into a locality coverage share. */
  rollGrowth?: number;
  /** Expected final valid votes nationally (from the CEC turnout figure); anchors the projected volume. */
  expectedFinalValid?: number;
  /** Double envelopes as a share of the expected final valid vote (used with `expectedFinalValid`). */
  envelopeShare?: number;
  /** Override for the locality turnout ratio (every sector); otherwise estimated from the counted boxes. */
  turnoutRatio?: number;
  /** Current exit-informed shares blended with the count projection; weight rises with coverage. */
  exitPrior?: Record<string, number> | null;
  /** Scale of the blend weight (see `blendWeight`): the count has weight 0.625 at that coverage, 1 at full coverage. */
  blendScale?: number;
  /** Party id -> bloc id, for bloc intervals. */
  blocs?: Record<string, string>;
  minCoverage?: number;
  /** Per-list prior strength in votes: how much of a list's expected base must be counted for its swing to count half. */
  pseudoVotes?: number;
  /** Prior strength in votes for each sector's turnout ratio. */
  sectorPseudoVotes?: number;
  draws?: number;
  seed?: number;
  detail?: boolean;
};

/** Weight on the count projection against the exit prior: 1.25·c/(c+s), reaching 1 at full coverage (s = 0.25). */
export const blendWeight = (coverage: number, scale = 0.25) => Math.min(1, ((1 + scale) * coverage) / (coverage + scale));

export function countNowcast({
  history,
  prior,
  observation,
  threshold,
  agreements,
  profileMap = PROFILES_2022,
  envelopeProfiles,
  rollGrowth = 1.045,
  expectedFinalValid,
  envelopeShare,
  turnoutRatio,
  exitPrior = null,
  blendScale = 0.25,
  blocs,
  minCoverage = 0.05,
  pseudoVotes = 30_000,
  sectorPseudoVotes = 30_000,
  draws = 1000,
  seed = 26,
  detail = false,
}: NowcastOptions): NowcastResult {
  const otherShare = prior[OTHER] ?? 0;
  const named = Object.fromEntries(Object.entries(prior).filter(([id]) => id !== OTHER));
  const namedTotal = Object.values(named).reduce((a, b) => a + b, 0);
  const ids = Object.keys(named), all = otherShare > 0 ? [...ids, OTHER] : ids;
  const histByCode = new Map(history.rows.map((r) => [r[0], r]));
  const obsByCode = new Map(observation.localities.map((o) => [o.code, o]));
  for (const code of obsByCode.keys()) if (!histByCode.has(code)) obsByCode.delete(code); // new localities: counted below, no profile
  const sectorOf = sectorOf2022(history);
  const g = rollGrowth;
  // A counted-box eligible figure is usable when the boxes' own turnout is plausible for complete boxes.
  const usableEligible = (o: Observed, h: number[]) => !!o.countedEligible && h[1] > 0 && o.valid / o.countedEligible >= 0.2;

  // 1. Turnout ratio per sector: counted valid over the 2022 valid of the counted share of the roll.
  const localValid2022 = history.rows.reduce((n, r) => n + r[3], 0);
  const envExpected0 = expectedFinalValid !== undefined ? expectedFinalValid * (envelopeShare ?? history.envelopes.valid / history.national.valid) : null;
  const localTarget = expectedFinalValid !== undefined ? expectedFinalValid - envExpected0! : null;
  const uniform = turnoutRatio ?? (localTarget !== null ? localTarget / localValid2022 : 1);
  const T: Record<Sector, number> = { arab: uniform, haredi: uniform, jewish: uniform };
  if (turnoutRatio === undefined) {
    const num: Record<Sector, number> = { arab: 0, haredi: 0, jewish: 0 }, den: Record<Sector, number> = { arab: 0, haredi: 0, jewish: 0 };
    for (const o of obsByCode.values()) {
      const h = histByCode.get(o.code)!;
      if (!usableEligible(o, h)) continue;
      const s = sectorOf(h);
      num[s] += o.valid;
      den[s] += h[3] * Math.min(1, o.countedEligible! / (h[1] * g));
    }
    for (const s of SECTORS) T[s] = (num[s] + sectorPseudoVotes * uniform) / (den[s] + sectorPseudoVotes);
    if (localTarget !== null) {
      // Keep the sector contrasts the boxes show; meet the national volume the turnout figure implies.
      const sum = history.rows.reduce((n, r) => n + r[3] * T[sectorOf(r)], 0);
      for (const s of SECTORS) T[s] *= localTarget / sum;
    }
  }
  const sectorByCode = new Map(history.rows.map((r) => [r[0], sectorOf(r)]));

  // 2. Profiles on the turnout-scaled 2022 baseline, reconciled to the prior.
  const scaled: VoteMapElection = {
    ...history,
    rows: history.rows.map((r) => {
      const t = T[sectorByCode.get(r[0])!];
      return [r[0], r[1], r[2], ...r.slice(3).map((v) => v * t)];
    }),
  };
  const profiles = historicalProfiles(scaled, named, profileMap);
  const score = (p: (typeof profiles)[number], id: string) =>
    id === OTHER ? otherShare / (namedTotal + otherShare) : (p.scores[id] * namedTotal) / (namedTotal + otherShare);

  // 3. Remaining expected valid votes per locality.
  const rows = profiles.map((p) => {
    const h = histByCode.get(p.code)!, o = obsByCode.get(p.code), sector = sectorByCode.get(p.code)!;
    const expected = p.expectedValid;
    let fraction = 0;
    if (o) fraction = usableEligible(o, h) ? Math.min(1, o.countedEligible! / (h[1] * g)) : Math.min(1, o.valid / Math.max(1, expected));
    return { p, o, sector, expected, remaining: expected * (1 - fraction) };
  });
  const expectedLocal = rows.reduce((n, r) => n + r.expected, 0);
  const countedLocal = observation.localities.reduce((n, o) => n + o.valid, 0);

  // 4. Envelopes expected tonight.
  const envExpected = envExpected0 ?? history.envelopes.valid * (expectedLocal / localValid2022);
  const expectedFinal = expectedFinalValid ?? expectedLocal + envExpected;
  // Votes still to come can't exceed the vote still expected: once the count passes the anchor, none are left
  // (2026-10-29: 173k phantom envelopes and 92k phantom locality votes after the count closed moved the last seat).
  const envRemaining = Math.max(0, Math.min(envExpected, expectedFinal - countedLocal) - observation.envelope.valid);
  const localBudget = Math.max(0, expectedFinal - countedLocal - observation.envelope.valid - envRemaining);
  const localRemaining = rows.reduce((n, r) => n + r.remaining, 0);
  if (localRemaining > localBudget) for (const r of rows) r.remaining *= localBudget / localRemaining;
  const coverageVotes = Math.min(1, (countedLocal + observation.envelope.valid) / Math.max(1, expectedFinal));
  const eligibleCounted = observation.localities.reduce((n, o) => {
    const h = histByCode.get(o.code);
    return n + (h && usableEligible(o, h) ? o.countedEligible! : 0);
  }, 0);
  const coverageEligible = eligibleCounted > 0 ? Math.min(1, eligibleCounted / (history.national.eligible * g)) : null;

  // 5. Swing in counted places: actual votes per list vs what the locality's prior profile expected, shrunk per list.
  const actual: Record<string, number> = Object.fromEntries(all.map((id) => [id, 0]));
  const expectedThere: Record<string, number> = Object.fromEntries(all.map((id) => [id, 0]));
  for (const r of rows) {
    if (!r.o) continue;
    for (const id of all) {
      actual[id] += r.o.votes[id] ?? 0;
      expectedThere[id] += r.o.valid * score(r.p, id);
    }
  }
  const swingWeight = Object.fromEntries(all.map((id) => [id, expectedThere[id] / (expectedThere[id] + pseudoVotes)]));
  const swing = Object.fromEntries(all.map((id) => [id, expectedThere[id] > 0 ? 1 + swingWeight[id] * (actual[id] / expectedThere[id] - 1) : 1]));

  // Envelope prior: 2022 envelope pattern of each list's columns rescaled by its national prior / 2022 national share.
  const envLean: Record<string, number> = {};
  const envScore = (() => {
    const out: Record<string, number> = {};
    const natValid = history.national.valid;
    for (const id of ids) {
      const columns = envelopeProfiles?.[id] ?? profileMap[id];
      const idx = columns.map((l) => history.lists.findIndex((x) => x.letters === l));
      const env = idx.reduce((n, i) => n + (history.envelopes.votes[i] ?? 0), 0) / Math.max(1, history.envelopes.valid);
      const nat = idx.reduce((n, i) => n + history.lists[i].votes, 0) / natValid;
      envLean[id] = nat > 0 ? env / nat : 1;
      out[id] = Math.max(1e-8, envLean[id] * named[id]);
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

  const ones = (): Record<string, number> => Object.fromEntries(all.map((id) => [id, 1]));
  const project = (sw: Record<string, number>, sectorScale: Record<Sector, number>, envScale: number, leanMul: Record<string, number>, perLocality?: NowcastResult["localities"]) => {
    const v: Record<string, number> = Object.fromEntries(all.map((id) => [id, counted[id]]));
    for (const r of rows) {
      if (!r.remaining) continue;
      const w = all.map((id) => score(r.p, id) * sw[id]), s = w.reduce((a, b) => a + b, 0);
      const vol = r.remaining * sectorScale[r.sector];
      const local: Record<string, number> = {};
      all.forEach((id, k) => {
        const x = (vol * w[k]) / s;
        v[id] += x;
        local[id] = x;
      });
      perLocality?.push({ code: r.p.code, sector: r.sector, expected: r.expected, remaining: vol, projected: local });
    }
    const ew = all.map((id) => envScore[id] * sw[id] * (leanMul[id] ?? 1)), es = ew.reduce((a, b) => a + b, 0);
    all.forEach((id, k) => (v[id] += (envRemaining * envScale * ew[k]) / es));
    return v;
  };
  const normalise = (x: Record<string, number>) => {
    const s = Object.values(x).reduce((a, b) => a + b, 0);
    return Object.fromEntries(Object.entries(x).map(([id, v]) => [id, v / s]));
  };
  const exitNormalised = exitPrior ? normalise(Object.fromEntries(all.map((id) => [id, Math.max(0, exitPrior[id] ?? 0)]))) : null;
  const w = exitNormalised ? blendWeight(coverageVotes, blendScale) : 1;
  const finalShares = (v: Record<string, number>, exit: Record<string, number> | null) => {
    const total = Object.values(v).reduce((a, b) => a + b, 0) + countedOther;
    const count = Object.fromEntries(all.map((id) => [id, v[id] / total]));
    if (!exit) return { count, shares: count };
    return { count, shares: Object.fromEntries(all.map((id) => [id, w * count[id] + (1 - w) * exit[id]])) };
  };
  const seatsOf = (shares: Record<string, number>) => {
    const valid = Object.values(shares).reduce((a, b) => a + b, 0);
    const lists = Object.fromEntries(Object.entries(shares).filter(([id]) => id !== OTHER));
    return allocate(lists, valid, threshold, agreements).seats;
  };

  const mode = coverageVotes >= minCoverage ? "count" : "prior";
  const usedSwing = mode === "count" ? swing : ones();
  const unit: Record<Sector, number> = { arab: 1, haredi: 1, jewish: 1 };
  const localities: NowcastResult["localities"] = detail ? [] : undefined;
  const point = project(usedSwing, unit, 1, {}, localities);
  const { count: countShares, shares } = finalShares(point, exitNormalised);
  const seats = seatsOf(shares);

  // 6. Joint draws: sector turnout, total volume, envelope volume and lean, per-list swing error (larger for
  // a list whose base is little counted), and the exit prior's own error.
  const random = rng(seed), normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random());
  const sd = Object.fromEntries(all.map((id) => [id, 0.12 * Math.sqrt(1 - (mode === "count" ? swingWeight[id] : 0)) + 0.03]));
  const samples: Record<string, number[]> = Object.fromEntries(ids.map((id) => [id, []]));
  const blocIds = blocs ? [...new Set(ids.map((id) => blocs[id]).filter((b): b is string => !!b))] : [];
  const blocSamples: Record<string, number[]> = Object.fromEntries(blocIds.map((b) => [b, []]));
  const passes: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (let d = 0; d < draws; d++) {
    const sw = Object.fromEntries(all.map((id) => [id, usedSwing[id] * Math.exp(sd[id] * normal())]));
    const volume = Math.exp(0.02 * normal());
    const sectorScale = Object.fromEntries(SECTORS.map((s) => [s, volume * Math.exp(0.1 * normal())])) as Record<Sector, number>;
    const envScale = Math.exp(0.15 * normal());
    const leanMul = Object.fromEntries(all.map((id) => [id, Math.exp((envelopeProfiles?.[id] ? 0.3 : 0.15) * normal())]));
    const exit = exitNormalised ? normalise(Object.fromEntries(all.map((id) => [id, exitNormalised[id] * Math.exp(0.06 * normal())]))) : null;
    const { shares: s } = finalShares(project(sw, sectorScale, envScale, leanMul), exit);
    const st = seatsOf(s);
    const valid = Object.values(s).reduce((a, b) => a + b, 0);
    for (const id of ids) {
      samples[id].push(st[id] ?? 0);
      if (s[id] >= valid * threshold) passes[id] += 1;
    }
    for (const b of blocIds) blocSamples[b].push(ids.filter((id) => blocs![id] === b).reduce((n, id) => n + (st[id] ?? 0), 0));
  }
  const q = (xs: number[], p: number) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
  };
  const blocPoint = (b: string) => ids.filter((id) => blocs![id] === b).reduce((n, id) => n + (seats[id] ?? 0), 0);
  return {
    mode,
    coverage: {
      votes: coverageVotes,
      eligible: coverageEligible,
      localitiesReporting: observation.localities.length,
      boxesCounted: observation.source === "expb" ? observation.localities.reduce((n, o) => n + (o.boxes ?? 0), 0) : null,
      envelopesCounted: observation.envelope.valid,
    },
    turnoutRatio: expectedLocal / localValid2022,
    swing: usedSwing,
    counted,
    projected: point,
    shares,
    seats,
    intervals: Object.fromEntries(ids.map((id) => [id, { lo: q(samples[id], 0.1), hi: q(samples[id], 0.9) }])),
    sectorTurnout: { ...T },
    swingWeight,
    envelopes: { expected: envExpected, remaining: envRemaining, counted: observation.envelope.valid, lean: envLean },
    blend: { weight: w, countShares, exitShares: exitNormalised },
    blocIntervals: Object.fromEntries(blocIds.map((b) => [b, { lo: q(blocSamples[b], 0.1), median: blocPoint(b), hi: q(blocSamples[b], 0.9) }])),
    passProbability: Object.fromEntries(ids.map((id) => [id, draws > 0 ? passes[id] / draws : 0])),
    ...(localities ? { localities } : {}),
  };
}
