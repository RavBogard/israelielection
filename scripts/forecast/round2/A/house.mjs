/**
 * ROUND 2, AGENT A: estimates pollster house effects from history and writes house-effects.json beside this file.
 *   node scripts/forecast/round2/A/house.mjs [--data=auto|data|full] [--win=5] [--days=N] [--out=file] [--report]
 * Tables: "all" (every election in the record: for 2026) and "lfo:<key>" (only the elections before <key>: for the
 * leave-future-out backtest). --report prints the memo's tables (stability, size against standard error).
 */
import fs from "node:fs";
import path from "node:path";
import { here, loadElections, firmElectionMeans, shrink, FIRM_MAP, CLASS_NAMES, r3 } from "./lib-a.mjs";
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : d; };
const { source, elections } = loadElections(arg("data", "auto"));
const win = Number(arg("win", 5)), days = Number(arg("days", Infinity));
const compact = (t) => Object.fromEntries(Object.entries(t.firms).map(([f, v]) => [f, {
  elections: v.elections,
  net: v.net?.net?.shrunk ?? 0,
  class: Object.fromEntries(Object.entries(v.class ?? {}).map(([c, x]) => [c, x.shrunk])),
  list: Object.fromEntries(Object.entries(v.list ?? {}).filter(([, x]) => x.shrunk !== 0).map(([c, x]) => [c, x.shrunk])),
}]));
const tables = {};
const keyOf = (e) => e.key ?? e.election.slice(0, 7);
for (const e of elections) {
  const before = elections.filter((x) => x.election < e.election);
  if (!before.length) { tables["lfo:" + keyOf(e)] = { trainedOn: [], firms: {} }; continue; }
  const { cells, within } = firmElectionMeans(before, { win, days });
  const t = shrink(cells, within);
  tables["lfo:" + keyOf(e)] = { trainedOn: before.map(keyOf), hyper: pick(t.hyper), firms: compact(t) };
}
const all = (() => { const { cells, within } = firmElectionMeans(elections, { win, days }); return { cells, t: shrink(cells, within) }; })();
tables.all = { trainedOn: elections.map(keyOf), hyper: pick(all.t.hyper), firms: compact(all.t) };
function pick(h) { return Object.fromEntries(Object.entries(h).filter(([k]) => !k.startsWith("list:") || ["list:likud", "list:shas", "list:utj", "list:jl", "list:yb", "list:meretz", "list:labor", "list:raam"].includes(k))); }

const out = {
  about: "Pollster house effects, ROUND 2 agent A (docs/research/polls-method/round2/A-house-effects.md). A house effect is a firm's deviation from the contemporaneous field: its poll's vote share (D'Hondt midpoint, as model.mjs step 2) minus the mean of the other firms' polls within ±" + win + " days (Filber firms left out of the reference), averaged over the firm's polls in an election, then shrunk across elections by empirical Bayes (persistent variance τ² from cross-election products). Units: vote-share percentage points; positive = the firm puts the list or class above the field. 'all' uses every election (for 2026); 'lfo:<key>' only the elections before <key> (for the leave-future-out backtest).",
  generated: "node scripts/forecast/round2/A/house.mjs --data=" + arg("data", "auto"), source: "scripts/forecast/backtest/" + source, windowDays: win, campaignDays: Number.isFinite(days) ? days : "all",
  classes: { likud: "Likud (sum)", haredi: "Shas + UTJ (sum)", arab: "Arab-led lists (sum)", oppLargest: "the largest list of the Zionist opposition by field mean (one list)", small: "any other list under 5% in the field mean (mean per list; applied to each)", netOther: "the rest of the Netanyahu bloc (sum)", other: "the rest (sum)" },
  firmMap: FIRM_MAP,
  tables,
  detail: all.t.firms,
};
const outFile = arg("out", path.join(here, "house-effects.json"));
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(`wrote ${outFile} from ${source} (${elections.map(keyOf).join(", ")}), window ±${win} d`);

if (process.argv.includes("--report")) report(all.cells, all.t);
function report(cells, t) {
  const keys = ["net:net", ...CLASS_NAMES.map((c) => "class:" + c), "list:shas", "list:utj", "list:yb", "list:jl", "list:meretz", "list:labor"];
  console.log("\n## Hyperparameters (points): persistent sd τ, election drift sd ω, poll sd σ; pairs = cross-election firm pairs");
  console.log("| key | τ | ω | σ | rms of d | pairs | firm-elections | slope of d on firm's other-election mean (LOO) | sign agreement, consecutive | mean Spearman, consecutive |");
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  const eks = [...new Set(cells.map((c) => c.election))].sort();
  for (const k of keys) {
    const h = t.hyper[k]; if (!h) continue;
    const cs = cells.filter((c) => c.kind + ":" + c.id === k && !c.firm.startsWith("outlet:"));
    // LOO predictability: regress d_fe on mean of the firm's other elections
    let sxy = 0, sxx = 0; for (const c of cs) { const o = cs.filter((x) => x.firm === c.firm && x.election !== c.election); if (!o.length) continue; const m = o.reduce((a, x) => a + x.d, 0) / o.length; sxy += m * c.d; sxx += m * m; }
    let agree = 0, tot = 0; const rhos = [];
    for (let i = 1; i < eks.length; i++) {
      const a = cs.filter((c) => c.election === eks[i - 1]), b = cs.filter((c) => c.election === eks[i]);
      const both = a.filter((x) => b.some((y) => y.firm === x.firm)).map((x) => [x.d, b.find((y) => y.firm === x.firm).d]);
      for (const [x, y] of both) { tot++; if (Math.sign(x) === Math.sign(y)) agree++; }
      if (both.length >= 4) rhos.push(spearman(both));
    }
    const sq = (x) => Math.sqrt(Math.max(0, x)).toFixed(2);
    console.log(`| ${k} | ${h.tau2 > 0 ? sq(h.tau2) : "0 (" + h.tau2.toFixed(3) + ")"} | ${sq(h.omega2)} | ${sq(h.sig2)} | ${h.rms.toFixed(2)} | ${h.pairs} | ${h.cells} | ${sxx ? (sxy / sxx).toFixed(2) : "—"} | ${agree}/${tot} | ${rhos.length ? (rhos.reduce((a, b) => a + b, 0) / rhos.length).toFixed(2) + " (" + rhos.length + ")" : "—"} |`);
  }
  console.log("\n## Per firm (points): raw mean ± se → shrunk; elections; t = raw/se");
  const firms = Object.entries(t.firms).filter(([f]) => !f.startsWith("outlet:")).sort((a, b) => b[1].elections - a[1].elections);
  const cols = ["net:net", "class:likud", "class:haredi", "class:arab", "class:oppLargest", "class:small", "class:netOther", "class:other"];
  console.log("| firm | el. | " + cols.map((c) => c.split(":")[1]).join(" | ") + " |"); console.log("|---|---|" + cols.map(() => "---").join("|") + "|");
  for (const [f, v] of firms) console.log(`| ${f} | ${v.elections} | ` + cols.map((c) => { const [k, id] = c.split(":"); const x = v[k]?.[id]; return x ? `${fmt(x.raw)}±${x.se.toFixed(2)} → **${fmt(x.shrunk)}**` : "—"; }).join(" | ") + " |");
  console.log("\n## Net bloc by election (points)"); console.log("| firm | " + eks.join(" | ") + " |"); console.log("|---|" + eks.map(() => "---").join("|") + "|");
  for (const [f, v] of firms) console.log(`| ${f} | ` + eks.map((e) => v.net?.net?.byElection?.[e] != null ? fmt(v.net.net.byElection[e]) : "").join(" | ") + " |");
  console.log("\n## Shas, UTJ, Arab class by election (points)");
  for (const id of ["list:shas", "list:utj", "class:arab"]) { console.log(`\n${id}\n| firm | ` + eks.join(" | ") + " |"); console.log("|---|" + eks.map(() => "---").join("|") + "|"); const [k, i] = id.split(":"); for (const [f, v] of firms) if (v[k]?.[i]) console.log(`| ${f} | ` + eks.map((e) => v[k][i].byElection[e] != null ? fmt(v[k][i].byElection[e]) : "").join(" | ") + " |"); }
}
if (process.argv.includes("--report")) {
  // firm vs outlet as the unit: persistent sd τ (points) of the net-bloc and class effects
  const o = firmElectionMeans(elections, { win, days, unit: "outlet" }); const to = shrink(o.cells, o.within);
  console.log("\n## Unit: firm vs outlet. Persistent sd τ (points; 0 = none found) and cross-election pairs");
  console.log("| key | τ, firm | pairs | τ, outlet | pairs |\n|---|---|---|---|---|");
  for (const k of ["net:net", "class:likud", "class:haredi", "class:arab", "class:oppLargest", "class:other", "list:shas"]) { const a = all.t.hyper[k], b = to.hyper[k]; const q = (h) => (h.tau2 > 0 ? Math.sqrt(h.tau2).toFixed(2) : "0"); console.log(`| ${k} | ${q(a)} | ${a.pairs} | ${q(b)} | ${b.pairs} |`); }
}
function fmt(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2); }
function spearman(pairs) { const rk = (xs) => { const s = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]); const r = []; s.forEach(([, i], j) => (r[i] = j)); return r; }; const a = rk(pairs.map((p) => p[0])), b = rk(pairs.map((p) => p[1])); const n = pairs.length; const d2 = a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0); return 1 - (6 * d2) / (n * (n * n - 1)); }
