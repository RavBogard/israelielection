/**
 * Round 2, agent D: leave-future-out backtest of the blackout options in model-d.mjs against version 2, on the six
 * elections in scripts/forecast/backtest/data (final 28 days). run() and the five columns are v2.mjs's; added:
 * Brier of P(pass) per list, 90% interval coverage (lists, blocs, the Netanyahu bloc), mean 90% width, and with --qs 50% and 80% coverage.
 *   node scripts/forecast/round2/D/backtest-d.mjs [runs] [--check] [--grid]
 * --check: model-d.mjs under its defaults == scripts/forecast/model.mjs on every election (same seed, same draws).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast, MAJ } from "./model-d.mjs";
import { forecast as forecastV2 } from "../../model.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const args = process.argv.slice(2);
const RUNS = Number(args.find((a) => /^\d+$/.test(a))) || 10_000;
const cal = read(path.join(here, "../../calibration.json"));
// D_FULL=1: the full-campaign files of agent D1 (scripts/forecast/backtest/data-full/); 2013 (2% threshold) is used
// only in the descriptive analysis, never in the backtest. D_VDAYS: the variogram's window before the vote (default 28).
export const DATA = fs.existsSync(path.join(here, "../../backtest/data-full")) && process.env.D_FULL ? "data-full" : "data";
export const VDAYS = Number(process.env.D_VDAYS) || 28;
export const allElections = fs.readdirSync(path.join(here, "../../backtest", DATA)).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(here, "../../backtest", DATA, f)));
export const elections = allElections.filter((e) => e.key !== "2013-01");
/** v2.mjs's CLASSES, verbatim. */
const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
export function setup(e) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const c = { ...cal, elections: earlier, listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))];
  const filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  return { polls: e.polls, config, parties, agreements: e.agreements, cal: c };
}
/**
 * Same-outlet poll pairs 1-21 days apart in one campaign (Filber firms out): [Δt days, squared change]. Lists: the
 * share change scaled to an 8% share, in points²; the Netanyahu bloc: seats². Fit E[d²] = a + q·Δt; q is the
 * random-walk variance per day of the true series, a twice the sampling variance.
 */
export function variogram(e) {
  const S = setup(e), F = forecast({ ...S, opts: { returnField: true, priors: false, windowDays: 40 } });
  const from = new Date(Date.parse(e.election) - VDAYS * 864e5).toISOString().slice(0, 10);
  const polls = F.campaign.filter((p) => !F.isCheck(p) && p.published >= from), ids = F.ids, sh = new Map(polls.map((p) => [p.id, F.shares(p)]));
  const seatsOf = (p) => { const t = { net: 0 }; for (const [id, r] of Object.entries(p.results)) if (e.blocs[id] === "net") t.net += r.belowThreshold ? 0 : r.seats ?? 0; for (const c of p.combined) { const xs = c.parties.filter((x) => e.blocs[x] === "net"); t.net += c.seats * xs.length / c.parties.length; } return t.net; };
  const L = [], Bl = [];
  for (let i = 0; i < polls.length; i++) for (let j = i + 1; j < polls.length; j++) {
    const a = polls[i], b = polls[j]; if (a.pollster !== b.pollster) continue;
    const dt = Math.abs(Date.parse(a.published) - Date.parse(b.published)) / 864e5; if (dt < 1 || dt > 21) continue;
    const sa = sh.get(a.id), sb = sh.get(b.id);
    for (const id of ids) { if (sa[id] == null || sb[id] == null) continue; const m = Math.max(0.01, (sa[id] + sb[id]) / 2); L.push([dt, ((sa[id] - sb[id]) / Math.sqrt(m / 0.08) * 100) ** 2]); }
    Bl.push([dt, (seatsOf(a) - seatsOf(b)) ** 2]);
  }
  return { L, B: Bl };
}
export function fitQ(pts) { const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n; let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; } return Math.max(0, sxy / sxx); }
/** Leave-future-out random-walk sds per √day for election i: pooled over campaigns 0..i (its own campaign precedes its vote). */
let VG = null;
export function rwLFO(i) { VG ??= elections.map(variogram); const L = VG.slice(0, i + 1).flatMap((v) => v.L), Bl = VG.slice(0, i + 1).flatMap((v) => v.B); return { list: Math.sqrt(fitQ(L)), bloc: Math.sqrt(fitQ(Bl)) }; }
const QS = args.includes("--qs");
/**
 * Leave-future-out consolidation sd (seats) for election i: the largest Netanyahu-bloc and opposition list's miss
 * (result − final field, share × 120, no priors) in the elections before i, pooled with 2 pseudo-observations at
 * v2's 1.5 seats. Uses only results of earlier elections.
 */
let CG = null;
export function consolidateLFO(i) {
  CG ??= elections.map((e) => { const f = forecast({ ...setup(e), opts: { returnField: true, priors: false } });
    return ["net", "opp"].map((b) => { const top = f.ids.filter((id) => e.blocs[id] === b).sort((x, y) => f.base[y] - f.base[x])[0]; return ((e.result.lists[top]?.pct ?? 0) / 100 - f.base[top]) * 120; }); });
  const g = CG.slice(0, i).flat(); return Math.sqrt((2 * 1.5 ** 2 + g.reduce((a, x) => a + x * x, 0)) / (2 + g.length));
}
export const run = (e, opts, fn = forecast) => fn({ ...setup(e), opts: { runs: RUNS, electionDate: e.election, ...(QS && fn === forecast ? { quantiles: true } : {}), ...opts } });
export function score(e, f) {
  const lists = Object.keys(e.lists), res = e.result.lists;
  const seats = (id) => res[id]?.seats ?? 0;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - seats(id)), 0) / lists.length;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += seats(id);
  const B = ["net", "opp", "mid", "arab"];
  const blocErr = B.reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrong = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const top = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  const brierPass = lists.reduce((a, id) => a + ((f.lists[id]?.passes ?? 0) / 100 - (res[id]?.passed ? 1 : 0)) ** 2, 0) / lists.length;
  const covList = lists.filter((id) => seats(id) >= f.lists[id].lo && seats(id) <= f.lists[id].hi).length;
  const covBloc = B.filter((b) => actual[b] >= f.blocs[b].lo && actual[b] <= f.blocs[b].hi).length;
  const covNet = actual.net >= f.blocs.net.lo && actual.net <= f.blocs.net.hi ? 1 : 0;
  let c50 = 0, c80 = 0, c50b = 0, c80b = 0;
  if (f.lists[lists[0]].qs) { for (const id of lists) { const [q10, q25, q75, q90] = f.lists[id].qs, y = seats(id); c50 += y >= q25 && y <= q75; c80 += y >= q10 && y <= q90; } for (const b of B) { const [q10, q25, q75, q90] = f.blocs[b].qs, y = actual[b]; c50b += y >= q25 && y <= q75; c80b += y >= q10 && y <= q90; } }
  const width = lists.reduce((a, id) => a + f.lists[id].hi - f.lists[id].lo, 0) / lists.length;
  return { listErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong, majorityRight: top === outcome, brier, brierPass, covList, nList: lists.length, covBloc, covNet, width, c50, c80, c50b, c80b };
}
export function table(variants, { perElection = true } = {}) {
  const rows = [];
  for (const [name, opts] of Object.entries(variants)) {
    const ss = elections.map((e, i) => score(e, run(e, typeof opts === "function" ? opts(e, i) : opts)));
    const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length, sum = (k) => ss.reduce((a, s) => a + s[k], 0);
    rows.push({ variant: name, listMAE: m("listErr").toFixed(2), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrong: sum("wrong"),
      maj: ss.filter((s) => s.majorityRight).length + "/6", brierMaj: m("brier").toFixed(3), brierPass: m("brierPass").toFixed(4),
      cov90List: (sum("covList") / sum("nList") * 100).toFixed(0) + "%", cov90Bloc: (sum("covBloc") / 24 * 100).toFixed(0) + "%", covNet: sum("covNet") + "/6", width: m("width").toFixed(2),
      ...(QS ? { "cov50/80 list": `${(sum("c50") / sum("nList") * 100).toFixed(0)}/${(sum("c80") / sum("nList") * 100).toFixed(0)}%`, "cov50/80 bloc": `${(sum("c50b") / 24 * 100).toFixed(0)}/${(sum("c80b") / 24 * 100).toFixed(0)}%` } : {}),
      ...(perElection ? { perElectionList: ss.map((s) => s.listErr.toFixed(2)).join(" ") } : {}) });
  }
  console.table(rows);
  return rows;
}
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  console.log(`data: scripts/forecast/backtest/${DATA}/, runs ${RUNS}`);
  if (args.includes("--check")) {
    for (const e of elections) {
      const a = run(e, {}, forecastV2), b = run(e, { quantiles: false });
      const same = JSON.stringify(a.lists) === JSON.stringify(b.lists) && JSON.stringify(a.blocs) === JSON.stringify(b.blocs) && JSON.stringify(a.majority) === JSON.stringify(b.majority);
      console.log(e.key, same ? "identical to model.mjs" : "DIFFERS");
    }
  }
  const V = {
    "v2": {},
    // Q2: trend carried forward over the blackout gap (newest poll -> vote), pollster fixed effects
    "trend 7d": { trendDays: 7 },
    "trend 14d": { trendDays: 14 },
    "trend 7d, half": { trendDays: 7, trendDamp: 0.5 },
    "trend 14d, half": { trendDays: 14, trendDamp: 0.5 },
    // Q2: shrink the final level toward each outlet's mean over a longer window
    "shrink 14d w.25": { shrinkDays: 14, shrinkW: 0.25 },
    "shrink 14d w.5": { shrinkDays: 14, shrinkW: 0.5 },
    "shrink 21d w.25": { shrinkDays: 21, shrinkW: 0.25 },
    "shrink 21d w.5": { shrinkDays: 21, shrinkW: 0.5 },
    // Q4: weight inside the 7-day field by age / Friday
    "age half-life 3d": { ageHalfLife: 3 },
    "age half-life 7d": { ageHalfLife: 7 },
    "Friday ×1.5": { fridayBoost: 1.5 },
    // Q3: widening
    "D rec.: rw .17/.37 beyond 4 days": { rwListSdAt8: 0.17, rwBlocSd: 0.37, blackoutBaseline: 4 },
    "D alt.: rw .17/.46 whole gap": { rwListSdAt8: 0.17, rwBlocSd: 0.46 },
    "rw fitted LFO (list+bloc)": (e, i) => { const r = rwLFO(i); return { rwListSdAt8: r.list, rwBlocSd: r.bloc }; },
    "rw fitted LFO, list only": (e, i) => ({ rwListSdAt8: rwLFO(i).list }),
    "rw fitted LFO, bloc only": (e, i) => ({ rwBlocSd: rwLFO(i).bloc }),
    "rw list 0.40/√d (2×)": { rwListSdAt8: 0.40 },
    "rw bloc 0.75/√d (2×)": { rwBlocSd: 0.75 },
    "consolidateSd 2.5": { consolidateSd: 2.5 },
    "consolidateSd 3.0": { consolidateSd: 3.0 },
    "consolidateSd LFO": (e, i) => ({ consolidateSd: consolidateLFO(i) }),
    "listSd ×1.25": { listSdScale: 1.25 },
    "listSd ×0.8": { listSdScale: 0.8 },
    "blocSd ×1.25": { blocSdScale: 1.25 },
    "blocSd ×0.8": { blocSdScale: 0.8 },
  };
  if (args.includes("--lfo")) elections.forEach((e, i) => { const r = rwLFO(i); console.log(e.key, "LFO rw sd per √day: list", r.list.toFixed(3), "pts at 8%; bloc", r.bloc.toFixed(3), "seats; consolidateSd", consolidateLFO(i).toFixed(2), "seats"); });
  table(V);
}
