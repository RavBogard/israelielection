/** Q4. The seats-from-shares step and the `point` rule.
 *  (a) allocate() on simulated shares versus on whole votes (4.8 million valid votes), on 2026 draws.
 *  (b) `point` (median reconciled to 120) against each list's simulated mean, and against the result.
 *  node points.mjs */
import { forecast, THRESHOLD, KNESSET } from "./model-g.mjs";
import { elections, runOpts, inputs2026, cal } from "./common.mjs";
// (a) A copy of model.mjs's allocate(), as a function of ids, pairs and fringe.
function makeAllocate(ids, pairs, FRINGE) {
  return function allocate(votes) {
    const total = ids.reduce((a, k) => a + Math.max(0, votes[k] ?? 0), 0) + FRINGE;
    const pass = ids.filter((k) => (votes[k] ?? 0) >= THRESHOLD * total);
    const paired = new Map(); for (const [a, b] of pairs) if (pass.includes(a) && pass.includes(b)) { paired.set(a, a + "+" + b); paired.set(b, a + "+" + b); }
    const units = new Map(); for (const k of pass) { const key = paired.get(k) ?? k; units.set(key, (units.get(key) ?? 0) + Math.max(votes[k], THRESHOLD * total)); }
    const dh = (m, n) => { const s = Object.fromEntries([...m.keys()].map((k) => [k, 0])); for (let i = 0; i < n; i++) { let best, bv = -1; for (const [k, v] of m) { const q = v / (s[k] + 1); if (q > bv) { bv = q; best = k; } } s[best]++; } return s; };
    const out = {}; for (const [key, n] of Object.entries(dh(units, KNESSET))) { if (key.includes("+")) { const [a, b] = key.split("+"); Object.assign(out, dh(new Map([[a, votes[a]], [b, votes[b]]]), n)); } else out[key] = n; }
    return out;
  };
}
{
  const inp = inputs2026({ runs: 20_000, keepRuns: true, keepShares: true }); const f = forecast(inp);
  const ids = Object.keys(f.shareRuns), pairs = f.inputs.agreements, FR = cal.fringe.share, V = 4_800_000;
  const alloc = makeAllocate(ids, pairs, FR); let diff = 0, seats = 0;
  for (let i = 0; i < f.runs; i++) {
    const v = Object.fromEntries(ids.map((id) => [id, f.shareRuns[id][i]])); const w = Object.fromEntries(ids.map((id) => [id, Math.round(v[id] * V) / V]));
    const a = alloc(v), b = alloc(w); let d = 0; for (const id of ids) d += Math.abs((a[id] ?? 0) - (b[id] ?? 0)); if (d) diff++; seats += d / 2;
    // and the check that the stored draws reproduce the model's own seat draws
    for (const id of ids) if ((a[id] ?? 0) !== f.seatRuns[id][i]) throw new Error("replay mismatch");
  }
  console.log(`(a) 2026, ${f.runs} draws: allocation on whole votes differs from allocation on shares in ${diff} draws (${seats} seats moved). Float32 replay reproduces every draw.`);
}
// (b)
const rows = [];
const all = [];
for (const [key, inp] of [...elections.map((e) => [e.key, runOpts(e, { runs: 20_000, keepRuns: true })]), ["2026", inputs2026({ runs: 50_000, keepRuns: true })]]) {
  const f = forecast(inp); const ids = Object.keys(f.lists);
  const med = Object.fromEntries(ids.map((id) => { const s = Int8Array.from(f.seatRuns[id]).sort(); return [id, s[s.length >> 1]]; }));
  const sumMed = ids.reduce((a, id) => a + med[id], 0), adj = ids.filter((id) => med[id] !== f.lists[id].point);
  const e = elections.find((x) => x.key === key);
  for (const id of ids) all.push({ key, id, point: f.lists[id].point, mean: f.seatRuns[id].reduce((a, b) => a + b, 0) / f.runs, med: med[id], pass: f.raw.passRate[id], y: e ? e.result.lists[id].seats : null });
  rows.push({ key, "sum of medians": sumMed, "lists moved by reconciliation": adj.map((id) => `${id} ${med[id]}→${f.lists[id].point}`).join(", ") || "none" });
}
console.table(rows);
const safe = all.filter((x) => x.pass >= 0.95), thr = all.filter((x) => x.pass < 0.95);
const avg = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / xs.length;
console.log(`(b) point − simulated mean: safe lists (n=${safe.length}) mean ${avg(safe, (x) => x.point - x.mean).toFixed(3)}, mean |.| ${avg(safe, (x) => Math.abs(x.point - x.mean)).toFixed(3)}; threshold lists (n=${thr.length}) mean ${avg(thr, (x) => x.point - x.mean).toFixed(3)}`);
for (const [lo, hi] of [[0, 8], [8, 15], [15, 50]]) { const m = safe.filter((x) => x.mean >= lo && x.mean < hi); console.log(`   safe lists with mean ${lo}-${hi} seats: n=${m.length}, mean (point − mean) ${avg(m, (x) => x.point - x.mean).toFixed(3)}`); }
const bt = all.filter((x) => x.y != null);
const alt = { "point (median, reconciled)": (x) => x.point, "raw median": (x) => x.med, "round(mean)": (x) => Math.round(x.mean), "mean (unrounded)": (x) => x.mean };
for (const [k, f] of Object.entries(alt)) console.log(`   backtest ${k}: per-list MAE ${avg(bt, (x) => Math.abs(f(x) - x.y)).toFixed(3)}, mean signed error ${avg(bt, (x) => f(x) - x.y).toFixed(3)}; safe lists signed ${avg(bt.filter((x) => x.pass >= 0.95), (x) => f(x) - x.y).toFixed(3)}, large (mean ≥ 15) signed ${avg(bt.filter((x) => x.mean >= 15), (x) => f(x) - x.y).toFixed(2)}`);
