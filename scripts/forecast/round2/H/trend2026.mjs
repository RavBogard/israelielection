// Round 2, agent H: 2026 campaign trajectory per list, field pollsters only (Channel 14 and i24NEWS out),
// mean seats by phase; data/polls.json (62 polls through 2026-10-22). Sub-threshold = 0 seats.
// Usage: node scripts/forecast/round2/H/trend2026.mjs
import { readFileSync } from 'node:fs';
const { polls, config } = JSON.parse(readFileSync(new URL('../../../../data/polls.json', import.meta.url)));
const out = new Set(config.withoutVariant.pollsters);
const phases = [['Sep 6–25', '2026-09-06', '2026-09-25'], ['Sep 26–Oct 12', '2026-09-26', '2026-10-12'], ['Oct 13–22', '2026-10-13', '2026-10-22']];
const ids = ['likud','otzma','shas','utj','rz','poi','noam','yashar','byachad','dem','yb','bw','res','jl','raam'];
const rows = {};
for (const [name, a, b] of phases) {
  const ps = polls.filter((p) => !out.has(p.pollster) && p.published >= a && p.published <= b);
  rows[name] = { n: ps.length };
  for (const id of ids) {
    const v = ps.filter((p) => p.results[id]).map((p) => (p.results[id].belowThreshold ? 0 : p.results[id].seats));
    rows[name][id] = v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(1) + (v.length < ps.length ? `(${v.length})` : '') : '—';
  }
}
console.log('| List | ' + phases.map((p) => `${p[0]} (n=${rows[p[0]].n})`).join(' | ') + ' |');
console.log('|---|' + phases.map(() => '---').join('|') + '|');
for (const id of ids) console.log(`| ${id} | ` + phases.map((p) => rows[p[0]][id]).join(' | ') + ' |');
// undecided / pct fields present?
const keys = new Set(); polls.forEach((p) => Object.keys(p).forEach((k) => keys.add(k)));
console.log('\npoll fields:', [...keys].join(', '));
const firms = {}; polls.forEach((p) => { const k = p.pollster + ' / ' + (p.firm || '?'); firms[k] = firms[k] || []; firms[k].push(p.n); });
for (const [k, ns] of Object.entries(firms)) console.log(k, 'polls', ns.length, 'n:', ns.filter(Boolean).length ? `${Math.min(...ns.filter(Boolean))}–${Math.max(...ns.filter(Boolean))}` : 'none');
