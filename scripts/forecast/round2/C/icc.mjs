/**
 * Round 2, agent C: how much of the borderline lists' miss is shared by the small lists of one bloc in one election
 * (one-way random-effects ANOVA on miss net of the class means), 2-5% band.   node scripts/forecast/round2/C/icc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { here } from "./common.mjs";
const C = JSON.parse(fs.readFileSync(path.join(here, process.env.CDATA === "full" ? "cases-full.json" : "cases.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share, rel: c.share - (c.threshold ?? 3.25) + 3.25 }));
const band = C.filter((c) => c.rel >= 2 && c.rel <= 5);
const cls = (c) => ((c.isNew || c.isSolo) && !c.arab ? "ns" : c.arab ? "arab" : "est");
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const cm = {}; for (const k of ["ns", "arab", "est"]) cm[k] = mean(band.filter((c) => cls(c) === k).map((c) => c.miss));
const r = band.map((c) => ({ g: c.key + ":" + c.bloc, x: c.miss - cm[cls(c)], c }));
const groups = {}; for (const x of r) (groups[x.g] ??= []).push(x.x);
const G = Object.values(groups), N = r.length, k = G.length, grand = mean(r.map((x) => x.x));
const ssb = G.reduce((a, g) => a + g.length * (mean(g) - grand) ** 2, 0), ssw = G.reduce((a, g) => a + g.reduce((b, x) => b + (x - mean(g)) ** 2, 0), 0);
const msb = ssb / (k - 1), msw = ssw / (N - k), n0 = (N - G.reduce((a, g) => a + g.length ** 2, 0) / N) / (k - 1);
const s2b = Math.max(0, (msb - msw) / n0);
console.log("class means", Object.fromEntries(Object.entries(cm).map(([a, b]) => [a, b.toFixed(2)])));
console.log(`cases ${N}, election×bloc groups ${k} (${G.filter((g) => g.length > 1).length} with 2+ lists)`);
console.log(`within-group sd ${Math.sqrt(msw).toFixed(2)}, between-group sd ${Math.sqrt(s2b).toFixed(2)}, total ${Math.sqrt(msw + s2b).toFixed(2)}, share of variance shared ${(s2b / (msw + s2b)).toFixed(2)}`);
for (const [g, xs] of Object.entries(groups)) if (xs.length > 1) console.log(" ", g, xs.map((x) => x.toFixed(2)).join(" "), "mean", mean(xs).toFixed(2));
