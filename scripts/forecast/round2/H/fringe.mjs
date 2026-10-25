// Round 2, agent H: share of valid votes won by lists outside the ones the final polls report separately
// (the "fringe"), per election, from scripts/forecast/backtest/data/*.json (result.validVotes is the sum of all
// lists' votes; result.lists holds the polled lists only). Also: wasted share (all lists that failed the threshold).
// Usage: node scripts/forecast/round2/H/fringe.mjs
import { readFileSync, readdirSync } from 'node:fs';
const dir = new URL('../../backtest/data/', import.meta.url);
console.log('| Election | Valid votes | Polled lists | Fringe share (unpolled lists) | Polled lists that failed | Total wasted (approx) | Threshold in votes |');
console.log('|---|---|---|---|---|---|---|');
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(new URL(f, dir)));
  const L = Object.values(d.result.lists);
  const polled = L.reduce((s, r) => s + r.votes, 0);
  const fringe = 1 - polled / d.result.validVotes;
  const failed = L.filter((r) => !r.passed).reduce((s, r) => s + r.votes, 0) / d.result.validVotes;
  console.log(`| ${d.key} | ${d.result.validVotes.toLocaleString('en')} | ${L.length} | ${(100 * fringe).toFixed(2)}% | ${(100 * failed).toFixed(2)}% | ${(100 * (fringe + failed)).toFixed(2)}% | ${Math.ceil(d.result.validVotes * d.threshold).toLocaleString('en')} |`);
}
