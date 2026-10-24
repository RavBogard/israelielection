# D. The publication blackout: late swing, trend extrapolation and widening

Round 2, agent D. Written 2026-10-24. Scope: the gap between the last published polls and the result. Israeli law
bans publishing polls from the Friday evening before the vote until the polls close. In 2026 the ban runs from the
evening of October 23 to October 27, so the newest polls are 4 days old on election day. This memo covers four
questions: whether that gap carries a measurable late swing, whether carrying the final trend forward or shrinking
toward a longer mean helps, how much widening the gap justifies, and whether Friday polls behave differently.

Data: `scripts/forecast/backtest/data/` (final 28 days, six elections). Agent D1's full-campaign files appeared in
`scripts/forecast/backtest/data-full/` during the work. Every table is run on both. The descriptive analysis also
uses 2013, which is never part of the backtest because its threshold was 2%. No 2026 poll after October 22 was used.
Code: `scripts/forecast/round2/D/`. `model-d.mjs` is a copy of `scripts/forecast/model.mjs` with the options below
added. Under its defaults it reproduces model.mjs draw for draw: `backtest-d.mjs --check` prints "identical" for all
six elections. The other scripts are `analyze.mjs` (descriptive), `backtest-d.mjs` (leave-future-out scoring) and
`run2026.mjs` (the effect on today's forecast).

## Summary

1. **The final-poll error is almost all level bias that was already there weeks earlier, not late movement.**
   Each list's gap between the final field and the result correlates 0.92–0.93 with the same list's gap in the field
   as it stood 14 days earlier (regression slope 0.84–0.88). The RMS gap is 1.6 points per list. The field itself
   moved only 0.55 points RMS in its final 7 days and 0.65 points in its final 14. A random walk fitted to
   same-outlet poll pairs from the final 28 days moves 0.17 points per √day for a list at an 8% share. Over 4 days
   that is 0.34 points, which explains **4–5% of the final-gap variance per list**. For the Netanyahu bloc the walk
   moves 0.33–0.37 seats per √day, or 0.7 seats over 4 days. That is about 15% of the bloc's final-gap variance
   (RMS 1.8 seats).
2. **There is no momentum to carry forward.** Pooled, regressing the final gap on the field's last-7-day move gives a
   slope of −0.45 on the 28-day data and −0.13 on the full data. A continuing trend would give +0.57. The sign flips
   from election to election: +4.4 in 2013, −3.5 in 2015 and April 2019, and +0.7 to +1.1 in 2020 and 2021. Carrying
   the 7-day trend over the gap is clearly harmful: per-list error rises from 1.36 to 1.61 seats, wrong calls from 4
   to 5, and the majority Brier score from 0.090 to 0.142. The 14-day trend, full or halved, changes the list error
   by −0.07 to +0.02 seats, which is single-seat noise, and every version of it worsens both Brier scores.
   **Reject trend extrapolation.**
3. **Shrinking toward the 14- or 21-day mean does not help.** The list error is unchanged (1.36–1.46). The
   Netanyahu-bloc error worsens from 1.83 to 2.17–2.83 seats, because it undoes real final-week bloc movement.
   **Reject.**
4. **Version 2 already contains the blackout.** Its widths were calibrated on final published polls against results,
   and every one of those errors spans a 3–4-day blackout. The sources are theMadad's 0–14-day per-list error
   (`listSd`), the bloc residuals of the final-week field (`blocSd`) and the small-list floor from final-two-week
   misses (round1/C). Version 2 already over-covers: 93% of results fall inside its per-list 90% intervals, all 24 bloc
   results fall inside the bloc intervals, and 76–79% fall inside the 50% intervals (integer seats inflate these
   counts somewhat). Every widening I tested left every point unchanged and made the majority Brier, the P(pass) Brier
   or both slightly worse. The tests were a fitted random walk, double that walk, `listSd` and `blocSd` × 1.25, and
   `consolidateSd` 2.5 and 3.0. **Adding the full 4-day walk on top of version 2 counts the blackout twice.**
5. **Recommendation for decision 8.** Implement the blackout widening as an explicit random-walk term with
   leave-future-out-fitted sizes: **0.17 points per √day for a list at an 8% share (scaled by √share like `listSd`)
   and 0.37 seats per √day for the bloc swing.** Apply it **only to days beyond the 4 the calibration already holds**
   (`blackoutBaseline: 4`). On the backtest and on the 2026 run with the October 23 polls this changes nothing, by
   construction, and the override is stated below. It widens correctly if the newest poll is older. With polls
   through Oct 22 only (gap 5) `blocSd` goes from 3.10 to 3.12 and no point moves. If the synthesis prefers to apply
   decision 8 literally over the whole gap, the alternative costs majority Brier +0.005, P(pass) Brier +0.0003, and
   no point or call changes. One condition binds either way: if another agent (G, or A after house effects)
   recalibrates `listSd` or `blocSd` from final-poll residuals, the blackout is inside those residuals again.
   Counting it once means using the baseline-4 form.
6. **The one genuine late effect is two-horse-race consolidation into the bloc leader, not a random walk.** The
   cases are Likud +6.0 points in 2015, Likud +5.0 and Blue and White +3.9 in April 2019, with their partners losing
   the same amount. Even these gaps were mostly present 14 days earlier (+4.8, +4.6 and +3.0 points). In both
   elections the final published week moved the other way, so no trend rule could have caught them. They are the
   main results outside version 2's 90% intervals (Likud 2015: 30 seats against [18–27]; Blue and White and Labor in
   April 2019). Raising `consolidateSd` from 1.5 to 2.5 seats brings April 2019's Blue and White inside, and 3.0
   seats brings Labor inside too. Likud 2015 stays outside even at 3.0 seats ([16–29]). At 2.5 seats the change is
   score-neutral: list error is unchanged, majority Brier moves −0.001 to 0.000, P(pass) Brier moves +0.0008 to
   +0.0009, and the majority call is unchanged. This belongs to agents C and B, and I pass it on rather than recommend it.
7. **Friday polls.** A poll dated on the final Friday is slightly more accurate than the same outlet's earlier
   final-week poll. Across 7–9 paired outlet-elections, list error is 1.50 vs 1.61 seats (28-day data) and 1.60 vs
   1.65 (full data), and the Netanyahu-bloc |error| is 1.56 vs 2.22 and 1.57 vs 2.29. Within an outlet, a poll's error
   grows with age by about 0.008 seats per list per day and 0.045–0.053 seats on the bloc per day. Extra weight for
   Friday polls (×1.5) or recency weighting inside the 7-day field (half-lives of 3 and 7 days) moves the list error
   by −0.07 to +0.03 seats. The sign differs between the two datasets, so this is noise. **Keep version 2's rule: the
   latest poll per outlet.** It already lets the October 23 polls (Kan 11, Channel 12, Channel 13, Maariv, Israel
   Hayom) replace those outlets' earlier ones, and it should not add a separate Friday weight.

Most of what is likely noise here is any difference of ±0.07 seats or less in list error. At 120 seats over 71 lists,
that is one or two seats in one election. The robust results are 1, 2 (the 7-day part), 4 and the direction of 7.

## 1. The final gap against within-campaign movement

`node scripts/forecast/round2/D/analyze.mjs` (28-day data) and `D_FULL=1 node scripts/forecast/round2/D/analyze.mjs`
(full data with 2013). The field is model.mjs's selection: the latest poll per outlet within 7 days of the newest,
Filber firms out, D'Hondt-midpoint shares, and no priors. It is rebuilt "as of" 7 and 14 days before the newest
poll with the `asOf` option.

| Election | Gap days | Field polls | Gap, pts RMS | Gap, seats MAE | 7-day move, pts RMS | 14-day move, pts RMS | Net bloc gap | Net 7-day move | Net 14-day move |
|---|---|---|---|---|---|---|---|---|---|
| 2013-01 (full data) | 4 | 13 | 1.90 | 1.73 | 0.23 | 0.57 | −5.61 | −0.24 | −1.39 |
| 2015-03 | 4 | 15 | 2.08 | 1.86 | 0.40 | 0.47 | −0.09 | −1.21 | −1.85 |
| 2019-04 | 4 | 10 | 2.19 | 2.79 | 0.48 | 0.43 | +0.25 | −0.92 | +0.42 |
| 2019-09 | 4 | 9 | 1.01 | 1.24 | 0.72 | 1.01 | −0.64 | −0.02 | −0.36 |
| 2020-03 | 3 | 8 | 1.23 | 0.89 | 0.69 | 0.53 | +0.75 | +1.87 | +1.65 |
| 2021-03 | 4 | 7 | 1.45 | 1.46 | 0.65 | 0.80 | +1.83 | +2.57 | +3.07 |
| 2022-11 | 4 | 8 | 0.77 | 1.10 | 0.27 | 0.45 | +3.83 | +0.17 | +0.67 |

(28-day data. The full data differ slightly in 2019-09, 2020 and 2021 because D1's files merge some outlets
differently; see the analyze output.)

Pooled over 71 lists (85 with 2013):

- The RMS final gap is 1.57 points (1.62). The RMS 7-day move is 0.55 (0.54) and the 14-day move 0.64 (0.66).
- **Persistence.** Regressing the final gap on the gap of the field 14 days earlier gives a slope of 0.88 (0.84) and
  r 0.92 (0.93). The RMS gap then was 1.64 points (1.78), against 1.57 (1.62) now. Two weeks of polling removed only
  about a tenth of the error.
- **Momentum.** Regressing the gap on the 7-day move gives a slope of −0.45 (−0.13), r −0.16 (−0.04). On the 14-day
  move the slope is −0.24 (+0.13). A trend that continued through the blackout would give 0.57 and 0.29. By election,
  the slope on the 7-day move is +4.39 (2013), −3.48 (2015), −3.45 (2019-04), −0.02 (2019-09), +0.67 (2020), +0.82
  (2021) and +0.11 (2022). The sign does not hold across halves of the record.

**Variogram.** For same-outlet pairs 1–21 days apart in the final 28 days, I fit E[(y_t − y_s)²] = a + q·|t − s|.
The intercept a is twice the sampling variance; q is the random-walk variance per day.

| | List pairs | a (pts², at 8%) | q (pts²/day) | Bloc pairs | a (seats²) | q (seats²/day) |
|---|---|---|---|---|---|---|
| 2015-03 | 473 | 0.52 | 0.007 | 43 | −3.00 | 0.657 |
| 2019-04 | 588 | 1.05 | 0.008 | 42 | 13.07 | −0.417 |
| 2019-09 | 330 | 0.15 | 0.079 | 33 | 2.06 | 0.096 |
| 2020-03 | 270 | 0.41 | 0.017 | 30 | 0.74 | 0.150 |
| 2021-03 | 602 | 0.13 | 0.064 | 43 | 1.83 | 0.203 |
| 2022-11 | 507 | 0.32 | 0.005 | 39 | 0.29 | 0.010 |
| **Pooled** | 2,770 | 0.44 | **0.030** | 230 | 2.58 | **0.136** |
| Pooled, full data, final 28 days | 2,648 | 0.48 | 0.029 | 216 | 3.17 | 0.109 |
| Pooled, full data, final 60 days | 5,708 | 1.15 | 0.033 | 484 | 3.18 | 0.661 |
| 2026, Sep 29–Oct 22 (`run2026.mjs`) | 415 | 0.26 | 0.035 | 32 | −0.50 | 0.732 |

Binned mean d² for lists rises from 0.37 at 1–3 days to 0.68 at 4–7, 0.79 at 8–14 and 0.93 at 15–21 days: steady
and slow. A 4-day walk is therefore 0.34–0.36 points per list at an 8% share, against a final-gap RMS of 1.56–1.61
points at that share: **4–5% of the variance**. For the bloc, the final-28-day estimate gives 0.66–0.74 seats over 4
days. The 60-day window gives 1.6 seats, but it includes the campaign's formative weeks, with list mergers and
splits. 2026's own campaign gives 1.7 seats, but on only 32 pairs with a negative intercept, which is a noisy fit.
List-level volatility in 2026 (0.19 points per √day) is at the historical level.

**What the misses were.** These are the largest per-list gaps (result minus final field, points; in brackets the
7-day and 14-day moves), from `analyze.mjs` section 2b.
- 2015: Likud +6.0 (−1.0, −1.2); Jewish Home −2.9.
- April 2019: Likud +5.0 (−0.8, −0.4); Blue and White +3.9 (−0.8, −0.9); Labor −3.5 (+1.1, +1.0).
- September 2019: Shas +1.6; Joint List +1.6; Otzma −1.5 (+0.5, +1.3).
- 2020: Likud +2.5 (+1.1, +1.1).
- 2021: Blue and White +3.1; New Hope −2.8 (−0.6, −1.8).
- 2022: Shas +1.5; Yesh Atid −1.5.

The large misses are the bloc leader gaining from its partners in a two-horse race (2015, April 2019). Those gaps were
already +4.8, +4.6 and +3.0 points 14 days out, and the final week moved against them. Round 1/B §3.2 cites the 2015
"gevalt" campaign as a decision made after the polls. The data cannot tell a late swing from a constant
under-measurement of the leader. Both look identical in the published polls, and both are absent from any trend.

## 2. Trend extrapolation and shrinkage, leave-future-out

`model-d.mjs` options:

- `trendDays`, `trendDamp`. Each list's slope per day over the last `trendDays` uses outlet fixed effects: only
  within-outlet changes count, so a change in which outlets published cannot pose as a trend. Outlets with one poll
  drop out. The slope × `trendDamp` × gap days is added to the share before the priors.
- `shrinkDays`, `shrinkW`. The final field is pulled toward the firm-weighted mean of each outlet's average over the
  window.

The trend uses only polls before the vote. The lean and residual are leave-future-out, as in v2.mjs. The full table
is in §4.

| Variant | List error (28d / full) | Net-bloc error | Mean bloc error | Wrong calls | Majority Brier | P(pass) Brier |
|---|---|---|---|---|---|---|
| v2 | 1.36 / 1.42 | 1.83 / 1.67 | 1.33 / 1.42 | 4 / 4 | 0.090 / 0.095 | 0.0399 / 0.0393 |
| Trend 7 days | 1.61 / 1.61 | 2.50 / 2.67 | 1.58 / 1.75 | 5 / 5 | 0.142 / 0.155 | 0.0497 / 0.0476 |
| Trend 7 days, half | 1.44 / 1.48 | 2.33 / 2.50 | 1.33 / 1.58 | 5 / 5 | 0.111 / 0.118 | 0.0442 / 0.0431 |
| Trend 14 days | 1.38 / 1.37 | 2.00 / 1.83 | 1.33 / 1.25 | 4 / 4 | 0.098 / 0.105 | 0.0426 / 0.0415 |
| Trend 14 days, half | 1.33 / 1.35 | 1.83 / 1.67 | 1.33 / 1.33 | 4 / 4 | 0.093 / 0.099 | 0.0410 / 0.0403 |
| Shrink to 14-day mean, w 0.25 | 1.36 / 1.42 | 2.17 / 2.17 | 1.50 / 1.67 | 4 / 4 | 0.086 / 0.089 | 0.0396 / 0.0392 |
| Shrink to 14-day mean, w 0.5 | 1.36 / 1.39 | 2.50 / 2.67 | 1.67 / 1.83 | 4 / 4 | 0.081 / 0.084 | 0.0393 / 0.0391 |
| Shrink to 21-day mean, w 0.25 | 1.36 / 1.43 | 2.50 / 2.33 | 1.67 / 1.67 | 4 / 4 | 0.086 / 0.092 | 0.0396 / 0.0393 |
| Shrink to 21-day mean, w 0.5 | 1.46 / 1.46 | 2.83 / 3.00 | 1.75 / 1.83 | 5 / 5 | 0.081 / 0.085 | 0.0394 / 0.0393 |

The halved 14-day trend's gain of 0.03–0.07 seats comes from September 2019 (0.80 → 0.60) on the 28-day data, and
from September 2019 and 2020 on the full data. That is 2–4 seats in total, while it worsens both Brier scores in
both datasets. Shrinkage improves the majority Brier only because it pulls the bloc toward an older and worse
estimate and widens nothing. It costs 0.3–1.2 seats of bloc error. Neither passes the gate.

## 3. Widening

`model-d.mjs` options:

- `rwListSdAt8` (points per √day at an 8% share, scaled by √share) adds variance to each list's noise:
  sd² = max(floor, listSd·√(s/0.08))² + rw²·d·s/0.08. The zero-sum-within-bloc step then applies to it as to
  `listSd`.
- `rwBlocSd` (seats per √day) adds to the bloc swing: blocSd² + rwBloc²·d.
- d is the gap in days minus `blackoutBaseline`, floored at 0.
- `listSdScale`, `blocSdScale` and `consolidateSd` give the direct-inflation alternatives.

Leave-future-out fit (`backtest-d.mjs --lfo`): for each election, the variogram slope is pooled over that election's
own final 28 days and every earlier campaign. Both are known before the vote. The list values are 0.08, 0.03, 0.15,
0.15, 0.18 and 0.17 points per √day (2015 → 2022). The bloc values are 0.81, 0.27, 0.30, 0.33, 0.36 and 0.37 seats
per √day. The final values are rounded to 0.17 and 0.37.

| Variant (28-day data) | List error | Net error | Majority Brier | P(pass) Brier | 90% coverage, lists | 90% coverage, blocs | 50% / 80% coverage, lists | Mean 90% width |
|---|---|---|---|---|---|---|---|---|
| v2 | 1.36 | 1.83 | 0.090 | 0.0399 | 93% | 100% | 76 / 89% | 6.49 |
| Fitted walk, list + bloc, whole gap | 1.36 | 1.83 | 0.094 | 0.0402 | 93% | 100% | 76 / 89% | 6.56 |
| Fitted walk, list only | 1.36 | 1.83 | 0.088 | 0.0401 | 93% | 100% | 76 / 89% | 6.54 |
| Fitted walk, bloc only | 1.36 | 1.83 | 0.094 | 0.0399 | 93% | 100% | 76 / 89% | 6.51 |
| Walk 0.17 / 0.46 (bloc pooled with 2026's 32 pairs: (0.136·230 + 0.732·32) / 262 = 0.21 seats²/day), whole gap | 1.36 | 1.83 | 0.095 | 0.0401 | 94% | 100% | 76 / 89% | 6.61 |
| Walk × 2 (list 0.40) | 1.36 | 1.83 | 0.092 | 0.0411 | 94% | 100% | 77 / 89% | 6.89 |
| Walk × 2 (bloc 0.75) | 1.36 | 1.83 | 0.103 | 0.0400 | 94% | 100% | 76 / 89% | 6.53 |
| `listSd` × 1.25 | 1.36 | 1.83 | 0.092 | 0.0401 | 94% | 100% | 76 / 89% | 6.75 |
| `blocSd` × 1.25 | 1.36 | 1.83 | 0.116 | 0.0400 | 94% | 100% | 76 / 89% | 6.70 |
| `consolidateSd` 2.5 | 1.36 | 1.83 | 0.089 | 0.0407 | 94% | 100% | 76 / 90% | 7.08 |
| `consolidateSd` 3.0 | 1.36 | 2.00 | 0.089 | 0.0414 | 96% | 100% | 79 / 92% | 7.61 |
| `listSd` × 0.8 (narrower) | 1.36 | 1.83 | 0.090 | 0.0398 | 92% | 100% | 75 / 89% | 6.40 |
| `blocSd` × 0.8 (narrower) | 1.36 | 1.83 | 0.066 | 0.0398 | 90% | 100% | 75 / 89% | 6.32 |

On the full data the pattern is the same: v2 scores 0.095 / 0.0393, the whole-gap walk 0.097 / 0.0396 and the bloc
walk × 2 0.108. Several full-data variants move the list error by ±0.03–0.07 seats, which is one seat at the
threshold or median in one election, and that happens in both directions. None of the widenings improves the
probabilistic scores. The narrower bloc width improves the majority Brier, but with six elections, five of them
called "neither" at high confidence, that score rewards overconfidence. I do not recommend narrowing on this
evidence, and agent G owns the question.

**Why the walk adds almost nothing.** Version 2's list sd at an 8% share is 1.08 points. A 4-day walk adds 0.34 in
quadrature, giving 1.13: +5%. Its bloc sd is at least 3.0 seats, and 0.74 in quadrature gives 3.09. The variance the
blackout justifies is real but small, and it is already inside these numbers because they were measured on
final-poll errors.

## 4. Friday polls versus earlier in the week

The `published` field is the last date in Wikipedia's date cell, usually the end of fieldwork or the publication
day. A "Friday" poll is therefore a poll dated on the final Friday, typically fielded Wednesday–Thursday and
published Friday. The distinction from Thursday-dated polls is blurred, and I state that as a limit.

| Poll age (days before the vote), 28-day data | Polls | List MAE | Net, signed | Net, absolute | Bloc MAE |
|---|---|---|---|---|---|
| 3–4 (the final Friday or Saturday) | 23 | 1.62 | +0.74 | 1.17 | 1.50 |
| 5–7 | 39 | 1.74 | +1.38 | 2.10 | 1.86 |
| 8–14 | 49 | 1.74 | +1.33 | 2.55 | 2.10 |
| 15–21 | 44 | 1.87 | +1.36 | 2.77 | 1.97 |
| 22–28 | 29 | 1.90 | +0.55 | 2.76 | 2.00 |

On the full data with 2013, ages 29–60 give list MAE 2.05 and absolute net error 4.32. Within an outlet (fixed
effects by outlet and election), error grows by 0.0074–0.0081 seats per list per day and 0.045–0.053 seats on the
absolute Netanyahu-bloc error per day. Four days of blackout therefore cost about 0.03 seats per list and 0.2 bloc
seats in expectation, assuming that slope extends past the last poll.

Paired within outlet (an outlet with a final-Friday poll and an earlier final-week poll):

- 28-day data, 9 pairs: list error 1.50 vs 1.61 seats; absolute bloc error 1.56 vs 2.22 seats; the Friday poll is
  better in 5 pairs and worse in 1.
- Full data, 7 pairs: 1.60 vs 1.65 and 1.57 vs 2.29; better in 3, worse in 1.

The direction is consistent with the age gradient, but the samples are tiny. In the backtest, Friday × 1.5 scores
1.32 (28-day data) and 1.39 (full data) against v2's 1.36 and 1.42. The 28-day gain is all from 2020 (0.67 → 0.44),
and the net error worsens to 2.00 on that data. An age half-life of 3 days scores 1.36 and 1.35, and 7 days scores
1.36 and 1.39. The sign does not hold across datasets. **Keep the latest-per-outlet rule unweighted.** For 2026, its
effect is that the five October 23 polls each replace their outlet's previous poll. Zman Yisrael, Walla and the
others keep their latest poll from the week, at equal weight.

## Recommendation

1. **No trend, no shrinkage.** Freeze on the last polls, as decision 8 says.
2. **Blackout widening, counted once.** Add an explicit random walk with list sd 0.17 points per √day at an 8% share
   and bloc sd 0.37 seats per √day, applied to the days beyond the 4 already in the calibrated widths.
   - **Override for the gate:** the backtest cannot inform this term, because every past gap is 3 or 4 days, so it
     is 0 there by construction. Its purpose is to keep the model honest if the newest poll is older than the
     historical norm.
   - If the synthesis prefers the literal whole-gap form (`blackoutBaseline: 0`), the cost in the table above is
     majority Brier +0.004–0.005 and P(pass) Brier +0.0003, with no change to points or calls.
   - If agent G recalibrates `listSd` or `blocSd` from house-effect-corrected final-poll residuals, keep the
     baseline at 4, because those residuals still contain the blackout. If G instead builds widths from
     within-campaign variation (for example, a state-space model's filtering variance at the last poll), use
     `blackoutBaseline: 0`. That is the case where the term carries the 4 days.
3. **For agents C and B:** the blackout-period miss that matters is consolidation into the bloc leader in a
   two-horse race, which is a v2 parameter (`consolidateSd`). In this backtest, 2.5 seats is score-neutral and brings
   April 2019's Blue and White inside the 90% interval. 3.0 seats also brings Labor 2019 inside and improves 80%
   coverage (89% → 92%), at P(pass) Brier +0.0015. Likud 2015 stays outside at both values (scratch check:
   `consolidateSd` passed through `run()` in `backtest-d.mjs`).
4. **Keep the field rule** (the latest poll per outlet in 7 days, no Friday or recency weight).

Code change to `scripts/forecast/model.mjs`. It is exactly what `model-d.mjs` adds for this option; the trend,
shrink, age-weight and quantile options there are for testing only.

```diff
@@ DEFAULTS
   includeAll: false,        // sensitivity: every current poll, checks included
+  electionDate: null,       // ISO date of the vote; the blackout gap is electionDate − newest poll
+  rwListSdAt8: 0.17,        // points per √day at an 8% share: per-list drift over the blackout (round2/D-blackout.md)
+  rwBlocSd: 0.37,           // seats per √day: bloc drift over the blackout
+  blackoutBaseline: 4,      // days of blackout already inside listSd/blocSd (they were fitted on final published polls)
 };
@@ after renorm(base) and the non-finite check (step 3)
+  const gapDays = o.electionDate ? Math.max(0, (Date.parse(o.electionDate) - Date.parse(campaign[0].published)) / 864e5) : 0;
+  const rwDays = Math.max(0, gapDays - o.blackoutBaseline);
@@ step 5
-  const blocSd = o.blocSd ?? Math.max(3, 2 * resid);
+  const blocSd = Math.sqrt((o.blocSd ?? Math.max(3, 2 * resid)) ** 2 + o.rwBlocSd ** 2 * rwDays);
@@ step 6
   const listSd = (o.listSdAt8 ?? ...) / 100;
+  const rwVar = (o.rwListSdAt8 / 100) ** 2 * rwDays;
@@ step 8, per-list noise
-  const e = {}; for (const id of ids) e[id] = randn() * Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
+  const e = {}; for (const id of ids) { const sd0 = Math.max(floor, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08)); e[id] = randn() * (rwVar ? Math.sqrt(sd0 ** 2 + rwVar * Math.max(v[id], 0.01) / 0.08) : sd0); }
```

`forecast.mjs` passes `electionDate: results.election` ("2026-10-27"), and the backtest passes `e.election`.
`parameters` should report `gapDays`, `rwDays` and the effective `blocSd`.

**Backtest against version 2** (`node scripts/forecast/round2/D/backtest-d.mjs 10000 --qs`; prefix `D_FULL=1` for the
full-campaign data; leave-future-out, six elections):

| | Per-list error | Netanyahu-bloc error | Mean bloc error | Wrong threshold calls (of 71) | Modal outcome right | Majority Brier | P(pass) Brier | 90% coverage, lists / blocs |
|---|---|---|---|---|---|---|---|---|
| Version 2 (28-day data) | 1.36 | 1.83 | 1.33 | 4 | 6/6 | 0.090 | 0.0399 | 93% / 100% |
| **D recommended: walk beyond 4 days** | 1.36 | 1.83 | 1.33 | 4 | 6/6 | 0.090 | 0.0399 | 93% / 100% |
| D alternative: walk over the whole gap (0.17 / 0.46) | 1.36 | 1.83 | 1.33 | 4 | 6/6 | 0.095 | 0.0401 | 94% / 100% |
| Version 2 (full data) | 1.42 | 1.67 | 1.42 | 4 | 6/6 | 0.095 | 0.0393 | 93% / 100% |
| D recommended (full data) | 1.42 | 1.67 | 1.42 | 4 | 6/6 | 0.095 | 0.0393 | 93% / 100% |
| D alternative (full data) | 1.42 | 1.67 | 1.42 | 4 | 6/6 | 0.100 | 0.0396 | 94% / 100% |

The v2 rows reproduce the brief's numbers: 1.36 / 1.83 / 1.33 / 4 / 6/6 / 0.090. On the full data version 2 itself
scores 1.42 / 1.67, because D1's files select a slightly different final field in 2020 and 2021.

**2026** (`node scripts/forecast/round2/D/run2026.mjs`; polls through Oct 22 only, gap 5 days, 50,000 runs). With
the recommended form, the Netanyahu bloc stays at 54 (47–59), P(61) at 3%, and the list points are unchanged:
Likud 21, Yashar 22, B'Yachad 12, Reservists 0, poi 0. `blocSd` goes from 3.10 to 3.12. The whole-gap alternative
gives 54 (47–60), Reservists P(pass) 22.7% → 23.2% and poi 18.9% → 19.5%. Once the October 23 polls are in, the gap
is 4 days and the recommended form is exactly version 2. The 7-day trend would have moved Yashar 22 → 20 and
B'Yachad 12 → 13. That is a large move from a rule that loses 0.25 seats per list in the backtest.

## Reproduce

```
node scripts/forecast/round2/D/backtest-d.mjs 10000 --check --qs --lfo     # §2-3 tables, 28-day data (~60 s)
D_FULL=1 node scripts/forecast/round2/D/backtest-d.mjs 10000 --qs          # same, D1's full-campaign data
node scripts/forecast/round2/D/analyze.mjs                                  # §1 and §4, 28-day data
D_FULL=1 node scripts/forecast/round2/D/analyze.mjs                         # with 2013; D_VDAYS=60 for the 60-day variogram
node scripts/forecast/round2/D/run2026.mjs                                  # 2026 effect, polls through Oct 22
```
