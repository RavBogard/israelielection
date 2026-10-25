# A. Backtest: the forecast on the six elections under the 3.25% threshold

Round 1, researcher A, 2026-10-23. Harness: `scripts/forecast/backtest/` (README there). Every number below comes from
`node scripts/forecast/backtest/backtest.mjs` (baseline, about 3 s), `--grid` (about 35 s), `--opts '<json>'` and
`--2026 '<json>'`. Seeded, so reruns give the same figures.

## What was built

- **Data**: `scripts/forecast/backtest/data/{2015-03,2019-04,2019-09,2020-03,2021-03,2022-11}.json`. Each file holds every
  poll dated in the 28 days before the vote (28 to 47 per election), in data/polls.json's record shape plus a `filber`
  flag. It also holds the official result per list (votes, %, seats), the surplus-vote agreements and the bloc of each
  list. Sources are the English Wikipedia polling pages and election articles (URLs in the README and in each file).
  `build-data.py` regenerates the files from the wikitext, and every judgment is written out in that script.
- **Model**: `model.mjs` `forecast(polls, opts)`. Under default options it reproduces forecast.mjs exactly:
  `--check2026` runs forecast.mjs on today's data/polls.json at 50,000 runs and the same seed, and every printed figure
  is identical. Every component can be switched or replaced through `opts`.
- **Harness**: lean and bloc sd are computed leave-future-out, from the elections before each one only, using
  forecast.mjs's recency rule (2015 gets 0). It applies the pre-registered score (list MAE of `point`, bloc errors,
  threshold calls, the most probable majority outcome) and adds a Brier score on P(pass) per list, a three-outcome
  Brier score on the majority, and 90%-interval coverage. The two site averages (lib/polls.ts's rule, with and without
  Filber's firms) are scored the same way.

Checks that the pipeline is right:
- Bader-Ofer with the recorded agreements reproduces every official seat count exactly in all six elections. Without
  the agreements, two lists are off in four of the six.
- The data's final-fortnight field mean for the Netanyahu bloc matches calibration.json within 0.5 seats in each year
  (56.9/56.4, 64.6/64.7, 55.7/55.6, 57.3/57.3, 49.9/50.3, 60.0/60.3).

## Data caveats

1. **No sample sizes.** Wikipedia's Israeli tables print none, so `n` is null for every poll. Both the model (600 by
   default) and the site average (weight 1 when no n is known) therefore weight the polls equally. **The √n weighting
   cannot be tested.**
2. **Dates.** Wikipedia gives one date or a fieldwork range ("26–27 Oct"). `published` is the last day. Polls one or
   two days from the 14-day edge can be in or out depending on this choice. Three polls are that close, all just
   outside: Panels/Maariv–Jerusalem Post 2015 (1 day), Smith/103fm–Maariv Sep 2019 (2 days) and Panels/Makor Rishon
   2020 (2 days).
3. **Firm and outlet.** The 2015 and April 2019 tables put "Firm/Outlet" in one cell. It is split on the last slash.
   Outlets with no named firm (Channel 2, 10, 1, Reshet Bet) have `firm: null`. `pollster` is the outlet, as on the
   site. Spelling variants are merged (HaHadashot 12/Keshet → Channel 12, and the others in the README). When one
   outlet used two firms inside the window, only the latest poll counts: Channel 12 in April 2019 keeps Midgam (4 Apr)
   and drops Panels (31 Mar). Maariv (Smith) and "Maariv & The Jerusalem Post" (Panels) in 2020 stay separate.
4. **Joint lists.** Several 2015 columns are merged into one list each: Labor + Hatnuah into Zionist Union, Hadash +
   UAL-Ta'al + Balad into the Joint List, and Otzma + Yachad into Yachad. The 2022 RZP–Otzma–Noam list is one list.
   A dash in a list's cell means below the threshold with no share printed. Every such poll still sums to 120 seats.
   Two polls sum to 121 as printed: Israel Hayom 2015-03-06 and Maariv/Panels 2020-02-19.
5. **Blocs** follow calibration.json's 'about' text. Lists in neither camp are 'mid': Kulanu 2015, Yisrael Beiteinu
   in Sep 2019 and 2020, Yamina 2021 and Jewish Home 2022. Otzma Yehudit in Sep 2019 and 2020 is also 'mid': it is
   right-wing, but calibration.json leaves it out of the bloc, and it failed both times. Under these definitions the
   2015 outcome is "neither bloc at 61" (57), although Netanyahu formed a government with Kulanu.
6. **Direct Polls / Filber.** There are Direct Polls polls in the window in Apr 2019 (Makor Rishon, 28 Mar, 12 days
   out), 2020, 2021 and 2022. calibration.json shows none for Apr 2019. In each year the firm is one of 8 to 13 polls
   and sits within about 3 seats of the field: −0.6, +1.7, +3.1 and +2.0 on the Netanyahu bloc.
7. **Look-ahead.** listSd comes from theMadad's 2022 per-list error, so for 2015 to 2021 it is mildly in-sample. The
   lean and blocSd are strictly leave-future-out.
8. **Stale published file (not a backtest issue).** `data/forecast.json` (generated 21:44 UTC) was built before
   `maariv-2026-10-22` entered data/polls.json. Running forecast.mjs on the committed polls gives different figures:
   Ra'am passes 86% (published 90%), Amcha 43% (47%), Reservists 45% (46%), Otzma share 6.32 (6.49), and
   oppWithArabAndMid 92 (91). The next run of the polls job will change the published numbers.

## Baseline scores (10,000 runs; leave-future-out lean)

The field's miss on the Netanyahu bloc (result minus field mean) was +0.1, +0.4, −0.7, +0.7, +2.1 and +4.0 seats.
The leave-future-out lean applied in each election was therefore small: 0.0, 0.1, 0.3, −0.1, 0.2 and 0.9. blocSd hit
its floor of 3.0 in all six.

| | list MAE | Netanyahu-bloc error | Zionist-opposition error | mean bloc error | threshold calls wrong (of 71) | majority call right | Brier P(pass) | Brier majority |
|---|---|---|---|---|---|---|---|---|
| **Model, published rules** | **1.77** | 1.00 | 3.00 | 2.00 | 9 | 6/6 | 0.068 | 0.076 |
| Average, all polls | 1.53 | 1.20 | 2.60 | 1.65 | 5 | 5/6 | 0.068 (0/1) | 0.333 (0/1) |
| Average, no Filber | 1.55 | 1.25 | 2.63 | 1.68 | 5 | 5/6 | 0.068 (0/1) | 0.333 (0/1) |
| Model + recommendations 1–3 below | 1.51 | 1.50 | 2.67 | 1.75 | 5 | 6/6 | 0.060 | 0.054 |

Per election (list MAE / Netanyahu-bloc error / threshold misses):

| | 2015 | Apr 2019 | Sep 2019 | 2020 | 2021 | 2022 |
|---|---|---|---|---|---|---|
| Model, published | 2.00 / 0 / Yachad | 2.86 / 1 / YB, Ra'am-Balad, New Right, Zehut | 1.00 / 3 / – | 0.89 / 1 / – | 2.00 / 0 / Ra'am | 1.85 / 1 / Ra'am, Hadash-Ta'al, Meretz |
| Average, all | 1.91 / 0.0 / Yachad | 2.69 / 0.6 / NR, Zehut | 1.36 / 0.1 / Otzma | 0.88 / 0.7 / – | 1.36 / 2.0 / – | 0.99 / 3.8 / Meretz; majority ✗ |
| Model + 1–3 | 1.82 / 1 / Yachad | 2.71 / 1 / NR, Zehut | 1.40 / 1 / Otzma | 0.89 / 1 / – | 1.29 / 2 / – | 0.92 / 3 / Meretz |

**The published model scores worse per list than the plain averages (1.77 against 1.53) and makes more threshold
mistakes (9 against 5).** Its bloc errors look good in 2021 and 2022 for the wrong reason. It knocked Ra'am (2021) and
Ra'am plus Hadash-Ta'al (2022) out of the central allocation, and their 4 to 8 freed seats went partly to the
Netanyahu bloc, which happened to offset the polls' real miss on that bloc. The averages lose the 2022 majority call
(60.2 seats called "neither"; the result was 64).

## Calibration

- **Lists:** the result fell inside the 90% interval for 0.90 of lists on average (per election 0.82, 0.79, 1.00,
  1.00, 0.79, 1.00). This is calibrated. The list noise (listSd) is about right: ×0.75 drops coverage to 0.86 and
  ×1.5 raises it to 0.97.
- **Blocs:** 0.92 of the bloc totals fell inside the interval, and the Netanyahu bloc 6 of 6. But that interval was 13
  to 18 seats wide (2015 49–64, Apr 2019 55–73, Sep 2019 50–65, 2020 51–64, 2021 44–61, 2022 56–73) while the
  bloc's leave-future-out misses were at most 4 seats. The cause is structural: each list's noise is independent, so
  four to six Netanyahu-bloc lists, each with sd ≈ 1.4 seats, add about 3.4 seats of spread to the bloc on top of
  blocSd 3. The bloc sd is about 4.5 seats, not the 3 the memo describes.
- **Majority:** the most probable outcome happened 6 of 6 times, at an average stated probability of 0.81 (4.9 hits
  expected). The model is under-confident on the bloc.
- **Threshold, measured on the official results.** Feed each official result to forecast.mjs's seats-to-shares rule as
  if it were a perfect poll. Every list that won exactly 4 seats converts to **3.08%, below the threshold**, although
  those lists actually won 3.33% to 3.79%. The rule ignores that Bader-Ofer rounds against small lists. A poll's "4
  seats" therefore enters the model already failing. That is why lists every poll had passing get P(pass) under 50%:
  Ra'am and Hadash-Ta'al 2022 at 45%, Ra'am 2021 38%, Ra'am-Balad 2019 28%. All four passed. The same mechanism puts
  Reservists and Amcha at 45% and 43% in 2026.

## What the backtest supports

The grid has 45 configurations at 3,000 runs. "Better/worse" counts elections, and only changes that help in most
elections are listed. Six elections cannot validate the lean or the Filber rule; see "Not supported" below.

**1. Seats to shares with half a seat added (`seatsToShares: "plusHalf"`).** A passing list's share is (seats + ½)
divided by the sum of (seats + ½) over passing lists, times (1 − printed below-threshold share). This undoes Bader-Ofer's
rounding. On the official-results test above it moves 4-seat lists from 3.08% to 3.31–3.53%. Alone: list MAE
1.77 → 1.61 (better in 3 elections, worse in 2), mean bloc error 2.00 → 1.58, threshold misses 9 → 8 (7 at 10,000
runs), Brier P(pass) 0.068 → 0.064 (better in 4, worse in 2).

**2. The site's k/n rule inside the model (`aggregate: "kn"`).** A list that passes in at least half the polls that
report it is averaged over those polls only, so its share is not dragged down by sub-threshold readings such as a
printed "(2%)". Other lists are averaged over all polls, as now. This is the rule that gives the averages their
better threshold record. Together with 1: list MAE **1.51** (better in 4, worse in 1), threshold misses **9 → 5**,
Brier P(pass) **0.068 → 0.061** (better in 4, worse in 2), mean bloc error 2.00 → 1.75.

Across the 34 near-threshold cases (lists under 4.2% or with P(pass) under 99.5%), calls right go from 25 to 29 and
the Brier score from 0.160 to 0.136. In the 24 cases where either version gave between 5% and 95%:

| | Published P(pass) | 1+2 | Result |
|---|---|---|---|
| Yachad 2015 | 66 | 79 | 2.97% failed |
| Yisrael Beiteinu Apr 2019 | 33 | 69 | 4.01% passed |
| Ra'am–Balad Apr 2019 | 28 | 56 | 3.33% passed |
| New Right / Zehut Apr 2019 | 95 / 91 | 96 / 93 | 3.22% / 2.74% failed |
| Otzma Sep 2019 | 40 | 66 | 1.88% failed |
| Ra'am 2021 | 38 | 62 | 3.79% passed |
| Meretz / Blue & White 2021 | 57 / 55 | 68 / 66 | 4.58% / 6.63% passed |
| Ra'am / Hadash-Ta'al 2022 | 45 / 45 | 58 / 58 | 4.07% / 3.75% passed |
| Meretz 2022 | 70 | 79 | 3.16% failed |

The cost: the Netanyahu-bloc error rises from 1.00 to 1.50 (worse in 3 elections, better in 1). This is the artifact
described above being removed, not a new error. The remaining bloc error is the polls' own miss.

**3. List noise that leaves the bloc totals alone (`listNoise: "netNeutral"`).** After the list jitter, the Netanyahu
lists are rescaled to their pre-jitter total, and so are the other lists, so the bloc's spread is blocSd and nothing
else. Alone: Brier on the majority **0.076 → 0.045, better in all 6 elections**. Coverage stays at nominal (lists 0.90,
blocs 0.92, Netanyahu bloc 6/6), and list scores are unchanged. With 1 and 2: majority Brier 0.054 (better in 5 of 6),
lists 0.87, blocs 0.96.

This is a better route than lowering blocSd. Lowering blocSd to 2 or 1.5 also wins 6 of 6 on the majority Brier
(0.050, 0.037), but in six elections where every call was right the Brier score simply rewards sharpness, and the
2026 judgment to double the residual (10-seat pollster split) is outside anything the backtest contains. Recommendation
3 keeps blocSd at 3.1 and makes it mean what the memo says.

### What 1 to 3 do to the 2026 forecast (data/polls.json as of 23 Oct late, 50,000 runs)

This uses the working-copy data/polls.json, which includes another researcher's hand fix restoring Amcha 2.9% to the
Walla poll. Before that fix the published-rules row read P(Netanyahu ≥ 61) 6% and Amcha 43%.

| | Netanyahu bloc (90%) | Zionist opposition | Reservists (mid) | Arab | P(Netanyahu ≥ 61) | P(neither) | Reservists / Amcha / Ra'am pass |
|---|---|---|---|---|---|---|---|
| Published rules, today's polls | 52 (45–61) | 54 | 0 | 14 | 5% | 94% | 45 / 43 / 86 |
| + 1, 2 | 51 (45–60) | 51 | 4 | 14 | 5% | 94% | 60 / 44 / 90 |
| + 3 only | 52 (47–59) | 54 | 0 | 14 | 2% | 97% | 45 / 42 / 87 |
| + 1, 2, 3 | 51 (47–59) | 51 | 4 | 14 | 2% | 98% | 61 / 44 / 91 |

The main visible change is the Reservists' call: shown at 4 seats in most current polls, they go from "fails" to
"passes" (60–61%). Amcha's call does not change: it passes in fewer than half of the polls and its printed shares are
2.9% to 3.2%.

## Not supported, or not testable here

- **Lean rule.** The leave-future-out leans were 0.0 to 0.9 seats, so the lean barely moved any point. Zero lean,
  mean, last-election and half-lives of 1 and 4 differ from the published rule by at most one seat of Netanyahu-bloc
  error in at most two elections, with mixed Brier scores. The backtest cannot say whether +1.7 is right for 2026.
  It does show the misses growing: +2.1 in 2021 and +4.0 in 2022, after four elections within ±0.7.
- **Including Filber's firms.** Historically a small help: list MAE 1.77 → 1.74 (better in 1, worse in 0); on top of
  1 to 3, Brier P(pass) is better in 5 of 6 elections (0.0604 → 0.0591) but list MAE is worse in 1. Direct Polls was
  never more than about 3 seats from the field before 2026, so six elections say nothing about this year's 8- to
  12-seat gap.
- **listSd.** ×1.5 improves Brier P(pass) slightly (0.068 → 0.066, better in 3, worse in 3), over-covers (0.97) and
  makes the majority Brier worse in 6 of 6. Leave it.
- **consolidateSd 0, 1.5 or 3:** Brier differences of at most 0.002. The window (7, 14 or 21 days) and the 2% default
  for unprinted sub-threshold lists: no consistent effect.
- **Point = per-list median of the runs:** list MAE better in 4 elections and worse in 2 on the published rules
  (1.77 → 1.73), but no consistent gain on top of 1 and 2. **Median aggregate across polls:** better in 2, worse in 1;
  mean bloc error worse (2.33).
- **Fractional seats.** Part of the averages' remaining list-MAE edge comes from fractional seats (4.6 is never more
  than 0.6 off a 4- or 5-seat result). An integer `point` cannot have it. That is a property of the pre-registered
  rule, not a modelling error.

## A pattern for the threshold researcher (no change proposed; n = 4)

The five threshold misses left after fixes 1 and 2 are all lists the polls had passing that failed. Four were
right-wing satellites of the Netanyahu bloc: Yachad 2015, New Right and Zehut in April 2019, Otzma in Sep 2019. The
fifth is Meretz 2022. Arab lists near the threshold passed every time (Ra'am-Balad 2019, Ra'am 2021, Ra'am and
Hadash-Ta'al 2022). Amcha Yisrael is this year's right-wing satellite near the line.

## Honesty about six elections

The threshold fixes rest on a mechanism (Bader-Ofer rounding, measured on official results) and on 24 near-threshold
cases. They improve list error in 4 or 5 of 6 elections. That is the strongest evidence here. The noise
restructuring rests on calibration in six elections in which no bloc came within 3 seats of 61 on the wrong side, and
on 2026 being unlike them. Treat 3 as the structural correction it is, not as a licence to narrow blocSd. The lean
and the Filber question cannot be settled with this data.
