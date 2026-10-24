/**
 * Round 2, agent D: the blackout gap, described. For each election in scripts/forecast/backtest/data (final 28 days):
 *  1. the final field (model.mjs's selection: latest poll per outlet within 7 days of the newest, Filber firms out)
 *     against the result, per list (vote-share points and seats) and per bloc (seats);
 *  2. the same field rebuilt as it stood 7 and 14 days before the newest poll, and the movement since;
 *  3. a variogram of same-outlet poll pairs: E[(y_t − y_s)²] = 2σ²_sampling + q·|t − s|, so q is the random-walk
 *     variance per day of the true series (per list at an 8% share, and the Netanyahu bloc in seats);
 *  4. each poll's own error against the result by age and day of week (Friday polls vs earlier in the week).
 *   node scripts/forecast/round2/D/analyze.mjs
 */
import { forecast } from "./model-d.mjs";
import { allElections as elections, setup, DATA, VDAYS } from "./backtest-d.mjs";
console.log(`data: scripts/forecast/backtest/${DATA}/ (${elections.map((e) => e.key).join(", ")}); variogram and per-poll window ${VDAYS} days`);

const DAY = 864e5, B = ["net", "opp", "mid", "arab"];
const rms = (xs) => Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length);
const mean = (xs) => xs.reduce((a, x) => a + x, 0) / xs.length;
const f2 = (x) => x.toFixed(2);
const dow = (d) => new Date(d + "T12:00:00Z").getUTCDay(); // 5 = Friday

/** Seats a poll gives each list (a combined cell split evenly). */
function pollSeats(p, ids) {
  const s = Object.fromEntries(ids.map((id) => [id, null]));
  for (const [id, r] of Object.entries(p.results)) if (id in s) s[id] = r.belowThreshold ? 0 : r.seats ?? 0;
  for (const c of p.combined) { const xs = c.parties.filter((x) => x in s); for (const x of xs) s[x] = c.seats / xs.length; }
  return s;
}
function fieldAt(e, asOf) {
  const S = setup(e);
  const F = forecast({ ...S, opts: { asOf, returnField: true, priors: false } });
  const ids = F.ids;
  // weighted seats too, with the same weights and the same median imputation for omitted lists
  const per = F.field.map((p) => ({ w: F.weight(p), s: pollSeats(p, ids) }));
  for (const id of ids) { const xs = per.map((x) => x.s[id]).filter((v) => v != null).sort((a, b) => a - b); const m = xs.length ? xs[xs.length >> 1] : 0; for (const x of per) if (x.s[id] == null) x.s[id] = m; }
  const W = per.reduce((a, x) => a + x.w, 0);
  const seats = Object.fromEntries(ids.map((id) => [id, per.reduce((a, x) => a + x.w * x.s[id], 0) / W]));
  return { F, ids, share: F.base, seats, newest: F.campaign[0].published, n: F.field.length };
}
const resShare = (e, id) => (e.result.lists[id]?.pct ?? 0) / 100;
const resSeats = (e, id) => e.result.lists[id]?.seats ?? 0;
const blocOf = (e, v) => { const t = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of Object.keys(e.lists)) t[e.blocs[id]] += v[id] ?? 0; return t; };
const shift = (d, k) => new Date(Date.parse(d) - k * DAY).toISOString().slice(0, 10);

// ---- 1 & 2. Final gap vs earlier fields --------------------------------------------------------------------------
console.log("\n1-2. Final field vs result, and the field's own movement over the final 7 and 14 days (lists: RMS; blocs: Netanyahu bloc signed)");
const T1 = [], pooled = { g: [], m7: [], m14: [], g14: [], gs: [], m7s: [], scaled: [], scaledM7: [], scaledM14: [] };
for (const e of elections) {
  const fin = fieldAt(e, null), gapDays = (Date.parse(e.election) - Date.parse(fin.newest)) / DAY;
  const d7 = fieldAt(e, shift(fin.newest, 7)), d14 = fieldAt(e, shift(fin.newest, 14));
  const ids = fin.ids;
  const G = ids.map((id) => resShare(e, id) - fin.share[id]), M7 = ids.map((id) => fin.share[id] - d7.share[id]), M14 = ids.map((id) => fin.share[id] - d14.share[id]);
  const Gs = ids.map((id) => resSeats(e, id) - fin.seats[id]), M7s = ids.map((id) => fin.seats[id] - d7.seats[id]), M14s = ids.map((id) => fin.seats[id] - d14.seats[id]);
  const G14 = ids.map((id) => resShare(e, id) - d14.share[id]);
  // normalised to an 8% share (the model's √share scaling)
  const sc = (x, id) => x / Math.sqrt(Math.max(0.01, fin.share[id]) / 0.08);
  ids.forEach((id, i) => { pooled.g.push(G[i]); pooled.m7.push(M7[i]); pooled.m14.push(M14[i]); pooled.g14.push(G14[i]); pooled.gs.push(Gs[i]); pooled.m7s.push(M7s[i]);
    pooled.scaled.push(sc(G[i], id)); pooled.scaledM7.push(sc(M7[i], id)); pooled.scaledM14.push(sc(M14[i], id)); });
  const bF = blocOf(e, fin.seats), b7 = blocOf(e, d7.seats), b14 = blocOf(e, d14.seats), bR = blocOf(e, Object.fromEntries(ids.map((id) => [id, resSeats(e, id)])));
  T1.push({ election: e.key, gapDays, fieldN: fin.n, "gap pts RMS": f2(rms(G) * 100), "gap seats MAE": f2(mean(Gs.map(Math.abs))), "move7 pts RMS": f2(rms(M7) * 100), "move14 pts RMS": f2(rms(M14) * 100),
    "move7 seats MAE": f2(mean(M7s.map(Math.abs))), "net gap": f2(bR.net - bF.net), "net move7": f2(bF.net - b7.net), "net move14": f2(bF.net - b14.net),
    "bloc gap MAE": f2(mean(B.map((b) => Math.abs(bR[b] - bF[b])))), "bloc move7 MAE": f2(mean(B.map((b) => Math.abs(bF[b] - b7[b])))) });
}
console.table(T1);
const reg = (y, x) => { const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; } const b = sxy / sxx; const r = sxy / Math.sqrt(sxx * y.reduce((a, v) => a + (v - my) ** 2, 0)); return { b, r }; };
const r7 = reg(pooled.g, pooled.m7), r14 = reg(pooled.g, pooled.m14), rr = reg(pooled.g, pooled.g14);
console.log(`pooled lists n=${pooled.g.length}: RMS final gap ${f2(rms(pooled.g) * 100)} pts; RMS 7-day move ${f2(rms(pooled.m7) * 100)}; RMS 14-day move ${f2(rms(pooled.m14) * 100)}`);
console.log(`  at an 8% share: RMS gap ${f2(rms(pooled.scaled) * 100)} pts; RMS move7 ${f2(rms(pooled.scaledM7) * 100)}; move14 ${f2(rms(pooled.scaledM14) * 100)}`);
console.log(`  momentum test, gap on the field's last-7-day move: slope ${f2(r7.b)} (r ${f2(r7.r)}); on last-14-day move: slope ${f2(r14.b)} (r ${f2(r14.r)})  [slope 4/7≈0.57 or 4/14≈0.29 = the trend continues]`);
console.log(`  persistence: final gap on the gap of the field 14 days earlier: slope ${f2(rr.b)} (r ${f2(rr.r)}); RMS gap then ${f2(rms(pooled.g14) * 100)} pts vs now ${f2(rms(pooled.g) * 100)}`);
// per election momentum sign
const perE = elections.map((e) => { const fin = fieldAt(e, null), d7 = fieldAt(e, shift(fin.newest, 7)), d14 = fieldAt(e, shift(fin.newest, 14));
  const g = fin.ids.map((id) => resShare(e, id) - fin.share[id]); return { election: e.key, "slope on move7": f2(reg(g, fin.ids.map((id) => fin.share[id] - d7.share[id])).b), "slope on move14": f2(reg(g, fin.ids.map((id) => fin.share[id] - d14.share[id])).b) }; });
console.table(perE);

// ---- 2b. The largest misses, and each bloc leader's miss now and 14 days earlier ------------------------------------
console.log("\n2b. Largest per-list gaps (result − final field, points) with the field's 7- and 14-day moves; bloc leaders");
for (const e of elections) {
  const fin = fieldAt(e, null), d7 = fieldAt(e, shift(fin.newest, 7)), d14 = fieldAt(e, shift(fin.newest, 14));
  const g = (f, id) => (resShare(e, id) - f.share[id]) * 100;
  const rows = fin.ids.map((id) => ({ id, gap: g(fin, id), m7: (fin.share[id] - d7.share[id]) * 100, m14: (fin.share[id] - d14.share[id]) * 100 })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 4);
  const leaders = ["net", "opp"].map((b) => { const top = fin.ids.filter((id) => e.blocs[id] === b).sort((x, y) => fin.share[y] - fin.share[x])[0]; return `${b} leader ${top} ${f2(g(fin, top))} (14d earlier ${f2(g(d14, top))})`; });
  console.log(e.key, rows.map((r) => `${r.id} ${f2(r.gap)} [${f2(r.m7)}, ${f2(r.m14)}]`).join("; "), "|", leaders.join("; "));
}

// ---- 3. Variogram of same-outlet pairs ---------------------------------------------------------------------------
console.log("\n3. Same-outlet pairs, final 28 days: E[d²] = a + q·Δt (lists scaled to an 8% share; the Netanyahu bloc in seats)");
const fit = (pts) => { const x = pts.map((p) => p[0]), y = pts.map((p) => p[1]); const { b } = reg(y, x); return { a: mean(y) - b * mean(x), q: b, n: pts.length }; };
const allL = [], allB = [], VT = [];
for (const e of elections) {
  const S = setup(e), F = forecast({ ...S, opts: { returnField: true, priors: false, windowDays: 40 } });
  const from = new Date(Date.parse(e.election) - VDAYS * 864e5).toISOString().slice(0, 10);
  const polls = F.campaign.filter((p) => !F.isCheck(p) && p.published >= from), ids = F.ids;
  const sh = new Map(polls.map((p) => [p.id, F.shares(p)]));
  const ptsL = [], ptsB = [];
  for (let i = 0; i < polls.length; i++) for (let j = i + 1; j < polls.length; j++) {
    const a = polls[i], b = polls[j]; if (a.pollster !== b.pollster) continue;
    const dt = Math.abs(Date.parse(a.published) - Date.parse(b.published)) / DAY; if (dt < 1 || dt > 21) continue;
    const sa = sh.get(a.id), sb = sh.get(b.id);
    for (const id of ids) { if (sa[id] == null || sb[id] == null) continue; const m = Math.max(0.01, (sa[id] + sb[id]) / 2); ptsL.push([dt, ((sa[id] - sb[id]) / Math.sqrt(m / 0.08) * 100) ** 2]); }
    const na = blocOf(e, pollSeats(a, ids)).net, nb = blocOf(e, pollSeats(b, ids)).net; ptsB.push([dt, (na - nb) ** 2]);
  }
  allL.push(...ptsL); allB.push(...ptsB);
  const fl = fit(ptsL), fb = fit(ptsB);
  VT.push({ election: e.key, listPairs: fl.n, "list a (pts²)": f2(fl.a), "list q (pts²/day)": fl.q.toFixed(3), blocPairs: fb.n, "net a (seats²)": f2(fb.a), "net q (seats²/day)": fb.q.toFixed(3) });
}
const FL = fit(allL), FB = fit(allB);
VT.push({ election: "pooled", listPairs: FL.n, "list a (pts²)": f2(FL.a), "list q (pts²/day)": FL.q.toFixed(3), blocPairs: FB.n, "net a (seats²)": f2(FB.a), "net q (seats²/day)": FB.q.toFixed(3) });
console.table(VT);
// binned
const bins = [[1, 3], [4, 7], [8, 14], [15, 21]];
console.log("binned mean d²:", bins.map(([lo, hi]) => { const l = allL.filter((p) => p[0] >= lo && p[0] <= hi), b = allB.filter((p) => p[0] >= lo && p[0] <= hi); return `${lo}-${hi}d: list ${f2(mean(l.map((p) => p[1])))} pts² (n ${l.length}), net ${f2(mean(b.map((p) => p[1])))} seats² (n ${b.length})`; }).join("; "));
const q4L = Math.max(0, FL.q) * 4, q4B = Math.max(0, FB.q) * 4;
console.log(`random walk over a 4-day blackout: list sd ${f2(Math.sqrt(q4L))} pts at 8% (${f2(Math.sqrt(Math.max(0, FL.q)))} per √day); Netanyahu bloc sd ${f2(Math.sqrt(q4B))} seats (${f2(Math.sqrt(Math.max(0, FB.q)))} per √day)`);
console.log(`  share of the observed final gap variance at 8% (${f2(rms(pooled.scaled) * 100)}² = ${f2((rms(pooled.scaled) * 100) ** 2)} pts²) that a 4-day walk explains: ${(q4L / (rms(pooled.scaled) * 100) ** 2 * 100).toFixed(0)}%`);

// ---- 4. Each poll's own error by age and day of week -------------------------------------------------------------
console.log("\n4. Each poll's error against the result, by age (days before the vote) and day of week (Filber firms out)");
const P = [];
for (const e of elections) {
  const ids = Object.keys(e.lists), S = setup(e), F = forecast({ ...S, opts: { returnField: true, priors: false, windowDays: 40 } });
  const res = Object.fromEntries(ids.map((id) => [id, resSeats(e, id)])), rb = blocOf(e, res);
  for (const p of F.campaign.filter((q) => !F.isCheck(q) && (Date.parse(e.election) - Date.parse(q.published)) / DAY <= VDAYS)) {
    const s = pollSeats(p, ids); for (const id of ids) if (s[id] == null) s[id] = 0;
    const tot = ids.reduce((a, id) => a + s[id], 0); if (tot < 110) continue; // partial tables
    const pb = blocOf(e, s);
    P.push({ e: e.key, pollster: p.pollster, age: (Date.parse(e.election) - Date.parse(p.published)) / DAY, dow: dow(p.published), mae: mean(ids.map((id) => Math.abs(s[id] - res[id]))), net: rb.net - pb.net, bloc: mean(B.map((b) => Math.abs(rb[b] - pb[b]))) });
  }
}
const grp = (rows) => ({ n: rows.length, listMAE: f2(mean(rows.map((r) => r.mae))), netSigned: f2(mean(rows.map((r) => r.net))), netAbs: f2(mean(rows.map((r) => Math.abs(r.net)))), blocMAE: f2(mean(rows.map((r) => r.bloc))) });
console.table({ "age 3-4 (final Fri/Sat)": grp(P.filter((r) => r.age <= 4)), "age 5-7": grp(P.filter((r) => r.age > 4 && r.age <= 7)), "age 8-14": grp(P.filter((r) => r.age > 7 && r.age <= 14)), "age 15-21": grp(P.filter((r) => r.age > 14 && r.age <= 21)), "age 22-28": grp(P.filter((r) => r.age > 21 && r.age <= 28)), ...(VDAYS > 28 ? { [`age 29-${VDAYS}`]: grp(P.filter((r) => r.age > 28)) } : {}) });
// within-outlet slope of error on age (outlet-election fixed effects)
const fe = (key) => { const g = {}; for (const r of P) (g[r.e + "|" + r.pollster] ??= []).push(r); let sxy = 0, sxx = 0; for (const rows of Object.values(g)) { if (rows.length < 2) continue; const ma = mean(rows.map((r) => r.age)), my = mean(rows.map(key)); for (const r of rows) { sxy += (r.age - ma) * (key(r) - my); sxx += (r.age - ma) ** 2; } } return sxy / sxx; };
console.log(`within-outlet change in error per day of age: list MAE ${fe((r) => r.mae).toFixed(4)} seats/day; |net| ${fe((r) => Math.abs(r.net)).toFixed(4)} seats/day; bloc MAE ${fe((r) => r.bloc).toFixed(4)} seats/day`);
// Friday vs earlier in the final week, paired within outlet
const final = P.filter((r) => r.age <= 8);
const pairs = [];
const byOut = {}; for (const r of final) (byOut[r.e + "|" + r.pollster] ??= []).push(r);
for (const rows of Object.values(byOut)) { const fri = rows.filter((r) => r.dow === 5), early = rows.filter((r) => r.dow !== 5 && r.age > 4); if (fri.length && early.length) pairs.push({ fri: fri[0], early: early.sort((a, b) => a.age - b.age)[0] }); }
console.log(`final week: Friday polls ${JSON.stringify(grp(final.filter((r) => r.dow === 5)))}; Sun-Thu polls ${JSON.stringify(grp(final.filter((r) => r.dow !== 5)))}`);
console.log(`paired within outlet (${pairs.length} outlet-elections with a Friday poll and an earlier final-week poll): Friday list MAE ${f2(mean(pairs.map((p) => p.fri.mae)))} vs earlier ${f2(mean(pairs.map((p) => p.early.mae)))}; |net| ${f2(mean(pairs.map((p) => Math.abs(p.fri.net))))} vs ${f2(mean(pairs.map((p) => Math.abs(p.early.net))))}; Friday better in ${pairs.filter((p) => p.fri.mae < p.early.mae).length}, worse in ${pairs.filter((p) => p.fri.mae > p.early.mae).length}`);
console.table(elections.map((e) => { const fr = final.filter((r) => r.e === e.key && r.dow === 5), ot = final.filter((r) => r.e === e.key && r.dow !== 5); return { election: e.key, fridayN: fr.length, fridayMAE: fr.length ? f2(mean(fr.map((r) => r.mae))) : "-", earlierN: ot.length, earlierMAE: ot.length ? f2(mean(ot.map((r) => r.mae))) : "-", fridayNet: fr.length ? f2(mean(fr.map((r) => r.net))) : "-", earlierNet: ot.length ? f2(mean(ot.map((r) => r.net))) : "-" }; }));
