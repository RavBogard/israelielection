/**
 * Out-of-sample backtest of the site's forecast on the six elections under the 3.25% threshold
 * (2015-03 ... 2022-11), scored by the pre-registered rule (docs/research/polls-method/2026-10-23-forecast-algorithm.md)
 * plus Brier scores and interval coverage. Data: scripts/forecast/backtest/data/*.json (see README.md).
 *
 *   node scripts/forecast/backtest/backtest.mjs              baseline table (published model vs the two site averages)
 *   node scripts/forecast/backtest/backtest.mjs --grid       plus the parameter grid (slower, ~1-2 min)
 *   node scripts/forecast/backtest/backtest.mjs --check2026  reproduce data/forecast.json with model.mjs (50,000 runs)
 *   node scripts/forecast/backtest/backtest.mjs --opts '{"seatsToShares":"plusHalf"}'   also score the model under these options
 *   node scripts/forecast/backtest/backtest.mjs --2026 '{"seatsToShares":"plusHalf"}'   today's 2026 forecast under these options
 *   node scripts/forecast/backtest/backtest.mjs --json       machine-readable baseline
 *
 * To score a proposal from another module:
 *   import { runBacktest, summarise } from "./backtest.mjs";
 *   const r = runBacktest({ includeFilber: true, blocSd: 2 }); console.log(summarise(r));
 * Options are model.mjs DEFAULTS plus the harness's own: leanRule ("recency" | "mean" | "last" | "zero" | number),
 * leanHalfLife (2), leanSource ("data" | "calibration"), blocSdRule ("forecast": max(3, 2 × residual) | number),
 * listSdScale (multiplier on DEFAULTS.listSd).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { forecast, siteAverage, leanFrom, selectPolls, DEFAULTS, KNESSET, MAJ } from "./model.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

export const ELECTIONS = fs.readdirSync(path.join(HERE, "data")).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort().map((f) => read(path.join(HERE, "data", f)));
const CAL = read(path.join(ROOT, "scripts/forecast/calibration.json"));

const BLOCS = ["net", "opp", "mid", "arab"];
const netSeats = (e, seatsById) => Object.entries(seatsById).filter(([id]) => e.blocs[id] === "net").reduce((a, [, n]) => a + n, 0);
const resultSeats = (e) => Object.fromEntries(Object.entries(e.result.lists).map(([id, r]) => [id, r.seats]));
const outcomeOf = (t) => (t.net >= MAJ ? "net" : t.opp >= MAJ ? "oppZionist" : "neither");
const blocTotals = (e, seatsById) => { const t = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const [id, n] of Object.entries(seatsById)) if (e.blocs[id]) t[e.blocs[id]] += n; return t; };

/** A poll's Netanyahu-bloc seats (passing lists, plus combined cells wholly inside the bloc). */
function pollNet(e, p) {
  let s = 0;
  for (const [id, r] of Object.entries(p.results)) if (e.blocs[id] === "net") s += r.seats;
  for (const c of p.combined ?? []) if (c.parties.every((id) => e.blocs[id] === "net")) s += c.seats;
  return s;
}

/** The field's miss on the Netanyahu bloc in election e under options o: result minus the (√n-weighted) mean of field polls' bloc totals. */
export function fieldMiss(e, o) {
  const { field } = selectPolls(e.polls, { ...DEFAULTS, ...o, electionDate: e.election });
  const w = (p) => (o.weight ? o.weight(p) : Math.sqrt(p.n && p.n > 0 ? p.n : DEFAULTS.nDefault)) * (o.pollsterWeights?.[p.pollster] ?? 1);
  const W = field.reduce((a, p) => a + w(p), 0);
  const fieldNet = field.reduce((a, p) => a + w(p) * pollNet(e, p), 0) / W;
  return { fieldNet, result: netSeats(e, resultSeats(e)), miss: netSeats(e, resultSeats(e)) - fieldNet };
}

/** Lean and bloc sd for election index i, from elections before it only. */
export function priorLean(i, o = {}) {
  let errs;
  if (o.leanSource === "calibration") errs = CAL.elections.filter((c) => c.date < ELECTIONS[i].election).map((c) => c.result - c.field);
  else errs = ELECTIONS.slice(0, i).map((e) => fieldMiss(e, o).miss);
  const rule = o.leanRule ?? "recency";
  let lean, resid;
  if (typeof rule === "number") { lean = rule; resid = leanFrom(errs, o.leanHalfLife ?? 2).resid; }
  else if (rule === "zero") { lean = 0; resid = leanFrom(errs).resid; }
  else if (rule === "mean") ({ lean, resid } = leanFrom(errs, Infinity));
  else if (rule === "last") { lean = errs.length ? errs.at(-1) : 0; resid = leanFrom(errs).resid; }
  else ({ lean, resid } = leanFrom(errs, o.leanHalfLife ?? 2));
  if (!errs.length) { lean = 0; resid = 0; }
  const blocSd = o.blocSd ?? (typeof o.blocSdRule === "number" ? o.blocSdRule : Math.max(3, 2 * resid));
  return { lean, resid, blocSd, errs };
}

/** Score one forecast-shaped object { point: {id: seats}, pPass: {id: p}, lo/hi, majorityP } against election e. */
export function score(e, f) {
  const res = resultSeats(e), ids = Object.keys(e.lists);
  const absErr = ids.map((id) => Math.abs((f.point[id] ?? 0) - res[id]));
  const fb = blocTotals(e, f.point), rb = blocTotals(e, res);
  const blocErr = Object.fromEntries(BLOCS.map((b) => [b, Math.abs(fb[b] - rb[b])]));
  const thrRight = ids.filter((id) => ((f.pPass[id] ?? 0) >= 0.5) === e.result.lists[id].passed).length;
  const thrWrong = ids.filter((id) => ((f.pPass[id] ?? 0) >= 0.5) !== e.result.lists[id].passed);
  const brierPass = ids.reduce((a, id) => a + ((f.pPass[id] ?? 0) - (e.result.lists[id].passed ? 1 : 0)) ** 2, 0) / ids.length;
  const outcome = outcomeOf(rb);
  const P = f.majorityP;
  const called = Object.entries(P).sort((a, b) => b[1] - a[1])[0][0];
  const brierMaj = ["net", "oppZionist", "neither"].reduce((a, k) => a + (P[k] - (k === outcome ? 1 : 0)) ** 2, 0);
  const cov = f.lo ? { lists: ids.filter((id) => res[id] >= (f.lo[id] ?? 0) && res[id] <= (f.hi[id] ?? 0)).length / ids.length,
    blocs: BLOCS.filter((b) => rb[b] >= f.blo[b] && rb[b] <= f.bhi[b]).length / BLOCS.length,
    net: rb.net >= f.blo.net && rb.net <= f.bhi.net } : null;
  return { mae: absErr.reduce((a, b) => a + b, 0) / ids.length, blocErr, blocMean: BLOCS.reduce((a, b) => a + blocErr[b], 0) / 4,
    thrRight, thrN: ids.length, thrWrong, majHit: called === outcome, called, outcome, brierPass, brierMaj, pOutcome: P[outcome], cov, netPoint: fb.net, netResult: rb.net };
}

/** Run the model on every election with leave-future-out lean. */
export function runBacktest(opts = {}) {
  return ELECTIONS.map((e, i) => {
    const pl = priorLean(i, opts);
    const fo = { ...opts, ids: Object.keys(e.lists), bloc: e.blocs, agreements: e.agreements, electionDate: e.election,
      lean: opts.lean ?? pl.lean, blocSd: pl.blocSd, listSd: (opts.listSd ?? DEFAULTS.listSd) * (opts.listSdScale ?? 1) };
    const fc = forecast(e.polls, fo);
    const f = { point: Object.fromEntries(Object.entries(fc.lists).map(([id, l]) => [id, l.point])),
      pPass: Object.fromEntries(Object.entries(fc.lists).map(([id, l]) => [id, l.pPass])),
      lo: Object.fromEntries(Object.entries(fc.lists).map(([id, l]) => [id, l.lo])), hi: Object.fromEntries(Object.entries(fc.lists).map(([id, l]) => [id, l.hi])),
      blo: Object.fromEntries(BLOCS.map((b) => [b, fc.blocs[b].lo])), bhi: Object.fromEntries(BLOCS.map((b) => [b, fc.blocs[b].hi])),
      majorityP: fc.majorityP };
    return { key: e.key, lean: fo.lean, blocSd: fo.blocSd, fieldN: fc.inputs.field.length, fc, s: score(e, f) };
  });
}

/** The site's two averages as forecasts (0/1 probabilities). */
export function runAverage(includeFilber) {
  return ELECTIONS.map((e) => {
    const { seats, polls } = siteAverage(e.polls, Object.keys(e.lists), { includeFilber });
    const t = blocTotals(e, seats);
    const o = outcomeOf(t);
    const f = { point: seats, pPass: Object.fromEntries(Object.entries(seats).map(([id, n]) => [id, n > 0 ? 1 : 0])),
      majorityP: { net: o === "net" ? 1 : 0, oppZionist: o === "oppZionist" ? 1 : 0, neither: o === "neither" ? 1 : 0 } };
    return { key: e.key, fieldN: polls.length, s: score(e, f) };
  });
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
export function summarise(rows) {
  const S = rows.map((r) => r.s);
  return { mae: avg(S.map((s) => s.mae)), netErr: avg(S.map((s) => s.blocErr.net)), oppErr: avg(S.map((s) => s.blocErr.opp)), blocMean: avg(S.map((s) => s.blocMean)),
    thrWrong: S.reduce((a, s) => a + s.thrWrong.length, 0), majHits: S.filter((s) => s.majHit).length, brierPass: avg(S.map((s) => s.brierPass)), brierMaj: avg(S.map((s) => s.brierMaj)),
    covLists: S[0].cov ? avg(S.map((s) => s.cov.lists)) : null, covBlocs: S[0].cov ? avg(S.map((s) => s.cov.blocs)) : null, covNet: S[0].cov ? S.filter((s) => s.cov.net).length : null };
}

const f2 = (x) => (x == null ? "" : x.toFixed(2)), f1 = (x) => (x == null ? "" : x.toFixed(1));

function table(label, rows) {
  const out = rows.map((r) => ({ method: label, election: r.key, polls: r.fieldN, lean: r.lean != null ? f1(r.lean) : "", blocSd: r.blocSd != null ? f1(r.blocSd) : "",
    listMAE: f2(r.s.mae), netPt: f1(r.s.netPoint), netRes: r.s.netResult, netErr: f1(r.s.blocErr.net), oppErr: f1(r.s.blocErr.opp), blocMeanErr: f2(r.s.blocMean),
    thrRight: `${r.s.thrRight}/${r.s.thrN}`, thrWrong: r.s.thrWrong.join(","), majority: `${r.s.called}${r.s.majHit ? " ✓" : " ✗"}`, pOutcome: f2(r.s.pOutcome),
    brierPass: r.s.brierPass.toFixed(3), brierMaj: r.s.brierMaj.toFixed(3) }));
  const m = summarise(rows);
  out.push({ method: label, election: "MEAN", listMAE: f2(m.mae), netErr: f2(m.netErr), oppErr: f2(m.oppErr), blocMeanErr: f2(m.blocMean), thrWrong: `${m.thrWrong} wrong`,
    majority: `${m.majHits}/6`, brierPass: m.brierPass.toFixed(3), brierMaj: m.brierMaj.toFixed(3) });
  return out;
}

/**
 * Reproduce forecast.mjs with model.mjs under DEFAULTS on today's data/polls.json. forecast.mjs is run live in its
 * sensitivity mode (LEAN set, so it writes nothing) and its printed figures are compared with model.mjs's;
 * data/forecast.json is compared too, but it can lag data/polls.json (the polls job regenerates it).
 */
/** forecast.mjs's 2026 inputs as model.mjs options (lean and blocSd from calibration.json, as forecast.mjs sets them). */
export function setup2026(extra = {}) {
  const { polls, config } = read(path.join(ROOT, "data/polls.json"));
  const pj = read(path.join(ROOT, "data/parties.json")); const parties = pj.parties ?? pj;
  const results = read(path.join(ROOT, "data/results.json"));
  const { lean, resid } = leanFrom(CAL.elections.map((e) => e.result - e.field));
  const fo = { ids: parties.map((p) => p.id), bloc: Object.fromEntries(parties.map((p) => [p.id, p.bloc])),
    agreements: [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties),
    pollsters: config.pollsters, isFilber: (p) => config.withoutVariant.pollsters.includes(p.pollster), windowDays: config.currentWindowDays,
    lean, blocSd: Math.max(3, 2 * resid), runs: 50_000, seed: 20261027, ...extra };
  if (extra.listSdScale) fo.listSd = DEFAULTS.listSd * extra.listSdScale;
  return { polls, fo, lean };
}

function check2026() {
  const published = read(path.join(ROOT, "data/forecast.json"));
  const { polls, fo, lean } = setup2026();
  const fc = forecast(polls, fo);
  const r1 = (x) => Math.round(x * 10) / 10;
  const mine = Object.fromEntries(Object.entries(fc.lists).map(([id, m]) => [id, { share: Math.round(m.share * 10000) / 100, point: m.point, mean: r1(m.mean), lo: m.lo, hi: m.hi, passes: m.passes }]));
  const compare = (label, ref) => {
    const diffs = [];
    for (const [id, l] of Object.entries(ref.lists)) { if (!mine[id]) { diffs.push(`${id}: missing`); continue; } for (const k of Object.keys(mine[id])) if (mine[id][k] !== l[k]) diffs.push(`${id}.${k}: ${l[k]} vs model.mjs ${mine[id][k]}`); }
    for (const b of BLOCS) for (const k of ["point", "lo", "hi"]) if (ref.blocs[b][k] !== fc.blocs[b][k]) diffs.push(`blocs.${b}.${k}: ${ref.blocs[b][k]} vs ${fc.blocs[b][k]}`);
    for (const k of Object.keys(ref.majority)) if (ref.majority[k] !== fc.majority[k]) diffs.push(`majority.${k}: ${ref.majority[k]} vs ${fc.majority[k]}`);
    console.log(`${label}: ${diffs.length ? diffs.length + " differences" : "identical"}`); for (const d of diffs.slice(0, 12)) console.log("  " + d);
    return diffs.length;
  };
  // forecast.mjs, live, in sensitivity mode: it prints one JSON line and a console.table of the lists.
  const out = execFileSync(process.execPath, [path.join(ROOT, "scripts/forecast/forecast.mjs")], { cwd: ROOT, env: { ...process.env, LEAN: String(lean) }, encoding: "utf8" });
  const head = JSON.parse(out.split("\n").find((l) => l.startsWith("{")));
  const lists = {};
  for (const m of out.matchAll(/│\s*\d+\s*│\s*'(\w+)'\s*│\s*([\d.]+)\s*│\s*(\d+)\s*│\s*([\d.]+)\s*│\s*(\d+)\s*│\s*(\d+)\s*│\s*(\d+)\s*│/g))
    lists[m[1]] = { share: +m[2], point: +m[3], mean: +m[4], lo: +m[5], hi: +m[6], passes: +m[7] };
  const live = compare("model.mjs vs forecast.mjs run now on data/polls.json (50,000 runs, same seed)", { lists, blocs: head.blocs, majority: head.majority });
  compare(`model.mjs vs data/forecast.json as generated ${published.generatedAt} (may predate the latest polls)`, published);
  return live === 0;
}

function grid() {
  const RUNS = 3000;
  const base = runBacktest({ runs: RUNS });
  const baseS = base.map((r) => r.s);
  const configs = [];
  const add = (name, o) => configs.push({ name, o: { runs: RUNS, ...o } });
  add("published (lean recency hl2, blocSd rule, listSd ×1, consol 1.5, central, no Filber)", {});
  for (const lr of ["zero", "mean", "last"]) add(`lean ${lr}`, { leanRule: lr });
  add("lean half-life 1", { leanHalfLife: 1 });
  add("lean half-life 4", { leanHalfLife: 4 });
  add("lean from calibration.json", { leanSource: "calibration" });
  for (const b of [1.5, 2, 4, 5]) add(`blocSd ${b}`, { blocSdRule: b });
  for (const k of [0.5, 0.75, 1.5, 2]) add(`listSd ×${k}`, { listSdScale: k });
  for (const c of [0, 3]) add(`consolidateSd ${c}`, { consolidateSd: c });
  add("point = median of runs", { point: "median" });
  add("Filber included", { includeFilber: true });
  add("Filber included, lean zero", { includeFilber: true, leanRule: "zero" });
  add("median aggregate", { aggregate: "median" });
  add("window 7 days", { windowDays: 7 });
  add("window 21 days", { windowDays: 21 });
  add("unprinted below-threshold share 1%", { belowDefault: 0.01 });
  add("unprinted below-threshold share 3%", { belowDefault: 0.03 });
  add("seats→shares +½ seat (plusHalf)", { seatsToShares: "plusHalf" });
  add("plusHalf + Filber", { seatsToShares: "plusHalf", includeFilber: true });
  add("plusHalf + median point", { seatsToShares: "plusHalf", point: "median" });
  add("plusHalf + listSd ×1.5", { seatsToShares: "plusHalf", listSdScale: 1.5 });
  add("plusHalf + blocSd 2", { seatsToShares: "plusHalf", blocSdRule: 2 });
  add("plusHalf + Filber + blocSd 2", { seatsToShares: "plusHalf", includeFilber: true, blocSdRule: 2 });
  add("k/n aggregate (site's rule in shares)", { aggregate: "kn" });
  add("plusHalf + k/n", { seatsToShares: "plusHalf", aggregate: "kn" });
  add("plusHalf + k/n + median point", { seatsToShares: "plusHalf", aggregate: "kn", point: "median" });
  add("plusHalf + k/n + Filber", { seatsToShares: "plusHalf", aggregate: "kn", includeFilber: true });
  add("list noise within bloc", { listNoise: "withinBloc" });
  add("list noise net-neutral", { listNoise: "netNeutral" });
  add("list noise net-neutral + blocSd 2", { listNoise: "netNeutral", blocSdRule: 2 });
  add("plusHalf + k/n + noise net-neutral", { seatsToShares: "plusHalf", aggregate: "kn", listNoise: "netNeutral" });
  add("plusHalf + k/n + noise net-neutral + median point", { seatsToShares: "plusHalf", aggregate: "kn", listNoise: "netNeutral", point: "median" });
  add("plusHalf + k/n + noise net-neutral + blocSd 2", { seatsToShares: "plusHalf", aggregate: "kn", listNoise: "netNeutral", blocSdRule: 2 });
  add("listSd ×1.5 + blocSd 2", { listSdScale: 1.5, blocSdRule: 2 });
  add("listSd ×1.5 + Filber", { listSdScale: 1.5, includeFilber: true });
  add("listSd ×1.5 + median point", { listSdScale: 1.5, point: "median" });
  add("Filber + median point", { includeFilber: true, point: "median" });
  add("Filber + listSd ×1.5 + median point", { includeFilber: true, listSdScale: 1.5, point: "median" });
  const rows = [];
  for (const c of configs) {
    const r = runBacktest(c.o), m = summarise(r);
    const S = r.map((x) => x.s);
    const better = (k) => S.filter((s, i) => s[k] < baseS[i][k] - 1e-9).length + "/" + S.filter((s, i) => s[k] > baseS[i][k] + 1e-9).length;
    const betterNet = S.filter((s, i) => s.blocErr.net < baseS[i].blocErr.net - 1e-9).length + "/" + S.filter((s, i) => s.blocErr.net > baseS[i].blocErr.net + 1e-9).length;
    rows.push({ config: c.name, listMAE: f2(m.mae), "MAE +/-": better("mae"), netErr: f2(m.netErr), "net +/-": betterNet, blocMean: f2(m.blocMean),
      thrWrong: m.thrWrong, majHits: m.majHits, brierPass: m.brierPass.toFixed(4), "bP +/-": better("brierPass"), brierMaj: m.brierMaj.toFixed(3), "bM +/-": better("brierMaj"),
      cov90lists: f2(m.covLists), cov90blocs: f2(m.covBlocs), netIn90: `${m.covNet}/6` });
  }
  console.log(`\nParameter grid (${RUNS} runs each; "+/-" = elections better/worse than the published configuration):`);
  console.table(rows);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  if (process.argv.includes("--check2026")) { process.exit(check2026() ? 0 : 1); }
  if (process.argv.includes("--2026")) {
    // node backtest.mjs --2026 '{"seatsToShares":"plusHalf"}' : today's 2026 forecast under the given model.mjs options.
    const extra = JSON.parse(process.argv[process.argv.indexOf("--2026") + 1] ?? "{}");
    const { polls, fo } = setup2026({ runs: 20_000, ...extra });
    const fc = forecast(polls, fo);
    console.log(JSON.stringify({ options: extra, blocs: Object.fromEntries(Object.entries(fc.blocs).map(([b, v]) => [b, { point: v.point, mean: f1(v.mean), lo: v.lo, hi: v.hi }])), majority: fc.majority }));
    console.table(Object.fromEntries(Object.entries(fc.lists).map(([id, l]) => [id, { share: +(l.share * 100).toFixed(2), point: l.point, lo: l.lo, hi: l.hi, passes: l.passes }])));
    process.exit(0);
  }
  const model = runBacktest({ runs: 10_000 });
  const avgAll = runAverage(true), avgField = runAverage(false);
  // --opts '{"seatsToShares":"plusHalf"}' adds a row block for the model under those options (10,000 runs).
  const optsArg = process.argv.includes("--opts") ? JSON.parse(process.argv[process.argv.indexOf("--opts") + 1]) : null;
  const variant = optsArg ? runBacktest({ runs: 10_000, ...optsArg }) : null;
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ model: { rows: model.map((r) => ({ key: r.key, lean: r.lean, blocSd: r.blocSd, ...r.s })), mean: summarise(model) },
      averageAll: { rows: avgAll.map((r) => ({ key: r.key, ...r.s })), mean: summarise(avgAll) }, averageNoFilber: { rows: avgField.map((r) => ({ key: r.key, ...r.s })), mean: summarise(avgField) } }, null, 1));
    process.exit(0);
  }
  console.log("Leave-future-out lean (seats; field miss = result − field mean of the Netanyahu bloc, from this data):");
  console.table(ELECTIONS.map((e, i) => { const m = fieldMiss(e, {}); const p = priorLean(i, {}); const c = CAL.elections.find((x) => x.date === e.election);
    return { election: e.key, fieldNet: f1(m.fieldNet), calibrationField: c.field, result: m.result, miss: f1(m.miss), leanUsed: f1(p.lean), residual: f1(p.resid), blocSd: f1(p.blocSd) }; }));
  console.log("Scores (pre-registered rule + Brier). listMAE: mean |point − result| seats per list; netErr/oppErr: bloc abs error; thrRight: threshold calls right; majority: the most probable of net≥61 / opp≥61 / neither, ✓ if it happened; brierPass: mean Brier of P(pass) per list; brierMaj: 3-outcome Brier.");
  console.table([...table("model (published rules)", model), ...(variant ? table("model + " + JSON.stringify(optsArg), variant) : []), ...table("average, all polls", avgAll), ...table("average, no Filber", avgField)]);
  const calRows = variant ?? model, m = summarise(calRows);
  console.log(`Calibration of the model's 90% intervals${variant ? " (with --opts)" : ""}:`);
  console.table(calRows.map((r) => ({ election: r.key, listsInside: f2(r.s.cov.lists), blocsInside: f2(r.s.cov.blocs), netInside: r.s.cov.net,
    netRange: `${r.fc.blocs.net.lo}–${r.fc.blocs.net.hi}`, netResult: r.s.netResult })).concat([{ election: "MEAN (target 0.90)", listsInside: f2(m.covLists), blocsInside: f2(m.covBlocs), netInside: `${m.covNet}/6` }]));
  if (process.argv.includes("--grid")) grid();
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
