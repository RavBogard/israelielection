/** Q1/Q2. What the simulation implies about vote-share errors, against what happened, leave-future-out.
 *  For every list and bloc: the simulated sd of (share − central share), and z = (result − central) / sd.
 *  A calibrated noise structure has RMS z ≈ 1 and |z| > 1.645 about 10% of the time, in every component.
 *  node implied.mjs [variant]   variant: v2 (default) | v3 | a JSON opts string */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, BLOCS } from "./common.mjs";
import { V3 } from "./v3.mjs";
const arg = process.argv[2] ?? "v2";
const opts = arg === "v2" ? {} : arg === "v3" ? V3 : JSON.parse(arg);
const RUNS = 20_000;
const L = [], B = [], D = [];
for (const e of elections) {
  const f = forecast(runOpts(e, { ...opts, runs: RUNS, keepRuns: true, keepShares: true }));
  const ids = Object.keys(e.lists), c = f.central, S = f.shareRuns;
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length, sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
  for (const id of ids) { const sim = Array.from(S[id], (v) => 100 * (v - c[id])); const r = e.result.lists[id].pct - 100 * c[id]; L.push({ key: e.key, id, share: 100 * c[id], sd: sd(sim), r, z: (r - mean(sim)) / sd(sim) }); }
  for (const b of BLOCS) {
    const m = ids.filter((id) => e.blocs[id] === b); if (!m.length) continue;
    const Bc = m.reduce((a, id) => a + c[id], 0);
    const simB = Array.from({ length: RUNS }, (_, i) => 100 * m.reduce((a, id) => a + S[id][i] - c[id], 0));
    const rB = m.reduce((a, id) => a + e.result.lists[id].pct - 100 * c[id], 0);
    B.push({ key: e.key, b, sd: sd(simB), r: rB, z: (rB - mean(simB)) / sd(simB) });
    if (m.length < 2) continue;
    for (const id of m) { const simD = Array.from({ length: RUNS }, (_, i) => 100 * (S[id][i] - c[id]) - simB[i] * c[id] / Bc); const rD = e.result.lists[id].pct - 100 * c[id] - rB * c[id] / Bc; D.push({ key: e.key, id, b, share: 100 * c[id], sd: sd(simD), r: rD, z: (rD - mean(simD)) / sd(simD), largest: m.every((x) => c[x] <= c[id]) }); }
  }
}
const rep = (name, xs) => { const n = xs.length; if (!n) return; const rmsz = Math.sqrt(xs.reduce((a, x) => a + x.z * x.z, 0) / n); console.log(`${name.padEnd(36)} n=${String(n).padStart(2)}  sim sd ${(xs.reduce((a, x) => a + x.sd, 0) / n).toFixed(2)} pt  RMS actual ${Math.sqrt(xs.reduce((a, x) => a + x.r * x.r, 0) / n).toFixed(2)} pt  RMS z ${rmsz.toFixed(2)}  |z|>1.645: ${xs.filter((x) => Math.abs(x.z) > 1.645).length}/${n}  mean z ${(xs.reduce((a, x) => a + x.z, 0) / n).toFixed(2)}`); };
console.log(`Variant ${arg}: leave-future-out, ${RUNS} runs per election. Shares in points of the vote.`);
rep("Lists, all", L);
rep("Lists < 4.5%", L.filter((x) => x.share < 4.5)); rep("Lists 4.5-7%", L.filter((x) => x.share >= 4.5 && x.share < 7)); rep("Lists 7-12%", L.filter((x) => x.share >= 7 && x.share < 12)); rep("Lists 12%+", L.filter((x) => x.share >= 12));
for (const b of BLOCS) rep(`Bloc total: ${b}`, B.filter((x) => x.b === b));
rep("Within-bloc deviation, all", D);
rep("Within-bloc, largest list of bloc", D.filter((x) => x.largest && x.b !== "arab"));
rep("Within-bloc, other lists < 7%", D.filter((x) => !x.largest && x.share < 7));
rep("Within-bloc, other lists 7%+", D.filter((x) => !x.largest && x.share >= 7));
console.log("Net bloc per election (points): " + B.filter((x) => x.b === "net").map((x) => `${x.key} r ${x.r.toFixed(2)} sd ${x.sd.toFixed(2)} z ${x.z.toFixed(2)}`).join("; "));
console.log("Largest-list z: " + D.filter((x) => x.largest && x.b !== "arab").map((x) => `${x.key} ${x.id} ${x.z.toFixed(2)}`).join("; "));
