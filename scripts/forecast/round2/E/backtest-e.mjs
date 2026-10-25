/**
 * Round 2, agent E: leave-future-out backtest of the state-space aggregator (model-e.mjs) beside version 2.
 *
 *   node scripts/forecast/round2/E/backtest-e.mjs [runs]          # the table, six elections (default 10,000 runs)
 *   node scripts/forecast/round2/E/backtest-e.mjs --fit-all       # q8, r8, h8 fitted on all seven elections (for 2026)
 *   node scripts/forecast/round2/E/backtest-e.mjs --fits          # the leave-future-out fits per scored election
 *   node scripts/forecast/round2/E/backtest-e.mjs --2026 [runs]   # 2026 polls through Oct 22, E beside v2
 *
 * Version 2 is scored exactly as backtest/v2.mjs does (28-day data, same CLASSES priors, lean from calibration.json's
 * earlier elections). Model E reads D1's full-campaign files (since the dissolution), with every parameter fitted
 * only on the elections before the one scored; 2013 is training only. Filber-firm polls are left out poll by poll.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { forecast as forecastE, campaignObs, fitParams, kalman } from "./model-e.mjs";
import { loadFull, KEYS } from "../D1/load.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const args = process.argv.slice(2);
const RUNS = Number(args.find((a) => /^\d+$/.test(a))) || 10_000;
/** Version 2 and its calibration are pinned to commit e554940 (the round-2 base), because the synthesis edits
 *  model.mjs and calibration.json in place; --live reads the working-tree files instead. */
const PIN = "e554940", live = args.includes("--live");
const git = (f) => execFileSync("git", ["-C", root, "show", `${PIN}:${f}`], { encoding: "utf8" });
const cal = live ? read(path.join(root, "scripts/forecast/calibration.json")) : JSON.parse(git("scripts/forecast/calibration.json"));
const { forecast: forecastV2, MAJ } = live ? await import("../../model.mjs") : await import("data:text/javascript," + encodeURIComponent(git("scripts/forecast/model.mjs")));
const data28 = Object.fromEntries(fs.readdirSync(path.join(root, "scripts/forecast/backtest/data")).filter((f) => f.endsWith(".json")).map((f) => read(path.join(root, "scripts/forecast/backtest/data", f))).map((e) => [e.key, e]));
const full = Object.fromEntries(KEYS.map((k) => [k, loadFull(k, { since: "dissolved" })]));
const SCORED = ["2015-03", "2019-04", "2019-09", "2020-03", "2021-03", "2022-11"];

/** backtest/v2.mjs's CLASSES (2026's prior classes mapped by hand), plus 2013 for the refit only (my judgment:
 *  Bennett's first Jewish Home and the first-time small lists Otzma LeYisrael and Am Shalem are "new"). */
const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
const CLASS_OF = { 0.8: "shas", 0.5: "arab", "-0.8": "new" };
const CLASS2013 = { shas: "shas", raam: "arab", hadash: "arab", balad: "arab", jh: "new", otzma: "new", amshalem: "new" };
const classesOf = (key) => key === "2013-01" ? CLASS2013 : Object.fromEntries(Object.entries(CLASSES[key]).map(([id, v]) => [id, CLASS_OF[v]]));

const setup = (e) => ({ parties: Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] })), agreements: e.agreements });
function runV2(e, opts) {
  const c = { ...cal, elections: cal.elections.filter((x) => x.date < e.election), listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))];
  const filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  return forecastV2({ polls: e.polls, config: { pollsters, withoutVariant: { pollsters: filber } }, ...setup(e), cal: c, opts: { runs: RUNS, ...opts } });
}

// ---- leave-future-out fits, cached per (scored election, structure)
const camp = (k) => { const f = full[k]; const ids = Object.keys(f.lists); return { key: k, ids, f, obs: campaignObs(f.polls, ids, { isCheck: (p) => p.filber }) }; };
const CAMPS = Object.fromEntries(KEYS.map((k) => [k, camp(k)]));
const before = (k) => KEYS.filter((x) => full[x].election < full[k].election).map((x) => CAMPS[x]);
const fitCache = new Map();
function fitFor(k, dynamics, house) {
  const key = `${k}|${dynamics}|${house}`;
  if (!fitCache.has(key)) fitCache.set(key, fitParams(before(k), { dynamics, house }));
  return fitCache.get(key);
}
/** Refit bias terms for scored election k: residuals of model E's own election-day level in the elections before k. */
function refitBias(k, { with2013 = true, house = true } = {}) {
  const prm = fitFor(k, "rw", house), FR = cal.fringe.share;
  const els = [], cls = {};
  for (const c of before(k)) {
    if (!with2013 && c.key === "2013-01") continue;
    const K = kalman(c.obs, c.ids, prm, { house, tEnd: Date.parse(c.f.election) / 864e5 });
    const lat = {}; for (const id of c.ids) lat[id] = K.lists[id]?.mean ?? 0.005;
    const tot = Object.values(lat).reduce((a, b) => a + b, 0); for (const id in lat) lat[id] *= (1 - FR) / tot;
    const res = (id) => (c.f.result.lists[id]?.pct ?? 0) / 100;
    const net = c.ids.filter((id) => c.f.blocs[id] === "net");
    els.push({ date: c.f.election, field: 120 * net.reduce((a, id) => a + lat[id], 0), result: 120 * net.reduce((a, id) => a + res(id), 0) });
    for (const [id, cl] of Object.entries(classesOf(c.key))) if (id in lat) (cls[cl] ??= []).push(100 * (res(id) - lat[id]));
  }
  const shrunk = Object.fromEntries(Object.entries(cls).map(([cl, xs]) => [cl, (xs.reduce((a, b) => a + b, 0) / xs.length) * xs.length / (xs.length + 2)]));
  const listPriors = Object.fromEntries(Object.entries(classesOf(k)).map(([id, cl]) => [id, Math.round((shrunk[cl] ?? 0) * 100) / 100]));
  return { elections: els, listPriors, classMeans: shrunk };
}
function houseRecordFor(k) {
  const A = read(path.join(root, "scripts/forecast/round2/A/house-effects.json")).tables[`lfo:${k}`];
  return Object.fromEntries(Object.entries(A?.firms ?? {}).map(([f, v]) => [f, v.list ?? {}]));
}
function runE(e, v) {
  const f = full[e.key];
  const dyn = v.dynamics ?? "rw", house = v.house ?? true;
  let params = fitFor(e.key, dyn === "static" ? "rw" : dyn, house);
  if (v.qv8 != null) params = { ...params, qv8: v.qv8 };
  let c = { ...cal, elections: cal.elections.filter((x) => x.date < e.election), listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  if (v.bias === "refit" || v.bias === "refit-no2013") { const b = refitBias(e.key, { with2013: v.bias === "refit", house }); c = { ...c, elections: b.elections, listPriors: b.listPriors }; }
  if (v.bias === "none") c = { ...c, elections: [], listPriors: {} };
  const config = { pollsters: [...new Set(f.polls.map((p) => p.pollster))], withoutVariant: { pollsters: [] }, dissolved: f.dissolved };
  const polls = v.data28 ? data28[e.key].polls : f.polls;
  return forecastE({ polls, config, ...setup(f), cal: c, opts: { runs: RUNS, electionDate: e.election, ...v.opts, dynamics: dyn, house, params, houseRecord: v.houseRecord ? houseRecordFor(e.key) : null } });
}

function score(e, f) {
  const lists = Object.keys(e.lists), res = e.result.lists;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0) / lists.length;
  const shareErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.share ?? 0) - (res[id]?.pct ?? 0)), 0) / lists.length;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += res[id]?.seats ?? 0;
  const blocErr = ["net", "opp", "mid", "arab"].reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrong = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const top = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  const passBrier = lists.reduce((a, id) => a + ((f.lists[id]?.passes ?? 0) / 100 - (res[id]?.passed ? 1 : 0)) ** 2, 0);
  const cover = lists.filter((id) => (res[id]?.seats ?? 0) >= f.lists[id].lo && (res[id]?.seats ?? 0) <= f.lists[id].hi).length;
  return { listErr, shareErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong, majorityRight: top === outcome, brier, passBrier, nLists: lists.length, cover };
}
function table(rows) {
  const out = rows.map(([name, ss]) => {
    const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length, nL = ss.reduce((a, s) => a + s.nLists, 0);
    return { variant: name, listMAE: m("listErr").toFixed(2), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrong: ss.reduce((a, s) => a + s.wrong, 0), modal: ss.filter((s) => s.majorityRight).length + "/6", majBrier: m("brier").toFixed(3), passBrier: (ss.reduce((a, s) => a + s.passBrier, 0) / nL).toFixed(4), cover90: (100 * ss.reduce((a, s) => a + s.cover, 0) / nL).toFixed(0) + "%", sharePts: m("shareErr").toFixed(3), perElection: ss.map((s) => s.listErr.toFixed(2)).join(" ") };
  });
  console.table(out);
  return out;
}

if (args.includes("--fit-all")) {
  const all = KEYS.map((k) => CAMPS[k]);
  for (const [d, h] of [["rw", true], ["rw", false], ["llt", true]]) console.log(d, h ? "house" : "no house", fitParams(all, { dynamics: d, house: h }));
} else if (args.includes("--fits")) {
  for (const k of SCORED) {
    const b = refitBias(k);
    console.log(k, "trained on", before(k).map((c) => c.key).join(","), "| rw+house", JSON.stringify(fitFor(k, "rw", true)), "| rw no house", JSON.stringify(fitFor(k, "rw", false)), "| llt", JSON.stringify(fitFor(k, "llt", true)));
    const errs = b.elections.map((x) => (x.result - x.field).toFixed(2));
    console.log("   refit: net-bloc residuals (seats-equivalent, result − E level) by training election", errs.join(" "), "| class means (pts, shrunk)", JSON.stringify(Object.fromEntries(Object.entries(b.classMeans).map(([a, v]) => [a, +v.toFixed(2)]))), "| priors", JSON.stringify(b.listPriors));
  }
} else if (args.includes("--2026")) {
  const snap = read(path.join(root, "scripts/forecast/round2/polls-through-2026-10-22.json"));
  const polls = snap.polls.filter((p) => p.published <= "2026-10-22");
  const parties = (read(path.join(root, "data/parties.json")).parties).map((p) => ({ id: p.id, bloc: p.bloc }));
  const results = read(path.join(root, "data/results.json"));
  const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
  const S = { polls, config: snap.config, parties, agreements, cal };
  const R = Number(args.find((a) => /^\d+$/.test(a))) || 50_000;
  const all = KEYS.map((k) => CAMPS[k]);
  const fits = { rw: fitParams(all, { dynamics: "rw", house: true }), rwNo: fitParams(all, { dynamics: "rw", house: false }) };
  const V = {
    "v2 (model.mjs)": null,
    "E: rw + house (default)": { params: fits.rw },
    "E: house off": { params: fits.rwNo, house: false },
    "E: house, A's record as prior means": { params: fits.rw, houseRecord: Object.fromEntries(Object.entries(read(path.join(root, "scripts/forecast/round2/A/house-effects.json")).tables.all.firms).map(([f, v]) => [f, v.list ?? {}])) },
    "E: no latent draw": { params: fits.rw, latentNoise: false },
    "E: static level, last 14 days": { params: fits.rw, dynamics: "static", sinceDays: 14 },
  };
  const rows = []; let tE = 0;
  for (const [name, o] of Object.entries(V)) {
    const t0 = Date.now();
    const f = o ? forecastE({ ...S, opts: { runs: R, electionDate: "2026-10-27", ...o } }) : forecastV2({ ...S, opts: { runs: R } });
    if (name.startsWith("E: rw")) { tE = (Date.now() - t0) / 1000; console.log("E default parameters:", JSON.stringify({ ...f.parameters, latent: undefined })); console.log("E latent level (pts, sd):", Object.entries(f.parameters.latent).map(([id, l]) => `${id} ${l.share}±${l.sd}`).join(", ")); }
    rows.push({ variant: name, bloc: ["net", "opp", "mid", "arab"].map((b) => f.blocs[b].point).join("/"), net90: `${f.blocs.net.lo}-${f.blocs.net.hi}`, "P(net≥61)": f.majority.net + "%", "P(opp≥61)": f.majority.oppZionist + "%",
      ...Object.fromEntries(Object.entries(f.lists).filter(([, l]) => l.passes > 2 && l.passes < 98).map(([id, l]) => [`pass ${id}`, l.passes])),
      points: Object.entries(f.lists).map(([id, l]) => `${id} ${l.point}`).join(" "), shares: Object.entries(f.lists).map(([id, l]) => `${id} ${l.share}`).join(" ") });
  }
  console.table(rows.map(({ points, shares, ...r }) => r));
  for (const r of rows) console.log(r.variant.padEnd(40), r.points);
  for (const r of rows) console.log(r.variant.padEnd(40), r.shares);
  console.log(`E default run time at ${R} runs: ${tE.toFixed(1)} s`);
} else {
  const V2 = [["v2", {}], ["v2, 14-day window", { windowDays: 14 }]];
  const VE = [
    ["E: rw + house, full campaign, v2 bias terms", {}],
    ["E: house effects off", { house: false }],
    ["E: house, A's record (lfo) as prior means", { houseRecord: true }],
    ["E: trend on (llt, slope sd 0.005 forced)", { dynamics: "llt", qv8: 0.005 }],
    ["E: trend on (llt, slope sd 0.02 forced)", { dynamics: "llt", qv8: 0.02 }],
    ["E: pure level (static, last 14 days)", { dynamics: "static", opts: { sinceDays: 14 } }],
    ["E: refit bias terms (2013 in training)", { bias: "refit" }],
    ["E: refit bias terms (2015 on only)", { bias: "refit-no2013" }],
    ["E: no bias terms (no priors, no lean)", { bias: "none" }],
    ["E: no latent draw", { opts: { latentNoise: false } }],
    ["ctrl: E on v2's field (7 days, latest per outlet)", { opts: { sinceDays: 7, latestPerOutlet: true } }],
    ["ctrl: E, every poll in 14 days, static, no house", { dynamics: "static", house: false, opts: { sinceDays: 14 } }],
    ["ctrl: E, every poll in 14 days, rw, house", { opts: { sinceDays: 14 } }],
    ["ctrl: E, every poll in 28 days, rw, house", { opts: { sinceDays: 28 } }],
  ];
  const t0 = Date.now(), rows = [];
  for (const [name, o] of V2) rows.push([name, SCORED.map((k) => score(data28[k], runV2(data28[k], o)))]);
  for (const [name, v] of VE) rows.push([name, SCORED.map((k) => score(full[k], runE(full[k], v)))]);
  const out = table(rows);
  if (args.includes("--json")) fs.writeFileSync(path.join(here, "backtest-e.json"), JSON.stringify(out, null, 1));
  console.log(`${RUNS} runs, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
