/**
 * Round 2, agent C: shared loaders for the threshold-swing analysis and backtest. The `run`/`score` pair is a copy of
 * scripts/forecast/backtest/v2.mjs's, pointed at ./model-c.mjs, with an `extra` hook so a variant can compute opts
 * per election from the earlier elections only (leave-future-out).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast, MAJ } from "./model-c.mjs";
export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(here, "../../../..");
export const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
export const cal = read(path.join(root, "scripts/forecast/calibration.json"));
/** CDATA=full reads D1's whole-campaign files (backtest/data-full/, 2013 included); the default is the 28-day files.
 *  The leave-future-out scores are always over the six 3.25% elections (`elections`); `allElections` adds 2013. */
export const FULL = process.env.CDATA === "full";
const dataDir = path.join(root, "scripts/forecast/backtest", FULL ? "data-full" : "data");
export const allElections = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(dataDir, f)));
export const elections = allElections.filter((e) => e.key !== "2013-01");
/** As in backtest/v2.mjs. */
export const CLASSES = {
  "2013-01": {},
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
/** Polls as they stood `daysBack` days before the newest poll (for the trend). */
export const asOf = (polls, daysBack) => { const newest = polls.map((p) => p.published).sort().at(-1); const cut = new Date(Date.parse(newest) - daysBack * 864e5).toISOString().slice(0, 10); return polls.filter((p) => p.published <= cut); };
export function run(e, opts = {}, polls = e.polls) {
  const earlier = cal.elections.filter((c) => c.date < e.election);
  const c = { ...cal, elections: earlier, listPriors: opts.listPriors ?? CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))];
  const filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  const { listPriors, ...rest } = opts;
  return forecast({ polls, config, parties, agreements: e.agreements, cal: c, opts: { runs: 2000, threshold: e.threshold ?? 0.0325, ...rest } });
}
export function score(e, f) {
  const lists = Object.keys(e.lists), res = e.result.lists;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - (res[id]?.seats ?? 0)), 0) / lists.length;
  const actual = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of lists) actual[e.blocs[id]] += res[id]?.seats ?? 0;
  const blocErr = ["net", "opp", "mid", "arab"].reduce((a, b) => a + Math.abs(f.blocs[b].point - actual[b]), 0) / 4;
  const wrongIds = lists.filter((id) => !!f.lists[id]?.call !== !!res[id]?.passed);
  const outcome = actual.net >= MAJ ? "net" : actual.opp >= MAJ ? "oppZionist" : "neither";
  const p = { net: f.majority.net, oppZionist: f.majority.oppZionist, neither: f.majority.neither };
  const top = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const brier = Object.entries(p).reduce((a, [k, v]) => a + (v / 100 - (k === outcome ? 1 : 0)) ** 2, 0);
  // Threshold Brier: every list's P(pass) against whether it passed.
  const passBrier = lists.reduce((a, id) => a + ((f.lists[id]?.passes ?? 0) / 100 - (res[id]?.passed ? 1 : 0)) ** 2, 0);
  return { listErr, netErr: Math.abs(f.blocs.net.point - actual.net), blocErr, wrong: wrongIds.length, wrongIds, majorityRight: top === outcome, brier, passBrier, nLists: lists.length };
}
/** 2026, as forecast.mjs runs it, on data/polls.json (the 62 polls through Oct 22; nothing later). */
export function run2026(opts = {}, pollsFilter = (p) => p.published <= "2026-10-22") {
  const { polls, config } = read(path.join(root, "data/polls.json"));
  const pj = read(path.join(root, "data/parties.json"));
  const parties = (pj.parties ?? pj).map((p) => ({ id: p.id, bloc: p.bloc }));
  const results = read(path.join(root, "data/results.json"));
  const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
  const { listPriors, ...rest } = opts;
  const c = listPriors ? { ...cal, listPriors } : cal;
  return forecast({ polls: polls.filter(pollsFilter), config, parties, agreements, cal: c, opts: rest });
}
