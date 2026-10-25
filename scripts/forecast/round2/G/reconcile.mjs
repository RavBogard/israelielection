/** Q4. Reconciliation rules for `point`, leave-future-out (v2 draws; 3 seeds × 10000 runs).
 *  R1 (v2): per-list medians, then one seat at a time to/from the safe list (P(pass) ≥ 0.95) whose simulated mean
 *     lies furthest from its point in the needed direction.
 *  R2: threshold lists keep their median; the safe lists share the remaining seats by largest remainder on their
 *     simulated means, rescaled to that total.
 *  R0: raw medians, not reconciled (does not add to 120; for reference).   node reconcile.mjs */
import { forecast } from "./model-g.mjs";
import { elections, runOpts } from "./common.mjs";
import { V3 } from "./v3.mjs";
const rules = {
  R1: (f, med, mean, safe) => Object.fromEntries(Object.keys(f.lists).map((id) => [id, f.lists[id].point])),
  R2: (f, med, mean, safe) => {
    const ids = Object.keys(f.lists), p = { ...med }; const rest = 120 - ids.filter((id) => !safe.includes(id)).reduce((a, id) => a + med[id], 0);
    const tot = safe.reduce((a, id) => a + mean[id], 0), quota = Object.fromEntries(safe.map((id) => [id, mean[id] * rest / tot]));
    for (const id of safe) p[id] = Math.floor(quota[id]); let left = rest - safe.reduce((a, id) => a + p[id], 0);
    for (const id of [...safe].sort((a, b) => (quota[b] - Math.floor(quota[b])) - (quota[a] - Math.floor(quota[a])))) { if (left <= 0) break; p[id]++; left--; }
    return p;
  },
  R0: (f, med) => med,
};
for (const [name, o] of [["v2", {}], ["v3", V3]]) {
  const acc = Object.fromEntries(Object.keys(rules).map((k) => [k, []]));
  for (const seed of [20261027, 1, 2]) for (const e of elections) {
    const f = forecast(runOpts(e, { runs: 10_000, seed, keepRuns: true, ...o })); const ids = Object.keys(f.lists);
    const med = Object.fromEntries(ids.map((id) => { const s = Int8Array.from(f.seatRuns[id]).sort(); return [id, s[s.length >> 1]]; }));
    const mean = Object.fromEntries(ids.map((id) => [id, f.seatRuns[id].reduce((a, b) => a + b, 0) / f.runs]));
    const safe = ids.filter((id) => f.raw.passRate[id] >= 0.95);
    for (const [k, r] of Object.entries(rules)) { const p = r(f, med, mean, safe); acc[k].push(ids.reduce((a, id) => a + Math.abs(p[id] - e.result.lists[id].seats), 0) / ids.length); }
  }
  console.log(`${name}: ` + Object.entries(acc).map(([k, xs]) => `${k} per-list error ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3)} (per election, seed 1: ${xs.slice(0, 6).map((x) => x.toFixed(2)).join(" ")})`).join("\n    "));
}
