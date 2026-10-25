# C. The threshold: evidence, noise model, point rule, 2026 calls

Research memo, round 1, researcher C. Written Friday 2026-10-23, before the poll blackout (23:59 tonight)
and before the final lock (Monday 2026-10-26, 9 PM Central). Status: recommendation. Nothing in
`scripts/` or `data/` was changed; every number below comes from scratch copies of the model run against the
repo's `data/` (read-only).

## 0. Summary

1. **The model's seats-to-shares step is biased against 4-seat lists.** A pollster that prints 4 seats is
   saying the list's share is at least 3.25%. Under Bader-Ofer the expected share of a 4-seat list is about
   **3.5%** (90% range 3.27–3.84). `shares()` turns 4 seats into `4/120 × (1 − below)`, which is **3.1–3.2%:
   under the threshold**. The step costs 0.35 points at 4 seats and 0.20 at 5. Replayed on 2015–2022, it calls
   Hadash–Ta'al and Ra'am 2022 as failing at 48% each. Both lists were shown at 4 seats in all 22 final polls,
   and both passed. The current rule gets **18 of 27** threshold calls right; with the correction it gets 21.
2. **Lists near the threshold miss their polls by about 1.0 point (sd), not 0.7.** The model's sd at a 3.5%
   share is 0.71. Fitting a probit to the 27 cases gives an sd of 1.35. The misses are not heavy-tailed once
   the sd is right (kurtosis of the standardised misses: 3.1), so a wider Gaussian fits. What makes the
   outcomes look bimodal is that the miss has a predictable direction:
   - **First-time lists underperform their polls in every case: 8 of 8, mean −0.8 points.** The cases are
     Otzma LeYisrael and Am Shalem (2013), Yachad (2015), New Right, Zehut and Gesher (Apr 2019), Democratic
     Union (Sep 2019) and New Economic (2021).
   - **Arab-led lists outperform: 6 of 8, mean +0.3.**
   - **Established lists printed below the threshold by some pollsters usually get rescued: 7 of 9 passed,
     mean +0.4.** Examples are Meretz, Blue and White and Ra'am in 2021 and Yisrael Beiteinu in 2019.
   - **Lists the leading party of their own bloc targets as a "wasted vote" collapse.** New Right and Zehut in
     2019 were polled at 5–6 seats and failed. Otzma lost 1.5 points in Sep 2019.
3. **Three input defects push the near-threshold lists around:**
   - **Unprinted shares default to 2%.** A list a pollster puts below without printing a % gets 2%. The
     Channel 12 and Channel 13 finals of tonight print no %. Imported as they stand, they drop Amcha Yisrael
     from 44% to 14% and Reservists from 47% to about 30%, purely through that default.
   - **Walla's 2.9% for Amcha Yisrael is missing from `data/polls.json`.** Wikipedia has it.
   - **Blue and White is still in the model.** Gantz withdrew on Oct 19 and the ballot slips were removed.
   - **No vote is reserved for unmodelled lists.** Haredi Public, Noam and about 25 micro-lists hold roughly
     1.5% between them, so every modelled share is inflated by that much.
4. **Point rule.**
   - **The rule already in use is the right one for list seats.** Under per-list absolute error, the seat
     total that minimises the expected error for a near-threshold list is its median, and that median is 0
     exactly when P(pass) < 50%. That matches scoring rule 3.
   - **The bloc totals need a different rule.** Bloc points should be the median of each bloc's simulated
     total, not the sum of the list points. With the recommended model, the Zionist opposition is 54 summed
     against a median of 52. Using the medians lowers the expected bloc error by about 0.3 seats.
5. **2026: the calls stay the same, but the probabilities are far from even.**

   | List | My P(pass) | Model now | Call | Point |
   |---|---|---|---|---|
   | Amcha Yisrael / People of Israel (poi) | 25% | 47% | fail | 0 |
   | Reservists–Economic (res) | 33% | 46% | fail | 0 |
   | Ra'am (raam) | 90% | 90% | pass | 5–6 (6 under the recommended model) |
   | Blue and White (bw) | 0%, withdrawn | 0% | — | remove from the model |

   The bias correction alone, without the first-time-list shift, would push Reservists to 55–61% and flip its
   call to "pass, 4". That is the single largest seat risk in the current pipeline. The correction must ship
   with the shift, or not at all.

## 1. Evidence: every list polled near the threshold, 2013–2022

**Method.**
- **Polls.** For each election, every poll in the 14 days before the vote, from the English Wikipedia
  opinion-polling tables (wikitext, read 2026-10-23), excluding exit polls.
- **Results.** Vote shares from the results template on each election's Wikipedia page.
- **Model share.** The model's own `shares()` reconstruction, averaged over the polls (unweighted):
  - a passing list gets `seats/120 × (1 − sum of printed sub-threshold %)`;
  - a list shown below keeps its printed %;
  - a list shown below with no printed % gets 2%.
- **Corrected share.** The model share plus the Bader-Ofer small-list correction of section 3.1, applied in
  proportion to the share of polls that showed the list passing.
- **Thresholds.** 2013 had a 2% threshold (marked *; error there is against the model share, and the
  correction is not applied); every later election had 3.25%. 2013 is context only and is left out of every
  fit below.

| Election | List | Type | Polls (14 d) | Mean seats | Shown below | Printed % when below | Model share | Corrected share | Actual % | Error (actual − corrected) | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Jan 2013* | Kadima | old, shrinking | 19 | 2.3 | 0 | — | 1.89 | — | 2.09 | +0.20 | passed |
| Jan 2013* | Otzma LeYisrael | far-right, new | 14 | 2.1 | 0 | — | 1.79 | — | 1.76 | −0.03 | failed |
| Jan 2013* | Am Shalem | splinter, new | 7 | 1.7 | 0 | — | 1.43 | — | 1.20 | −0.23 | failed |
| Jan 2013* | Balad | Arab | 21 | 3.2 | 0 | — | 2.70 | — | 2.56 | −0.14 | passed |
| Jan 2013* | Hadash | Arab | 21 | 3.9 | 0 | — | 3.21 | — | 2.99 | −0.22 | passed |
| Jan 2013* | Ra'am–Ta'al | Arab | 21 | 3.5 | 0 | — | 2.94 | — | 3.65 | +0.71 | passed |
| Jan 2013* | Meretz | left | 20 | 5.2 | 0 | — | 4.38 | — | 4.55 | +0.17 | passed |
| Mar 2015 | Yachad–Otzma | far-right, new, splinter | 18 | 4.3 | 0 | — | 3.56 | 3.91 | 2.97 | −0.94 | **failed** |
| Mar 2015 | Meretz | left | 18 | 5.2 | 0 | — | 4.35 | 4.55 | 3.93 | −0.62 | passed |
| Mar 2015 | Yisrael Beiteinu | established | 18 | 5.4 | 0 | — | 4.49 | 4.69 | 5.10 | +0.41 | passed |
| Apr 2019 | Kulanu | established | 24 | 4.2 | 3 | 3.18, 2.9, 3.1 | 3.75 | 3.92 | 3.54 | −0.38 | passed |
| Apr 2019 | Ra'am–Balad | Arab | 22 | 3.2 | 5 | 2.0, 2.1, 2.0, 1.9, 1.6 | 2.99 | 3.26 | 3.33 | +0.07 | passed |
| Apr 2019 | Yisrael Beiteinu | established | 23 | 2.7 | 8 | 2.0, 2.4, 1.2, 2.2, 2.2, 2.3 | 2.95 | 3.18 | 4.01 | +0.83 | passed |
| Apr 2019 | Meretz | left | 24 | 5.4 | 0 | — | 4.36 | 4.56 | 3.63 | −0.93 | passed |
| Apr 2019 | URWP | far-right | 24 | 6.3 | 0 | — | 5.06 | 5.21 | 3.70 | −1.51 | passed |
| Apr 2019 | New Right | new, splinter | 24 | 6.0 | 0 | — | 4.79 | 4.94 | 3.22 | −1.72 | **failed** |
| Apr 2019 | Zehut | new | 24 | 5.4 | 0 | — | 4.35 | 4.55 | 2.74 | −1.81 | **failed** |
| Apr 2019 | Gesher | new, splinter | 22 | 0.4 | 20 | 2.8, 2.6, 2.2, 2.0, 2.9, 2.6 | 2.44 | 2.47 | 1.73 | −0.74 | failed |
| Sep 2019 | Otzma Yehudit | far-right, splinter | 16 | 2.8 | 5 | 3.1, 2.9, 2.76, 2.5, 2.5 | 3.15 | 3.39 | 1.88 | −1.51 | **failed** |
| Sep 2019 | Labor–Gesher | left | 17 | 5.1 | 0 | — | 4.23 | 4.43 | 4.80 | +0.37 | passed |
| Sep 2019 | Democratic Union | left, new | 17 | 5.6 | 0 | — | 4.61 | 4.76 | 4.34 | −0.42 | passed |
| Mar 2020 | Otzma Yehudit | far-right | 18 | 0.0 | 18 | 1.8, 1.5, 2.1, 2.0, 1.6, 0.96 | 1.73 | 1.73 | 0.42 | −1.31 | failed |
| Mar 2021 | Blue and White | shrinking | 15 | 3.9 | 2 | 3.9, 3.55 | 3.66 | 3.96 | 6.63 | +2.67 | passed |
| Mar 2021 | Meretz | left | 15 | 3.3 | 3 | 3.6, 2.8, 3.28 | 3.32 | 3.60 | 4.59 | +0.99 | passed |
| Mar 2021 | Ra'am | Arab, splinter | 15 | 2.9 | 4 | 1.7, 1.7, 3.5, 3.1 | 3.07 | 3.33 | 3.79 | +0.46 | passed |
| Mar 2021 | Religious Zionism | far-right | 15 | 4.2 | 2 | 3.4, 3.3 | 3.88 | 4.05 | 5.12 | +1.07 | passed |
| Mar 2021 | New Economic (Zelekha) | new | 14 | 0.0 | 14 | 2.1, 1.3, 1.3, 1.4, 1.4, 1.1 | 1.59 | 1.59 | 0.88 | −0.71 | failed |
| Nov 2022 | Meretz | left | 22 | 4.6 | 0 | — | 3.72 | 3.92 | 3.16 | −0.76 | **failed** |
| Nov 2022 | Labor | left | 22 | 5.0 | 0 | — | 3.98 | 4.18 | 3.69 | −0.49 | passed |
| Nov 2022 | Hadash–Ta'al | Arab | 22 | 4.0 | 0 | — | 3.21 | 3.56 | 3.75 | +0.19 | passed |
| Nov 2022 | Ra'am | Arab | 22 | 4.0 | 0 | — | 3.21 | 3.56 | 4.07 | +0.51 | passed |
| Nov 2022 | Balad | Arab, splinter | 22 | 0.0 | 22 | 2.75, 1.6, 2.1, 2.1, 2.2, 1.8 | 1.82 | 1.82 | 2.91 | +1.09 | failed |
| Nov 2022 | Jewish Home | splinter | 22 | 0.0 | 22 | 2.0, 1.5, 2.0, 1.9, 2.0, 2.1 | 1.82 | 1.82 | 1.19 | −0.63 | failed |
| Nov 2022 | Yisrael Beiteinu | established | 22 | 5.9 | 0 | — | 4.74 | 4.89 | 4.48 | −0.41 | passed |

Bold "failed" marks a list that the majority of final polls showed passing. There are five, and four of them
were first-time lists or far-right splinters attacked by Likud.

**Balad 2022 shows the 2% default at work.** Most pollsters printed it as 0 with no %, so the model reads it
at 1.82. It got 2.91.

### 1.1 P(pass | polled share): empirical against the model's Gaussian

The table covers the 27 cases under the 3.25% threshold, binned by corrected share.

| Corrected share | n | Passed | Empirical | Model now (sd 1.08·√(s/8)) | Gaussian sd 1.0 |
|---|---|---|---|---|---|
| < 2.6% | 5 | 0 | 0% | 2% | 10% |
| 2.6–3.5% | 4 | 3 | **75%** | 52% | 52% |
| 3.5–4.0% | 7 | 5 | 71% | 75% | 70% |
| 4.0–4.6% | 6 | 5 | **83%** | 92% | 87% |
| 4.6–5.3% | 5 | 4 | **80%** | 97% | 95% |

Fits of P(pass) = Φ((x − 3.25 + shift)/sd):

| Fit | Shift | sd | Log-likelihood |
|---|---|---|---|
| Model's own Gaussian, on its own (uncorrected) shares | — | — | −15.7 |
| sd held at 0.71 | −0.25 | 0.71 | −16.0 |
| sd held at 1.0 | −0.10 | 1.0 | −14.4 |
| Free maximum-likelihood fit, corrected shares | 0.0 | **1.35** | −14.1 |

**The curve is flatter than the model's.** Lists just under the line pass more often than the Gaussian says,
which is rescue. Lists at 4.5–5% fail more often than it says (1 in 5 rather than 1 in 30), which is collapse.

**There is no evidence of a fat tail beyond the wider sd.** The misses standardised by a 1.0-point sd have
kurtosis 3.1. Three of 27 exceed 2 sd: Blue and White 2021, Zehut and New Right. The misses cluster by
election and bloc:

| Election and bloc | Cases | Mean miss |
|---|---|---|
| Right-wing small lists, Apr 2019 | Kulanu, URWP, New Right, Zehut | −1.4 |
| Anti-Netanyahu small lists, 2021 | Blue and White, Meretz, Labor | +1.8 |
| Opposition small lists, 2022 | Meretz, Labor | −0.6 |
| Arab lists, 2022 | 3 lists | +0.6 |

Within such groups the sd is about 0.6, and between groups about 0.8. Half the small-list error is shared by
the small lists of a bloc.

**Backtest of the three probability models on the 27 cases:**

| Model | Brier | Log loss | Calls right |
|---|---|---|---|
| Model now (uncorrected share, sd 0.66–0.86) | 0.193 | 0.583 | 18/27 |
| Seat-to-share correction only | 0.174 | 0.563 | 21/27 |
| Correction, sd floor 1.0 | 0.171 | 0.538 | 21/27 |
| Correction, sd 1.0, type shifts (new −0.5, Arab +0.3) | **0.137** | **0.426** | 21/27 |

The shifts were estimated on the same cases, at half the historical size, so the last row is optimistic.

### 1.2 Direction, and list type

These are corrected-share misses, 2015–2022.

| Group | n | Mean miss (points) | Note |
|---|---|---|---|
| First-time lists | 6 (8 counting 2013) | **−1.06** | All negative. Sign test p ≈ 0.004 with 2013. |
| Far-right lists | 5 | −0.84 | Heavily overlaps "Likud targets the list as a wasted vote". |
| Arab-led lists | 5 (8 counting 2013) | **+0.46** | 6 of 8 positive. Late turnout mobilisation, and Arab-sector polls under-sample. |
| Left lists | 7 | −0.27 | Meretz 2022 failed; Meretz 2021 was rescued. |
| Established non-Arab lists | 16 | −0.14 | — |
| Shown below by some pollsters, mixed | 9 | **+0.38**, 7 passed | Rescue: Meretz, Blue and White, Ra'am 2021, Yisrael Beiteinu 2019. |
| Shown passing by every pollster | 14 | **−0.58**, 10 passed | Desertion: New Right, Zehut, Yachad, Meretz 2022. |
| Shown below by every pollster | 4 | −0.39, 0 passed | — |

Two points from this table:

- **The model has no systematic overall bias near the threshold.** Its uncorrected shares miss by −0.05 on
  average. What it lacks is the type pattern.
- **The rescue effect belongs to established parties.** It applies to lists with a loyal base and a bloc
  partner that needs them alive. No first-time list in the record was rescued after being printed below.
  Gesher, New Economic and Otzma 2019 all fell further.

## 2. Mechanisms

**Strategic desertion: the big party's "gevalt" campaign.**
- In April 2019 Likud polled 26–31 seats and got 35. New Right (polled about 6) and Zehut (5–6) both failed.
  The right lost about six seats' worth of votes below the line, and Camil Fuchs put the bloc at 68.5 seats
  had both passed ([JNS](https://www.jns.org/record-may-be-set-for-wasted-votes-in-israels-election/)).
- In 2022 Meretz fell under the line at 3.16% while Yesh Atid rose. Almost 9% of the vote was wasted below
  the threshold, and Meretz's surplus deal with Labor went dead
  ([IDI, Kenig, 2022 results analysis](https://www.idi.org.il/articles/46229)).
- **2026 has the same pattern.** Netanyahu posted an image of Winter "burning votes" and shared a
  bereaved-families letter urging him to quit
  ([Arutz Sheva](https://www.israelnationalnews.com/news/434954);
  [ToI, Oct 21](https://www.timesofisrael.com/winter-says-may-have-erred-pledging-support-for-pm-smotrich-offers-him-minister-role-to-quit/)).
  Likud and Yashar both call Hendel's and Winter's lists wasted votes
  ([Jewish Insider, Oct 13](https://jewishinsider.com/2026/10/israeli-elections-yoaz-hendel-ofer-winter-threshold-polls/)).
- **Theory.** Coalition-targeted strategic voting in Israel is documented by Bargsted and Kedar (2009,
  *AJPS* 53(2), [doi:10.1111/j.1540-5907.2009.00372.x](https://doi.org/10.1111/j.1540-5907.2009.00372.x)).
  Voters who expect their party to be irrelevant to the coalition move to the least-disliked realistic
  partner.
- **Abroad.** The German evidence finds the same desertion from parties polled below a threshold
  ([Electoral Studies 2025, German federal election](https://www.sciencedirect.com/science/article/pii/S0261379426001009)).
  So does a cross-national study, which finds that polls understate parties just above the threshold and
  overstate those just below ([arXiv 1803.10852](https://arxiv.org/pdf/1803.10852)).

**Rescue: threshold-insurance votes.**
- In 2021 Blue and White, Labor and Meretz "beat gloomy forecasts" after frantic last-minute campaigns
  warning that a miss would hand Netanyahu a majority
  ([ToI, Mar 24 2021](https://www.timesofisrael.com/what-electoral-threshold-blue-and-white-labor-meretz-beat-gloomy-forecasts/)).
- Swedish survey evidence finds that about a quarter of small-party voters call threshold insurance an
  important reason for their vote
  ([Fredén, JEPOP 2014](https://www.tandfonline.com/doi/abs/10.1080/17457289.2013.872118)).
- **Who gets rescued.** Rescue needs a bloc that wants the list alive. Neither 2026 list near the line has
  one. Its own bloc's leader is attacking Amcha Yisrael. Reservists is a "free agent" that both blocs call a
  wasted vote.

**The publication blackout.**
- Polls not previously published cannot be published from Friday Oct 23, 23:59 until the polls close on
  Oct 27. The ban covers social media
  ([Israel Hayom, Oct 20](https://www.israelhayom.com/2026/10/20/israel-warns-of-illegal-election-polls-ahead-of-vote/);
  the Friday cutoff came from a Knesset amendment, [JPost](https://m.jpost.com/israel/knesset-sets-last-day-for-pre-election-polls)).
- The desertion campaigns peak in the unpolled four days.
- The misses in section 1 are measured from polls published before each blackout to the result, so the
  recommended noise already includes the blackout drift. No separate term is needed.

**What printing "below" does.**
- **On the input side.** Most pollsters print a below-threshold list as 0, sometimes with a %. The model
  turns an unprinted below into 2%. For a list shown passing elsewhere that figure is wrong: the expected
  share of a list just under the line is about 2.8% (section 3.1). The printed % is itself informative.
- **On the voter side.** Printing a list below triggers rescue for established lists and desertion for new
  ones.

**Surplus-vote agreements.**
- An agreement moves at most about one seat between two passing lists. Bader-Ofer treats the pair as one unit
  in the D'Hondt step, then splits the pair's seats by D'Hondt.
- It cannot rescue a list below 3.25%, and it is void if either partner fails. Meretz–Labor 2022 is the
  example.
- **2026.** Reservists asked Amcha Yisrael for an agreement, and neither list had signed one by the Oct 16
  deadline ([JNS](https://www.jns.org/feature/israels-political-parties-explained-the-reservists-and-the-new-economic-party)).
  Both are therefore 4-seat lists if they pass: seats given passing are 4 in 60–74% of runs and 5 in about
  25–30%.
- Ra'am's agreement with the Joint List is modelled. It is worth about +0.2 seats to the pair in expectation.

## 3. Recommended threshold noise model

All parameters are pre-registerable now, before the result.

**3.1 Seats back to shares.** In `shares()`:

| Situation | Rule |
|---|---|
| Passing list with s seats | (s/120)(1 − B) + δ_s (1 − B)/0.95, with δ₄ = 0.35, δ₅ = 0.20, δ₆ = 0.15 points, 0 above 6 seats |
| B | The sum of the printed sub-threshold shares plus the "others" reserve |
| List shown below with no printed % | The pollster's last printed % for that list within the window. Otherwise 2.8% if any field pollster showed the list passing in the window, otherwise 2.0%. |
| Pollster omits a list | Treat as below, with the pollster's last printed %. If the poll is a Wikipedia import, re-read the row: Walla's poi 2.9% is in Wikipedia but missing from `data/polls.json`. |
| Withdrawn list | Drop it from `ids` and from the polls before averaging (`bw`) |
| Others | Reserve 1.5% of the vote for unmodelled lists: Haredi Public 0.3–1.2% in polls, Noam, and micro-lists |

**Where δ comes from.** δ is E[share | seats] minus the model's reconstruction, from 200,000 simulated
2026-like Bader-Ofer allocations with the small lists drawn uniformly from 2.5–6%:

| Seats | E[share] | 90% range |
|---|---|---|
| 4 | 3.54% | 3.27–3.84% |
| 5 | 4.17% | — |
| 6 | 4.94% | — |
| 0, given the list is near the line | 2.83% | 2.43–3.21% |

**3.2 Noise for lists under 6%.** For lists under 6%, replace the independent 1.08·√(v/8) jitter with two
draws:
- a **shared small-list factor per bloc**, N(0, 0.7 pt), added to each of the bloc's lists under 6% and taken
  from the bloc's largest list, so the bloc total is unchanged;
- an **idiosyncratic** N(0, 0.7 pt) per list.

Together they give about 1.0 point per list, matching the historical sd. Lists of 6% and over keep the current
formula, which is continuous at 6–7%. Keep it Gaussian: the standardised misses show no excess kurtosis.

**3.3 Pre-registered mean shifts.** These are half the historical means, applied to the base shares before
the lean and funded proportionally by all other lists:
- first-time list (`poi`, `res` in 2026): **−0.5 point**;
- Arab-led list (`raam`, `jl`): **+0.3 point**.

The Arab shift moves `jl` too. It is safe at about 6.6%, so the shift changes its seats, not its call.

**3.4 What the pieces do to 2026.** These are scratch runs with 20–30k simulations each. "Finals" adds
tonight's Channel 12, Channel 13 and Kan figures with an assumed printed % (poi 3.0–3.1, res 2.8–3.0); the
model as published plus the finals instead uses the 2% default.

| Variant | poi share | poi pass | res share | res pass | raam share | raam pass | Points poi/res/raam | Bloc point (Σ list points) net/opp/mid/arab | Bloc medians |
|---|---|---|---|---|---|---|---|---|---|
| Published (data/forecast.json) | 3.20 | 47% | 3.18 | 46% | 4.29 | 90% | 0/0/5 | 52/54/0/14 | — |
| Current code, current polls.json | 3.14 | 43% | 3.16 | 45% | 4.14 | 86% | 0/0/5 | 52/54/0/14 | 53/52/0/13 |
| Same, finals imported with the 2% default | 2.58 | 15% | 2.92 | 31% | 4.23 | 89% | 0/0/5 | — | — |
| Drop bw, Walla fix | 3.16 | 44% | 3.20 | 47% | 4.19 | 88% | 0/0/5 | 52/54/0/14 | 53/52/0/13 |
| + correction | 3.18 | 46% | **3.47** | **61%** | 4.34 | 91% | 0/**4**/5 | 51/51/4/14 | 52/52/4/14 |
| + others 1.5% | 3.14 | 43% | 3.41 | 59% | 4.28 | 90% | 0/4/5 | 51/51/4/14 | 52/52/4/14 |
| + small-list noise (3.2) | 3.14 | 45% | 3.41 | 59% | 4.28 | 85% | 0/4/5 | 51/51/4/14 | 53/52/4/13 |
| + type shifts (3.3): **recommended** | 2.62 | **27%** | 2.93 | **32%** | 4.57 | **91%** | 0/0/6 | 52/54/0/14 | **52/52/0/14** |
| Recommended + finals | 2.55 | 24% | 2.86 | 29% | 4.58 | 91% | 0/0/6 | 52/54/0/14 | 52/52/0/14 |

Under the recommended model:
- P(Netanyahu bloc ≥ 61) is 3.8%, against 4.8% without the shifts.
- Both poi and res pass in 7–8% of runs; both fail in 50–54%.

What each threshold outcome is worth to the blocs, in mean seats across runs:

| Outcome | Netanyahu bloc | Opposition | Other effect |
|---|---|---|---|
| poi passes | 54.6 (8.6% reach 61) | 50.8 | — |
| poi fails | 51.8 (2.3% reach 61) | 52.9 | — |
| res passes | 50.4 | 51.7 | Middle bloc 4.2 |
| res fails | 53.3 | 52.7 | Middle bloc 0 |
| raam passes | 52.2 | — | Arab lists 14.3 |
| raam fails | 55.8 (14.7% reach 61) | — | Arab lists 9.6 |

## 4. The point estimate under the scoring rule

**Per list.** Let p be P(pass) and S the seats given passing. Point k has expected absolute error
E|err(k)| = (1 − p)·k + p·E|S − k|. That is minimised at the median of the mixture: k = 0 when p < 0.5,
otherwise the (1 − 0.5/p) quantile of S. With S ≈ 4–5, the break-even is
p* = E[S] / (E[S] + 4 − E|S − 4|) ≈ 0.50, so **"point 0 if and only if passes < 50"** is optimal for list
error and consistent with scoring rule 3.

The arithmetic for 2026, with the recommended model's distributions of S:

| List | p | S given pass | E\|err\| at the candidate points | Best |
|---|---|---|---|---|
| poi | 0.25 | 4: 59%, 5: 31%, 6: 7%; E[S] = 4.5, E\|S−4\| = 0.49 | k=0: 0.25·4.5 = **1.13**; k=4: 0.75·4 + 0.25·0.49 = 3.12 | 0 |
| poi, model now | 0.47 | as above | k=0: 2.12; k=4: 2.35 | 0, barely |
| res | 0.30 | 4: 72%, 5: 24%; E[S] = 4.3, E\|S−4\| = 0.32 | k=0: **1.29**; k=4: 2.90 | 0 |
| raam | 0.90 | 4: 11%, 5: 29%, 6: 31%, 7: 20%, 8: 8% | k=5: 0.5 + 0.9·1.14 = 1.53; k=6: 0.6 + 0.9·0.93 = **1.44** | 6 |

**Ra'am's point: 5 or 6.** The median of the mixture is 6, because P(seats ≤ 5) = 0.10 + 0.9·0.40 = 0.46.
Without the Arab shift the median is 5. Treat 5 against 6 as a coin flip that the pre-registered rule decides.

**Summing to 120.** Proposed rule:
1. **Call** each list pass iff `passes ≥ 50`.
2. **Point.** Compute `allocate(central, force)`, where a forced-pass list under 3.25% is raised to 3.25%
   (it gets the minimum 4 seats) and a forced-fail list is excluded. This guarantees the point and the call
   never disagree. They agree today, but a 47% list sits one poll away from disagreeing.
3. **Near-threshold lists that pass** (50% ≤ p < 95%). Set the point to the mixture median.
4. **Reconcile to 120.** Absorb the difference by largest remainder against the simulated means, **among
   lists with passes ≥ 95% only**. My scratch version reconciled across all lists and cut a 59% Reservists to
   3 seats, a value it cannot take.
5. **Bloc points.** Publish the median of each bloc's simulated total as `blocs.*.point`, the scored figure,
   with the sum of list points beside it.

**Why step 5.** The bloc medians do not sum to 120 (52 + 52 + 0 + 14 = 118 today), so no single set of list
points can match them all. Each bloc's absolute error is minimised by its own median.

**Cost and gain.** In the recommended model's own simulation, expected bloc error summed over the four blocs
falls from 9.58 to 9.31 seats, and list MAE is unchanged. The scoring text in the algorithm memo already
scores `blocs.*.point`. Changing what that field means is a decision to record in the changelog before the
Monday lock, not after.

**Threshold-call score.** The expected number of correct calls is Σ max(p, 1 − p). For the three
near-threshold lists it is 0.75 + 0.67 + 0.90 ≈ 2.3 of 3, against 0.53 + 0.54 + 0.90 ≈ 2.0 of 3
implied by the published 47/46/90. The calls themselves are the same; what changes is that they are no longer stated as coin flips.

## 5. 2026, list by list

### Amcha Yisrael / People of Israel (poi), Ofer Winter. My P(pass): **25%**.

Polling:
- **Final field polls.** It is below in every final poll of the field firms: Zman Yisrael 3.0%, Maariv
  3.0%, Walla 2.9%, Channel 13 below on Oct 21 (3.2%) and in the final, Channel 12 below in the final, and
  Kan below in the final.
- **Earlier.** It had 4 seats in Channel 12's Oct 21 poll, Maariv's Oct 16 poll and Kan's Oct 11 poll.
- **Filber firms.** Below: 1.5–1.9% at Channel 14, 2.9–3.1% at i24NEWS.
- **Unlisted firm.** Channel 16 / Maagar Mochot shows 4 seats; it is not on the site's whitelist.
- **Sources for the finals.** [ToI final polls, Oct 23](https://www.timesofisrael.com/liveblog_entry/final-polls-before-election-show-both-blocs-short-of-majority-small-parties-out-of-knesset/);
  [Wikipedia 2026 polling](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election).

Campaign:
- **Netanyahu and Smotrich want it out.** Netanyahu publicly demanded withdrawal ("burning votes" image,
  bereaved-families letter). Smotrich offered Winter a defence-ministry role to quit, and a candidate on
  its slate, Davidi Ben-Zion, withdrew.
- **Winter refuses**, and now says his pledge to back only Netanyahu "may have been" a mistake
  ([ToI](https://www.timesofisrael.com/winter-says-may-have-erred-pledging-support-for-pm-smotrich-offers-him-minister-role-to-quit/);
  [JPost](https://www.jpost.com/israel-election-2026/article-912331);
  [i24NEWS](https://www.i24news.tv/en/news/israeli-elections/artc-ofer-winter-vows-to-stay-in-election-race-despite-netanyahu-s-calls-to-withdraw)).
- **Possible gain from Blue and White voters.** A coalition party's internal poll says 24% of Gantz's
  remaining voters lean Winter: about 0.25 seat, which is not enough on its own
  ([JPost, Oct 20](https://www.jpost.com/israel-election-2026/article-912331)).
- **Its base is not Haredi.** It is a right-wing, reservist and bereaved-family list with ties to Liberman
  (Ashley Perry, in Jewish Insider). It should be modelled as a Likud/RZ-adjacent new list.

Why 25%:
- **History.** It combines the three worst signs in the record: a first-time list (8 of 8 underperformed),
  printed below by nearly every firm, and attacked by its own bloc's leader. Otzma in Sep 2019, attacked by
  Likud and shown at 2.5–3.1% when below, got 1.88%.
- **Model.** The recommended model gives 24–27%.
- **Others.** Le Millénaire gives 34% (accuracy-weighted polls, error replay; [Oct 24](https://forecast.lemillenaire.org/en/israel/knesset/2026/)).

### Reservists–Economic (res), Yoaz Hendel with Yaron Zelekha. My P(pass): **33%**.

Polling:
- **Showing it passing.** Zman Yisrael 4 seats at 3.6% (ToI), Maariv 4, Walla 4, and Kan's final 4.
- **Showing it below.** The Channel 12 final and earlier polls (2.8%, 2.1%), the Channel 13 final (it had 4
  on Oct 19 and 21), and both Filber firms (1.9–2.6%).
- **Trend.** Four of six field firms show it passing, but the two biggest broadcasters moved it below in
  their finals.

Campaign:
- **Hendel's own claim** is an 80–90% chance of passing ([Ynet](https://www.ynetnews.com/article/bxukgqjzo)).
- **No patron in either bloc.** Both blocs call it a wasted vote. Lazar says its failure "shifts the balance
  toward the coalition" ([JPost, Oct 16](https://www.jpost.com/israel-election-2026/article-911923)).
- **Possible gain from Blue and White voters.** 9.4% of them lean to it, per the same internal poll.
- **Zelekha's record.** His New Economic Party polled about 1.5% in 2021 and got 0.88%.

Why 33%:
- **History.** No first-time list near the line has been rescued (section 1.2).
- **Against that,** four field firms still show 4 seats, which is why it sits above poi.
- **Model.** The recommended model gives 29–32%.
- **Others.** Le Millénaire gives 28%.

**Do not let the bias correction alone through.** With the correction but without the first-time-list shift,
this list goes to 55–61% and a "pass, 4 seats" call.

### Ra'am (raam), Mansour Abbas. My P(pass): **90%**.

Polling:
- 5–6 seats in every current poll, including Channel 14 and i24NEWS: Channel 13 6, Walla 6, Channel 12 5,
  Maariv 5, Zman Yisrael 5, Kan 5.

Turnout and campaign:
- **Projected Arab turnout is up.** Stat-Net projects 63% against 56% in 2022
  ([US News/Reuters, Oct 19](https://www.usnews.com/news/world/articles/2026-10-19/arab-voter-turnout-could-make-or-break-netanyahu-in-israeli-election)).
- **Abbas is campaigning on turnout** ([JPost](https://www.jpost.com/israel-election-2026/article-912145)),
  and has a Jewish No. 2, Yoav Segalovitz.
- **Surplus agreement** with the Joint List, signed Sep 11.

History:
- Arab lists beat their polls 6 times in 8.
- Ra'am passed in 2019 (polled 3.2 seats with 5 polls below), 2021 (2.9, with 4 below) and 2022 (4.0).
- **Risk.** The 2021 exit polls had it failing, and Arab-sector polling is the noisiest in the field.

Model:
- The recommended model gives 91%, and the current one 86–90%. Le Millénaire gives 80%.
- **Point:** 6 under the recommended model, 5 without the Arab shift.

### Blue and White (bw), Benny Gantz. **Withdrawn: P(pass) = 0.**

- Gantz announced on Oct 19 that he would not run
  ([ToI](https://www.timesofisrael.com/blue-and-whites-benny-gantz-pulls-out-of-race-sealing-precipitous-political-fall/);
  [Al Jazeera](https://www.aljazeera.com/news/2026/10/19/benny-gantz-drops-out-of-israels-election-race)).
- All slate members withdrew, and the Central Elections Committee ordered its ballot slips removed
  ([ToI liveblog, Oct 21](https://www.timesofisrael.com/liveblog_entry/blue-and-white-ballot-slips-to-be-removed-from-polling-stations-after-all-party-members-withdraw-from-election/)).
- **Remove bw from the model's lists.** Leaving it in takes about 1.1% off everyone else's share. That is
  worth about 0.035 points to each list at the threshold.
- **Scoring.** Score it as "fails, called fails", or drop it from the 13-list MAE. The scoring section should
  say which before the lock.

## 6. Changes, in order of value

1. **Unprinted-below default.**
   - **Change.** For a list shown passing elsewhere, an unprinted below means the pollster's last printed %,
     or else 2.8%, not 2%.
   - **Why now.** Tonight's Channel 12 and Channel 13 finals print no %. This changes P(pass) by 15–30
     points the moment the finals are imported.
2. **Inputs.**
   - **Change.** Drop `bw`. Restore Walla's poi 2.9%. Reserve 1.5% for others.
3. **Seat-to-share correction (δ) and first-time-list shift, together.**
   - **Change.** Apply the δ₄/δ₅/δ₆ correction of 3.1 and the −0.5 first-time-list shift of 3.3 in the same
     change.
   - **Why together.** Either one alone moves a call the wrong way: δ alone flips Reservists to a pass at
     about 60%, and the shift alone understates every 4-seat list.
4. **Small-list noise.**
   - **Change.** Shared per-bloc factor (0.7 pt) plus an idiosyncratic draw (0.7 pt) for lists under 6%.
   - **Effect.** It moves P(pass) for poi, res and raam by only 0–5 points, and does not change any call.
     The case for it is calibration: the published "passes" figures, and P(61), become honest.
5. **Point rule.**
   - **Change.** Call by `passes ≥ 50`. List points from `allocate(central, force)`. Reconcile only among safe
     lists. Bloc points = bloc medians, recorded in the changelog before the Monday 9 PM lock.
6. **Arab-list shift (+0.3).**
   - **Change.** Apply the +0.3-point shift of 3.3 to `raam` and `jl`.
   - **Effect.** It moves Ra'am from 5 seats to 6 and leaves its call unchanged. It is the change with the
     weakest evidence (n = 8): adopt it only if the team accepts pre-registered type shifts in general.

**Data note.** `data/forecast.json` (generated 21:44 UTC) predates the import of Maariv's Oct 22 poll. On the
current `data/polls.json` the unchanged code gives poi 43% and res 45%.

## Sources

Polling and results, read 2026-10-23:
- [Opinion polling, 2013](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2013_Israeli_legislative_election)
- [Opinion polling, 2015](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2015_Israeli_legislative_election)
- [Opinion polling, April 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election)
- [Opinion polling, September 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election)
- [Opinion polling, 2020](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election)
- [Opinion polling, 2021](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election)
- [Opinion polling, 2022](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election)
- [Opinion polling, 2026](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election)
- The election pages for each year (results template), e.g.
  [2022 Israeli legislative election](https://en.wikipedia.org/wiki/2022_Israeli_legislative_election)

Historical analysis:
- [IDI, Ofer Kenig, "The 2022 Elections: Results Analysis"](https://www.idi.org.il/articles/46229)
- [JNS, wasted votes in April 2019](https://www.jns.org/record-may-be-set-for-wasted-votes-in-israels-election/)
- [ToI, "What electoral threshold?" (2021)](https://www.timesofisrael.com/what-electoral-threshold-blue-and-white-labor-meretz-beat-gloomy-forecasts/)

Academic work:
- Bargsted & Kedar 2009, [doi:10.1111/j.1540-5907.2009.00372.x](https://doi.org/10.1111/j.1540-5907.2009.00372.x)
- [Threshold insurance voting, Sweden 2010 (JEPOP)](https://www.tandfonline.com/doi/abs/10.1080/17457289.2013.872118)
- [Germany 2025, Electoral Studies](https://www.sciencedirect.com/science/article/pii/S0261379426001009)
- [arXiv 1803.10852](https://arxiv.org/pdf/1803.10852)

2026 reporting:
- [ToI, small parties at the threshold (Oct 14)](https://www.timesofisrael.com/small-parties-hovering-around-minimum-vote-threshold-could-determine-israels-election/)
- [ToI, final polls (Oct 23)](https://www.timesofisrael.com/liveblog_entry/final-polls-before-election-show-both-blocs-short-of-majority-small-parties-out-of-knesset/)
- [ToI, final Zman Yisrael poll](https://www.timesofisrael.com/liveblog_entry/final-toi-election-poll-shows-blocs-in-dead-heat-neither-has-majority-if-campaign-promises-kept/)
- [Jewish Insider (Oct 13)](https://jewishinsider.com/2026/10/israeli-elections-yoaz-hendel-ofer-winter-threshold-polls/)
- [JPost, Lazar (Oct 16)](https://www.jpost.com/israel-election-2026/article-911923)
- [JPost, Gantz voters (Oct 20)](https://www.jpost.com/israel-election-2026/article-912331)
- [Arutz Sheva, Netanyahu to Winter](https://www.israelnationalnews.com/news/434954)
- [ToI, Winter and Smotrich (Oct 21)](https://www.timesofisrael.com/winter-says-may-have-erred-pledging-support-for-pm-smotrich-offers-him-minister-role-to-quit/)
- [JNS, Reservists explained (Oct 19)](https://www.jns.org/feature/israels-political-parties-explained-the-reservists-and-the-new-economic-party)
- [Ynet, Hendel](https://www.ynetnews.com/article/bxukgqjzo)
- [ToI, Gantz withdraws](https://www.timesofisrael.com/blue-and-whites-benny-gantz-pulls-out-of-race-sealing-precipitous-political-fall/)
- [US News/Reuters, Arab turnout](https://www.usnews.com/news/world/articles/2026-10-19/arab-voter-turnout-could-make-or-break-netanyahu-in-israeli-election)
- [JPost, Abbas on turnout](https://www.jpost.com/israel-election-2026/article-912145)
- [Le Millénaire forecast (Oct 24)](https://forecast.lemillenaire.org/en/israel/knesset/2026/)
- [Israel Hayom, poll ban (Oct 20)](https://www.israelhayom.com/2026/10/20/israel-warns-of-illegal-election-polls-ahead-of-vote/)

Scratch reproduction, outside the repo, under
`/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/`:
- `C/js/model.mjs`: the variant model, flags `CORR NOBW WALLAPOI OTHERS NOISE=2 SHIFT FINAL23`.
- `C/js/seatshare.mjs`: the δ simulation.
- `py/cases.py` and `py/stats.py`: the historical table and the fits.
