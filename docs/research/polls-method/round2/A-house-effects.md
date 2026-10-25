# A. Pollster house effects from history, applied before pooling

Round 2 research memo, 2026-10-24. Agent A. Scope: decision 5 of the brief. I estimate house effects per
firm and per outlet from the 2013–2022 record, shrink them, subtract them from each poll before pooling, and
score the result leave-future-out. I also look at bias against the result per firm (does a firm that ran low
on Shas do so again?) and map the 2026 firms to their record. This builds on round1/D-pollsters.md, which
found that accuracy weights do not help and that the 2026 Filber-firm effects are large. I do not repeat
that work.

Nothing committed was changed. New files (uncommitted), all under `scripts/forecast/round2/A/`:

| File | What it does |
|---|---|
| `lib-a.mjs` | Shared helpers: per-poll shares (the D'Hondt-midpoint conversion of model.mjs step 2), list classes, deviation from the contemporaneous field, firm-election means, empirical-Bayes shrinkage. |
| `house.mjs` | Writes `house-effects.json`. `--report` prints the stability tables. |
| `house-effects.json` | The table. `tables.all` is trained on every election and used for 2026. `tables["lfo:<key>"]` is trained only on the elections before `<key>` and used in the backtest. `detail` holds the raw means, standard errors and per-election values. |
| `model-a.mjs` | A copy of model.mjs with an `opts.houseEffects` switch (search "A:"). With the switch off it reproduces model.mjs exactly (checked: identical JSON on data/polls.json at 20,000 runs). |
| `backtest-a.mjs` | The v2.mjs harness (same CLASSES priors, same lean rule) run on model-a.mjs. |
| `predict.mjs` | Two direct out-of-sample tests, firm by firm: (1) prediction of house effects; (2) bias against the result. |
| `run2026.mjs` | The 2026 firm map, the 2026 within-campaign effects against the record, and the forecast under each variant. |

**Data.** The final numbers are estimated on D1's full-campaign files (`backtest/data-full/`, 2013–2022,
seven elections, 981 polls in the snapshot of 00:13 UTC). Every number was also produced on the 28-day files (`backtest/data/`, six
elections) with `--data=data`, and every conclusion holds on both; where the figures differ I give both.
D1 was still revising `data-full/` while I worked (the files were rewritten several times between 00:07
and 00:14 UTC; a rerun at 00:18 on the 00:13 snapshot reproduced every figure). The figures here are from that snapshot. Small changes in the third decimal
between snapshots are to be expected. Two data-full quirks are handled in code:
- firm and outlet are sometimes swapped or joined in a single cell, and are matched by pattern;
- an "Election results" row in 2019-04 is dropped.

## Summary

1. **Negative result: do not ship a historical house-effect correction for the field firms.** In the
   leave-future-out backtest it never improves the per-list yardstick. Per-class shrunk effects score
   1.361 against v2's 1.361. Per-list effects score 1.361–1.385 and the bloc-only variant 1.361. Shrunk
   variants make the bloc error the same or worse: Netanyahu bloc 1.83 → 2.00, mean bloc 1.33 → 1.42 for
   the per-class version. The continuous share error gets slightly worse in every variant (0.922 →
   0.923–0.933 points). Even an in-sample correction, fitted with hindsight on all seven elections,
   changes nothing (1.361). The ceiling of the method on this yardstick is zero.
2. **Why: firm house effects exist but are small and mostly not persistent.** I define a house effect as
   a firm's deviation from the other firms' polls within ±5 days, in vote-share points after the D'Hondt
   midpoint conversion. I split each firm's deviation into a persistent part (sd τ, estimated from
   products across elections) and an election-specific drift (sd ω):

   | | persistent τ | drift ω | persistent share of τ² + ω² |
   |---|---|---|---|
   | Netanyahu bloc | 0.42 points (≈ 0.5 seat) | 1.12 points | 12% |
   | Likud | 0.25 | 0.70 | 11% |
   | Haredi lists | 0.28 | 0.53 | 22% |
   | Arab lists | 0.11 | 0.18 | 27%, of a tiny total |
   | Small lists | none (τ² ≤ 0) | | — |

   After shrinkage no 2026 field firm's effect on any class exceeds 0.36 points (0.4 seats). Pooling five or
   more firms cancels most of what remains: the correction moves the pooled field by at most 0.1–0.2
   points.
3. **The one persistent signal is Shas (and the Haredi class).**
   - On the 28-day data, the Shas house effect from earlier elections predicts the next one's: the LOO
     slope is 0.84, and subtracting the shrunk estimate cuts the RMS of the firms' Shas deviations by 20%
     out of sample (8.5% on the full data).
   - Smith and Maagar Mochot run above the field on Shas. Panel Project HaMidgam and Camil Fuchs run
     below it.
   - Nothing else predicts. The Likud, Arab, largest-opposition and small-list effects get worse out of
     sample when they are subtracted (+3% to +21% RMS).
   - The Shas signal is real, but too small to move a pooled seat.
4. **Bias against the result (question 3): the misses are common to all firms, not firm-specific.**
   Final-week polls ran low on Shas in six of seven elections (mean −0.85 points), and nearly every firm
   did so every time.
   The firms' own parts:

   | | common miss | firm-specific part (rms) | persistent part τ |
   |---|---|---|---|
   | Shas | sd 1.13 | 0.44 | 0.28 |
   | UTJ | — | 0.32 | 0.12 |
   | Arab lists | sd 1.30 | 0.51 | 0.14 |
   | Likud | sd 3.25 | 0.93 | 0.08 |

   - A firm that ran lower than the others on Shas tends to again: Kantar 2 of 7 above the common miss,
     Panels 2/7, Midgam 1/6, HaMidgam 0/3; Smith 5/6 above. But the firm part is a third the size of the
     common miss.
   - For the Arab lists no firm effect survives (τ = 0.14, signs mixed).
   - **Keep the list priors in calibration.json global.** Making them per firm would move each 2026 firm's
     Shas prior by at most ±0.3 points, and the pooled field by under 0.1 point.
5. **2026 (question 4).** Of the five field firms, four have a record:
   - Midgam (Channel 12) and Kantar (Kan 11, Israel Hayom; Teleseker/TNS before it) each have seven
     elections.
   - Panels Politics, in Lazar's lineage (Maariv, Walla), has seven; Lazar Research Institute + Panel4All
     is a new institute under the same person.
   - Channel 13's consortium has three, through its Panel Project HaMidgam component only, a partial
     lineage.
   - Zman Yisrael's Yossi Tatika has none. Of the checks, Next Data (Channel 14) has none and Direct Polls
     (i24NEWS) has five.

   The all-history correction moves the 2026 field's Netanyahu-bloc share by **+0.12 points (+0.15
   seats)**. **No list's seat count changes**: bloc 54 / 51 / 0 / 15, P(net ≥ 61) 3%, threshold
   probabilities within 0.3 points. The record weakly predicts the direction of 2026's within-campaign
   effects (17 of 24 firm × class signs, r = 0.35). It predicts their size badly: subtracting it cuts the
   2026 deviations' RMS only from 0.87 to 0.83 points.
6. **The Filber firms cannot be fixed by a historical house effect.**
   - Direct Polls' shrunk record is +0.38 points on the bloc. Its 2026 effect is +5.9 points, and Next
     Data's is +9.3 with no record.
   - Including them with the historical correction scores 1.397, against 1.361 excluded, exactly as
     including them uncorrected does. The correction is too small to matter.
   - This confirms round 1's reading: the 2026 excess is new, not a house effect with a history.
7. **What is noise.**
   - Every single-election firm effect: Miskar +3.3, Geocartography +2.7, Dahaf −2.2 on the bloc.
   - Panels' +2.5 in September 2019.
   - Every per-list effect except Shas's.
   - The small-list class (τ² < 0 on both data sets), which means firm-to-firm disagreements on threshold
     lists, such as Kantar's high Reservists in 2026, have no persistent historical counterpart.
   - The firm as the unit: on the 28-day data the firm carries more persistent signal than the outlet on
     every class but Arab (net τ 0.43 against 0.30). On the full data it is mixed. Use the firm, as v2's
     `firmWeights` already does, but the difference is small.

## 1. Definition and method

**Shares.** Each poll's seats go to vote shares with model.mjs's step-2 rule:
- a passing list with k seats gets the midpoint of its D'Hondt interval, with the divisor solved so the
  passing lists sum to the vote that passed;
- a list below the threshold keeps its printed share (2% if none is printed);
- lists inside a combined cell are left unmeasured.

**Reference (the contemporaneous field).** For a poll published on day t, the reference is built from the
polls of every other firm published within t ± 5 days. Each firm's polls are averaged first, and the firms
are then weighted equally. The Filber firms (`filber: true`) are left out of the reference, as model.mjs
leaves them out of the field. The reference needs at least two other firms. The house effect of a poll is
its share minus the reference, in vote-share percentage points (1 point ≈ 1.2 seats).

**Classes** (per election, from the field mean, never the result):
- likud;
- haredi (Shas + UTJ);
- arab (bloc "arab");
- oppLargest (the largest list of the Zionist opposition);
- small (any other list under 5%, measured as the mean per list);
- netOther (the rest of the Netanyahu bloc);
- other.

The Netanyahu bloc is reported beside the classes. Per-list effects are kept for lists whose id recurs
across elections (Shas, UTJ, YB, Joint List, Meretz, Labor).

**Firm, the primary unit.** Printed firm strings are mapped to a lineage by `FIRM_MAP` in lib-a.mjs and
`FIRM_PATTERNS` in model-a.mjs:
- Midgam / Midgam-iPanel / Midgam R&C → midgam;
- Panel Project HaMidgam (+Statnet), and 2026's MP+TM+SN+A → hamidgam;
- Panels / Panels Politics, and 2026's Lazar / LRI+P4A → panels;
- Teleseker / TNS-Teleseker / TNS / Kantar → kantar;
- Dialog / Camil Fuchs → fuchs;
- Maagar Mochot → maagar;
- Smith → smith;
- Direct Polls → direct;
- SF+ND / Next Data → nextdata;
- Tatika → tatika.

A poll with no firm printed takes its outlet's firm when the outlet's other polls in that election name
exactly one firm. Otherwise it stays an outlet unit and is used only in references. The judgment calls are
written out in the code: Teleseker in the Kantar line, Lazar's new institute in the Panels line, and the
Channel 13 consortium in the HaMidgam line.

**Shrinkage.** For firm f in election e, d_fe is the mean of its polls' deviations, with k polls. The model:

- d_fe = μ_f + η_fe + ε_fe
- μ_f ~ N(0, τ²) is the persistent house effect;
- η_fe ~ N(0, ω²) is this election's drift;
- ε_fe ~ N(0, σ²/k) is poll noise, with σ² pooled from the within-firm-election scatter.

The variances:
- τ² is the mean of d_fe · d_fe′ over pairs of different elections for the same firm. Only the persistent
  part survives the product, so this needs no assumption about how noisy each cell is.
- ω² = var(d) − τ² − mean σ²/k.

The posterior mean is μ̂_f = Σ(d/v) / (Σ(1/v) + 1/τ²), with v = ω² + σ²/k. If τ² ≤ 0, every μ̂ is 0. This
is the hard shrinkage the brief asked for: a firm with one election keeps about 15% of its raw effect, and
one with seven keeps about 50%.

**Leave future out.** The `lfo:<key>` table re-estimates τ², ω², σ² and every μ̂ from the elections before
`<key>` only. On the full data, 2015 is corrected from 2013 alone. That needs τ² from cross-election pairs,
and one election gives none, so in practice the first correction is 2019-04.

## 2. The effects and their stability (question 1)

`node scripts/forecast/round2/A/house.mjs --data=full --report` (28-day: `--data=data`).

**Hyperparameters, full data (2013–2022).** Points.
- **LOO slope**: d_fe regressed on the mean of the same firm's other elections (1 = fully persistent,
  0 = noise).
- **Signs**: sign agreement across consecutive elections, for firms present in both.
- **ρ**: mean Spearman rank correlation across firms between consecutive elections.

| Key | τ (persistent) | ω (drift) | σ (poll) | LOO slope | Signs | ρ | 28-day: τ / slope / signs |
|---|---|---|---|---|---|---|---|
| Netanyahu bloc | 0.42 | 1.12 | 0.97 | 0.76 | 28/41 | 0.37 | 0.43 / 0.58 / 19/31 |
| Likud | 0.25 | 0.70 | 1.33 | 0.16 | 29/46 | 0.42 | 0.29 / 0.55 / 19/31 |
| Haredi (Shas+UTJ) | 0.28 | 0.53 | 0.83 | 0.62 | 30/46 | 0.21 | 0.33 / 0.80 / 24/31 |
| Arab lists | 0.11 | 0.18 | 0.75 | 0.11 | 26/43 | 0.16 | 0.07 / 0.08 / 16/31 |
| Largest opposition list | 0.30 | 0.59 | 0.97 | 0.35 | 22/43 | 0.33 | 0.17 / 0.34 / 16/31 |
| Small lists (per list) | 0 | 0.21 | 0.38 | −0.81 | 17/41 | −0.34 | 0 / −0.20 / 15/31 |
| Rest of Netanyahu bloc | 0 | 0.75 | 0.98 | −0.05 | 9/29 | −0.26 | 0.17 / 0.26 / 6/18 |
| Rest | 0.33 | 0.74 | 1.04 | 0.58 | 28/43 | 0.37 | 0.28 / 0.57 / 22/31 |
| Shas | 0.26 | 0.44 | 0.67 | 0.52 | 27/46 | 0.15 | 0.35 / 0.84 / 20/31 |
| UTJ | 0.19 | 0.29 | 0.48 | 0.65 | 28/46 | 0.28 | 0.03 / 0.06 / 17/31 |
| Yisrael Beiteinu | 0 | 0.61 | 0.73 | −0.31 | 22/37 | 0.18 | 0 / −0.73 / 16/31 |

Read: the persistent part is at most a third of the per-election drift. Sign agreement runs 50–65% where
50% is chance. Only the Haredi class and Shas hold up on both data sets.

**Per firm, full data.** Raw mean ± standard error → **shrunk**, in points; "el." is the number of
elections of record. A raw effect beyond two standard errors is rare: Geocartography's Likud +1.67 ± 0.49
(four elections, the last in 2021; not in 2026) and HaMidgam's Haredi −0.93 ± 0.34.

| Firm | el. | Netanyahu bloc | Likud | Haredi | Arab | Largest opp. | Rest |
|---|---|---|---|---|---|---|---|
| Maagar Mochot | 7 | +0.68±0.46 → **+0.30** | +0.42±0.31 → **+0.15** | +0.48±0.22 → **+0.30** | −0.27±0.15 → **−0.11** | +0.04 → **+0.01** | −0.64±0.33 → **−0.30** |
| Panels (Lazar) | 7 | −0.03±0.45 → **−0.05** | −0.28±0.31 → **−0.15** | −0.15±0.22 → **−0.10** | −0.28±0.13 → **−0.14** | +0.04 → **+0.03** | −0.11 → **−0.01** |
| Kantar (TNS, Teleseker) | 7 | −0.40±0.47 → **−0.10** | +0.18 → **+0.08** | +0.04 → **+0.03** | +0.04 → **+0.02** | +0.09 → **+0.04** | −0.12 → **−0.13** |
| Midgam | 7 | −0.50±0.45 → **−0.22** | −0.24 → **−0.09** | +0.17 → **+0.12** | −0.02 → **−0.02** | +0.09 → **+0.06** | +0.38 → **+0.21** |
| Smith | 7 | +0.40±0.49 → **+0.19** | +0.31 → **+0.10** | +0.38±0.24 → **+0.24** | +0.03 → **−0.02** | +0.19 → **+0.07** | −0.53 → **−0.24** |
| Camil Fuchs / Dialog | 6 | −0.25±0.54 → **−0.10** | −0.16 → **−0.06** | −0.25 → **−0.17** | +0.38±0.20 → **+0.12** | −0.36 → **−0.04** | +0.16 → **+0.05** |
| Direct Polls | 5 | +0.99±0.55 → **+0.37** | +0.64±0.39 → **+0.21** | +0.53±0.27 → **+0.28** | −0.03 → **0.00** | −0.60±0.31 → **−0.28** | +0.48 → **+0.21** |
| Geocartography | 4 | +2.69±0.90 → **+0.48** | +1.67±0.49 → **+0.52** | +0.59 → **+0.30** | +0.21 → **+0.01** | −0.81 → **−0.24** | −0.38 → **−0.10** |
| Panel Project HaMidgam | 3 | −1.09±0.68 → **−0.29** | −0.33 → **−0.08** | −0.93±0.34 → **−0.36** | +0.16 → **+0.04** | −0.03 → **−0.01** | +1.05±0.48 → **+0.33** |
| Sarid, New Wave, Shvakim, Dahaf, TRI, Miskar | 1–3 | −2.25 to +3.29 raw → −0.25 to +0.34 | | | | | |

**Netanyahu bloc by election, full data** (points; one row is one firm's mean over its campaign polls):

| Firm | 2013 | 2015 | 2019a | 2019b | 2020 | 2021 | 2022 |
|---|---|---|---|---|---|---|---|
| Maagar Mochot | +1.79 | +0.19 | −0.07 | −0.51 | +0.94 | +1.41 | +0.99 |
| Panels | −0.44 | −1.34 | −0.18 | +2.52 | −0.21 | −0.43 | −0.10 |
| Kantar | −3.21 | +1.44 | −0.78 | −0.62 | +0.23 | +0.10 | +0.04 |
| Midgam | −1.28 | −0.57 | −1.76 | +0.17 | +0.54 | −0.26 | −0.33 |
| Smith | −1.28 | +0.94 | −0.12 | +0.87 | +0.67 | +1.31 | +0.44 |
| Camil Fuchs | −0.39 | −0.86 | +0.81 | | | −0.57 | −0.21 |
| Direct Polls | | | +0.12 | +0.45 | +1.61 | +1.47 | +1.29 |
| HaMidgam | | | −0.74 | −0.92 | −1.61 | | |

Smith (positive in 5 of 7 elections) and Maagar Mochot (5 of 7, and 2020–22 all about +1) are the only
consistent bloc leans among firms with long records. Neither polls in 2026. The 2026 field firms (Midgam,
Kantar, Panels) flip sign from election to election.

**Firm or outlet.** Persistent τ with the firm as the unit against the outlet, which merges renamed
channels (Channel 2 into 12, Channel 10 into 13, Channel 1 into Kan, and so on):

| Key | 28-day: firm | 28-day: outlet | Full: firm | Full: outlet |
|---|---|---|---|---|
| Netanyahu bloc | 0.43 | 0.30 | 0.42 | 0.18 |
| Likud | 0.29 | 0.14 | 0.25 | 0.61 |
| Haredi | 0.33 | 0.09 | 0.28 | 0.38 |
| Shas | 0.35 | 0.17 | 0.26 | 0.19 |

The firm is the better unit on the bloc and mostly on the 28-day data. It is mixed on the full data. This
supports v2's `firmWeights` (one weight per firm), which already takes care of the 2026 double outlets
(Lazar's Maariv and Walla, Kantar's Kan and Israel Hayom).

## 3. Does subtracting the shrunk effect help? (question 2)

**(a) Firm by firm, out of sample.** `node scripts/forecast/round2/A/predict.mjs --data=full|data`. For
every election with two or more earlier ones, each firm with a record has its deviation from the field
corrected by the estimate from earlier elections only. The table shows the RMS deviation before and after
(points).

| Key | Full: none → shrunk | change | 28-day: none → shrunk | change | Raw (unshrunk) mean instead |
|---|---|---|---|---|---|
| Netanyahu bloc | 0.932 → 0.920 | −1.3% | 1.018 → 0.996 | −2.1% | about no change |
| Likud | 0.967 → 0.998 | +3.3% | 0.664 → 0.666 | +0.3% | worse (+5% to +24%) |
| Haredi | 0.605 → 0.579 | −4.2% | 0.531 → 0.455 | −14.2% | better |
| Arab | 0.445 → 0.459 | +3.1% | 0.412 → 0.498 | +21.1% | worse |
| Largest opposition | 0.658 → 0.650 | −1.2% | 0.628 → 0.676 | +7.6% | worse |
| Small lists | 0.301 → 0.301 | 0 | 0.327 → 0.327 | 0 | worse |
| Shas | 0.450 → 0.412 | −8.5% | 0.472 → 0.375 | −20.4% | mixed |
| UTJ | 0.465 → 0.437 | −6.1% | 0.268 → 0.272 | +1.6% | mixed |

This is the cleanest test of whether house effects carry over. It is equivalent to the unbalanced-field
case at its most extreme, a field of one firm. Only the Haredi class and Shas improve on both data sets.
The rest is noise, and unshrunk raw means are worse almost everywhere, which is what overfitting looks like.

**(b) The yardstick, leave-future-out.** `node scripts/forecast/round2/A/backtest-a.mjs 10000`
(`--he=<28-day table>` for the 28-day row).
- Same six elections, CLASSES priors and lean rule as `backtest/v2.mjs`.
- Each election is corrected only with `house-effects.json` `lfo:<key>`.
- Extra columns:
  - **share**: mean |central share − result| per list, in points;
  - **net share**: the central Netanyahu-bloc share minus the result, in points;
  - **abs net**: the mean of its absolute value.

| Variant (effects from data-full) | Per-list | Net bloc | Mean bloc | Wrong calls | Modal | Brier | share | net share | abs net | Per election |
|---|---|---|---|---|---|---|---|---|---|---|
| **v2 (no house effects)** | **1.361** | 1.83 | 1.33 | 4 | 6/6 | 0.090 | 0.922 | −1.59 | 1.95 | 1.64 2.86 0.80 0.67 1.29 0.92 |
| A: per-firm × class, shrunk | 1.361 | 2.00 | 1.42 | 4 | 6/6 | 0.092 | 0.929 | −1.58 | 1.96 | same |
| A: per-firm × list, shrunk | 1.385 | 1.83 | 1.42 | 4 | 6/6 | 0.091 | 0.933 | −1.58 | 1.96 | 2021 1.43 |
| A: Netanyahu bloc only, shrunk | 1.361 | 1.83 | 1.33 | 4 | 6/6 | 0.091 | 0.923 | −1.57 | 1.95 | same |
| A: per-class, firms with 3+ elections only | 1.361 | 2.00 | 1.42 | 4 | 6/6 | 0.090 | 0.927 | −1.61 | 1.96 | same |
| A: per-class, shrunk ×0.5 | 1.361 | 1.83 | 1.33 | 4 | 6/6 | 0.091 | 0.926 | −1.58 | 1.95 | same |
| A: per-class, unshrunk raw means | 1.395 | 2.17 | 1.50 | 4 | 6/6 | 0.097 | 0.935 | −1.62 | 2.06 | 2019b 1.00 |
| A: per-list, unshrunk raw means | 1.361 | 2.17 | 1.42 | 4 | 6/6 | 0.097 | 0.955 | −1.57 | 2.09 | same |
| *In-sample bound*: per-class, all-history table | 1.361 | 2.00 | 1.42 | 4 | 6/6 | 0.091 | 0.922 | −1.65 | 1.99 | same |
| Filber firms in, uncorrected | 1.397 | 2.00 | 1.50 | 4 | 6/6 | 0.085 | 0.902 | −1.47 | 1.82 | 2019a 3.00, 2020 0.89, 2022 0.77 |
| Filber firms in, per-class shrunk | 1.397 | 2.00 | 1.50 | 4 | 6/6 | 0.090 | 0.911 | −1.47 | 1.86 | same as above |
| *28-day estimates*: per-class, shrunk | 1.361 | 2.00 | 1.42 | 4 | 6/6 | 0.091 | 0.925 | −1.59 | 1.96 | same as v2 |
| *28-day estimates*: per-list, shrunk | 1.361 | 1.83 | 1.33 | 4 | 6/6 | 0.090 | 0.922 | −1.61 | 1.95 | same as v2 |

**Reading.**
- The correction shifts each historical pooled field by under 0.15 points on any class. That is why it
  rarely moves a seat, and when it does (the 2021 per-list case, the 2019b raw-mean case) the move is the
  wrong way.
- The historical fields were balanced: five to eight firms whose effects largely cancel. So the brief's
  premise holds in the sense that pooling had already removed the house effects. But this record never
  tests the unbalanced case. The firm-by-firm test in (a) does, and it says the same thing outside Shas.
- The 1-seat Netanyahu-bloc difference (1.83 against 2.00) is one election's rounding flip. It is noise
  in the other direction, not a signal that the correction is harmful, but it rules out a claim of
  improvement.

## 4. Bias against the result, per firm (question 3)

`node scripts/forecast/round2/A/predict.mjs --data=full`.
- Each firm's final-week polls (the last 7 days) are compared with the result, renormalised to the polled
  lists' total, so the unpolled fringe does not count as a miss.
- The **common** row is the mean of the non-Filber firms that election.
- The firm part is the firm's bias minus the common miss.

**Shas** (points, poll − result):

| Firm | 2013 | 2015 | 2019a | 2019b | 2020 | 2021 | 2022 | Firm part (mean) | Firm part signs |
|---|---|---|---|---|---|---|---|---|---|
| **common** | −0.31 | +0.48 | −1.71 | −1.56 | −0.79 | −0.50 | −1.54 | (mean −0.85) | |
| Maagar Mochot | +0.35 | +0.15 | −1.55 | −1.52 | −1.00 | +0.11 | −0.98 | +0.21 | 5+ 2− |
| Panels | −0.99 | +0.15 | −1.91 | −1.61 | −0.61 | −0.64 | −1.50 | −0.17 | 2+ 5− |
| Kantar | −1.02 | +0.54 | −2.54 | −1.52 | −0.98 | −0.60 | −1.90 | −0.30 | 2+ 5− |
| Midgam | | +0.15 | −1.80 | −1.52 | −0.97 | −0.61 | −1.82 | −0.16 | 1+ 5− |
| Smith | | +1.74 | −0.99 | −0.89 | −0.21 | −0.60 | −1.12 | +0.59 | 5+ 1− |
| Camil Fuchs | +0.21 | +0.15 | −1.82 | | | −0.65 | −1.94 | −0.10 | 1+ 4− |
| HaMidgam | | | −1.87 | −2.32 | −0.99 | | | −0.37 | 0+ 3− |
| Direct Polls | | | | | −0.13 | +0.18 | −1.14 | +0.58 | 3+ 0− |

**Variance split** (points):

| | common miss, sd | common miss, mean | firm part, rms | persistent firm part τ |
|---|---|---|---|---|
| Shas | 1.13 | −0.85 | 0.44 | 0.28 |
| UTJ | 0.37 | −0.07 | 0.32 | 0.12 |
| Arab lists | 1.30 | −0.30 | 0.51 | 0.14 |
| Likud | 3.25 | −1.43 | 0.93 | 0.08 |
| Netanyahu bloc | 2.25 | −0.78 | 1.15 | 0.31 |

The 28-day data gives the same picture (Shas common −0.94, τ 0.29; Arab τ 0.08).

**Answer.**
- **Shas.** Every firm has run low on Shas in the final week. The miss is common, and the global prior of
  +0.8 points in calibration.json is the right instrument for it. A firm-specific remainder exists and
  persists weakly: τ = 0.28, with Kantar, Panels, Midgam and HaMidgam lower than average and Smith and
  Direct Polls higher. Applied per firm in 2026, it would shift Kantar's polls by about +0.1 to +0.2
  points of Shas and Panels' and Midgam's by about +0.1. Pooled, that is under 0.1 point.
- **Arab lists.** No firm effect survives (τ 0.11–0.14; signs mixed for every firm except Camil Fuchs,
  5 of 5 above the common miss, who does not poll in 2026).
- **So the list priors stay global.**

## 5. 2026 (question 4)

`node scripts/forecast/round2/A/run2026.mjs 50000`.

**The 62 polls through Oct 22, by firm:**

| Firm (canonical) | Outlets | Polls | Elections of record | Shrunk effect: bloc / Likud / Haredi / Arab (points) | Status |
|---|---|---|---|---|---|
| panels (Lazar Research Institute + Panel4All; "Lazar") | Maariv, Walla | 11 | 7 (as Panels Politics) | −0.05 / −0.15 / −0.10 / −0.14 | Lineage: same person, new institute (Jul 2023) |
| kantar | Kan 11, Israel Hayom | 9 | 7 (incl. Teleseker, TNS) | −0.10 / +0.08 / +0.03 / +0.02 | Record |
| midgam (Midgam R&C) | Channel 12 | 8 | 7 | −0.22 / −0.09 / +0.12 / −0.02 | Record |
| hamidgam (Midgam Project + theMadad + Stat-Net + Askaria) | Channel 13 | 8 | 3 (2019a–2020) | −0.29 / −0.08 / −0.36 / +0.04 | Partial lineage: one of four partners |
| tatika (Yossi Tatika) | Zman Yisrael | 7 | 0 | — | New |
| nextdata (SF+ND) | Channel 14 (check) | 11 | 0 | — | New |
| direct (Direct Polls) | i24NEWS (check) | 8 | 5 | +0.37 / +0.21 / +0.28 / 0.00 | Record, but Filber left in Jun 2025 |

Not in 2026: Smith, Maagar Mochot (Channel 16; not in polls.json), Camil Fuchs, Geocartography.

The two unlabelled polls (Channel 13 on Oct 1 and Kan 11 on Sep 28) take their outlet's firm. None of the
other firms the brief guessed at (Dialog, iPanel, Maagar Mochot, Statnet, Shiluv, Next Data under another
name) appear separately in `firm`.

**Within-campaign 2026 effects against the record** (2026 effect by the same definition, ±5 days, Filber
firms out of the reference; points):

| Firm | Polls | Bloc | Likud | Haredi | Arab | Largest opp. | Small | Rest | Record: bloc | Record: Haredi |
|---|---|---|---|---|---|---|---|---|---|---|
| panels | 11 | −1.28 | −0.70 | −0.93 | −0.34 | +0.02 | +0.10 | +1.44 | −0.05 | −0.10 |
| hamidgam | 8 | +0.26 | −1.27 | −0.42 | +1.19 | −1.65 | +0.34 | +0.23 | −0.29 | −0.36 |
| kantar | 9 | +1.18 | +0.70 | −0.16 | −0.26 | +0.44 | +0.08 | −1.47 | −0.10 | +0.03 |
| midgam | 8 | −1.00 | +0.34 | −0.20 | −0.49 | +0.83 | −0.24 | +0.76 | −0.22 | +0.12 |
| tatika | 7 | +0.13 | +0.90 | +1.74 | +0.14 | +0.50 | −0.39 | −0.94 | — | — |
| direct | 8 | +5.92 | +5.05 | −0.02 | −0.31 | −1.22 | −0.44 | −2.78 | +0.38 | +0.27 |
| nextdata | 11 | +9.28 | +7.87 | +1.64 | −0.43 | −1.48 | −0.38 | −6.01 | — | — |

**Comparison.**
- **Field firms only.** Of the 24 firm × class cells with a record, the 2026 sign agrees in 17 (r = 0.35).
  Subtracting the record cuts the 2026 RMS deviation only from 0.87 to 0.83.
- **With Direct Polls.** 20 of 30, r = 0.45, RMS 1.71 → 1.64.

The record points the right way more often than not, but the 2026 effects are two to three times their
historical size. Panels' bloc effect is −1.28, against a record of −0.05. Kantar's is +1.18, against
−0.10.

**The forecast** (50,000 runs, seed as model.mjs):

| Variant | Net / Opp / Mid / Arab | P(net ≥ 61) | Likud | Shas | Yashar | B'Yachad | Reservists (pass %) | Amcha (pass %) | Ra'am (pass %) | Field's net share | Correction per poll (net points) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **v2** | 54 / 51 / 0 / 15 | 3% | 21 | 10 | 22 | 12 | 0 (22.7%) | 0 (18.9%) | 6 (95.8%) | 43.93 | — |
| A: per-class, all history | 54 / 51 / 0 / 15 | 3% | 21 | 10 | 22 | 12 | 0 (22.6%) | 0 (18.9%) | 6 (95.8%) | 44.05 | Maariv −0.25, Walla −0.25, Ch 13 −0.45, Ch 12 +0.04, Kan +0.11, Zman Yisrael none |
| A: per-list | 54 / 51 / 0 / 15 | 3% | 21 | 10 | 22 | 12 | 0 (22.5%) | 0 (18.7%) | 6 (95.7%) | 44.03 | Ch 13 −0.52, … |
| A: bloc only | 54 / 51 / 0 / 15 | 3% | 21 | 10 | 22 | 12 | 0 (22.4%) | 0 (19.2%) | 6 (95.7%) | 44.07 | Ch 12 −0.22, Ch 13 −0.29, … |
| A: firms with 3+ elections | 54 / 51 / 0 / 15 | 3% | 21 | 10 | 22 | 12 | 0 (22.6%) | 0 (18.9%) | 6 (95.8%) | 44.05 | as per-class |

Every list's point is identical across the variants. The correction raises the field's Netanyahu-bloc
share by 0.10–0.14 points (about 0.15 seats). That is the whole effect. The 2026 field is unbalanced only
in having no Smith or Maagar Mochot (the two firms with consistently pro-bloc records) and a new firm,
Tatika. Firm weights already split Lazar's and Kantar's double outlets, so the imbalance the brief worried
about has been handled since v2.

## Recommendation

1. **Do not ship house effects for the field firms.** Keep `houseEffects: null`, which is v2's behaviour.
   The gate fails: no variant improves the leave-future-out per-list error (best 1.361 = v2). The
   per-class version worsens the Netanyahu-bloc and mean bloc errors by one seat in one election. The
   continuous share error worsens in every variant. Even the hindsight bound is flat. No override is
   argued: the method has nothing to offer on this yardstick and moves the 2026 forecast by 0.15 seats.
2. **Keep the list priors global.** The Shas and Arab misses are common to all firms. Per-firm priors would
   change the pooled field by under 0.1 point.
3. **Keep `firmWeights: true`.** The firm is the better unit on the bloc, and the double-outlet firms are
   already handled.
4. **For the Filber question, a historical house effect is not the tool.** Direct Polls' shrunk record is
   +0.37 points; its 2026 excess is +5.9. If the synthesis includes the checks (round 1's option c2), the
   correction has to come from 2026 itself: within-campaign centring plus an explicit allowance for the
   historical lean. It cannot come from this table. Including them with the historical correction scored
   1.397, against 1.361 for v2.
5. **For agent E (the state-space model).** A firm effect prior of N(0, τ²) per class with **τ ≈ 0.25–0.45
   points** (bloc 0.42, Likud 0.25, Haredi 0.28, Arab 0.11, largest opposition 0.30, small lists 0) is
   what the record supports as a cross-election prior. Any within-campaign effect larger than that is being
   learnt from the current campaign, which is fine and is what pooling already does implicitly. Do not seed
   a model with unshrunk historical means: they are worse than zero out of sample.
6. **For agent C (threshold lists).** Firm-to-firm disagreement on small lists has no persistent component
   (τ² < 0 on both data sets; LOO slope −0.2 to −0.8). Treat a firm's high or low reading of a threshold
   list as noise, not house style.

**If the synthesis wants the switch anyway** (for example, to run it as a sensitivity), the drop-in is the
block marked `A:` in `scripts/forecast/round2/A/model-a.mjs`: `canonFirm`, `FIRM_PATTERNS`, `classesOf`,
the correction loop after `const per = …`, and `inputs.houseEffects`. Call it with:

```js
const HE = JSON.parse(fs.readFileSync("scripts/forecast/round2/A/house-effects.json", "utf8"));
forecast({ ..., opts: { houseEffects: { table: HE.tables.all.firms, firmMap: HE.firmMap, mode: "class" } } });
// backtest: table: HE.tables["lfo:" + e.key].firms
```

**What would change this conclusion?** A field dominated by one or two firms with long, consistent
records, such as Smith and Maagar Mochot in their 2020–22 form (+0.4 to +1.5 bloc points every election).
2026 is not that field.

## Reproduce

```
node scripts/forecast/round2/A/house.mjs --data=full --report      # writes house-effects.json; §2 tables
node scripts/forecast/round2/A/house.mjs --data=data --out=/tmp/he28.json --report   # the 28-day version
node scripts/forecast/round2/A/predict.mjs --data=full             # §3(a), §4 (also --data=data)
node scripts/forecast/round2/A/backtest-a.mjs 10000                # §3(b) (--he=/tmp/he28.json for the 28-day rows), ~25 s
node scripts/forecast/round2/A/run2026.mjs 50000                   # §5, ~40 s
node scripts/forecast/backtest/v2.mjs 10000                        # the v2 baseline (1.36 / 1.83 / 1.33 / 4 / 6/6 / 0.090)
```
