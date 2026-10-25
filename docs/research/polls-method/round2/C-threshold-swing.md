# C. Lists near the threshold: the swing from the last polls to the result

Round 2, agent C. Written Saturday 2026-10-24. The vote is on Tuesday and the final lock is Monday 9 PM Central.

**Scope.** What happens between the last published polls and the result to lists polled near the 3.25%
threshold, and how version 3 should model it. The questions come from the brief: the distribution of the miss and
what it depends on, strategic desertion, the final-week dynamics, a concrete v3 treatment with a leave-future-out
backtest, the effect on 2026, and what is noise.

**Data.** The main analysis uses the 28-day files in `scripts/forecast/backtest/data/`. Agent D1's whole-campaign
files (`backtest/data-full/`, 2013 included) appeared during the work. I used them for three things: the 2013 cases,
the 28-day trend, and a robustness rerun of every table (marked "full" below). No 2026 poll after October 22 was
used. Nothing outside `scripts/forecast/round2/C/` and this memo was changed, and nothing was committed.

**Code.** All of it is in `scripts/forecast/round2/C/`:
- `model-c.mjs` is a copy of `scripts/forecast/model.mjs` with the options of this memo wired through `opts`. With
  none set it reproduces model.mjs exactly; I checked the 2026 lists and majority JSON against model.mjs, 20,000
  runs.
- `common.mjs` holds v2.mjs's `run` and `score`, pointed at model-c.mjs, plus a 2026 runner.
- `cases.mjs` builds the case table.
- `stats.mjs` (sections 1–3), `icc.mjs` (section 1.4), `calib.mjs` (section 4), `backtest-c.mjs` (section 5) and
  `fit2026.mjs` (sections 5.3 and 6).

```
node scripts/forecast/round2/C/cases.mjs && CDATA=full node scripts/forecast/round2/C/cases.mjs
node scripts/forecast/round2/C/stats.mjs            # CDATA=full for the full-data version
node scripts/forecast/round2/C/icc.mjs
node scripts/forecast/round2/C/calib.mjs
node scripts/forecast/round2/C/backtest-c.mjs 10000 [seed]   # CDATA=full / FITCASES=full for the robustness runs
node scripts/forecast/round2/C/fit2026.mjs 50000
```

## Summary

1. **The direction I was assigned mostly does not hold up.** Version 2 already treats a borderline list as the
   record says it should. Its swing is Gaussian: a class mean (−0.8 points for a first-time list), a 1.0-point
   floor, and the call taken from the simulated pass rate. I tested a fitted swing distribution, a desertion term, a
   trend term, a skewed swing, a shared bloc factor and a rescue term. None of them improves the leave-future-out
   yardstick robustly. Every apparent gain is one or two calls, each traceable to a single past case.
2. **The miss of a borderline list is not a level bias in aggregate, and its spread is what v2 already assumes.**
   - **All 24 lists** whose final-field share was 2–5% (2015–2022): result minus field has mean **+0.09 points**,
     sd **1.14**, skew +0.54, kurtosis 3.0.
   - **Without Blue and White 2021** (+3.06, the one outlier): mean −0.04, sd 0.97, skew −0.06, kurtosis 2.0.
     The distribution is Gaussian, with no fat tail.
   - **Net of v2's priors:** sd 0.98. The sd fitted for 2026 is **0.98** (90% cluster-bootstrap interval
     0.71–1.29), or 0.91 (0.65–1.21) with 2013 added. The 1.0 floor is right.
3. **What the miss depends on is the kind of list, not the distance from the line.**
   - **First-time lists 2–5%:** **−1.00 points, 5 of 5 below their polls**; 7 of 7 with 2013.
   - **First-time or first-solo-run lists 2–5%:** −0.79 points, 6 of 7 below.
   - **Established non-Arab lists:** +0.47 (sd 1.16, 6 of 13 below).
   - **Arab lists:** +0.37 (4 of 4 above; +0.16 with 2013).
   - **By bloc,** once the classes are taken out, nothing is left that six elections can see.
   - **Shared error:** about 40% of the variance net of class is common to a bloc's small lists in one election.
     The between-group sd is 0.63 and the within-group sd 0.78 (`icc.mjs`). The effective sample is about 12
     clusters, not 24 lists.
4. **No strategic desertion keyed to the line.**
   - **Distance from the line:** on the 2–5% cases, regressing the miss on (share − 3.25) gives −0.29 ± 0.40, and
     −0.41 ± 0.40 with the class terms in. On the desertion predictor P(pass) − 0.5 the coefficient is −0.68 ± 1.28
     (full data −0.25 ± 1.10). Desertion would need a positive sign: lists just over the line gaining, lists just
     under losing. The estimate is the opposite sign and indistinguishable from zero.
   - **By band:** lists just under the line moved +0.25 (n = 3), lists at 3.25–4% +0.18 (n = 9), at 4–5% −0.02.
   - **The 6–8% lists lose most:** −0.72 points, 11 of 15 below their polls, 90% interval −1.30 to −0.16. Votes
     do desert small and medium lists for the big ones. It is not a threshold effect, and v2's class priors
     (Bennett's lists, new lists, Shas) carry most of it.
5. **The final weeks carry no usable trend.**
   - **Movement:** borderline lists move little in the field. The mean absolute change is 0.24 points over the last
     7 days, 0.30 over 14 and 0.38 over 28 (full data). The 6–8% lists move about twice as much.
   - **Prediction:** the final-week move does not predict the miss beyond the final level. The coefficient is
     −0.86 ± 0.74 on the 7-day move and −0.48 ± 0.48 on the 14-day move with the class terms in. The miss goes the
     trend's way in 6 of 13 cases. Agent D finds the same for all lists (D-blackout.md, Summary 2).
   - **In the backtest:** carrying the trend forward (+0.5 × d7) is neutral to worse (1.387 against 1.361), and
     reverting it (−0.5 × d7) is worse (1.466).
6. **Version 2's four wrong calls** (`backtest-c.mjs`, all three seeds):

   | List | v2 P(pass) | Result | Class |
   |---|---|---|---|
   | Yisrael Beiteinu, April 2019 | 47% | passed, 4.01% | established, rescued |
   | New Right, April 2019 | 80% | failed, 3.22%, 0.03 points short | new |
   | Zehut, April 2019 | 71% | failed, 2.74% | new |
   | Meretz, 2022 | 66% | failed, 3.16%, 0.09 points short | established |

   - **Calibration:** v2's simulated P(pass) is well calibrated. On the 37 lists it did not call with certainty it
     expected 26.8 passes against 28 actual, and expected 6.1 wrong calls against 4 (`calib.mjs`).
   - **What is avoidable:** two of the four misses were within 0.1 point of the line. They are the noise a
     calibrated model is supposed to get wrong about a third of the time.
   - **Leakage:** v2's backtest row is in-sample on the threshold class. The −0.8 for first-time lists was fitted
     on these same elections. Fitted leave-future-out (variant B1), the same prior gives **5 wrong calls, not 4**:
     Yachad 2015 had no earlier case to learn from. The list error is unchanged at 1.36.
7. **Recommendation for v3.**
   - **(a) Keep v2's threshold treatment and record it as the fitted swing distribution** demanded by decision 7:
     per borderline list, N(class mean, 1.0 point). The fitted values are sd 0.98, first-time mean −0.75 (90%
     interval −1.16 to −0.20) and Arab mean +0.2 to +0.4. All are within rounding of what v2 ships.
   - **(b) Change the last-resort share for a list printed below with no % from 2.0% to 2.5%.** 2.5% is the median
     of the 51 printed shares of lists other polls showed passing, 2015–2022. This is a documented override: the
     backtest cannot test it, because the fallback fires on about 6% of below-threshold cells and never on a list
     that decides a call. It matters only if a final poll prints a list below without a %.
   - **(c) Do not add a desertion term, a trend term, a skew or a rescue term.**
   - **(d) One candidate passed the 28-day gate and failed the robustness checks,** so I do not recommend it: fund a
     first-time list's −0.8 from its own bloc's largest list instead of from every list (K1). On the 28-day data it
     improves the list error from 1.361 to 1.307 on three seeds, with calls unchanged and net error better. On D1's
     files it gives 1.422 → 1.416 with one more wrong call, and with leave-future-out magnitudes it is neutral to
     worse. The whole gain is Likud's late consolidation in 2015 and April 2019.
8. **Effect on 2026** (data/polls.json through Oct 22, 50,000 runs):
   - The recommended package leaves v2's forecast unchanged: Amcha Yisrael (poi) 18.9% to pass, Reservists (res)
     22.7%, Ra'am 95.8% at 6 seats, RZ 99.2% at 7. The blocs are 54/51/0/15 and P(Netanyahu bloc ≥ 61) is 3%.
   - The calls are robust to every variant tested here. poi and res stay "fail" unless the first-time prior is
     removed altogether; then they sit at 47% and 49%.
   - The one live sensitivity is the size of that prior. At the fitted −0.56 (shrunk) they rise to 26% and 30%, and
     at −1.2 they fall to 10% and 13%.
   - K1 would move Likud from 21 to 22 seats, with the Netanyahu bloc mean 53.2 → 53.7.
9. **What is noise:**
   - **The class effect for first-time lists is real.** It has the same sign in 8 of 9 cases with 2013, a sign test
     p ≈ 0.02, and holds in both halves.
   - **Everything else in this memo is not distinguishable from zero with about 12 independent clusters:** the
     Arab and established-list means, any desertion or trend coefficient, skewness, the exact sd between 0.8 and
     1.15, and every one-call difference in the backtest.
   - **The established-list "rescue"** (+0.47 raw, +0.34 shrunk, interval −0.12 to +0.85) rests on Blue and White,
     Labor and Meretz in 2021.

## 1. The cases and the distribution of the miss (question 1)

**Field share.** I used the share version 2 actually uses: model-c.mjs's `fieldShare`, output for this analysis.
It is built as follows:
- one latest poll per outlet within 7 days of the newest, with the Filber-firm checks left out;
- the D'Hondt-midpoint seats-to-shares rule;
- printed % for lists below the threshold;
- the field renormalised to 98.5% (the fringe);
- taken before priors and the lean.

The same field is recomputed with the polls as they stood 7 and 14 days earlier (and 28 days earlier on the full
data).

**Miss.** The result share minus the field share, in points.

**Classes.** Set by hand in `cases.mjs`:
- **New:** first run as a list. Yachad 2015; New Right, Zehut and Gesher April 2019; Democratic Union 2019;
  New Economic 2021; Otzma LeYisrael and Am Shalem 2013, among others.
- **Solo:** first run alone after sitting inside a joint list. Otzma September 2019, RZ 2021, Jewish Home 2022,
  Balad 2022.
- **Arab:** the 'arab' bloc.

On the full data the bands are measured from each election's own threshold, 2% in 2013.

The 2–5% band, 2015–2022 (`cases.mjs` output, field at the newest poll):

| Election | List | Class | Field | 7-day move | 14-day move | Shown below | Result | Miss | Passed | v2 P(pass) |
|---|---|---|---|---|---|---|---|---|---|---|
| 2019-04 | Gesher | new | 2.45 | −0.09 | −0.04 | 9/10 | 1.73 | −0.72 | no | 5% |
| 2019-04 | Yisrael Beiteinu | | 3.14 | +0.01 | +0.12 | 3/10 | 4.01 | +0.87 | yes | 47% |
| 2021-03 | Ra'am | Arab | 3.21 | +0.26 | +0.20 | 1/7 | 3.79 | +0.58 | yes | 69% |
| 2019-04 | Ra'am–Balad | Arab | 3.29 | +0.46 | −0.13 | 2/10 | 3.33 | +0.04 | yes | 71% |
| 2019-09 | Otzma Yehudit | solo | 3.41 | +0.45 | +1.30 | 3/9 | 1.88 | −1.52 | no | 26% |
| 2022-11 | Ra'am | Arab | 3.48 | 0.00 | −0.01 | 0/8 | 4.07 | +0.59 | yes | 72% |
| 2022-11 | Hadash–Ta'al | Arab | 3.48 | 0.00 | −0.01 | 0/8 | 3.75 | +0.27 | yes | 71% |
| 2021-03 | Blue and White | | 3.57 | −0.23 | −0.27 | 0/7 | 6.63 | +3.06 | yes | 63% |
| 2021-03 | Meretz | | 3.62 | +0.29 | +0.35 | 0/7 | 4.58 | +0.96 | yes | 65% |
| 2015-03 | Yachad | new | 3.78 | −0.01 | −0.20 | 1/15 | 2.97 | −0.81 | no | 40% |
| 2022-11 | Meretz | | 3.81 | −0.17 | −0.18 | 0/8 | 3.17 | −0.65 | no | 66% |
| 2019-04 | Kulanu | | 3.87 | +0.31 | +0.37 | 2/10 | 3.54 | −0.33 | yes | 76% |
| 2021-03 | Religious Zionism | solo | 4.09 | +0.34 | +0.48 | 0/7 | 5.12 | +1.03 | yes | 53% |
| 2019-09 | Labor–Gesher | | 4.10 | −0.75 | −0.93 | 0/9 | 4.80 | +0.70 | yes | 77% |
| 2015-03 | Meretz | | 4.34 | −0.13 | +0.11 | 0/15 | 3.93 | −0.41 | yes | 86% |
| 2019-04 | Shas | | 4.36 | +0.02 | +0.20 | 0/10 | 5.99 | +1.63 | yes | 97% |
| 2019-09 | Democratic Union | new | 4.41 | −0.63 | −1.01 | 0/9 | 4.34 | −0.07 | yes | 85% |
| 2019-04 | Meretz | | 4.45 | +0.33 | +0.17 | 0/10 | 3.63 | −0.82 | yes | 87% |
| 2021-03 | Labor | | 4.46 | −0.35 | −0.25 | 0/7 | 6.09 | +1.64 | yes | 89% |
| 2022-11 | Labor | | 4.47 | +0.13 | −0.01 | 0/8 | 3.69 | −0.77 | yes | 86% |
| 2019-04 | Zehut | new | 4.54 | +0.08 | +0.48 | 0/10 | 2.74 | −1.80 | no | 71% |
| 2022-11 | Yisrael Beiteinu | | 4.65 | −0.45 | −0.08 | 0/8 | 4.49 | −0.16 | yes | 89% |
| 2015-03 | Yisrael Beiteinu | | 4.68 | −0.26 | −0.25 | 0/15 | 5.10 | +0.43 | yes | 93% |
| 2019-04 | New Right | new | 4.83 | +0.01 | −0.12 | 0/10 | 3.22 | −1.61 | no | 80% |

The v2 P(pass) column comes from the 10,000-run leave-future-out backtest. It includes v2's priors and lean, so it
is not a function of the field share alone.

### 1.1 Moments (`stats.mjs`; "full" = `CDATA=full`, 2013 added and bands taken from each election's threshold)

| Group | n | Mean miss | 90% interval (cluster bootstrap by election) | sd | Skew | Kurtosis | Below polls |
|---|---|---|---|---|---|---|---|
| 2–5%, all | 24 | **+0.09** | −0.31 … +0.72 | **1.14** | +0.54 | 2.98 | 12/24 |
| 2–5%, net of v2's prior | 24 | +0.17 | −0.23 … +0.80 | 0.98 | +1.34 | 3.96 | 13/24 |
| 2–5%, without Blue and White 2021 | 23 | −0.04 | −0.32 … +0.43 | 0.97 | −0.06 | 2.01 | 12/23 |
| full: 2–5%, all | 30 | +0.01 | −0.31 … +0.50 | 1.04 | +0.75 | 3.61 | 17/30 |
| full: without Blue and White 2021 | 29 | −0.10 | −0.31 … +0.24 | 0.88 | +0.10 | 2.34 | 17/29 |
| New (first run) | 5 | **−1.00** | −1.38 … −0.32 | 0.71 | | | **5/5** |
| full: new (first run) | 7 | −0.91 | −1.24 … −0.40 | 0.61 | | | **7/7** |
| New or first solo run | 7 | −0.79 | −1.24 … +0.11 | 1.01 | | | 6/7 |
| Established, non-Arab | 13 | +0.47 | −0.17 … +1.22 | 1.16 | +0.86 | | 6/13 |
| Arab | 4 | +0.37 | +0.20 … +0.50 | 0.27 | | | 0/4 |
| full: Arab | 7 | +0.16 | 0.00 … +0.37 | 0.39 | | | 2/7 |
| Bloc net | 8 | −0.07 | | 1.27 | | | 4/8 |
| Bloc opp | 11 | +0.25 | | 1.23 | | | 7/11 |

The one positive outlier is Blue and White 2021 (+3.06). It is the source of the positive skew, and of the skew in
the net-of-prior row.

**The spread against version 2's noise:**

| Field share | n | RMS miss | RMS net of prior | v2's sd, max(1.0, 1.08·√(s/8)) | The √s formula alone |
|---|---|---|---|---|---|
| 2–3.25% | 3 | 0.73 | 0.51 | 1.00 | 0.65 |
| 3.25–4.5% | 17 | **1.15** | 1.09 | 1.00 | 0.76 |
| 4.5–6% | 13 | 0.99 | 0.78 | 1.00 | 0.88 |
| 6–8% | 15 | **1.50** | 1.42 | 1.00 | 1.00 |
| 8–12% | 7 | 1.43 | 1.05 | 1.21 | 1.21 |
| 12–40% | 12 | 2.70 | 2.70 | 1.80 | 1.80 |

- **Near the line, the floor is right.** The √s formula alone would be about 35% too narrow at 3.25–4.5%. The
  1.0 floor fixes that, and the fitted sd net of prior is 0.98.
- **At 6–8% v2 is too narrow,** by about 1.4 against 1.0. This is not a threshold question; it goes to agent G.
  For 2026 it matters for RZ (5.8% central, 99.2% to pass in v2). With the 6–8% band's sd and mean, its
  pass probability would be nearer 90–95%.

### 1.2 Level bias or wider noise?

- **In aggregate, neither.** The pooled mean is zero (+0.09; −0.04 without Blue and White). The pooled sd is
  1.0–1.15. That is wider than a proportional-to-√share rule gives, but it equals v2's floor.
- **By class, the miss is a level bias.** The class terms explain about a fifth of the variance: the residual sd
  falls from 1.14 to 1.01 with a new/solo dummy, coefficient −1.23 ± 0.45.
- **Within class the remainder is Gaussian noise of about 0.9–1.0 points.** Kurtosis is 2.0–2.4 once Blue and
  White is out, so there are no fat tails.
- **The shape that looks bimodal** is the mixture of a negative mean for new lists and a positive one for
  established and Arab lists. It does not come from the distance to the line.

### 1.3 Age, bloc, distance, trend: the regressions (2–5% band, OLS coefficient ± se)

These standard errors ignore the clustering by election, so they are optimistic.

| Model | Constant | New/solo | Arab | Distance (share − 3.25) | P(pass) − 0.5 | 7-day move | 14-day move | Residual sd |
|---|---|---|---|---|---|---|---|---|
| distance | +0.29 ± 0.36 | | | −0.29 ± 0.40 | | | | 1.15 |
| desertion | +0.24 ± 0.37 | | | | −0.68 ± 1.28 | | | 1.16 |
| class | +0.47 ± 0.29 | **−1.26 ± 0.48** | −0.10 ± 0.59 | | | | | 1.03 |
| class + distance | +0.83 ± 0.45 | −1.34 ± 0.49 | −0.41 ± 0.66 | −0.41 ± 0.40 | | | | 1.03 |
| class + desertion | +0.79 ± 0.47 | −1.34 ± 0.50 | −0.37 ± 0.67 | | −1.12 ± 1.29 | | | 1.04 |
| class + 7-day move | +0.40 ± 0.29 | −1.17 ± 0.49 | +0.10 ± 0.62 | | | −0.75 ± 0.71 | | 1.03 |
| class + 14-day move | +0.45 ± 0.29 | −1.17 ± 0.49 | −0.07 ± 0.59 | | | | −0.48 ± 0.48 | 1.03 |
| full: class + distance | +0.69 ± 0.36 | −1.27 ± 0.41 | −0.34 ± 0.44 | −0.32 ± 0.31 | | | | 0.93 |
| full: 28-day move, with class | +0.42 ± 0.25 | −1.14 ± 0.40 | −0.20 ± 0.44 | | | | 28-day: −0.29 ± 0.31 | 0.94 |

### 1.4 How much of the miss is shared

This is a one-way random-effects analysis of variance (`icc.mjs`). Each case is grouped by election × bloc, and
the miss is taken net of the class means.

| | Within-group sd | Between-group sd | Total | Share of variance in common |
|---|---|---|---|---|
| 28-day (24 cases, 12 groups) | 0.78 | 0.63 | 1.00 | **40%** |
| full (30 cases, 16 groups) | 0.74 | 0.52 | 0.91 | 33% |

The groups that move together:
- the 2021 opposition small lists: Blue and White, Meretz, Labor, +1.41 on average;
- the 2022 opposition small lists: Meretz, Labor, Yisrael Beiteinu, −1.00;
- the April 2019 right-wing small lists, from Yisrael Beiteinu's +1.16 down to New Right's −1.02 net of class.

This agrees with round-one C's estimate (about half shared) and is the main reason the sample is small.

## 2. Strategic desertion (question 2)

The hypothesis: voters abandon a list that looks set to fail. A list just under the line then loses further, and a
list just over it gains as its voters are reassured. The model form is a mean shift k·(P(pass) − 0.5) with k > 0.

| Final-field share | n | Mean miss (28-day) | n | Mean miss (full, from the election's threshold) |
|---|---|---|---|---|
| Under the line, 2–3.25% | 3 | +0.25 | 2 | +0.08 |
| Just over, 3.25–4% | 9 | +0.18 | 13 | +0.04 |
| 4–5% | 12 | −0.02 | 15 | −0.03 |
| 5–6% | 9 | −0.07 | 11 | −0.11 |
| **6–8%** | 15 | **−0.72** (90%: −1.30 … −0.16; 11/15 below) | 16 | −0.63 (−1.14 … −0.13) |
| 6–8%, established non-Arab | 10 | −0.37 | 10 | −0.22 |

- **No desertion keyed to the line.**
  - **The slope:** the desertion slope is negative, −0.68 ± 1.28 alone and −1.12 ± 1.29 with the class terms. The
    distance slope is −0.29 ± 0.40.
  - **Lists under the line** gained a little on average: Yisrael Beiteinu 2019 +0.87 and Ra'am 2021 +0.58 against
    Gesher −0.72.
  - **The two dramatic collapses,** New Right and Zehut 2019, were lists polled comfortably over the line at 4.5–4.8.
    Both were first-time lists that their own bloc's leader attacked as wasted votes.
  - **The backtest:** the desertion term as theory predicts it (variant C1, k = +0.6) costs list error (1.361 →
    1.387 at the default seed, 1.39–1.42 across seeds). It does not change the calls. It sharpens the pass
    probabilities (threshold Brier 0.0449 → 0.0437) only because it pushes them away from 50%. The opposite sign
    (C2) is worse on both counts.
- **The 6–8% lists are where votes are lost.**
  - **Cases:** Labor April 2019 −3.5, New Hope −2.8, Joint List 2021 −1.9, Yamina in three elections −1.0 to −1.5,
    Labor–Gesher–Meretz 2020 −1.3.
  - **Mechanism:** this is consolidation toward the big lists, of the kind agent B measured for Bennett's lists and
    new lists in round 1.
  - **Why it is not a threshold term:** in the elections where Likud gained most from it (2015, April 2019), the
    lists that bled were partly on the line (New Right, Zehut, Yachad), and that part is v2's first-time prior.
  - **Bloc effect:** where the deserted votes go, the large list of the same bloc, is the only part of the
    mechanism with a bloc effect. It is tested as K1 in section 5.

## 3. Within-campaign dynamics (question 3)

**How much borderline lists move in the field:**

| | n | Mean absolute move | sd | Mean signed move |
|---|---|---|---|---|
| 2–5%, last 7 days | 24 | **0.24** | 0.32 | −0.02 |
| 2–5%, last 14 days | 24 | 0.30 | 0.45 | +0.01 |
| full: 2–5%, last 28 days | 30 | 0.38 | | |
| 6–8%, last 7 days | 15 | 0.50 | 0.67 | 0.00 |
| 6–8%, last 14 days | 15 | 0.60 | 0.78 | −0.12 |
| all lists, last 7 days | 71 | 0.39 | 0.55 | 0.00 |

- **The final level carries the information; the move does not.** A borderline list's field moves about a quarter
  of a point in its last week, against a miss sd of 1.0.
- **The trend coefficients are negative throughout,** which would mean reversion, and none is distinguishable from
  zero:
  - 7-day: −0.86 ± 0.74 alone and −0.75 ± 0.71 with the class terms;
  - 14-day: −0.68 ± 0.52 and −0.48 ± 0.48;
  - 28-day (full data): −0.36 ± 0.34 and −0.29 ± 0.31.
- **Direction:** the miss went the way of the final-week move in 6 of 13 cases (14 days: 5 of 12; all lists: 23
  of 42).
- **Biggest movers:** Otzma 2019 rose 1.3 points in its last 14 days and then lost 1.5. Democratic Union fell 1.0
  and then missed by only −0.07.
- **Backtest:** extrapolating the 7-day trend for lists under 5% (D1, +0.5·d7) gives 1.387 against 1.361. Reversion
  (D2) gives 1.466 and adds a wrong call.

The 2026 field for the lists near the line has barely moved (`fit2026.mjs`):

| List | Field share Oct 22 | Oct 15 | Oct 8 | 7-day | 14-day |
|---|---|---|---|---|---|
| Amcha Yisrael (poi) | 3.11 | 3.03 | 3.15 | +0.08 | −0.04 |
| Reservists (res) | 3.37 | 3.59 | 3.37 | −0.23 | 0.00 |
| Ra'am | 4.43 | 4.42 | 4.39 | +0.01 | +0.04 |
| RZ | 5.54 | 4.92 | 4.87 | +0.62 | +0.67 |
| Noam | not in any poll: v2 holds it at 0 and counts it in the 1.5% fringe | | | | |

## 4. Version 2's wrong calls and its calibration

v2 gets the same four calls wrong on every seed:

| List | v2 central share | v2 P(pass) | Result | What happened |
|---|---|---|---|---|
| Yisrael Beiteinu, April 2019 | 3.19% | 47% | 4.01%, 5 seats | Established; 3 of 10 field polls printed it below; rescued (+0.87) |
| New Right, April 2019 | 4.09% (field 4.83 − 0.8) | 80% | 3.22%, failed | First-time; attacked by Likud; missed the line by 0.03 points |
| Zehut, April 2019 | 3.80% (4.54 − 0.8) | 71% | 2.74%, failed | First-time; −1.8 points, the largest borderline collapse on record |
| Meretz, 2022 | 3.68% | 66% | 3.16%, failed | Established; the opposition's small lists all fell (bloc-shared, section 1.4) |

**v2's P(pass) is calibrated** (`calib.mjs`). These are the 37 lists with P(pass) strictly between 0.5% and
99.5%:

| P(pass) bin | n | Mean P | Passed |
|---|---|---|---|
| < 0.30 | 5 | 0.12 | 0 |
| 0.30–0.50 | 2 | 0.44 | 1 |
| 0.50–0.70 | 5 | 0.63 | 4 |
| 0.70–0.85 | 8 | 0.75 | 6 |
| 0.85–0.95 | 6 | 0.88 | 6 |
| ≥ 0.95 | 11 | 0.99 | 11 |

Overall it expected 26.8 passes and 28 happened. Expected wrong calls were 6.1 and the actual count was 4. Four
wrong of 71 is, if anything, better than a calibrated model should expect. Pushing for fewer means fitting the
four cases.

**The −0.8 first-time prior in v2.mjs is in-sample.** `CLASSES` applies it to Yachad 2015, New Right, Zehut and
Gesher 2019, Otzma 2019, New Economic and RZ 2021. Its size comes from round-one memos that used those same
elections. Estimated leave-future-out from the earlier elections only (B1: shrunk mean, n₀ = 3), it is 0 for 2015,
−0.20 for April 2019, about −0.7 from September 2019 on, and −0.56 for 2022. Yachad 2015 then flips to a wrong
"pass": 5 wrong calls, list error 1.361–1.385. Adding 2013's cases (`FITCASES=full`) gives 2015 −0.27, which is not
enough to save the Yachad call. So **the honest leave-future-out record of v2's threshold handling is 5 wrong calls,
not 4.**

The prior itself is supported: 8 of 9 cases are negative, and the 2026 fit on all six elections is −0.75. The
backtest just cannot show it.

## 5. Variants for version 3, leave-future-out (question 4)

**Method.** Each variant is `run`/`score` from v2.mjs (`common.mjs`) on model-c.mjs, 10,000 runs, seed 20261027.
Any fitted parameter is estimated only from the elections before the one being forecast. Columns:
- the brief's five;
- **expWrong:** the number of wrong calls the model itself expects (Σ min(p, 1 − p));
- **passBrier:** the Brier score of P(pass) over all 71 lists.

Seeds 1 and 2 were also run. Where they change a cell, the range is given in section 5.2.

| Variant | Per-list error | Net-bloc error | Mean bloc error | Wrong calls | expWrong | Majority right | Majority Brier | passBrier | Per election |
|---|---|---|---|---|---|---|---|---|---|
| **v2** | **1.361** | 1.83 | 1.33 | **4** | 6.1 | 6/6 | 0.090 | 0.0449 | 1.64 2.86 0.80 0.67 1.29 0.92 |
| A1 sd 1.15 for lists < 6.9% | 1.361 | 1.83 | 1.33 | 4 | 6.8 | 6/6 | 0.089 | 0.0461 | same |
| A2 sd fitted leave-future-out, shrunk to 1.0 (n₀ = 10) | 1.361 | 1.83 | 1.33 | 4 | 5.7 | 6/6 | 0.090 | 0.0442 | same |
| A3 sd 0.8 | 1.361 | 1.83 | 1.33 | 4 | 5.2 | 6/6 | 0.088 | 0.0441 | same |
| B1 first-time shift fitted leave-future-out (shrunk) | 1.361 | 1.33 | 1.17 | 5 | 6.1 | 6/6 | 0.089 | 0.0577 | same |
| B1b same, unshrunk | 1.557 | 2.50 | 1.58 | 7 | 6.1 | 6/6 | 0.113 | 0.0537 | 1.64 2.86 1.40 0.67 1.86 0.92 |
| B2 first-time shift −0.5 | 1.361 | 1.50 | 1.17 | 5 | 6.2 | 6/6 | 0.087 | 0.0507 | same |
| B3 first-time shift −1.0 | 1.457 | 2.50 | 1.58 | 5 | 6.2 | 6/6 | 0.107 | 0.0443 | 1.64 2.86 0.80 0.67 1.86 0.92 |
| B4 no first-time shift | 1.419 | **0.67** | 1.33 | 6 | 6.0 | 6/6 | **0.080** | 0.0598 | 1.64 3.00 1.00 0.67 1.29 0.92 |
| C1 desertion k = +0.6 (theory) | 1.387 | 2.17 | 1.42 | 4 | 5.1 | 6/6 | 0.093 | 0.0437 | 1.64 3.00 0.80 0.67 1.14 1.08 |
| C2 desertion k = −0.6 | 1.415 | 2.00 | 1.75 | 4 | 7.4 | 6/6 | 0.088 | 0.0480 | 1.64 2.71 0.60 0.89 1.57 1.08 |
| D1 trend +0.5 × 7-day move | 1.387 | 2.17 | 1.50 | 4 | 6.3 | 6/6 | 0.089 | 0.0449 | 1.64 2.86 0.80 0.67 1.29 1.08 |
| D2 trend −0.5 × 7-day move | 1.466 | 2.33 | 1.58 | 5 | 6.0 | 6/6 | 0.086 | 0.0467 | 1.64 2.71 1.00 0.67 1.86 0.92 |
| E1 shared bloc factor 0.6 + own 0.8 (lists < 6.9%) | 1.361 | 2.00 | 1.42 | 4 | 6.2 | 6/6 | 0.098 | 0.0441 | same |
| F1 skew-normal swing, α = +3, sd 1.0 | 1.431 | 2.33 | 1.58 | 5 | 6.0 | 6/6 | 0.097 | 0.0451 | 1.64 2.71 0.80 0.67 2.00 0.77 |
| F2 skew-normal swing, α = −3, sd 1.0 | 1.340 | 2.00 | 1.50 | 3 | 6.0 | 6/6 | 0.090 | 0.0443 | 1.64 2.71 0.80 0.67 1.14 1.08 |
| G1 established small lists +0.3 (rescue, in-sample) | 1.340 | 1.83 | 1.42 | 3 | 5.4 | 6/6 | 0.093 | 0.0420 | 1.64 2.86 0.80 0.67 1.00 1.08 |
| G2 rescue fitted leave-future-out (shrunk n₀ = 5) | 1.363 | 2.00 | 1.42 | 4 | 5.7 | 6/6 | 0.099 | 0.0465 | 1.64 2.86 0.80 0.67 1.14 1.08 |
| I1 unprinted-below last resort 2.5% | 1.361 | 1.83 | 1.33 | 4 | 6.2 | 6/6 | 0.091 | 0.0451 | same |
| J1 first-time −0.8 taken by own bloc's largest list (class as defined here) | 1.307 | 1.50 | 1.17 | 4 | 6.5 | 6/6 | 0.090 | 0.0471 | 1.45 2.57 0.80 0.67 1.43 0.92 |
| J2 same, magnitude leave-future-out (B1) | 1.385 | 1.33 | 1.25 | 5 | 6.2 | 6/6 | 0.086 | 0.0586 | 1.64 2.86 0.80 0.67 1.43 0.92 |
| **K1 v2's own priors; the first-time ones taken from the bloc's largest list (drop-in)** | **1.307** | 1.50 | 1.25 | 4 | 6.4 | 6/6 | 0.089 | 0.0454 | 1.45 2.57 0.80 0.67 1.43 0.92 |
| H1 A2 + B1 (everything leave-future-out) | 1.385 | 1.33 | 1.25 | 5 | 5.7 | 6/6 | 0.091 | 0.0568 | 1.64 3.00 0.80 0.67 1.29 0.92 |

"same" means the per-election errors are those of v2. The leave-future-out parameters by election are printed at
the end of the script's output:
- 2015: shift 0, sd 1.00
- April 2019: −0.20, 0.89
- September 2019: −0.71, 0.83
- 2020: −0.73, 0.80
- 2021: −0.73, 0.80
- 2022: −0.56, 1.05

### 5.1 Robustness: D1's full-campaign files (`CDATA=full`)

On these files the harness takes its set of checks from every poll in the campaign. An outlet that published a
single Filber-firm poll months earlier is then left out of the final field: Channel 13 and Israel Hayom in 2020,
Channel 13 and Makor Rishon in September 2019. So v2's row is 1.422 there, not 1.361. Read the rows as a perturbation
test, not a second yardstick.

| Variant | Per-list error | Net-bloc error | Mean bloc error | Wrong calls | Majority Brier | Per election |
|---|---|---|---|---|---|---|
| v2 | 1.422 | 1.67 | 1.42 | 4 | 0.095 | 1.64 2.86 0.80 0.89 1.43 0.92 |
| A2 | 1.422 | 1.67 | 1.42 | 4 | 0.095 | same |
| C1 desertion | 1.411 | 1.83 | 1.33 | 4 | 0.098 | 1.64 3.00 0.80 0.67 1.29 1.08 |
| D1 trend | 1.415 | 1.83 | 1.42 | 4 | 0.094 | 1.64 2.86 0.60 0.89 1.43 1.08 |
| F2 skew α = −3 | 1.387 | 1.83 | 1.58 | 3 | 0.093 | 1.64 2.71 0.80 0.67 1.43 1.08 |
| G1 rescue +0.3 | 1.400 | 1.67 | 1.50 | 3 | 0.098 | 1.64 2.86 0.80 0.89 1.14 1.08 |
| K1 bloc funding | 1.416 | 1.83 | 1.42 | **5** | 0.094 | 1.45 2.57 0.80 0.89 **1.86** 0.92 |

### 5.2 Reading the table

- **The sd (A1–A3) changes nothing scored.** Lists sit far enough from 50% that a ±15% change in sd flips no call
  and moves no median. A narrower sd improves the threshold Brier and the expected-versus-actual wrong calls
  slightly. The fitted value, 0.98 for 2026, is the floor already in use.
- **The first-time prior (B) is the only thing that matters, and its size cannot be validated.**
  - Removing it (B4) costs 0.06 in list error and 2 calls, but gives the best net-bloc error (0.67) and the best
    majority Brier (0.080).
  - The reason: v2 funds the −0.8 from every list in proportion, including the opposition. In reality New Right's,
    Zehut's and Yachad's voters went to Likud.
- **Desertion (C), trend (D) and the right-skewed swing (F1) are worse or neutral on every dataset and seed.**
- **The left-skewed swing (F2) and the rescue term (G1) each gain one call, the same one: Yisrael Beiteinu 2019,
  at 47%.**
  - F2's negative skew puts a mean-zero swing's median above its mean, which lifts lists just under the line. G1
    lifts established lists directly.
  - Neither is supported by the fitted distribution. The sample skew is ≈0, or positive with Blue and White.
  - G1's leave-future-out version (G2) loses the gain.
  - Both are fits to one case. Neither has any effect on 2026: no established non-Arab list is under 5% there. F2
    moves Reservists from 22.7% to 23.9%.
- **The shared bloc factor (E1) matches the structure of section 1.4 but scores worse** on the majority Brier
  (0.098, against 0.090), and identically elsewhere. Correlated failure of a bloc's small lists widens the bloc
  distribution, which six elections do not reward. I leave the correlation structure to agent G.
- **K1 (J1) is the one candidate that passes the gate on the 28-day data.**
  - **Result there:** it improves the list error by 0.054 on all three seeds (1.307 each, against 1.361). The
    net-bloc error is better (1.50–1.83 against 1.83–2.00), calls are unchanged at 4 and the majority Brier is equal
    (0.088–0.090 against 0.089–0.091).
  - **Where the gain comes from:** Likud +1 seat in 2015 (actual 30) and +1 to +2 in April 2019 (actual 35), plus
    Zehut's and Meretz's knock-ons.
  - **Where it costs:** 2021, where New Economic's deserted share goes to Yesh Atid (already over-polled) and
    Labor loses a seat.
  - **It fails three robustness checks:**
    - with leave-future-out magnitudes it is no better than B1 (J2 1.385 against B1 1.361–1.385);
    - on D1's files it gives 1.416 against 1.422 with **one more wrong call** (RZ 2021, whose −0.8 now goes to
      Likud);
    - its gain is two elections of Likud consolidation, the "spikes" round-one B said not to treat as a constant.
  - **Verdict:** the mechanism is right in sign, since deserted votes go to the bloc's big list. The evidence is
    two episodes.

### 5.3 Parameters fitted for 2026 (all six elections; `fit2026.mjs`)

| Parameter | Fitted (28-day) | 90% cluster bootstrap | With 2013 (full) | v2 uses |
|---|---|---|---|---|
| sd of a borderline list's miss, net of prior (shrunk to 1.0, n₀ = 10) | 0.98 | 0.71 … 1.29 | 0.91 (0.65 … 1.21) | 1.0 floor |
| First-time / first-solo mean, unshrunk (9 cases; 11 with 2013) | −0.75 | −1.16 … −0.20 | −0.74 (−1.10 … −0.31) | −0.8 |
| Same, shrunk n₀ = 3 | −0.56 | −0.88 … −0.14 | −0.58 (−0.86 … −0.24) | — |
| Established non-Arab small lists ("rescue"), shrunk n₀ = 5 | +0.34 (raw +0.47) | −0.12 … +0.85 | +0.30 (raw +0.40) | 0 |
| Arab small lists | +0.37 (n = 4) | +0.20 … +0.50 | +0.16 (n = 7) | +0.6 (Ra'am), +0.4 (Joint List), from round-one B |
| Desertion k, on P(pass) − 0.5 | −0.68 ± 1.28 (wrong sign) | | −0.25 ± 1.10 | 0 |
| Trend β on the 7-day move | −0.86 ± 0.74 | | −0.68 ± 0.68 | 0 |
| Skew of the swing (without Blue and White 2021) | −0.06 | | +0.10 | 0 (Gaussian) |

## 6. Effect on the 2026 forecast

The table uses data/polls.json, the 62 polls through Oct 22, at 50,000 runs and seed 20261027 (`fit2026.mjs`). Each
list cell gives central share / P(pass) / point.

| Variant | Amcha Yisrael (poi) | Reservists (res) | Ra'am | RZ | Likud | Blocs net/opp/mid/arab | Net-bloc mean | P(net ≥ 61) |
|---|---|---|---|---|---|---|---|---|
| **v2 as on Oct 22** | 2.40 / **18.9%** / 0 | 2.51 / **22.7%** / 0 | 4.93 / 95.8% / 6 | 5.76 / 99.2% / 7 | 21 | 54/51/0/15 | 53.2 | 3% |
| A2 sd = 0.98 (fitted) | 2.40 / 18.5% / 0 | 2.51 / 22.3% / 0 | 4.93 / 95.9% / 6 | 5.76 / 99.2% / 7 | 21 | 54/51/0/15 | 53.2 | 3% |
| First-time shift = −0.56 (fitted, shrunk) | 2.64 / 26.2% / 0 | 2.73 / 29.9% / 0 | 4.90 / 95.6% / 6 | 5.74 / 99.1% / 7 | 21 | 54/51/0/15 | 53.2 | 3% |
| No first-time prior | 3.18 / 46.7% / 0 | 3.25 / 49.1% / 0 | 4.85 / 95.0% / 6 | 5.67 / 99.0% / 7 | 21 | 54/51/0/15 | 53.3 | 4% |
| First-time prior −1.2 | 2.00 / 9.7% / 0 | 2.14 / 13.1% / 0 | 4.97 / 96.1% / 6 | 5.81 / 99.3% / 7 | 21 | 54/51/0/15 | 53.1 | 2% |
| C1 desertion k = +0.6 | 2.20 / 14.0% / 0 | 2.37 / 18.8% / 0 | 5.21 / 97.7% / **7** | 6.08 / 99.6% / **8** | 20 | 53/51/0/16 | 53.1 | 2% |
| D1 trend +0.5 × 7-day move | 2.44 / 20.3% / 0 | 2.40 / 19.6% / 0 | 4.93 / 95.9% / 6 | 5.77 / 99.2% / 7 | 21 | 54/51/0/15 | 53.1 | 3% |
| E1 shared bloc factor | 2.40 / 19.4% / 0 | 2.51 / 22.8% / 0 | 4.93 / 93.9% / 6 | 5.76 / 99.1% / 7 | 21 | 54/51/0/15 | 53.2 | 3% |
| F2 skew α = −3 | 2.40 / 18.8% / 0 | 2.51 / 23.9% / 0 | 4.93 / 95.5% / 6 | 5.76 / 98.4% / 7 | 21 | 54/51/0/15 | 53.1 | 3% |
| I1 unprinted-below 2.5% | identical to v2: every below cell through Oct 22 prints a % | | | | | | | |
| K1 bloc funding (poi → Likud; res is "mid", unchanged) | 2.38 / 18.3% / 0 | 2.49 / 22.1% / 0 | 4.89 / 95.4% / 6 | 5.72 / 99.1% / 7 | **22** | 54/51/0/15 | 53.7 | 4% |

- **Every variant leaves the calls unchanged:**
  - poi and res fail; the closest is 47% and 49%, with no first-time prior at all;
  - Ra'am passes at 94–98%;
  - RZ passes at 98–99.6%;
  - Noam stays outside the polls and in the fringe.
- **The only real lever is the size of the first-time prior.** Its interval, −1.16 to −0.20, maps to roughly 10%
  to 40% for poi and 13% to 45% for res. The 1.0 sd and the Gaussian shape are not levers.
- **Ra'am's point moves to 7 only under desertion (C1),** which the record rejects.
- **K1 under v3's other changes:** agent B's sector-turnout terms and agent A's house effects may move poi, res and
  Ra'am more than anything here. Rerun the K1 sensitivity on the final v3 before the lock if the synthesis wants
  it.

## 7. What is noise (question 5)

- **The sample is small and clustered:**
  - **Size:** 24 lists in the 2–5% band in five of the six elections (none in 2020), 30 with 2013.
  - **Clustering:** a third to 40% of the variance is shared within election × bloc, so there are about 12–16
    independent observations.
  - **Precision:** the se of a group mean is about 0.3 points at best, and 0.5–0.7 for a class with 4–7 cases.
  - **In practice:** any effect under about 0.5 points, and any slope on distance or trend under about 1, is
    invisible.
- **Real:**
  - **First-time lists fall short.** 7 of 7 first runs and 8 of 9 first or first-solo runs with 2013. The
    exception is RZ 2021, a first solo run by an established party. The mean is −0.75 to −1.0, and both halves of
    the record agree. The early half has 8 of 8 negative. The late half has only Jewish Home 2022 (−0.61) and RZ
    (+1.03), so its sign rests on 2 cases.
- **Probably real, size unknown:** Arab small lists beat their polls: 4 of 4 in 2015–2022, +0.37, and 5 of 7 with
  2013.
- **Not established:**
  - the established-list rescue (+0.47, interval spanning 0, driven by 2021);
  - any strategic-desertion slope;
  - any trend effect;
  - skew;
  - the exact sd between 0.8 and 1.15;
  - the bloc differences.
- **Backtest differences that are noise:**
  - every one-call change (3, 4, 5 wrong);
  - list-error differences under about 0.03, which is one seat in one list across 71;
  - and, as section 5.1 shows, the K1 gain of 0.054, since a change of input data removes it.

## 8. Recommendation

**Ship in v3 (threshold component).**

1. **Keep the v2 swing model for borderline lists.** It is N(class mean, sd) per list, drawn in the simulation, and
   the call is P(pass) ≥ 50%. This is decision 7 met: the swing is fitted from history and sampled. The fitted
   values confirm what v2 ships:
   - **sd:** 1.0 point for lists under 6.9% (`cal.smallList.sdFloorPoints`). Fitted 0.98, 90% interval 0.71–1.29.
   - **First-time / first-solo small lists:** −0.8 points (`cal.listPriors.poi`, `.res`). Fitted −0.75, 90% interval
     −1.16 to −0.20.

   The only change is to the calibration record's wording, so that the red team can see the numbers are fitted:

   ```json
   "smallList": {
     "about": "Final-field misses of lists polled at 2-5%, 2015-2022 (round2/C-threshold-swing.md): Gaussian, sd 0.98 net of the class priors (90% cluster bootstrap 0.71-1.29; 0.91 with 2013), no skew once Blue and White 2021 is set aside, no dependence on the distance from the line or on the final-week trend. First-time and first-solo lists -0.75 (9 cases, 8 negative; 90% -1.16 to -0.20).",
     "sdFloorPoints": 1.0,
     "unprintedBelowShare": 0.025
   }
   ```
2. **Change the unprinted-below last resort from 2% to 2.5%.** This is an override: the backtest is not informative,
   because only 14 of about 230 below-threshold cells in 2015–2022 print no %, and the fallback never decides a call.
   - **Why the old value is wrong:** 2% is lower than 38 of the 51 printed shares, 2015–2022, of lists that other
     polls in the same 14 days showed passing. Five equal it and eight are lower.
   - **Where 2.5% comes from:** it is their median. Their mean is 2.40, and round-one C's Bader-Ofer simulation
     gives an expected share of 2.83 for such a list.
   - **Scope:** the chain before it (the outlet's own last printed % in the window, then the median other current
     polls printed) stays as it is.
   - **When it matters:** only when a final poll prints a list below without a % and no other current poll prints
     one.

   In `model.mjs`, `shares()`:
   ```diff
   -      if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBy(p, id) ?? printedByOthers(id) ?? 0.02; below += s[id]; } else pass.push([id, r.seats]);
   +      if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBy(p, id) ?? printedByOthers(id) ?? (cal.smallList?.unprintedBelowShare ?? 0.02); below += s[id]; } else pass.push([id, r.seats]);
   ```
   Backtest row: I1, identical to v2 on every column (1.361 / 1.83 / 1.33 / 4 / 0.091).

**Do not ship:**
- a desertion term (C);
- a trend term (D);
- a skewed or mixture swing (F);
- a rescue term (G);
- a separate shared small-list factor (E), unless agent G's correlation work adopts one for its own reasons.

The sections above give the evidence for each.

**Candidate held back: K1, the first-time prior funded by the bloc's largest list.** The synthesis may still want it
for its mechanism, so here it is. Do not ship it on this evidence:
- it passes the 28-day gate (1.361 → 1.307, 4 calls, all three seeds);
- it fails the full-data check (one more wrong call);
- it fails the leave-future-out-magnitude check;
- its 2026 effect is Likud 21 → 22 and the Netanyahu bloc mean +0.5.

The drop-in for `model.mjs` step 4 is tested as `priorsInBloc` in `model-c.mjs`, with `cal.listPriorsInBloc =
["poi", "res"]`:

```js
  const priors = o.priors ? cal.listPriors ?? {} : {};
  // First-run small lists' priors are taken by their own bloc's largest list (desertion inside the bloc), not
  // spread over every list; a list between the blocs ("mid") keeps the proportional rule.
  const inBloc = new Set((cal.listPriorsInBloc ?? []).filter((id) => id in base && bloc[id] !== "mid" && typeof priors[id] === "number"));
  for (const [id, pts] of Object.entries(priors)) if (typeof pts === "number" && id in base && !inBloc.has(id)) base[id] = Math.max(0.002, base[id] + pts / 100);
  renorm(base);
  for (const id of inBloc) {
    const big = ids.filter((k) => bloc[k] === bloc[id] && k !== id && k in base).sort((x, y) => base[y] - base[x])[0];
    const nb = Math.max(0.002, base[id] + priors[id] / 100); if (big) base[big] -= nb - base[id]; base[id] = nb;
  }
```

**Backtest table for what is recommended** (10,000 runs, leave-future-out, the six elections; seeds 1 and 2 in
brackets):

| | Per-list error | Netanyahu-bloc error | Mean bloc error | Wrong threshold calls (of 71) | Modal outcome right | Majority Brier |
|---|---|---|---|---|---|---|
| Version 2 | 1.361 (1.361, 1.361) | 1.83 (2.00, 2.00) | 1.33 (1.42, 1.42) | 4 | 6/6 | 0.090 (0.091, 0.089) |
| **Recommended: v2's treatment, fitted values recorded, unprinted-below 2.5% (I1)** | **1.361** | 1.83 | 1.33 | **4** | 6/6 | 0.091 |
| Held back: K1 bloc funding | 1.307 (1.307, 1.307) | 1.50 (1.83, 1.67) | 1.25 (1.33, 1.42) | 4 | 6/6 | 0.089 (0.090, 0.088) |
| Same, D1's files | 1.416 against v2's 1.422 | 1.83 | 1.42 | **5** against 4 | 6/6 | 0.094 |
| For the record: v2's threshold priors fitted leave-future-out (B1) | 1.361 (1.385, 1.361) | 1.33 | 1.17 | **5** | 6/6 | 0.089 |

**Out-of-sample tests run:**
- every fitted parameter re-estimated leave-future-out (A2, B1, G2, J2, H1);
- 2013 added to the fitting set (`FITCASES=full`);
- the whole table rerun on D1's independent build of the inputs (`CDATA=full`);
- three seeds;
- the split halves in `stats.mjs`.

The first-time effect's sign held in both halves of the record. No other effect did.

## Sources

- Polls and results: `scripts/forecast/backtest/data/*.json` and `data-full/*.json`, built from English Wikipedia;
  `backtest/README.md` and `round2/D1-data-full.md` give the URLs and wikitext hashes.
- Round-one memos built on: `round1/C-threshold.md` (the 27-case census, mechanisms, the Bader-Ofer 2.83% figure),
  `round1/B-list-bias.md` (class biases, Likud's consolidation spikes) and `round1/F-review.md` (the noise structure).
- Round two, for cross-checks: `round2/D-blackout.md` finds no momentum for all lists, as section 3 does for
  borderline lists.
- No web source was consulted for this memo, and no 2026 poll after October 22.
