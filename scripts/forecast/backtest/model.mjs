/**
 * The site's forecast (scripts/forecast/forecast.mjs) as a parameterised function, for backtesting.
 * Under DEFAULTS it reproduces forecast.mjs step for step (same seats-to-shares rule, √n mean, lean as a
 * common swing, bloc/list/consolidation noise, Bader-Ofer with agreements, the same seeded generator);
 * `node scripts/forecast/backtest/backtest.mjs --check2026` verifies that against data/forecast.json.
 * Every component can be switched off or replaced through `opts`, so proposals can be scored out of sample.
 * No dependencies.
 */

export const KNESSET = 120, MAJ = 61;

export const DEFAULTS = {
  // Field selection (forecast.mjs step 1)
  windowDays: 14,            // one latest poll per pollster within this many days of `asOf`
  windowFrom: "newest",      // "newest": the newest poll (forecast.mjs); "election": opts.electionDate
  includeFilber: false,      // forecast.mjs averages without Shlomo Filber's firms (polls flagged `filber`)
  pollsters: null,           // whitelist of pollster names (forecast.mjs uses config.pollsters); null = all
  isFilber: (p) => !!p.filber,
  // Seats to shares (step 2)
  belowDefault: 0.02,        // share given to a list a poll put below the threshold without printing a %
  seatsToShares: "forecast", // "forecast": seats/120 × (1 − printed below) | "plusHalf": (seats + ½) normalised over
                             // passing lists, × (1 − below): undoes Bader-Ofer's rounding against small lists
  // Average (step 3)
  nDefault: 600,             // n assumed where a poll prints none (forecast.mjs)
  weight: null,              // (poll) => weight; overrides √n
  pollsterWeights: null,     // { pollster: multiplier } applied on top of the weight
  aggregate: "mean",         // "mean" (weighted mean, forecast.mjs) | "median" (per-list median share) | "kn": the site
                             // average's k/n rule in shares: a list passing in at least half the polls that report it is
                             // averaged over those polls only (sub-threshold readings dropped), any other list over all
  // Lean and noise (steps 4, 6-8), all in seats of 120
  lean: 0,                   // common swing to the Netanyahu bloc; the harness fills it from earlier elections
  blocSd: 3,                 // sd of the common swing around the lean
  listSd: (1.16 * 1.25) / KNESSET / Math.sqrt(0.1 / 0.08), // per-list sd in share at 8%, scaled by √(share/8%)
  consolidateSd: 1.5,        // sd (seats) moved between each bloc's largest list and its partners
  consolidateBlocs: ["net", "opp"],
  listNoise: "independent",  // "independent" (forecast.mjs) | "withinBloc": list noise rescaled so each bloc's vote total
                             // is unchanged (a one-list bloc then gets none) | "netNeutral": rescaled so the Netanyahu bloc's
                             // total and the rest's are unchanged, leaving the bloc's spread to blocSd alone
  // Count (steps 5, 9)
  threshold: 0.0325,
  agreements: [],            // [[a, b], ...]
  runs: 10_000,
  seed: 20261027,
  // Outputs
  point: "central",          // "central": allocate(lean-shifted mean) (forecast.mjs) | "median": per-list median of runs
  passCall: "sim",           // "sim": passes = share of runs with seats > 0 | "point": 100 if point > 0 else 0
};

const DAY = 864e5;

/** forecast.mjs step 1: the latest poll per pollster within the window, then the field without Filber's firms. */
export function selectPolls(polls, o) {
  const campaign = polls.filter((p) => p.kind !== "exit" && (!o.pollsters || o.pollsters.includes(p.pollster)))
    .sort((a, b) => b.published.localeCompare(a.published));
  if (!campaign.length) return { current: [], field: [], checks: [] };
  const anchor = o.windowFrom === "election" && o.electionDate ? Date.parse(o.electionDate) - DAY : Date.parse(campaign[0].published);
  const cutoff = anchor - o.windowDays * DAY;
  const seen = new Set(), current = [];
  for (const p of campaign) {
    if (seen.has(p.pollster) || Date.parse(p.published) < cutoff || Date.parse(p.published) > anchor) continue;
    seen.add(p.pollster); current.push(p);
  }
  const field = o.includeFilber ? current : current.filter((p) => !o.isFilber(p));
  return { current, field, checks: current.filter((p) => o.isFilber(p)) };
}

/** forecast.mjs step 2. */
export function shares(p, o = DEFAULTS) {
  const s = {}; let below = 0;
  for (const [id, r] of Object.entries(p.results)) if (r.belowThreshold || r.seats === 0) { s[id] = r.pct ? parseFloat(r.pct) / 100 : o.belowDefault; below += s[id]; }
  if (o.seatsToShares === "plusHalf") {
    const units = [...Object.entries(p.results).filter(([, r]) => !(r.belowThreshold || r.seats === 0)).map(([id, r]) => [[id], r.seats]), ...(p.combined ?? []).map((c) => [c.parties, c.seats])];
    const tot = units.reduce((a, [, n]) => a + n + 0.5, 0);
    for (const [members, n] of units) for (const id of members) s[id] = ((n + 0.5) / tot) * (1 - below) / members.length;
    return s;
  }
  for (const c of p.combined ?? []) for (const id of c.parties) s[id] = (c.seats / c.parties.length) / KNESSET;
  for (const [id, r] of Object.entries(p.results)) if (!(r.belowThreshold || r.seats === 0)) s[id] = (r.seats / KNESSET) * (1 - below);
  return s;
}

/** forecast.mjs step 3 (or a per-list median), renormalised to 1. */
export function meanShares(ps, o = DEFAULTS) {
  const wOf = (p) => (o.weight ? o.weight(p) : Math.sqrt(p.n && p.n > 0 ? p.n : o.nDefault)) * (o.pollsterWeights?.[p.pollster] ?? 1);
  const m = {};
  if (o.aggregate === "median") {
    const by = {};
    for (const p of ps) for (const [id, v] of Object.entries(shares(p, o))) (by[id] ??= []).push(v);
    for (const id in by) { const s = by[id].sort((a, b) => a - b), k = s.length >> 1; m[id] = s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; }
  } else if (o.aggregate === "kn") {
    const rows = ps.map((p) => ({ w: wOf(p), s: shares(p, o), p }));
    const passed = (p, id) => { const r = p.results[id]; return r ? r.seats > 0 && !r.belowThreshold : (p.combined ?? []).some((c) => c.parties.includes(id)); };
    const idsAll = new Set(rows.flatMap((r) => Object.keys(r.s)));
    for (const id of idsAll) {
      const rep = rows.filter((r) => id in r.s), pass = rep.filter((r) => passed(r.p, id));
      const use = pass.length >= rep.length / 2 && pass.length > 0 ? pass : rep;
      m[id] = use.reduce((a, r) => a + r.w * r.s[id], 0) / use.reduce((a, r) => a + r.w, 0);
    }
  } else {
    const acc = {}, w = {};
    for (const p of ps) for (const [id, v] of Object.entries(shares(p, o))) { acc[id] = (acc[id] ?? 0) + wOf(p) * v; w[id] = (w[id] ?? 0) + wOf(p); }
    for (const id in acc) m[id] = acc[id] / w[id];
  }
  const tot = Object.values(m).reduce((a, b) => a + b, 0); for (const id in m) m[id] /= tot;
  return m;
}

/** forecast.mjs step 3's lean rule: recency-weighted mean of past misses (half-life two elections) and the residual sd. */
export function leanFrom(errors, halfLife = 2) {
  if (!errors.length) return { lean: 0, resid: 0 };
  const ws = errors.map((_, i, a) => 2 ** (-(a.length - 1 - i) / halfLife));
  const W = ws.reduce((a, b) => a + b, 0);
  const lean = errors.reduce((s, e, i) => s + ws[i] * e, 0) / W;
  const resid = Math.sqrt(errors.reduce((s, e, i) => s + ws[i] * (e - lean) ** 2, 0) / W);
  return { lean, resid };
}

/** forecast.mjs step 5: whole quotas, remainders by D'Hondt with an agreement pair as one list (s. 81). */
export function makeAllocator(ids, agreements, threshold = DEFAULTS.threshold) {
  return function allocate(votes) {
    const pass = ids.filter((k) => (votes[k] ?? 0) >= threshold);
    const paired = new Map(); for (const [a, b] of agreements) if (pass.includes(a) && pass.includes(b)) { paired.set(a, a + "+" + b); paired.set(b, a + "+" + b); }
    const units = new Map(); for (const k of pass) { const key = paired.get(k) ?? k; units.set(key, (units.get(key) ?? 0) + votes[k]); }
    const dh = (m, n) => { const s = Object.fromEntries([...m.keys()].map((k) => [k, 0])); for (let i = 0; i < n; i++) { let best, bv = -1; for (const [k, v] of m) { const q = v / (s[k] + 1); if (q > bv) { bv = q; best = k; } } s[best]++; } return s; };
    const out = {}; for (const [key, n] of Object.entries(dh(units, KNESSET))) { if (key.includes("+")) { const [a, b] = key.split("+"); Object.assign(out, dh(new Map([[a, votes[a]], [b, votes[b]]]), n)); } else out[key] = n; }
    return out;
  };
}

/**
 * The forecast. `polls`: poll records shaped like data/polls.json (results, combined, n, pollster, published,
 * plus `filber` for the backtest data). `opts.ids` (list ids in order) and `opts.bloc` ({id: net|opp|mid|arab})
 * are required; everything else defaults to forecast.mjs.
 */
export function forecast(polls, opts) {
  const o = { ...DEFAULTS, ...opts };
  const { ids, bloc } = o;
  const RUNS = o.runs;
  const { current, field, checks } = selectPolls(polls, o);
  const base = meanShares(field, o);
  const allocate = makeAllocator(ids, o.agreements, o.threshold);
  const listSd = o.listSd, consolidateSd = o.consolidateSd / KNESSET;

  let seed = o.seed; const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const randn = () => { const u = rand() || 1e-12, v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  const central = { ...base };
  { const ns = ids.filter((id) => bloc[id] === "net").reduce((a, id) => a + (base[id] ?? 0), 0); const sw = o.lean / KNESSET; for (const id of ids) if (id in central) central[id] *= bloc[id] === "net" ? 1 + sw / ns : 1 - sw / (1 - ns); }
  const blocs = ["net", "opp", "mid", "arab"];
  const largest = Object.fromEntries(blocs.map((b) => [b, ids.filter((id) => bloc[id] === b).sort((x, y) => (base[y] ?? 0) - (base[x] ?? 0))[0]]));
  const seatRuns = Object.fromEntries(ids.map((id) => [id, []])), blocRuns = Object.fromEntries(blocs.map((b) => [b, []]));
  let net61 = 0, opp61 = 0, oppArab61 = 0, netLarger = 0;
  const netIds = ids.filter((id) => bloc[id] === "net");
  for (let i = 0; i < RUNS; i++) {
    const v = { ...base };
    const netShare = netIds.reduce((a, id) => a + (v[id] ?? 0), 0);
    const swing = (o.lean + randn() * o.blocSd) / KNESSET;
    for (const id of ids) if (id in v) v[id] *= bloc[id] === "net" ? 1 + swing / netShare : 1 - swing / (1 - netShare);
    for (const b of o.consolidateBlocs) { const c = randn() * consolidateSd; const rest = ids.filter((id) => bloc[id] === b && id !== largest[b] && id in v); const tot = rest.reduce((a, id) => a + v[id], 0); for (const id of rest) v[id] -= c * v[id] / tot; v[largest[b]] += c; }
    if (o.listNoise === "withinBloc" || o.listNoise === "netNeutral") {
      const g = o.listNoise === "withinBloc" ? (id) => bloc[id] : (id) => (bloc[id] === "net" ? "net" : "rest");
      const before = {}, after = {};
      for (const id of ids) if (id in v) { before[g(id)] = (before[g(id)] ?? 0) + v[id]; v[id] = Math.max(0, v[id] + randn() * listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08)); after[g(id)] = (after[g(id)] ?? 0) + v[id]; }
      for (const id of ids) if (id in v && after[g(id)] > 0) v[id] *= before[g(id)] / after[g(id)];
    } else for (const id of ids) if (id in v) v[id] = Math.max(0, v[id] + randn() * listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
    const s = allocate(v); const t = { net: 0, opp: 0, mid: 0, arab: 0 };
    for (const id of ids) { const n = s[id] ?? 0; seatRuns[id].push(n); t[bloc[id]] += n; }
    for (const b of blocs) blocRuns[b].push(t[b]);
    if (t.net >= MAJ) net61++; if (t.opp >= MAJ) opp61++; if (t.opp + t.arab + t.mid >= MAJ) oppArab61++; if (t.net > t.opp) netLarger++;
  }
  const q = (xs, f) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const pct = (x) => Math.round((x / RUNS) * 100);
  const centralSeats = allocate(central);
  const point = o.point === "median" ? Object.fromEntries(ids.map((id) => [id, q(seatRuns[id], 0.5)])) : centralSeats;
  const lists = Object.fromEntries(ids.filter((id) => id in base).map((id) => {
    const passRate = seatRuns[id].filter((n) => n > 0).length / RUNS;
    return [id, { share: central[id], point: point[id] ?? 0, mean: mean(seatRuns[id]), lo: q(seatRuns[id], 0.05), hi: q(seatRuns[id], 0.95),
      passes: o.passCall === "point" ? ((point[id] ?? 0) > 0 ? 100 : 0) : Math.round(passRate * 100), pPass: o.passCall === "point" ? ((point[id] ?? 0) > 0 ? 1 : 0) : passRate }];
  }));
  const blocOut = Object.fromEntries(blocs.map((b) => [b, {
    point: o.point === "median" ? q(blocRuns[b], 0.5) : ids.filter((id) => bloc[id] === b).reduce((a, id) => a + (point[id] ?? 0), 0),
    mean: mean(blocRuns[b]), lo: q(blocRuns[b], 0.05), hi: q(blocRuns[b], 0.95) }]));
  const P = { net: net61 / RUNS, oppZionist: opp61 / RUNS }; P.neither = 1 - P.net - P.oppZionist;
  return {
    inputs: { field: field.map((p) => p.id), checks: checks.map((p) => p.id), current: current.map((p) => p.id) },
    parameters: { lean: o.lean, blocSd: o.blocSd, listSdAt8pct: listSd, consolidateSd: o.consolidateSd },
    lists, blocs: blocOut,
    majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
    majorityP: P, netLargerThanOpp: pct(netLarger),
  };
}

/**
 * The site's plain average (lib/polls.ts: currentPolls + average + averageAsPoll): one latest poll per
 * pollster within 14 days of the newest, √n weights (median known n where missing; 1 when none is known),
 * each list averaged over the polls where it passed, 0 when it passed in under half, scaled down to 120,
 * one decimal. Returns seats per list (fractional).
 */
export function siteAverage(polls, ids, { windowDays = 14, includeFilber = true, isFilber = (p) => !!p.filber, pollsters = null } = {}) {
  const sorted = polls.filter((p) => p.kind !== "exit" && (!pollsters || pollsters.includes(p.pollster)))
    .sort((a, b) => b.published.localeCompare(a.published) || a.pollster.localeCompare(b.pollster));
  const cutoff = Date.parse(sorted[0].published) - windowDays * DAY;
  const seen = new Set(), cur = [];
  for (const p of sorted) { if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue; seen.add(p.pollster); cur.push(p); }
  const ps = includeFilber ? cur : cur.filter((p) => !isFilber(p));
  const known = ps.map((p) => p.n).filter((n) => typeof n === "number" && n > 0).sort((a, b) => a - b);
  const fb = known.length ? (known.length % 2 ? known[known.length >> 1] : (known[known.length / 2 - 1] + known[known.length / 2]) / 2) : 1;
  const w = (p) => Math.sqrt(p.n && p.n > 0 ? p.n : fb);
  const raw = {};
  for (const id of ids) {
    const rep = ps.filter((p) => p.results[id]); if (!rep.length) continue;
    const pass = rep.filter((p) => p.results[id].seats > 0 && !p.results[id].belowThreshold);
    const ws = pass.reduce((a, p) => a + w(p), 0);
    const avg = pass.length ? pass.reduce((a, p) => a + w(p) * p.results[id].seats, 0) / ws : 0;
    const near = pass.length > 0 && pass.length < rep.length / 2;
    raw[id] = pass.length === 0 || near ? 0 : avg;
  }
  const sum = Object.values(raw).reduce((a, b) => a + b, 0), scale = sum > 120 ? 120 / sum : 1;
  const seats = Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, Math.round(v * scale * 10) / 10]));
  return { seats, polls: ps.map((p) => p.id) };
}
