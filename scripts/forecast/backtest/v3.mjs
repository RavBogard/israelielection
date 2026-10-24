/**
 * Scores scripts/forecast/model.mjs (version 3) against version 2 on the six elections under the 3.25% threshold,
 * leave-future-out, over several Monte Carlo seeds (one seed moves the bloc error by ±0.17: round2/G).
 *
 *   node scripts/forecast/backtest/v3.mjs [runs=10000] [seeds=3] [data|data-full] [--filber=outlet|poll]
 *
 * Columns: the pre-registered yardstick (per-list seat error of `point`), Netanyahu-bloc and mean bloc error of
 * blocs.*.point, wrong threshold calls of 71, modal majority outcome right, majority Brier; then calibration:
 * P(pass) Brier, randomised-PIT 90% and 50% coverage of the list seat counts, bloc 90% coverage, list CRPS
 * (E|draw − result|), the Netanyahu bloc's expected absolute error.
 *
 * The lean and its residual come from the elections before each one; the 2026 prior classes are mapped to each
 * election's lists by hand (CLASSES); the Arab sector term is calibrated leave-future-out by round2/B/common.mjs.
 * `--filber=poll` (the default) keeps an outlet's own polls when one of its polls in the window was by a Filber firm
 * (Kan 11 commissioned one Direct Polls poll in March 2019; the version-2 harness dropped Kan's own Kantar poll with
 * it: round2/D2). `--filber=outlet` reproduces the version-2 harness.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast, MAJ } from "../model.mjs";
import { arabCalibration, pollShares } from "../round2/B/common.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const args = process.argv.slice(2), flag = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d}`).split("=")[1];
const pos = args.filter((a) => !a.startsWith("--"));
const RUNS = Number(pos[0]) || 10_000, SEEDS = [20261027, 1, 2, 3, 4].slice(0, Number(pos[1]) || 3), DATA = pos[2] ?? "data", FILBER = flag("filber", "poll");
export const cal = read(path.join(here, "../calibration.json"));
export const elections = fs.readdirSync(path.join(here, DATA)).filter((f) => /^20(15|19|2\d)-\d\d\.json$/.test(f)).sort().map((f) => read(path.join(here, DATA, f)));
/** 2026's prior classes on past lists: Shas; Arab-led lists; Bennett's list; first-time (or first-time-solo) small lists. */
export const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
const RAAM = ["raam", "raambalad"];
const _ps = {}; const shares = (e) => (_ps[e.key] ??= pollShares(e));
/** The Arab sector term as calibration.json carries it for 2026, derived for each past election from the elections before it (round2/B, variant B2). */
export function arabSector(e, sdLog = 0.12) {
  const c = arabCalibration(e.key), ps = shares(e);
  const all = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab"), sub = all.filter((id) => !RAAM.includes(id));
  if (!sub.length) return null;
  const St = all.reduce((a, id) => a + ps[id], 0), Ss = sub.reduce((a, id) => a + ps[id], 0);
  const xs = Math.max(0.3, 1 + (Math.exp(c.logShift) - 1) * St / Ss);
  return { name: "arab", lists: sub, logShift: Math.log(xs), alphaPts: 0, sdLog: sdLog * St / Ss, replacesPriors: true };
}
export function setup(e, filber = FILBER) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const sector = arabSector(e);
  const c = { ...cal, elections: earlier, listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] }, sectorTurnout: { sectors: sector ? [sector] : [] } };
  let polls = e.polls, checks;
  if (filber === "poll") { polls = e.polls.map((p) => (p.filber ? { ...p, pollster: `${p.pollster} (Filber firm)` } : p)); checks = [...new Set(polls.filter((p) => p.filber).map((p) => p.pollster))]; }
  else checks = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const pollsters = [...new Set(polls.map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  return { polls, config: { pollsters, withoutVariant: { pollsters: checks }, currentWindowDays: 14 }, parties, agreements: e.agreements, cal: c };
}
export const run = (e, opts) => forecast({ ...setup(e), opts: { runs: RUNS, keepRuns: true, ...opts } });
const BLOCS = ["net", "opp", "mid", "arab"];
export function score(e, f, rng) {
  const lists = Object.keys(e.lists), res = e.result.lists, R = f.runs;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += res[id]?.seats ?? 0;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const P = { net: f.raw.net61, oppZionist: f.raw.opp61, neither: 1 - f.raw.net61 - f.raw.opp61 };
  const top = Object.entries(P).sort((a, b) => b[1] - a[1])[0][0];
  const cdf = (arr, x) => { let lt = 0, eq = 0; for (const n of arr) { if (n < x) lt++; else if (n === x) eq++; } return [lt / R, eq / R]; };
  const qtl = (arr, p) => { const s = Int8Array.from(arr).sort(); return s[Math.min(R - 1, Math.floor(p * R))]; };
  const items = lists.map((id) => { const arr = f.seatRuns[id], y = res[id]?.seats ?? 0, [lt, eq] = cdf(arr, y); let eabs = 0; for (const n of arr) eabs += Math.abs(n - y); return { y, point: f.lists[id].point, lo90: f.lists[id].lo, hi90: f.lists[id].hi, lo50: qtl(arr, 0.25), hi50: qtl(arr, 0.75), pit: lt + rng() * eq, pPass: f.raw.passRate[id], passed: !!res[id]?.passed, eabs: eabs / R }; });
  const blocItems = BLOCS.map((b) => { const arr = f.blocRuns[b], y = actual[b]; let eabs = 0; for (const n of arr) eabs += Math.abs(n - y); return { b, y, lo90: f.blocs[b].lo, hi90: f.blocs[b].hi, eabs: eabs / R }; });
  return { key: e.key, listErr: items.reduce((a, x) => a + Math.abs(x.point - x.y), 0) / lists.length, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr: BLOCS.reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4, wrong: lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length, majorityRight: top === outcome, brier: Object.entries(P).reduce((a, [k, v]) => a + (v - (k === outcome ? 1 : 0)) ** 2, 0), items, blocItems };
}
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function summarise(ss) {
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length, it = ss.flatMap((s) => s.items), bi = ss.flatMap((s) => s.blocItems);
  return { listMAE: m("listErr"), netErr: m("netErr"), blocErr: m("blocErr"), wrong: ss.reduce((a, s) => a + s.wrong, 0), majRight: ss.filter((s) => s.majorityRight).length, majBrier: m("brier"),
    passBrier: it.reduce((a, x) => a + (x.pPass - (x.passed ? 1 : 0)) ** 2, 0) / it.length, pit90: it.filter((x) => x.pit >= 0.05 && x.pit <= 0.95).length / it.length, pit50: it.filter((x) => x.pit >= 0.25 && x.pit <= 0.75).length / it.length,
    blocCov90: bi.filter((x) => x.y >= x.lo90 && x.y <= x.hi90).length / bi.length, listCRPS: it.reduce((a, x) => a + x.eabs, 0) / it.length, netEabs: ss.reduce((a, s) => a + s.blocItems[0].eabs, 0) / ss.length, perElection: ss.map((s) => s.listErr.toFixed(2)).join(" ") };
}
/** Mean over seeds of every numeric column. */
export function table(variants) {
  const rows = [];
  for (const [name, opts] of Object.entries(variants)) {
    const per = SEEDS.map((seed) => summarise(elections.map((e) => score(e, run(e, { seed, ...opts }), mulberry(7)))));
    const row = { variant: name }; for (const k of Object.keys(per[0])) { const v = per.map((p) => p[k]); row[k] = typeof v[0] === "number" ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(k === "passBrier" ? 4 : k === "wrong" || k === "majRight" ? 1 : 3) : v[0]; }
    rows.push(row);
  }
  return rows;
}
export const VARIANTS = {
  "v2 (version-2 rules)": { v2: true },
  "v3": {},
  "v3, normal swing (v2's)": { swing: "normal" },
  "v3, bloc point = list sum (v2's)": { blocPoint: "sum" },
  "v3, no sector term (v2's Arab prior and swing)": { sectorTurnout: false },
  "v3, unprinted-below 2% (v2's)": { unprintedBelow: 0.02 },
  "v3, fringe 1.5% (v2's)": { fringe: 0.015 },
  "v2 + t swing only": { v2: true, swing: "t" },
  "v2 + bloc median only": { v2: true, blocPoint: "median" },
  "v2 + sector term only": { v2: true, sectorTurnout: true },
  "v3, 14-day window": { windowDays: 14 },
  "v3, no list priors": { priors: false },
  "plain field (no priors, no lean, v2 noise)": { v2: true, priors: false, lean: 0 },
};
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`${RUNS} runs × seeds ${SEEDS.join(", ")}; ${DATA}; Filber firms by ${FILBER}; leave-future-out, ${elections.length} elections`);
  console.table(table(VARIANTS));
}
