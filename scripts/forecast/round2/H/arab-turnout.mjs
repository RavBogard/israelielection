// Round 2, agent H: what Arab turnout do the 2026 polls (and v2) imply, and what would the analysts' figures give?
// One-parameter proportional model calibrated on 2022: Arab lists 10.70% of valid votes (H-T 3.75 + Ra'am 4.07 +
// Balad 2.90; backtest/data/2022-11.json) at Arab turnout 53.2% (IDI, https://en.idi.org.il/articles/47297).
// Arab-list votes scale with Arab turnout; all other votes scale with the ratio of non-Arab turnout to 2022's.
// s(Ta, r) = A*Ta/53.2 / (A*Ta/53.2 + (100-A)*r), A = 10.70. Seats ~ 120 * s / (1 - wasted), wasted ~ 7% (v2 runs).
// Usage: node scripts/forecast/round2/H/arab-turnout.mjs
import { readFileSync } from 'node:fs';
const f = JSON.parse(readFileSync(new URL('../../../../data/forecast.json', import.meta.url)));
const A = 10.70, T22 = 53.2;
const s = (Ta, r = 1) => (100 * (A * Ta / T22)) / (A * Ta / T22 + (100 - A) * r);
const inv = (target, r = 1) => { let lo = 20, hi = 90; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; s(m, r) < target ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
const L = f.lists;
const withPrior = L.jl.share + L.raam.share, polled = withPrior - L.jl.prior - L.raam.prior;
const seats = (x) => (120 * x / 100 / 0.93).toFixed(1);
console.log(`v2 Arab-list share: polled field ${polled.toFixed(2)}%, with v2 priors ${withPrior.toFixed(2)}%`);
for (const r of [1, 1.03]) {
  console.log(`\nnon-Arab turnout ratio to 2022 = ${r}  (1.03 ~ overall turnout 72-73% instead of 70.6%)`);
  console.log(`  implied Arab turnout: polls alone ${inv(polled, r).toFixed(1)}%, v2 with priors ${inv(withPrior, r).toFixed(1)}%`);
  for (const Ta of [53.2, 56, 60, 63, 66, 69]) console.log(`  Arab turnout ${Ta}% -> Arab lists ${s(Ta, r).toFixed(2)}% ≈ ${seats(s(Ta, r))} seats`);
}
