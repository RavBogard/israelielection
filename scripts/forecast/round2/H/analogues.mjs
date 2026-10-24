// Round 2, agent H: new-list analogues. Poll means (final 7 and 28 days, every poll, Filber firms
// included and excluded) against the official result, from scripts/forecast/backtest/data/*.json.
// Usage: node scripts/forecast/round2/H/analogues.mjs
import { readFileSync } from 'node:fs';
const dir = new URL('../../backtest/data/', import.meta.url);
const cases = [
  ['2015-03', 'kulanu', 'Kulanu (Kahlon, new centre-right)'],
  ['2015-03', 'yachad', 'Yachad (Yishai, new right splinter)'],
  ['2019-04', 'bw', 'Kahol Lavan (Gantz-Lapid, new centre)'],
  ['2019-04', 'nr', 'New Right (Bennett-Shaked, new right)'],
  ['2019-04', 'zehut', 'Zehut (Feiglin, new right-libertarian)'],
  ['2019-04', 'gesher', 'Gesher (Levy-Abekasis, new)'],
  ['2019-04', 'kulanu', 'Kulanu (2nd run, falling)'],
  ['2019-09', 'yamina', 'Yamina (Shaked, re-merger)'],
  ['2021-03', 'yamina', 'Yamina (Bennett, 1st solo as Yamina)'],
  ['2021-03', 'nh', "New Hope (Sa'ar, new right splinter)"],
  ['2021-03', 'nep', 'New Economic (Zelekha, new)'],
  ['2022-11', 'nu', 'National Unity (Gantz-Sa\'ar-Eisenkot, new merger)'],
];
const seatsOf = (r) => (r == null ? null : r.belowThreshold ? 0 : r.seats);
const pctOf = (r, below) => (r == null ? null : r.belowThreshold ? (parseFloat(r.pct) || 2) : (r.seats / 120) * 100);
const fmt = (x, d = 1) => (x == null || Number.isNaN(x) ? '—' : (x >= 0 ? '' : '') + x.toFixed(d));
console.log('| Election | List | Polls 28d (7d) | Mean seats 28d | Mean seats 7d | Range 7d | Result seats | Result % | Miss vs 7d (seats) |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const [key, id, label] of cases) {
  const d = JSON.parse(readFileSync(new URL(`${key}.json`, dir)));
  const end = new Date(d.election);
  const rows = d.polls.filter((p) => p.results[id]).map((p) => ({ days: (end - new Date(p.published)) / 864e5, s: seatsOf(p.results[id]), filber: p.filber }));
  const r28 = rows.filter((r) => r.days <= 28), r7 = rows.filter((r) => r.days <= 7);
  const mean = (a) => (a.length ? a.reduce((x, r) => x + r.s, 0) / a.length : null);
  const res = d.result.lists[id];
  const m7 = mean(r7);
  const rng = r7.length ? `${Math.min(...r7.map((r) => r.s))}–${Math.max(...r7.map((r) => r.s))}` : '—';
  console.log(`| ${key} | ${label} | ${r28.length} (${r7.length}) | ${fmt(mean(r28))} | ${fmt(m7)} | ${rng} | ${res.seats} | ${res.pct.toFixed(2)} | ${fmt(res.seats - m7)} |`);
}
