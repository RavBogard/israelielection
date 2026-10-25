/**
 * Round 2, agent F: leave-future-out backtest of ensembles of the round-2 candidates (F-ensemble.md).
 *
 *   node scripts/forecast/round2/F/backtest-f.mjs [runs] [seeds]     (default 10,000 runs × 3 seeds; ~5 min)
 *   node scripts/forecast/round2/F/backtest-f.mjs --2026 [runs]      (2026, polls through Oct 22; default 50,000 runs)
 *
 * Candidates (candidates.mjs): v2; v2+bm (v2, bloc point = bloc median); G (agent G's t swing + bloc median);
 * w14 (v2, 14-day window); avg / avgNF (the plain √n site average, with / without the Filber firms, as shares,
 * simulated with v2's noise; avgRaw / avgNFRaw: its fractional seats as the point, the brief's 1.53 row); B2 (agent B's
 * Arab turnout term); K1 (agent C's in-bloc funding of the first-time −0.8); E (agent E's state-space model, if present).
 * Every candidate is leave-future-out as its author built it; the ensemble weights are equal or fitted on earlier
 * elections only. Columns are the mean over seeds (bloc columns move with the seed; list error does not at 10,000 runs).
 */
import { loadCandidates, elections } from "./candidates.mjs";
import { ensemble, summariseDraws } from "./ensemble.mjs";
import { score, summarise, fmt, BLOCS } from "./score.mjs";

const args = process.argv.slice(2), nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const L = await loadCandidates();

/** Fractional points -> whole seats: lists with P(pass) < 0.5 get 0, the rest largest remainder to 120. */
export function roundPoints(f) {
  const ids = Object.keys(f.lists), pass = ids.filter((id) => f.lists[id].passes >= 50);
  const x = Object.fromEntries(ids.map((id) => [id, pass.includes(id) ? Math.max(4, f.lists[id].point) : 0]));
  const t = pass.reduce((a, id) => a + x[id], 0); for (const id of pass) x[id] *= 120 / t;
  const fl = Object.fromEntries(ids.map((id) => [id, Math.floor(x[id])])); let left = 120 - ids.reduce((a, id) => a + fl[id], 0);
  for (const id of [...pass].sort((a, b) => (x[b] - fl[b]) - (x[a] - fl[a]))) { if (left <= 0) break; fl[id]++; left--; }
  const lists = Object.fromEntries(ids.map((id) => [id, { ...f.lists[id], point: fl[id] }]));
  return { ...f, lists, blocs: Object.fromEntries(BLOCS.map((b) => [b, { ...f.blocs[b] }])) };
}

if (args.includes("--2026")) {
  const RUNS = nums[0] || 50_000, seed = 20261027;
  const { C, simulate } = L.y2026();
  const outs = Object.fromEntries(Object.entries(C).map(([k, fn]) => [k, fn({ runs: RUNS, seed })]));
  const parties = Object.keys(outs.v2.lists).map((id) => ({ id, bloc: null }));
  const P = (await import("node:fs")).default; const pj = JSON.parse(P.readFileSync(new URL("../../../../data/parties.json", import.meta.url))).parties;
  const partiesB = pj.map((p) => ({ id: p.id, bloc: p.bloc })).filter((p) => p.id in outs.v2.lists);
  const show = (name, f) => ({ variant: name, blocs: BLOCS.map((b) => f.blocs[b].point).join("/"), "net 90%": `${f.blocs.net.lo}-${f.blocs.net.hi}`, "P(net≥61)": f.majority.net + "%", "P(opp≥61)": f.majority.oppZionist + "%",
    likud: f.lists.likud.point, shas: f.lists.shas.point, jl: f.lists.jl.point, raam: `${f.lists.raam.point} (${f.lists.raam.passes}%)`, poi: f.lists.poi.passes + "%", res: f.lists.res.passes + "%",
    points: Object.entries(f.lists).filter(([, l]) => l.point).map(([id, l]) => `${id} ${typeof l.point === "number" && l.point % 1 ? l.point.toFixed(1) : l.point}`).join(" ") });
  const rows = Object.entries(outs).map(([k, f]) => show(k, f));
  rows.push(show("avgRaw (fractional seats)", { ...outs.avg, lists: Object.fromEntries(Object.entries(outs.avg.lists).map(([id, l]) => [id, { ...l, point: outs.avg.rawSeats[id] ?? 0 }])) }));
  const combos = { "B2+K1": ["B2", "K1"], "v2+E": ["v2", "E"], "v2+avgNF": ["v2", "avgNF"], "v2+B2+K1": ["v2", "B2", "K1"], "v2+E+avgNF": ["v2", "E", "avgNF"], "v2+E+B2+K1": ["v2", "E", "B2", "K1"] };
  for (const [name, ks] of Object.entries(combos)) {
    if (!ks.every((k) => outs[k])) continue;
    const F = ks.map((k) => outs[k]);
    rows.push(show(`${name}: central, v2 noise`, ensemble(null, ks.map(() => 1), { mode: "central", outs: F, parties: partiesB, simulate: simulate("v2"), runs: RUNS, seed, blocPoint: "sum" })));
    rows.push(show(`${name}: central, G noise`, ensemble(null, ks.map(() => 1), { mode: "central", outs: F, parties: partiesB, simulate: simulate("v3"), runs: RUNS, seed, blocPoint: "median" })));
    rows.push(show(`${name}: mixture`, ensemble(null, ks.map(() => 1), { mode: "mixture", outs: F, parties: partiesB, runs: RUNS, seed, blocPoint: "median" })));
    rows.push(show(`${name}: seat average`, ensemble(null, ks.map(() => 1), { mode: "points", outs: F, parties: partiesB, blocPoint: "sum" })));
  }
  console.log(`2026, polls through Oct 22 (round2/polls-through-2026-10-22.json), ${RUNS} runs, seed ${seed}; E present: ${L.hasE}`);
  console.table(rows.map(({ points, ...r }) => r));
  for (const r of rows) console.log(r.variant.padEnd(34), r.points);
  console.log("central shares (%):"); for (const k of Object.keys(outs)) console.log(k.padEnd(8), Object.entries(outs[k].lists).map(([id, l]) => `${id} ${l.share?.toFixed?.(2)}`).join(" "));
  process.exit(0);
}

const RUNS = nums[0] || 10_000, SEEDS = [20261027, 1, 2, 3, 4].slice(0, nums[1] || 3);
const t0 = Date.now();
const B = elections.map((e) => L.backtest(e));
const parties = elections.map((e) => Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] })));
const NAMES = Object.keys(B[0].C);
// outs[name][seedIdx][electionIdx]
const outs = Object.fromEntries(NAMES.map((n) => [n, SEEDS.map((seed) => elections.map((e, i) => B[i].C[n]({ runs: RUNS, seed })))]));
const rawOf = (k) => outs[k].map((ss) => ss.map((f) => ({ ...f, lists: Object.fromEntries(Object.entries(f.lists).map(([id, l]) => [id, { ...l, point: f.rawSeats[id] ?? 0 }])) })));
outs.avgRaw = rawOf("avg"); outs.avgNFRaw = rawOf("avgNF");
console.log(`candidates computed: ${((Date.now() - t0) / 1000).toFixed(0)} s; ${RUNS} runs × seeds ${SEEDS.join(", ")}; E present: ${L.hasE}`);

const scoreAll = (fs_) => fs_.map((ss, si) => { const rng = mulberry(7 + si); return ss.map((f, i) => score(elections[i], f, rng)); });
const res = {};
const add = (name, fs_) => { res[name] = { s: scoreAll(fs_), fs: fs_ }; return res[name]; };
for (const n of [...NAMES, "avgRaw", "avgNFRaw"]) add(n, outs[n]);
const table = (title, names) => { console.log("\n" + title); console.table(names.filter((n) => res[n]).map((n) => fmt(n, summarise(res[n].s)))); };
table("Q1a. Single candidates", [...NAMES, "avgRaw", "avgNFRaw"]);

// ---- Q1b. Seat-point averages, equal weights, every subset of the point pool.
const POOL = ["v2", "w14", "avgRaw", "avgNFRaw", "B2", "K1", ...(L.hasE ? ["E"] : [])];
const ens = (ks, w, mode, extra = {}) => SEEDS.map((seed, si) => elections.map((e, i) => ensemble(null, w ?? ks.map(() => 1), { mode, outs: ks.map((k) => outs[k][si][i]), parties: parties[i], runs: RUNS, seed, ...extra })));
const subsets = [];
for (let m = 1; m < 1 << POOL.length; m++) { const ks = POOL.filter((_, j) => m & (1 << j)); if (ks.length >= 2) subsets.push(ks); }
const ptRows = subsets.map((ks) => {
  const fr = ens(ks, null, "points", { blocPoint: "sum" }), rd = fr.map((ss) => ss.map(roundPoints));
  const a = summarise(scoreAll(fr)), b = summarise(scoreAll(rd));
  return { ks, frac: a.listMAE, round: b.listMAE, wrongR: b.wrong, netR: b.netErr, blocR: b.blocErr, perFrac: a.perElection, perRound: b.perElection };
}).sort((x, y) => x.round - y.round);
console.log(`\nQ1b. Equal-weight seat-point averages over all ${subsets.length} subsets of [${POOL.join(", ")}]: list error with fractional points and rounded to whole seats (P(pass) ≥ 0.5, largest remainder to 120). Best 15 by rounded, then every pair with v2:`);
const pr = (r) => ({ subset: r.ks.join("+"), fracMAE: r.frac.toFixed(3), roundMAE: r.round.toFixed(3), wrong: r.wrongR, netErr: r.netR.toFixed(2), blocErr: r.blocR.toFixed(2), perElectionRounded: r.perRound });
console.table([...ptRows.slice(0, 15), ...ptRows.filter((r) => r.ks.length === 2 && r.ks.includes("v2"))].map(pr));
const nBeat = ptRows.filter((r) => r.round < 1.361 - 1e-9).length, nBeatF = ptRows.filter((r) => r.frac < 1.361 - 1e-9).length;
console.log(`subsets beating v2's 1.361: fractional ${nBeatF}/${subsets.length}, rounded ${nBeat}/${subsets.length}; best single in the pool: ${Math.min(...POOL.map((k) => summarise(res[k].s).listMAE)).toFixed(3)}`);

// ---- Q1c/Q2. Central-average + one simulation (v2 noise; G noise) and mixtures, curated combinations.
const COMBOS = [["v2", "w14"], ["v2", "avg"], ["v2", "avgNF"], ["v2", "B2"], ["v2", "K1"], ["B2", "K1"], ["v2", "B2", "K1"],
  ...(L.hasE ? [["v2", "E"], ["v2", "E", "avgNF"], ["v2", "E", "B2", "K1"], ["v2", "w14", "avgNF", "B2", "K1", "E"]] : [["v2", "w14", "avgNF", "B2", "K1"]])];
const centralRuns = (ks, noise, w = null) => SEEDS.map((seed, si) => elections.map((e, i) => ensemble(null, w ?? ks.map(() => 1), { mode: "central", outs: ks.map((k) => outs[k][si][i]), parties: parties[i], simulate: B[i].simulate(noise), runs: RUNS, seed, blocPoint: noise === "v3" ? "median" : "sum" })));
const names2 = [];
for (const ks of COMBOS) {
  const tag = ks.join("+");
  add(`${tag} | central, v2 noise`, centralRuns(ks, "v2")); names2.push(`${tag} | central, v2 noise`);
  add(`${tag} | central, G noise`, centralRuns(ks, "v3")); names2.push(`${tag} | central, G noise`);
  add(`${tag} | mixture`, ens(ks, null, "mixture", { blocPoint: "sum" })); names2.push(`${tag} | mixture`);
  add(`${tag} | seat avg (rounded)`, ens(ks, null, "points", { blocPoint: "sum" }).map((ss) => ss.map(roundPoints))); names2.push(`${tag} | seat avg (rounded)`);
}
table("Q1c/Q2. Equal-weight ensembles: central-average + one simulation (v2's noise, bloc point = sum; G's noise, bloc point = median), mixture of draws, rounded seat average. Singles for reference:", ["v2", "G", ...names2]);

// ---- Q1d. Stacking: weights fitted on earlier elections only, shrunk toward equal.
function simplex(k, step) { const out = []; const n = Math.round(1 / step); const rec = (pre, left, d) => { if (d === k - 1) { out.push([...pre, left * step]); return; } for (let j = 0; j <= left; j++) rec([...pre, j * step], left - j, d + 1); }; rec([], n, 0); return out; }
const pointErr = (ks, w, i, si = 0) => { const f = roundPoints(ensemble(null, w, { mode: "points", outs: ks.map((k) => outs[k][si][i]), parties: parties[i] })); return score(elections[i], f).listErr; };
function stack(ks, n0, objective = "round") {
  const grid = simplex(ks.length, ks.length > 4 ? 0.2 : 0.1), eq = ks.map(() => 1 / ks.length), W = [];
  for (let i = 0; i < elections.length; i++) {
    if (i === 0) { W.push(eq); continue; }
    let best = null, bv = Infinity;
    for (const w of grid) { let v = 0; for (let j = 0; j < i; j++) v += objective === "round" ? pointErr(ks, w, j) : score(elections[j], ensemble(null, w, { mode: "points", outs: ks.map((k) => outs[k][0][j]), parties: parties[j] })).listErr; if (v < bv - 1e-9) { bv = v; best = w; } }
    const a = i / (i + n0); W.push(best.map((x, j) => a * x + (1 - a) * eq[j]));
  }
  return W;
}
const stackRows = [];
const STACK_SETS = [["v2", "avgNF"], ["v2", "B2", "K1"], ...(L.hasE ? [["v2", "E"], ["v2", "E", "avgNF"], ["v2", "E", "B2", "K1"]] : [["v2", "w14", "avgNF"]])];
for (const ks of STACK_SETS) for (const n0 of [0, 3, 6]) {
  const W = stack(ks, n0);
  const pts = SEEDS.map((seed, si) => elections.map((e, i) => roundPoints(ensemble(null, W[i], { mode: "points", outs: ks.map((k) => outs[k][si][i]), parties: parties[i] }))));
  const cen = SEEDS.map((seed, si) => elections.map((e, i) => ensemble(null, W[i], { mode: "central", outs: ks.map((k) => outs[k][si][i]), parties: parties[i], simulate: B[i].simulate("v2"), runs: RUNS, seed, blocPoint: "sum" })));
  const nm = `${ks.join("+")} n0=${n0}`;
  add(`${nm} | stacked seat avg (rounded)`, pts); add(`${nm} | stacked central, v2 noise`, cen);
  stackRows.push({ set: nm, weightsByElection: W.map((w) => w.map((x) => x.toFixed(2)).join("/")).join("  ") });
}
console.log("\nQ1d. Stacking weights (fitted on earlier elections' rounded seat-average list error, simplex grid, shrunk toward equal with n0 pseudo-elections; 2015 = equal):");
console.table(stackRows);
table("Q1d. Stacked ensembles, leave-future-out:", ["v2", ...Object.keys(res).filter((n) => n.includes("stacked"))]);

// ---- Q1e. Leave-future-out subset selection: at each election, the equal-weight subset of the pool (singles included) with the lowest rounded error on the earlier elections.
{
  const cands = [...POOL.map((k) => [k]), ...subsets];
  const pick = [], fs_ = SEEDS.map(() => []);
  for (let i = 0; i < elections.length; i++) {
    let best = [["v2"]], bv = Infinity;
    if (i > 0) for (const ks of cands) { let v = 0; for (let j = 0; j < i; j++) v += ks.length === 1 ? score(elections[j], outs[ks[0]][0][j]).listErr : pointErr(ks, ks.map(() => 1), j); if (v < bv - 1e-9) { bv = v; best = [ks]; } }
    const ks = best[0]; pick.push(ks.join("+"));
    SEEDS.forEach((s, si) => fs_[si].push(ks.length === 1 ? outs[ks[0]][si][i] : roundPoints(ensemble(null, ks.map(() => 1), { mode: "points", outs: ks.map((k) => outs[k][si][i]), parties: parties[i] }))));
  }
  add("LFO subset selection (rounded seat avg)", fs_);
  console.log("\nQ1e. Leave-future-out subset selection picks (2015 defaults to v2):", pick.join(" | "));
  table("Q1e.", ["v2", "LFO subset selection (rounded seat avg)"]);
}

// ---- Q3. Diversity: correlations of the candidates' errors.
{
  const D = ["v2", "w14", "G", "avgRaw", "avgNFRaw", "B2", "K1", ...(L.hasE ? ["E"] : [])];
  const vec = (k, g) => res[k].s[0].flatMap((s) => Object.values(g(s)));
  const corr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
  const mat = (g, label) => { console.log(`\nQ3. ${label}`); console.table(D.map((a) => Object.fromEntries([["", a], ...D.map((b) => [b, corr(vec(a, g), vec(b, g)).toFixed(2)])]))); };
  mat((s) => s.signed, "Correlation of signed seat errors (point − result), 71 lists, seed 20261027");
  mat((s) => s.shareErr, "Correlation of signed central-share errors (central − result, points), 71 lists");
  console.log("\nQ3. Mean |point_a − point_b| per list (seats) and share of the 71 lists on which the two points differ:");
  console.table(D.map((a) => Object.fromEntries([["", a], ...D.map((b) => { const x = vec(a, (s) => s.signed), y = vec(b, (s) => s.signed); const d = x.map((v, i) => Math.abs(v - y[i])); return [b, `${(d.reduce((p, q) => p + q, 0) / d.length).toFixed(2)} (${Math.round(100 * d.filter((v) => v > 1e-9).length / d.length)}%)`]; })])));
  const pe = (k) => res[k].s[0].map((s) => s.listErr);
  console.log("\nQ3. Per-election list error by candidate, and its correlation with v2's across the six elections:");
  console.table(D.map((k) => ({ candidate: k, ...Object.fromEntries(elections.map((e, i) => [e.key, pe(k)[i].toFixed(2)])), corrWithV2: corr(pe(k), pe("v2")).toFixed(2) })));
}
console.log(`\ntotal ${((Date.now() - t0) / 1000).toFixed(0)} s`);
