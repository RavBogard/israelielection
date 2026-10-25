/**
 * Sector poll-to-result gaps (round 2, agent D2). For each election, the final-week field exactly as
 * scripts/forecast/model.mjs selects it (latest poll per outlet within 7 days of the newest poll, the
 * Filber-firm outlets left out, two outlets of one firm sharing its weight) against the official result,
 * for four groups: the Arab lists, Shas + UTJ, the rest of the Netanyahu bloc, the Zionist opposition, and the
 * lists in neither camp ("mid").
 *
 *   node scripts/forecast/round2/D2/gaps.mjs            # print tables
 *   node scripts/forecast/round2/D2/gaps.mjs --write    # also write scripts/forecast/round2/data/sector-gaps.json
 *
 * Seats: the field's weighted mean seats per list (a list below the threshold counts 0; a cell spanning lists
 * is split equally, as model.mjs does). Vote share: model.mjs's own seats-to-shares conversion (threshold-aware
 * D'Hondt midpoint, sub-threshold lists at their printed %), read from forecast() with the lean, priors and
 * withdrawals switched off and the model's 1.5% fringe kept, so poll shares are on the result's denominator
 * (all valid votes). Result share: votes / valid votes from the backtest file.
 * Data: scripts/forecast/backtest/data/<key>.json (28-day files); 2013 from
 * scripts/forecast/backtest/data-full/2013-01.json when that file exists (same schema), else skipped.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast, pctOf } from "../../model.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "../../");
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const cal = read(path.join(root, "calibration.json"));
const files = fs.readdirSync(path.join(root, "backtest/data")).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(root, "backtest/data", f));
const f2013 = path.join(root, "backtest/data-full/2013-01.json");
if (fs.existsSync(f2013)) files.unshift(f2013);

const HAREDI = new Set(["shas", "utj"]);
const groupOf = (e, id) => (HAREDI.has(id) ? "haredi" : e.blocs[id] === "arab" ? "arab" : e.blocs[id] === "net" ? "netExHaredi" : e.blocs[id]);
const GROUPS = ["arab", "haredi", "netExHaredi", "opp", "mid"];
const r2 = (x) => Math.round(x * 100) / 100;

function gaps(e) {
  // A 28-day file in model.mjs's own terms; for a full-campaign file, keep the final 28 days so the selection is the same.
  const polls = e.polls.filter((p) => Date.parse(e.election) - Date.parse(p.published) <= 28 * 864e5);
  const pollsters = [...new Set(polls.map((p) => p.pollster))];
  const filber = [...new Set(polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const config = { pollsters, withoutVariant: { pollsters: filber }, currentWindowDays: 14 };
  const c = { ...cal, elections: [], listPriors: {}, withdrawn: { lists: [] } };
  const f = forecast({ polls, config, parties, agreements: e.agreements, cal: c, opts: { runs: 200, priors: false, lean: 0, withdrawn: false } });
  const byId = Object.fromEntries(polls.map((p) => [p.id, p]));
  const field = f.inputs.field.map((x) => ({ p: byId[x.id], w: x.weight }));
  const W = field.reduce((a, x) => a + x.w, 0);
  const seats = Object.fromEntries(Object.keys(e.lists).map((id) => [id, 0]));
  for (const { p, w } of field) {
    for (const [id, r] of Object.entries(p.results)) if (id in seats) seats[id] += (w / W) * (r.belowThreshold ? 0 : r.seats ?? 0);
    for (const cb of p.combined ?? []) { const xs = cb.parties.filter((x) => x in seats); for (const x of xs) seats[x] += (w / W) * cb.seats / xs.length; }
  }
  // Shares for an election whose threshold is not model.mjs's 3.25% (2013: 2%): the same conversion as model.mjs
  // shares() (threshold-aware D'Hondt midpoint, sub-threshold lists at their printed %, else 2%, then the field mean
  // renormalised to 1 - fringe), with the election's own threshold as the floor. Checked equal to forecast() below.
  const own = ownShares(e, field, polls);
  if (e.threshold === 0.0325) for (const id of Object.keys(e.lists)) if (Math.abs((own[id] ?? 0) - (f.lists[id]?.share ?? 0)) > 0.011) throw new Error(`share mismatch ${e.key} ${id}: ${own[id]} vs ${f.lists[id]?.share}`);
  const pollShare = (id) => (e.threshold === 0.0325 ? f.lists[id]?.share ?? 0 : own[id] ?? 0);
  const res = e.result.lists;
  const lists = Object.fromEntries(Object.keys(e.lists).map((id) => [id, {
    group: groupOf(e, id), pollSeats: r2(seats[id]), resultSeats: res[id]?.seats ?? 0, seatGap: r2((res[id]?.seats ?? 0) - seats[id]),
    pollPct: r2(pollShare(id)), resultPct: r2(res[id]?.pct ?? 0), pctGap: r2((res[id]?.pct ?? 0) - pollShare(id)),
  }]));
  const groups = {};
  for (const g of GROUPS) {
    const ids = Object.keys(lists).filter((id) => lists[id].group === g);
    if (!ids.length) continue;
    const s = (k) => r2(ids.reduce((a, id) => a + lists[id][k], 0));
    groups[g] = { lists: ids, pollSeats: s("pollSeats"), resultSeats: s("resultSeats"), seatGap: r2(s("resultSeats") - s("pollSeats")), pollPct: s("pollPct"), resultPct: s("resultPct"), pctGap: r2(s("resultPct") - s("pollPct")) };
  }
  const notPolled = r2(100 - Object.keys(e.lists).reduce((a, id) => a + (res[id]?.pct ?? 0), 0));
  return {
    election: e.election, key: e.key, source: path.relative(path.join(root, "../.."), files.find((x) => read(x).key === e.key)),
    field: f.inputs.field.map((x) => ({ pollster: x.pollster, firm: x.firm ?? null, published: x.published, weight: x.weight })),
    excludedFilber: f.inputs.checks.map((x) => ({ pollster: x.pollster, published: x.published })),
    groups, lists, resultShareOfUnpolledLists: notPolled,
  };
}

function ownShares(e, field, polls) {
  const T = e.threshold, ids = Object.keys(e.lists), FR = cal.fringe.share;
  const campaign = polls.filter((p) => p.kind !== "exit").sort((a, b) => b.published.localeCompare(a.published));
  const cutoff = Date.parse(campaign[0].published) - 7 * 864e5;
  const isBelow = (r) => r && (r.belowThreshold || r.seats === 0);
  const printedBy = (p, id) => { for (const q of campaign) if (q.pollster === p.pollster && q.published <= p.published && Date.parse(q.published) >= cutoff) { const r = q.results[id]; if (isBelow(r) && pctOf(r.pct) != null) return pctOf(r.pct); } return null; };
  const printedByOthers = (id) => { const xs = field.map(({ p }) => p.results[id]).filter(isBelow).map((r) => pctOf(r.pct)).filter((x) => x != null).sort((a, b) => a - b); return xs.length ? xs[xs.length >> 1] : null; };
  const per = field.map(({ p, w }) => {
    const s = {}; let below = 0; const pass = [];
    for (const [id, r] of Object.entries(p.results)) {
      if (!ids.includes(id)) { if (r.belowThreshold || r.seats === 0) below += pctOf(r.pct) ?? 0; continue; }
      if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBy(p, id) ?? printedByOthers(id) ?? 0.02; below += s[id]; } else pass.push([id, r.seats]);
    }
    for (const c of p.combined ?? []) pass.push([c.parties.filter((x) => ids.includes(x)).join("|"), c.seats]);
    const P = 1 - below; let lam = P / pass.reduce((a, [, k]) => a + k + 0.5, 0);
    const at = (k) => (Math.max(T, k * lam) + (k + 1) * lam) / 2;
    for (let it = 0; it < 60; it++) lam *= P / pass.reduce((a, [, k]) => a + at(k), 0);
    for (const [id, k] of pass) { const v = at(k); const xs = id.split("|"); for (const x of xs) s[x] = v / xs.length; }
    return { w, s };
  });
  for (const id of ids) { const xs = per.map((x) => x.s[id]).filter((v) => v != null).sort((a, b) => a - b); const med = xs.length ? xs[xs.length >> 1] : 0; for (const x of per) if (x.s[id] == null) x.s[id] = med; }
  const base = {}; for (const id of ids) { let a = 0, W = 0; for (const x of per) { a += x.w * x.s[id]; W += x.w; } base[id] = W ? a / W : 0; }
  const t = Object.values(base).reduce((a, b) => a + b, 0); for (const id of ids) base[id] = (base[id] * (1 - FR)) / t * 100;
  return base;
}

const out = files.map((fp) => gaps(read(fp)));
for (const o of out) {
  console.log(`\n${o.key}  field: ${o.field.map((x) => `${x.pollster} ${x.published.slice(5)}`).join(", ")}${o.excludedFilber.length ? `  (excluded: ${o.excludedFilber.map((x) => x.pollster).join(", ")})` : ""}`);
  console.table(Object.fromEntries(Object.entries(o.groups).map(([g, v]) => [g, { pollSeats: v.pollSeats, resultSeats: v.resultSeats, seatGap: v.seatGap, pollPct: v.pollPct, resultPct: v.resultPct, pctGap: v.pctGap }])));
  console.log(`  Shas: seats ${o.lists.shas.pollSeats} -> ${o.lists.shas.resultSeats} (${o.lists.shas.seatGap >= 0 ? "+" : ""}${o.lists.shas.seatGap}), pct ${o.lists.shas.pctGap >= 0 ? "+" : ""}${o.lists.shas.pctGap}; UTJ: seats ${o.lists.utj.seatGap >= 0 ? "+" : ""}${o.lists.utj.seatGap}, pct ${o.lists.utj.pctGap >= 0 ? "+" : ""}${o.lists.utj.pctGap}; result share of unpolled lists ${o.resultShareOfUnpolledLists}%`);
}
if (process.argv.includes("--write")) {
  const doc = {
    about: "Final-week poll field vs official result by sector group, per election. Field = model.mjs's selection (latest poll per outlet within 7 days of the newest; Direct Polls / Filber-firm outlets excluded; outlets of one firm share its weight). Seats: weighted mean of the field's printed seats (sub-threshold = 0). Poll %: model.mjs's seats-to-shares conversion with the model's 1.5% fringe for unpolled lists (lean, priors off). Result %: votes / all valid votes. Gap = result minus polls. Groups: arab = Arab-led lists; haredi = Shas + UTJ; netExHaredi = the rest of the Netanyahu bloc as the backtest files draw it; opp = Zionist opposition; mid = lists in neither camp. Generated by scripts/forecast/round2/D2/gaps.mjs --write; do not edit by hand.",
    sources: {
      polls_and_results: "scripts/forecast/backtest/data/<key>.json (English Wikipedia opinion-polling pages and election articles, read 2026-10-23; see scripts/forecast/backtest/README.md for each URL)",
      y2013: fs.existsSync(f2013) ? "scripts/forecast/backtest/data-full/2013-01.json (agent D1), final 28 days" : "not included: scripts/forecast/backtest/data-full/2013-01.json did not exist when this was generated; see docs/research/polls-method/round2/D2-sector-data.md for a hand-computed 2013 row",
      method: "scripts/forecast/model.mjs forecast() field selection and shares()",
    },
    generated: new Date().toISOString().slice(0, 10),
    elections: out,
  };
  fs.writeFileSync(path.join(root, "round2/data/sector-gaps.json"), JSON.stringify(doc, null, 1) + "\n");
  console.log("\nwrote scripts/forecast/round2/data/sector-gaps.json");
}
