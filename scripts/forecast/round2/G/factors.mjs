/** Q1. A low-rank structure for the list residuals, estimated on the six elections with shrinkage.
 *  Residual = result − v2's leave-future-out central share (priors and lean in), in seats (points × 1.2).
 *  Factors per election: net swing (the Netanyahu bloc's summed miss), Arab turnout (the Arab bloc's summed miss),
 *  consolidation (the largest list's within-bloc deviation, net and opposition), Haredi (Shas + UTJ within-bloc
 *  deviation), and the idiosyncratic remainder of the other lists. Each sd is reported on all six, on each half
 *  (2015–Sep 2019, 2020–2022), and shrunk toward version 2's value with k = 4 pseudo-elections:
 *  s² = (n·ŝ² + k·s₀²)/(n + k).   node factors.mjs */
import { forecast } from "./model-g.mjs";
import { elections, runOpts } from "./common.mjs";
const S = 1.2;
const F = { net: [], arab: [], consNet: [], consOpp: [], haredi: [], idioSmall: [], idioLarge: [] };
for (const e of elections) {
  const f = forecast(runOpts(e, { runs: 100, keepRuns: true })); const c = f.central, ids = Object.keys(e.lists);
  const r = Object.fromEntries(ids.map((id) => [id, S * (e.result.lists[id].pct - 100 * c[id])]));
  const R = {}, B = {}; for (const id of ids) { const b = e.blocs[id]; R[b] = (R[b] ?? 0) + r[id]; B[b] = (B[b] ?? 0) + c[id]; }
  const d = Object.fromEntries(ids.map((id) => [id, r[id] - R[e.blocs[id]] * c[id] / B[e.blocs[id]]]));
  F.net.push(R.net); F.arab.push(R.arab ?? 0);
  const lg = (b) => ids.filter((id) => e.blocs[id] === b).sort((x, y) => c[y] - c[x])[0];
  F.consNet.push(d[lg("net")]); F.consOpp.push(d[lg("opp")]);
  F.haredi.push(d.shas + d.utj);
  for (const id of ids) if (id !== lg("net") && id !== lg("opp") && !["shas", "utj"].includes(id) && e.blocs[id] !== "mid" && ids.filter((x) => e.blocs[x] === e.blocs[id]).length > 1) (100 * c[id] < 7 ? F.idioSmall : F.idioLarge).push({ k: e.key, v: d[id] });
}
const rms = (xs) => Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length), mean = (xs) => xs.reduce((a, x) => a + x, 0) / xs.length;
const sdAbout = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
const v2 = { net: "3.1 (normal; realised 2.7 pt = 3.2 seats in shares)", arab: 1.7, consNet: 1.5, consOpp: 1.5, haredi: "1.6–1.9 from list noise (below)", idioSmall: "1.2 seats (1.0 pt floor)", idioLarge: "1.2–1.6 seats" };
const v2num = { net: 3.1, arab: 1.7, consNet: 1.5, consOpp: 1.5, haredi: 1.7, idioSmall: 1.2, idioLarge: 1.4 };
const rows = [];
for (const [k, xs0] of Object.entries(F)) {
  const xs = xs0.map((x) => (typeof x === "number" ? x : x.v)), first = xs0.filter((x, i) => (typeof x === "number" ? i < 3 : x.k < "2020")).map((x) => (typeof x === "number" ? x : x.v)), second = xs0.filter((x, i) => (typeof x === "number" ? i >= 3 : x.k >= "2020")).map((x) => (typeof x === "number" ? x : x.v));
  const n = xs.length, nEff = k.startsWith("idio") ? 6 : n, s2 = rms(xs) ** 2, shr = Math.sqrt((nEff * s2 + 4 * v2num[k] ** 2) / (nEff + 4));
  rows.push({ factor: k, n, values: xs.length <= 6 ? xs.map((x) => x.toFixed(1)).join(" ") : "", mean: +mean(xs).toFixed(2), "RMS (all)": +rms(xs).toFixed(2), "sd about mean": +sdAbout(xs).toFixed(2), "RMS 2015–19": +rms(first).toFixed(2), "RMS 2020–22": +rms(second).toFixed(2), v2: v2[k], "shrunk RMS": +shr.toFixed(2) });
}
console.log("Seats (×1.2 of vote-share points). Residuals against v2's leave-future-out central shares.");
console.table(rows);
// What v2's independent list noise already gives the Haredi pair: sd of (Shas + UTJ) within-bloc deviation, seats.
const hs = [];
for (const e of elections) {
  const f = forecast(runOpts(e, { runs: 20_000, keepRuns: true, keepShares: true })); const Sx = f.shareRuns, c = f.central;
  const ids = Object.keys(e.lists).filter((id) => e.blocs[id] === "net"), Bc = ids.reduce((a, id) => a + c[id], 0); let s = 0, s2 = 0;
  for (let i = 0; i < f.runs; i++) { const R = ids.reduce((a, id) => a + Sx[id][i] - c[id], 0); const x = S * 100 * (Sx.shas[i] - c.shas + Sx.utj[i] - c.utj - R * (c.shas + c.utj) / Bc); s += x; s2 += x * x; }
  hs.push(`${e.key} ${Math.sqrt(s2 / f.runs - (s / f.runs) ** 2).toFixed(2)}`);
}
console.log("v2's simulated sd of the Shas + UTJ within-bloc deviation (seats): " + hs.join(", "));
