# The forecast: algorithm, calibration and the pre-registered prediction

Written 2026-10-23, four days before the vote. Every number below is reproduced by
`npm run forecast` (`scripts/forecast/forecast.mjs`) from `data/polls.json` and
`scripts/forecast/calibration.json`; the output is `data/forecast.json`. The script is seeded.

This is the prediction the site puts on the record to be scored against the official result on
October 27, beside the two averages. The choices are rules, each derived from the six elections
held under the 3.25% threshold. Where a choice is a judgment rather than a rule it is marked so.

## The algorithm in nine steps

1. **Polls.** The site's current polls: the latest from each whitelisted firm within 14 days of the
   newest poll. From these, the *field* is every firm except Shlomo Filber's two (Channel 14 /
   Next Data, i24NEWS / Direct Polls). Today: 7 field polls, 2 check polls.
2. **Seats to shares.** A poll's seats are the firm's own allocation of the vote among the lists it
   put over the threshold. A passing list's share is seats/120 of the vote that passed, i.e. scaled
   by (1 − the printed sub-threshold percentages); a list the firm put below keeps the percentage
   it printed (2% where it printed none). Approximation error about ±0.4 points per list.
3. **Average.** The √n-weighted mean share per list over the field, renormalised to 100%.
4. **The lean.** Add a common swing to the Netanyahu bloc equal to the field's historical miss on
   it. From `calibration.json` (final-week field mean against the result):

   | Election | Field | Direct Polls | Result | Field miss | DP miss |
   |---|---|---|---|---|---|
   | Mar 2015 | 56.4 | — | 57 | +0.6 | — |
   | Apr 2019 | 64.7 | — | 65 | +0.3 | — |
   | Sep 2019 | 55.6 | — | 55 | −0.6 | — |
   | Mar 2020 | 57.3 | 59 | 58 | +0.7 | −1 |
   | Mar 2021 | 50.3 | 53 | 52 | +1.7 | −1 |
   | Nov 2022 | 60.3 | 62 | 64 | +3.7 | +2 |

   Recency-weighted with a half-life of two elections the miss is **+1.7 seats**; the plain mean is
   +1.0 and the last three average +2.0. The residual spread after the lean is 1.5 seats.
5. **Why the Filber firms are checks, not inputs.** In 2020, 2021 and 2022 Direct Polls sat about
   two seats above the field and the result sat about two seats above the field. Their house lean
   is the signal the lean in step 4 already encodes, estimated from results rather than from the
   firm. Adding the firms as well would count the same information twice. This year the two firms
   sit 8 to 12 seats above the field, four times their historical lean; nothing in the record
   explains that, so the model neither follows it nor rules it out: it widens (step 6).
6. **Width.** The common swing's standard deviation is twice the historical residual, **3.1 seats**
   (floor 3). *Judgment:* the historical residual alone (1.5) assumes this year's error process is
   the historical one; a ten-seat pollster split, three times any past campaign's, says it may not be.
7. **List noise.** Each list is jittered independently with sd 1.08 points at an 8% share, scaling
   with √share: theMadad's 1.16-seat mean absolute error for polls in the last 14 days of 2022.
8. **Consolidation.** One draw per bloc, sd 1.5 seats, moved between the bloc's largest list and
   its partners: in 2015, April 2019 and 2020 Likud beat its polls by 3 to 9 seats while the bloc
   moved under 1. *Judgment* on the size.
9. **Count.** 3.25% threshold, Bader-Ofer with the six reported surplus agreements (three signed
   per press reports, two reported, one between fringe lists), 120 seats, 50,000 runs. The central
   seats are the allocation of the shifted mean shares (step 4), so they are whole and add to 120.

Threshold check on the rule set: lists shown at 4 or 5 seats by most final-week polls since 2015
passed 7 times in 12 (`calibration.json`). The model gives Reservists 46% and Amcha Yisrael 47%,
the two lists the field shows at 4; Ra'am, shown at 5 to 6, 90%.

## The prediction, version 1 (2026-10-23; superseded by version 2 below)

| | Central | Mean of runs | 90% of runs |
|---|---|---|---|
| Netanyahu bloc | 52 | 53.1 | 45 to 61 |
| Anti-Netanyahu Zionist bloc | 54 | 51.8 | 46 to 58 |
| Arab lists | 14 | 13.1 | 8 to 16 |
| Reservists (outside the blocs) | 0 | 2.0 | 0 to 5 |

Netanyahu bloc at 61 or more: **6%**. Anti-Netanyahu Zionist bloc at 61 or more: **1%**.
Neither: **93%**. Netanyahu bloc larger than the Zionist opposition: 54%. Largest list: Yashar
56%, Likud 44%.

Per list (central seats, 90% range, passes): Yashar 23 (18–27), Likud 21 (16–26), B'Yachad 14
(10–16), Democrats 9 (6–11), Joint List 9 (6–11), Otzma 8 (6–10), UTJ 8 (6–10), Yisrael Beiteinu 8
(6–10), Shas 8 (6–10), Religious Zionism–Zehut 7 (5–9), Ra'am 5 (0–7, passes 90%), Reservists 0
(0–5, passes 46%), Amcha Yisrael 0 (0–5, passes 47%).

The two threshold calls are coin flips called by a hair: the Reservists' central share lands just
under 3.25% once the lean moves a sliver of the non-Netanyahu vote, and Amcha's just under it before
any shift. The scoring rule treats both as "fails" because `passes` is under 50; the model's real
statement about each is "about even".

## Sensitivity: the two dials that matter

| Setting | Netanyahu bloc central | P(≥ 61) | Likud largest |
|---|---|---|---|
| **As published: field only, lean +1.7** | 52 | 6% | 44% |
| Field only, lean 0 | 49 | 2% | 32% |
| All nine polls, lean +1.7 | 57 | 21% | 82% |
| All nine polls, lean 0 | 55 | 10% | 72% |

Le Millénaire (accuracy-weighted polls, replayed 2019–2022 errors): 56.1 seats, 26%. Polymarket,
Oct 24: opposition bloc wins more seats 60%; Eisenkot next prime minister 50%, Netanyahu 29%
(a market on who governs, not on seats). The model's 6% is the low end of the field. It is the
number the rules produce, and it is on the record.

## Version 2 (2026-10-24): what the research round changed

Six research memos (`round1/A` backtest harness, `B` list bias, `C` threshold, `D` pollsters, `E` context,
`F` statistical review), each written without sight of the others, then judged on the backtest `A` built:
`scripts/forecast/backtest/` replays the model on the six elections since 2015 with the lean computed only
from earlier elections. `node scripts/forecast/backtest/v2.mjs` scores version 1, version 2 and each
component switched off. The model now lives in `scripts/forecast/model.mjs`; `forecast.mjs` is the daily run.

| Change | Found by | Backtest effect | Kept? |
|---|---|---|---|
| Seats back to shares by the D'Hondt midpoint, never below the threshold (seats/120 put every 4-seat list at 3.1–3.2%, under the line, so Ra'am and Hadash-Ta'al 2022 were called failing against all 22 polls) | A, C, F independently | Wrong calls 5 → 4, bloc error 1.58 → 1.33 on top of the priors | Yes |
| Priors by list class, vote-share points: Shas +0.8, Ra'am +0.6, Joint List +0.4, B'Yachad −0.8, Reservists −0.8, Amcha Yisrael −0.8 (classes whose sign held in both halves of 2013–2022; shrunk 20–40%) | B; direction confirmed by C and E | Per-list error 1.64 → 1.36, wrong calls 7 → 4 | Yes |
| The common lean net of Shas's own miss (B: "the lean is Shas") | B | Leave-future-out lean turns negative; Netanyahu-bloc error 1.83 → 3.33 | **No**; the gross lean stays |
| Per-list noise zero-sum inside each bloc; a turnout swing of the Arab lists' own (sd 1.7 seats) | F, C | Majority Brier 0.114 → 0.090; bloc error 1.42 → 1.33 | Yes |
| Central seats = each list's median run, reconciled to 120 among safe lists; the call from the raw pass rate | C, F | Per-list 1.39 → 1.36, Netanyahu-bloc 2.17 → 1.83 | Yes |
| Two outlets polled by one firm share its weight (Maariv and Walla: Lazar; Kan 11 and Israel Hayom: Kantar) | D | Netanyahu-bloc 2.17 → 1.83 | Yes |
| 7-day window; a 1.0-point noise floor for small lists; 1.5% of the vote reserved for unpolled lists; Blue and White (withdrawn Oct 19) dropped; a safe parse of "<1%" | D, C, F, E, F | Neutral on the six elections; adopted on the evidence in the memos | Yes |
| Include the Filber firms with a +2 correction | D (option c) | Under a seat either way | No |
| Accuracy weights, time decay, shorter half-life, directional consolidation, Yashar "new-party" prior | D, F, E, B | Not supported | No |

Backtest, six elections, leave-future-out (10,000 runs; `v2.mjs`):

| | Per-list error | Netanyahu-bloc error | Mean bloc error | Wrong threshold calls (of 71) | Modal outcome right | Majority Brier |
|---|---|---|---|---|---|---|
| Version 1 (the rules above) | 1.77 | 1.00 | 2.00 | 9 | 6/6 | 0.073 |
| Plain √n average (A's run) | 1.53 | 1.20 | 1.65 | 5 | 5/6 | — |
| **Version 2** | **1.36** | 1.83 | **1.33** | **4** | 6/6 | 0.090 |

Version 1 scored worse per list than the plain average. Its better Netanyahu-bloc figure came from the
flaw: knocking Ra'am and Hadash-Ta'al out in 2021–22 happened to help the bloc total. Version 2 gives
that up and gains everywhere else.

### The prediction, version 2 (2026-10-24, on the polls to Oct 22)

| | Central | Median of runs | 90% of runs |
|---|---|---|---|
| Netanyahu bloc | 54 | 53 | 47 to 59 |
| Anti-Netanyahu Zionist bloc | 51 | 51 | 46 to 55 |
| Arab lists | 15 | 15 | 11 to 19 |
| Reservists (outside the blocs) | 0 | 0 | 0 to 5 |

Netanyahu bloc at 61 or more: **3%**. Anti-Netanyahu Zionist bloc at 61 or more: **0%**. Neither:
**97%**. Netanyahu bloc larger than the Zionist opposition: 63%. Largest list: Yashar 55%, Likud 45%.

Per list (central, 90% range, passes): Yashar 22 (17–26), Likud 21 (16–25), B'Yachad 12 (9–15), Shas
10 (7–12), Democrats 9 (7–11), Joint List 9 (7–12), Otzma 8 (5–10), UTJ 8 (6–10), Yisrael Beiteinu 8
(6–10), Religious Zionism–Zehut 7 (5–9), Ra'am 6 (4–8, passes 96%), Reservists 0 (0–5, passes 23%),
Amcha Yisrael 0 (0–5, passes 19%).

The threshold calls are no longer coin flips: both first-time lists sit near 2.5% once the −0.8 prior
is in (every new or first-time-solo list polled at 2.4–4.6% since 2013 has failed, five of five; `B`,
`C`). The bloc central moved from 52 to 54 because Shas gains a seat (under-polled in six of seven
elections) and because the corrected shares take a seat each from Yashar and B'Yachad. The width did
not change by rule; the realised Netanyahu-bloc spread narrowed from 45–61 to 47–59 because the per-list
noise no longer adds a second, uncorrelated bloc movement on top of the swing (`F`).

Data fixes made in the same round, each sourced in the files: the five surplus agreements are official
(Central Elections Committee gazette, Oct 19; `data/results.json`), Walla's Amcha Yisrael 2.9% restored
to `data/polls.json`, Blue and White withdrawn Oct 19 (`calibration.json`).

## Version 3 (2026-10-24): what the second research round changed

Ten memos (`round2/`: `D1` full-campaign poll data 2013–2022, `D2` sector turnout tables, `A` house effects, `B`
sector turnout, `C` threshold swing, `D` blackout, `E` state-space rebuild, `F` ensembles, `G` uncertainty, `H`
2026 context) and a red-team review (`R`), under the brief `round2/BRIEF.md`: the yardstick is per-list seat error
leave-future-out, a change ships only if the backtest improves or with a documented override, a full rebuild was
allowed, and the model was designed on the polls through October 22 (the October 23 polls were not used; they were,
however, quoted in `round1/E-context.md`, which the design agents were told to skim, so they count as "not used in
fitting", not "unseen"). `scripts/forecast/backtest/v3.mjs` scores version 3 against version 2 over several seeds;
`model.mjs` reproduces version 2 under `opts.v2`.

Most of the round is negative, and the negatives are the result:

| Direction | Memo | Finding | Shipped? |
|---|---|---|---|
| Pollster house effects, estimated per firm 2013–2022 and subtracted before pooling | A | The lasting firm component is 0.25–0.45 points against 1.1 of election-to-election drift; no variant beats version 2 (in-sample bound 1.361 = version 2). | No |
| Trend extrapolation; widening for the four-day publication blackout | D | The final-poll error is a level bias present two weeks out (r 0.92 with the gap 14 days earlier); the 7-day trend raises list error 1.36 → 1.61; version 2's widths were fitted on final polls against results and already span the blackout. | No |
| State-space poll aggregation with house effects and a trend | E | 1.39 per list against 1.36; within 0.05 points of share of version 2 in every election. Pooling more polls cannot remove a bias every pollster shares. | No |
| Ensembles and stacking | F | Candidates' errors correlate 0.97–1.00 with version 2's; no ensemble beats the best single model out of sample. | No |
| Haredi turnout term | B, D2 | Haredi-city turnout moves at most 5% relative to general; Shas's +1.0-point miss does not track it (r −0.13): non-response, not turnout. UTJ misses by 0.0. | No |
| Strategic desertion, skewed or trend-based threshold swing | C | Desertion coefficient −0.68 ± 1.28 (wrong sign); trend neutral to worse; version 2's P(pass) is calibrated (26.8 expected passes, 28 observed). The only solid fact is the first-time-list shortfall, 8 of 9 negative, which version 2 already carries. | No |
| **Student-t bloc swing**, scale max(1.5, resid·√(1+1/n)), df max(3, n−1) | G | Version 2's N(0, 3.1) put all six past Netanyahu-bloc results between the 31st and 66th percentiles (p ≈ 0.003); the t swing leaves per-list error identical and improves majority Brier 0.090 → 0.054, list CRPS 2.165 → 2.137. | **Yes** (override: cannot move the yardstick by construction) |
| **Bloc central = median of the simulated bloc total** | G | Netanyahu-bloc error 1.94 → 1.33 under every seed; on the record the list sum fell short of the bloc by 1.3 seats on average, the median by 0.6. | **Yes** |
| **Arab-sector turnout term** on the Joint List, mean-reverting index, replacing its +0.4 prior and the Arab swing | B | In hindsight Arab turnout explains 90% of the Arab lists' miss; forecast from the record it halves the sector error (0.54 vs 1.14 points); per-list 1.36 → 1.32–1.31. Narrow, and the Ra'am exclusion was chosen after seeing it fail twice. | **Yes**, history-only centre (the 57%-turnout override memo B offered was not taken: memo H finds version 2 already at the consensus) |
| Fringe 1.8% (1.5%); unprinted-below fallback 2.5% (2%) | H, C | Neutral on the backtest; from the 2026 polls' own small-list shares and the historical median. | Yes (override) |
| Priors funded by the bloc's largest list (K1) | C | Passes the 28-day gate (1.307) but fails on the full-campaign build and leave-future-out magnitudes. | No |

Backtest, six elections, leave-future-out, 10,000 runs, mean of three seeds, Filber-firm polls dropped poll by poll
(`node scripts/forecast/backtest/v3.mjs 10000 3 data`; the version-2 harness dropped a whole outlet when one of its
polls was by a Filber firm, which cost Kan 11's own April 2019 poll; under that rule version 2 reads 1.361):

| | Per-list error | Netanyahu-bloc error | Mean bloc error | Wrong threshold calls (of 71) | Modal outcome right | Majority Brier | P(pass) Brier |
|---|---|---|---|---|---|---|---|
| Version 2 | 1.385 | 2.11 | 1.47 | 4 | 6/6 | 0.091 | 0.0455 |
| **Version 3** | **1.306** | **0.83** | **1.04** | **4** | 6/6 | **0.071** | **0.0442** |
| Version 3 without the sector term | 1.385 | 1.50 | 1.38 | 4 | 6/6 | 0.055 | 0.0456 |

**The honest size of the gain** (memo `R`): of 1.385 → 1.306, about three seats over six elections are a real cut
in Arab-list error (five with priors fitted only from earlier elections); the rest is seat rounding that reverses
under leave-future-out priors, and April 2019 alone is 60% of it. The per-list gain is 0.04–0.07 seat, inside the
noise of six elections. What version 3 changes for 2026 is the spread and the bloc headline, on calibration evidence
(majority Brier, CRPS), not a more accurate list forecast. It is described that way on the site.

### The prediction, version 3 (2026-10-24, on the polls to Oct 22)

Every list's central seats are version 2's: Yashar 22, Likud 21, B'Yachad 12, Shas 10, Democrats 9, Joint List 9,
Otzma 8, UTJ 8, Yisrael Beiteinu 8, Religious Zionism–Zehut 7, Ra'am 6 (passes 96%), Reservists 0 (23%), Amcha
Yisrael 0 (19%).

| | Central (scored) | Sum of list centrals | 90% of runs |
|---|---|---|---|
| Netanyahu bloc | **53** | 54 | 49 to 58 |
| Anti-Netanyahu Zionist bloc | 51 | 51 | 47 to 54 |
| Arab lists | 15 | 15 | 12 to 18 |
| Reservists (outside the blocs) | 0 | 0 | 0 to 5 |

Netanyahu bloc at 61 or more: **1%** (3% in version 2). Neither bloc: 99%. Netanyahu bloc larger than the Zionist
opposition: 69%. Largest list: Yashar 55%, Likud 45%. Version 2's figures on the same polls are written to
`data/forecast-v2.json` on every run and scored beside version 3 under version 2's own rule (bloc point = list sum).

**Red-team findings fixed before shipping** (`round2/R-red-team.md`): the tests and the polls job's gate were
updated for the bloc median; this record; version 2 rerun on the same polls; `backtest/v2.mjs` pinned to version 2's
rules; the Arab-swing, "over-shot" and "nine tenths" texts corrected; Ra'am given back its share of the Arab swing
(pass chance 98.8% → 96.0%, list error unchanged); the hero labels blocs with the scored central while its mosaic
draws the list centrals. Known and accepted: the polls table and the Coalition Builder count with the list centrals
(54), the hero and forecast page show the bloc central (53); the forecast page says so.

## The daily loop, and the final

Israeli law closes poll publication at the end of Friday, October 23, so the poll record is complete
after the job's imports of October 23 and 24; what changes from here is the algorithm, not the data.
Each day until Monday: rerun `npm run forecast` (the polls job also reruns it after every import), review
the change against `data/forecast-history.json`, and record any parameter change below with its reason.
**Monday, October 26, 9 PM Central** (`npm run forecast:final`): the run is marked final, the script locks,
and that file is the prediction scored on October 27. Exit polls and the count never touch it.

### Changelog

| Date | Change | Reason |
|---|---|---|
| 2026-10-23 | First run: the rules in this memo. Netanyahu bloc 52, P(61) 6%. | — |
| 2026-10-24 | Version 2 (section above): D'Hondt-midpoint shares, class priors, zero-sum noise, Arab turnout swing, median point, firm weights, 7-day window, fringe 1.5%, Blue and White dropped. Netanyahu bloc 54, P(61) 3%. | Round-one research, judged on the backtest: per-list error 1.77 → 1.36, wrong calls 9 → 4 on 2015–2022. |
| 2026-10-24 | Version 3 (section above): Student-t bloc swing (scale 1.7, df 5); bloc central = median of the simulated total, scored; Arab-turnout term on the Joint List in place of its prior and the Arab swing; fringe 1.8%; unprinted-below 2.5%. Netanyahu bloc 53 (lists 54), P(61) 1%. Version 2 rerun daily on the same polls (data/forecast-v2.json). | Round-two research and red team: Netanyahu-bloc error 2.11 → 0.83, majority Brier 0.091 → 0.071; per-list 1.385 → 1.306, of which about three seats are real and the rest rounding (honest size 0.04–0.07 seat, inside the noise). |

## Scoring, fixed before the result

On the official count (`data/results.json` pipeline), for the forecast and for both site averages:
1. Mean absolute seat error per list, over the 13 lists above (averages: their scaled figures).
2. Absolute error on each bloc's central, `blocs.*.point`: since version 3 (2026-10-24) the median of the bloc's simulated total, which need not sum to 120 across blocs; `blocs.*.listSum` is reported, not scored. Version 2 (`data/forecast-v2.json`) is scored by its own rule, the sum of its list points.
3. Threshold calls: a list is called passing at `passes` ≥ 50 (averages: by their k/n rule).
4. Whether the outcome given the highest probability (neither bloc at 61) occurred.
5. Every current poll's final figures scored the same way, for the pollster record.

## What would have to be true for this to be badly wrong

Channel 14 at 62 is right. That requires the field to miss the Netanyahu bloc by 10 to 12 seats,
three times its worst miss since 2015, or a late swing. The model gives 61 or more a 3% chance (6% in version 1); if
it happens, the lesson is that right-wing non-response grew after the war faster than six elections
of history could show, and the next model's lean should be estimated from 2026 alone.
