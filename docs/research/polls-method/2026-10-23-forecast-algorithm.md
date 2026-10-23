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

## The prediction (2026-10-23)

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

## Scoring, fixed before the result

On the official count (`data/results.json` pipeline), for the forecast and for both site averages:
1. Mean absolute seat error per list, over the 13 lists above (averages: their scaled figures).
2. Absolute error on each bloc total.
3. Threshold calls: a list is called passing at `passes` ≥ 50 (averages: by their k/n rule).
4. Whether the outcome given the highest probability (neither bloc at 61) occurred.
5. Every current poll's final figures scored the same way, for the pollster record.

## What would have to be true for this to be badly wrong

Channel 14 at 62 is right. That requires the field to miss the Netanyahu bloc by 10 to 12 seats,
three times its worst miss since 2015, or a late swing. The model gives 61 or more a 6% chance; if
it happens, the lesson is that right-wing non-response grew after the war faster than six elections
of history could show, and the next model's lean should be estimated from 2026 alone.
