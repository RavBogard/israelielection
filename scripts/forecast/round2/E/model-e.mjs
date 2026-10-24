/**
 * Round 2, agent E: a state-space poll aggregator as a drop-in for scripts/forecast/model.mjs (version 2).
 * docs/research/polls-method/round2/E-state-space.md has the reasoning and the backtest.
 *
 *   forecast({ polls, config, parties, agreements, cal, opts }) -> same shape as model.mjs's forecast()
 *
 * Steps 1-3 of model.mjs (latest poll per outlet in 7 days, √n-weighted mean) are replaced by a Kalman filter run
 * separately for each list over the whole campaign:
 *   level      x_t = x_{t-1} (+ v_{t-1}·Δt when dynamics = "llt") + w,   w ~ N(0, q·Δt)
 *   poll       y   = x_t + h_firm + ε,                                   ε ~ N(0, r · 600/n)
 *   house      h_firm ~ N(m_firm, H) for the whole campaign (m = 0 unless opts.houseRecord gives a record)
 * with q, r, H proportional to the list's campaign-mean share (the variances of a share scale with it), so three
 * numbers set everything: q8, r8, h8, in vote-share points at an 8% share (q8 per √day). They are fitted by maximum
 * likelihood on past campaigns (fitParams below; leave-future-out in backtest-e.mjs). The filtered level on election
 * day, its variance included, then replaces model.mjs's `base`; steps 4-9 (priors, the lean, the Monte Carlo, the
 * Bader-Ofer allocation, the median point) are model.mjs's code, copied unchanged because they are closures there.
 * Seats go to shares by model.mjs's step-2 rule (the D'Hondt midpoint), except that lists outside the modelled set
 * (withdrawn lists, pre-merger components, combined cells) count in solving the divisor instead of being skipped.
 * Deterministic for a given opts.seed. No dependencies.
 */
export const KNESSET = 120, THRESHOLD = 0.0325, MAJ = 61;

/** Fitted on all seven elections 2013-2022 (node scripts/forecast/round2/E/backtest-e.mjs --fit-all): for 2026. */
export const FITTED_ALL = {
  rw: { q8: 0.17, r8: 0.6, h8: 0.5 },
  llt: { q8: 0.17, r8: 0.6, h8: 0.5, qv8: 0 },   // the slope sd fits to 0: "llt" collapses to "rw"
  rwNoHouse: { q8: 0.17, r8: 0.7, h8: 0 },
};

export const DEFAULTS = {
  runs: 50_000, seed: 20261027,
  // E: the aggregation.
  dynamics: "rw",           // "rw": local level (random walk); "llt": local linear trend; "static": one level, no walk
  house: true,              // firm house effects in the state (false: every poll measures the level directly)
  houseRecord: null,        // {firm: {list: points}} prior means for the house effects (agent A's table); null = 0
  params: null,             // {q8, r8, h8, qv8}; null = FITTED_ALL for the dynamics
  sinceDays: null,          // only polls within this many days of the newest (null: config.dissolved, else all)
  latestPerOutlet: false,   // true: one latest poll per outlet (v2's field rule), for the structure-only control
  electionDate: null,       // "YYYY-MM-DD": walk the level forward to it (null: stop at the newest poll)
  latentNoise: true,        // draw the level from its posterior in each run (on top of v2's election-day error)
  // As model.mjs.
  excludeChecks: true, priors: true, leanHalfLife: 2, blocSd: null, listSdAt8: null, listSdFloor: true, zeroSum: true,
  arabSwing: true, consolidateSd: 1.5, fringe: true, withdrawn: true, point: "median", lean: null, includeAll: false,
};

export const pctOf = (s) => { if (s == null) return null; const x = parseFloat(String(s).replace(/[<>~%\s]/g, "")); return Number.isFinite(x) ? (String(s).includes("<") ? x / 2 : x) / 100 : null; };

/** Firm lineages (agent A's FIRM_PATTERNS, round2/A/model-a.mjs, copied so this module stands alone). */
const FIRM_PATTERNS = [
  [/direct polls/, "direct"], [/next data|sf\+nd/, "nextdata"], [/tatika/, "tatika"],
  [/hamidgam|midgam project|midgam panel|midgam ?[\/&] ?statnet|statnet|mp\+tm/, "hamidgam"],
  [/midgam|meno geva|mano geva|ipanel/, "midgam"], [/camil fuchs|dialog/, "fuchs"], [/kantar|tns|teleseker/, "kantar"],
  [/lazar|lri\+p4a/, "panels"], [/panel/, "panels"], [/smith/, "smith"], [/ma'?agar|mochot|mohot/, "maagar"],
  [/geocartograph/, "geocartography"], [/dahaf/, "dahaf"], [/new wave/, "newwave"], [/sarid/, "sarid"], [/miskar/, "miskar"],
  [/shvakim/, "shvakim"], [/\btri\b/, "tri"],
];
const clean = (x) => String(x ?? "").replace(/\{\{[^}]*\}\}?/g, "").replace(/\{\{|\}\}|nowrap\|/g, "").toLowerCase().trim();
const firmFromText = (t) => { if (!t) return null; for (const [re, f] of FIRM_PATTERNS) if (re.test(t)) return f; return null; };
export function firmKeys(polls) {
  const out = new Map();
  for (const p of polls) {
    let f = firmFromText(clean(p.firm)) ?? firmFromText(clean(p.pollster));
    if (!f) { const fs = new Set(polls.filter((q) => q.pollster === p.pollster && q !== p).map((q) => firmFromText(clean(q.firm))).filter(Boolean)); f = fs.size === 1 ? [...fs][0] : "outlet:" + clean(p.pollster); }
    out.set(p, f);
  }
  return out;
}

/** model.mjs step 2 for one poll. Returns {s: {id: share}, cens: Set of ids below the threshold with no share printed}. */
export function pollShares(p, ids) {
  const s = {}, cens = new Set(); let below = 0; const pass = [];
  for (const [id, r] of Object.entries(p.results)) {
    if (r.belowThreshold || r.seats === 0) { const v = pctOf(r.pct); if (ids.includes(id)) { if (v != null) s[id] = v; else cens.add(id); } below += v ?? (ids.includes(id) ? 0.02 : 0); }
    else if (r.seats > 0) pass.push([id, r.seats]);
  }
  for (const c of p.combined ?? []) pass.push([c.parties.join("|"), c.seats]);
  if (!pass.length) return { s, cens };
  const P = 1 - below;
  let lam = P / pass.reduce((a, [, k]) => a + k + 0.5, 0);
  const at = (k) => (Math.max(THRESHOLD, k * lam) + (k + 1) * lam) / 2;
  for (let it = 0; it < 60; it++) lam *= P / pass.reduce((a, [, k]) => a + at(k), 0);
  for (const [id, k] of pass) if (ids.includes(id)) s[id] = at(k);
  return { s, cens };
}

const DAY = 864e5;
const dayOf = (d) => Date.parse(d) / DAY;

/**
 * The filter. obs: [{t (days), firm, n, s: {id: share}, cens: Set}] sorted by t. Returns per list the level's mean and
 * variance at tEnd, and the summed log-likelihood of the one-step predictions (the first reading of a list excluded).
 */
export function kalman(obs, ids, prm, { dynamics = "rw", house = true, houseRecord = null, tEnd = null } = {}) {
  const firms = [...new Set(obs.map((o) => o.firm))], F = firms.length, fi = new Map(firms.map((f, i) => [f, i]));
  const llt = dynamics === "llt", static_ = dynamics === "static";
  const off = llt ? 2 : 1, D = off + (house ? F : 0);
  const out = {}; let loglik = 0, nll = 0;
  for (const id of ids) {
    const ys = obs.filter((o) => o.s[id] != null);
    if (!ys.length) continue;
    const sbar = Math.max(0.01, ys.reduce((a, o) => a + o.s[id], 0) / ys.length), sc = sbar / 0.08;
    const q = static_ ? 0 : (prm.q8 / 100) ** 2 * sc, r = (prm.r8 / 100) ** 2 * sc, H = (prm.h8 / 100) ** 2 * sc, qv = llt ? ((prm.qv8 ?? 0) / 100) ** 2 * sc : 0;
    // state m (D), covariance P (D×D, flat)
    const m = new Float64Array(D), P = new Float64Array(D * D);
    let started = false, t0 = null;
    const init = (y, t) => {
      m[0] = y; P[0] = 0.05 ** 2; if (llt) { m[1] = 0; P[1 * D + 1] = qv * 60 + 1e-12; }
      if (house) for (let f = 0; f < F; f++) { m[off + f] = (houseRecord?.[firms[f]]?.[id] ?? 0) / 100; P[(off + f) * D + off + f] = H + 1e-14; }
      started = true; t0 = t;
    };
    const predict = (dt) => {
      if (dt <= 0) return;
      if (llt) { // x += v dt
        m[0] += m[1] * dt;
        // P' = A P A^T with A = I + dt·e0 e1^T
        for (let j = 0; j < D; j++) P[0 * D + j] += dt * P[1 * D + j];
        for (let i = 0; i < D; i++) P[i * D + 0] += dt * P[i * D + 1];
        P[0] += qv * dt ** 3 / 3; P[1] += qv * dt ** 2 / 2; P[D] += qv * dt ** 2 / 2; P[D + 1] += qv * dt;
      }
      P[0] += q * dt;
    };
    const hv = new Float64Array(D);
    for (const o of obs) {
      const has = o.s[id] != null, cens = o.cens?.has(id);
      if (!has && !cens) continue;
      if (!started) { if (!has) continue; init(o.s[id], o.t); continue; }
      predict(o.t - t0); t0 = o.t;
      const f = house ? off + fi.get(o.firm) : -1;
      const pred = m[0] + (f >= 0 ? m[f] : 0);
      let y, R;
      if (has) { y = o.s[id]; R = r * 600 / (o.n > 0 ? o.n : 600); }
      else { y = Math.min(pred, 0.031); R = 0.008 ** 2; } // below the threshold, no share printed: a censored reading
      // S = h P h^T + R, h = e0 + e_f
      for (let i = 0; i < D; i++) hv[i] = P[i * D] + (f >= 0 ? P[i * D + f] : 0);
      const S = hv[0] + (f >= 0 ? hv[f] : 0) + R, innov = y - pred;
      if (has) { loglik += -0.5 * (Math.log(2 * Math.PI * S) + innov * innov / S); nll++; }
      for (let i = 0; i < D; i++) m[i] += hv[i] * innov / S;
      for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) P[i * D + j] -= hv[i] * hv[j] / S;
    }
    if (tEnd != null && tEnd > t0) predict(tEnd - t0);
    out[id] = { mean: m[0], sd: Math.sqrt(Math.max(P[0], 0)), slope: llt ? m[1] : 0, n: ys.length, last: t0 };
  }
  return { lists: out, loglik, nObs: nll, firms };
}

/** The polls one campaign feeds the filter: checks out, dates as days, firm keys, shares. */
export function campaignObs(polls, ids, { isCheck = () => false, since = null, latestPerOutlet = false, windowDays = null } = {}) {
  let ps = polls.filter((p) => p.kind !== "exit" && !isCheck(p) && !/\(party\)$/.test(p.pollster ?? ""));
  if (since) ps = ps.filter((p) => p.published >= since);
  ps.sort((a, b) => b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
  if (windowDays != null && ps.length) { const cut = dayOf(ps[0].published) - windowDays; ps = ps.filter((p) => dayOf(p.published) >= cut); }
  if (latestPerOutlet) { const seen = new Set(); ps = ps.filter((p) => (seen.has(p.pollster) ? false : (seen.add(p.pollster), true))); }
  const fk = firmKeys(ps);
  const obs = ps.map((p) => { const { s, cens } = pollShares(p, ids); return { id: p.id, pollster: p.pollster, firm: fk.get(p), published: p.published, t: dayOf(p.published), n: p.n, s, cens }; });
  obs.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
  return obs;
}

/**
 * Maximum-likelihood fit of {q8, r8, h8 (, qv8)} on past campaigns: coordinate search over log grids.
 * campaigns: [{obs, ids}] (campaignObs output per election).
 */
export function fitParams(campaigns, { dynamics = "rw", house = true, start = null } = {}) {
  const ll = (p) => campaigns.reduce((a, c) => a + kalman(c.obs, c.ids, p, { dynamics, house }).loglik, 0);
  const grid = { q8: [0.02, 0.03, 0.05, 0.07, 0.1, 0.13, 0.17, 0.22, 0.3, 0.4, 0.55, 0.75], r8: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.15, 1.3, 1.5, 1.8], h8: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.3], qv8: [0, 0.002, 0.005, 0.01, 0.02, 0.04] };
  const keys = ["q8", "r8", ...(house ? ["h8"] : []), ...(dynamics === "llt" ? ["qv8"] : [])];
  const p = { q8: 0.15, r8: 0.7, h8: house ? 0.4 : 0, qv8: dynamics === "llt" ? 0.005 : 0, ...(start ?? {}) };
  if (dynamics === "static") keys.splice(keys.indexOf("q8"), 1), (p.q8 = 0);
  let best = ll(p);
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (const k of keys) for (const v of grid[k]) { if (v === p[k]) continue; const c = { ...p, [k]: v }, l = ll(c); if (l > best + 1e-9) { best = l; p[k] = v; moved = true; } }
    if (!moved) break;
  }
  return { ...p, loglik: Math.round(best * 10) / 10 };
}

export function forecast({ polls, config, parties, agreements, cal, opts = {} }) {
  const o = { ...DEFAULTS, ...opts };
  const withdrawn = new Set(o.withdrawn ? (cal.withdrawn?.lists ?? []).map((w) => w.id) : []);
  const ids = parties.map((p) => p.id).filter((id) => !withdrawn.has(id));
  const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
  const blocs = ["net", "opp", "mid", "arab"];
  const FRINGE = o.fringe ? cal.fringe.share : 0;

  // 1-3 (E). The campaign through the filter.
  const isCheck = (p) => !(o.includeAll || !o.excludeChecks) && (p.filber === true || (config.withoutVariant?.pollsters ?? []).includes(p.pollster));
  const inConfig = polls.filter((p) => !config.pollsters || config.pollsters.includes(p.pollster));
  const obs = campaignObs(inConfig, ids, { isCheck, since: o.sinceDays == null ? config.dissolved ?? null : null, windowDays: o.sinceDays, latestPerOutlet: o.latestPerOutlet });
  if (!obs.length) throw new Error("model-e: no polls");
  const dyn = o.dynamics;
  const prm = o.params ?? (o.house ? (dyn === "llt" ? FITTED_ALL.llt : FITTED_ALL.rw) : FITTED_ALL.rwNoHouse);
  const tLast = obs[obs.length - 1].t, tEnd = o.electionDate ? dayOf(o.electionDate) : tLast;
  const K = kalman(obs, ids, prm, { dynamics: dyn, house: o.house, houseRecord: o.houseRecord, tEnd });
  const base = {}, latSd = {};
  for (const id of ids) { const l = K.lists[id]; base[id] = l ? Math.max(0.001, l.mean) : 0; latSd[id] = l ? l.sd : 0; } // a list no poll reports: 0, as model.mjs (the fringe holds it)
  const renorm = (v, to = 1 - FRINGE) => { const t = Object.values(v).reduce((a, b) => a + b, 0); for (const id in v) v[id] *= to / t; return v; };
  renorm(base);
  for (const [id, v] of Object.entries(base)) if (!Number.isFinite(v)) throw new Error(`model-e: non-finite share for ${id}`);
  const latent = Object.fromEntries(ids.map((id) => [id, { share: Math.round(base[id] * 1e4) / 100, sd: Math.round(latSd[id] * 1e4) / 100, polls: K.lists[id]?.n ?? 0 }]));

  // 4-9: model.mjs, unchanged except the latent draw (E) at the head of each run.
  const priors = o.priors ? cal.listPriors ?? {} : {};
  for (const [id, pts] of Object.entries(priors)) if (typeof pts === "number" && id in base) base[id] = Math.max(0.002, base[id] + pts / 100);
  renorm(base);
  const errs = cal.elections.map((e, i, a) => ({ err: e.result - e.field, w: 2 ** (-(a.length - 1 - i) / o.leanHalfLife) }));
  const W = errs.reduce((s, e) => s + e.w, 0);
  const leanCal = W ? errs.reduce((s, e) => s + e.w * e.err, 0) / W : 0;
  const lean = o.lean ?? leanCal;
  const resid = W ? Math.sqrt(errs.reduce((s, e) => s + e.w * (e.err - leanCal) ** 2, 0) / W) : 0;
  const blocSd = o.blocSd ?? Math.max(3, 2 * resid);
  const listSd = (o.listSdAt8 ?? (cal.perListError.meanAbsSeats * 1.25) / KNESSET / Math.sqrt(0.1 / 0.08) * 100) / 100;
  const floor = o.listSdFloor ? cal.smallList.sdFloorPoints / 100 : 0;
  const consolidateSd = o.consolidateSd / KNESSET;
  const arabSd = o.arabSwing ? cal.arabSwing.sdSeats / KNESSET : 0;

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
    if (o.latentNoise) { for (const id of ids) if (latSd[id] > 0) v[id] = Math.max(0.0005, v[id] + randn() * latSd[id]); renorm(v); }
    const netShare = members.net.reduce((a, id) => a + v[id], 0);
    const swing = (lean + randn() * blocSd) / KNESSET;
    for (const id of ids) v[id] *= bloc[id] === "net" ? 1 + swing / netShare : 1 - swing / (1 - FRINGE - netShare);
    for (const b of ["net", "opp"]) { const c = randn() * consolidateSd; const rest = members[b].filter((id) => id !== largest[b]); const tot = rest.reduce((a, id) => a + v[id], 0); if (tot > 0) { for (const id of rest) v[id] -= c * v[id] / tot; v[largest[b]] += c; } }
    const e = {}; for (const id of ids) e[id] = randn() * Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
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
  const blocOut = Object.fromEntries(blocs.map((b) => [b, { point: members[b].reduce((a, id) => a + (point[id] ?? 0), 0), median: q(sortedBlocs[b], 0.5), mean: r1(mean(blocRuns[b])), lo: q(sortedBlocs[b], 0.05), hi: q(sortedBlocs[b], 0.95) }]));
  const lastPer = {}; for (const x of obs) lastPer[x.pollster] = x;
  return {
    inputs: { field: Object.values(lastPer).map((x) => ({ id: x.id, pollster: x.pollster, firm: x.firm, published: x.published, n: x.n ?? null })), pollsUsed: obs.length, firms: K.firms, checks: [], agreements: pairs, withdrawn: [...withdrawn] },
    parameters: { version: "E1 (state space)", dynamics: dyn, house: o.house, houseRecord: !!o.houseRecord, q8: prm.q8, r8: prm.r8, h8: o.house ? prm.h8 : 0, qv8: dyn === "llt" ? prm.qv8 : null, electionDate: o.electionDate, gapDays: r1(tEnd - tLast), latentNoise: o.latentNoise, latent, listPriors: priors, leanSeats: r1(lean), historicalResidualSeats: r1(resid), blocSdSeats: r1(blocSd), listSdPointsAt8pct: r1(listSd * 1000) / 10, listSdFloorPoints: r1(floor * 100), zeroSumWithinBloc: o.zeroSum, arabSwingSdSeats: r1(arabSd * KNESSET), consolidateSdSeats: o.consolidateSd, fringeShare: r1(FRINGE * 1000) / 10, pointRule: o.point },
    blocs: blocOut,
    majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
    netLargerThanOpp: pct(netLarger),
    largestList: Object.fromEntries(Object.entries(first).map(([k, v]) => [k, pct(v)]).filter(([, v]) => v > 0)),
    lists,
    runs: o.runs, seed: o.seed,
  };
}
