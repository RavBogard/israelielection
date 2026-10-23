/**
 * Scores scripts/forecast/model.mjs (version 2) on the six elections in ./data, leave-future-out: the lean and its
 * residual come from the elections before each one, the list priors are the 2026 classes mapped by hand to each
 * election's lists (CLASSES below; a judgment, written out). Prints the pre-registered score for version 1's rules,
 * version 2's, and each component switched off.   node scripts/forecast/backtest/v2.mjs [runs]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast, MAJ } from "../model.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const RUNS = Number(process.argv[2]) || 10_000;
const cal = read(path.join(here, "../calibration.json"));
const elections = fs.readdirSync(path.join(here, "data")).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(here, "data", f)));
/** 2026's prior classes on past lists: Shas; Arab-led lists; Bennett's list; first-time (or first-time-solo) small lists. */
const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
const V1 = { windowDays: 14, firmWeights: false, shares: "hare", priors: false, leanNetOfShas: false, listSdFloor: false, zeroSum: false, arabSwing: false, fringe: false, withdrawn: false, point: "central" };
const VARIANTS = {
  "v1 (published rules)": V1,
  "v2": {},
  "v2, shares as v1 (seats/120)": { shares: "hare" },
  "v2, no list priors": { priors: false },
  "v2, priors but gross lean": { leanNetOfShas: false },
  "v2, independent list noise": { zeroSum: false, arabSwing: false },
  "v2, no small-list floor": { listSdFloor: false },
  "v2, no fringe": { fringe: false },
  "v2, point = allocate(central)": { point: "central" },
  "v2, 14-day window": { windowDays: 14 },
  "v2, outlet weights": { firmWeights: false },
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
  const top = Object.entries({ net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither }).sort((a, b) => b[1] - a[1])[0][0];
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  return { listErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong, majorityRight: top === outcome, brier };
}
const rows = [];
for (const [name, opts] of Object.entries(VARIANTS)) {
  const ss = elections.map((e) => score(e, run(e, opts)));
  const m = (k) => ss.reduce((a, s) => a + s[k], 0) / ss.length;
  rows.push({ variant: name, listMAE: m("listErr").toFixed(2), netErr: m("netErr").toFixed(2), blocErr: m("blocErr").toFixed(2), wrongCalls: ss.reduce((a, s) => a + s.wrong, 0), majorityRight: ss.filter((s) => s.majorityRight).length + "/6", brier: m("brier").toFixed(3), perElectionList: ss.map((s) => s.listErr.toFixed(2)).join(" ") });
}
console.table(rows);
