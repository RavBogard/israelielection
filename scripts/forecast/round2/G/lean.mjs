/** Q3. The lean, leave-future-out. Part 1: predict each election's Netanyahu-bloc seat miss (calibration.json:
 *  result − field) from the elections before it, under several rules; the residuals size blocSd.
 *  Part 2: run the model under each rule and score it. Part 3: the half-life under v3.   node lean.mjs [runs] */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, score, summarise, mulberry, cal } from "./common.mjs";
const RUNS = Number(process.argv[2]) || 10_000;
const misses = cal.elections.map((e) => ({ date: e.date, m: e.result - e.field }));
const rules = {
  zero: () => 0,
  mean: (xs) => xs.reduce((a, b) => a + b, 0) / xs.length,
  median: (xs) => { const s = [...xs].sort((a, b) => a - b), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; },
  "recency h=2 (v2)": (xs) => { let a = 0, w = 0; xs.forEach((x, i) => { const wi = 2 ** (-(xs.length - 1 - i) / 2); a += wi * x; w += wi; }); return a / w; },
  "recency h=1": (xs) => { let a = 0, w = 0; xs.forEach((x, i) => { const wi = 2 ** (-(xs.length - 1 - i)); a += wi * x; w += wi; }); return a / w; },
  last: (xs) => xs[xs.length - 1],
  "shrunk mean (×n/(n+2))": (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length + 2),
};
console.log("Netanyahu-bloc seat misses (calibration.json): " + misses.map((x) => `${x.date.slice(0, 7)} ${x.m.toFixed(1)}`).join(", "));
const tab = [];
for (const [name, f] of Object.entries(rules)) {
  const res = []; for (let i = 1; i < misses.length; i++) { const xs = misses.slice(0, i).map((x) => x.m); res.push(misses[i].m - f(xs)); }
  tab.push({ rule: name, residuals: res.map((x) => x.toFixed(1)).join(" "), MAE: +(res.reduce((a, x) => a + Math.abs(x), 0) / res.length).toFixed(2), RMS: +Math.sqrt(res.reduce((a, x) => a + x * x, 0) / res.length).toFixed(2), meanResid: +(res.reduce((a, x) => a + x, 0) / res.length).toFixed(2), "lean 2026": +f(misses.map((x) => x.m)).toFixed(2) });
}
console.table(tab);
// In-sample spread of the misses and the model's blocSd rule.
const xs = misses.map((x) => x.m), m = xs.reduce((a, b) => a + b) / xs.length;
console.log(`All six: mean ${m.toFixed(2)}, sd ${Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)).toFixed(2)} seats; positive in ${xs.filter((x) => x > 0).length}/6; sign test p (≥5 of 6 one sign, two-sided) = ${(2 * 7 / 64).toFixed(3)}`);
// Part 2.
const variants = { "v2 (recency h=2)": {}, "lean = mean": { leanRule: "mean" }, "lean = median": { leanRule: "median" }, "lean = 0": { leanRule: "zero" }, "v2, blocSd 1.5": { blocSd: 1.5 }, "v2, blocSd 2": { blocSd: 2 }, "v2, blocSd 2.5": { blocSd: 2.5 }, "v2, blocSd 4": { blocSd: 4 } };
const rows = [];
for (const [name, o] of Object.entries(variants)) { const rng = mulberry(7); const ss = elections.map((e) => score(e, forecast(runOpts(e, { runs: RUNS, keepRuns: true, ...o })), rng)); rows.push({ variant: name, ...summarise(ss), netPIT: ss.map((s) => s.blocItems[0].pit.toFixed(2)).join(" ") }); }
console.table(rows);
// Part 3: the lean's half-life under v3's noise, three seeds (as backtest-g.mjs).
import { V3 } from "./v3.mjs";
const rows3 = [];
for (const [name, o] of [["v3, h=2 (v2's rule)", {}], ["v3, h=1", { leanHalfLife: 1 }], ["v3, h=0.5", { leanHalfLife: 0.5 }], ["v3, last only (h=0.01)", { leanHalfLife: 0.01 }], ["v3, lean = 0", { leanRule: "zero" }], ["v3, lean = median", { leanRule: "median" }]]) {
  const per = [20261027, 1, 2].map((seed) => { const rng = mulberry(7); return summarise(elections.map((e) => score(e, forecast(runOpts(e, { runs: RUNS, seed, keepRuns: true, ...V3, ...o })), rng))); });
  const r = { variant: name }; for (const k of ["listMAE", "netErr", "blocErr", "wrong", "majBrier", "passBrier", "listCRPS", "netEabs"]) r[k] = +(per.reduce((a, p) => a + p[k], 0) / 3).toFixed(3); rows3.push(r);
}
console.table(rows3);
