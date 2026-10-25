# F. Ensembles and stacking

Round 2, agent F. Written 2026-10-24 (Saturday), three days before the vote. Scope: whether version 3 should average
several forecasting models instead of shipping one. I tested point ensembles, distribution ensembles (mixtures),
weights fitted leave-future-out (stacking), and how correlated the candidates' errors are. The candidates are
version 2, agent G's noise, the plain √n site average, version 2 with a 14-day window, agent E's state-space model,
and the two component variants that passed or tied the gate: B's Arab turnout term (B2) and C's in-bloc funding
(K1).

Data: the six elections in `scripts/forecast/backtest/data/` (final 28 days). Agent E's model reads D1's full-campaign
files, as E built it. No 2026 poll after Oct 22 was seen. The 2026 runs use
`scripts/forecast/round2/polls-through-2026-10-22.json` (62 polls), `data/parties.json` and the agreements in
`data/results.json`.

Code is in `scripts/forecast/round2/F/`:
- `ensemble.mjs`: the deliverable, `ensemble(candidates, weights, {mode})`.
- `candidates.mjs`: each candidate set up leave-future-out exactly as its author did. Version 2, B, C and G are read
  from commit `56fee38` with `git show`, because the working tree's `model.mjs` was being rewritten during this
  work. E is read from disk.
- `score.mjs`: the scoring.
- `backtest-f.mjs`: every table below.

Each candidate reproduces its author's backtest row: v2 1.361 / 1.83 / 1.33 / 4 / 6/6 / 0.090 on the brief's seed,
G 0.055 majority Brier, B2 1.32, K1 1.307, E 1.39.

## Summary

1. **Negative result: v3 should be a single model, not an ensemble.** No ensemble beats the best single candidate
   by more than one seat in one election, and the honest out-of-sample selection of an ensemble loses to version 2.
   - **Leave-future-out subset selection** picks, at each election, the equal-weight subset with the lowest error
     on the earlier elections. It scores **1.406 per list against v2's 1.361**.
   - **Stacked weights** (fitted on earlier elections only, shrunk toward equal) score 1.28–1.41. The good end
     comes only from sets that contain B2 and K1, which beat v2 on their own.
2. **The candidates make the same errors, so there is nothing to average away (Q3).** Across the 71 lists:

   | | Correlation of signed seat errors with v2 | Lists where the point differs from v2 |
   |---|---|---|
   | w14 | 1.00 | 0% |
   | G | 1.00 | 3% |
   | K1 | 0.99 | 10% |
   | E | 0.98 | 20% |
   | B2 | 0.97 | 23% |
   | plain average | 0.89 | 89% |

   Across the six elections, per-election list error correlates 0.96–1.00 with v2's. This is D's and E's finding
   from the ensemble side: the final error is a level bias shared by every firm and every aggregator. A different
   way of averaging the same polls cannot remove it.
3. **The only diverse candidate is the plain average, and it is diverse because it is worse.** It has no lean, no
   priors and seat rounding. Every ensemble that includes it is worse than v2 on the yardstick:
   - v2 + average: 1.39–1.48.
   - v2 + E + average: 1.40–1.41.
   - stacked v2 + average: 1.38–1.40.

   It improves the Netanyahu-bloc error (1.17 against 1.33 under the bloc median) because it has no lean. That is
   the lean question G already settled, not a reason to ensemble.
4. **Every apparent gain is a component gain, not diversification.** Some sets beat v2: B2+K1 1.27, v2+B2 1.30,
   v2+K1 1.32, v2+B2+K1 1.30–1.33. Each contains B2 or K1, which already beat v2 alone (1.325 and 1.307). The best
   ensemble, B2+K1 at 1.273, beats the best single, K1 at 1.307, by 0.03. That is better in three elections and worse
   in one, at most two seats each, chosen from 120 subsets.
   - Averaging the central shares of v2 and "v2 + change X" is the same as applying X at half strength. So an
     equal-weight ensemble of v2-family variants is a shrunk version of their component changes.
   - If B2 and K1 are wanted, put them in the model as components (the synthesis is already adding B2). Do not
     average models to get them.
5. **E adds nothing (Q1, option 5).** v2 + E scores 1.33–1.36, the same as v2. Stacking gives E the same weight as
   v2 in every election but one. E's own memo predicted this: its point tracks v2's within 0.05 points of share.
6. **Distribution ensembles (Q2): average the centrals and run one simulation. Do not mix the draws.**
   - **Mixture** pools the candidates' draws. It adds the spread between models to each model's own spread. Every
     model's width is already calibrated on the historical misses (G: lists calibrated, PIT 88.7%), and those misses
     already contain each model's error and the blackout. A mixture therefore counts uncertainty twice: G's warning.
   - With these candidates the duplication is small, because they agree, and the mixture scores the same as central
     averaging (±0.005). Where they disagree (v2 + average, v2 + E, all six), the mixture is wider and scores worse:
     for v2 + average, list PIT-90 88% against 86%, CRPS 2.173 against 2.150, majority Brier 0.076 against 0.072.
   - **Central averaging** keeps one noise model and its calibration. Under G's noise it keeps G's majority-Brier
     gain: 0.046–0.060 against v2's 0.090.
7. **2026 (Q4).** Every ensemble without the plain average gives version 2's list points exactly:
   - Likud 21, Otzma 8, Shas 10, UTJ 8, RZ 7, Yashar 22, B'Yachad 12, Democrats 9, Yisrael Beiteinu 8, Joint List 9,
     Ra'am 6.
   - Blocs 53–54 / 51 / 0 / 15. Amcha Yisrael 18–19% to pass, Reservists 22–23%.

   Under G's noise every such ensemble gives P(net ≥ 61) **1%** and a Netanyahu-bloc 90% range of 48–58 or 49–58.
   With v2's noise it is 3–4%, against version 2's 3%. Adding the plain average moves Shas 10→9 and B'Yachad
   12→13, cuts Amcha Yisrael's pass chance to 2–4% and raises the Reservists' to 32–37%. That is the average's
   seat-based treatment of sub-threshold lists, which scored worst on the yardstick (7 wrong calls of 71 against 4).
8. **What is noise.** Every list-error difference under 0.05 in this memo: one or two seats in one election. The
   weights the stacker fits: with one to five earlier elections, the unshrunk weights jump between corners (K1 = 1.00
   in 2019, then 0.5/0.5). Netanyahu-bloc error differences under about 0.2 (the Monte Carlo moves v2's own between
   1.83 and 2.00).

## Q1. Point ensembles

### The candidates alone

`node scripts/forecast/round2/F/backtest-f.mjs` (10,000 runs, seeds 20261027, 1 and 2; columns are the mean over the
three seeds, so v2's Netanyahu-bloc error reads 1.94, the mean of 1.83, 2.00 and 2.00).

Columns:
- **net / bloc**: Netanyahu-bloc and mean bloc error under each candidate's own bloc-point rule (v2: sum of list
  points; G: bloc median). **net (med) / bloc (med)**: the same errors with the bloc median for every row.
- **wrong**: of 71 lists. **modal**: modal outcome right, of 6.
- **cov90**: list results inside the printed integer 90% interval. **PIT90**: the randomised version (G's measure).
- **CRPS**: mean expected |draw − result| per list, in seats.

| Candidate | List | net | bloc | net (med) | bloc (med) | Wrong | Modal | Maj. Brier | P(pass) Brier | cov90 | PIT90 | CRPS | Per election |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v2 | 1.361 | 1.94 | 1.39 | 1.33 | 1.35 | 4 | 6/6 | 0.090 | 0.0449 | 92% | 86% | 2.107 | 1.64 2.86 0.80 0.67 1.29 0.92 |
| G (t swing + bloc median) | 1.361 | 1.33 | 1.33 | 1.33 | 1.33 | 4 | 6/6 | 0.055 | 0.0448 | 92% | 85% | 2.078 | same as v2 |
| w14 (v2, 14-day window) | 1.354 | 2.00 | 1.42 | 1.33 | 1.35 | 4 | 6/6 | 0.089 | 0.0448 | 94% | 86% | 2.105 | same as v2 (one seed differs) |
| Plain average, raw fractional seats (brief's row) | 1.532 | 1.28 | 2.00 | 0.67 | 1.64 | 7 | 6/6 | 0.062 | 0.0655 | 92% | 86% | 2.230 | 1.91 2.69 1.36 0.88 1.36 0.99 |
| Plain average as shares, simulated | 1.629 | 1.28 | 2.00 | 0.67 | 1.64 | 7 | 6/6 | 0.062 | 0.0655 | 92% | 86% | 2.230 | 1.82 2.86 1.20 0.89 1.57 1.85 |
| Plain average, no Filber, raw | 1.552 | 1.22 | 2.08 | 0.78 | 1.67 | 7 | 6/6 | 0.065 | 0.0668 | 92% | 86% | 2.248 | 1.91 2.70 1.36 0.89 1.41 1.05 |
| B2 (Arab turnout term) | 1.325 | 1.67 | 1.22 | 0.83 | 1.00 | 4 | 6/6 | 0.103 | 0.0425 | 93% | 87% | 2.074 | 1.64 2.71 0.60 0.89 1.14 0.92 |
| K1 (first-time −0.8 funded in bloc) | 1.307 | 1.67 | 1.33 | 1.33 | 1.31 | 4 | 6/6 | 0.089 | 0.0455 | 94% | 89% | 2.075 | 1.45 2.57 0.80 0.67 1.43 0.92 |
| E (state space) | 1.404 | 2.50 | 1.56 | 1.67 | 1.50 | 4.3 | 6/6 | 0.084 | 0.0484 | 94% | 89% | 2.177 | 1.45 3.00 1.00 0.67 1.29 0.92 |

The plain average's probabilities come from simulating its shares with v2's noise; it has none of its own. Its
"shares" are seats/120 scaled to 1 − fringe, so a list it puts below the line has share 0. That is why the
simulated version is worse than the fractional seats (1.63 against 1.53): fractional seats hedge under absolute
error, and a whole-seat forecast cannot.

### Equal-weight seat averages, every subset

Here the candidates' list points are averaged with equal weights. The **rounded** column turns the average into
whole seats: lists with averaged P(pass) under 0.5 get 0, and the rest are allocated to 120 by largest remainder.
That is the honest column, because fractional seats cannot be published, and fractional averaging lowers absolute
error mechanically (|mean − y| ≤ mean |· − y|).

There are 120 subsets of {v2, w14, avgRaw, avgNFRaw, B2, K1, E}:
- **Rounded:** 67 beat v2's 1.361, and 9 beat the best single (K1, 1.307), by 0.03 at most.
- **Fractional:** 24 beat v2.

| Subset (equal weights) | Fractional | Rounded | Wrong | net | bloc | Rounded, per election |
|---|---|---|---|---|---|---|
| w14 + B2 + K1 (best) | 1.317 | 1.282 | 4 | 1.78 | 1.30 | 1.45 2.86 0.60 0.67 1.29 0.92 |
| B2 + K1 | 1.299 | 1.287 | 4 | 1.67 | 1.24 | 1.45 2.57 0.60 0.89 1.43 0.77 |
| B2 + E | 1.348 | 1.294 | 4 | 2.08 | 1.35 | 1.64 2.86 0.60 0.67 1.29 0.77 |
| v2 + avgRaw + B2 | 1.381 | 1.295 | 3 | 1.54 | 1.34 | 1.64 2.57 0.80 0.67 1.29 0.77 |
| v2 + B2 + K1 | 1.320 | 1.298 | 4 | 1.76 | 1.29 | 1.45 2.86 0.60 0.67 1.29 0.92 |
| v2 + K1 | 1.334 | 1.315 | 4 | 1.81 | 1.36 | 1.45 2.71 0.80 0.67 1.43 0.92 |
| v2 + E | 1.383 | 1.331 | 4 | 2.22 | 1.47 | 1.45 2.86 0.80 0.67 1.29 0.92 |
| v2 + B2 | 1.326 | 1.333 | 4 | 1.81 | 1.26 | 1.64 2.71 0.60 0.89 1.29 0.77 |
| v2 + w14 | 1.358 | 1.354 | 4 | 1.97 | 1.40 | 1.64 2.86 0.80 0.67 1.29 0.92 |
| v2 + avgRaw | 1.439 | 1.425 | 4 | 1.47 | 1.48 | 1.82 2.71 1.00 0.67 1.43 0.92 |
| v2 + avgNFRaw | 1.449 | 1.425 | 4 | 1.53 | 1.50 | 1.82 2.71 1.00 0.67 1.43 0.92 |

The top of this table is a search over 120 subsets scored on the same six elections. The best one, 1.282 against
K1's 1.307, is the 0.03 that a search of that size finds by chance. The test of a search is to run it out of
sample:

### Leave-future-out subset selection and stacking

**Subset selection.** At each election, pick the subset (singles included) with the lowest rounded error on the
earlier elections; 2015 defaults to v2. The picks are v2 | avgRaw+K1+E | K1 | B2+K1 | K1 | v2+B2+K1. The score is
**list error 1.406, against v2's 1.361**, with 4 wrong calls and majority Brier 0.094. Selecting an ensemble
honestly loses.

**Stacking.** Weights are fitted on a simplex grid (step 0.1; 0.2 for four candidates), minimising the earlier
elections' rounded seat-average list error. They are then shrunk toward equal with n0 pseudo-elections: w = (n/(n+n0))
w_fit + (n0/(n+n0)) w_equal. 2015 gets equal weights.

| Set | n0 | Rounded seat average | Central average, v2 noise | Majority Brier (central) |
|---|---|---|---|---|
| v2 + avgNF | 0 / 3 / 6 | 1.385 / 1.393 / 1.393 | 1.381 / 1.395 / 1.395 | 0.073–0.077 |
| v2 + B2 + K1 | 0 / 3 / 6 | 1.321 / 1.299 / 1.315 | 1.284 / 1.315 / 1.331 | 0.094–0.100 |
| v2 + E | 0 / 3 / 6 | 1.339 / 1.339 / 1.339 | 1.377 / 1.361 / 1.361 | 0.081–0.083 |
| v2 + E + avgNF | 0 / 3 / 6 | 1.395 / 1.412 / 1.404 | 1.397 / 1.403 / 1.412 | 0.075–0.081 |
| v2 + E + B2 + K1 | 0 / 3 / 6 | 1.351 / 1.346 / 1.346 | 1.284 / 1.331 / 1.331 | 0.091–0.099 |

The fitted weights (the script prints them) show what the stacker learns:
- It moves weight from v2 to K1 and B2, to 0.13 / 0.38 / 0.50 by 2022 at n0 = 3. That is the component gain again.
- It gives E the same weight as v2, except 0.63 in 2019 after one election.
- It gives the plain average 0.38–0.45. That weight costs the 2015 election and never pays back.

Under v2's noise no stacked ensemble beats K1 alone outside noise, and every one has a worse majority Brier than G.

## Q2. Mixture against central averaging

The same equal-weight sets, three ways:
- **central / v2 noise**: the averaged centrals simulated once with v2's noise, bloc point = sum.
- **central / G noise**: simulated once with G's noise, bloc point = median.
- **mixture**: the draws pooled, bloc point = sum.

| Set | Way | List | net | bloc | Maj. Brier | P(pass) Brier | cov90 | PIT90 | CRPS | Bloc sd |
|---|---|---|---|---|---|---|---|---|---|---|
| v2 + w14 | central / v2 | 1.361 | 1.94 | 1.39 | 0.089 | 0.0448 | 92% | 86% | 2.105 | 4.1 |
| | central / G | 1.361 | 1.33 | 1.33 | 0.055 | 0.0447 | 93% | 85% | 2.076 | 3.5 |
| | mixture | 1.361 | 2.00 | 1.42 | 0.088 | 0.0447 | 93% | 86% | 2.101 | 4.1 |
| v2 + avgNF | central / v2 | 1.395 | 1.56 | 1.53 | 0.072 | 0.0541 | 93% | 86% | 2.150 | 4.1 |
| | central / G | 1.387 | 1.17 | 1.56 | 0.037 | 0.0541 | 93% | 85% | 2.122 | 3.5 |
| | mixture | 1.387 | 1.56 | 1.53 | 0.076 | 0.0540 | 93% | 88% | 2.173 | 4.1 |
| v2 + B2 | central / v2 | 1.302 | 1.83 | 1.25 | 0.095 | 0.0438 | 93% | 87% | 2.081 | 4.1 |
| | central / G | 1.300 | 1.39 | 1.18 | 0.060 | 0.0437 | 92% | 86% | 2.052 | 3.5 |
| | mixture | 1.294 | 1.78 | 1.22 | 0.094 | 0.0434 | 93% | 87% | 2.086 | 4.1 |
| v2 + K1 | central / v2 | 1.315 | 1.78 | 1.31 | 0.090 | 0.0452 | 94% | 88% | 2.090 | 4.1 |
| | central / G | 1.339 | 1.33 | 1.29 | 0.054 | 0.0451 | 93% | 87% | 2.061 | 3.5 |
| | mixture | 1.315 | 1.78 | 1.33 | 0.089 | 0.0450 | 94% | 88% | 2.087 | 4.1 |
| B2 + K1 | central / v2 | 1.274 | 1.50 | 1.17 | 0.095 | 0.0441 | 94% | 89% | 2.065 | 4.1 |
| | central / G | 1.274 | 1.39 | 1.17 | 0.060 | 0.0440 | 94% | 88% | 2.036 | 3.5 |
| | mixture | 1.273 | 1.50 | 1.17 | 0.094 | 0.0436 | 94% | 89% | 2.070 | 4.1 |
| v2 + B2 + K1 | central / v2 | 1.331 | 1.83 | 1.33 | 0.093 | 0.0442 | 94% | 89% | 2.076 | 4.1 |
| | central / G | 1.331 | 1.33 | 1.31 | 0.058 | 0.0442 | 93% | 88% | 2.047 | 3.5 |
| | mixture | 1.331 | 1.83 | 1.33 | 0.092 | 0.0440 | 94% | 89% | 2.079 | 4.1 |
| v2 + E | central / v2 | 1.361 | 2.00 | 1.42 | 0.083 | 0.0466 | 94% | 85% | 2.110 | 4.1 |
| | central / G | 1.351 | 1.56 | 1.40 | 0.050 | 0.0465 | 93% | 85% | 2.080 | 3.5 |
| | mixture | 1.361 | 2.06 | 1.44 | 0.087 | 0.0465 | 94% | 87% | 2.140 | 4.2 |
| v2 + E + B2 + K1 | central / v2 | 1.331 | 1.83 | 1.31 | 0.088 | 0.0452 | 94% | 88% | 2.084 | 4.1 |
| | central / G | 1.331 | 1.33 | 1.33 | 0.054 | 0.0451 | 93% | 87% | 2.054 | 3.5 |
| | mixture | 1.331 | 1.94 | 1.33 | 0.092 | 0.0450 | 94% | 89% | 2.104 | 4.2 |
| all six (v2, w14, avgNF, B2, K1, E) | central / v2 | 1.340 | 1.83 | 1.39 | 0.081 | 0.0476 | 93% | 87% | 2.096 | 4.1 |
| | central / G | 1.331 | 1.33 | 1.35 | 0.046 | 0.0475 | 93% | 86% | 2.067 | 3.5 |
| | mixture | 1.364 | 1.89 | 1.47 | 0.085 | 0.0475 | 94% | 88% | 2.128 | 4.2 |

**Reading.**
- **Calibration is a property of the noise model, not of the ensemble.** Central averaging keeps whichever noise it
  uses. G's noise gives the lowest CRPS and majority Brier in every set.
- **The mixture never helps on a proper score.** Where the candidates agree (v2+w14, v2+B2, v2+K1, B2+K1,
  v2+B2+K1), its CRPS and majority Brier are within ±0.005 of central averaging under the same v2 noise. Where they
  disagree, it is worse: CRPS +0.023 for v2+avgNF, +0.030 for v2+E, +0.020 for v2+E+B2+K1 and +0.032 for all six;
  majority Brier +0.004 in each of those four.
- **The mixture's PIT-90 is 1–2 points higher.** That comes from extra width, and G already found the lists
  calibrated at about 88%, so it is not a gain.
- **Both ways score the same lists.** The mixture's median sits between the candidates' medians, much like the
  central average's.

**The argument from G, which decides it.** The historical residuals that set `blocSd`, `listSd` and the floor were
measured on final polls against results. They already contain:
- each aggregator's error,
- the blackout,
- the turnout surprises.

A mixture adds the disagreement between models as a further, independent source of spread. That stacks variance,
which the brief's reading of G forbids. The disagreement is only legitimate uncertainty if it is not already in the
residuals. With error correlations of 0.97–1.00, it is almost all already there.

## Q3. Diversity

Seed 20261027; the script prints all three tables.

| | v2 | w14 | G | avgRaw | B2 | K1 | E |
|---|---|---|---|---|---|---|---|
| Correlation of signed seat errors with v2 (71 lists) | 1 | 1.00 | 1.00 | 0.89 | 0.97 | 0.99 | 0.98 |
| Correlation of signed central-share errors with v2 | 1 | 1.00 | 1.00 | 0.87 | 0.96 | 0.99 | 1.00 |
| Mean \|point − v2 point\|, seats per list | 0 | 0.00 | 0.03 | 0.69 | 0.25 | 0.11 | 0.20 |
| Lists whose point differs from v2's | 0% | 0% | 3% | 89% | 23% | 10% | 20% |
| Correlation of per-election list error with v2 (6 elections) | 1 | 1.00 | 1.00 | 0.96 | 0.98 | 0.99 | 0.99 |

- **The model variants differ from each other no more than from v2.** The pairwise error correlations among B2, K1
  and E are 0.95–0.97.
- **The gain an ensemble could make is bounded by this disagreement.** Averaging two forecasts with error
  correlation ρ and equal error variance cuts the error variance by a factor of (1 + ρ)/2. At ρ = 0.97–0.99 that is
  0.5–1.5% of the variance, about 0.01 seat of list error. That is what the tables show.
- **The plain average is the only candidate with ρ ≈ 0.89.** Its disagreement with v2 is v2's priors and lean,
  which the backtest shows are right more often than wrong: v2 without priors scores 1.69.

## Q4. The 2026 forecast

`node scripts/forecast/round2/F/backtest-f.mjs --2026` (50,000 runs, seed 20261027, polls through Oct 22). Equal
weights. "G noise" rows use the bloc median.

| Forecast | Blocs net/opp/mid/arab | Net 90% | P(net ≥ 61) | Shas | B'Yachad | Ra'am (pass) | Amcha pass | Reservists pass |
|---|---|---|---|---|---|---|---|---|
| **v2** | **54/51/0/15** | 47–59 | **3%** | 10 | 12 | 6 (95.8%) | 18.9% | 22.7% |
| G | 53/51/0/15 | 48–58 | 1% | 10 | 12 | 6 (96.2%) | 18.7% | 22.9% |
| B2 (history-only centre) | 54/51/0/15 | 47–59 | 2% | 10 | 12 | 6 (98.5%) | 19.1% | 22.8% |
| K1 | 54/51/0/15 (Likud 22) | 47–60 | 4% | 9 | 12 | 6 (95.4%) | 18.3% | 22.1% |
| E | 53/52/0/15 | 46–60 | 3% | 9 | 13 | 6 (94.7%) | 17.7% | 24.2% |
| Plain average (all polls) | 53/50/4/13 | 47–60 | 5% | 8 | 13 | 5 (90.3%) | 0.1% | 53.4% |
| Plain average (no Filber) | 48/54/4/14 | 43–56 | 0% | 8 | 14 | 5 (87.4%) | 0.1% | 53.4% |
| B2 + K1, central, G noise | 54/51/0/15 | 49–58 | 1% | 10 | 12 | 6 (96.1%) | 18.6% | 22.6% |
| v2 + B2 + K1, central, G noise | 53/51/0/15 | 49–58 | 1% | 10 | 12 | 6 (96.1%) | 18.6% | 22.6% |
| v2 + E + B2 + K1, central, G noise | 53/51/0/15 | 49–58 | 1% | 10 | 12 | 6 (96.1%) | 18.0% | 22.9% |
| v2 + E + B2 + K1, central, v2 noise | 54/51/0/15 | 47–60 | 3% | 10 | 12 | 6 (95.7%) | 18.1% | 22.7% |
| v2 + E + B2 + K1, mixture | 53/51/0/15 | 47–60 | 3% | 10 | 12 | 6 (96.0%) | 18.6% | 23.1% |
| v2 + E, central, G noise | 53/51/0/15 | 48–58 | 1% | 10 | 12 | 6 (96.2%) | 17.3% | 23.3% |
| v2 + avgNF, central, v2 noise | 53/52/0/15 | 45–58 | 1% | 9 | 13 | 6 (92.6%) | 1.7% | 37.1% |
| v2 + E + avgNF, central, v2 noise | 53/52/0/15 | 46–58 | 1% | 9 | 13 | 6 (93.9%) | 4.0% | 32.4% |

- **Every central-average and mixture ensemble without the plain average gives version 2's eleven list points.**
  Those are Likud 21, Otzma 8, Shas 10, UTJ 8, RZ 7, Yashar 22, B'Yachad 12, Democrats 9, Yisrael Beiteinu 8, Joint
  List 9 and Ra'am 6. The bloc point is 54 by sum, or 53 by the median.
- **The ensemble's 2026 differences are G's noise.** P(61) is 1% with G's noise and 3–4% with v2's.
- **With the plain average in, three things move.**
  - Shas and B'Yachad trade a seat, which is a D'Hondt margin.
  - Amcha Yisrael collapses to 2–4% to pass. The average reads it as zero seats in most polls, not as the 2.4% share
    the polls print.
  - The Reservists rise to 32–37%. The site's rule counts the Kantar polls that show them passing.

  These are artefacts of seat-based averaging. The yardstick penalises them: 7 wrong calls of 71, against 4.
- **The seat averages give half seats** (Shas 9.5, Likud 21.3), which the site cannot print.

## Recommendation

1. **Ship a single model as v3, not an ensemble.**
   - Out of sample, ensemble selection loses: 1.406 against 1.361.
   - The candidates' errors correlate 0.97–1.00, so averaging cannot cut the shared level bias that dominates the
     error (D, E).
   - The gains that appear are component gains (B2, K1) diluted by averaging.
   - An ensemble also costs things: a second code path the red team must review, half-seat or rounding artefacts,
     and a methodology page that must explain weights fitted on five elections.
2. **Put component changes in as components.** If the synthesis adopts B2 (it is doing so) and, against C's own
   advice, K1, add them to the model directly. "v2 + B2 + K1" equal-weighted is the same as applying each change at
   about a third of its strength. That makes it a way to *shrink* a change the backtest cannot fully support. The
   synthesis may use that framing for K1: apply the in-bloc funding to half of the −0.8, not all of it. It should not
   ship it as an ensemble.
3. **Never mix draws across models.** If an ensemble is ever used, average the central shares and simulate once with
   one calibrated noise model (G's). The mixture stacks between-model variance on residuals that already contain it.
4. **Do not give the plain average any weight in the forecast.** It stays on the site as the poll average, which is
   what it is for.
5. **Do not give E any weight.** It returns v2 (E's own verdict).
6. **2026 under the recommended path:** the ensemble question changes nothing. Every defensible ensemble gives v2's
   list points (54/51/0/15 by sum, 53 by the median) and P(net ≥ 61) of 1% with G's noise.

**Code.** `scripts/forecast/round2/F/ensemble.mjs` is a drop-in for the record or a future cycle; v3 needs none of it.

```js
import { ensemble, loadModel } from "./ensemble.mjs";
// candidates: functions (o) => model.mjs output; weights: any non-negative numbers (normalised)
const f = ensemble([optsA => modelA.forecast({ ...inputs, opts: { ...optsA } }), optsB => modelB.forecast({ ...inputs, opts: optsB })],
  [1, 1], { mode: "central", parties, simulate: (central, o) => modelG.forecast({ ...inputs, opts: { lean: 0, baseOverride: toFractions(central), noise: "v3", ...o } }), runs: 50_000 });
// mode "mixture" pools draws (needs loadModel(src, { draws: true })); mode "points" averages list points (fractional)
```

- **Output.** It returns model.mjs's shape: `lists`, `blocs`, `majority`, `netLargerThanOpp`, `largestList`,
  `inputs.ensemble.weights`, `parameters.mode`, plus `raw` and `_draws`.
- **The `central` mode needs a simulator** that accepts an override of the central shares.
  `loadModel(source, { baseOverride: true })` adds that to any model.mjs-family source in memory: one line before
  step 8. In model.mjs proper it would be an `opts.central` option.

**Backtest table for the recommendation.** It is G's row (single model) against v2: list error 1.361 (1.361),
Netanyahu-bloc 1.33 (1.94 averaged over three seeds), mean bloc 1.33 (1.39), wrong 4 (4), modal 6/6 (6/6), majority
Brier 0.055 (0.090), P(pass) Brier 0.0448 (0.0449), cov90 92% (92%). B2 is reported above as a single candidate.
Nothing in this memo needs an override of the gate, because nothing here ships.

## Reproduction

```
node scripts/forecast/round2/F/backtest-f.mjs            # Q1–Q3 tables, 10,000 runs × 3 seeds (~5 min)
node scripts/forecast/round2/F/backtest-f.mjs 10000 5    # five seeds
node scripts/forecast/round2/F/backtest-f.mjs --2026     # Q4, 50,000 runs (~40 s)
```

Model sources for v2, B, C and G are read at commit `56fee38`. E's is read from
`scripts/forecast/round2/E/model-e.mjs` as it stood on 2026-10-24 at 00:28. A later change to E's file changes its
rows; E's own memo reports the same numbers (1.39 / 2.50 / 1.58 / 4 / 0.081).
