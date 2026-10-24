/** Shared harness for agent G (round 2): the six backtest elections set up exactly as backtest/v2.mjs does
 *  (leave-future-out lean, 2026 prior classes mapped by hand), plus 2026 inputs, plus scoring with calibration. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAJ } from "./model-g.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../../../..");
export const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
export const cal = read(path.join(ROOT, "scripts/forecast/calibration.json"));
const DATA = path.join(ROOT, "scripts/forecast/backtest/data");
export const elections = fs.readdirSync(DATA).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(DATA, f)));
// Copied from backtest/v2.mjs.
export const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
export function runOpts(e, opts = {}) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const c = { ...cal, elections: earlier, listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))];
  const filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  return { polls: e.polls, config, parties, agreements: e.agreements, cal: c, opts: { runs: 10_000, ...opts } };
}
export function inputs2026(opts = {}) {
  const { polls, config } = read(path.join(ROOT, "data/polls.json"));
  const pj = read(path.join(ROOT, "data/parties.json")); const parties = (pj.parties ?? pj).map((p) => ({ id: p.id, bloc: p.bloc }));
  const results = read(path.join(ROOT, "data/results.json"));
  const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
  return { polls, config, parties, agreements, cal, opts: { runs: 50_000, ...opts } };
}
export const BLOCS = ["net", "opp", "mid", "arab"];
export function actualBlocs(e) { const t = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of Object.keys(e.lists)) t[e.blocs[id]] += e.result.lists[id]?.seats ?? 0; return t; }
/** v2.mjs's five columns plus calibration: 90%/50% coverage, P(pass) Brier, randomised PIT, CRPS-like expected |error|. */
export function score(e, f, rng = Math.random) {
  const lists = Object.keys(e.lists), res = e.result.lists;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0) / lists.length;
  const actual = actualBlocs(e);
  const blocErr = BLOCS.reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrong = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const P = f.raw ? { net: f.raw.net61, oppZionist: f.raw.opp61, neither: 1 - f.raw.net61 - f.raw.opp61 } : { net: f.majority.net / 100, oppZionist: f.majority.oppZionist / 100, neither: f.majority.neither / 100 };
  const top = Object.entries(P).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(P).reduce((a, [k, v]) => a + (v - (k === outcome ? 1 : 0)) ** 2, 0);
  const out = { key: e.key, listErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong, majorityRight: top === outcome, brier, outcome, P };
  if (f.seatRuns) {
    const R = f.runs, cdf = (arr, x) => { let lt = 0, eq = 0; for (const n of arr) { if (n < x) lt++; else if (n === x) eq++; } return [lt / R, eq / R]; };
    const qtl = (arr, p) => { const s = Int8Array.from(arr).sort(); return s[Math.min(R - 1, Math.floor(p * R))]; };
    out.items = lists.map((id) => { const arr = f.seatRuns[id]; const y = res[id]?.seats ?? 0; const [lt, eq] = cdf(arr, y);
      const pp = f.raw.passRate[id]; let eabs = 0; for (const n of arr) eabs += Math.abs(n - y); eabs /= R;
      return { id, bloc: e.blocs[id], y, point: f.lists[id].point, mean: f.lists[id].mean, lo90: f.lists[id].lo, hi90: f.lists[id].hi, lo50: qtl(arr, 0.25), hi50: qtl(arr, 0.75), pit: lt + rng() * eq, pPass: pp, passed: !!res[id]?.passed, eabs };
    });
    out.blocItems = BLOCS.map((b) => { const arr = f.blocRuns[b], y = actual[b]; const [lt, eq] = cdf(arr, y); let eabs = 0; for (const n of arr) eabs += Math.abs(n - y); return { b, y, lo90: f.blocs[b].lo, hi90: f.blocs[b].hi, lo50: qtl(arr, 0.25), hi50: qtl(arr, 0.75), pit: lt + rng() * eq, eabs: eabs / R, sd: Math.sqrt(arr.reduce((a, n) => a + n * n, 0) / R - (arr.reduce((a, n) => a + n, 0) / R) ** 2) }; });
  }
  return out;
}
/** Seeded uniform for the randomised PIT, so tables reproduce. */
export function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function summarise(ss) {
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length;
  const row = { listMAE: +m("listErr").toFixed(3), netErr: +m("netErr").toFixed(2), blocErr: +m("blocErr").toFixed(3), wrong: ss.reduce((a, s) => a + s.wrong, 0), majRight: ss.filter((s) => s.majorityRight).length + "/6", majBrier: +m("brier").toFixed(3) };
  if (ss[0].items) {
    const it = ss.flatMap((s) => s.items), bi = ss.flatMap((s) => s.blocItems);
    row.passBrier = +(it.reduce((a, x) => a + (x.pPass - (x.passed ? 1 : 0)) ** 2, 0) / it.length).toFixed(4);
    row.cov90 = +(it.filter((x) => x.y >= x.lo90 && x.y <= x.hi90).length / it.length).toFixed(3);
    row.cov50 = +(it.filter((x) => x.y >= x.lo50 && x.y <= x.hi50).length / it.length).toFixed(3);
    row.pit90 = +(it.filter((x) => x.pit >= 0.05 && x.pit <= 0.95).length / it.length).toFixed(3); // randomised-PIT coverage: no integer inflation
    row.pit50 = +(it.filter((x) => x.pit >= 0.25 && x.pit <= 0.75).length / it.length).toFixed(3);
    row.blocCov90 = `${bi.filter((x) => x.y >= x.lo90 && x.y <= x.hi90).length}/${bi.length}`;
    row.netCov90 = `${ss.filter((s) => { const x = s.blocItems[0]; return x.y >= x.lo90 && x.y <= x.hi90; }).length}/6`;
    row.listCRPS = +(it.reduce((a, x) => a + x.eabs, 0) / it.length).toFixed(3); // E|draw − result|, a proper-ish score
    row.netEabs = +(ss.reduce((a, s) => a + s.blocItems[0].eabs, 0) / ss.length).toFixed(2);
  }
  return row;
}
