/**
 * ROUND 2, AGENT D: a copy of scripts/forecast/model.mjs (version 2) with blackout options added. Under the
 * defaults below it reproduces model.mjs draw for draw (check: node scripts/forecast/round2/D/check.mjs).
 * Additions (all off by default):
 *   asOf          ignore polls published after this ISO date (to rebuild the field as it stood on any day)
 *   electionDate  ISO date of the vote; the blackout gap is electionDate − newest poll, in days
 *   trendDays     > 0: carry each list's linear trend over the last trendDays (pollster fixed effects) forward
 *                 by the blackout gap, times trendDamp
 *   shrinkDays/shrinkW  pull the final level toward the mean of each outlet's polls over the last shrinkDays
 *   rwListSdAt8   points per √day at an 8% share: per-list random-walk noise for the blackout gap
 *   rwBlocSd      seats per √day: extra common bloc swing for the blackout gap
 *   listSdScale / blocSdScale  direct inflation of v2's widths (the alternative to the random-walk terms)
 * Exported for the analysis scripts: fieldOf() (the field and each poll's shares as model.mjs builds them).
 *
 * The forecast model, version 2 (2026-10-24), as a pure function so forecast.mjs (the daily run) and the
 * backtest (scripts/forecast/backtest/) run the same code. Every step is a rule from the record of the
 * elections under the 3.25% threshold; docs/research/polls-method/2026-10-23-forecast-algorithm.md has the
 * reasoning and the round-one research memos (docs/research/polls-method/round1/) the evidence.
 *
 *   forecast({ polls, config, parties, agreements, cal, opts }) -> { inputs, parameters, blocs, majority, ..., lists }
 *
 * `opts` switches each component so the backtest can judge it: see DEFAULTS.
 */
export const KNESSET = 120, THRESHOLD = 0.0325, MAJ = 61;

export const DEFAULTS = {
  runs: 50_000, seed: 20261027,
  windowDays: 7,            // one latest poll per outlet within this many days of the newest
  excludeChecks: true,      // the Filber-firm outlets (config.withoutVariant.pollsters) are checks, not inputs
  firmWeights: true,        // two outlets polled by one firm share that firm's weight
  shares: "dhondt",         // "dhondt": threshold-aware D'Hondt midpoint; "hare": seats/120 (version 1)
  priors: true,             // cal.listPriors, vote-share points by list
  leanNetOfShas: false,     // the common lean net of Shas's own miss: tested and rejected (backtest/v2.mjs: it turns the lean negative)
  leanHalfLife: 2,
  blocSd: null,             // seats; null = max(3, 2 × historical residual)
  listSdAt8: null,          // points at an 8% share; null = from cal.perListError
  listSdFloor: true,        // cal.smallList.sdFloorPoints for small lists
  zeroSum: true,            // per-list noise sums to zero inside each bloc (substitution, not bloc movement)
  arabSwing: true,          // a turnout swing of the Arab lists' own, cal.arabSwing.sdSeats
  consolidateSd: 1.5,       // seats, moved between a bloc's largest list and its partners
  fringe: true,             // cal.fringe.share of the vote goes to lists the polls do not report
  withdrawn: true,          // cal.withdrawn.lists are dropped, their share folded into the fringe
  point: "median",          // "median": per-list median reconciled to 120; "central": allocate(central)
  lean: null,               // seats; null = from the calibration record
  includeAll: false,        // sensitivity: every current poll, checks included
  // Round 2, agent D (blackout); all off by default.
  asOf: null, electionDate: null,
  trendDays: 0, trendDamp: 1,
  shrinkDays: 0, shrinkW: 0,
  rwListSdAt8: 0, rwBlocSd: 0, blackoutDays: null,
  blackoutBaseline: 0,             // (D) days of blackout already inside the calibrated widths; the walk runs only beyond it
  listSdScale: 1, blocSdScale: 1,
  ageHalfLife: 0, fridayBoost: 0,  // (D) within the 7-day field: weight × 2^(−age/halfLife); × fridayBoost for a poll dated Friday
  quantiles: false,                // (D) add each list's and bloc's 10/25/75/90% quantiles to the output
};

/** A printed percentage: "3.1%", "<1%" (half of 1%), "~2%". Null when unparseable. */
export const pctOf = (s) => { if (s == null) return null; const x = parseFloat(String(s).replace(/[<>~%\s]/g, "")); return Number.isFinite(x) ? (String(s).includes("<") ? x / 2 : x) / 100 : null; };

export function forecast({ polls, config, parties, agreements, cal, opts = {} }) {
  const o = { ...DEFAULTS, ...opts };
  const withdrawn = new Set(o.withdrawn ? (cal.withdrawn?.lists ?? []).map((w) => w.id) : []);
  const ids = parties.map((p) => p.id).filter((id) => !withdrawn.has(id));
  const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
  const blocs = ["net", "opp", "mid", "arab"];
  const FRINGE = o.fringe ? cal.fringe.share : 0;

  // 1. The field: one latest poll per outlet within the window; the checks left out.
  const campaign = polls.filter((p) => p.kind !== "exit" && config.pollsters.includes(p.pollster) && (!o.asOf || p.published <= o.asOf)).sort((a, b) => b.published.localeCompare(a.published));
  const cutoff = Date.parse(campaign[0].published) - o.windowDays * 864e5;
  const seen = new Set(), current = [];
  for (const p of campaign) { if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue; seen.add(p.pollster); current.push(p); }
  const isCheck = (p) => config.withoutVariant.pollsters.includes(p.pollster);
  const field = o.includeAll || !o.excludeChecks ? current : current.filter((p) => !isCheck(p));
  const checks = current.filter(isCheck);
  // Weight: √n (600 when unstated), shared between outlets polled by the same firm.
  const firmOf = (p) => (p.firm ?? p.pollster).toLowerCase();
  const firmCount = {}; for (const p of field) firmCount[firmOf(p)] = (firmCount[firmOf(p)] ?? 0) + 1;
  const ageW = (p) => (o.ageHalfLife ? 2 ** (-(Date.parse(campaign[0].published) - Date.parse(p.published)) / 864e5 / o.ageHalfLife) : 1) * (o.fridayBoost && new Date(p.published + "T12:00:00Z").getUTCDay() === 5 ? o.fridayBoost : 1);
  const weight = (p) => Math.sqrt(p.n && p.n > 0 ? p.n : 600) / (o.firmWeights ? firmCount[firmOf(p)] : 1) * ageW(p);

  // 2. Seats back to vote shares. Under Bader-Ofer (D'Hondt) a list with k seats holds a share in
  //    [kλ, (k+1)λ) for the poll's divisor λ, and at least the threshold since it passed: take the midpoint,
  //    with λ solved so the passing lists add to the vote that passed (round1/F-review.md F1). A list the
  //    pollster put below keeps the percentage it printed; with none printed, the outlet's last printed figure
  //    for that list in the window, else the median the other current polls printed, else 2%. A list the poll
  //    leaves out is imputed at the other polls' median share.
  const printedBy = (p, id) => { for (const q of campaign) if (q.pollster === p.pollster && q.published <= p.published && Date.parse(q.published) >= cutoff) { const r = q.results[id]; if (r && (r.belowThreshold || r.seats === 0) && pctOf(r.pct) != null) return pctOf(r.pct); } return null; };
  const printedByOthers = (id) => { const xs = field.map((q) => q.results[id]).filter((r) => r && (r.belowThreshold || r.seats === 0)).map((r) => pctOf(r.pct)).filter((x) => x != null).sort((a, b) => a - b); return xs.length ? xs[xs.length >> 1] : null; };
  function shares(p) {
    const s = {}; let below = 0; const pass = [];
    for (const [id, r] of Object.entries(p.results)) {
      if (!ids.includes(id)) { if (r.belowThreshold || r.seats === 0) below += pctOf(r.pct) ?? 0; continue; } // a withdrawn list's residual stays in the denominator
      if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBy(p, id) ?? printedByOthers(id) ?? 0.02; below += s[id]; } else pass.push([id, r.seats]);
    }
    for (const c of p.combined) pass.push([c.parties.filter((x) => ids.includes(x)).join("|"), c.seats]);
    const P = 1 - below;
    if (o.shares === "hare") { for (const [id, k] of pass) { const v = (k / KNESSET) * P; if (id.includes("|")) for (const x of id.split("|")) s[x] = v / id.split("|").length; else s[id] = v; } return s; }
    let lam = P / pass.reduce((a, [, k]) => a + k + 0.5, 0);
    const at = (k) => (Math.max(THRESHOLD, k * lam) + (k + 1) * lam) / 2;
    for (let it = 0; it < 60; it++) lam *= P / pass.reduce((a, [, k]) => a + at(k), 0);
    for (const [id, k] of pass) { const v = at(k); if (id.includes("|")) { const xs = id.split("|"); for (const x of xs) s[x] = v / xs.length; } else s[id] = v; }
    return s;
  }
  // 3. The field mean, weighted; a list a poll omits takes the other polls' median; the total is 1 − fringe.
  const per = field.map((p) => ({ w: weight(p), s: shares(p) }));
  for (const id of ids) { const xs = per.map((x) => x.s[id]).filter((v) => v != null).sort((a, b) => a - b); const med = xs.length ? xs[xs.length >> 1] : 0; for (const x of per) if (x.s[id] == null) x.s[id] = med; }
  const base = {}; for (const id of ids) { let a = 0, w = 0; for (const x of per) { a += x.w * x.s[id]; w += x.w; } base[id] = w ? a / w : 0; }
  const renorm = (v, to = 1 - FRINGE) => { const t = Object.values(v).reduce((a, b) => a + b, 0); for (const id in v) v[id] *= to / t; return v; };
  renorm(base);
  for (const [id, v] of Object.entries(base)) if (!Number.isFinite(v)) throw new Error(`forecast: non-finite share for ${id}; check the pct strings`);
  if (o.returnField) return { campaign, field, per, base: { ...base }, shares, weight, isCheck, ids, bloc };

  // 3b. (Round 2, D) The blackout. The gap is the days from the newest poll to the vote.
  const gapDays = o.blackoutDays ?? (o.electionDate ? Math.max(0, (Date.parse(o.electionDate) - Date.parse(campaign[0].published)) / 864e5) : 0);
  const inputs0 = campaign.filter((p) => !isCheck(p) || o.includeAll || !o.excludeChecks);
  const windowPolls = (days) => inputs0.filter((p) => Date.parse(p.published) >= Date.parse(campaign[0].published) - days * 864e5).map((p) => ({ p, t: (Date.parse(p.published) - Date.parse(campaign[0].published)) / 864e5, s: shares(p) }));
  const fill = (rows) => { for (const id of ids) { const xs = rows.map((x) => x.s[id]).filter((v) => v != null).sort((a, b) => a - b); const med = xs.length ? xs[xs.length >> 1] : 0; for (const x of rows) if (x.s[id] == null) x.s[id] = med; } return rows; };
  if (o.trendDays > 0 && gapDays > 0) {
    // Slope per day with pollster fixed effects (within-outlet changes only, so a change in which outlets
    // published cannot pose as a trend); outlets with one poll in the window drop out.
    const rows = fill(windowPolls(o.trendDays)), by = {};
    for (const r of rows) (by[r.p.pollster] ??= []).push(r);
    for (const id of ids) {
      let sxy = 0, sxx = 0;
      for (const g of Object.values(by)) { if (g.length < 2) continue; const tb = g.reduce((a, r) => a + r.t, 0) / g.length, yb = g.reduce((a, r) => a + r.s[id], 0) / g.length; for (const r of g) { sxy += (r.t - tb) * (r.s[id] - yb); sxx += (r.t - tb) ** 2; } }
      if (sxx > 0) base[id] = Math.max(0.002, base[id] + o.trendDamp * (sxy / sxx) * gapDays);
    }
    renorm(base);
  }
  if (o.shrinkDays > 0 && o.shrinkW > 0) {
    // Each outlet's mean over the window, then the field-weighted mean of those (√600 each, firm-shared as above).
    const rows = fill(windowPolls(o.shrinkDays)), by = {};
    for (const r of rows) (by[r.p.pollster] ??= []).push(r);
    const groups = Object.values(by), fc = {}; for (const g of groups) fc[firmOf(g[0].p)] = (fc[firmOf(g[0].p)] ?? 0) + 1;
    const wOf = (g) => 1 / (o.firmWeights ? fc[firmOf(g[0].p)] : 1);
    const mean = {}; for (const id of ids) { let a = 0, w = 0; for (const g of groups) { a += wOf(g) * g.reduce((x, r) => x + r.s[id], 0) / g.length; w += wOf(g); } mean[id] = a / w; }
    renorm(mean);
    for (const id of ids) base[id] = (1 - o.shrinkW) * base[id] + o.shrinkW * mean[id];
    renorm(base);
  }

  // 4. Priors by list: the classes the final-week polls have missed in one direction since 2013.
  const priors = o.priors ? cal.listPriors ?? {} : {};
  for (const [id, pts] of Object.entries(priors)) if (typeof pts === "number" && id in base) base[id] = Math.max(0.002, base[id] + pts / 100);
  renorm(base);

  // 5. The lean: the field's miss on the Netanyahu bloc, recency-weighted, net of Shas's own miss when the Shas
  //    prior is in (the same miss must not count twice). The residual after the lean sets the width's floor.
  const errs = cal.elections.map((e, i, a) => ({ err: e.result - e.field - (o.leanNetOfShas && o.priors ? e.shasError ?? 0 : 0), w: 2 ** (-(a.length - 1 - i) / o.leanHalfLife) }));
  const W = errs.reduce((s, e) => s + e.w, 0);
  const leanCal = W ? errs.reduce((s, e) => s + e.w * e.err, 0) / W : 0; // no record yet (the backtest's 2015): no lean
  const lean = o.lean ?? leanCal;
  const resid = W ? Math.sqrt(errs.reduce((s, e) => s + e.w * (e.err - leanCal) ** 2, 0) / W) : 0;
  const blocSd0 = (o.blocSd ?? Math.max(3, 2 * resid)) * o.blocSdScale;
  const blocSd = o.rwBlocSd ? Math.sqrt(blocSd0 ** 2 + o.rwBlocSd ** 2 * Math.max(0, gapDays - o.blackoutBaseline)) : blocSd0;
  // 6. Per-list noise: theMadad's 1.16 mean absolute seats at 0-14 days (2022) → sd in points at 8%, scaled by
  //    √share, with a floor for small lists (their misses run about 1.0 point near the threshold).
  const listSd = (o.listSdAt8 ?? (cal.perListError.meanAbsSeats * 1.25) / KNESSET / Math.sqrt(0.1 / 0.08) * 100) / 100 * o.listSdScale;
  const rwDays = Math.max(0, gapDays - o.blackoutBaseline);
  const rwVar = (o.rwListSdAt8 / 100) ** 2 * rwDays; // per-list blackout variance at an 8% share
  const floor = o.listSdFloor ? cal.smallList.sdFloorPoints / 100 : 0;
  const consolidateSd = o.consolidateSd / KNESSET;
  const arabSd = o.arabSwing ? cal.arabSwing.sdSeats / KNESSET : 0;

  // 7. Bader-Ofer: whole quotas, remainders by D'Hondt with a surplus pair as one list (s. 81); the threshold is
  //    3.25% of the whole vote, the fringe included.
  const pairs = agreements.map((a) => a.filter((x) => ids.includes(x))).filter((a) => a.length === 2);
  function allocate(votes, force = null) {
    const total = ids.reduce((a, k) => a + Math.max(0, votes[k] ?? 0), 0) + FRINGE;
    const pass = ids.filter((k) => (force ? force[k] : (votes[k] ?? 0) >= THRESHOLD * total));
    const paired = new Map(); for (const [a, b] of pairs) if (pass.includes(a) && pass.includes(b)) { paired.set(a, a + "+" + b); paired.set(b, a + "+" + b); }
    const units = new Map(); for (const k of pass) { const key = paired.get(k) ?? k; units.set(key, (units.get(key) ?? 0) + Math.max(votes[k], THRESHOLD * total)); }
    const dh = (m, n) => { const s = Object.fromEntries([...m.keys()].map((k) => [k, 0])); for (let i = 0; i < n; i++) { let best, bv = -1; for (const [k, v] of m) { const q = v / (s[k] + 1); if (q > bv) { bv = q; best = k; } } s[best]++; } return s; };
    const out = {}; for (const [key, n] of Object.entries(dh(units, KNESSET))) { if (key.includes("+")) { const [a, b] = key.split("+"); Object.assign(out, dh(new Map([[a, votes[a]], [b, votes[b]]]), n)); } else out[key] = n; }
    return out;
  }

  // 8. The simulation.
  let seed = o.seed; const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const randn = () => { const u = rand() || 1e-12, v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const of = (b) => ids.filter((id) => bloc[id] === b && id in base);
  const members = Object.fromEntries(blocs.map((b) => [b, of(b)]));
  const zionist = [...members.net, ...members.opp];
  const largest = Object.fromEntries(blocs.map((b) => [b, [...members[b]].sort((x, y) => base[y] - base[x])[0]]));
  const central = { ...base }; { const ns = members.net.reduce((a, id) => a + base[id], 0); const sw = lean / KNESSET; for (const id of ids) central[id] *= bloc[id] === "net" ? 1 + sw / ns : 1 - sw / (1 - FRINGE - ns); }
  const seatRuns = Object.fromEntries(ids.map((id) => [id, new Int8Array(o.runs)])), blocRuns = Object.fromEntries(blocs.map((b) => [b, new Int8Array(o.runs)]));
  let net61 = 0, opp61 = 0, oppArab61 = 0, netLarger = 0; const first = {};
  for (let i = 0; i < o.runs; i++) {
    const v = { ...base };
    const netShare = members.net.reduce((a, id) => a + v[id], 0);
    const swing = (lean + randn() * blocSd) / KNESSET;
    for (const id of ids) v[id] *= bloc[id] === "net" ? 1 + swing / netShare : 1 - swing / (1 - FRINGE - netShare);
    for (const b of ["net", "opp"]) { const c = randn() * consolidateSd; const rest = members[b].filter((id) => id !== largest[b]); const tot = rest.reduce((a, id) => a + v[id], 0); if (tot > 0) { for (const id of rest) v[id] -= c * v[id] / tot; v[largest[b]] += c; } }
    const e = {}; for (const id of ids) e[id] = randn() * (rwVar ? Math.sqrt(Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08)) ** 2 + rwVar * Math.max(v[id], 0.01) / 0.08) : Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08)));
    if (o.zeroSum) {
      for (const b of ["net", "opp", "arab"]) { const m = members[b], tot = m.reduce((a, id) => a + v[id], 0), se = m.reduce((a, id) => a + e[id], 0); if (tot > 0) for (const id of m) e[id] -= se * v[id] / tot; }
      const midE = members.mid.reduce((a, id) => a + e[id], 0), zt = zionist.reduce((a, id) => a + v[id], 0); for (const id of zionist) e[id] -= midE * v[id] / zt;
    }
    if (arabSd && members.arab.length) { const ar = randn() * arabSd, at = members.arab.reduce((a, id) => a + v[id], 0), zt = zionist.reduce((a, id) => a + v[id], 0); for (const id of members.arab) e[id] += ar * v[id] / at; for (const id of zionist) e[id] -= ar * v[id] / zt; }
    for (const id of ids) v[id] = Math.max(0, v[id] + e[id]);
    const s = allocate(v); const t = { net: 0, opp: 0, mid: 0, arab: 0 };
    for (const id of ids) { const n = s[id] ?? 0; seatRuns[id][i] = n; t[bloc[id]] += n; }
    for (const b of blocs) blocRuns[b][i] = t[b];
    if (t.net >= MAJ) net61++; if (t.opp >= MAJ) opp61++; if (t.opp + t.arab + t.mid >= MAJ) oppArab61++; if (t.net > t.opp) netLarger++;
    let top = ids[0]; for (const id of ids) if ((s[id] ?? 0) > (s[top] ?? 0)) top = id; first[top] = (first[top] ?? 0) + 1;
  }
  const sorted = (xs) => Int8Array.from(xs).sort();
  const q = (xs, f) => xs[Math.min(xs.length - 1, Math.floor(f * xs.length))];
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const r1 = (x) => Math.round(x * 10) / 10, pct = (x) => Math.round((x / o.runs) * 100);
  const sortedSeats = Object.fromEntries(ids.map((id) => [id, sorted(seatRuns[id])])), sortedBlocs = Object.fromEntries(blocs.map((b) => [b, sorted(blocRuns[b])]));
  const passRate = Object.fromEntries(ids.map((id) => [id, seatRuns[id].reduce((a, n) => a + (n > 0 ? 1 : 0), 0) / o.runs]));

  // 9. The central seats. "median": each list's median seat count (the point that minimises absolute error and
  //    always agrees with the threshold call), reconciled to 120 by largest remainder against the simulated
  //    means among the lists that pass in 95% of runs or more. "central": the allocation of the shifted shares.
  let point;
  if (o.point === "central") point = allocate(central);
  else {
    point = Object.fromEntries(ids.map((id) => [id, q(sortedSeats[id], 0.5)]));
    const safe = ids.filter((id) => passRate[id] >= 0.95);
    for (let guard = 0; guard < 40; guard++) {
      const diff = KNESSET - ids.reduce((a, id) => a + point[id], 0); if (!diff) break;
      const pick = safe.map((id) => ({ id, gap: mean(seatRuns[id]) - point[id] })).sort((a, b) => (diff > 0 ? b.gap - a.gap : a.gap - b.gap))[0];
      point[pick.id] += Math.sign(diff);
    }
  }
  const lists = Object.fromEntries(ids.map((id) => [id, { share: Math.round(central[id] * 10000) / 100, prior: priors[id] ?? 0, point: point[id] ?? 0, mean: r1(mean(seatRuns[id])), lo: q(sortedSeats[id], 0.05), hi: q(sortedSeats[id], 0.95), passes: Math.round(passRate[id] * 1000) / 10, call: passRate[id] >= 0.5 }]));
  if (o.quantiles) for (const id of ids) lists[id].qs = [0.1, 0.25, 0.75, 0.9].map((f) => q(sortedSeats[id], f));
  const blocOut = Object.fromEntries(blocs.map((b) => [b, { ...(o.quantiles ? { qs: [0.1, 0.25, 0.75, 0.9].map((f) => q(sortedBlocs[b], f)) } : {}), point: members[b].reduce((a, id) => a + (point[id] ?? 0), 0), median: q(sortedBlocs[b], 0.5), mean: r1(mean(blocRuns[b])), lo: q(sortedBlocs[b], 0.05), hi: q(sortedBlocs[b], 0.95) }]));
  return {
    inputs: { field: field.map((p) => ({ id: p.id, pollster: p.pollster, firm: p.firm, published: p.published, n: p.n, weight: r1(weight(p)) })), checks: checks.map((p) => ({ id: p.id, pollster: p.pollster, published: p.published })), agreements: pairs, withdrawn: [...withdrawn] },
    parameters: { version: "2-D", gapDays, trendDays: o.trendDays, shrinkDays: o.shrinkDays, shrinkW: o.shrinkW, rwListSdAt8: o.rwListSdAt8, rwBlocSd: o.rwBlocSd, windowDays: o.windowDays, fieldOnly: !(o.includeAll || !o.excludeChecks), firmWeights: o.firmWeights, sharesMethod: o.shares, listPriors: priors, leanSeats: r1(lean), leanNetOfShas: !!(o.leanNetOfShas && o.priors), historicalResidualSeats: r1(resid), blocSdSeats: r1(blocSd), listSdPointsAt8pct: r1(listSd * 1000) / 10, listSdFloorPoints: r1(floor * 100), zeroSumWithinBloc: o.zeroSum, arabSwingSdSeats: r1(arabSd * KNESSET), consolidateSdSeats: o.consolidateSd, fringeShare: r1(FRINGE * 1000) / 10, pointRule: o.point },
    blocs: blocOut,
    majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
    netLargerThanOpp: pct(netLarger),
    largestList: Object.fromEntries(Object.entries(first).map(([k, v]) => [k, pct(v)]).filter(([, v]) => v > 0)),
    lists,
    runs: o.runs, seed: o.seed,
  };
}
