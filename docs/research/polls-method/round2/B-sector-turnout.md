# B. Sector turnout: how much of the Arab and Haredi poll misses it explains, and a calibrated term for v3

Round 2, agent B. Written 2026-10-24. Scope: decision 6 of the brief (a sector turnout model for the Arab, Haredi
and general electorates), calibrated on the 2013–2022 poll-to-result gaps, scored leave-future-out against version
2, with its effect on the 2026 forecast from the 62 polls through Oct 22 (`data/polls.json` at 9796c34). No 2026 poll
published on or after Oct 23 was looked at. The qualitative 2026 context (Gur, the draft, the Joint List's
re-formation, the published turnout expectations) is agent H's (`round2/H-context.md` §2–3); I use only its
numbers. Status: a recommendation. Nothing outside `scripts/forecast/round2/B/` and this memo was changed.

Reproduce (each under 40 s):

```
node scripts/forecast/round2/B/fit.mjs          # §2-3: the decomposition and the sector-level leave-future-out test
node scripts/forecast/round2/B/bt.mjs 10000     # §5: the seat-level leave-future-out backtest, v2 and every variant
node scripts/forecast/round2/B/f2026.mjs 20000  # §6: the 2026 forecast under v2 and under the sector term
python3 -I scripts/forecast/round2/B/cec-sectors.py CACHE_DIR --fetch   # §1: turnout cross-check from the CEC files
```

## Summary

1. **Arab lists: turnout explains about 90% of the poll miss, in hindsight.** The polls behave as if anchored on
   the previous election's Arab turnout. Take the Arab lists' polled share, scale it by the actual change in Arab
   turnout relative to general turnout, and dilute everyone else. That accounts for the miss with R² 0.91 over
   2013–2022 (7 elections): gap = +0.46 + 0.83 × turnout effect, rmse 0.35 points against a raw gap sd of 1.16. The
   slope holds in both halves (0.71, 0.81). The rest is a positive constant, about +0.5 points (0.6 seat). That is the
   polls under-counting Arab votes at a given turnout, and in split years it sits on Ra'am. The constant is not
   stable (+0.09 in 2013–Apr 2019, +0.71 in Sep 2019–2022).
2. **Haredi lists: turnout explains almost nothing.** Turnout in Haredi cities (Bnei Brak, Modi'in Illit and five
   others) is the steadiest in the country: 76–83%, moving at most 5% relative to general turnout between
   elections. The mechanical effect averages 0.24 points, against a mean Shas+UTJ miss of +0.96. All of that miss
   is Shas (+0.97). UTJ, the purely Haredi list, is polled to −0.01 on average. **The Shas miss is a measurement
   problem (traditional Mizrahi voters), not Haredi turnout.** Keep the +0.8 Shas prior as a measurement term. Do
   not model a Haredi turnout term: it changed nothing or made things worse in the backtest (1.46 vs 1.43).
3. **The turnout part can be partly forecast, but only by a rule chosen after the fact.** The Arab list-vote index
   I = Arab turnout × the Arab vote's loyalty to Arab lists ÷ general turnout has a stationary saw-tooth around
   0.65 (1999–2022). Full mean reversion from the last election (k fitted leave-future-out, clamped at 1 every year)
   calls the direction of its change in 5 of 6 elections from 2015 on. Fed through the anchoring mechanics, it
   predicts the Arab sector's poll miss with a leave-future-out MAE of **0.54 points**. The alternatives score
   **1.14** (v2's fixed Arab priors), **1.24** (nothing) and **1.17** (an honest leave-future-out constant). The
   same rule on turnout alone (without loyalty) does no better than v2 (0.93 on the gap, 1.39 on lists). I chose I
   over turnout alone after seeing both, so treat the 0.54 as optimistic.
4. **At the seat level the gain is small and partly post hoc.** The naive version (B) scales all Arab lists in
   proportion. It **loses**: list error 1.43 against 1.36, 6 wrong threshold calls against 4, because it pushes Ra'am
   below the threshold in April 2019 and 2021, when Ra'am's own vote held while the rest of the sector fell. The
   version that puts the turnout term on the Arab lists other than Ra'am (B2) **wins narrowly**. Ra'am keeps its
   class prior. B2 scores list error **1.32 against 1.36**, mean bloc error **1.25 against 1.33**, the same 4 wrong
   calls, Arab-bloc error 0.83 against 1.17 seats, but **Brier 0.099 against 0.090** (all of it 2022). The
   per-election list error is better in three elections, worse in one and tied in two. That margin is inside the
   noise of six elections and one structural choice made after looking. **On the backtest alone it is a tie, and
   with more parameters it should lose a tie.**
5. **For 2026 it is version 2 re-expressed.** In 2022 the index was 0.648, at its long-run mean of 0.651. So the
   history-only rule predicts no turnout change (shift +0.005), and B2 gives exactly v2's seats: Joint List 9, Ra'am
   6, Arab bloc 15. The sector term only changes how the uncertainty is shaped. Ra'am's pass probability rises from
   96% to 98.6%. The Arab bloc's 90% interval narrows from 11–19 to 12–18.
6. **2026 centre.** The published pre-Oct-23 expectations put Arab turnout near 60% on IDI's scale, range 55–66% (H
   §3). H estimates that the field polls already price in about 56–57.5%. The history-only rule says 53–54%. I
   recommend centring 2026 Arab turnout at **57%**, with 70% of the change past the polls' anchor carried into the
   forecast (the pass-through the decomposition measured). That gives a sector shift of exp(0.045). Taking H's
   numbers directly (60% against the 57% the polls price in) gives the same shift, ln(60/57) = 0.05. Width: log-sd
   **0.14** on the sector, about ±1.6 seats. The effect against v2 is **+0.1 point on the Joint List**. It moves the
   marginal D'Hondt seat from **Shas (10→9) to the Joint List (9→10)**. Net bloc 54→53, Arab bloc 15→16, P(net ≥ 61)
   3%→2%. This is an override of the backtested rule and is argued in §6.
7. **Accounting (question 4).** A sector gain is a dilution of every other list in proportion to its share: the
   Netanyahu bloc, the Zionist opposition, the Reservists and Ra'am all lose. It is not taken from one camp. Each
   Joint List seat gained in 2026 costs the Netanyahu bloc about 0.5 seat and the Zionist opposition about 0.45. So
   higher Arab turnout lowers P(net ≥ 61) and P(opp ≥ 61) and raises P(opposition + Arab + mid ≥ 61). Had a Haredi
   term been kept, each Haredi seat would have added about 0.64 seat net to the Netanyahu bloc. v2's Arab swing
   offset its draw against the Zionist lists only. The sector term includes the Reservists and Ra'am.
8. **Recommendation.** Ship B2 as v3's Arab term, because decision 6 asks for a sector model and B2 is the one form
   that does not lose the backtest. It replaces the `jl` +0.4 prior and v2's Arab swing. Keep Ra'am's +0.6 and Shas's
   +0.8. Add no Haredi or general term. Centre: the documented 57% override (Summary 6). If the synthesis will not
   take an override, use the history-only centre: the 2026 seats then equal v2's. Either way the honest claim is
   about *structure*, not the number of seats. The polls miss Arab turnout swings, and the forecast should carry
   that as a correlated Joint List swing rather than as a fixed bonus.

## 1. Data

`scripts/forecast/round2/B/sectors.json` (series 1999–2022), with sources:

| | 1999 | 2003 | 2006 | 2009 | 2013 | 2015 | Apr 19 | Sep 19 | 2020 | 2021 | 2022 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| General turnout % (CEC via en.wikipedia) | 78.71 | 67.81 | 63.55 | 64.72 | 67.77 | 72.34 | 68.46 | 69.83 | 71.52 | 67.44 | 70.63 |
| Arab turnout % (IDI, Rudnitzky) | 75.0 | 62.0 | 56.3 | 53.4 | 56.5 | 63.5 | 49.2 | 59.2 | 64.8 | 44.6 | 53.2 |
| Arab vote to Arab lists (IDI) | .69 | .69 | .72 | .82 | .77 | .83 | .72 | .82 | .88 | .80 | .86 |
| Index I = turnout × loyalty ÷ general | .657 | .631 | .638 | .677 | .642 | .729 | .517 | .695 | .797 | .529 | .648 |
| Haredi-city turnout % (D2, CEC) | | | | | 81.61 | 82.71 | 79.70 | 80.12 | 79.72 | 76.36 | 79.15 |

- **Sources.**
  - Arab turnout: Wikimedia Commons `Data:Israeli-Arab_voter_turnout_in_Knesset_elections.tab`, citing
    https://en.idi.org.il/articles/46271; 2022 also https://en.idi.org.il/articles/47297.
  - Arab loyalty: https://en.wikipedia.org/wiki/Arab_citizens_of_Israel#Arab_Voting (IDI statistical report).
  - General turnout: each election's English Wikipedia infobox.
  - Haredi cities: `scripts/forecast/round2/data/turnout-cec.json` (agent D2).
- **Cross-checks.**
  - D2's CEC/CBS locality table reproduces IDI's Arab turnout within 0.1 point in every election 2013–2022.
  - My own pass over the CEC `expc.csv` files (`cec-sectors.py`) gives 49.1 / 60.1 / 65.8 / 44.5 / 53.8% for
    2019-04 to 2022 in Arab-majority localities, and Haredi-city turnout within 0.1 of D2's.
- **Gaps.** model.mjs's own field and seats-to-shares (lean, priors and withdrawals off), as in D2's `gaps.mjs`.
  2013 comes from round 1's table (8.85% polled against 9.20%).

## 2. Question 1: how much of each miss is turnout

**Arab lists** (`fit.mjs`, Q1). "Turnout effect" = the change in the Arab lists' share if their polled share is
scaled by the sector's turnout change relative to general turnout since the previous election, with everyone else
diluted.

| Election | Polled % | Result % | Gap | Arab turnout ÷ general, vs previous | Turnout effect | I vs previous | Effect via I |
|---|---|---|---|---|---|---|---|
| 2013 | 8.85 | 9.20 | +0.35 | 1.010 | +0.08 | 0.949 | −0.41 |
| 2015 | 10.32 | 10.61 | +0.29 | 1.053 | +0.49 | 1.135 | +1.23 |
| Apr 2019 | 8.82 | 7.82 | −1.00 | 0.819 | −1.48 | 0.710 | −2.39 |
| Sep 2019 | 9.05 | 10.60 | +1.55 | 1.180 | +1.46 | 1.343 | +2.74 |
| 2020 | 11.31 | 12.67 | +1.36 | 1.069 | +0.68 | 1.147 | +1.45 |
| 2021 | 9.96 | 8.61 | −1.35 | 0.730 | −2.49 | 0.664 | −3.12 |
| 2022 | 8.84 | 10.73 | +1.89 | 1.139 | +1.11 | 1.224 | +1.77 |

- **Turnout only.**
  - Fit: gap = +0.46 + 0.83 × effect, R² 0.91, rmse 0.35.
  - With the slope fixed at 1 (pure anchoring), the residual is +0.46 ± 0.42.
  - By half: slope 0.71 and 0.81, intercept 0.09 and 0.71.
- **Via I.**
  - Fit: slope 0.53, R² 0.89.
  - The polls catch about half of the loyalty swings, which are a vote-choice change their respondents report.
- **Decomposition.**
  - Of the Arab gap's mean square (1.25²), turnout accounts for about 90%.
  - The remaining "mis-measurement at a given turnout" is +0.46 points on average.
  - In split years that remainder is Ra'am's: +0.46 (Ra'am–Balad 2019), +0.70 (2021), +1.03 (2022). In those same
    years Ra'am's partners carried the whole swing: Hadash–Ta'al −0.91 (Apr 2019), Joint List −1.85 (2021),
    Hadash–Ta'al + Balad +1.76 (2022).
  - This is the fact B2 is built on. It is three cases, seen before B2 was written.

**Haredi lists.**

| Election | Shas+UTJ polled % | Gap | Shas gap | UTJ gap | Haredi-city turnout ÷ general, change | Turnout effect |
|---|---|---|---|---|---|---|
| 2015 | 11.69 | −0.96 | −0.45 | −0.51 | −5.1% | −0.52 |
| Apr 2019 | 9.61 | +2.16 | +1.63 | +0.53 | +1.8% | +0.16 |
| Sep 2019 | 12.05 | +1.45 | +1.64 | −0.19 | −1.5% | −0.15 |
| 2020 | 12.93 | +0.74 | +0.87 | −0.13 | −2.9% | −0.32 |
| 2021 | 12.23 | +0.57 | +0.61 | −0.04 | +1.6% | +0.17 |
| 2022 | 12.31 | +1.82 | +1.53 | +0.29 | −1.0% | −0.11 |

- The turnout effect is ±0.1–0.5 points. The sign agrees with the Shas+UTJ gap in 3 of 6 elections and with UTJ's
  in 4 of 6.
- The regression (slope 2.8, R² 0.46) rests on 2015 alone. Its intercept, +1.33, is the mis-measurement.
- Haredi turnout moves UTJ by a few tenths at most. It does not explain Shas, which is under-polled in 5 of 6
  elections, in three of which Haredi-city turnout fell relative to general turnout.

**General turnout** matters only through the ratios above. The threshold is a share of the vote (round 1 E §2.1),
so general turnout has no separate term.

## 3. Question 2: a non-zero mean, and is it forecastable?

**A mean.**
- The sector term's mean is not constant. It is the expected turnout change past the polls' anchor, plus a small
  under-count.
- Fitted leave-future-out and shrunk (two pseudo-elections at 0), the sector intercept is +0.25, −0.05, +0.24,
  0.00, −0.01, +0.21 points for 2015 → 2022.
- Adding it to B2 changed no seat point and worsened Brier (0.104). **No sector intercept.** Ra'am's under-count is
  already v2's +0.6 Ra'am prior, and Shas's is the +0.8.

**Forecasting the change** (`fit.mjs`, Q2).
- Rule: I_t = I_{t−1} + k(mean of I before t − I_{t−1}). k is fitted on earlier consecutive pairs and clamped to
  [0, 1]; the raw fit is 1.5, an overshooting saw-tooth.
- Errors in I, 2015–2022: rms 0.109 (log 0.171) against persistence's 0.173 (log 0.273). Direction right in 5 of 6;
  wrong in 2020, when turnout rose a second time.
- The same rule on turnout alone (no loyalty) has k ≈ 0 until 2020: Arab turnout drifted down from 1999 to 2009.
  It is no better than persistence (log rms 0.166 against 0.178).

**The Arab sector gap, predicted from information before each election** (points):

| Election | Gap | v2 classes | LFO constant | Turnout model (I, k = 1) |
|---|---|---|---|---|
| 2015 | +0.29 | +0.50 | +0.25 | +0.36 |
| Apr 2019 | −1.00 | +1.00 | −0.05 | −0.78 |
| Sep 2019 | +1.55 | +0.50 | +0.24 | +2.17 |
| 2020 | +1.36 | +0.50 | 0.00 | −0.68 |
| 2021 | −1.35 | +1.00 | −0.01 | −1.53 |
| 2022 | +1.89 | +1.50 | +0.21 | +2.04 |
| **MAE** | | **1.14** | **1.11** | **0.54** |

- **Better in both halves:** 2015–Sep 2019 MAE 0.30 against v2's 1.09; 2020–2022 0.79 against 1.20.
- **v2's classes are partly in-sample.** The +0.5 per Arab list in `backtest/v2.mjs` CLASSES was set from all seven
  elections (round 1 B). The honest leave-future-out version, the shrunk past-mean gap, scores 1.42 on lists
  against v2's 1.36 (§5).
- **Re-expressed or new?** For the backtest, new: the turnout model's sign varies by election, which a fixed prior
  cannot do. For 2026, re-expressed (§6).

## 4. Question 4: the accounting inside model.mjs's zero-sum structure

The sector term acts in two places in `model-b.mjs`. Everything else is v2's.

1. **Centre** (new step 4b, after the list priors and their renormalisation, before the lean).
   - Each carrier list: v_i ← v_i·e^{s} + α·v_i/S, where S is the carriers' total; α = 0 as recommended.
   - Then everything is renormalised to 1 − fringe.
   - For a carrier share S and x = e^{s}, the carriers move from S to S·x/(S·x + 1 − F − S)·(1 − F). Every other list
     is multiplied by the same factor. This is the anchoring mechanics of §2 exactly.
2. **Each run** (after the within-bloc zero-sum noise, replacing v2's Arab swing).
   - Draw g = e^{z} − 1 with z ~ N(0, sdLog).
   - Carriers: e_i += g·v_i.
   - Every non-carrier list j: e_j −= g·S·v_j/(1 − F − S).
   - The fringe is held fixed, as v2 holds it.
3. **Who pays.**
   - All non-carriers pay in proportion: the Netanyahu bloc (about 49% of the non-carrier vote in 2026), the Zionist
     opposition (about 45%), the Reservists and Ra'am.
   - v2's Arab swing took the offset from the Zionist lists only. The difference is about 0.1 seat per Arab seat, to
     the Reservists and Ra'am.
   - **The 61 line.** Seats sum to 120, so an Arab gain lowers the Netanyahu bloc and the Zionist opposition about
     equally. P(net ≥ 61) and P(opp ≥ 61) fall; P(opp + Arab + mid ≥ 61) rises.
4. **A Haredi term, if one were kept,** has the same form with Shas and UTJ as carriers. The Netanyahu bloc gains
   Δ minus the dilution of its other lists, about +0.64 seat per Haredi seat. I recommend none (§2).
5. **The lean** is unchanged. It is the Netanyahu bloc's historical miss, which already averages the Arab-turnout
   episodes. A turnout shift applied before the lean is not counted twice because the lean's records are field
   misses, not modelled ones.

## 5. Question 5: implementation and the leave-future-out backtest

- `scripts/forecast/round2/B/model-b.mjs` is model.mjs plus `opts.sectorTurnout`.
- It reads `cal.sectorTurnout.sectors = [{ name, bloc | lists, logShift, alphaPts, sdLog, replacesPriors }]`.
- With the option off it reproduces v2 exactly: every list and the majority figures are identical at 20,000 runs on
  2026, checked in this session.
- The diff against model.mjs is 4 hunks:

```js
// DEFAULTS
  sectorTurnout: false,
  sectorSdLog: null,        // override every sector's sdLog (sensitivity)
// step 4, replacing the priors block
  const sectors = (o.sectorTurnout ? cal.sectorTurnout?.sectors ?? [] : []).map((sc) => ({ ...sc, ids: ids.filter((id) => id in base && (sc.lists ? sc.lists.includes(id) : bloc[id] === sc.bloc)), sdLog: o.sectorSdLog ?? sc.sdLog ?? 0 })).filter((sc) => sc.ids.length);
  const priors = { ...(o.priors ? cal.listPriors ?? {} : {}) };
  for (const sc of sectors) if (sc.replacesPriors) for (const id of sc.ids) delete priors[id];
  for (const [id, pts] of Object.entries(priors)) if (typeof pts === "number" && id in base) base[id] = Math.max(0.002, base[id] + pts / 100);
  renorm(base);
  for (const sc of sectors) {
    const tot = sc.ids.reduce((a, id) => a + base[id], 0), x = Math.exp(sc.logShift ?? 0), al = (sc.alphaPts ?? 0) / 100;
    for (const id of sc.ids) base[id] = Math.max(0.002, base[id] * x + (al * base[id]) / tot);
    renorm(base);
  }
  const arabBySector = sectors.some((sc) => sc.replacesPriors && sc.ids.some((id) => bloc[id] === "arab"));
// step 6
  const arabSd = o.arabSwing && !arabBySector ? cal.arabSwing.sdSeats / KNESSET : 0;
// step 8, before v[id] = max(0, v[id] + e[id])
    for (const sc of sectors) if (sc.sdLog) {
      const g = Math.exp(randn() * sc.sdLog) - 1, inS = new Set(sc.ids), st = sc.ids.reduce((a, id) => a + v[id], 0), rest = ids.filter((id) => !inS.has(id)), rt = rest.reduce((a, id) => a + v[id], 0);
      for (const id of sc.ids) e[id] += g * v[id]; for (const id of rest) e[id] -= (g * st * v[id]) / rt;
    }
```

**Calibration per backtest election** (`common.mjs` `arabCalibration`). It uses only earlier elections:
- I_{t−1}, the mean of I before t, and k fitted on the earlier pairs.
- The sector shift s = ln(E[I_t]/I_{t−1}). B2 converts it to the carriers by x_c = 1 + (e^{s} − 1)·S_arab/S_carriers.
- Ra'am (`raam`, `raambalad`) keeps v2's class prior. sdLog is 0.12 on the sector, scaled the same way.
- Shifts used, 2015 → 2022: +0.011, −0.095, +0.215, −0.070, −0.182, +0.208.

**Backtest** (`node scripts/forecast/round2/B/bt.mjs 10000`). It uses the v2.mjs harness, CLASSES and scoring.

| Variant | Per-list error | Net-bloc error | Mean bloc error | Wrong calls | Modal right | Brier | Arab-bloc MAE | Per election (list error) | Arab-bloc error by election |
|---|---|---|---|---|---|---|---|---|---|
| **v2** | **1.36** | 1.83 | 1.33 | 4 | 6/6 | **0.090** | 1.17 | 1.64 2.86 0.80 0.67 1.29 0.92 | +1 +2 −1 −1 +2 0 |
| v2, Arab priors off | 1.49 | 1.83 | 1.50 | 5 | 6/6 | 0.064 | 1.33 | 1.64 2.71 1.00 0.67 1.71 1.23 | 0 +1 −2 −1 −2 −2 |
| v2, Arab prior = honest leave-future-out constant | 1.42 | 2.00 | 1.58 | 4 | 6/6 | 0.067 | 1.33 | 1.64 2.71 1.00 0.67 1.29 1.23 | 0 +1 −2 −1 +2 −2 |
| B: all Arab lists scaled | 1.43 | 1.50 | 1.42 | 6 | 6/6 | 0.091 | 1.67 | 1.64 3.00 0.60 0.89 1.71 0.77 | +1 −3 +1 −2 −3 0 |
| **B2: Ra'am excluded, sdLog 0.12** | **1.32** | 1.67 | **1.25** | **4** | 6/6 | 0.099 | **0.83** | 1.64 2.71 0.60 0.89 1.14 0.92 | 0 +1 +1 −2 0 +1 |
| B2, sdLog 0.08 / 0.16 | 1.32 | 1.67 | 1.25 | 4 | 6/6 | 0.099 / 0.104 | 0.83 | same | same |
| B2 + sector intercept | 1.32 | 1.67 | 1.25 | 4 | 6/6 | 0.104 | 1.00 | same | +1 +1 +1 −2 0 +1 |
| B2 on turnout alone (no loyalty) | 1.39 | 2.17 | 1.50 | 4 | 6/6 | 0.116 | 1.33 | 1.64 2.86 1.00 0.67 1.29 0.92 | 0 +2 −2 −1 +2 +1 |
| B2, k = 0.5 | 1.37 | 1.83 | 1.42 | 4 | 6/6 | 0.087 | 0.83 | 1.64 2.71 0.80 0.89 1.29 0.92 | 0 +1 −1 −2 +1 0 |
| B2, no shift (zero-mean draw only) | 1.39 | 2.00 | 1.50 | 4 | 6/6 | 0.076 | 1.33 | 1.64 2.86 1.00 0.67 1.29 0.92 | 0 +2 −2 −1 +2 −1 |
| B + Haredi term (zero mean, sdLog 0.03) | 1.46 | 1.67 | 1.50 | 6 | 6/6 | 0.095 | 1.67 | 1.64 3.00 0.60 0.89 1.71 0.92 | +1 −3 +1 −2 −3 0 |

**Reading the table.**
- **The gain is noise-sized.** B2's list error is better than v2's in Apr 2019, Sep 2019 and 2021, worse in 2020,
  and tied in 2015 and 2022.
- **Brier is worse, all from 2022.** B2 scores 0.39 against v2's 0.26 there: it correctly raised the Arab lists,
  which cost the Netanyahu bloc probability in the one election it reached 64.
- **Forking paths.** The best variant came from about eight tried: two indices, two allocations, k, intercept and
  width. Discount it accordingly.
- **Robust:** B (naive) loses, and the turnout-alone index loses. The direction "the Arab sector's miss follows its
  turnout swing past the anchor" holds at the sector level in both halves (§3).
- **Not robust:** that it lowers the per-list error.

## 6. Question 3: 2026 (only sources published before Oct 23; context in H §2–3)

**Anchor.**
- I in 2022 was 0.648, at the long-run mean of 0.651. The history-only rule therefore predicts no change.
- The 2026 configuration has the Joint List re-formed without Ra'am. That is 2021's configuration (I = 0.529), but
  the turnout surveys point the other way. Configuration is not fitted: six cases cannot carry another parameter.

**Expectations** (H §3). Consensus about 60% on IDI's scale, range 55–66%:
- Stat-Net: +7 points on its own scale, about 60% on IDI's.
- Konrad Adenauer Program: 53% as things stood, 67% with a full reunion.
- Scheindlin: 60%+.
- The lists' internal polls: above 60%.

**What the polls already carry.**
- The field puts the Arab lists at 11.42% (raw), against their 10.73% in 2022.
- H's proportional model reads this as the polls already pricing in about 56–57.5% turnout.
- The two routes to a centre agree:
  - 57% with the 0.7 pass-through gives a sector shift of 0.045.
  - 60% against the 57% already priced in gives 0.05.

**Haredi.**
- H quantifies Gur abstention at about 0.3–0.7 seat, on UTJ only, and recommends a −0.15 point UTJ shift as an
  override.
- Haredi-city turnout has moved at most 3.4 points between elections (2021, COVID). On the 2015–2022 record UTJ's
  miss ran with it in 4 of 6, at a few tenths of a point.
- Nothing here contradicts H's small UTJ shift. I add no Haredi term.

**Recommended 2026 values.** Joint List shift ln 0.072 (the sector's 0.045 carried by `jl`), sdLog 0.229 on `jl`
(0.14 on the sector). `jl` prior dropped; Ra'am +0.6 and Shas +0.8 kept. Held in `sectors.json` under
`model.y2026.recommended`.

**Effect on the 2026 forecast** (`f2026.mjs 20000`, polls through Oct 22, other settings v2):

| Variant | JL (share) | Ra'am (P pass) | Arab bloc [90%] | Net bloc [90%] | Opp | P(net ≥ 61) | P(opp+mid+Arab ≥ 61) | Lists that move |
|---|---|---|---|---|---|---|---|---|
| v2 | 9 (7.24%) | 6 (95.6%) | 15 [11–19] | 54 [47–60] | 51 | 3% | 95% | — |
| B2, history-only centre | 9 (6.92%) | 6 (98.6%) | 15 [12–18] | 54 [47–59] | 51 | 3% | 95% | none |
| **B2, 57% × 0.7 (recommended)** | **10 (7.35%)** | 6 (98.4%) | 16 [12–20] | 53 [47–59] | 51 | 2% | 96% | Shas 10→9, JL 9→10 |
| B2, 57% full pass-through | 10 (7.56%) | 6 (98.3%) | 16 [13–19] | 53 [47–59] | 51 | 2% | 96% | Shas 10→9, JL 9→10 |
| B2, 60% full pass-through | 11 (8.13%) | 6 (98.0%) | 17 [13–20] | 53 [46–59] | 50 | 2% | 97% | + Yashar 22→21 |
| B2, 63% full pass-through | 12 (8.70%) | 6 (97.6%) | 18 [14–21] | 52 [46–58] | 50 | 1% | 97% | + Likud 21→20 |

**Why override the history-only centre.**
- **For.** The rule that passed the backtest has nothing to say about 2026: the anchor sits at the mean. Every
  published pre-Oct-23 indicator points up.
- **Against.**
  - The surveys are untested: the one prior case, 2022, missed in the other direction, 40–49% projected against
    53.2% actual.
  - The field may already carry more of the rise than H's estimate.
- **Its size.** The override is small: +0.1 point on the Joint List against v2 and +0.4 against the history-only
  centre. It flips one marginal seat.
- **If the red team rejects it,** use the history-only centre, which gives v2's seats exactly. Nothing else in the
  recommendation depends on the choice.

## 7. What is likely noise

- **The seat-level gain** (1.32 against 1.36): noise.
- **The Ra'am exclusion:** three split elections, seen before it was written.
- **The k = 1 reversion:** a saw-tooth of 11 points that could be the shape of the list splits and unions
  (union years have I of 0.70–0.80; split or separate-list years 0.52–0.68), not a law.
- **The sector intercept,** and its rise in the second half.
- **Likely real:**
  - The Arab miss follows the turnout change past the previous election. R² about 0.9 with actual turnout, signs in
    6 of 7, slope stable across halves.
  - Haredi turnout is too steady to explain the Shas miss.

## Recommendation

1. **Arab sector term (B2).**
   - Implement in v3 the `sectorTurnout` code above (the 4 hunks in model-b.mjs).
   - Set `cal.sectorTurnout = { sectors: [{ name: "arab", lists: ["jl"], logShift: 0.072, alphaPts: 0, sdLog: 0.229, replacesPriors: true }] }`.
     This is the 57% override. For the history-only centre: logShift 0.008, sdLog 0.196.
   - Drop `listPriors.jl`. Keep `raam: 0.6` and `shas: 0.8`. v2's `arabSwing` is superseded for the carrier lists.
   - For the backtest, `arabCalibration()` in `common.mjs` derives each year's values leave-future-out.
2. **No Haredi or general turnout term.** Shas's under-count stays a measurement prior. Any UTJ Gur adjustment is
   H's override, not a turnout term.
3. **Backtest status.** It passes the yardstick narrowly (1.32 against 1.36, bloc 1.25 against 1.33, calls 4 = 4)
   and loses Brier (0.099 against 0.090). The margin is noise-sized. The case for shipping is decision 6 plus the
   sector-level evidence, not the yardstick margin.
4. **For the synthesis.** If v3 also takes A's house effects or E's state-space average, re-derive the 2026 anchor.
   The term assumes the poll average is anchored on 2022's sector composition. A house-effect correction that
   already lifts Arab-sector outlets would partly double-count it.

Files: `scripts/forecast/round2/B/{model-b.mjs, common.mjs, fit.mjs, bt.mjs, f2026.mjs, sectors.json, cec-sectors.py}`.
