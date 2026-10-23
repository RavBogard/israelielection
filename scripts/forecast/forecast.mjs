/**
 * The site's forecast: a seat simulation over the current polls, every parameter set by a rule from
 * the record of the six elections under the 3.25% threshold (scripts/forecast/calibration.json).
 * Reads data/polls.json, data/parties.json, data/results.json; writes data/forecast.json.
 * No dependencies; seeded, so the same inputs give the same output. See
 * docs/research/polls-method/2026-10-23-forecast-algorithm.md for the reasoning behind each step.
 *
 * Runs daily until the vote (the polls job reruns it after every import). Every run whose figures
 * differ from the last is appended to data/forecast-history.json, so each day's prediction stays on
 * the record. `--final` marks the run final; once data/forecast.json is final, later runs are refused
 * unless `--force`, so exit polls and the count never overwrite the prediction they are scored against.
 */
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const FINAL = process.argv.includes("--final"), FORCE = process.argv.includes("--force");
const SENSITIVITY = process.env.FILBER !== undefined || process.env.LEAN !== undefined;
const previous = fs.existsSync("data/forecast.json") ? read("data/forecast.json") : null;
if (previous?.final && !FORCE && !SENSITIVITY) { console.log(`data/forecast.json is final (${previous.generated}); not regenerated. Pass --force to override.`); process.exit(0); }
const { polls, config } = read("data/polls.json");
const parties = (read("data/parties.json").parties ?? read("data/parties.json")).map((p) => ({ id: p.id, bloc: p.bloc, name: p.name }));
const results = read("data/results.json");
const cal = read("scripts/forecast/calibration.json");
const KNESSET = 120, THRESHOLD = 0.0325, MAJ = 61, RUNS = 50_000, SEED = 20261027;
const bloc = Object.fromEntries(parties.map((p) => [p.id, p.bloc]));
const ids = parties.map((p) => p.id);

// 1. The field: the site's current polls (one per firm, 14-day window) minus the firms whose house
//    effect the lean below already stands for (Shlomo Filber's: Channel 14, i24NEWS).
const campaign = polls.filter((p) => p.kind !== "exit" && config.pollsters.includes(p.pollster)).sort((a, b) => b.published.localeCompare(a.published));
const cutoff = Date.parse(campaign[0].published) - config.currentWindowDays * 864e5;
const seen = new Set(), current = [];
for (const p of campaign) { if (seen.has(p.pollster) || Date.parse(p.published) < cutoff) continue; seen.add(p.pollster); current.push(p); }
const field = current.filter((p) => !config.withoutVariant.pollsters.includes(p.pollster));
const checks = current.filter((p) => config.withoutVariant.pollsters.includes(p.pollster));

// 2. Seats back to vote shares. A pollster's seats are its own allocation of the vote among passing
//    lists, so a passing list's share is seats/120 of the vote that passed; a list the pollster put
//    below the threshold keeps the percentage it printed (2% when it printed none).
function shares(p) {
  const s = {}; let below = 0;
  for (const [id, r] of Object.entries(p.results)) if (r.belowThreshold || r.seats === 0) { s[id] = r.pct ? parseFloat(r.pct) / 100 : 0.02; below += s[id]; }
  for (const c of p.combined) for (const id of c.parties) s[id] = (c.seats / c.parties.length) / KNESSET; // split evenly; refined below by passing-share scale
  for (const [id, r] of Object.entries(p.results)) if (!(r.belowThreshold || r.seats === 0)) s[id] = (r.seats / KNESSET) * (1 - below);
  return s;
}
const sqrtN = (p) => Math.sqrt(p.n && p.n > 0 ? p.n : 600);
function meanShares(ps) {
  const acc = {}, w = {};
  for (const p of ps) for (const [id, v] of Object.entries(shares(p))) { acc[id] = (acc[id] ?? 0) + sqrtN(p) * v; w[id] = (w[id] ?? 0) + sqrtN(p); }
  const m = {}; for (const id in acc) m[id] = acc[id] / w[id];
  const tot = Object.values(m).reduce((a, b) => a + b, 0); for (const id in m) m[id] /= tot;
  return m;
}

// 3. The lean: how far the field has missed the Netanyahu bloc, recency-weighted (half-life two
//    elections), applied as a common swing. The residual spread after the lean sets the floor of the width.
const errs = cal.elections.map((e, i, a) => ({ err: e.result - e.field, w: 2 ** (-(a.length - 1 - i) / 2) }));
const lean = errs.reduce((s, e) => s + e.w * e.err, 0) / errs.reduce((s, e) => s + e.w, 0);
const resid = Math.sqrt(errs.reduce((s, e) => s + e.w * (e.err - lean) ** 2, 0) / errs.reduce((s, e) => s + e.w, 0));
// Width: the historical residual, doubled, because the 2026 pollsters split ten seats where no past
// campaign split more than three; the error process this year may not be the historical one.
const blocSd = Math.max(3, 2 * resid);
// Per-list noise: theMadad's 1.16 mean absolute seats at 0-14 days is a 1.45-seat sd for a ten-seat
// list; in vote share that is 1.2 points at 8%, scaled by the square root of the share.
const listSd = (cal.perListError.meanAbsSeats * 1.25) / KNESSET / Math.sqrt(0.1 / 0.08);
// Consolidation: in 2015, April 2019 and 2020 the bloc held while its largest list beat its polls by
// 3-9 seats at its partners' expense. One draw per bloc, sd 1.5 seats, moved to the largest list.
const consolidateSd = 1.5 / KNESSET;

// 4. Agreements: every surplus-vote pair reported for 2026 (data/results.json signed + reported).
const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);

// 5. Bader-Ofer: whole quotas to each list, remainders by D'Hondt with a pair as one list (s. 81).
function allocate(votes) {
  const pass = ids.filter((k) => (votes[k] ?? 0) >= THRESHOLD);
  const paired = new Map(); for (const [a, b] of agreements) if (pass.includes(a) && pass.includes(b)) { paired.set(a, a + "+" + b); paired.set(b, a + "+" + b); }
  const units = new Map(); for (const k of pass) { const key = paired.get(k) ?? k; units.set(key, (units.get(key) ?? 0) + votes[k]); }
  const dh = (m, n) => { const s = Object.fromEntries([...m.keys()].map((k) => [k, 0])); for (let i = 0; i < n; i++) { let best, bv = -1; for (const [k, v] of m) { const q = v / (s[k] + 1); if (q > bv) { bv = q; best = k; } } s[best]++; } return s; };
  const out = {}; for (const [key, n] of Object.entries(dh(units, KNESSET))) { if (key.includes("+")) { const [a, b] = key.split("+"); Object.assign(out, dh(new Map([[a, votes[a]], [b, votes[b]]]), n)); } else out[key] = n; }
  return out;
}

// 6. The simulation.
let seed = SEED; const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const randn = () => { const u = rand() || 1e-12, v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const base = meanShares(process.env.FILBER === "1" ? current : field);
if (process.env.LEAN !== undefined) { /* sensitivity run */ }
const leanUsed = process.env.LEAN !== undefined ? Number(process.env.LEAN) : lean;
// The central forecast: the field shares with the lean applied, then allocated. Scored as `point`.
const central = { ...base }; { const ns = ids.filter((id) => bloc[id] === "net").reduce((a, id) => a + (base[id] ?? 0), 0); const sw = leanUsed / KNESSET; for (const id of ids) if (id in central) central[id] *= bloc[id] === "net" ? 1 + sw / ns : 1 - sw / (1 - ns); }
const blocs = ["net", "opp", "mid", "arab"];
const largest = Object.fromEntries(blocs.map((b) => [b, ids.filter((id) => bloc[id] === b).sort((x, y) => (base[y] ?? 0) - (base[x] ?? 0))[0]]));
const seatRuns = Object.fromEntries(ids.map((id) => [id, []])), blocRuns = Object.fromEntries(blocs.map((b) => [b, []]));
let net61 = 0, opp61 = 0, oppArab61 = 0, netLarger = 0, first = {};
for (let i = 0; i < RUNS; i++) {
  const v = { ...base };
  const netShare = ids.filter((id) => bloc[id] === "net").reduce((a, id) => a + (v[id] ?? 0), 0);
  const swing = (leanUsed + randn() * blocSd) / KNESSET;
  for (const id of ids) if (id in v) v[id] *= bloc[id] === "net" ? 1 + swing / netShare : 1 - swing / (1 - netShare);
  for (const b of ["net", "opp"]) { const c = randn() * consolidateSd; const rest = ids.filter((id) => bloc[id] === b && id !== largest[b] && id in v); const tot = rest.reduce((a, id) => a + v[id], 0); for (const id of rest) v[id] -= c * v[id] / tot; v[largest[b]] += c; }
  for (const id of ids) if (id in v) v[id] = Math.max(0, v[id] + randn() * listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
  const s = allocate(v); const t = { net: 0, opp: 0, mid: 0, arab: 0 };
  for (const id of ids) { const n = s[id] ?? 0; seatRuns[id].push(n); t[bloc[id]] += n; }
  for (const b of blocs) blocRuns[b].push(t[b]);
  if (t.net >= MAJ) net61++; if (t.opp >= MAJ) opp61++; if (t.opp + t.arab + t.mid >= MAJ) oppArab61++; if (t.net > t.opp) netLarger++;
  const top = ids.reduce((a, id) => ((s[id] ?? 0) > (s[a] ?? 0) ? id : a)); first[top] = (first[top] ?? 0) + 1;
}
const q = (xs, f) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (x) => Math.round(x * 10) / 10, pct = (x) => Math.round((x / RUNS) * 100);
const point = allocate(central);
const lists = Object.fromEntries(ids.filter((id) => id in base).map((id) => [id, { share: Math.round(central[id] * 10000) / 100, point: point[id] ?? 0, mean: r1(mean(seatRuns[id])), lo: q(seatRuns[id], 0.05), hi: q(seatRuns[id], 0.95), passes: pct(seatRuns[id].filter((n) => n > 0).length) }]));
const blocOut = Object.fromEntries(blocs.map((b) => [b, { point: ids.filter((id) => bloc[id] === b).reduce((a, id) => a + (point[id] ?? 0), 0), mean: r1(mean(blocRuns[b])), lo: q(blocRuns[b], 0.05), hi: q(blocRuns[b], 0.95) }]));
const now = new Date();
const out = {
  generated: now.toISOString().slice(0, 10), generatedAt: now.toISOString(), final: FINAL, election: results.election, runs: RUNS, seed: SEED,
  method: "scripts/forecast/forecast.mjs; docs/research/polls-method/2026-10-23-forecast-algorithm.md",
  inputs: { field: field.map((p) => ({ id: p.id, pollster: p.pollster, published: p.published, n: p.n })), checks: checks.map((p) => ({ id: p.id, pollster: p.pollster, published: p.published })), agreements },
  parameters: { leanSeats: r1(leanUsed), fieldOnly: process.env.FILBER !== "1", historicalResidualSeats: r1(resid), blocSdSeats: r1(blocSd), listSdPointsAt8pct: r1(listSd * 1000) / 10, consolidateSdSeats: 1.5 },
  blocs: blocOut,
  majority: { net: pct(net61), oppZionist: pct(opp61), neither: 100 - pct(net61) - pct(opp61), oppWithArabAndMid: pct(oppArab61) },
  netLargerThanOpp: pct(netLarger),
  largestList: Object.fromEntries(Object.entries(first).map(([k, v]) => [k, pct(v)]).filter(([, v]) => v > 0)),
  lists,
  scoring: "Score on the official result: per-list absolute seat error of `point`; bloc absolute error of blocs.*.point; threshold calls right (passes >= 50 and passed, or < 50 and failed); whether the outcome with the highest probability in `majority` occurred. Compare with the two site averages scored the same way.",
};
if (!SENSITIVITY) {
  fs.writeFileSync("data/forecast.json", JSON.stringify(out, null, 2) + "\n");
  // The record: one entry per run whose inputs, parameters or figures changed.
  const historyFile = "data/forecast-history.json";
  const history = fs.existsSync(historyFile) ? read(historyFile) : { about: "Every forecast run that changed the figures, oldest first; the last entry is data/forecast.json. Scored together after the vote.", runs: [] };
  const entry = { generated: out.generated, generatedAt: out.generatedAt, final: out.final, polls: out.inputs.field.map((p) => p.id), parameters: out.parameters, blocs: Object.fromEntries(Object.entries(out.blocs).map(([b, v]) => [b, v.point])), majority: out.majority, largestList: out.largestList, lists: Object.fromEntries(Object.entries(out.lists).map(([id, l]) => [id, { point: l.point, passes: l.passes }])) };
  const last = history.runs.at(-1), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const changed = !last || !same({ ...last, generated: 0, generatedAt: 0, final: 0 }, { ...entry, generated: 0, generatedAt: 0, final: 0 }) || last.final !== entry.final;
  if (changed) history.runs.push(entry); else history.runs[history.runs.length - 1] = { ...last, generatedAt: entry.generatedAt, generated: entry.generated };
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2) + "\n");
  console.log(`${changed ? "figures changed: recorded" : "figures unchanged"}; ${history.runs.length} run${history.runs.length === 1 ? "" : "s"} on record${FINAL ? "; FINAL" : ""}`);
}
console.log(JSON.stringify({ parameters: out.parameters, blocs: out.blocs, majority: out.majority, netLargerThanOpp: out.netLargerThanOpp, largestList: out.largestList }));
console.table(Object.entries(lists).map(([id, l]) => ({ id, ...l })));
