# G. Uncertainty structure and calibration of the simulation

Round 2, agent G. Written 2026-10-24 (Saturday), three days before the vote. Scope: the noise of step 8 of
`scripts/forecast/model.mjs` (version 2), the lean and its width (step 5), and the seats-from-shares and `point`
steps (7 and 9): is the simulation calibrated, what covariance do the past misses support, and what should version 3
draw. Builds on round 1's statistical review (`round1/F-review.md`, F3, F5 and F6).

Data: the six elections in `scripts/forecast/backtest/data/` (final 28 days). `backtest/data-full/` (agent D1) did
not exist when this work was done, so nothing here uses full campaigns or 2013. No 2026 poll after Oct 22 was seen;
the 2026 runs use the 62 polls in `data/polls.json`.

All code is in `scripts/forecast/round2/G/`. `model-g.mjs` is `model.mjs` plus switches; with default options it
reproduces `model.mjs` exactly (same seed, same draws) on the six elections and on 2026 (`node check-repro.mjs`).
Every table below names its script; each runs in seconds to two minutes with `node <script>` from that folder.

## Summary

1. **The lists are calibrated; the blocs are too wide.** Leave-future-out, version 2's per-list predictive
   distributions are about right: the randomised PIT puts 88.7% of the 71 list results inside the 90% interval and
   53% inside the 50% one, and the RMS z-score of list shares is 1.02. (The integer intervals the site prints read 93%
   and 76%, but only because an inclusive interval on whole seats covers more than its nominal level.) P(pass) is well
   calibrated (Brier 0.045, reliability table in Q2). **The Netanyahu-bloc distribution is too wide by about 1.7×.**
   All 24 bloc results fell inside their 90% intervals, and all six Netanyahu-bloc results fell between the 31st and
   66th percentiles (probability about 0.003 if the distribution were calibrated). The simulated bloc sd is 3.6 to 4.7
   seats, against a realised RMS error of 2.0 seats for the bloc point.
2. **The cause is the floor and doubling in `blocSd = max(3, 2 × residual)`.** The lean's leave-future-out
   residuals have RMS 1.58 seats. The predictive distribution of the next miss, given n past misses with unknown mean
   and spread, is a Student t with n − 1 degrees of freedom and scale s·√(1 + 1/n). For 2026 that is t₅ with scale
   1.65 seats (sd 2.1), not N(0, 3.1). This is the only change v3 needs in step 8.
3. **Covariance (Q1).** 85% of the list-level residual variance lies *within* blocs and 15% in bloc totals. Within a
   bloc the lists substitute for each other: the variance of a bloc's summed miss is 0.29 of the sum of its lists'
   squared misses. Version 2's rank structure fits this: one Netanyahu-bloc swing, an Arab turnout swing,
   consolidation of the largest list, and list noise that sums to zero within each bloc. The Arab swing (1.7 seats) and
   the small-list noise are calibrated as they stand. The Haredi pair needs no factor of its own: Shas and UTJ together
   missed by 1.5 seats RMS, and v2's list noise already gives the pair 1.6–1.9. Consolidation was larger in
   2015–Sep 2019 (largest-list RMS 4.3 seats) than in 2020–22 (1.0). The difference does not hold across the two
   halves of the record, and every way of widening consolidation scored worse (Q5).
4. **The lean (Q3).** No rule beats the recency-weighted mean outside noise. The leave-future-out lean has undershot
   in 4 of 5 elections (mean residual +0.76 seats), because the misses are growing. Chasing that trend (half-life 0.5)
   lowers the per-list error from 1.361 to 1.324, but the whole gain is two seats in one election (2020), won by a
   lean of the *wrong* sign (−0.4). That is noise, not evidence. Giving the lean to Likud alone was rejected: the
   recent misses went to its partners. Taking the lean from the Zionist opposition and centre rather than from the
   Arab lists has support in the means (in both halves of the record, the Arab lists did not pay for the bloc misses)
   but makes no difference in the backtest. It moves 2026's Shas and Joint List points by a seat each, so it does not
   pass the gate on its own; it is offered as an option for agent B and the synthesis. A bootstrapped lean was not
   run. With six misses a bootstrap cannot draw a miss outside the observed range and understates the spread by
   √(5/6); the t predictive is the principled form of the same idea.
5. **Seats from shares (Q4).** Allocating on simulated shares instead of whole votes changed one seat in 20,000
   draws, which is negligible. `point` is unbiased against the results (mean signed error 0.000). It sits below the
   simulated mean for safe lists by 0.11 seats on average, because reconciliation pays for the medians of threshold
   lists (+0.21). Of the alternatives tried (largest remainder on means, raw medians, rounded means), the v2 rule is
   the best (1.361 against 1.385 to 1.39). **The bloc point should be the bloc median, not the sum of list points.**
   Leave-future-out it is better or equal in every election. Netanyahu-bloc error falls from 1.83–2.00 (the figure
   depends on the Monte Carlo seed) to 1.33 under every seed, and mean bloc error from 1.39 to 1.33. Round 1 (F3)
   proposed this as an option; this is the out-of-sample evidence for it.
6. **Monte Carlo noise in the yardstick.** At 10,000 runs or more, per-list error is the same under every seed
   (1.361). The Netanyahu-bloc error is not: under v2 it moves between 1.83 and 2.00 with the seed, because one
   election's bloc sum flips by a seat. Any proposal that claims a gain of 0.17 or less on bloc error has to be scored
   on several seeds. The tables here average three.
7. **Proposed v3 (Q5): Student-t swing, and bloc point = bloc median.** Per-list error **1.361 (v2 1.361, unchanged;
   no 2026 list point moves)**, Netanyahu-bloc error **1.33 (v2 1.94)**, mean bloc error **1.333 (1.389)**, wrong
   calls **4 (4)**, majority **6/6**, majority Brier **0.054 (0.090)**, P(pass) Brier 0.0448 (0.0449), 90% coverage
   88.2% by PIT (88.7%), list CRPS 2.137 (2.165), Netanyahu-bloc expected absolute error 2.88 (3.49). For 2026: the
   Netanyahu bloc's 90% range narrows from 47–59 to 48–58, P(net ≥ 61) falls from 3% to 1%, and the bloc point is 53
   (the median) instead of 54. **Gate:** the per-list yardstick cannot see this change. The swing is symmetric and the
   point is a median, so per-list error is invariant by construction. The override is that every calibration column
   the backtest can measure improves, and the bloc median improves the tie-break columns under every seed.
8. **What is likely noise.** Everything rests on six bloc misses. A 90% interval for an sd estimated from them spans
   about 0.7× to 1.9×. The t form with five degrees of freedom is chosen to carry that parameter uncertainty, not to
   fit the six points. A narrower swing scored even better (a floor of 1.0 gives majority Brier 0.040); I did not
   take it. The majority-Brier gain comes from sharper probabilities in all six elections, which held because v2's
   point was on the right side of 61 every time. Had one election fallen on the wrong side, the sharper model would
   have paid more for it.

---

## Q1. The empirical residuals and their covariance

`residuals.mjs` uses the raw field: v2's steps 1–3, with no priors and no lean. `residuals.mjs --model` and
`factors.mjs` use v2's leave-future-out central share: priors in, lean from earlier elections only. The residual is
result share minus field share, in points. Bloc totals are given in seats, at ×1.2.

**Per-list residuals, raw field** (points; `node residuals.mjs`):

| Election | Largest misses | Bloc miss, seats: net / opp / mid / arab |
|---|---|---|
| 2015 | Likud +6.0, Jewish Home −2.9, Yesh Atid −1.1 | +2.1 / −2.6 / +0.1 / +0.3 |
| Apr 2019 | Likud +5.0, Blue and White +3.9, Labor −3.5, Zehut −1.8, New Right −1.6, Shas +1.6 | +3.4 / −1.4 / 0 / −1.2 |
| Sep 2019 | Shas +1.6, Joint List +1.6, Otzma −1.5 | −0.7 / +1.3 / −1.9 / +1.9 |
| 2020 | Likud +2.5, Joint List +1.4, Otzma −1.4, Labor–Gesher–Meretz −1.3 | +2.6 / −1.4 / −1.5 / +1.6 |
| 2021 | Blue and White +3.1, New Hope −2.8, Joint List −1.9, Labor +1.6 | +2.7 / +1.7 / −1.8 / −1.6 |
| 2022 | Shas +1.5, Yesh Atid −1.5, Balad +1.1 | +1.8 / −3.4 / −0.7 / +2.3 |

**Variance decomposition** (71 list-elections). The total sum of squares is 175.8 points². The bloc part, each
bloc's miss spread over its lists in proportion to their shares, is 26.3 (15%). The within-bloc part is 149.4 (85%).
The RMS miss per list is 1.57 points raw and 1.45 within bloc. A bloc's summed miss has 0.29 of the variance that
independent lists would give it (0.33 against v2's central shares), so substitution inside blocs dominates. This
confirms round 1 F5 (0.65 on 2020–22 alone) on all six elections.

**A low-rank structure, estimated with shrinkage** (`node factors.mjs`). The residuals are against v2's
leave-future-out central shares, in seats. Each factor's score is computed per election. Its RMS is shrunk toward
v2's value with k = 4 pseudo-elections: s² = (n·ŝ² + 4·s₀²)/(n + 4).

| Factor | Six values (seats) | RMS | 2015–Sep 2019 | 2020–22 | v2 assumes | Shrunk |
|---|---|---|---|---|---|---|
| Netanyahu-bloc swing (after the lean) | +2.9 +3.4 −1.3 +2.9 +2.1 +1.4 | 2.46 (sd about mean 1.70) | 2.66 | 2.24 | 3.1, normal; realised 3.2 in shares | 2.73 |
| Arab turnout | −0.3 −2.3 +1.3 +1.1 −2.8 +0.9 | 1.71 | 1.56 | 1.84 | 1.7 | 1.70 |
| Consolidation, Netanyahu bloc (largest list's within-bloc deviation) | +6.1 +4.2 −0.8 +1.5 −0.8 −0.5 | 3.12 | **4.29** | **1.02** | 1.5 | 2.60 |
| Consolidation, opposition | +0.8 +4.9 −0.4 +1.3 −1.8 −0.2 | 2.23 | 2.89 | 1.26 | 1.5 | 1.97 |
| Haredi (Shas + UTJ, within bloc) | −2.9 +0.8 +1.0 −0.9 −1.1 +1.0 | 1.48 | 1.84 | 1.00 | 1.6–1.9, from list noise (`factors.mjs`, last line) | 1.57 |
| Idiosyncratic, other lists under 7% (n = 29) | | 1.09 | 0.89 | 1.26 | 1.2 (1.0-point floor) | 1.13 |
| Idiosyncratic, other lists 7%+ (n = 8) | | 2.39 (mean −1.67) | 3.00 | 1.93 | 1.2–1.6 | 2.05 |

What this says:

- **The Netanyahu-bloc factor is mostly a bias, not a spread.** Its mean after the leave-future-out lean is +1.9
  seats in share terms, and its sd about that mean is 1.7. The lean undershoots (Q3); the spread is smaller than v2's
  3.1.
- **The Arab turnout factor is right at 1.7** and stable in both halves.
- **Consolidation is an era effect, not a stable spread.** The Netanyahu bloc's largest list (Likud in 2015 and April
  2019) and Blue and White in April 2019 consolidated by 4–6 seats. Since 2020 the largest lists have moved 1 seat
  RMS. The large satellites that paid for it (Jewish Home 2015, Labor April 2019) make up the "other lists 7%+" row.
  Its mean, −1.67, is that same consolidation seen from the other side. With the sign and size this different
  between halves, I do not widen consolidation; Q5 shows that widening it scores worse.
- **No Haredi factor.** Shas's and UTJ's within-bloc deviations correlate at 0.88, but the pair's combined miss
  (1.5 seats RMS) is already covered by v2's two independent list draws (sd 1.6–1.9), and in 2015 it is confounded with
  Likud's consolidation.
- **Size scaling.** A log-log fit of |within-bloc deviation| on share gives an exponent of 0.26 on the raw field and
  0.41 on the model residuals, against v2's 0.5. The 1.0-point floor already makes v2 flat below 7%, which is what the
  data show. No change.

**Cross-bloc correlations of the bloc misses** (`node blockcorr.mjs`; the sd of a correlation from six points is
about 0.4):

| | net–opp | net–arab | opp–arab | net–mid | opp–mid |
|---|---|---|---|---|---|
| Observed | −0.44 | −0.51 | −0.42 | +0.33 | −0.35 |
| v2 simulates | −0.69 | −0.59 | −0.01 | −0.46 | −0.04 |
| v2 with the lean and swing taken from the Zionist lists (option) | −0.63 | −0.35 | −0.33 | −0.50 | −0.04 |

Everything is within noise. The option matches opp–arab better, and the means support it: the Arab bloc's raw miss
averaged +0.55 seats while the Netanyahu bloc gained, and the opposition and centre lost (−0.95, −0.96), with the same
signs in both halves.

**Against what v2 assumes, in vote shares** (`node implied.mjs v2`). For each component, z = (result − central) / the
simulated sd. A calibrated component has RMS z ≈ 1.

| Component | n | Simulated sd (pt) | RMS actual (pt) | RMS z | Mean z |
|---|---|---|---|---|---|
| Lists, all | 71 | 1.27 | 1.47 | **1.02** | −0.04 |
| Lists < 4.5% | 26 | 0.98 | 0.96 | 0.98 | +0.08 |
| Lists 4.5–7% | 16 | 1.05 | 0.69 | 0.64 | −0.15 |
| Lists 7–12% | 17 | 1.29 | 1.50 | 1.21 | −0.56 |
| Lists 12%+ | 12 | 2.19 | 2.65 | 1.22 | +0.57 |
| Netanyahu-bloc total | 6 | 2.70 | 2.05 | **0.76** | **+0.59** |
| Opposition total | 6 | 1.92 | 1.53 | 0.80 | −0.16 |
| Centre (mid) total | 5 | 1.21 | 0.74 | 0.58 | −0.50 |
| Arab total | 6 | 1.50 | 1.42 | 0.94 | −0.19 |
| Within-bloc: largest list | 14 | 1.64 | 2.12 | 1.22 | +0.62 |
| Within-bloc: other lists < 7% | 36 | 0.95 | 0.87 | 0.92 | +0.01 |
| Within-bloc: other lists 7%+ | 11 | 1.17 | 1.77 | 1.57 | −0.96 |

The lists as a whole, the small lists and the Arab swing are calibrated. The Netanyahu-bloc total is too wide and
biased upward (the lean). The consolidation pair (largest lists and their large partners) is under-dispersed, all of
it from 2015 and April 2019 (largest-list z: Likud 2015 2.78, Blue and White April 2019 2.30, Likud April 2019 1.81;
every other |z| is under 1.4).

## Q2. Calibration of version 2, leave-future-out

`node calib.mjs 10000 v2` (v2's own seed). The PIT columns use the randomised PIT, which corrects for whole seats.

| | Value | Target |
|---|---|---|
| List results inside the printed 90% interval | 66/71 = 0.93 | 0.90 (inflated by integer quantiles) |
| List results inside the printed 50% interval | 0.76 | 0.50 (same inflation) |
| PIT in [0.05, 0.95] | **0.887** | 0.90 |
| PIT in [0.25, 0.75] | **0.535** | 0.50 |
| Safe lists: mean \|PIT − 0.5\| | 0.236 | 0.25 |
| Bloc results inside 90% | **24/24** | 21.6 (P(24/24) = 0.08) |
| Netanyahu-bloc PITs | 0.58 0.65 0.31 0.57 0.66 0.64 | spread over (0, 1); P(all within 0.19 of 0.5) = 0.38⁶ ≈ 0.003 |
| Simulated Netanyahu-bloc sd (seats) | 3.6–4.7 | realised RMS error 1.96 (point), 1.41 (bloc median) |
| P(pass) Brier (71 lists) | 0.0449 | |
| Majority Brier (3 outcomes) | 0.089 | |

Results outside the 90% interval: Likud 2015 (30 against 18–27), Blue and White April 2019 (35 against 24–34), Labor
April 2019 (6 against 7–13), Blue and White 2021 (8 against 0–6, the comeback), New Hope 2021 (6 against 7–12).

**P(pass) reliability:**

| P(pass) bin | n | Mean P | Passed | Cases (✓ passed, ✗ failed) |
|---|---|---|---|---|
| < 0.05 | 1 | 0.01 | 0 | |
| 0.05–0.35 | 5 | 0.12 | 0 | Gesher 2019 0.05✗, Otzma Sep 2019 0.26✗, Otzma 2020 0.07✗, Balad 2022 0.14✗, Jewish Home 2022 0.07✗ |
| 0.35–0.65 | 5 | 0.54 | 4 | Yachad 2015 0.40✗, YB Apr 2019 0.47✓, B&W 2021 0.63✓, RZ 2021 0.53✓, Meretz 2021 0.65✓ |
| 0.65–0.95 | 16 | 0.79 | 13 (0.81) | including New Right 0.81✗, Zehut 0.71✗, Meretz 2022 0.66✗ |
| ≥ 0.95 | 44 | 1.00 | 44 | |

**Verdict.** The lists are calibrated, in width and in P(pass). The blocs are too wide. The shape problem is that the
Netanyahu-bloc distribution is too wide *and* centred too low: five of six PITs are above 0.5, a sign test p of 0.22,
so it is a bias in the lean (Q3), not demonstrable skew. With six points, skew cannot be identified separately from
the mean. The fat tails that history does show are in consolidation, not in the bloc swing.

## Q3. The lean

**Part 1: predicting each election's Netanyahu-bloc seat miss from the ones before it** (`node lean.mjs`; misses
from calibration.json: 0.6, 0.3, −0.6, 0.7, 1.7, 3.7):

| Rule | Residuals (Apr 2019 → 2022) | MAE | RMS | Mean residual | Lean for 2026 |
|---|---|---|---|---|---|
| Zero | 0.3 −0.6 0.7 1.7 3.7 | 1.40 | 1.87 | 1.16 | 0 |
| Plain mean | −0.3 −1.1 0.6 1.5 3.2 | 1.31 | 1.65 | 0.77 | 1.07 |
| Median | −0.3 −1.1 0.4 1.3 3.1 | 1.22 | 1.58 | 0.68 | 0.65 |
| **Recency, half-life 2 (v2)** | −0.3 −1.0 0.7 1.5 2.9 | 1.29 | **1.58** | 0.76 | **1.75** |
| Recency, half-life 1 | −0.3 −1.0 0.9 1.4 2.7 | 1.25 | 1.48 | 0.73 | 2.38 |
| Last miss only | −0.3 −0.9 1.3 1.0 2.0 | 1.10 | 1.23 | 0.62 | 3.70 |
| Shrunk mean (× n/(n + 2)) | 0.1 −0.8 0.6 1.5 3.3 | 1.28 | 1.70 | 0.95 | 0.80 |

**Part 3: the same rules scored in the model** (v3 noise, three seeds):

| Lean rule | Per-list | Net | Bloc | Wrong | Majority Brier |
|---|---|---|---|---|---|
| Half-life 2 (v2) | 1.361 | 2.00 | 1.417 | 4 | 0.054 |
| Half-life 1 | 1.361 | 1.83 | 1.333 | 4 | 0.046 |
| Half-life 0.5 | **1.324** | 2.00 | 1.333 | 4 | 0.037 |
| Last miss only | 1.356 | 1.94 | 1.417 | 4 | 0.031 |
| Zero | 1.337 | 2.39 | 1.583 | 4 | 0.091 |
| Median | 1.361 | 2.00 | 1.417 | 4 | 0.061 |

- **The half-life is not identified.** Round 1 F6 said so, and it holds. Half-life 0.5's per-list gain is all in
  2020 (0.67 → 0.44 seats per list), where it uses a lean of −0.4 (from the Sep 2019 miss) against v2's 0. That is
  two seats in one election from a lean of the wrong sign. In 2026 it would move the lean from 1.7 to 3.1 seats and
  the points with it (Religious Zionism 7 → 8, Yashar 22 → 21). I do not recommend it. "Lean = 0" also scores
  slightly better on the per-list error (1.337) while losing badly on the bloc and the majority, which shows how
  insensitive the per-list yardstick is to the lean.
- **The lean undershoots.** Under every rule the out-of-sample residuals are positive in 3 or 4 of 5 elections, with
  a mean of +0.6 to +1.2. The misses are growing (+3.7 in 2022). This is a trend, or a 2022 outlier, and five points
  cannot say which. Keep v2's rule and let the width carry it.
- **Lean per list class.** Giving the lean to Likud alone (`leanTo: "largest"`) scores 1.361 / 2.06 / 1.445, worse
  on the bloc than v2. The recent misses went to the partners: the rest of the bloc gained +1.6 points in both 2021
  and 2022 while Likud's miss was about 0. A per-class lean would also double-count the Shas prior; round 1 rejected
  netting it for that reason. Taking the lean from the Zionist opposition and centre only (`leanFrom: "zionist"`) is
  supported by the means (Q1) and is neutral in the backtest: with v3's swing, 1.361 / 1.94 / 1.389. On v2's swing
  it reads 1.377 / 2.06 / 1.472, a seat flip under one seed. It moves 2026's Shas 10 → 9 and Joint List 9 → 10 through
  reconciliation, without backtest support, so under the gate it is not part of the proposal. It is a judgment for
  agent B's sector model: who pays when the Netanyahu bloc beats its polls.
- **Is blocSd 3.1 justified?** No. Every rule's out-of-sample residual RMS is 1.2–1.9 seats. v2 doubles it and
  floors it at 3. With the residual of 1.5 that v2 itself computes, the t predictive gives sd 2.1 for 2026. Scored
  directly: N(0, 2.1) (v2 with `blocSd: 2.1`) and the t₅ swing perform the same (majority Brier 0.059 and 0.054;
  CRPS 2.128 and 2.137). The data cannot tell normal from t; the t is chosen for honesty about the parameter
  uncertainty from six points.

## Q4. Seats from shares, and the point

**Allocation on shares versus whole votes** (`node points.mjs`): on 20,000 2026 draws, allocating on whole votes
(4.8 million valid) instead of shares moved one seat in one draw. Negligible. The stored draws replay `allocate()`
exactly.

**The point against the simulated mean and against the result** (`node points.mjs`, `node reconcile.mjs`):

| | Value |
|---|---|
| Sum of the raw medians, by election (2015, Apr 2019, Sep 2019, 2020, 2021, 2022, 2026) | 119, 123, 121, 120, 124, 123, 117 |
| Point − simulated mean, safe lists (n = 55) | −0.11 (8–15-seat lists −0.21, 15+ −0.01) |
| Point − simulated mean, threshold lists (n = 30) | +0.21 |
| Point − result, all 71, mean signed | 0.000 |
| Point − result, lists with mean ≥ 15 seats | −1.50 (the consolidation elections) |

The median of a threshold list that passes slightly more often than not is about 4, against a mean of about 2.3, so
the raw medians add to more than 120. Reconciliation takes the excess from the safe lists whose means sit lowest
relative to their medians. The point is therefore unbiased overall, slightly low for mid-size safe lists, and high
for threshold lists. That is the right trade for absolute error.

| Rule (three seeds) | v2 per-list error | v3 per-list error |
|---|---|---|
| **R1: v2's reconciliation** | **1.361** | **1.361** |
| R2: threshold lists keep their median; safe lists share the rest by largest remainder on their means | 1.385 | 1.385 |
| R0: raw medians, not reconciled (do not add to 120) | 1.392 | 1.386 |

`points.mjs` also pools the 71 lists rather than averaging per election (1.437 for the point, 1.493 for raw medians,
1.535 for rounded means), with the same ranking. Keep R1.

**The bloc point** (`node blocpoint.mjs`, three seeds):

| | Net error, sum of list points | Net error, bloc median | Mean bloc error, sum | Mean bloc error, median |
|---|---|---|---|---|
| v2 | 1.83 / 2.00 / 2.00 | **1.33 / 1.33 / 1.33** | 1.33 / 1.42 / 1.42 | 1.33 / 1.33 / 1.38 |
| v3 | 2.00 / 2.00 / 2.00 | **1.33 / 1.33 / 1.33** | 1.42 / 1.42 / 1.42 | 1.33 / 1.33 / 1.33 |

Signed Netanyahu-bloc error (point − result) under the sum is −2, −2, +2, −1, −1, −3 or −4. Under the median it is
−1, −1, +2, −1, −1, −2: better or equal in every election. The sum runs low because reconciliation takes seats from
Netanyahu-bloc lists (Shas 10 → 9 in 2021 and 2022, Shas 7 → 6 and URWP 7 → 6 in April 2019) to pay for threshold
lists' medians elsewhere. The cost is presentational: bloc points no longer add up from list points. For 2026 the
bloc median is 53 against a list sum of 54.

**Monte Carlo** (`node mc.mjs`): per-list error is 1.361 under every seed at 10,000, 20,000 and 50,000 runs. At
2,000 runs it ranges from 1.324 to 1.361. The bloc error moves between 1.83 and 2.00 at every run count.

## Q5. Proposed v3 noise and its backtest

**The structure.** Version 2's skeleton is right (Q1): the Netanyahu-bloc swing, consolidation (normal, 1.5 seats),
list noise that sums to zero within each bloc with the 1.0-point floor, and the Arab swing (1.7 seats). It changes in
one place: the swing is drawn from the predictive distribution of the next miss.

```
swing = lean + scale · t_df
scale = max(1.5, resid · √(1 + 1/n)),   df = max(3, n − 1)
```

Here n is the number of past elections in the record and resid is v2's recency-weighted residual. For 2026, n = 6,
resid = 1.5, scale = 1.65, df = 5, and the swing sd is 2.1 seats (v2: N(0, 3.1)). In the backtest the floor of 1.5
(t₃, sd 2.6) applies to 2015 and April 2019, where the record is empty or a single point. Separately, the bloc point
becomes the median of the simulated bloc total.

**The code.** This is a drop-in for model.mjs. In `model-g.mjs` it is `drawV3` under `opts.noise = "v3"`, with
`opts.v3` as in `v3.mjs`, plus `opts.blocPoint = "median"`. Against model.mjs, three edits:

```js
// step 5, after `const blocSd = ...` (blocSd is then unused; keep it in `parameters` for the record or drop it):
const nRec = errs.length;
const swingScale = Math.max(1.5, resid * Math.sqrt(1 + 1 / Math.max(1, nRec))), swingDf = Math.max(3, nRec - 1);

// step 8, after `randn`:
const randt = (df) => { let c = 0; for (let k = 0; k < df; k++) { const z = randn(); c += z * z; } return randn() / Math.sqrt(c / df); };
// and in the run loop, replace   const swing = (lean + randn() * blocSd) / KNESSET;   with
const swing = (lean + randt(swingDf) * swingScale) / KNESSET;

// step 9, blocOut: the bloc point is the bloc median (the list-point sum stays available as blocs.*.listSum)
point: q(sortedBlocs[b], 0.5), listSum: members[b].reduce((a, id) => a + (point[id] ?? 0), 0),
// parameters: replace blocSdSeats with   swingScaleSeats: r1(swingScale), swingDf
```

The forecast.json `scoring` text must then say that bloc error scores `blocs.*.point` = the bloc median.

**Backtest**, leave-future-out, six elections, 10,000 runs, mean of seeds 20261027, 1 and 2
(`node backtest-g.mjs`):

| Variant | Per-list error | Net-bloc error | Mean bloc error | Wrong calls (of 71) | Majority right | Majority Brier | P(pass) Brier | PIT 90% / 50% | List CRPS | Net E\|err\| |
|---|---|---|---|---|---|---|---|---|---|---|
| **v2** | **1.361** | 1.94 | 1.389 | 4 | 6/6 | 0.090 | 0.0449 | 0.887 / 0.53 | 2.165 | 3.49 |
| **v3: t swing + bloc median (proposed)** | **1.361** | **1.33** | **1.333** | **4** | **6/6** | **0.054** | 0.0448 | 0.882 / 0.53 | **2.137** | **2.88** |
| v3: t swing only | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.054 | 0.0448 | 0.882 / 0.53 | 2.137 | 2.88 |
| v2 + bloc median only | 1.361 | 1.33 | 1.347 | 4 | 6/6 | 0.090 | 0.0449 | 0.887 / 0.53 | 2.165 | 3.49 |
| v2, blocSd 2.1 normal (no floor of 3) | 1.361 | 1.94 | 1.389 | 4 | 6/6 | 0.059 | 0.0448 | 0.887 / 0.53 | 2.128 | 2.84 |
| v3 + lean and swing from Zionist lists (option) | 1.361 | 1.94 | 1.389 | 4 | 6/6 | 0.054 | 0.0445 | 0.873 / 0.53 | 2.141 | 2.87 |
| v2 + lean and swing from Zionist lists | 1.377 | 2.06 | 1.472 | 4 | 6/6 | 0.089 | 0.0444 | 0.887 / 0.535 | 2.172 | 3.47 |
| v3, swing floor 2.0 | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.072 | 0.0449 | 0.887 / 0.53 | 2.167 | 3.36 |
| v3, swing floor 1.0 | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.040 | 0.0447 | 0.882 / 0.53 | 2.113 | 2.47 |
| v3, swing df ≥ 5 | 1.361 | 1.94 | 1.389 | 4 | 6/6 | 0.049 | 0.0446 | 0.878 / 0.526 | 2.123 | 2.68 |
| v3 + t₃ consolidation (rejected) | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.055 | 0.0451 | 0.91 / 0.549 | 2.239 | 2.91 |
| v3 + consolidation sd 2.5 (rejected) | 1.361 | 1.94 | 1.389 | 4 | 6/6 | 0.055 | 0.0456 | 0.91 / 0.554 | 2.280 | 2.90 |
| v3 + lean to Likud only (rejected) | 1.361 | 2.06 | 1.445 | 4 | 6/6 | 0.053 | 0.0447 | 0.887 / 0.526 | 2.150 | 2.84 |
| v3, list noise × 0.85 | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.053 | 0.0441 | 0.859 / 0.474 | 2.040 | 2.86 |
| v3, list noise × 1.15 | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.057 | 0.0461 | 0.901 / 0.568 | 2.241 | 2.91 |
| v3, lean = plain mean | 1.361 | 2.00 | 1.417 | 4 | 6/6 | 0.062 | 0.0448 | 0.882 / 0.53 | 2.137 | 2.90 |

Per election, v3's per-list error is 1.64, 2.86, 0.80, 0.67, 1.29, 0.92, identical to v2's. Netanyahu-bloc PITs
under v3 are 0.61, 0.70, 0.24, 0.61, 0.72, 0.70: still a little narrow around the middle and shifted up by the lean,
but no longer bunched. In the v3 calibration run (`node calib.mjs 10000 v3`), the P(pass) reliability is unchanged
and the 90% list misses are the same consolidation cases.

Notes on the rejected rows:

- **Consolidation.** Widening it (t₃ or sd 2.5) catches Likud 2015 and Blue and White 2019 (PIT 90% rises to 0.91)
  but worsens CRPS by 0.10–0.14 seats per list and the P(pass) Brier. The ordinary elections pay for two era
  outliers.
- **List noise × 0.85.** Sharper, with a better CRPS, but under-covers (PIT 90% 0.859, 50% 0.474). Not taken.
- **Swing floor 1.0.** Scores best, and the floor matters only in the backtest's first three elections; in 2026 the
  scale comes from the record (1.65). It is not taken because six points do not justify sharpening below the
  predictive form.

**2026 under v3** (`node run2026.mjs`, 50,000 runs; seed and polls as in data/forecast.json): every list point is
unchanged (Likud 21, Otzma 8, Shas 10, UTJ 8, RZ 7, poi 0, Yashar 22, B'Yachad 12, Democrats 9, YB 8, Reservists 0,
JL 9, Ra'am 6). P(pass) is unchanged within 0.5 pp (poi 18.7, Reservists 22.9, Ra'am 96.2).

| | v2 | v3 |
|---|---|---|
| Netanyahu bloc: point / 90% / sd | 54 (median 53) / 47–59 / 3.8 | **53** (median) / 48–58 / 3.0 |
| Opposition: point / 90% / sd | 51 / 46–55 / 2.9 | 51 / 47–54 / 2.3 |
| Arab: point / 90% | 15 / 11–19 | 15 / 11–18 |
| P(net ≥ 61) / neither / opp + Arab + mid ≥ 61 | 3% / 97% / 95% | 1% / 99% / 98% |

## Recommendation

1. **Ship the t swing**: `swing = lean + max(1.5, resid·√(1 + 1/n)) · t_{max(3, n−1)}` in place of
   `N(0, max(3, 2·resid))`. For 2026 that is scale 1.65 seats, df 5. Code above; in `model-g.mjs` it is
   `opts.noise = "v3"` with `V3` from `v3.mjs`.
2. **Score and publish the bloc point as the bloc median** (`opts.blocPoint = "median"`), with the list-point sum
   kept beside it. Netanyahu-bloc error drops from 1.94 to 1.33 under every seed.
3. **Keep** consolidation at normal sd 1.5, the list noise and its floor, the Arab swing at 1.7, v2's lean rule
   (half-life 2), and v2's point reconciliation.
4. **Do not stack widenings on the swing.** The historical misses are final-week field against result, so they
   already contain the blackout period (agent D), late swing (agent C) and turnout surprises (agent B). A component
   that adds variance for any of these must take it out of the swing, or the blocs go back to v2's over-width. Check
   any combined v3 with `node implied.mjs <opts>`: the Netanyahu-bloc RMS z should stay near 0.9–1.0 and the list RMS
   z near 1.0.
5. **Score bloc-level claims on several seeds.** A single seed moves the bloc error by 0.17.
6. **Option for agent B and the synthesis, not proposed by me:** take the lean and swing from the opposition and
   centre only (`v3.leanFrom = "zionist"`). It has support in the means and makes no difference in the backtest, and
   it moves 2026's Shas and Joint List points by a seat each.

**Gate and override.** Version 3 as proposed ties version 2 on the yardstick: 1.361, the same in every election and
under every seed. It improves Netanyahu-bloc error (1.94 → 1.33) and mean bloc error (1.389 → 1.333), the
tie-breakers, under every seed; those gains come from the bloc-median rule. The swing change cannot move the
yardstick by construction (a symmetric draw around the same centre; the point is a median), so the backtest is not
informative for it on that column. On the columns that can see it, it improves the majority Brier (0.090 → 0.054),
list CRPS (2.165 → 2.137) and the Netanyahu bloc's expected absolute error (3.49 → 2.88). P(pass) Brier and the
list PIT coverage are unchanged within 0.005. That is the documented override for item 1.

## Reproduction

All in `scripts/forecast/round2/G/`, Node ESM, reading the repo data; nothing writes to the repo.

| Script | What it produces |
|---|---|
| `model-g.mjs` | model.mjs with switches: `noise` (v2/v3), `v3` parameters, `leanRule`, `blocPoint`, `keepRuns`/`keepShares` |
| `check-repro.mjs` | model-g (defaults) == model.mjs on six elections and 2026 |
| `common.mjs`, `v3.mjs` | Harness (v2.mjs's setup and CLASSES, scoring with calibration) and the proposed options |
| `residuals.mjs [--model]` | Q1 residual tables, variance decomposition, size scaling, Haredi and Likud checks |
| `factors.mjs` | Q1 low-rank factors, halves and shrinkage |
| `blockcorr.mjs` | Q1 cross-bloc correlations, simulated against observed |
| `implied.mjs [v2\|v3\|json]` | Q1/Q2 simulated sd and z per component |
| `calib.mjs [runs] [v2\|v3]` | Q2 coverage, PIT, reliability, bloc PITs, majority |
| `lean.mjs [runs]` | Q3 lean rules, leave-future-out, and in the model |
| `points.mjs`, `reconcile.mjs`, `blocpoint.mjs`, `mc.mjs` | Q4 |
| `backtest-g.mjs [runs] [seeds]` | Q5 table |
| `run2026.mjs` | v2 against v3 on data/polls.json |
