/**
 * Round 2, agent R (red team): variants of version 3 scored with backtest/v3.mjs's own setup/score/summarise.
 *   node scripts/forecast/round2/R/attack.mjs [runs=10000] [seeds=3] [data] [--group=sector|perturb|classes|detail]
 * Seeds are v3.mjs's: 20261027, 1, 2, 3, 4 (first n).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast as f0 } from "../../model.mjs";
import { forecast as fR } from "./model-r.mjs";
const forecast = (x) => (x.opts?.modelR ? fR : f0)(x);
import { elections, setup, score, summarise, CLASSES, arabSector, cal } from "../../backtest/v3.mjs";
import { arabCalibration } from "../B/common.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), pos = args.filter((a) => !a.startsWith("--"));
const GROUP = (args.find((a) => a.startsWith("--group=")) ?? "--group=sector").split("=")[1];
const RUNS = Number(pos[0]) || 10_000, SEEDS = [20261027, 1, 2, 3, 4].slice(0, Number(pos[1]) || 3);
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const RAAM = ["raam", "raambalad"];
const arabIds = (e) => Object.keys(e.lists).filter((id) => e.blocs[id] === "arab");

// ---- leave-future-out class priors (same membership as CLASSES; magnitudes from earlier elections only) ----
const cases = JSON.parse(fs.readFileSync(path.join(here, "../C/cases.json"), "utf8")).map((c) => ({ ...c, miss: c.result - c.share }));
const classOf = (key, id) => { const v = CLASSES[key]?.[id]; if (v == null) return null; return id === "shas" ? "shas" : v > 0 ? "arab" : "neg"; };
function lfoClasses(e, n0 = 3) {
  const out = {};
  for (const [id] of Object.entries(CLASSES[e.key])) {
    const k = classOf(e.key, id), xs = cases.filter((c) => c.key < e.key && classOf(c.key, c.id) === k).map((c) => c.miss);
    out[id] = xs.length ? (xs.reduce((a, b) => a + b, 0)) / (xs.length + n0) : 0;
  }
  return out;
}

/** A variant: (e) => ({ opts, cal patch }) */
function runOne(e, seed, v) {
  const s = setup(e); const p = v(e) ?? {};
  const c = { ...s.cal, ...(p.cal ?? {}) };
  return forecast({ ...s, cal: c, opts: { runs: RUNS, keepRuns: true, seed, ...(p.opts ?? {}) } });
}
function table(variants, detail = false) {
  const rows = [], det = {};
  for (const [name, v] of Object.entries(variants)) {
    const per = [], pts = {};
    for (const seed of SEEDS) {
      const ss = elections.map((e) => { const f = runOne(e, seed, v); const sc = score(e, f, mulberry(7)); if (detail) for (const id of Object.keys(e.lists)) { const k = `${e.key} ${id}`; (pts[k] ??= []).push(f.lists[id].point); } return sc; });
      per.push(summarise(ss));
    }
    const row = { variant: name }; for (const k of ["listMAE", "netErr", "blocErr", "wrong", "majBrier", "passBrier", "pit90", "listCRPS"]) row[k] = +(per.reduce((a, p) => a + p[k], 0) / per.length).toFixed(4);
    // per-election list error averaged over seeds
    const pe = per.map((p) => p.perElection.split(" ").map(Number)); row.perElection = pe[0].map((_, i) => (pe.reduce((a, x) => a + x[i], 0) / pe.length).toFixed(2)).join(" ");
    rows.push(row); det[name] = pts;
  }
  return { rows, det };
}
const sec = (sectors) => ({ cal: { sectorTurnout: { sectors } } });
const allArab = (e, sd = 0.12) => { const c = arabCalibration(e.key); return { name: "arab", lists: arabIds(e), logShift: c.logShift, alphaPts: 0, sdLog: sd, replacesPriors: true }; };
const jlOnly = (e) => { if (!e.lists.jl) return null; const s = arabSector(e); return s && { ...s, lists: ["jl"] }; }; // in 2015-2021 jl is the whole non-Ra'am Arab vote
const dropArabPriors = (e, which) => { const p = { ...CLASSES[e.key] }; for (const id of which(e)) delete p[id]; return p; };
const carriers = (e) => arabIds(e).filter((id) => !RAAM.includes(id));

const GROUPS = {
  sector: {
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
    "v3, sector on ALL Arab lists (B naive)": (e) => sec([allArab(e)]),
    "v3, sector on jl only (none in 2019-04, 2022)": (e) => sec([jlOnly(e)].filter(Boolean)),
    "v3, sector logShift 0 (draw only)": (e) => { const s = arabSector(e); return sec(s ? [{ ...s, logShift: 0 }] : []); },
    "v3, sector sdLog 0 (shift only)": (e) => { const s = arabSector(e); return sec(s ? [{ ...s, sdLog: 0 }] : []); },
    "v3, sector at 2026's sdLog 0.14": (e) => sec([arabSector(e, 0.14)].filter(Boolean)),
    "v3 no sector, carriers' +0.5 prior dropped (v2 Arab swing kept)": (e) => ({ opts: { sectorTurnout: false }, cal: { listPriors: dropArabPriors(e, carriers) } }),
    "v2, carriers' +0.5 prior dropped": (e) => ({ opts: { v2: true }, cal: { listPriors: dropArabPriors(e, carriers) } }),
    "v2, all Arab priors dropped": (e) => ({ opts: { v2: true }, cal: { listPriors: dropArabPriors(e, arabIds) } }),
    "v3, Ra'am prior dropped too": (e) => ({ cal: { listPriors: dropArabPriors(e, arabIds) } }),
  },
  perturb: {
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
    "v3 swingFloor 1.0": () => ({ opts: { swingFloor: 1.0 } }),
    "v3 swingFloor 2.0": () => ({ opts: { swingFloor: 2.0 } }),
    "v3 swingFloor 3.0": () => ({ opts: { swingFloor: 3.0 } }),
    "v3 swingDfMin 5": () => ({ opts: { swingDfMin: 5 } }),
    "v3 swingDfMin 30 (~normal)": () => ({ opts: { swingDfMin: 30 } }),
    "v3 sector sdLog 0.10": (e) => sec([arabSector(e, 0.10)].filter(Boolean)),
    "v3 sector sdLog 0.30": (e) => sec([arabSector(e, 0.30)].filter(Boolean)),
    "v3 sector logShift 0": (e) => { const s = arabSector(e); return sec(s ? [{ ...s, logShift: 0 }] : []); },
    "v3 sector logShift x0.5": (e) => { const s = arabSector(e); return sec(s ? [{ ...s, logShift: s.logShift / 2 }] : []); },
    "v3 unprinted 2%": () => ({ opts: { unprintedBelow: 0.02 } }),
    "v3 unprinted 3%": () => ({ opts: { unprintedBelow: 0.03 } }),
    "v3 fringe 1.5%": () => ({ opts: { fringe: 0.015 } }),
    "v3 fringe 2.1%": () => ({ opts: { fringe: 0.021 } }),
  },
  classes: {
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
    "v2, LFO class magnitudes": (e) => ({ opts: { v2: true }, cal: { listPriors: lfoClasses(e) } }),
    "v3, LFO class magnitudes": (e) => ({ cal: { listPriors: lfoClasses(e) } }),
    "v2, no priors": () => ({ opts: { v2: true, priors: false } }),
    "v3, no priors": () => ({ opts: { priors: false } }),
    "v2, first-time −0.8 removed in 2015 (no earlier case)": (e) => ({ opts: { v2: true }, cal: { listPriors: e.key === "2015-03" ? { ...CLASSES[e.key], yachad: 0 } : CLASSES[e.key] } }),
    "v3, first-time −0.8 removed in 2015": (e) => ({ cal: { listPriors: e.key === "2015-03" ? { ...CLASSES[e.key], yachad: 0 } : CLASSES[e.key] } }),
    "v2, du 2019-09 given −0.8 (new list <6%)": (e) => ({ opts: { v2: true }, cal: { listPriors: e.key === "2019-09" ? { ...CLASSES[e.key], du: -0.8 } : CLASSES[e.key] } }),
    "v3, du 2019-09 given −0.8": (e) => ({ cal: { listPriors: e.key === "2019-09" ? { ...CLASSES[e.key], du: -0.8 } : CLASSES[e.key] } }),
  },
  raam: {
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
    "v3 (model-r, raamSwing off: must equal v3)": () => ({ opts: { modelR: true } }),
    "v3 + Ra'am keeps its share of v2's Arab swing": () => ({ opts: { modelR: true, raamSwing: true } }),
  },
  detaillfo: {
    "v2 LFO": (e) => ({ opts: { v2: true }, cal: { listPriors: lfoClasses(e) } }),
    "v3 LFO": (e) => ({ cal: { listPriors: lfoClasses(e) } }),
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
  },
  detail: {
    "v2": () => ({ opts: { v2: true } }),
    "v3": () => ({}),
    "v3 normal swing": () => ({ opts: { swing: "normal" } }),
    "v2 + sector": () => ({ opts: { v2: true, sectorTurnout: true } }),
  },
};
if (GROUP === "lfo") { for (const e of elections) console.log(e.key, JSON.stringify(lfoClasses(e)), JSON.stringify(arabCalibration(e.key)), JSON.stringify(arabSector(e))); process.exit(0); }
const { rows, det } = table(GROUPS[GROUP], GROUP.startsWith("detail"));
console.log(`${RUNS} runs × seeds ${SEEDS.join(", ")}; group ${GROUP}`);
console.table(rows);
if (GROUP.startsWith("detail")) {
  const names = Object.keys(det), keys = Object.keys(det[names[0]]);
  const res = Object.fromEntries(elections.flatMap((e) => Object.keys(e.lists).map((id) => [`${e.key} ${id}`, e.result.lists[id]?.seats ?? 0])));
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log("lists whose seed-averaged point differs between any two variants (result, then each variant's point):");
  for (const k of keys) { const ps = names.map((n) => avg(det[n][k])); if (new Set(ps.map((x) => x.toFixed(2))).size > 1) console.log(k.padEnd(20), "result", res[k], names.map((n, i) => `${n}: ${ps[i].toFixed(2)}`).join(" | ")); }
}
