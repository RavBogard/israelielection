/**
 * ROUND 2, AGENT A: leave-future-out backtest of house-effect corrections, the v2.mjs harness (same CLASSES priors,
 * same lean rule from the elections before each one) run on model-a.mjs. Each election's correction uses only the
 * house effects estimated from the elections before it (house-effects.json tables["lfo:<key>"]).
 *   node scripts/forecast/round2/A/backtest-a.mjs [runs] [--he=house-effects.json]
 * The house-effect table (built by house.mjs, from data/ or data-full/) is read from --he; the raw-mean variants are
 * re-estimated from the same source. The scored final fields are always the backtest/data 28-day files, as v2.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { forecast, MAJ } from "./model-a.mjs";
import { here, read, firmElectionMeans, shrink, loadElections } from "./lib-a.mjs";
const RUNS = Number(process.argv[2]) || 10_000;
const cal = read(path.join(here, "../../calibration.json"));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : d; };
const HE = read(arg("he", path.join(here, "house-effects.json")));
const dataDir = path.join(here, "../../backtest/data");
const elections = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(dataDir, f)));
const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
// Unshrunk (raw mean) tables, leave-future-out, for the overfitting check.
const { elections: estEl } = loadElections(HE.source.endsWith("data-full") ? "full" : "data");
const rawTables = {};
for (const e of elections) {
  const before = estEl.filter((x) => x.election < e.election); if (!before.length) { rawTables[e.key] = {}; continue; }
  const { cells } = firmElectionMeans(before, { win: HE.windowDays, days: HE.campaignDays === "all" ? Infinity : HE.campaignDays });
  const t = {}; for (const c of cells) { const f = (t[c.firm] ??= { elections: 0, _e: new Set(), class: {}, list: {}, net: 0, _n: {} }); f._e.add(c.election); const key = c.kind + ":" + c.id; (f._n[key] ??= []).push(c.d); }
  for (const f of Object.values(t)) { f.elections = f._e.size; for (const [k, v] of Object.entries(f._n)) { const m = v.reduce((a, b) => a + b, 0) / v.length; const [kind, id] = k.split(":"); if (kind === "net") f.net = m; else f[kind][id] = m; } delete f._e; delete f._n; }
  rawTables[e.key] = t;
}
const he = (e, extra = {}, raw = false) => ({ table: raw ? rawTables[e.key] : HE.tables["lfo:" + e.key]?.firms ?? {}, firmMap: HE.firmMap, mode: "class", ...extra });
const VARIANTS = {
  "v2 (no house effects)": () => ({}),
  "A: per-class, shrunk": (e) => ({ houseEffects: he(e) }),
  "A: per-list, shrunk": (e) => ({ houseEffects: he(e, { mode: "list" }) }),
  "A: Netanyahu bloc only, shrunk": (e) => ({ houseEffects: he(e, { mode: "net" }) }),
  "A: per-class, shrunk, firms with 3+ elections": (e) => ({ houseEffects: he(e, { minElections: 3 }) }),
  "A: per-class, shrunk ×0.5": (e) => ({ houseEffects: he(e, { scale: 0.5 }) }),
  "A: per-class, UNSHRUNK raw means": (e) => ({ houseEffects: he(e, {}, true) }),
  "A: per-list, UNSHRUNK raw means": (e) => ({ houseEffects: he(e, { mode: "list" }, true) }),
  "IN-SAMPLE bound: per-class, shrunk, all-history table": () => ({ houseEffects: { table: HE.tables.all.firms, firmMap: HE.firmMap, mode: "class" } }),
  "IN-SAMPLE bound: per-list, shrunk, all-history table": () => ({ houseEffects: { table: HE.tables.all.firms, firmMap: HE.firmMap, mode: "list" } }),
  "Filber firms in, uncorrected": () => ({ excludeChecks: false }),
  "Filber firms in, per-class shrunk": (e) => ({ excludeChecks: false, houseEffects: he(e) }),
};
function run(e, opts) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const c = { ...cal, elections: earlier, listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))];
  const filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  return forecast({ polls: e.polls, config, parties, agreements: e.agreements, cal: c, opts: { runs: RUNS, ...opts } });
}
function score(e, f) {
  const lists = Object.keys(e.lists), res = e.result.lists;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0) / lists.length;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += res[id]?.seats ?? 0;
  const blocErr = ["net", "opp", "mid", "arab"].reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrong = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const top = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  // the pooled field's own error, before the lean and the simulation: Netanyahu-bloc share, points (central − result)
  const netShare = lists.filter((id) => e.blocs[id] === "net").reduce((a, id) => a + (f.lists[id]?.share ?? 0), 0);
  const netRes = lists.filter((id) => e.blocs[id] === "net").reduce((a, id) => a + (res[id]?.pct ?? 0), 0);
  const shareMAE = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.share ?? 0) - (res[id]?.pct ?? 0)), 0) / lists.length;
  return { shareMAE, listErr, netErr: Math.abs(f.blocs.net.point - actual.net), netSigned: f.blocs.net.point - actual.net, blocErr, wrong, majorityRight: top === outcome, brier, netShareErr: netShare - netRes };
}
const rows = [], detail = {};
for (const [name, mk] of Object.entries(VARIANTS)) {
  const fs_ = elections.map((e) => run(e, mk(e))); const ss = elections.map((e, i) => score(e, fs_[i]));
  detail[name] = fs_.map((f, i) => ({ e: elections[i].key, applied: f.inputs.houseEffects }));
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length;
  rows.push({ variant: name, listMAE: m("listErr").toFixed(3), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrongCalls: ss.reduce((a, s) => a + s.wrong, 0), majorityRight: ss.filter((s) => s.majorityRight).length + "/6", brier: m("brier").toFixed(3), sharePts: m("shareMAE").toFixed(3), netSharePts: m("netShareErr").toFixed(2), absNetSharePts: (ss.reduce((a, s) => a + Math.abs(s.netShareErr), 0) / ss.length).toFixed(2), perElectionList: ss.map((s) => s.listErr.toFixed(2)).join(" "), });
}
console.log(`house effects estimated on ${HE.source}; ${RUNS} runs; scored on backtest/data (28-day)`);
console.table(rows);
if (process.argv.includes("--detail")) for (const [k, v] of Object.entries(detail)) if (k.startsWith("A: per-class, shrunk") && !k.includes("×")) console.log(k, JSON.stringify(v));
