/**
 * Round 2, agent F: ensembles of forecast models (docs/research/polls-method/round2/F-ensemble.md).
 *
 *   ensemble(candidates, weights, { mode, parties, simulate, runs, seed, blocPoint }) -> model.mjs's output shape
 *
 * A candidate is a function `(o) => forecast` returning model.mjs's output shape, called with
 * `o = { runs, seed }`. Modes:
 *   "central"  the weighted mean of the candidates' central vote shares (`lists[id].share`), renormalised, then ONE
 *              simulation around it by `simulate(central, { runs, seed })` (a model run with that central forced in,
 *              no second lean or prior: see `loadModel(..., { baseOverride: true })`). Keeps one noise model's width.
 *   "mixture"  the candidates' Monte Carlo draws pooled, candidate k contributing round(w_k · runs) draws. Needs
 *              each candidate's raw draws (`_draws: { seatRuns, blocRuns }`; `loadModel(..., { draws: true })`).
 *   "points"   the weighted mean of the candidates' list points (fractional seats) and of their probabilities; no
 *              simulation. The yardstick view of "averaging the seat points".
 * `summariseDraws` turns pooled draws into the output shape with model.mjs's step-9 rules (median point reconciled to
 * 120 against the means of lists passing in 95% of runs; 5%/95% intervals; pass rate; majority shares).
 *
 * `loadModel(source, { draws, baseOverride })` imports a model module's source text with two small patches (the
 * source is not changed on disk): `draws` returns the per-run seat arrays as `_draws`, `baseOverride` lets
 * `opts.baseOverride` (shares, fractions) replace the field+priors before the simulation. Each patch asserts its
 * anchor exists once, so a changed model fails loudly rather than silently.
 */
export const KNESSET = 120, MAJ = 61;
const BLOCS = ["net", "opp", "mid", "arab"];

function patchOnce(src, find, repl, what) {
  const i = src.indexOf(find);
  if (i < 0 || src.indexOf(find, i + 1) >= 0) throw new Error(`loadModel: anchor for ${what} not found exactly once`);
  return src.slice(0, i) + repl + src.slice(i + find.length);
}
export async function loadModel(source, { draws = true, baseOverride = false } = {}) {
  let s = source;
  if (draws) s = patchOnce(s, "runs: o.runs, seed: o.seed,", "runs: o.runs, seed: o.seed, _draws: { seatRuns, blocRuns },", "draws");
  if (baseOverride) {
    const a = "  const of = (b) => ids.filter((id) => bloc[id] === b && id in base);";
    s = patchOnce(s, a, "  if (o.baseOverride) { for (const id of ids) base[id] = Math.max(0, o.baseOverride[id] ?? 0); }\n" + a, "baseOverride");
  }
  return import("data:text/javascript;base64," + Buffer.from(s).toString("base64"));
}

const q = (xs, f) => xs[Math.min(xs.length - 1, Math.floor(f * xs.length))];
const r1 = (x) => Math.round(x * 10) / 10;

/** Pooled draws -> model.mjs's output shape. seatRuns {id: Int8Array}, blocRuns {bloc: Int8Array} of equal length. */
export function summariseDraws({ seatRuns, blocRuns, parties, central = {}, priors = {}, blocPoint = "median", extra = {} }) {
  const ids = Object.keys(seatRuns), R = seatRuns[ids[0]].length;
  const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
  const members = Object.fromEntries(BLOCS.map((b) => [b, ids.filter((id) => bloc[id] === b)]));
  const sorted = (xs) => Int8Array.from(xs).sort();
  const mean = (xs) => { let a = 0; for (const x of xs) a += x; return a / xs.length; };
  const sS = Object.fromEntries(ids.map((id) => [id, sorted(seatRuns[id])])), sB = Object.fromEntries(BLOCS.map((b) => [b, sorted(blocRuns[b])]));
  const passRate = Object.fromEntries(ids.map((id) => [id, seatRuns[id].reduce((a, n) => a + (n > 0 ? 1 : 0), 0) / R]));
  const point = Object.fromEntries(ids.map((id) => [id, q(sS[id], 0.5)]));
  const safe = ids.filter((id) => passRate[id] >= 0.95);
  for (let guard = 0; guard < 40 && safe.length; guard++) {
    const diff = KNESSET - ids.reduce((a, id) => a + point[id], 0); if (!diff) break;
    const pick = safe.map((id) => ({ id, gap: mean(seatRuns[id]) - point[id] })).sort((a, b) => (diff > 0 ? b.gap - a.gap : a.gap - b.gap))[0];
    point[pick.id] += Math.sign(diff);
  }
  let net61 = 0, opp61 = 0, oppArab61 = 0, netLarger = 0; const first = {};
  for (let i = 0; i < R; i++) {
    const n = blocRuns.net[i], o = blocRuns.opp[i];
    if (n >= MAJ) net61++; if (o >= MAJ) opp61++; if (o + blocRuns.arab[i] + blocRuns.mid[i] >= MAJ) oppArab61++; if (n > o) netLarger++;
    let top = ids[0]; for (const id of ids) if (seatRuns[id][i] > seatRuns[top][i]) top = id; first[top] = (first[top] ?? 0) + 1;
  }
  const pct = (x) => Math.round((x / R) * 100);
  const lists = Object.fromEntries(ids.map((id) => [id, { share: central[id] ?? null, prior: priors[id] ?? 0, point: point[id], mean: r1(mean(seatRuns[id])), lo: q(sS[id], 0.05), hi: q(sS[id], 0.95), passes: Math.round(passRate[id] * 1000) / 10, call: passRate[id] >= 0.5 }]));
  const blocs = Object.fromEntries(BLOCS.map((b) => [b, { point: blocPoint === "median" ? q(sB[b], 0.5) : members[b].reduce((a, id) => a + point[id], 0), median: q(sB[b], 0.5), mean: r1(mean(blocRuns[b])), lo: q(sB[b], 0.05), hi: q(sB[b], 0.95) }]));
  return {
    ...extra, blocs,
    majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
    netLargerThanOpp: pct(netLarger),
    largestList: Object.fromEntries(Object.entries(first).map(([k, v]) => [k, pct(v)]).filter(([, v]) => v > 0)),
    lists, runs: R,
    raw: { net61: net61 / R, opp61: opp61 / R, passRate },
    _draws: { seatRuns, blocRuns },
  };
}

/** Normalise weights to sum 1 (negative weights are not allowed). */
const norm = (w) => { const t = w.reduce((a, b) => a + Math.max(0, b), 0); return w.map((x) => Math.max(0, x) / t); };

/** The weighted mean of central shares (%, as `lists[id].share`), renormalised to the candidates' mean total. */
export function averageCentral(outs, w) {
  const ids = [...new Set(outs.flatMap((f) => Object.keys(f.lists)))];
  const c = Object.fromEntries(ids.map((id) => [id, outs.reduce((a, f, k) => a + w[k] * (f.lists[id]?.share ?? 0), 0)]));
  const target = outs.reduce((a, f, k) => a + w[k] * Object.values(f.lists).reduce((s, l) => s + (l.share ?? 0), 0), 0), t = Object.values(c).reduce((a, b) => a + b, 0);
  for (const id of ids) c[id] *= target / t;
  return c;
}

export function ensemble(candidates, weights = null, { mode = "central", parties, simulate, runs = 10_000, seed = 20261027, blocPoint = "median", outs = null } = {}) {
  const w = norm(weights ?? candidates.map(() => 1));
  const F = outs ?? candidates.map((fn) => fn({ runs, seed }));
  const meta = { inputs: { ensemble: { mode, weights: w.map((x) => Math.round(x * 1000) / 1000) } }, parameters: { version: "ensemble", mode, blocPoint }, seed };
  if (mode === "central") {
    if (!simulate) throw new Error("ensemble: mode 'central' needs simulate(central, { runs, seed })");
    const central = averageCentral(F, w);
    const out = simulate(central, { runs, seed, blocPoint });
    return { ...out, ...meta, inputs: { ...(out.inputs ?? {}), ...meta.inputs }, parameters: { ...(out.parameters ?? {}), ...meta.parameters } };
  }
  if (mode === "mixture") {
    const ids = Object.keys(F[0].lists);
    const take = w.map((x) => Math.round(x * runs)), R = take.reduce((a, b) => a + b, 0);
    const seatRuns = Object.fromEntries(ids.map((id) => [id, new Int8Array(R)])), blocRuns = Object.fromEntries(BLOCS.map((b) => [b, new Int8Array(R)]));
    let at = 0;
    F.forEach((f, k) => {
      if (!take[k]) return;
      if (!f._draws) throw new Error("ensemble: mode 'mixture' needs every candidate's _draws (loadModel(..., { draws: true }))");
      const n = Math.min(take[k], f._draws.seatRuns[ids[0]].length);
      for (const id of ids) seatRuns[id].set(f._draws.seatRuns[id]?.subarray(0, n) ?? new Int8Array(n), at);
      for (const b of BLOCS) blocRuns[b].set(f._draws.blocRuns[b].subarray(0, n), at);
      at += n;
    });
    const trim = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.subarray(0, at)]));
    return summariseDraws({ seatRuns: trim(seatRuns), blocRuns: trim(blocRuns), parties, central: averageCentral(F, w), blocPoint, extra: meta });
  }
  if (mode === "points") {
    const ids = Object.keys(F[0].lists), avg = (g) => F.reduce((a, f, k) => a + w[k] * g(f), 0);
    const lists = Object.fromEntries(ids.map((id) => [id, { share: r1(avg((f) => f.lists[id]?.share ?? 0) * 10) / 10, point: avg((f) => f.lists[id]?.point ?? 0), mean: r1(avg((f) => f.lists[id]?.mean ?? 0)), lo: avg((f) => f.lists[id]?.lo ?? 0), hi: avg((f) => f.lists[id]?.hi ?? 0), passes: avg((f) => f.lists[id]?.passes ?? 0), call: avg((f) => f.lists[id]?.passes ?? 0) >= 50 }]));
    const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
    const blocs = Object.fromEntries(BLOCS.map((b) => [b, { point: blocPoint === "median" ? avg((f) => f.blocs[b].median) : ids.filter((id) => bloc[id] === b).reduce((a, id) => a + lists[id].point, 0), median: avg((f) => f.blocs[b].median), mean: avg((f) => f.blocs[b].mean), lo: avg((f) => f.blocs[b].lo), hi: avg((f) => f.blocs[b].hi) }]));
    const net = avg((f) => f.raw?.net61 ?? f.majority.net / 100), opp = avg((f) => f.raw?.opp61 ?? f.majority.oppZionist / 100);
    return { ...meta, blocs, majority: { net: Math.round(net * 100), oppZionist: Math.round(opp * 100), neither: 100 - Math.round(net * 100) - Math.round(opp * 100) }, lists, raw: { net61: net, opp61: opp, passRate: Object.fromEntries(ids.map((id) => [id, lists[id].passes / 100])) }, runs };
  }
  throw new Error(`ensemble: unknown mode ${mode}`);
}
