/** Q5. Leave-future-out backtest of agent G's v3 noise against v2, each change alone, and the alternatives tried.
 *  node backtest-g.mjs [runs] [seeds]   (defaults 10000 runs, 3 seeds; about 2 min)
 *  Every column is the mean over the seeds (20261027, 1, 2): the Monte Carlo moves netErr by ±0.17 between seeds
 *  (one election's bloc point flips a seat), so a single seed cannot separate variants on it.
 *  Columns: v2.mjs's (listMAE, netErr, blocErr, wrong of 71, majRight of 6, majBrier) and passBrier (mean over the
 *  71 lists), cov90/cov50 (share of list results inside the 90%/50% interval, integer quantiles inclusive),
 *  blocCov90 (of 24), netCov90 (of 6), listCRPS (mean E|draw − result| per list, seats: lower is better, a proper
 *  score), netEabs (same for the Netanyahu bloc), netPIT (seed 20261027: the bloc result's randomised PIT). */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, score, summarise, mulberry } from "./common.mjs";
import { V3 } from "./v3.mjs";
const RUNS = Number(process.argv[2]) || 10_000, SEEDS = [20261027, 1, 2, 3, 4].slice(0, Number(process.argv[3]) || 3);
const v3 = (x, top = {}) => ({ ...top, noise: "v3", v3: { ...V3.v3, ...x } });
export const VARIANTS = {
  "v2": {},
  "v3 (proposed)": V3,
  "v3 + bloc point = bloc median (proposed)": { ...V3, blocPoint: "median" },
  "v2 + bloc point = bloc median": { blocPoint: "median" },
  "v3 + lean and swing from Zionist lists (option)": v3({ leanFrom: "zionist" }),
  "v2 + lean and swing from Zionist lists": v3({ swing: "v2", leanFrom: "zionist" }),
  "v2, blocSd 2.1 (normal, no floor of 3)": { blocSd: 2.1 },
  "v3, swing floor 2.0": v3({ scaleFloor: 2.0 }),
  "v3, swing floor 1.0": v3({ scaleFloor: 1.0 }),
  "v3, swing df ≥ 5": v3({ dfMin: 5 }),
  "v3 + t3 consolidation (rejected)": v3({ consolidateDf: 3 }),
  "v3 + consolidation sd 2.5 (rejected)": v3({}, { consolidateSd: 2.5 }),
  "v3 + lean to Likud only (rejected)": v3({ leanTo: "largest" }),
  "v3, list noise ×0.85": v3({ listScale: 0.85 }),
  "v3, list noise ×1.15": v3({ listScale: 1.15 }),
  "v3, lean = plain mean": v3({}, { leanRule: "mean" }),
};
const rows = [];
for (const [name, o] of Object.entries(VARIANTS)) {
  const per = SEEDS.map((seed) => { const rng = mulberry(7); const ss = elections.map((e) => score(e, forecast(runOpts(e, { runs: RUNS, seed, keepRuns: true, ...o })), rng)); return { s: summarise(ss), ss }; });
  const avg = {}; for (const k of Object.keys(per[0].s)) { const v = per.map((p) => p.s[k]); avg[k] = typeof v[0] === "number" ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(k === "passBrier" ? 4 : 3) : k.endsWith("Right") || k.endsWith("Cov90") ? (v.reduce((a, b) => a + Number(b.split("/")[0]), 0) / v.length).toFixed(1) + "/" + v[0].split("/")[1] : v[0]; }
  rows.push({ variant: name, ...avg, netPIT: per[0].ss.map((s) => s.blocItems[0].pit.toFixed(2)).join(" "), perElection: per[0].ss.map((s) => s.listErr.toFixed(2)).join(" ") });
}
console.log(`${RUNS} runs × seeds ${SEEDS.join(", ")}, leave-future-out, six elections`);
console.table(rows);
