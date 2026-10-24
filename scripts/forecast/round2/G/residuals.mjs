/** Q1. Empirical residuals: result share − final-field share per list, six elections; decomposition into bloc
 *  and within-bloc parts; class factors; size scaling.   node residuals.mjs [--model]
 *  Default: the raw field (no priors, no lean). --model: against v2's leave-future-out central share (priors + lean). */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, BLOCS } from "./common.mjs";
const MODEL = process.argv.includes("--model");
const rows = [];
for (const e of elections) {
  const f = forecast(runOpts(e, MODEL ? { runs: 200, keepRuns: true } : { runs: 200, keepRuns: true, priors: false, leanRule: "zero" }));
  const sh = MODEL ? f.central : f.base;
  for (const id of Object.keys(e.lists)) rows.push({ key: e.key, id, bloc: e.blocs[id], field: 100 * sh[id], result: e.result.lists[id].pct, r: e.result.lists[id].pct - 100 * sh[id] });
}
const f2 = (x) => (x >= 0 ? "+" : "") + x.toFixed(2);
// Per-election table.
for (const e of elections) {
  const R = rows.filter((x) => x.key === e.key);
  console.log(`\n${e.key}  ` + R.map((x) => `${x.id}(${x.bloc}) ${x.field.toFixed(1)}→${x.result.toFixed(1)} ${f2(x.r)}`).join("; "));
  const bl = {}; for (const b of BLOCS) { const m = R.filter((x) => x.bloc === b); bl[b] = { R: m.reduce((a, x) => a + x.r, 0), B: m.reduce((a, x) => a + x.field, 0) }; }
  console.log("  bloc miss (points): " + BLOCS.map((b) => `${b} ${f2(bl[b].R)}`).join("  ") + "   (seats ≈ ×1.2)");
  for (const x of R) { const b = bl[x.bloc]; x.blocPart = b.B ? b.R * x.field / b.B : 0; x.d = x.r - x.blocPart; x.R = b.R; x.B = b.B; }
}
// Variance decomposition.
const ss = (xs) => xs.reduce((a, x) => a + x * x, 0);
const tot = ss(rows.map((x) => x.r)), bp = ss(rows.map((x) => x.blocPart)), wp = ss(rows.map((x) => x.d));
console.log(`\nSum of squares over ${rows.length} list-elections (points²): total ${tot.toFixed(1)}, bloc part ${bp.toFixed(1)} (${(100 * bp / tot).toFixed(0)}%), within-bloc ${wp.toFixed(1)} (${(100 * wp / tot).toFixed(0)}%), cross ${(tot - bp - wp).toFixed(1)}`);
console.log(`RMS per list: raw ${Math.sqrt(tot / rows.length).toFixed(2)} pt, within-bloc ${Math.sqrt(wp / rows.length).toFixed(2)} pt`);
// Bloc misses, in seats, per election, and their cross-correlations.
const blocM = elections.map((e) => Object.fromEntries(BLOCS.map((b) => [b, 1.2 * rows.filter((x) => x.key === e.key && x.bloc === b).reduce((a, x) => a + x.r, 0)])));
console.log("\nBloc misses (seats, ×1.2 of points):"); console.table(elections.map((e, i) => ({ key: e.key, ...Object.fromEntries(BLOCS.map((b) => [b, +blocM[i][b].toFixed(1)])) })));
const corr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
const mom = (b) => blocM.map((x) => x[b]);
for (const [a, b] of [["net", "opp"], ["net", "arab"], ["opp", "arab"], ["net", "mid"], ["opp", "mid"]]) console.log(`  corr(${a}, ${b}) = ${corr(mom(a), mom(b)).toFixed(2)}`);
for (const b of BLOCS) { const xs = mom(b), m = xs.reduce((a, x) => a + x) / 6; console.log(`  ${b}: mean ${f2(m)} seats, sd about mean ${Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / 5).toFixed(2)}, RMS ${Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / 6).toFixed(2)}`); }
// Within-bloc deviation versus size: fit |d| = a·share^p by least squares on logs; and RMS by size band.
const bands = [[0, 4.5], [4.5, 7], [7, 12], [12, 40]];
console.log("\nWithin-bloc deviation d by field share (points):");
for (const [lo, hi] of bands) { const m = rows.filter((x) => x.field >= lo && x.field < hi); console.log(`  ${lo}-${hi}%: n=${m.length}, RMS d ${Math.sqrt(ss(m.map((x) => x.d)) / m.length).toFixed(2)}, RMS raw r ${Math.sqrt(ss(m.map((x) => x.r)) / m.length).toFixed(2)}, mean r ${f2(m.reduce((a, x) => a + x.r, 0) / m.length)}`); }
{ const m = rows.filter((x) => Math.abs(x.d) > 0.02 && x.field > 1); const X = m.map((x) => Math.log(x.field)), Y = m.map((x) => Math.log(Math.abs(x.d))); const n = X.length, mx = X.reduce((a, b) => a + b) / n, my = Y.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; } console.log(`  log|d| on log share: exponent ${(sxy / sxx).toFixed(2)} (v2 assumes 0.5 above its floor)`); }
// The largest list in each bloc vs its partners (consolidation).
console.log("\nLargest list of each bloc: within-bloc deviation (points), i.e. consolidation:");
for (const e of elections) { const out = []; for (const b of ["net", "opp"]) { const m = rows.filter((x) => x.key === e.key && x.bloc === b).sort((x, y) => y.field - x.field); if (m.length > 1) out.push(`${b}: ${m[0].id} ${f2(m[0].d)}`); } console.log(`  ${e.key}  ${out.join("   ")}`); }
const lg = []; for (const e of elections) for (const b of ["net", "opp"]) { const m = rows.filter((x) => x.key === e.key && x.bloc === b).sort((x, y) => y.field - x.field); if (m.length > 1) lg.push(m[0].d); }
console.log(`  RMS of largest-list deviation ${Math.sqrt(ss(lg) / lg.length).toFixed(2)} pt = ${(1.2 * Math.sqrt(ss(lg) / lg.length)).toFixed(2)} seats (n=${lg.length})`);
// Classes across blocs: Haredi (shas, utj), Arab lists, new / first-time lists (CLASSES < 0).
const has = (ids) => (x) => ids.includes(x.id);
const har = rows.filter(has(["shas", "utj"]));
console.log("\nHaredi lists, raw residual r (points): " + elections.map((e) => `${e.key} shas ${f2(rows.find((x) => x.key === e.key && x.id === "shas").r)} utj ${f2(rows.find((x) => x.key === e.key && x.id === "utj").r)}`).join("; "));
console.log("  corr(shas d, utj d) = " + corr(elections.map((e) => rows.find((x) => x.key === e.key && x.id === "shas").d), elections.map((e) => rows.find((x) => x.key === e.key && x.id === "utj").d)).toFixed(2) + "; corr(shas r, utj r) = " + corr(elections.map((e) => rows.find((x) => x.key === e.key && x.id === "shas").r), elections.map((e) => rows.find((x) => x.key === e.key && x.id === "utj").r)).toFixed(2));
const likudR = elections.map((e) => rows.find((x) => x.key === e.key && x.id === "likud").r), restNet = elections.map((e) => rows.filter((x) => x.key === e.key && x.bloc === "net" && x.id !== "likud").reduce((a, x) => a + x.r, 0));
console.log("Likud raw r: " + likudR.map(f2).join(" ") + "; rest of net bloc: " + restNet.map(f2).join(" ") + `; corr ${corr(likudR, restNet).toFixed(2)}`);
const arabRows = elections.map((e) => rows.filter((x) => x.key === e.key && x.bloc === "arab"));
console.log("Arab lists raw r: " + arabRows.map((R, i) => elections[i].key + " " + R.map((x) => `${x.id} ${f2(x.r)}`).join(",")).join("; "));
// Within-bloc pairwise correlation of d (pooled, as round1 F did): var(sum of raw r in bloc) / sum var(r).
let num = 0, den = 0; for (const e of elections) for (const b of ["net", "opp", "arab"]) { const m = rows.filter((x) => x.key === e.key && x.bloc === b); if (m.length < 2) continue; num += m.reduce((a, x) => a + x.r, 0) ** 2; den += ss(m.map((x) => x.r)); }
console.log(`\nVariance of a bloc's summed raw miss / sum of its lists' squared misses = ${(num / den).toFixed(2)} (1 = independent lists; <1 substitution)`);
export { rows };
