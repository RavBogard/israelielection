/**
 * Round 2, agent F: the candidate forecasts the ensembles are built from, set up for each backtest election
 * (leave-future-out, as scripts/forecast/backtest/v2.mjs) and for 2026 (polls through Oct 22).
 *
 * Model sources are pinned to commit 56fee38 (version 2's model.mjs and agents B, C, G as committed), read with
 * `git show`, because the working tree's model.mjs is being rewritten by the synthesis. Agent E's model is read from
 * disk (round2/E/model-e.mjs, uncommitted at the time of writing) when it exists.
 *
 *   const C = await loadCandidates();  C.backtest(e)  -> { name: (o) => forecast }   C.y2026() -> same for 2026
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadModel } from "./ensemble.mjs";
import { siteAverage } from "../../backtest/model.mjs";

export const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../../../..");
export const PIN = "56fee38";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const gitShow = (p) => execFileSync("git", ["show", `${PIN}:${p}`], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
export const cal = JSON.parse(gitShow("scripts/forecast/calibration.json"));
const DATA = path.join(ROOT, "scripts/forecast/backtest/data");
export const elections = fs.readdirSync(DATA).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort().map((f) => read(path.join(DATA, f)));

/** backtest/v2.mjs's CLASSES, verbatim. */
export const CLASSES = {
  "2015-03": { shas: 0.8, jl: 0.5, jh: -0.8, yachad: -0.8 },
  "2019-04": { shas: 0.8, ht: 0.5, raambalad: 0.5, nr: -0.8, zehut: -0.8, gesher: -0.8 },
  "2019-09": { shas: 0.8, jl: 0.5, yamina: -0.8, otzma: -0.8 },
  "2020-03": { shas: 0.8, jl: 0.5, yamina: -0.8 },
  "2021-03": { shas: 0.8, jl: 0.5, raam: 0.5, yamina: -0.8, nep: -0.8, rz: -0.8 },
  "2022-11": { shas: 0.8, raam: 0.5, ht: 0.5, balad: 0.5 },
};
/** Agent G's v3 noise (round2/G/v3.mjs). */
const G_V3 = { noise: "v3", v3: { swing: "t", scaleFloor: 1.5, dfMin: 3, consolidateDf: 0, leanFrom: "all", leanTo: "bloc", listScale: 1 } };

export async function loadCandidates({ withE = true } = {}) {
  const M2 = await loadModel(gitShow("scripts/forecast/model.mjs"));
  const MG = await loadModel(gitShow("scripts/forecast/round2/G/model-g.mjs"), { baseOverride: true });
  const MB = await loadModel(gitShow("scripts/forecast/round2/B/model-b.mjs"));
  const MC = await loadModel(gitShow("scripts/forecast/round2/C/model-c.mjs"));
  const ePath = path.join(ROOT, "scripts/forecast/round2/E/model-e.mjs");
  let ME = null, D1 = null;
  if (withE && fs.existsSync(ePath)) { ME = await loadModel(fs.readFileSync(ePath, "utf8")); D1 = await import("../D1/load.mjs"); }

  // ---- agent B's Arab calibration (round2/B/common.mjs), with pollShares on the pinned version 2.
  const S = JSON.parse(gitShow("scripts/forecast/round2/B/sectors.json"));
  const I = (r) => (r.arabTurnout * r.arabListLoyalty) / r.generalTurnout;
  const setupOf = (e) => {
    const pollsters = [...new Set(e.polls.map((p) => p.pollster))], filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
    return { polls: e.polls, config: { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 }, parties: Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] })), agreements: e.agreements };
  };
  const psCache = {};
  const pollShares = (e) => (psCache[e.key] ??= (() => { const f = M2.forecast({ ...setupOf(e), cal: { ...cal, elections: [], listPriors: {}, withdrawn: { lists: [] } }, opts: { runs: 100, priors: false, lean: 0, withdrawn: false } }); return Object.fromEntries(Object.keys(e.lists).map((id) => [id, f.lists[id].share])); })());
  const mech = (s, x) => (s * x) / (s * x + 1 - s) - s;
  let rows = null;
  const arabRows = () => rows ??= S.series.flatMap((r, i) => {
    const prev = S.series[i - 1]; let poll, res;
    if (r.arabGap) { poll = r.arabGap.pollPct; res = r.arabGap.resultPct; }
    else { const e = elections.find((x) => x.key === r.key); if (!e) return []; const ps = pollShares(e); const ar = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab"); poll = ar.reduce((a, id) => a + ps[id], 0); res = ar.reduce((a, id) => a + (e.result.lists[id]?.pct ?? 0), 0); }
    return [{ key: r.key, gap: res - poll, mechI: 100 * mech(poll / 100, I(r) / I(prev)) }];
  });
  function arabCalibration(key) {
    const ser = S.series.filter((r) => r.key < key);
    const pairs = []; for (let j = 2; j < ser.length; j++) { const h = ser.slice(0, j).map(I), m = h.reduce((a, b) => a + b, 0) / h.length; pairs.push({ dev: m - I(ser[j - 1]), ch: I(ser[j]) - I(ser[j - 1]) }); }
    const k = pairs.length ? Math.max(0, Math.min(1, pairs.reduce((a, p) => a + p.dev * p.ch, 0) / pairs.reduce((a, p) => a + p.dev ** 2, 0))) : 0;
    const h = ser.map(I), mean = h.reduce((a, b) => a + b, 0) / h.length, last = I(ser[ser.length - 1]);
    return { logShift: Math.log((last + k * (mean - last)) / last) };
  }
  /** B2: the turnout term on the Arab lists other than Ra'am, Ra'am's class prior kept (round2/B/bt.mjs arabCarriers). */
  function b2Sector(key, shares, arabIds) {
    const c = arabCalibration(key);
    const sub = arabIds.filter((id) => !["raam", "raambalad"].includes(id));
    const St = arabIds.reduce((a, id) => a + shares[id], 0), Ss = sub.reduce((a, id) => a + shares[id], 0);
    return { name: "arab", lists: sub, logShift: Math.log(Math.max(0.3, 1 + (Math.exp(c.logShift) - 1) * St / Ss)), alphaPts: 0, sdLog: 0.12 * St / Ss, replacesPriors: true };
  }
  // ---- agent C's K1: the first-time/first-solo small lists' −0.8 funded by their own bloc's largest list.
  const cases = JSON.parse(gitShow("scripts/forecast/round2/C/cases.json"));
  const isThresholdClass = (c) => c && (c.isNew || c.isSolo) && !c.arab && c.share - (c.threshold ?? 3.25) < 2.75;
  const k1Ids = (e) => Object.keys(CLASSES[e.key]).filter((id) => CLASSES[e.key][id] === -0.8 && isThresholdClass(cases.find((c) => c.key === e.key && c.id === id)));
  // ---- agent E: leave-future-out fits, cached.
  const full = ME ? Object.fromEntries(D1.KEYS.map((k) => [k, D1.loadFull(k, { since: "dissolved" })])) : null;
  const camps = ME ? Object.fromEntries(D1.KEYS.map((k) => { const f = full[k], ids = Object.keys(f.lists); return [k, { key: k, ids, f, obs: ME.campaignObs(f.polls, ids, { isCheck: (p) => p.filber }) }]; })) : null;
  const fitCache = {};
  const fitE = (k) => (fitCache[k] ??= ME.fitParams(D1.KEYS.filter((x) => k === "2026" || full[x].election < full[k].election).map((x) => camps[x]), { dynamics: "rw", house: true }));

  /** Plain √n site average (backtest/model.mjs siteAverage, 14 days) as shares: seats/120 scaled to 1 − fringe. */
  const avgShares = (polls, ids, includeFilber, isFilber) => {
    const { seats } = siteAverage(polls, ids, { includeFilber, ...(isFilber ? { isFilber } : {}) });
    const t = ids.reduce((a, id) => a + (seats[id] ?? 0), 0);
    return { seats, central: Object.fromEntries(ids.map((id) => [id, (100 * (1 - cal.fringe.share) * (seats[id] ?? 0)) / t])) };
  };

  /** One context's candidates. base = { polls, config, parties, agreements, cal }; ext = per-candidate extras. */
  function build(base, ext) {
    const run = (M, opts) => (o) => M.forecast({ ...base, opts: { ...opts, ...o } });
    const simulate = (noise = "v2") => (central, o) => MG.forecast({ ...base, opts: { lean: 0, baseOverride: Object.fromEntries(Object.entries(central).map(([k, v]) => [k, v / 100])), ...(noise === "v3" ? G_V3 : {}), blocPoint: o.blocPoint ?? "sum", runs: o.runs, seed: o.seed } });
    const ids = base.parties.map((p) => p.id).filter((id) => !(base.cal.withdrawn?.lists ?? []).some((w) => w.id === id));
    const C = {
      v2: run(M2, {}),
      "v2+bm": run(MG, { blocPoint: "median" }),
      G: run(MG, { ...G_V3, blocPoint: "median" }),
      w14: run(M2, { windowDays: 14 }),
    };
    for (const [name, inc] of [["avg", true], ["avgNF", false]]) {
      const a = avgShares(base.polls.filter((p) => base.config.pollsters.includes(p.pollster)), ids, inc, ext.isFilber);
      C[name] = (o) => ({ ...simulate("v2")(a.central, o), rawSeats: a.seats });
    }
    if (ext.b2) C.B2 = (o) => MB.forecast({ ...base, cal: { ...base.cal, sectorTurnout: { sectors: [ext.b2] } }, opts: { sectorTurnout: true, ...o } });
    if (ext.k1) C.K1 = run(MC, { priorsInBloc: ext.k1 });
    if (ME && ext.e) C.E = (o) => ME.forecast({ ...ext.e, opts: { ...ext.e.opts, ...o } });
    return { C, simulate };
  }

  function backtest(e) {
    const c = { ...cal, elections: cal.elections.filter((x) => x.date < e.election), listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] } };
    const base = { ...setupOf(e), cal: c };
    const arab = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab");
    let eExt = null;
    if (ME) {
      const f = full[e.key];
      eExt = { polls: f.polls, config: { pollsters: [...new Set(f.polls.map((p) => p.pollster))], withoutVariant: { pollsters: [] }, dissolved: f.dissolved }, parties: Object.keys(f.lists).map((id) => ({ id, bloc: f.blocs[id] })), agreements: f.agreements, cal: c, opts: { electionDate: e.election, dynamics: "rw", house: true, params: fitE(e.key) } };
    }
    return build(base, { b2: b2Sector(e.key, pollShares(e), arab), k1: k1Ids(e), e: eExt });
  }

  function y2026() {
    const snap = read(path.join(ROOT, "scripts/forecast/round2/polls-through-2026-10-22.json"));
    const polls = snap.polls.filter((p) => p.published <= "2026-10-22");
    const parties = read(path.join(ROOT, "data/parties.json")).parties.map((p) => ({ id: p.id, bloc: p.bloc }));
    const results = read(path.join(ROOT, "data/results.json"));
    const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
    const base = { polls, config: snap.config, parties, agreements, cal };
    const raw = M2.forecast({ ...base, opts: { runs: 200, priors: false, lean: 0 } }).lists;
    const shares = Object.fromEntries(Object.entries(raw).map(([id, l]) => [id, l.share]));
    const isFilber = (p) => snap.config.withoutVariant.pollsters.includes(p.pollster);
    return build(base, { b2: b2Sector("2026-10", shares, ["jl", "raam"]), k1: ["poi", "res"], isFilber, e: ME ? { ...base, opts: { electionDate: "2026-10-27", dynamics: "rw", house: true, params: fitE("2026") } } : null });
  }
  return { backtest, y2026, hasE: !!ME, M2, MG };
}
