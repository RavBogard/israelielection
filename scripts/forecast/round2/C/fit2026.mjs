/**
 * Round 2, agent C: the parameters fitted on all six elections (the 2026 fit) with cluster-bootstrap intervals, and
 * the effect of each variant on the 2026 forecast from data/polls.json (the 62 polls through Oct 22).
 *   node scripts/forecast/round2/C/fit2026.mjs [runs]
 */
import fs from "node:fs";
import path from "node:path";
import { here, run2026, cal } from "./common.mjs";
const RUNS = Number(process.argv[2]) || 20_000;
// CDATA=full fits on D1's whole-campaign cases (2013 included).
const cases = JSON.parse(fs.readFileSync(path.join(here, process.env.CDATA === "full" ? "cases-full.json" : "cases.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share }));
const CL = (await import("./common.mjs")).CLASSES;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const isTC = (c) => (c.isNew || c.isSolo) && !c.arab && c.share - (c.threshold ?? 3.25) < 2.75;
const shiftOf = (cs, n0 = 3) => { const xs = cs.filter(isTC).map((c) => c.miss); return xs.length + n0 ? (mean(xs) * xs.length) / (xs.length + n0) : NaN; };
const sdOf = (cs, n0 = 10) => { const xs = cs.filter((c) => c.share >= 2 && c.share <= 5).map((c) => c.miss - (CL[c.key][c.id] ?? 0)); return Math.sqrt((xs.reduce((a, x) => a + x * x, 0) + n0) / (xs.length + n0)); };
const rescueOf = (cs, n0 = 5) => { const xs = cs.filter((c) => !c.isNew && !c.isSolo && !c.arab && c.share >= 2 && c.share < 5).map((c) => c.miss); return (mean(xs) * xs.length) / (xs.length + n0); };
const keys = [...new Set(cases.map((c) => c.key))];
let seed = 11; const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const boot = (f, B = 4000) => { const v = []; for (let b = 0; b < B; b++) { const ks = keys.map(() => keys[Math.floor(rand() * keys.length)]); const x = f(ks.flatMap((k) => cases.filter((c) => c.key === k))); if (Number.isFinite(x)) v.push(x); } v.sort((a, b) => a - b); return `${v[Math.floor(0.05 * v.length)].toFixed(2)} … ${v[Math.floor(0.95 * v.length)].toFixed(2)}`; };
console.log("threshold-class cases:", cases.filter(isTC).map((c) => `${c.key} ${c.id} ${c.miss.toFixed(2)}`).join("; "));
console.table({
  "new/solo shift (shrunk n0=3)": { value: shiftOf(cases).toFixed(2), raw: mean(cases.filter(isTC).map((c) => c.miss)).toFixed(2), "90% (cluster boot)": boot(shiftOf) },
  "new/solo shift, unshrunk": { value: shiftOf(cases, 0).toFixed(2), raw: "", "90% (cluster boot)": boot((cs) => (cs.some(isTC) ? shiftOf(cs, 0) : NaN)) },
  "sd under 5%, net of prior (shrunk to 1.0, n0=10)": { value: sdOf(cases).toFixed(2), raw: Math.sqrt(mean(cases.filter((c) => c.share >= 2 && c.share <= 5).map((c) => (c.miss - (CL[c.key][c.id] ?? 0)) ** 2))).toFixed(2), "90% (cluster boot)": boot(sdOf) },
  "established small rescue (shrunk n0=5)": { value: rescueOf(cases).toFixed(2), raw: mean(cases.filter((c) => !c.isNew && !c.isSolo && !c.arab && c.share >= 2 && c.share < 5).map((c) => c.miss)).toFixed(2), "90% (cluster boot)": boot(rescueOf) },
});
// 2026 trend of the field shares (v2 field rule) for the lists near the line.
const near = ["poi", "res", "raam", "rz", "otzma", "utj", "yb", "noam"];
const at = (d) => run2026({ runs: 100 }, (p) => p.published <= d).fieldShare;
const t0 = at("2026-10-22"), t7 = at("2026-10-15"), t14 = at("2026-10-08");
console.table(Object.fromEntries(near.map((id) => [id, { "Oct 22": (t0[id] * 100).toFixed(2), "Oct 15": (t7[id] * 100).toFixed(2), "Oct 8": (t14[id] * 100).toFixed(2), d7: ((t0[id] - t7[id]) * 100).toFixed(2), d14: ((t0[id] - t14[id]) * 100).toFixed(2) }])));
const lp = cal.listPriors, est = ["yb", "rz"]; // no established non-Arab list sits under 5% in 2026; rz is at 5.8
const V = {
  "v2 (as published Oct 22)": {},
  "A2 sd = 2026 fit": { smallSd: { below: 0.069, sd: sdOf(cases) } },
  "B new/solo shift = 2026 fit (poi, res)": { listPriors: { ...lp, poi: shiftOf(cases), res: shiftOf(cases) } },
  "H recommended (A2 + B)": { smallSd: { below: 0.069, sd: sdOf(cases) }, listPriors: { ...lp, poi: shiftOf(cases), res: shiftOf(cases) } },
  "C1 desertion k=+0.6": { desertion: { k: 0.6, sd: 1.0, below: 0.06 } },
  "D1 trend +0.5·d7": { shift: Object.fromEntries(near.filter((id) => t0[id] < 0.05).map((id) => [id, 0.5 * (t0[id] - t7[id]) * 100])) },
  "E1 shared bloc factor": { smallSd: { below: 0.069, sd: 0.8 }, smallShared: 0.6 },
  "F2 skew α=−3": { swingDist: { below: 0.069, sd: 1.0, skewAlpha: -3 } },
  "no new/solo prior on poi, res": { listPriors: { ...lp, poi: 0, res: 0 } },
  "new/solo prior −1.2": { listPriors: { ...lp, poi: -1.2, res: -1.2 } },
  "unprinted-below default 2.5%": { belowDefault: 0.025 },
  "J1 new-list −0.8 funded by own bloc's largest (poi → Likud; res is mid: spread)": { listPriors: { ...lp, poi: 0, res: 0 }, shift: { poi: lp.poi, res: lp.res } },
  "K1 drop-in: poi, res priors funded in bloc (res is mid: unchanged)": { priorsInBloc: ["poi", "res"] },
  "K1 + unprinted 2.5% (recommended)": { priorsInBloc: ["poi", "res"], belowDefault: 0.025 },
};
const rows = [];
for (const [name, o] of Object.entries(V)) {
  const f = run2026({ runs: RUNS, ...o });
  const L = f.lists; const cell = (id) => `${L[id].share.toFixed(2)}% / ${L[id].passes}% / ${L[id].point}`;
  rows.push({ variant: name, "poi share/pass/pt": cell("poi"), "res": cell("res"), "raam": cell("raam"), "rz": cell("rz"), likud: f.lists.likud.point, net: f.blocs.net.point, "net mean": f.blocs.net.mean, opp: f.blocs.opp.point, mid: f.blocs.mid.point, arab: f.blocs.arab.point, "P(net≥61)": f.majority.net, "P(opp≥61)": f.majority.oppZionist });
}
console.table(rows);
