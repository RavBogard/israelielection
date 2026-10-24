# E. A state-space poll aggregator as the full-rebuild candidate

Round 2 research memo, 2026-10-24. Agent E. Scope: brief decision 3, the full rebuild. I built a Kalman-filter
aggregation of the whole campaign, in plain Node ESM with no dependencies. Each list has a latent vote share that
follows a random walk, and each poll reads it through a firm house effect and sampling noise. Every parameter is fitted
leave-future-out. I scored it against version 2 on the six 3.25%-threshold elections and ran it on the 2026 polls
through October 22. No 2026 poll was fetched, and none dated after October 22 was used. Nothing committed was changed.

Files (uncommitted, all in `scripts/forecast/round2/E/`):

| File | What it does |
|---|---|
| `model-e.mjs` | The drop-in: `forecast({polls, config, parties, agreements, cal, opts})` with model.mjs's return shape. It also exports `kalman`, `campaignObs`, `fitParams`, `pollShares` and `FITTED_ALL`. It is deterministic for a given `opts.seed` (checked: two runs give identical JSON). |
| `backtest-e.mjs` | The v2.mjs harness pattern. `[runs]` prints the table. `--fits` prints the leave-future-out fits and the refit bias terms. `--fit-all` gives the 2026 parameters. `--2026 [runs]` runs the 2026 forecast beside v2. |

```
node scripts/forecast/round2/E/backtest-e.mjs 10000     # §3 table, 37 s
node scripts/forecast/round2/E/backtest-e.mjs --fits    # §2 fits, 2 s
node scripts/forecast/round2/E/backtest-e.mjs --2026    # §5, 11 s (fits included); the model alone is 2 s at 50,000 runs
```

**Pinning.** The synthesis began editing `model.mjs` and `calibration.json` in the working tree while I worked. For
example, the fringe went from 1.5% to 1.8%. backtest-e.mjs therefore reads both files **as committed at e554940**
(via `git show`), and every number here comes from those versions. `--live` uses the working-tree files instead.

## Summary

1. **Negative result: the state-space model does not beat version 2.** Leave-future-out over the six elections at
   10,000 runs:
   - Per-list error is 1.39 seats against v2's 1.36.
   - Netanyahu-bloc error is 2.50 against 1.83, and mean bloc error 1.58 against 1.33.
   - Wrong threshold calls are 4 and 4. The modal outcome is right 6/6 for both.
   - Majority Brier is 0.081 against 0.090 (better). P(pass) Brier is 0.0486 against 0.0449 (worse).
   - 90% coverage is 94% against 93%.

   By election, E is better in 2015 (1.45 against 1.64), worse in April 2019 (3.00 against 2.86) and September
   2019 (1.00 against 0.80), and identical in the other three. All of these gaps are one to three seats in one
   election. That is noise, and none of it is a gain.
2. **The smoothed level and v2's field are almost the same point estimate.** Compare the raw estimates with no
   priors and no lean, against the result:
   - Mean absolute share error is 1.113 points for E's latent level and 1.102 for v2's 7-day field.
   - Every election differs by 0.05 points or less.
   - After priors and lean, the continuous share error is 0.930 against 0.922.

   Kalman smoothing over the whole campaign lands where the latest poll of each outlet already is. That fits
   D-blackout's finding: the final error is a level bias shared by all firms, and averaging more polls cannot
   remove it.
3. **Neither more polls nor the structure buys anything (question 2).**
   - v2 with a 14-day window equals v2: 1.36, the same points.
   - Every poll in 14 days, plain static average with no house effects (more polls only): 1.47. That is worse,
     because older polls come back in.
   - E's structure on v2's own field, one latest poll per outlet in 7 days (structure only): 1.40.
   - E on 14 days: 1.39. On 28 days: 1.39. On the full campaign: 1.39.

   The best row in the table is E with a weak forced trend, at 1.29. It comes from two elections changing by 2 and
   4 seats, and its P(pass) Brier is worse. A stronger trend scores 1.38. Like D's trend results, this is noise.
4. **The fitted dynamics are stable and agree with D.**
   - Random-walk sd q8 = 0.17 points per √day at an 8% share in five of the six leave-future-out fits (0.22 when
     trained on 2013 alone). This matches D's variogram (0.17).
   - Poll noise r8 = 0.6–0.7 points at 8%. That is well below the binomial 1.1 points at n = 600, because Israeli
     polls scatter less than simple random samples.
   - House-effect sd h8 = 0.5–0.6 points at 8%, about A's within-election drift ω.
   - A local-linear-trend slope fits to zero (or 0.002) every time. **The data do not support a trend.**
5. **House effects improve how well the model predicts the next poll, not the forecast.**
   - With house effects in the state, the log-likelihood of the training polls rises by 50–370 units. They are
     real within a campaign.
   - Switching them off moves the per-list error by 0 to +0.19 seats depending on the election, and pools to the
     same 1.39. Bloc error is 1.67 without them against 1.58 with them.
   - Using A's historical record as the prior means changes nothing (1.39). This repeats A's negative result.
6. **Refitting the bias terms on my own residuals hurts, so keep v2's.**
   - Refit lean and class priors (shrunk k/(k+2)), leave-future-out: 1.47 with 2013 in training, 1.48 without it.
     That is 5 wrong calls against 4, and majority Brier 0.137 or 0.108.
   - Without any bias terms the error is 1.67 and there are 7 wrong calls.
   - The priors and lean are what make v2 (and E) good. The aggregation step is not where the error is.
7. **2026 (polls through Oct 22, election day Oct 27).**
   - E gives blocs **53 / 52 / 0 / 15**, Netanyahu bloc 90% interval 46–60, and P(net ≥ 61) **3%**. v2 gives
     54 / 51 / 0 / 15, 47–59 and 3%.
   - Lists: E has Shas 9 and B'Yachad 13; v2 has Shas 10 and B'Yachad 12. Every other list's point is the same.
   - Pass probabilities: Power of Israel (`poi`) 17.7% against 18.9%; Reservists 24.2% against 22.7%; Ra'am 94.7%
     against 95.8%.

   Both changed seats come from one D'Hondt seat at the margin (Shas 7.38% against 7.33%).
8. **Verdict: v3 should not be this model, and it needs none of its pieces.** It is a correct and fast rebuild that
   reproduces v2 within noise. That independently confirms v2's field rule. It does not pass the gate (decision 2):
   the yardstick is 1.39 against 1.36, and the bloc error is worse. If agent F ensembles it, expect almost no
   diversification. Its point estimates track v2's within 0.05 points of share, so an ensemble weight on it mostly
   re-weights v2. One small byproduct may be worth keeping for the record, not the model: the leave-future-out q8 =
   0.17 confirms D's blackout random-walk size from a different method.

## 1. The model

Each list i gets its own Kalman filter (`model-e.mjs`, `kalman`). Days are the time unit.

- **Level.** x_t = x_{t−Δ} + w, w ~ N(0, q·Δ).
  - Option `dynamics: "llt"` adds a slope state with its own innovation (qv).
  - Option `"static"` sets q = 0, giving one level over the window.
- **Poll.** y = x_t + h_firm + ε, ε ~ N(0, r · 600/n). n = 600 when unstated, which is always the case in the
  historical files.
- **House.** h_firm ~ N(m_firm, H), constant over the campaign and part of the state, so it is estimated jointly
  with the level.
  - m = 0 by default. With `houseRecord`, m is A's shrunk per-firm, per-list record in points.
  - Identification is soft: the level is the precision-weighted consensus of the firms.
  - Firms are A's lineages (FIRM_PATTERNS, copied). A poll with no firm takes its outlet's single firm.
- **Scaling.** q, r and H scale with the list's campaign-mean share s̄ (floored at 1%): q = (q8/100)²·s̄/0.08,
  and likewise r and H. Three numbers set every list: **q8, r8 and h8**, in points at an 8% share.
- **Readings.**
  - Seats go to shares by model.mjs's step-2 D'Hondt midpoint. The one change is that lists outside the
    modelled set count when solving the divisor, instead of being skipped. These are withdrawn lists, pre-merger
    components and combined cells.
  - A list below the threshold with a printed share is a normal reading.
  - One with no share printed is a censored pseudo-reading: min(predicted, 3.1%) with sd 0.8 points.
  - A list's filter starts at its first reading under its final id, so no trend runs before the list is launched
    (D1's advice).
- **Election day.** The filtered level is walked forward over the gap to `electionDate` (3–4 days in the backtest,
  5 for 2026) and renormalised to 1 − fringe. That mean and sd replace model.mjs's `base`.
- **Steps 4–9** are model.mjs's code, copied because its `allocate` and simulation are closures: priors, gross
  lean, bloc sd, zero-sum list noise, Arab swing, consolidation, small-list floor, Bader-Ofer with surplus pairs,
  and the median point. The one addition: when `latentNoise` is on, each run first draws the level from its
  posterior.
- **Polls used.**
  - Everything since `config.dissolved`, with the Filber-firm checks left out.
  - In the backtest the checks are left out poll by poll (`filber: true`). v2.mjs leaves them out by outlet.
    The one place this differs is April 2019, where v2 also drops Kan 11's two non-Filber polls.
  - The structure-only control row ("E on v2's field") therefore differs from v2 in that election.
- **Runtime.** 2 s for 50,000 runs in 2026. A full fit on seven elections takes under 0.5 s.

## 2. What was fitted, and how (question 3)

Everything is fitted by maximum likelihood of the one-step-ahead poll predictions. A list's first reading is left
out of the likelihood. The fit is a coordinate search over log grids (`fitParams`). It uses only the full-campaign
files (D1, since the dissolution) of elections **before** the scored one. 2013 is training only.

`node scripts/forecast/round2/E/backtest-e.mjs --fits`:

| Scored | Trained on | rw + house: q8 / r8 / h8 | rw, no house: q8 / r8 | llt slope qv8 | log-lik gain from house |
|---|---|---|---|---|---|
| 2015-03 | 2013 | 0.22 / 0.7 / 0.5 | 0.22 / 0.8 | 0 | +51 |
| 2019-04 | 2013–15 | 0.17 / 0.7 / 0.5 | 0.17 / 0.8 | 0.002 | +132 |
| 2019-09 | 2013–19a | 0.17 / 0.7 / 0.6 | 0.17 / 0.9 | 0.002 | +245 |
| 2020-03 | 2013–19b | 0.17 / 0.7 / 0.5 | 0.17 / 0.8 | 0 | +279 |
| 2021-03 | 2013–20 | 0.17 / 0.7 / 0.5 | 0.17 / 0.8 | 0 | +304 |
| 2022-11 | 2013–21 | 0.17 / 0.6 / 0.5 | 0.17 / 0.8 | 0.002 | +368 |
| 2026 (`FITTED_ALL`) | 2013–22 | 0.17 / 0.6 / 0.5 | 0.17 / 0.7 | 0 | +461 |

The trend variants are scored with the slope sd **forced** to 0.005 and 0.02, because the fitted trend is no trend.

**Bias terms.**
- **v2's**, the default: the lean comes from calibration.json's earlier elections (half-life 2), and the priors
  from v2.mjs's CLASSES.
- **Refit:**
  - lean residual = 120 × (result Netanyahu-bloc vote share − E's election-day bloc share) in each training
    election, half-life 2;
  - class priors (Shas, Arab-led, new splinter or Bennett list) = the mean residual of the class's lists in
    training, shrunk by k/(k+2);
  - classes are v2.mjs's CLASSES, plus 2013 by my judgment: Shas; Ra'am–Ta'al, Hadash and Balad; and Jewish Home
    (Bennett's first), Otzma LeYisrael and Am Shalem as new.
- **Refit residuals by training election** (seats-equivalent): 2013 −4.5, 2015 +2.7, April 2019 +3.0, September
  2019 −0.6, 2020 +2.7, 2021 +3.1. The vote-share residuals are larger than calibration.json's seat residuals,
  because failed lists' votes count in the share.
- **Refit class means** after shrinkage, by 2022: Shas +0.65, Arab +0.03 and new −1.07 points. Against v2's +0.8,
  +0.5 and −0.8, the refit flattens the Arab prior to nothing.

## 3. Backtest (question 1)

`node scripts/forecast/round2/E/backtest-e.mjs 10000`. Leave-future-out over six elections, 71 lists.
- **Columns 2–7** are the brief's: list error, Netanyahu-bloc error, mean bloc error, wrong calls, modal outcome,
  majority Brier.
- **P(pass) Brier** is the mean over lists.
- **Cover** is the share of results inside the list's 90% interval.
- **Share** is the mean absolute error of the central share in points: continuous and less noisy.

| Variant | List | Net bloc | Bloc | Wrong | Modal | Maj. Brier | P(pass) Brier | Cover 90 | Share | By election |
|---|---|---|---|---|---|---|---|---|---|---|
| **v2** | **1.36** | **1.83** | **1.33** | 4 | 6/6 | 0.090 | **0.0449** | 93% | **0.922** | 1.64 2.86 0.80 0.67 1.29 0.92 |
| v2, 14-day window (control) | 1.36 | 1.83 | 1.33 | 4 | 6/6 | 0.088 | 0.0448 | 94% | 0.920 | 1.64 2.86 0.80 0.67 1.29 0.92 |
| **E: rw + house, full campaign, v2 bias** | 1.39 | 2.50 | 1.58 | 4 | 6/6 | **0.081** | 0.0486 | 94% | 0.930 | 1.45 3.00 1.00 0.67 1.29 0.92 |
| E: house effects off | 1.39 | 2.50 | 1.67 | 4 | 6/6 | 0.085 | 0.0452 | 94% | 0.930 | 1.64 2.86 1.00 0.67 1.29 0.92 |
| E: A's record as house prior means | 1.39 | 2.50 | 1.58 | 4 | 6/6 | 0.085 | 0.0488 | 94% | 0.940 | 1.45 3.00 1.00 0.67 1.29 0.92 |
| E: trend on (slope sd 0.005, forced) | 1.29 | 2.33 | 1.50 | 4 | 6/6 | 0.081 | 0.0503 | 94% | 0.932 | 1.64 2.86 0.60 0.44 1.29 0.92 |
| E: trend on (slope sd 0.02, forced) | 1.38 | 2.50 | 1.58 | 4 | 6/6 | 0.087 | 0.0511 | 94% | 0.954 | 1.82 2.86 0.60 0.67 1.29 1.08 |
| E: pure level (static, last 14 days) | 1.34 | 2.33 | 1.67 | 4 | 6/6 | 0.079 | 0.0452 | 93% | 0.923 | 1.45 2.71 1.00 0.67 1.29 0.92 |
| E: refit bias (2013 in training) | 1.47 | 3.17 | 2.00 | 5 | 6/6 | 0.137 | 0.0510 | 94% | 1.021 | 1.82 2.57 1.00 0.67 1.86 0.92 |
| E: refit bias (2015 on) | 1.48 | 2.33 | 1.67 | 5 | 6/6 | 0.108 | 0.0598 | 92% | 1.007 | 1.82 2.43 1.20 0.67 1.86 0.92 |
| E: no bias terms | 1.67 | 1.83 | 1.67 | 7 | 6/6 | 0.084 | 0.0698 | 90% | 1.091 | 1.82 3.00 1.20 0.89 1.86 1.23 |
| E: no latent draw | 1.36 | 2.17 | 1.42 | 4 | 6/6 | 0.077 | 0.0485 | 94% | 0.930 | 1.45 2.86 1.00 0.67 1.29 0.92 |
| ctrl: E on v2's field (7 days, latest per outlet) | 1.40 | 1.83 | 1.42 | 4 | 6/6 | 0.092 | 0.0475 | 94% | 0.924 | 1.64 2.86 0.80 0.89 1.29 0.92 |
| ctrl: every poll in 14 days, static, no house | 1.47 | 3.17 | 1.83 | 5 | 6/6 | 0.083 | 0.0437 | 94% | 0.927 | 1.45 2.71 1.00 0.89 1.86 0.92 |
| ctrl: every poll in 14 days, rw, house | 1.39 | 2.33 | 1.58 | 4 | 6/6 | 0.086 | 0.0466 | 94% | 0.922 | 1.64 3.00 0.80 0.67 1.29 0.92 |
| ctrl: every poll in 28 days, rw, house | 1.39 | 2.33 | 1.50 | 4 | 6/6 | 0.084 | 0.0472 | 94% | 0.921 | 1.64 3.00 0.80 0.67 1.29 0.92 |

**Raw point check (no priors, no lean).** Scratch script `/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/E/t2.mjs` (not in the repo), same leave-future-out fits.

| | 2015 | Apr 2019 | Sep 2019 | 2020 | 2021 | 2022 | Pooled |
|---|---|---|---|---|---|---|---|
| Share MAE, v2 7-day field | 1.241 | 1.667 | 0.821 | 0.985 | 1.156 | 0.615 | **1.102** |
| Share MAE, E latent level | 1.263 | 1.656 | 0.843 | 0.970 | 1.204 | 0.613 | 1.113 |
| Netanyahu-bloc share (v2 / E / result) | 47.2 / 46.6 / 48.9 | 52.6 / 52.9 / 55.5 | 45.0 / 45.0 / 44.5 | 46.2 / 46.1 / 48.4 | 39.9 / 39.4 / 42.1 | 46.9 / 46.9 / 48.4 | |

Reading the table:

- **Point estimate.** E's level ties v2's field to within ±0.05 points of share per election. That is about 0.06
  seats per list, below what any seat-level score can resolve.
- **Bloc error.** E is worse on the Netanyahu bloc mainly through seat rounding, plus a slightly lower bloc share
  in 2015 and 2021. In those campaigns the earlier polls had the bloc lower, and the walk keeps a little of that.
- **Majority Brier.** E's 0.081 against 0.090 is driven by its net-bloc distribution sitting a little lower and
  wider. With six outcomes this is not evidence.
- **Latent draw.** The "no latent draw" row (Brier 0.077, list error 1.36) shows the extra posterior draw is
  mostly double counting. v2's election-day widths were calibrated on final-poll errors, which already contain
  the averaging noise. If E were used, it should run with `latentNoise: false`.
- **Coverage.** Both models over-cover (93–94% inside 90% intervals), as D and G found for v2.

**What is noise.**
- Every list-error difference in the table except "no bias terms" (−0.31) and the refit rows (−0.11). Each is
  under 0.1 seats, which is 1–4 seats in one election.
- Both trend rows. The better one gains only in September 2019 and 2020, and the stronger one loses.
- The 2015 gain (1.64 → 1.45), which is two lists' rounding.

**What is not noise.**
- The priors and lean carry v2's skill: 1.67 → 1.36–1.39 in both models.
- My refit of them is worse than v2's hand-classed values in both halves of the record. It is worse in 2015 and
  2021 and better only in April 2019.
- q8 = 0.17 and the zero slope held in every training set.

## 4. More polls versus structure (question 2)

The decomposition rows answer it directly. Against v2's 1.36:

| Change | List error | Reading |
|---|---|---|
| More polls, no structure (all polls in 14 days, plain average) | 1.47 | worse: polls older than each outlet's latest add stale level |
| Structure, same polls (E on v2's 7-day latest-per-outlet field) | 1.40 | no gain; house effects can't be told apart with one poll per firm |
| Structure and more polls (14 days, 28 days, whole campaign) | 1.39 / 1.39 / 1.39 | no gain from the extra data once the walk discounts it |
| v2's own 14-day window | 1.36 | identical to 7 days |

The filter treats older polls correctly, so it never does worse than adding them naively. But it has nothing to
gain: the final error is a shared level bias (D: r = 0.92 with the gap 14 days earlier). No reweighting of polls
reaches it.

## 5. 2026 (question 4)

`node scripts/forecast/round2/E/backtest-e.mjs --2026 50000`, on `scripts/forecast/round2/polls-through-2026-10-22.json`
(62 polls, 44 after the checks, Sep 6 – Oct 22). It uses the snapshot's `config`, `data/parties.json`, the five
agreements in `data/results.json`, calibration.json's priors and lean, the parameters fitted on all seven elections
(q8 0.17, r8 0.6, h8 0.5), and an election date of Oct 27 (a gap of 5 days).

| | Blocs net / opp / mid / arab | Net 90% | P(net ≥ 61) | P(opp ≥ 61) | P(pass) Power of Israel (`poi`) | P(pass) Reservists | P(pass) Ra'am |
|---|---|---|---|---|---|---|---|
| **v2** | **54 / 51 / 0 / 15** | 47–59 | **3%** | 0% | 18.9% | 22.7% | 95.8% |
| **E (default)** | **53 / 52 / 0 / 15** | 46–60 | **3%** | 0% | 17.7% | 24.2% | 94.7% |
| E, house off | 52 / 52 / 0 / 16 | 46–59 | 3% | 0% | 20.6% | 23.8% | 95.7% |
| E, A's record as prior means | 54 / 51 / 0 / 15 | 47–60 | 3% | 0% | 17.5% | 24.0% | 94.6% |
| E, no latent draw | 53 / 52 / 0 / 15 | 47–59 | 3% | 0% | 16.3% | 23.3% | 95.7% |
| E, static level over 14 days | 53 / 52 / 0 / 15 | 47–59 | 3% | 0% | 20.5% | 22.9% | 95.6% |

Seats:

| | Likud | Otzma | Shas | UTJ | RZ | Power of Israel | Yashar | B'Yachad | Democrats | YB | Reservists | JL | Ra'am |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v2 | 21 | 8 | 10 | 8 | 7 | 0 | 22 | 12 | 9 | 8 | 0 | 9 | 6 |
| E | 21 | 8 | 9 | 8 | 7 | 0 | 22 | 13 | 9 | 8 | 0 | 9 | 6 |

E's latent level before the priors and lean is in points ± posterior sd, including the 5-day walk:
- Likud 15.3 ± 0.7, Yashar 16.9 ± 0.8, B'Yachad 10.7 ± 0.6;
- Democrats 7.2, JL 7.0, YB 6.6, Shas 6.3, UTJ 6.1, Otzma 5.9, RZ 5.4, Ra'am 4.4;
- Reservists 3.4 ± 0.3, Power of Israel 3.0 ± 0.3.

Central shares after the priors and lean differ from v2's by at most 0.16 points (B'Yachad 9.71 against 9.55).
Turning house effects on moves Likud +0.3 and Yashar +0.2 points. The 2026 firms disagree on those lists, and the
filter weights the consensus differently from v2's √n per-firm weights. The Filber firms stay out of both models.

## Recommendation

1. **Do not make v3 the state-space model.** It fails the gate: list error 1.39 against 1.36, Netanyahu-bloc error
   2.50 against 1.83, mean bloc error 1.58 against 1.33. No override argument applies, because the backtest is
   informative here: it tests the point estimate directly, and on the continuous share error the model ties v2 at
   best.
2. **Take none of its pieces into v2.**
   - House effects in the state: no gain, as A found.
   - A trend: it fits to zero and D rejects it.
   - Whole-campaign pooling: no gain.
   - Refit bias terms: worse.
   - The extra latent draw: it double counts v2's calibrated widths.
3. **For agent F.** `model-e.mjs` is importable and deterministic. If it goes into the ensemble anyway, call it as
   `forecast({ polls, config, parties, agreements, cal, opts: { electionDate: "2026-10-27", latentNoise: false } })`.
   `latentNoise: false` is the better-scoring setting: list error 1.36, majority Brier 0.077. Expect its weight to
   be uninformative. Its point estimates sit within 0.05 points of share of v2's in every backtest election, so v2
   and E are nearly collinear.
4. **For the record and the methodology page.** An independent full-campaign Kalman aggregation with fitted house
   effects reproduces version 2's forecast within one seat per list in 2026: 53/52/0/15 against 54/51/0/15, and
   P(61) 3% in both. That is a useful robustness statement. Its fitted random walk (0.17 points per √day at 8%) and
   the absence of a trend confirm D's blackout parameters by a second method.

No code change to model.mjs is proposed. The drop-in is `scripts/forecast/round2/E/model-e.mjs` as it stands.

## Sensitivity seen by accident

Rerun with `--live` (calibration.json's fringe at 1.8%, model.mjs as the synthesis is editing it):
- E's default row is unchanged at 1.39.
- E without house effects goes from 1.39 to 1.49, the static 14-day row from 1.34 to 1.44, and "no latent draw"
  from 1.36 to 1.46.
- Each of those moves is one election, 2021, going from 1.29 to 1.86 per list. That is 8 seats from rounding and
  threshold calls near the margin.

A 0.3-point change to an unrelated constant moves a row by 0.1 seats. That puts the size of the noise floor under
this table beyond doubt: no difference of that size between E and v2 means anything.

## Limitations

- **Independent filters.** The per-list filters ignore the sum-to-one constraint, and the renormalisation absorbs
  it. With within-bloc substitution a joint filter could differ slightly, but not by enough to reverse §3.
- **Units of the refit lean.** It is in vote share × 120, not seats. That is consistent with how the simulation
  applies it, but it makes the refit residuals larger than calibration.json's seat residuals, which is part of
  why the refit scores worse.
- **Censored readings.** A list printed below the threshold with no share uses a pseudo-reading, an
  approximation.
- **No sample sizes.** n is unknown historically, so every poll gets equal sampling weight before house effects.
  v2 shares weight between two outlets of one firm. E instead lets the shared firm house effect absorb what they
  have in common.
