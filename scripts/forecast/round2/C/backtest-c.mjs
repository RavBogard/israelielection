/**
 * Round 2, agent C: leave-future-out backtest of the threshold-list variants against version 2, with v2.mjs's
 * run/score (./common.mjs) on ./model-c.mjs. Every fitted parameter is estimated from the elections before the one
 * being forecast (./cases.json, built by cases.mjs from polls and results only). Prints the brief's five columns
 * plus the threshold Brier (P(pass) of all 71 lists against pass/fail) and the expected number of wrong calls.
 *   node scripts/forecast/round2/C/cases.mjs && node scripts/forecast/round2/C/backtest-c.mjs [runs] [seed]
 */
import fs from "node:fs";
import path from "node:path";
import { elections, run, score, CLASSES, here, asOf } from "./common.mjs";
const RUNS = Number(process.argv[2]) || 10_000, SEED = Number(process.argv[3]) || 20261027;
const cases = JSON.parse(fs.readFileSync(path.join(here, "cases.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share }));
// FITCASES=full fits the leave-future-out parameters on D1's whole-campaign cases (2013 included) instead.
const fitCases = process.env.FITCASES === "full" ? JSON.parse(fs.readFileSync(path.join(here, "cases-full.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share })) : cases;
const before = (e) => fitCases.filter((c) => c.key < e.key);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
/** The threshold class of round 1 (C 1.2, B 2): a non-Arab list on its first run, or first solo run, polled under 6%. */
const isThresholdClass = (c) => (c.isNew || c.isSolo) && !c.arab && c.share - (c.threshold ?? 3.25) < 2.75;
const caseOf = (e, id) => cases.find((c) => c.key === e.key && c.id === id);
/** v2's priors with the threshold-class entries (the −0.8 on new/solo small lists) replaced by `fn(e)` points. */
function classPriors(e, pts) { const p = { ...CLASSES[e.key] }; for (const id of Object.keys(e.lists)) { const c = caseOf(e, id); if (isThresholdClass(c)) p[id] = pts; } return p; }
/** Leave-future-out class shift: mean miss of earlier threshold-class cases, shrunk by n/(n+n0). */
function lfoShift(e, n0 = 3) { const xs = before(e).filter(isThresholdClass).map((c) => c.miss); return xs.length + n0 ? (mean(xs) * xs.length) / (xs.length + n0) : 0; }
/** Leave-future-out sd for lists under 5%: RMS of earlier 2-5% misses net of their v2 prior, shrunk toward 1.0 with weight n0. */
function lfoSd(e, n0 = 10) { const xs = before(e).filter((c) => c.share >= 2 && c.share <= 5).map((c) => c.miss - (CLASSES[c.key][c.id] ?? 0)); return Math.sqrt((xs.reduce((a, x) => a + x * x, 0) + n0 * 1) / (xs.length + n0)); }
/** Final-week trend for lists under 5%: β × (field share now − 7 days earlier), points. */
function trendShift(e, beta, days = 7) { const s = {}; for (const id of Object.keys(e.lists)) { const c = caseOf(e, id); if (c.share < 5) s[id] = beta * (c.share - (days === 7 ? c.share7 : c.share14)); } return s; }
/** The class shift moved out of the priors (renormalised over all lists) into model-c's `shift` (funded by the bloc's largest list). */
function withinBloc(e, fn) { const pr = classPriors(e, 0), sh = {}; for (const id of Object.keys(e.lists)) if (isThresholdClass(caseOf(e, id))) { delete pr[id]; sh[id] = fn(e); } return { listPriors: pr, shift: sh }; }
const est = (e) => { const s = {}; for (const id of Object.keys(e.lists)) { const c = caseOf(e, id); if (!c.isNew && !c.isSolo && !c.arab && c.share < 5) s[id] = 1; } return s; };
const VARIANTS = {
  "v2": () => ({}),
  "A1 sd 1.15 under 6.9% (fixed)": () => ({ smallSd: { below: 0.069, sd: 1.15 } }),
  "A2 sd LFO-fitted, shrunk to 1.0": (e) => ({ smallSd: { below: 0.069, sd: lfoSd(e) } }),
  "A3 sd 0.8 (narrower)": () => ({ smallSd: { below: 0.069, sd: 0.8 } }),
  "B1 new/solo shift LFO (shrunk n0=3)": (e) => ({ listPriors: classPriors(e, lfoShift(e)) }),
  "B1b new/solo shift LFO, unshrunk": (e) => ({ listPriors: classPriors(e, lfoShift(e, 0)) }),
  "B2 new/solo shift −0.5 (round-1 C half)": (e) => ({ listPriors: classPriors(e, -0.5) }),
  "B3 new/solo shift −1.0 (full in-sample mean)": (e) => ({ listPriors: classPriors(e, -1.0) }),
  "B4 no new/solo shift": (e) => ({ listPriors: classPriors(e, 0) }),
  "C1 desertion k=+0.6 (theory: away from line)": () => ({ desertion: { k: 0.6, sd: 1.0, below: 0.06 } }),
  "C2 desertion k=−0.6 (toward line)": () => ({ desertion: { k: -0.6, sd: 1.0, below: 0.06 } }),
  "D1 trend +0.5·d7 (momentum)": (e) => ({ shift: trendShift(e, 0.5) }),
  "D2 trend −0.5·d7 (reversion)": (e) => ({ shift: trendShift(e, -0.5) }),
  "E1 shared bloc factor 0.6 + own 0.8": () => ({ smallSd: { below: 0.069, sd: 0.8 }, smallShared: 0.6 }),
  "F1 skew-normal α=+3, sd 1.0": () => ({ swingDist: { below: 0.069, sd: 1.0, skewAlpha: 3 } }),
  "F2 skew-normal α=−3, sd 1.0": () => ({ swingDist: { below: 0.069, sd: 1.0, skewAlpha: -3 } }),
  "G1 established small +0.3 (rescue)": (e) => { const s = est(e); return { shift: Object.fromEntries(Object.keys(s).map((k) => [k, 0.3])) }; },
  "G2 established small rescue, LFO-fitted (shrunk n0=5)": (e) => { const xs = before(e).filter((c) => !c.isNew && !c.isSolo && !c.arab && c.share >= 2 && c.share < 5).map((c) => c.miss); const k = (mean(xs) * xs.length) / (xs.length + 5); const s = est(e); return { shift: Object.fromEntries(Object.keys(s).map((id) => [id, k])) }; },
  "I1 unprinted-below last resort 2.5% (not 2%)": () => ({ belowDefault: 0.025 }),
  // J: the same class shift, but the votes a new/solo list loses go to its own bloc's largest list (desertion inside
  // the bloc) instead of being spread over every list by the renormalisation.
  "J1 new/solo −0.8 funded by own bloc's largest list": (e) => withinBloc(e, () => -0.8),
  "J2 new/solo LFO shift (B1) funded by own bloc's largest": (e) => withinBloc(e, lfoShift),
  "J2b new/solo LFO shift unshrunk, funded in bloc": (e) => withinBloc(e, (x) => lfoShift(x, 0)),
  "K1 v2's priors, the new/solo ones (−0.8) funded in bloc [drop-in]": (e) => ({ priorsInBloc: Object.keys(CLASSES[e.key]).filter((id) => CLASSES[e.key][id] === -0.8 && isThresholdClass(caseOf(e, id))) }),
  "J3 = J1 + A2": (e) => ({ ...withinBloc(e, () => -0.8), smallSd: { below: 0.069, sd: lfoSd(e) } }),
  "H1 = A2 + B1 (both LFO-fitted)": (e) => ({ listPriors: classPriors(e, lfoShift(e)), smallSd: { below: 0.069, sd: lfoSd(e) } }),
};
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const rows = [], detail = {};
for (const [name, mk] of Object.entries(VARIANTS)) {
  if (only && !only.test(name)) continue;
  const fs_ = elections.map((e) => run(e, { runs: RUNS, seed: SEED, ...mk(e) }));
  const ss = elections.map((e, i) => score(e, fs_[i]));
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length;
  const expWrong = fs_.reduce((a, f) => a + Object.values(f.lists).reduce((b, l) => b + Math.min(l.passes, 100 - l.passes) / 100, 0), 0);
  const nl = ss.reduce((a, s) => a + s.nLists, 0);
  rows.push({ variant: name, listMAE: m("listErr").toFixed(3), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrong: ss.reduce((a, s) => a + s.wrong, 0), expWrong: expWrong.toFixed(1), majRight: ss.filter((s) => s.majorityRight).length + "/6", brier: m("brier").toFixed(3), passBrier: (ss.reduce((a, s) => a + s.passBrier, 0) / nl).toFixed(4), perElection: ss.map((s) => s.listErr.toFixed(2)).join(" ") });
  detail[name] = elections.map((e, i) => ({ key: e.key, wrong: ss[i].wrongIds, near: Object.fromEntries(Object.entries(fs_[i].lists).filter(([, l]) => l.passes > 0.5 && l.passes < 99.5).map(([k, l]) => [k, l.passes])) }));
}
console.table(rows);
if (process.env.DETAIL) console.log(JSON.stringify(detail, null, 1));
console.log("LFO parameters by election:", elections.map((e) => `${e.key}: shift ${lfoShift(e).toFixed(2)}, sd ${lfoSd(e).toFixed(2)}`).join("; "));
