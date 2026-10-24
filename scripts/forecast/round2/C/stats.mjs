/**
 * Round 2, agent C: the statistics of section 1-3 of C-threshold-swing.md from ./cases.json (run cases.mjs first).
 * miss = result share − v2 field share, in points. Cluster bootstrap by election for the intervals. CDATA=full reads cases-full.json (D1's data, 2013 included).
 *   node scripts/forecast/round2/C/stats.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { here } from "./common.mjs";
const C = JSON.parse(fs.readFileSync(path.join(here, process.env.CDATA === "full" ? "cases-full.json" : "cases.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share, missP: c.result - c.share - c.prior, d7: c.share - c.share7, d14: c.share - c.share14, dist: c.share - (c.threshold ?? 3.25), d28: c.share28 == null ? null : c.share - c.share28 }))
// Bands are by distance from that election's threshold (3.25%; 2% in 2013): "2-5%" means 1.25 under to 1.75 over the line.
for (const c of C) c.rel = c.dist + 3.25;;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const skew = (xs) => { const m = mean(xs), s = sd(xs), n = xs.length; return (n / ((n - 1) * (n - 2))) * xs.reduce((a, b) => a + ((b - m) / s) ** 3, 0); };
const kurt = (xs) => { const m = mean(xs), s = sd(xs); return mean(xs.map((x) => ((x - m) / s) ** 4)); };
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : "—");
let seed = 7; const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const keys = [...new Set(C.map((c) => c.key))];
/** Cluster bootstrap (resample elections) of a statistic over a case filter: 90% interval. */
function boot(filter, stat, B = 4000) {
  const vals = [];
  for (let b = 0; b < B; b++) { const ks = keys.map(() => keys[Math.floor(rand() * keys.length)]); const xs = ks.flatMap((k) => C.filter((c) => c.key === k && filter(c))); if (xs.length >= 3) { const v = stat(xs); if (Number.isFinite(v)) vals.push(v); } }
  vals.sort((a, b) => a - b); return [vals[Math.floor(0.05 * vals.length)], vals[Math.floor(0.95 * vals.length)]];
}
function line(name, filter, field = "miss") {
  const xs = C.filter(filter).map((c) => c[field]);
  if (xs.length < 2) return { group: name, n: xs.length, mean: f2(xs[0]) };
  const [lo, hi] = boot(filter, (cs) => mean(cs.map((c) => c[field])));
  const neg = xs.filter((x) => x < 0).length;
  return { group: name, n: xs.length, mean: f2(mean(xs)), "mean 90% (cluster boot)": `${f2(lo)} … ${f2(hi)}`, sd: f2(sd(xs)), rms: f2(Math.sqrt(mean(xs.map((x) => x * x)))), skew: xs.length > 3 ? f2(skew(xs)) : "—", kurt: xs.length > 3 ? f2(kurt(xs)) : "—", below0: `${neg}/${xs.length}`, elections: new Set(C.filter(filter).map((c) => c.key)).size };
}
const B25 = (c) => c.rel >= 2 && c.rel <= 5;
const notB = (c) => !(c.key === "2021-03" && c.id === "bw");
console.log("\n## Q1. Miss (result − field share), points, by group. All cases 2015-2022 in data/.");
console.table([
  line("2-5%: all", B25),
  line("2-5%: all, after v2's prior (miss − prior)", B25, "missP"),
  line("2-5%: without Blue and White 2021", (c) => B25(c) && notB(c)),
  line("2-5%: new (first run)", (c) => B25(c) && c.isNew),
  line("2-5%: first solo run", (c) => B25(c) && c.isSolo),
  line("2-5%: new or solo", (c) => B25(c) && (c.isNew || c.isSolo)),
  line("2-5%: established, non-Arab", (c) => B25(c) && !c.isNew && !c.isSolo && !c.arab),
  line("2-5%: Arab", (c) => B25(c) && c.arab),
  line("2-5%: bloc net", (c) => B25(c) && c.bloc === "net"),
  line("2-5%: bloc opp", (c) => B25(c) && c.bloc === "opp"),
  line("2-5%: bloc mid", (c) => B25(c) && c.bloc === "mid"),
  line("2-5%: bloc arab", (c) => B25(c) && c.bloc === "arab"),
  line("2-3.25% (under the line)", (c) => c.rel >= 2 && c.rel < 3.25),
  line("3.25-4% (just over)", (c) => c.rel >= 3.25 && c.rel < 4),
  line("4-5%", (c) => c.rel >= 4 && c.rel <= 5),
  line("5-6%", (c) => c.rel > 5 && c.rel < 6),
  line("6-8% (comparison)", (c) => c.rel >= 6 && c.rel <= 8),
  line("6-8%, established non-Arab", (c) => c.rel >= 6 && c.rel <= 8 && !c.isNew && !c.isSolo && !c.arab),
  line("8%+", (c) => c.rel > 8),
  line("<2%", (c) => c.rel < 2),
]);
// Scale of the miss by share: RMS of miss by band, against v2's per-list sd (1.08·√(s/8)) and the 1.0 floor.
console.log("\n## Spread by band: RMS miss vs v2's sd (max(1.0, 1.08·√(s/8))) and the √s formula alone");
const bands = [[0, 2], [2, 3.25], [3.25, 4.5], [4.5, 6], [6, 8], [8, 12], [12, 40]];
console.table(bands.map(([a, b]) => { const xs = C.filter((c) => c.rel >= a && c.rel < b); const s = mean(xs.map((c) => c.rel)); return { band: `${a}-${b}`, n: xs.length, meanShare: f2(s), rms: f2(Math.sqrt(mean(xs.map((c) => c.miss ** 2)))), rmsAfterPrior: f2(Math.sqrt(mean(xs.map((c) => c.missP ** 2)))), sd: f2(sd(xs.map((c) => c.miss))), v2sd: f2(Math.max(1, 1.08 * Math.sqrt(s / 8))), sqrtFormula: f2(1.08 * Math.sqrt(s / 8)) }; }));
// Regressions in the 2-5 band.
function ols(rows, xsF) {
  const X = rows.map((c) => [1, ...xsF.map((f) => f(c))]), y = rows.map((c) => c.miss); const k = X[0].length;
  const XtX = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X.reduce((a, r) => a + r[i] * r[j], 0)));
  const Xty = Array.from({ length: k }, (_, i) => X.reduce((a, r, n) => a + r[i] * y[n], 0));
  // Gauss-Jordan inverse
  const A = XtX.map((r, i) => [...r, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < k; i++) { let p = i; for (let r = i + 1; r < k; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; const d = A[i][i]; for (let j = 0; j < 2 * k; j++) A[i][j] /= d; for (let r = 0; r < k; r++) if (r !== i) { const f = A[r][i]; for (let j = 0; j < 2 * k; j++) A[r][j] -= f * A[i][j]; } }
  const inv = A.map((r) => r.slice(k)); const b = inv.map((r) => r.reduce((a, v, j) => a + v * Xty[j], 0));
  const res = y.map((v, n) => v - X[n].reduce((a, x, j) => a + x * b[j], 0)); const s2 = res.reduce((a, r) => a + r * r, 0) / (y.length - k);
  return { b, se: inv.map((r, i) => Math.sqrt(s2 * r[i])), rsd: Math.sqrt(s2), n: y.length };
}
const PhiC = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2); return 0.5 * (1 + (x >= 0 ? y : -y)); };
const show = (name, rows, fs, labels) => { const r = ols(rows, fs); return { model: name, n: r.n, ...Object.fromEntries(["const", ...labels].map((l, i) => [l, `${f2(r.b[i])} ± ${f2(r.se[i])}`])), residSd: f2(r.rsd) }; };
const band = C.filter(B25), bandNoBW = band.filter(notB);
console.log("\n## Q1-Q3 regressions, 2-5% band (coef ± se; OLS, se ignores the election clustering, so read them as optimistic)");
const regs = [
  show("dist", band, [(c) => c.dist], ["dist"]),
  show("desertion P−0.5 (sd 1.0)", band, [(c) => PhiC(c.dist / 1.0) - 0.5], ["P-0.5"]),
  show("new|solo", band, [(c) => +(c.isNew || c.isSolo)], ["newsolo"]),
  show("new|solo + arab", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab], ["newsolo", "arab"]),
  show("new|solo + arab + dist", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => c.dist], ["newsolo", "arab", "dist"]),
  show("new|solo + arab + P−0.5", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => PhiC(c.dist) - 0.5], ["newsolo", "arab", "P-0.5"]),
  show("d7 (final-week trend)", band, [(c) => c.d7], ["d7"]),
  show("d14", band, [(c) => c.d14], ["d14"]),
  show("new|solo + arab + d7", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => c.d7], ["newsolo", "arab", "d7"]),
  show("new|solo + arab + d14", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => c.d14], ["newsolo", "arab", "d14"]),
  show("same, no B&W 2021: new|solo + arab + dist", bandNoBW, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => c.dist], ["newsolo", "arab", "dist"]),
  show("same, no B&W 2021: d7", bandNoBW, [(c) => c.d7], ["d7"]),
  show("same, no B&W 2021: d14", bandNoBW, [(c) => c.d14], ["d14"]),
  show("all lists: d7", C, [(c) => c.d7], ["d7"]),
  show("all lists: d14", C, [(c) => c.d14], ["d14"]),
  show("6-8%: d14", C.filter((c) => c.rel >= 6 && c.rel <= 8), [(c) => c.d14], ["d14"]),
];
console.table(regs);
if (C[0].d28 != null) { console.log("\n## Q3 (whole-campaign data): 28-day trend"); console.table([show("2-5%: d28", band, [(c) => c.d28], ["d28"]), show("2-5%: new|solo + arab + d28", band, [(c) => +(c.isNew || c.isSolo), (c) => +c.arab, (c) => c.d28], ["newsolo", "arab", "d28"]), show("all: d28", C, [(c) => c.d28], ["d28"])]); console.log("2-5% mean |d28|", f2(mean(band.map((c) => Math.abs(c.d28))))); }
console.log("\n## Q3. Poll movement in the final 7 and 14 days (|field share change|), points");
const mv = (rows, k) => ({ n: rows.length, meanAbs: f2(mean(rows.map((c) => Math.abs(c[k])))), sd: f2(sd(rows.map((c) => c[k]))), meanSigned: f2(mean(rows.map((c) => c[k]))) });
console.table({ "2-5% d7": mv(band, "d7"), "2-5% d14": mv(band, "d14"), "6-8% d7": mv(C.filter((c) => c.rel >= 6 && c.rel <= 8), "d7"), "6-8% d14": mv(C.filter((c) => c.rel >= 6 && c.rel <= 8), "d14"), "all d7": mv(C, "d7"), "all d14": mv(C, "d14") });
// Sign agreement: does the miss go the way of the 14-day trend?
const agree = (rows, k) => rows.filter((c) => Math.abs(c[k]) >= 0.2).map((c) => Math.sign(c[k]) === Math.sign(c.miss));
for (const [nm, rows] of [["2-5%", band], ["all", C]]) for (const k of ["d7", "d14"]) { const a = agree(rows, k); console.log(`${nm} ${k} (|move| ≥ 0.2): miss in the trend's direction ${a.filter(Boolean).length}/${a.length}`); }
// Split-half check: early (2015, 2019-04, 2019-09) vs late (2020, 2021, 2022)
console.log("\n## Split halves (sign stability), 2-5% band");
const early = (c) => ["2013-01", "2015-03", "2019-04", "2019-09"].includes(c.key);
console.table([
  line("early: all", (c) => B25(c) && early(c)), line("late: all", (c) => B25(c) && !early(c)),
  line("early: new|solo", (c) => B25(c) && early(c) && (c.isNew || c.isSolo)), line("late: new|solo", (c) => B25(c) && !early(c) && (c.isNew || c.isSolo)),
  line("early: established non-Arab", (c) => B25(c) && early(c) && !c.isNew && !c.isSolo && !c.arab), line("late: established non-Arab", (c) => B25(c) && !early(c) && !c.isNew && !c.isSolo && !c.arab),
  line("early: Arab", (c) => B25(c) && early(c) && c.arab), line("late: Arab", (c) => B25(c) && !early(c) && c.arab),
  line("early: under 3.25", (c) => c.rel >= 2 && c.rel < 3.25 && early(c)), line("late: under 3.25", (c) => c.rel >= 2 && c.rel < 3.25 && !early(c)),
  line("early: 3.25-5", (c) => c.rel >= 3.25 && c.rel <= 5 && early(c)), line("late: 3.25-5", (c) => c.rel >= 3.25 && c.rel <= 5 && !early(c)),
]);
