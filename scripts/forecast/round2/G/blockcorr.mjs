/** Q1. Cross-bloc correlations of vote-share misses: what v2 and v3 simulate (pooled over the six elections,
 *  each run's bloc sums minus central) against the six observed misses.   node blockcorr.mjs */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, BLOCS } from "./common.mjs";
import { V3 } from "./v3.mjs";
const corr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
const pairs = [["net", "opp"], ["net", "arab"], ["opp", "arab"], ["net", "mid"], ["opp", "mid"]];
const obs = Object.fromEntries(BLOCS.map((b) => [b, []]));
for (const [name, o] of [["v2", {}], ["v3", V3]]) {
  const sim = Object.fromEntries(pairs.map((p) => [p.join("-"), []]));
  for (const e of elections) {
    const f = forecast(runOpts(e, { runs: 20_000, keepRuns: true, keepShares: true, ...o })); const ids = Object.keys(e.lists);
    const tot = (b, i) => ids.filter((id) => e.blocs[id] === b).reduce((a, id) => a + f.shareRuns[id][i] - f.central[id], 0);
    const X = Object.fromEntries(BLOCS.map((b) => [b, Array.from({ length: f.runs }, (_, i) => tot(b, i))]));
    for (const p of pairs) if (ids.some((id) => e.blocs[id] === p[1])) sim[p.join("-")].push(corr(X[p[0]], X[p[1]]));
    if (name === "v2") for (const b of BLOCS) obs[b].push(ids.filter((id) => e.blocs[id] === b).reduce((a, id) => a + e.result.lists[id].pct / 100 - f.central[id], 0));
  }
  console.log(`${name} simulated (mean over elections): ` + pairs.map((p) => `${p.join("-")} ${(sim[p.join("-")].reduce((a, b) => a + b, 0) / sim[p.join("-")].length).toFixed(2)}`).join("  "));
}
console.log("observed (6 elections, v2 central):  " + pairs.map((p) => `${p.join("-")} ${corr(obs[p[0]], obs[p[1]]).toFixed(2)}`).join("  ") + "   (sd of a correlation from 6 points ≈ 0.4)");
