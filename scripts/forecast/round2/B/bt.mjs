/**
 * Leave-future-out backtest of agent B's sector turnout term against version 2, the harness of
 * scripts/forecast/backtest/v2.mjs (same CLASSES, same scoring) with model-b.mjs.
 *   node scripts/forecast/round2/B/bt.mjs [runs]          (10,000 runs: about a minute)
 */
import { forecast, MAJ } from "./model-b.mjs";
import { cal, elections, arabCalibration, I, Iturn } from "./common.mjs";
const RUNS = Number(process.argv[2]) || 10_000;
const CLASSES = { // backtest/v2.mjs, verbatim
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
const arabSector = (e, o) => { const c = arabCalibration(e.key, o.cal ?? {}); return { name: "arab", bloc: "arab", logShift: o.noShift ? 0 : c.logShift, alphaPts: o.noAlpha ? 0 : c.alphaPts, sdLog: o.sdLog ?? 0.12, replacesPriors: true }; };
const RAAM = ["raam", "raambalad"];
/** The turnout term carried by the Arab lists other than Ra'am (whose base votes at a steady rate and keeps its class prior). */
const arabCarriers = (e, o) => {
  const c = arabCalibration(e.key, o.cal ?? {}); const ps = pollSharesQuick(e);
  const all = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab"), sub = all.filter((id) => !RAAM.includes(id));
  const St = all.reduce((a, id) => a + ps[id], 0), Ss = sub.reduce((a, id) => a + ps[id], 0);
  const xs = Math.max(0.3, 1 + (Math.exp(c.logShift) - 1) * St / Ss);
  return { name: "arab", lists: sub, logShift: o.noShift ? 0 : Math.log(xs), alphaPts: o.alpha ? c.alphaPts : 0, sdLog: (o.sdLog ?? 0.12) * St / Ss, replacesPriors: true };
};
const VARIANTS = {
  "B2: turnout term on non-Ra'am Arab lists, Ra'am class prior kept, sdLog 0.12": { carriers: {} },
  "B2, sdLog 0.08": { carriers: { sdLog: 0.08 } },
  "B2, sdLog 0.16": { carriers: { sdLog: 0.16 } },
  "B2 + sector alpha": { carriers: { alpha: true } },
  "B2, index = turnout only": { carriers: { cal: { index: Iturn, mechKey: "mechT" } } },
  "B2, k = 0.5": { carriers: { cal: { k: 0.5 } } },
  "B2, no shift (zero-mean turnout draw only)": { carriers: { noShift: true } },
  "v2": {},
  "v2, Arab priors off (zero-mean swing only)": { dropArab: true },
  "v2, Arab prior = LFO shrunk past mean sector gap, swing sd 1.7": { sector: { noShift: true, sdLog: 0 }, arabSwingKeep: true },
  "B: sector turnout (I, reversion, alpha), sdLog 0.12": { sector: {} },
  "B: same, sdLog 0.08": { sector: { sdLog: 0.08 } },
  "B: same, sdLog 0.16": { sector: { sdLog: 0.16 } },
  "B: turnout shift only, no alpha": { sector: { noAlpha: true } },
  "B: index = turnout only (no loyalty)": { sector: { cal: { index: Iturn, mechKey: "mechT" } } },
  "B: I, k = 0.5 (half reversion)": { sector: { cal: { k: 0.5 } } },
  "B + Haredi sector, zero mean, sdLog 0.03": { sector: {}, haredi: 0.03 },
};
function run(e, v) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const pri = { ...(CLASSES[e.key] ?? {}) };
  if (v.dropArab) for (const id of Object.keys(pri)) if (e.blocs[id] === "arab") delete pri[id];
  const sectors = [];
  if (v.sector) sectors.push(arabSector(e, v.sector));
  if (v.carriers) sectors.push(arabCarriers(e, v.carriers));
  if (v.haredi) sectors.push({ name: "haredi", lists: ["shas", "utj"], logShift: 0, alphaPts: 0, sdLog: v.haredi });
  const c = { ...cal, elections: earlier, listPriors: pri, withdrawn: { lists: [] }, sectorTurnout: { sectors } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))], filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  const f = forecast({ polls: e.polls, config, parties, agreements: e.agreements, cal: c, opts: { runs: RUNS, sectorTurnout: sectors.length > 0 } });
  if (v.arabSwingKeep) { // the intercept-only variant keeps v2's Arab swing: rerun with the swing on (sectorTurnout replaces it otherwise)
    const c2 = { ...c, listPriors: { ...pri }, sectorTurnout: { sectors: [] } };
    const past = arabRows().filter((r) => r.key < e.key); // the honest version of v2's fixed Arab prior: the mean past sector gap, shrunk (2 pseudo-elections at 0), spread pro rata
    const al = past.reduce((a, r) => a + r.gap, 0) / (past.length + 2) / 100;
    const share = pollSharesQuick(e);
    const ar = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab"); const tot = ar.reduce((a, id) => a + share[id], 0);
    for (const id of ar) c2.listPriors[id] = (100 * al * share[id]) / tot; for (const id of Object.keys(pri)) if (e.blocs[id] === "arab" && !ar.includes(id)) delete c2.listPriors[id];
    return forecast({ polls: e.polls, config, parties, agreements: e.agreements, cal: c2, opts: { runs: RUNS } });
  }
  return f;
}
import { pollShares, arabRows } from "./common.mjs";
const _ps = {}; const pollSharesQuick = (e) => (_ps[e.key] ??= pollShares(e));
function score(e, f) { // backtest/v2.mjs score(), plus the Arab bloc
  const lists = Object.keys(e.lists), res = e.result.lists;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0) / lists.length;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += res[id]?.seats ?? 0;
  const blocErr = ["net", "opp", "mid", "arab"].reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrong = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed).length;
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const top = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  const arabLists = lists.filter((id) => e.blocs[id] === "arab");
  const arabListErr = arabLists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0);
  return { listErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong, majorityRight: top === outcome, brier, arabErr: f.blocs.arab.point - actual.arab, arabListErr, arabIn90: actual.arab >= f.blocs.arab.lo && actual.arab <= f.blocs.arab.hi };
}
const rows = [];
for (const [name, v] of Object.entries(VARIANTS)) {
  const ss = elections.map((e) => score(e, run(e, v)));
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length;
  rows.push({ variant: name, listMAE: m("listErr").toFixed(2), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrong: ss.reduce((a, s) => a + s.wrong, 0), majority: ss.filter((s) => s.majorityRight).length + "/6", brier: m("brier").toFixed(3), arabBlocMAE: (ss.reduce((a, s) => a + Math.abs(s.arabErr), 0) / 6).toFixed(2), arabListSum: ss.reduce((a, s) => a + s.arabListErr, 0), arabIn90: ss.filter((s) => s.arabIn90).length, perElection: ss.map((s) => s.listErr.toFixed(2)).join(" "), brierPer: ss.map((s) => s.brier.toFixed(2)).join(" "), arabBlocErr: ss.map((s) => (s.arabErr > 0 ? "+" : "") + s.arabErr).join(" ") });
}
if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 1)); else console.table(rows);
console.log("\nArab calibration used per election (index I, k fitted, alpha shrunk with 2 pseudo-elections):");
console.table(elections.map((e) => { const c = arabCalibration(e.key); return { election: e.key, k: c.k.toFixed(2), lastI: c.last.toFixed(3), meanI: c.mean.toFixed(3), expectedI: c.expected.toFixed(3), logShift: c.logShift.toFixed(3), alphaPts: c.alphaPts.toFixed(2) }; }));
