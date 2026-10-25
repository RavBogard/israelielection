/**
 * ROUND 2, AGENT A: two direct out-of-sample tests, firm by firm.
 *  (1) Does a firm's house effect from EARLIER elections predict its deviation from the field in THIS election?
 *      MSE of d_fe with no correction vs after subtracting the leave-future-out shrunk (and raw) estimate.
 *  (2) Bias against the RESULT: each firm's final-week polls (last 7 days of the 28-day file) minus the result share
 *      (the result renormalised to the lists the polls report), split into the common miss of all firms (what the
 *      global list priors model) and the firm's own part; is the firm's own part persistent?
 *   node scripts/forecast/round2/A/predict.mjs [--data=auto|data|full] [--win=5]
 */
import { loadElections, firmElectionMeans, shrink, pollShares, canonFirm, classesOf, meanByFirm, CLASS_NAMES, SUM_CLASSES } from "./lib-a.mjs";
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : d; };
const { source, elections } = loadElections(arg("data", "auto")); const win = Number(arg("win", 5));
const keyOf = (e) => e.key ?? e.election.slice(0, 7);
console.log(`source ${source}; window ±${win} d`);

// (1) out-of-sample prediction of firm deviations
const KEYS = ["net:net", "class:likud", "class:haredi", "class:arab", "class:oppLargest", "class:small", "class:netOther", "class:other", "list:shas", "list:utj", "list:yb", "list:jl"];
const acc = Object.fromEntries(KEYS.map((k) => [k, { n: 0, none: 0, shrunk: 0, raw: 0, half: 0 }]));
const { cells: allCells } = firmElectionMeans(elections, { win });
for (const e of elections) {
  const before = elections.filter((x) => x.election < e.election); if (before.length < 2) continue;
  const { cells, within } = firmElectionMeans(before, { win }); const t = shrink(cells, within);
  const rawBy = {}; for (const c of cells) ((rawBy[c.firm] ??= {})[c.kind + ":" + c.id] ??= []).push(c.d);
  for (const c of allCells.filter((x) => x.election === keyOf(e) && !x.firm.startsWith("outlet:"))) {
    const k = c.kind + ":" + c.id; if (!acc[k]) continue;
    const prior = t.firms[c.firm]?.[c.kind]?.[c.id]; if (!prior) continue; // firm has no record on this key
    const rv = rawBy[c.firm]?.[k]; const raw = rv ? rv.reduce((a, b) => a + b, 0) / rv.length : 0;
    const a = acc[k]; a.n++; a.none += c.d ** 2; a.shrunk += (c.d - prior.shrunk) ** 2; a.raw += (c.d - raw) ** 2; a.half += (c.d - prior.shrunk / 2) ** 2;
  }
}
console.log("\n## (1) Out-of-sample: RMS of a firm's deviation from the field (points), before and after subtracting its earlier-elections estimate (each election with two or more earlier ones; firms with a record)");
console.log("| key | firm-elections | no correction | − shrunk (LFO) | − shrunk ×½ | − raw mean (LFO) | shrunk: change |"); console.log("|---|---|---|---|---|---|---|");
for (const [k, a] of Object.entries(acc)) if (a.n) { const r = (x) => Math.sqrt(x / a.n); console.log(`| ${k} | ${a.n} | ${r(a.none).toFixed(3)} | ${r(a.shrunk).toFixed(3)} | ${r(a.half).toFixed(3)} | ${r(a.raw).toFixed(3)} | ${((r(a.shrunk) / r(a.none) - 1) * 100).toFixed(1)}% |`); }

// (2) bias against the result
const BK = ["likud", "shas", "utj", "haredi", "arab", "net", "oppLargest"];
const bias = []; // {e, firm, key, b}
for (const e of elections) {
  const ids = Object.keys(e.lists), last = Date.parse(e.election) / 864e5;
  const fin = e.polls.filter((p) => p.kind !== "exit" && last - Date.parse(p.published) / 864e5 <= 7);
  const tot = ids.reduce((a, id) => a + (e.result.lists[id]?.pct ?? 0), 0);
  const res = Object.fromEntries(ids.map((id) => [id, (e.result.lists[id]?.pct ?? 0) / tot]));
  const xs = fin.map((p) => ({ firm: canonFirm(p, e.polls), s: pollShares(p, ids), filber: !!p.filber }));
  const fm = meanByFirm(xs.filter((x) => !x.filber), ids); const cls = classesOf(e.blocs, fm);
  const by = {}; for (const x of xs) (by[x.firm] ??= []).push(x);
  for (const [firm, ps] of Object.entries(by)) {
    const m = meanByFirm(ps, ids); // one firm: its mean
    const sum = (sel) => { const L = ids.filter(sel); if (!L.every((id) => m[id] != null)) return null; return L.reduce((a, id) => a + (m[id] - res[id]) * 100, 0); };
    const row = { likud: sum((id) => id === "likud"), shas: sum((id) => id === "shas"), utj: sum((id) => id === "utj"), haredi: sum((id) => cls[id] === "haredi"), arab: sum((id) => cls[id] === "arab"), net: sum((id) => e.blocs[id] === "net"), oppLargest: sum((id) => cls[id] === "oppLargest") };
    for (const k of BK) if (row[k] != null) bias.push({ e: keyOf(e), firm, key: k, b: row[k], filber: ps[0].filber });
  }
}
console.log("\n## (2) Final-week bias against the result (points, poll − result; result renormalised to the polled lists). common = mean of the non-Filber firms that election");
const eks = elections.map(keyOf);
for (const k of ["shas", "utj", "arab", "likud", "net"]) {
  console.log(`\n### ${k}\n| firm | ` + eks.join(" | ") + " | mean | firm part mean | sign of firm part |"); console.log("|---|" + eks.map(() => "---").join("|") + "|---|---|---|");
  const common = Object.fromEntries(eks.map((e) => { const v = bias.filter((x) => x.e === e && x.key === k && !x.filber && !x.firm.startsWith("outlet:")); return [e, v.length ? v.reduce((a, x) => a + x.b, 0) / v.length : null]; }));
  const firms = [...new Set(bias.filter((x) => x.key === k).map((x) => x.firm))].filter((f) => !f.startsWith("outlet:"));
  firms.sort((a, b) => bias.filter((x) => x.firm === b && x.key === k).length - bias.filter((x) => x.firm === a && x.key === k).length);
  console.log("| **common** | " + eks.map((e) => common[e] == null ? "" : f2(common[e])).join(" | ") + ` | ${f2(mean(Object.values(common).filter((v) => v != null)))} | | |`);
  let tp = 0, np = 0;
  for (const f of firms) {
    const v = Object.fromEntries(bias.filter((x) => x.firm === f && x.key === k).map((x) => [x.e, x.b]));
    const parts = Object.entries(v).map(([e, b]) => b - common[e]);
    const pos = parts.filter((x) => x > 0).length;
    console.log(`| ${f} | ` + eks.map((e) => v[e] == null ? "" : f2(v[e])).join(" | ") + ` | ${f2(mean(Object.values(v)))} | ${f2(mean(parts))} | ${pos}+ / ${parts.length - pos}− |`);
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) { tp += parts[i] * parts[j]; np++; }
  }
  const allParts = bias.filter((x) => x.key === k && !x.firm.startsWith("outlet:")).map((x) => x.b - common[x.e]);
  const commonVals = Object.values(common).filter((v) => v != null);
  console.log(`\nvariance split: common miss sd ${Math.sqrt(mean(commonVals.map((x) => x * x))).toFixed(2)} (mean ${f2(mean(commonVals))}); firm part rms ${Math.sqrt(mean(allParts.map((x) => x * x))).toFixed(2)}; persistent firm sd τ = ${tp / np > 0 ? Math.sqrt(tp / np).toFixed(2) : "0 (" + (tp / np).toFixed(3) + ")"} from ${np} cross-election pairs`);
}
function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN; }
function f2(x) { return Number.isFinite(x) ? (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2) : ""; }
