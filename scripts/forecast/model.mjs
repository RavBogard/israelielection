/**
 * The forecast model, version 3 (2026-10-24), as a pure function so forecast.mjs (the daily run) and the
 * backtest (scripts/forecast/backtest/) run the same code. Every step is a rule from the record of the
 * elections under the 3.25% threshold; docs/research/polls-method/2026-10-23-forecast-algorithm.md has the
 * reasoning, the round-one memos (docs/research/polls-method/round1/) the evidence for version 2 and the
 * round-two memos (round2/) the evidence for what version 3 changed: a Student-t bloc swing scaled by the
 * record's own residual (G), the bloc point as the bloc median (G), an Arab-sector turnout term in place of the
 * Joint List prior and the Arab swing (B), the unprinted-below fallback at 2.5% (C), the fringe at 1.8% (H).
 * Version 2 is reproduced by `opts.v2` (see DEFAULTS).
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
  blocSd: null,             // seats; null = max(3, 2 × historical residual) (version 2; used when swing is "normal")
  swing: "t",               // "t": lean + max(swingFloor, resid·√(1+1/n)) · t(max(swingDfMin, n−1)) (round2/G); "normal": lean + N(0, blocSd) (version 2)
  swingFloor: 1.5,          // seats
  swingDfMin: 3,
  blocPoint: "median",      // "median": the bloc point is the median of the simulated bloc total (round2/G); "sum": the sum of the list points (version 2)
  sectorTurnout: true,      // cal.sectorTurnout.sectors: a sector's lists scaled together by its turnout index, replacing the lists' priors and the Arab swing (round2/B)
  sectorSdLog: null,        // sensitivity: override every sector's sdLog
  keepRuns: false,          // return the per-run seat arrays (the backtest's calibration scores)
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
};
/** Version 2's rules, for the record and the backtest. */
export const V2 = { swing: "normal", blocPoint: "sum", sectorTurnout: false, unprintedBelow: 0.02, fringe: 0.015 };

/** A printed percentage: "3.1%", "<1%" (half of 1%), "~2%". Null when unparseable. */
export const pctOf = (s) => { if (s == null) return null; const x = parseFloat(String(s).replace(/[<>~%\s]/g, "")); return Number.isFinite(x) ? (String(s).includes("<") ? x / 2 : x) / 100 : null; };

export function forecast({ polls, config, parties, agreements, cal, opts = {} }) {
  const o = { ...DEFAULTS, ...(opts.v2 ? V2 : {}), ...opts };
  const withdrawn = new Set(o.withdrawn ? (cal.withdrawn?.lists ?? []).map((w) => w.id) : []);
  const ids = parties.map((p) => p.id).filter((id) => !withdrawn.has(id));
  const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
  const blocs = ["net", "opp", "mid", "arab"];
  const FRINGE = o.fringe ? (typeof o.fringe === "number" ? o.fringe : cal.fringe.share) : 0;
  const UNPRINTED = o.unprintedBelow ?? cal.smallList?.unprintedBelowShare ?? 0.02;

  // 1. The field: one latest poll per outlet within the window; the checks left out.
  const campaign = polls.filter((p) => p.kind !== "exit" && config.pollsters.includes(p.pollster)).sort((a, b) => b.published.localeCompare(a.published));
  const cutoff = Date.parse(campaign[0].published) - o.windowDays * 864e5;
  const seen = new Set(), current = [];
  for (const p of campaign) { if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue; seen.add(p.pollster); current.push(p); }
  const isCheck = (p) => config.withoutVariant.pollsters.includes(p.pollster);
  const field = o.includeAll || !o.excludeChecks ? current : current.filter((p) => !isCheck(p));
  const checks = current.filter(isCheck);
  // Weight: √n (600 when unstated), shared between outlets polled by the same firm.
  const firmOf = (p) => (p.firm ?? p.pollster).toLowerCase();
  const firmCount = {}; for (const p of field) firmCount[firmOf(p)] = (firmCount[firmOf(p)] ?? 0) + 1;
  const weight = (p) => Math.sqrt(p.n && p.n > 0 ? p.n : 600) / (o.firmWeights ? firmCount[firmOf(p)] : 1);

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
      if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBy(p, id) ?? printedByOthers(id) ?? UNPRINTED; below += s[id]; } else pass.push([id, r.seats]);
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

  // 4. Priors by list: the classes the final-week polls have missed in one direction since 2013. A sector with
  //    `replacesPriors` (the Arab sector, step 4b) drops its lists' priors.
  const sectors = (o.sectorTurnout ? cal.sectorTurnout?.sectors ?? [] : []).map((sc) => ({ ...sc, ids: ids.filter((id) => id in base && (sc.lists ? sc.lists.includes(id) : bloc[id] === sc.bloc)), sdLog: o.sectorSdLog ?? sc.sdLog ?? 0 })).filter((sc) => sc.ids.length);
  const priors = { ...(o.priors ? cal.listPriors ?? {} : {}) };
  for (const sc of sectors) if (sc.replacesPriors) for (const id of sc.ids) delete priors[id];
  for (const [id, pts] of Object.entries(priors)) if (typeof pts === "number" && id in base) base[id] = Math.max(0.002, base[id] + pts / 100);
  renorm(base);
  // 4b. Sector turnout (round2/B): the polls are anchored on the previous election's sector composition; the sector's
  //     lists are scaled by exp(logShift), the expected change in the sector's list-vote turnout index, plus alphaPts
  //     points of under-count, and every other list is diluted in proportion. Each run draws exp(N(0, sdLog)) the same way.
  for (const sc of sectors) {
    const tot = sc.ids.reduce((a, id) => a + base[id], 0), x = Math.exp(sc.logShift ?? 0), al = (sc.alphaPts ?? 0) / 100;
    for (const id of sc.ids) base[id] = Math.max(0.002, base[id] * x + (al * base[id]) / tot);
    renorm(base);
  }
  const arabBySector = sectors.some((sc) => sc.replacesPriors && sc.ids.some((id) => bloc[id] === "arab"));

  // 5. The lean: the field's miss on the Netanyahu bloc, recency-weighted, net of Shas's own miss when the Shas
  //    prior is in (the same miss must not count twice). The residual after the lean sets the width's floor.
  const errs = cal.elections.map((e, i, a) => ({ err: e.result - e.field - (o.leanNetOfShas && o.priors ? e.shasError ?? 0 : 0), w: 2 ** (-(a.length - 1 - i) / o.leanHalfLife) }));
  const W = errs.reduce((s, e) => s + e.w, 0);
  const leanCal = W ? errs.reduce((s, e) => s + e.w * e.err, 0) / W : 0; // no record yet (the backtest's 2015): no lean
  const lean = o.lean ?? leanCal;
  const resid = W ? Math.sqrt(errs.reduce((s, e) => s + e.w * (e.err - leanCal) ** 2, 0) / W) : 0;
  const blocSd = o.blocSd ?? Math.max(3, 2 * resid);
  // Version 3 (round2/G): the swing is the predictive distribution of the next miss, Student-t with the record's own
  //   scale and degrees of freedom; version 2's N(0, max(3, 2·resid)) put all six past results between the 31st and
  //   66th percentiles.
  const nRec = errs.length, swingScale = Math.max(o.swingFloor, resid * Math.sqrt(1 + 1 / Math.max(1, nRec))), swingDf = Math.max(o.swingDfMin, nRec - 1);
  // 6. Per-list noise: theMadad's 1.16 mean absolute seats at 0-14 days (2022) → sd in points at 8%, scaled by
  //    √share, with a floor for small lists (their misses run about 1.0 point near the threshold).
  const listSd = (o.listSdAt8 ?? (cal.perListError.meanAbsSeats * 1.25) / KNESSET / Math.sqrt(0.1 / 0.08) * 100) / 100;
  const floor = o.listSdFloor ? cal.smallList.sdFloorPoints / 100 : 0;
  const consolidateSd = o.consolidateSd / KNESSET;
  const arabSd = o.arabSwing && !arabBySector ? cal.arabSwing.sdSeats / KNESSET : 0;

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
  const randt = (df) => { let c = 0; for (let k = 0; k < df; k++) { const z = randn(); c += z * z; } return randn() / Math.sqrt(c / df); };
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
    const swing = (lean + (o.swing === "t" ? randt(swingDf) * swingScale : randn() * blocSd)) / KNESSET;
    for (const id of ids) v[id] *= bloc[id] === "net" ? 1 + swing / netShare : 1 - swing / (1 - FRINGE - netShare);
    for (const b of ["net", "opp"]) { const c = randn() * consolidateSd; const rest = members[b].filter((id) => id !== largest[b]); const tot = rest.reduce((a, id) => a + v[id], 0); if (tot > 0) { for (const id of rest) v[id] -= c * v[id] / tot; v[largest[b]] += c; } }
    const e = {}; for (const id of ids) e[id] = randn() * Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
    if (o.zeroSum) {
      for (const b of ["net", "opp", "arab"]) { const m = members[b], tot = m.reduce((a, id) => a + v[id], 0), se = m.reduce((a, id) => a + e[id], 0); if (tot > 0) for (const id of m) e[id] -= se * v[id] / tot; }
      const midE = members.mid.reduce((a, id) => a + e[id], 0), zt = zionist.reduce((a, id) => a + v[id], 0); for (const id of zionist) e[id] -= midE * v[id] / zt;
    }
    for (const sc of sectors) if (sc.sdLog) { // the sector turnout draw: the sector's lists scale together, the rest are diluted
      const g = Math.exp(randn() * sc.sdLog) - 1, inS = new Set(sc.ids), st = sc.ids.reduce((a, id) => a + v[id], 0), rest = ids.filter((id) => !inS.has(id)), rt = rest.reduce((a, id) => a + v[id], 0);
      for (const id of sc.ids) e[id] += g * v[id]; for (const id of rest) e[id] -= (g * st * v[id]) / rt;
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
  // The bloc point: version 3 the median of the simulated bloc total (round2/G: Netanyahu-bloc error 1.94 → 1.33);
  // the sum of the list points stays beside it as listSum.
  const blocOut = Object.fromEntries(blocs.map((b) => { const listSum = members[b].reduce((a, id) => a + (point[id] ?? 0), 0), median = q(sortedBlocs[b], 0.5); return [b, { point: o.blocPoint === "median" ? median : listSum, listSum, median, mean: r1(mean(blocRuns[b])), lo: q(sortedBlocs[b], 0.05), hi: q(sortedBlocs[b], 0.95) }]; }));
  return {
    inputs: { field: field.map((p) => ({ id: p.id, pollster: p.pollster, firm: p.firm, published: p.published, n: p.n, weight: r1(weight(p)) })), checks: checks.map((p) => ({ id: p.id, pollster: p.pollster, published: p.published })), agreements: pairs, withdrawn: [...withdrawn] },
    parameters: { version: o.swing === "t" || o.blocPoint === "median" || sectors.length ? 3 : 2, windowDays: o.windowDays, fieldOnly: !(o.includeAll || !o.excludeChecks), firmWeights: o.firmWeights, sharesMethod: o.shares, unprintedBelowShare: r1(UNPRINTED * 1000) / 10, listPriors: priors, sectorTurnout: sectors.map((sc) => ({ name: sc.name, lists: sc.ids, logShift: sc.logShift ?? 0, alphaPts: sc.alphaPts ?? 0, sdLog: sc.sdLog })), leanSeats: r1(lean), leanNetOfShas: !!(o.leanNetOfShas && o.priors), historicalResidualSeats: r1(resid), swing: o.swing, swingScaleSeats: o.swing === "t" ? r1(swingScale) : null, swingDf: o.swing === "t" ? swingDf : null, blocSdSeats: o.swing === "t" ? null : r1(blocSd), blocPoint: o.blocPoint, listSdPointsAt8pct: r1(listSd * 1000) / 10, listSdFloorPoints: r1(floor * 100), zeroSumWithinBloc: o.zeroSum, arabSwingSdSeats: r1(arabSd * KNESSET), consolidateSdSeats: o.consolidateSd, fringeShare: r1(FRINGE * 1000) / 10, pointRule: o.point },
    blocs: blocOut,
    majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
    netLargerThanOpp: pct(netLarger),
    largestList: Object.fromEntries(Object.entries(first).map(([k, v]) => [k, pct(v)]).filter(([, v]) => v > 0)),
    lists,
    runs: o.runs, seed: o.seed,
    ...(o.keepRuns ? { seatRuns, blocRuns, raw: { net61: net61 / o.runs, opp61: opp61 / o.runs, passRate } } : {}),
  };
}
