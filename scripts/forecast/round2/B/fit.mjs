/**
 * Round 2, agent B: how much of the Arab lists' and the Haredi lists' final-week poll misses is sector turnout?
 *   node scripts/forecast/round2/B/fit.mjs
 * Gaps: model.mjs's own field and seats-to-shares (lean, priors, withdrawals off), as D2's gaps.mjs computes them;
 * 2013 from sectors.json (round 1's table). Turnout: sectors.json.
 */
import { S, I, Iturn, mech, arabRows } from "./common.mjs";
const rows = arabRows();
const ols = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; for (let k = 0; k < n; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) ** 2; } const b = sxx ? sxy / sxx : 0, a = my - b * mx; const res = ys.map((y, k) => y - a - b * xs[k]); const sst = ys.reduce((q, y) => q + (y - my) ** 2, 0); return { a, b, r2: 1 - res.reduce((q, e) => q + e * e, 0) / sst, rmse: Math.sqrt(res.reduce((q, e) => q + e * e, 0) / n), res }; };
const f2 = (x) => (x >= 0 ? "+" : "") + x.toFixed(2);

console.log("\nQ1. Arab lists: poll miss (points of the valid vote) against the turnout effect the polls would miss if they anchored on the previous election's sector turnout.");
console.table(rows.map((r) => ({ election: r.key, pollPct: r.poll.toFixed(2), resultPct: r.res.toFixed(2), gap: f2(r.gap), "I_t/I_t-1": r.xI.toFixed(3), mechI: f2(r.mechI), "turnout-only ratio": r.xT.toFixed(3), mechT: f2(r.mechT) })));
const gaps = rows.map((r) => r.gap);
for (const [name, k] of [["mechI (turnout x loyalty)", "mechI"], ["mechT (turnout only)", "mechT"]]) {
  const o = ols(rows.map((r) => r[k]), gaps);
  const noInt = rows.reduce((a, r) => a + r[k] * r.gap, 0) / rows.reduce((a, r) => a + r[k] ** 2, 0);
  const resNI = rows.map((r) => r.gap - noInt * r[k]); 
  console.log(`  ${name}: gap = ${o.a.toFixed(2)} + ${o.b.toFixed(2)} x mech, R2 ${o.r2.toFixed(2)}, rmse ${o.rmse.toFixed(2)} (gap sd ${Math.sqrt(gaps.reduce((a, g) => a + (g - gaps.reduce((x, y) => x + y, 0) / gaps.length) ** 2, 0) / gaps.length).toFixed(2)}, gap rms ${Math.sqrt(gaps.reduce((a, g) => a + g * g, 0) / gaps.length).toFixed(2)}); through the origin slope ${noInt.toFixed(2)}, rmse ${Math.sqrt(resNI.reduce((a, e) => a + e * e, 0) / resNI.length).toFixed(2)}; with slope fixed at 1: mean residual ${f2(rows.reduce((a, r) => a + r.gap - r[k], 0) / rows.length)}, rmse about it ${Math.sqrt(rows.reduce((a, r) => a + (r.gap - r[k] - rows.reduce((q, z) => q + z.gap - z[k], 0) / rows.length) ** 2, 0) / rows.length).toFixed(2)}`);
  // halves
  for (const [h, rr] of [["2013-2019a", rows.slice(0, 3)], ["2019b-2022", rows.slice(3)]]) { const oh = ols(rr.map((r) => r[k]), rr.map((r) => r.gap)); console.log(`     ${h}: slope ${oh.b.toFixed(2)}, intercept ${oh.a.toFixed(2)}`); }
}
console.log("  Sign agreement gap vs mechI:", rows.filter((r) => Math.sign(r.gap) === Math.sign(r.mechI)).length + "/" + rows.length);

console.log("\nQ1. Haredi lists: Haredi-city turnout ratio vs general, and the mechanical effect on Shas+UTJ.");
console.table(rows.filter((r) => r.har).map((r) => { const x = r.hc && r.hcPrev ? (r.hc / r.gT) / (r.hcPrev / r.gTprev) : null; const s = r.har.poll / 100; return { election: r.key, shasUtjPoll: r.har.poll.toFixed(2), gap: f2(r.har.res - r.har.poll), shasGap: f2(r.har.shasGap), utjGap: f2(r.har.utjGap), harediCityTurnout: r.hc ?? "-", "ratio change": x ? f2(100 * (x - 1)) + "%" : "-", mech: x ? f2(100 * mech(s, x)) : "-" }; }));

for (const [IDX, idxName, mk] of [[Iturn, "turnout only, r = T_A/T_G", "mechT"], [I, "turnout x loyalty", "mechI"]]) {
{ const hr = rows.filter((r) => r.har && r.hc && r.hcPrev).map((r) => { const x = (r.hc / r.gT) / (r.hcPrev / r.gTprev); return { x, utjM: 100 * mech(r.har.poll / 100 * 0.45, x), all: 100 * mech(r.har.poll / 100, x), utj: r.har.utjGap, shas: r.har.shasGap, tot: r.har.res - r.har.poll }; });
  const sg = (a, b) => hr.filter((r) => Math.sign(r[a]) === Math.sign(r[b])).length + "/" + hr.length;
  const o = ols(hr.map((r) => r.all), hr.map((r) => r.tot));
  console.log(`  Shas+UTJ gap on the Haredi mech: slope ${o.b.toFixed(2)}, intercept ${o.a.toFixed(2)}, R2 ${o.r2.toFixed(2)}; sign agreement Shas+UTJ ${sg("all", "tot")}, UTJ alone ${sg("all", "utj")}; |mech| mean ${(hr.reduce((a, r) => a + Math.abs(r.all), 0) / hr.length).toFixed(2)} pts against mean gap ${(hr.reduce((a, r) => a + r.tot, 0) / hr.length).toFixed(2)} (Shas ${(hr.reduce((a, r) => a + r.shas, 0) / hr.length).toFixed(2)}, UTJ ${(hr.reduce((a, r) => a + r.utj, 0) / hr.length).toFixed(2)})`); }

// Q2. Can the turnout effect be forecast before the vote? Mean reversion of I, leave-future-out.
console.log("\nQ2. Forecasting the index (" + idxName + ") before the vote (leave-future-out): persistence vs mean reversion with k fitted on earlier pairs.");
const ser = S.series;
const out = [];
for (let t = 4; t < ser.length; t++) {
  const pairs = []; for (let j = 2; j < t; j++) { const hist = ser.slice(0, j).map(IDX), m = hist.reduce((a, b) => a + b, 0) / hist.length; pairs.push({ dev: m - IDX(ser[j - 1]), ch: IDX(ser[j]) - IDX(ser[j - 1]) }); }
  const k = Math.max(0, Math.min(1, pairs.reduce((a, p) => a + p.dev * p.ch, 0) / pairs.reduce((a, p) => a + p.dev ** 2, 0)));
  const hist = ser.slice(0, t).map(IDX), m = hist.reduce((a, b) => a + b, 0) / hist.length, last = IDX(ser[t - 1]);
  const pred = last + k * (m - last);
  out.push({ key: ser[t].key, k: k.toFixed(2), mean: m.toFixed(3), last: last.toFixed(3), pred: pred.toFixed(3), actual: IDX(ser[t]).toFixed(3), errPersist: (IDX(ser[t]) - last).toFixed(3), errRevert: (IDX(ser[t]) - pred).toFixed(3), _p: pred, _l: last, _a: IDX(ser[t]) });
}
console.table(out.map(({ _p, _l, _a, ...x }) => x));
const rms = (xs) => Math.sqrt(xs.reduce((a, b) => a + b * b, 0) / xs.length);
const sc = out.filter((x) => x.key >= "2015");
console.log(`  2015-2022 rms error of I: persistence ${rms(sc.map((x) => x._a - x._l)).toFixed(3)}, reversion ${rms(sc.map((x) => x._a - x._p)).toFixed(3)}; as a log ratio: persistence ${rms(sc.map((x) => Math.log(x._a / x._l))).toFixed(3)}, reversion ${rms(sc.map((x) => Math.log(x._a / x._p))).toFixed(3)}`);
console.log(`  sign of (I_t - I_t-1) called by reversion: ${sc.filter((x) => Math.sign(x._p - x._l) === Math.sign(x._a - x._l)).length}/${sc.length}`);

// Sector-level leave-future-out: predict the Arab gap from what was known before each election.
console.log("\nQ2. Arab-lists gap predicted leave-future-out (points). Rules: none; v2's fixed classes (+0.5 per Arab list, backtest/v2.mjs CLASSES); past-mean intercept; turnout model = alpha + beta x mech(E[I_t]) with alpha, beta fitted on earlier elections and shrunk.");
var v2prior = { "2015-03": 0.5, "2019-04": 1.0, "2019-09": 0.5, "2020-03": 0.5, "2021-03": 1.0, "2022-11": 1.5 };
var res2 = [];
for (const r of rows.filter((x) => x.key >= "2015")) {
  const past = rows.filter((x) => x.key < r.key);
  const alpha = past.reduce((a, x) => a + x.gap - x[mk], 0) / past.length; // slope fixed at 1 (physical), intercept = mean residual
  const alphaShr = alpha * past.length / (past.length + 2); // shrink toward 0 with 2 pseudo-elections
  const pr = out.find((x) => x.key === r.key); const s = r.poll / 100;
  const mPred = 100 * mech(s, pr._p / pr._l);
  res2.push({ election: r.key, gap: f2(r.gap), v2: f2(v2prior[r.key]), pastMean: f2(past.reduce((a, x) => a + x.gap, 0) / past.length), alphaShr: f2(alphaShr), mechPred: f2(mPred), turnoutModel: f2(alphaShr + mPred), _g: r.gap, _v2: v2prior[r.key], _pm: past.reduce((a, x) => a + x.gap, 0) / past.length, _tm: alphaShr + mPred, _a: alphaShr });
}
console.table(res2.map((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith("_")))));
const mae = (f) => (res2.reduce((a, x) => a + Math.abs(x._g - f(x)), 0) / res2.length).toFixed(2);
console.log(`  MAE of the Arab gap, 2015-2022: none ${mae(() => 0)}, v2 classes ${mae((x) => x._v2)}, past-mean ${mae((x) => x._pm)}, shrunk intercept only ${mae((x) => x._a)}, turnout model ${mae((x) => x._tm)}`);
console.log(`  Residual sd of the Arab gap around the turnout model: ${rms(res2.map((x) => x._g - x._tm)).toFixed(2)} points; around v2 classes ${rms(res2.map((x) => x._g - x._v2)).toFixed(2)}; around 0 ${rms(res2.map((x) => x._g)).toFixed(2)}`);

}
