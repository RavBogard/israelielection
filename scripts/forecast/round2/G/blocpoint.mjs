/** Q4. The bloc point: the sum of the list points (v2, scored) versus the median of the simulated bloc total
 *  (reported beside it in v2, not scored).   node blocpoint.mjs   (3 seeds × 10000 runs) */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, actualBlocs, BLOCS } from "./common.mjs";
import { V3 } from "./v3.mjs";
for (const [name, o] of [["v2", {}], ["v3", V3]]) for (const seed of [20261027, 1, 2]) {
  const r = elections.map((e) => { const f = forecast(runOpts(e, { runs: 10_000, seed, ...o })), a = actualBlocs(e); return { sum: BLOCS.map((b) => Math.abs(f.blocs[b].point - a[b])), med: BLOCS.map((b) => Math.abs(f.blocs[b].median - a[b])), sNet: f.blocs.net.point - a.net, mNet: f.blocs.net.median - a.net }; });
  const m = (k, i) => r.reduce((a, x) => a + x[k][i], 0) / 6, all = (k) => r.reduce((a, x) => a + x[k].reduce((p, q) => p + q, 0) / 4, 0) / 6;
  console.log(`${name} seed ${seed}: net error sum-of-lists ${m("sum", 0).toFixed(2)} vs bloc median ${m("med", 0).toFixed(2)}; mean bloc error ${all("sum").toFixed(2)} vs ${all("med").toFixed(2)}; signed net ${r.map((x) => x.sNet).join(",")} vs ${r.map((x) => x.mNet).join(",")}`);
}
