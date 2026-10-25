/**
 * Round 2, agent C: calibration of version 2's simulated P(pass) on the 2015-2022 lists it did not call with
 * certainty (leave-future-out runs, as v2.mjs).   node scripts/forecast/round2/C/calib.mjs [runs]
 */
import { elections, run } from "./common.mjs";
const RUNS = Number(process.argv[2]) || 10_000;
const rows = [];
for (const e of elections) { const f = run(e, { runs: RUNS }); for (const [id, l] of Object.entries(f.lists)) if (l.passes > 0.5 && l.passes < 99.5) rows.push({ key: e.key, id, p: l.passes / 100, passed: e.result.lists[id].passed }); }
const bins = [[0, 0.3], [0.3, 0.5], [0.5, 0.7], [0.7, 0.85], [0.85, 0.95], [0.95, 1]];
console.table(bins.map(([a, b]) => { const r = rows.filter((x) => x.p >= a && x.p < b); return { bin: `${a}-${b}`, n: r.length, meanP: (r.reduce((s, x) => s + x.p, 0) / (r.length || 1)).toFixed(2), passed: r.filter((x) => x.passed).length, lists: r.map((x) => `${x.key.slice(0, 7)} ${x.id}${x.passed ? "" : "✗"}`).join(", ") }; }));
const ll = rows.reduce((s, x) => s - Math.log(x.passed ? x.p : 1 - x.p), 0);
console.log(`n=${rows.length}, expected passes ${rows.reduce((s, x) => s + x.p, 0).toFixed(1)}, actual ${rows.filter((x) => x.passed).length}; log loss ${(ll / rows.length).toFixed(3)}`);
