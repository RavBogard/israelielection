/**
 * Round 2, agent D: what the blackout options do to today's 2026 forecast (data/polls.json, polls through 2026-10-22
 * only, per the brief's blind design), and the 2026 campaign's own volatility next to the historical one.
 *   node scripts/forecast/round2/D/run2026.mjs [runs]
 */
import fs from "node:fs";
import { forecast } from "./model-d.mjs";
import { forecast as forecastV2 } from "../../model.mjs";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const RUNS = Number(process.argv[2]) || 50_000;
const { polls: all, config } = read("data/polls.json");
const polls = all.filter((p) => p.published <= "2026-10-22");
const parties = (read("data/parties.json").parties ?? read("data/parties.json")).map((p) => ({ id: p.id, bloc: p.bloc }));
const results = read("data/results.json");
const cal = read("scripts/forecast/calibration.json");
const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
const S = { polls, config, parties, agreements, cal };
const E = "2026-10-27";

// The 2026 campaign's variogram, same method as backtest-d.mjs variogram() (field outlets only, pairs 1-21 days).
const F = forecast({ ...S, opts: { returnField: true, priors: false, windowDays: 40 } });
const ps = F.campaign.filter((p) => !F.isCheck(p) && p.published >= "2026-09-29"), sh = new Map(ps.map((p) => [p.id, F.shares(p)]));
const L = [], Bn = [];
const netOf = (p) => Object.entries(p.results).reduce((a, [id, r]) => a + (F.bloc[id] === "net" && !r.belowThreshold ? r.seats ?? 0 : 0), 0);
for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
  const a = ps[i], b = ps[j]; if (a.pollster !== b.pollster) continue;
  const dt = Math.abs(Date.parse(a.published) - Date.parse(b.published)) / 864e5; if (dt < 1 || dt > 21) continue;
  for (const id of F.ids) { const x = sh.get(a.id)[id], y = sh.get(b.id)[id]; if (x == null || y == null) continue; const m = Math.max(0.01, (x + y) / 2); L.push([dt, ((x - y) / Math.sqrt(m / 0.08) * 100) ** 2]); }
  Bn.push([dt, (netOf(a) - netOf(b)) ** 2]);
}
const fit = (pts) => { const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n; let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; } return { a: my - (sxy / sxx) * mx, q: sxy / sxx, n }; };
const fl = fit(L), fb = fit(Bn);
console.log(`2026 final 28 days, same-outlet pairs: lists n=${fl.n} a=${fl.a.toFixed(2)} pts², q=${fl.q.toFixed(3)} pts²/day (sd ${Math.sqrt(Math.max(0, fl.q)).toFixed(2)} per √day); Netanyahu bloc n=${fb.n} a=${fb.a.toFixed(2)} seats², q=${fb.q.toFixed(3)} seats²/day (sd ${Math.sqrt(Math.max(0, fb.q)).toFixed(2)} per √day)`);

const V = {
  "v2 (model.mjs)": null,
  "D: rw 0.17/0.37 beyond 4 days (recommended)": { rwListSdAt8: 0.17, rwBlocSd: 0.37, blackoutBaseline: 4 },
  "D: rw 0.17/0.37 over the whole gap": { rwListSdAt8: 0.17, rwBlocSd: 0.37 },
  "trend 14d, half": { trendDays: 14, trendDamp: 0.5 },
  "trend 7d": { trendDays: 7 },
};
const rows = [];
for (const [name, o] of Object.entries(V)) {
  const f = o ? forecast({ ...S, opts: { runs: RUNS, electionDate: E, ...o } }) : forecastV2({ ...S, opts: { runs: RUNS } });
  const L = f.lists;
  rows.push({ variant: name, gap: f.parameters.gapDays ?? "-", blocSd: f.parameters.blocSdSeats, net: `${f.blocs.net.point} (${f.blocs.net.lo}-${f.blocs.net.hi})`, opp: f.blocs.opp.point, "P(net≥61)": f.majority.net + "%",
    ...Object.fromEntries(Object.entries(L).filter(([, l]) => l.passes > 2 && l.passes < 98).map(([id, l]) => [`pass ${id}`, l.passes])),
    points: Object.entries(L).map(([id, l]) => `${id} ${l.point}`).join(" ") });
}
console.table(rows.map(({ points, ...r }) => r));
for (const r of rows) console.log(r.variant.padEnd(46), r.points);
