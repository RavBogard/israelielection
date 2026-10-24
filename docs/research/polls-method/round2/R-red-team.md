# R. Red team: leakage, overfitting and bugs in version 3

Round 2, agent R. Written 2026-10-24 (Saturday). Scope: version 3 as built on branch `forecast-v3`. That is
`scripts/forecast/model.mjs` and `scripts/forecast/calibration.json` (commit bff65ff), the harness
`scripts/forecast/backtest/v3.mjs`, and the site and runner changes in commit 30d55cb. That commit landed while this
review ran, and I reviewed it too. My job is to break version 3, not to advocate for it. I changed no committed
file. My scratch scripts are in `scripts/forecast/round2/R/` and are uncommitted:

- `attack.mjs`: variant groups, using v3.mjs's own `setup`, `score` and `summarise`.
- `model-r.mjs`: model.mjs plus one switch, `raamSwing`.
- `pollshares.mjs`, `filber.mjs`, `blocs.mjs`: small checks.

I fetched no 2026 poll and looked at none dated after Oct 22.

Reproduce:

```
node scripts/forecast/backtest/v3.mjs 10000 3 data           # baseline (also: 10000 5 data; 20000 3 data; 10000 3 data-full; --filber=outlet)
node scripts/forecast/backtest/v2.mjs 10000                  # finding 4
node scripts/forecast/round2/R/attack.mjs 10000 3 data --group=sector|perturb|classes|detail|detaillfo|raam
node scripts/forecast/round2/R/blocs.mjs                     # finding 6
node scripts/forecast/round2/R/pollshares.mjs                # finding 4
node scripts/forecast/round2/R/filber.mjs                    # finding 12
FC_V2=true node scripts/forecast/forecast.mjs                # finding 12 (no write)
```

All rows are means over seeds 20261027, 1 and 2 at 10,000 runs, Filber firms by poll, unless stated.

## Summary

1. **Version 3's per-list gain over version 2 (1.385 → 1.306) is real in direction but about half the size, and
   its size depends on in-sample choices that v2 shares.**
   - The term does what it claims on the Arab lists it carries. It cuts their seat error from 7 to 4 seats over six
     elections. With leave-future-out class priors in both models the cut is 9 to 4.
   - The rest of the margin, about 3.7 of the 6.7 seats, is D'Hondt knock-on: which list the freed seat lands on.
     That part reverses under leave-future-out class magnitudes, where the margin falls to **0.010** per list.
   - April 2019 supplies 60% of the gain, and 2020 and 2022 go the other way.
   - **For 2026, version 3's list points are identical to version 2's**, so the yardstick claim says nothing about the
     2026 seats.
2. **No leakage of the scored election into the Arab sector calibration.** `arabCalibration` uses only series rows
   before the election, and k is fitted on earlier pairs. One small contamination exists: B's `pollShares` now runs
   version 3's defaults, so 2026's Joint List shift (×e^0.008) is applied to the 2015–2021 polled shares, by
   +0.03–0.05 points (finding 4).
3. **The sector term's gain is the turnout shift, not the removal of the +0.5 Joint List prior.**
   - Dropping the prior alone scores 1.383–1.393.
   - The draw without the shift scores 1.375.
   - The shift alone scores 1.323.
   - Scaling all Arab lists, Ra'am included, loses: 1.440 and 6 wrong calls.
   - Putting the term on the Joint List only scores 1.345.
   - The Ra'am exclusion, chosen after seeing April 2019 and 2021, is worth about half the margin.
4. **Blocking:**
   - The test suite fails as soon as data/forecast.json is regenerated under version 3. That stops the polls job,
     which runs `npm test` before committing.
   - No changelog or pre-registration entry records that the scored bloc point changed.
   - Version 2's "scored beside it" figures will be on stale polls, because nothing reruns version 2 after the
     Oct 23 import.
5. **Should fix:**
   - `backtest/v2.mjs` no longer reproduces version 2. It runs version 3 and applies the 2026 Joint List term to past
     elections.
   - Four site texts are wrong under version 3. The Arab swing reads "0 seats". The list sum is said to have
     "over-shot" the Netanyahu bloc on the record; it under-shot it by 1.3 seats.
   - The site now shows two Netanyahu-bloc numbers: 53 on the hero and the forecast page, 54 in the polls table and
     the Coalition Builder. The hero mosaic draws Likud's 21 seats as 20 cells.
   - Ra'am has lost all turnout variance: P(pass) goes from 95.8% to 98.8%.
6. **Robust:**
   - The yardstick holds over 5 seeds (1.303), at 20,000 runs (1.306), on data-full (1.306) and under the outlet
     Filber rule (1.306).
   - It holds for every perturbation of the new parameters (1.281–1.33). The exceptions are logShift 0 (1.375) and
     swingDfMin 5 (1.325).
   - The bloc-median rule beats or ties the list sum in every election and every seed.
   - `opts.v2` reproduces the published version-2 forecast exactly.

## Findings

### 1. BLOCKING: the tests fail on a version-3 forecast.json, and the polls job runs them before it commits

I copied the repository to the scratchpad and ran `node scripts/forecast/forecast.mjs` in the copy, which writes a
version-3 data/forecast.json. Then `npx vitest run` gives **2 failed, 799 passed**:

- `lib/forecast.test.ts:11`: `expect(t[b]).toBe(forecast.blocs[b].point)` fails with *expected 54 to be 53*. The list
  points sum to 54 for the Netanyahu bloc; the bloc median is 53.
- `lib/forecast.test.ts:28`: `expect(forecast.parameters.version).toBe(2)` fails with *expected 3 to be 2*.

`.github/workflows/polls.yml` runs `npm run forecast` (line 70), then `npm test && npm run build` (line 74), before
`git add data/polls.json data/forecast.json ...` (line 81). The first polls job after version 3 is merged will
therefore fail, and it will commit neither the polls nor the forecast. On the current tree, which still holds the
version-2 forecast.json, `npx vitest run` passes (801) and `npx tsc --noEmit` exits 0.

Patch (`lib/forecast.test.ts`):

```ts
// line 11: the list points add to the 120-seat allocation; the bloc point is now the bloc median
for (const b of ["net", "opp", "mid", "arab"] as const) expect(t[b]).toBe(forecast.blocs[b].listSum ?? forecast.blocs[b].point);
if (forecast.parameters.blocPoint === "median") for (const [, b] of Object.entries(forecast.blocs)) expect(b.point).toBe(b.median);
// line 26/28: rename the test ("(version 3)") and
expect(forecast.parameters.version).toBe(3);
```

Regenerate data/forecast.json in the same commit as the test change, so main never holds one without the other.

### 2. BLOCKING: the change to the scored bloc point is not recorded anywhere a reader of the pre-registration will look

Version 2's published rule, still in `data/forecast.json:308`, is "bloc absolute error of blocs.*.point (the sum of
the bloc's list points; blocs.*.median is reported beside it, not scored)". Commit 30d55cb changes the runner's
string, the page text and the type. Changing the rule before the lock (Monday 9 PM Central) is legitimate. It is
legitimate only if the change is written down, with its date, before any result is known. Today:

- `data/forecast-changelog.json` has no version-3 entry.
- `docs/research/polls-method/2026-10-23-forecast-algorithm.md` §Changelog has no version-3 row.
- Its "Scoring, fixed before the result" item 2 still reads "Absolute error on each bloc total", without saying
  which total.

What must be written down, in both places:

1. The date, 2026-10-24.
2. That blocs.*.point is now the median of the simulated bloc total, while `listSum`, the sum of the list points, is
   reported and not scored.
3. That the bloc points need not add to 120. They can add to 119 or 121. Today they add to 119.
4. That version 2's figures, computed on the same final polls, are scored beside version 3 on every column. Version 2
   is scored with its own rule: bloc point = list sum.
5. The honest backtest size (finding 5), not the raw 1.385 → 1.306.
6. The overrides:
   - Decision 8 (blackout) is not implemented. D's baseline-4 form is zero by construction with the Oct 23 polls.
   - The fringe of 1.8% and the unprinted fallback of 2.5% are neutral on the backtest.
   - The t swing does not move the 2026 list points.

Proposed changelog entry (en):

> 2026-10-24. Version 3, after round 2 (docs/research/polls-method/round2).
> - The Netanyahu-bloc swing is a Student t (5 df, scale 1.7 seats) instead of a normal of 3.1 seats.
> - A bloc's central is the median of its simulated total, which is now the scored bloc figure. The sum of its
>   lists' centrals is shown beside it. The bloc centrals need not add to 120.
> - An Arab-turnout term on the Joint List replaces its +0.4 prior and the Arab swing.
> - Fringe 1.8%. Unprinted sub-threshold share 2.5%.
>
> Backtest, six elections:
> - Per-list error 1.385 → 1.306. About 3 seats of that are on the Arab lists; the rest is seat rounding, which
>   reverses with leave-future-out priors.
> - Netanyahu-bloc error 2.11 → 0.94. Majority Brier 0.091 → 0.071.
>
> The 2026 list centrals are unchanged. Netanyahu bloc 53 (lists 54), opposition 51, Arab lists 15; 61 or more in 1%
> of runs. Version 2's figures on the same polls are kept in data/forecast-v2.json and scored beside them.

### 3. BLOCKING: version 2 must be rerun on the final polls, or "scored beside it" compares models on different data

The brief says "version 2's figures stay on the record and are scored beside it, so the improvement is itself a
tested claim." `forecast.mjs` runs only the default model. `FC_V2=true` prints and writes nothing. The last
version-2 entry in data/forecast-history.json is therefore on polls through Oct 22. After the Oct 23 import,
version 3 would be scored on the final polls and version 2 on the polls of the day before. That confounds the model
change with the data change.

Patch (`scripts/forecast/forecast.mjs`, inside `if (!SENSITIVITY)`; add the file to `git add` in
`.github/workflows/polls.yml` line 81 and to the final-lock check):

```js
const v2 = forecast({ polls, config, parties, agreements, cal, opts: { v2: true } });
fs.writeFileSync("data/forecast-v2.json", JSON.stringify({ generated: out.generated, generatedAt: out.generatedAt, final: FINAL, method: "scripts/forecast/model.mjs opts.v2 (version 2's rules), scored beside version 3", inputs: v2.inputs, parameters: v2.parameters, blocs: v2.blocs, majority: v2.majority, lists: v2.lists, scoring: "As version 2 was pre-registered: bloc error of blocs.*.point = the sum of the list points." }, null, 2) + "\n");
```

### 4. SHOULD FIX: `backtest/v2.mjs` and the round-2 harnesses now run version 3, with the 2026 Joint List term applied to the past

Most harnesses import `../model.mjs` without `opts.v2` (`grep -l "model.mjs" scripts/forecast/round2/*/*.mjs`):
`backtest/v2.mjs`, `B/common.mjs`, `D/backtest-d.mjs`, `D2/gaps.mjs` and `E/backtest-e.mjs`. They now silently
score version 3's defaults. Their `cal` is calibration.json, so it carries the 2026 `sectorTurnout`:
`lists: ["jl"]`, logShift 0.008, sdLog 0.196, `replacesPriors`. That term therefore applies to 2015, Sep 2019, 2020
and 2021, whose Joint List is also `jl`, and deletes those elections' +0.5 class prior.

- `node scripts/forecast/backtest/v2.mjs 10000` prints the "v2" row as 1.36 per list, with per-election errors
  `1.45 2.86 1.00 0.67 1.29 0.92`, Netanyahu-bloc error 1.33 and Brier 0.056.
- The true version 2 with the same Filber rule (`v3.mjs --filber=outlet`) scores 1.361, with `1.64 2.86 0.80 0.67
  1.29 0.92`, 1.944 and 0.090.
- The 1.36 matches by coincidence: 2015 is −0.19 and Sep 2019 +0.20. The "v1" row moved too: 1.74 (the brief says
  1.77), Brier 0.048 (0.073).
- `node scripts/forecast/round2/G/check-repro.mjs` now reports "7 differ".

Every reproduction command in the round-1 and round-2 memos that uses these harnesses no longer reproduces its memo.

`B/common.mjs pollShares` feeds version 3's own backtest through the carrier ratio S_arab/S_carriers. The
contamination is small: `pollshares.mjs` shows `jl` +0.03 to +0.05 points in 2015–2021, and the other Arab lists
±0.01. It is still 2026's anchor reaching back into the past.

Patch:
- `backtest/v2.mjs` `run()`: `const c = { ...cal, elections: earlier, listPriors: CLASSES[e.key] ?? {}, withdrawn: { lists: [] }, sectorTurnout: { sectors: [] } };`
  and `opts: { runs: RUNS, v2: true, ...opts }`.
- `round2/B/common.mjs` `pollShares`: add `v2: true` to its opts.
- The other round-2 harnesses: add `v2: true` to their base opts. Or add one line to each memo saying its numbers
  reproduce on main at e715d9c (which still holds version 2), not on `forecast-v3` after bff65ff.

### 5. SHOULD FIX (documentation): the honest size of the gain, and where it comes from

**Decomposition** (`attack.mjs --group=detail`). Seed-averaged points; positive means version 3 is closer to the
result.

| Election | Version 3 vs version 2, seats | Arab carriers | Knock-on lists | List error v2 → v3 |
|---|---|---|---|---|
| 2015 | +1.3 | jl 14→13 (13): +1 | ya, kulanu +0.3 | 1.64 → 1.51 |
| Apr 2019 | **+4** | ht 8→6 (6): +2 | Likud 29→30, UTJ 6→7: +2 | 3.00 → 2.71 |
| Sep 2019 | +2 | jl 12→14 (13): 0 | Likud 34→33, YB 9→8: +2 | 0.80 → 0.60 |
| 2020 | −2 | jl 14→13 (15): −1 | B&W 33→34: −1 | 0.67 → 0.89 |
| 2021 | +2 | jl 8→6 (6): +2 | Yamina −1, Meretz +1 | 1.29 → 1.14 |
| 2022 | −0.7 | ht 5→6 (5): −1 | Likud, Meretz +0.3 | 0.92 → 0.97 |
| **Total** | **+6.7 seats** | **+3** | **+3.7** | **1.385 → 1.306** |

- April 2019 is 60% of the yardstick gain. Version 3 is better in four elections and worse in two.
- The knock-on column is which list receives a seat freed or taken by the Arab change. That is rounding, not signal.

**In-sample class priors that both models share** (`--group=classes`). CLASSES (v3.mjs:31) hand-maps the 2026 prior
classes onto past lists with outcomes known. Changing those choices moves version 3's margin over version 2 between
0.010 and 0.124:

| Prior variant | Version 2 | Version 3 | Margin |
|---|---|---|---|
| CLASSES as shipped | 1.385 | 1.306 | 0.079 |
| **Leave-future-out class magnitudes** (same membership; each class's mean miss in earlier elections, shrunk n0 = 3) | 1.474 (6 wrong) | 1.464 (6 wrong) | **0.010** |
| No priors | 1.642 | 1.518 | 0.124 |
| Yachad's −0.8 removed in 2015 (no earlier case to learn it from; C's point) | 1.385 | 1.326 | 0.059 |
| Democratic Union, Sep 2019 (a new list at 4.4%, not given the −0.8 CLASSES gives every other new list under 6%) | 1.385 | 1.339 | 0.046 |

- With the leave-future-out magnitudes, the Arab carriers still improve: Joint List and Hadash–Ta'al error goes from
  9 to 4 seats (`--group=detaillfo`). The knock-on lists lose 3.7 seats, mostly in 2021: Likud, Yesh Atid and
  Yisrael Beiteinu each a seat worse.
- **The robust part of version 3's yardstick gain is therefore about 3–5 seats of Arab-list error over six
  elections, 0.04–0.07 per list.** The remainder is noise of either sign.
- This is the standard memo C applied to K1: a gain that disappears under leave-future-out magnitudes is "neutral".
  On that standard the Arab term survives only at the carrier level.

**The t swing gets credit it did not earn.** `v3, normal swing` scores 1.325 against version 3's 1.306. The whole
difference is in 2015 and 2022.

- In 2015 the record is empty. Version 3's swing there is the floor and the df minimum, t₃ × 1.5. Version 2's is
  N(0, 3).
- `swingDfMin 5` gives 1.325, and `swingFloor 3.0` gives 1.316.
- So memo G's statement that "the per-list yardstick cannot see this change" does not hold inside version 3. The
  0.019 comes from a year with no data and must not be counted for the t swing.

**For 2026** (`FC_V2=true node scripts/forecast/forecast.mjs` against the version-3 run): every list point is the
same. Likud 21, Otzma 8, Shas 10, UTJ 8, RZ 7, Yashar 22, B'Yachad 12, Democrats 9, YB 8, Joint List 9, Ra'am 6;
Amcha and Reservists fail. What version 3 changes is:

- Netanyahu-bloc point 54 → 53 (the median).
- P(net ≥ 61) 3% → 1%.
- Bloc 90% interval 47–59 → 49–58.
- Ra'am P(pass) 95.8% → 98.8%.
- Joint List share 7.24% → 6.90%.

These rest on G's calibration evidence:

- Majority Brier 0.091 → 0.071 here.
- List CRPS 2.163 → 2.099.
- Netanyahu-bloc error 2.111 → 0.944.

They do not rest on the per-list yardstick. Patch: state this in the synthesis memo and the changelog (finding 2).
The calibration.json `sectorTurnout.about` should say "1.39 → 1.31 per list, of which about 3 seats on the Arab
lists", not "1.32 vs 1.36".

### 6. SHOULD FIX: site texts that are false under version 3 (both editions)

1. **`lib/i18n/forecast.ts` s8** still says "The Arab lists get a turnout swing of their own, ${arab} seats". Under
   version 3 `arabSwingSdSeats` is 0, so the page reads "a turnout swing of their own, 0 seats". Patch: when
   `p.sectorTurnout?.length`, drop that sentence, since s4b already describes the term. Do the same in
   `lib/i18n/he/forecast.ts`.
2. **centralNote** says "on the record the sum of the list centrals over-shot the Netanyahu bloc by a seat on
   average". **s11** says "the sum over-shot the Netanyahu bloc by 0.6 seats on average". Both are wrong in sign.
   `node scripts/forecast/round2/R/blocs.mjs` (5 seeds) gives:

   | | 2015 | Apr 2019 | Sep 2019 | 2020 | 2021 | 2022 | Mean signed |
   |---|---|---|---|---|---|---|---|
   | Result | 57 | 65 | 55 | 58 | 52 | 64 | |
   | Version 2 list sum | 55 | 62 | 57 | 57 | 51 | 60–61 | **−1.3** |
   | Version 3 list sum | 55 | 64 | 56 | 57 | 51 | 60 | **−1.3** |
   | Version 3 bloc median | 56 | 64–65 | 56 | 58 | 52 | 61 | −0.6 |

   - On the record the list sum **under-shot** the bloc. The median won because it sat a seat above the list sum in
     five of six elections.
   - **In 2026 the median sits a seat below the list sum** (53 against 54; the bloc mean is 53.2). The rule is still
     the right estimator: the median tracks the mean.
   - Patch the text to: "on the record the sum of the list centrals fell short of the Netanyahu bloc by 1.3 seats on
     average, the median by 0.6".
3. **meta2** says "the blocs can leave a seat unassigned". They can also add to 121: in April 2019 the version-3 bloc
   medians add to 121 under three of five seeds (`blocs.mjs`). Patch: "so the bloc centrals can add to 119 or 121".
4. **s4b** says the turnout index "explains about nine tenths of the Arab lists' final-poll miss since 2013". That R²
   of 0.91 uses the *actual* turnout, in hindsight. The forecastable rule's evidence is much weaker:
   - sector MAE 0.54 against 1.14, with the index chosen after seeing it (B Summary 3);
   - about 3 seats at the list level (finding 5).

   Patch: "in hindsight, with the actual turnout, explains about nine tenths ...; forecast from the record alone it
   explains less".

### 7. SHOULD FIX: two Netanyahu-bloc numbers on the site, and a hero mosaic that miscounts Likud

Under version 3:

- The forecast page and the home hero show the Netanyahu bloc at **53**. `HomePage.tsx` `forecastRaceModel` replaces
  each row's seats with `forecast.blocs[id].point`.
- `components/polls/PollsNow.tsx` and `components/CoalitionBuilder.tsx` count with `forecastPoll`, which is built from
  the list points. They show **54**.

`homeMosaicLayout` (`lib/home-race.ts:41`) allocates 53 cells to the bloc, then apportions the bloc's 54 list seats
into them. I ran it in the scratch copy on a version-3 forecast.json:

```
net bloc seats 53 cells 53 likud:21->20 otzma:8->8 rz:7->7 shas:10->10 utj:8->8
empty cells 1
```

When the bloc is expanded, Likud's 21 seats show as 20 cells, and one cell of the 120 is empty.

Patch, either of:

- (a) Keep the hero mosaic and the row numbers on the list points (54). Show the scored median in the forecast page's
  bloc table only, labelled "scored central (median of runs)".
- (b) Keep 53 as the row label. Draw the mosaic from the list points by adding a `labelSeats` field to the row and
  leaving `seats` as the list sum.

Either way, say on the forecast page that the Coalition Builder and the polls table use the list centrals.

### 8. SHOULD FIX (decide and document): Ra'am has lost all turnout variance

With the sector term on `jl` only, `arabBySector` is true, so `arabSd` = 0 (model.mjs:138). Ra'am:

- gets no Arab swing;
- is *diluted* by the Joint List's turnout draw (model.mjs:175–178, `rest` includes Ra'am);
- has its list noise zero-summed against the Joint List's inside the Arab bloc.

High-Arab-turnout runs therefore *lower* Ra'am. On the record Ra'am's vote moves with Arab turnout, though less than
the rest of the sector. The 2026 effect is P(pass) **95.8% → 98.8%**, on the one modelled list whose call is not
certain.

`model-r.mjs` adds `raamSwing`: the Arab lists outside the sector keep their share of version 2's Arab swing
(sd 1.7 × their share of the Arab vote). `attack.mjs --group=raam`:

| | Per-list | Netanyahu-bloc error | Mean bloc error | Wrong calls | Majority Brier | P(pass) Brier | List CRPS |
|---|---|---|---|---|---|---|---|
| Version 3 | 1.3059 | 0.944 | 1.069 | 4 | 0.0712 | 0.0434 | 2.099 |
| Version 3 + Ra'am swing | 1.3059 | 0.833 | 1.042 | 4 | 0.0712 | 0.0442 | 2.112 |

- The backtest cannot judge this. Ra'am passed in all three of its separate runs, so any narrowing of its
  distribution scores better in sample.
- For 2026 the patch gives Ra'am 96.0%, with nothing else moved (`model-r.mjs`, polls through Oct 22).
- Patch: model-r.mjs's two hunks:
  - `arabSd` stays on when `o.raamSwing`;
  - the swing applies to `members.arab` outside the sectors, scaled by their share.
- Or keep version 3 as it is and state in the memo that Ra'am's turnout risk is dropped on purpose.

### 9. NOTE: leakage audit of the Arab sector calibration (1a)

`arabCalibration(key)` (round2/B/common.mjs:49):

- Filters `S.series` to `r.key < key`.
- Fits k on consecutive pairs inside that subset. It clamps at 1 in every year.
- Takes `last` and `mean` from earlier elections only.
- `alphaPts` is computed but not used (B2).

The turnout, loyalty and general-turnout figures for an election enter only for later elections. The values for the
scored election and after never do. Those figures are post-election IDI and CEC numbers, legitimately known at the
next election.

The shifts used in the backtest are +0.011, −0.157 (ht, carrier-scaled), +0.215, −0.070, −0.281 and +0.323. Each is
derived from earlier rows (`attack.mjs --group=lfo`).

The forking paths are acknowledged but not leakage:

- the index I (turnout × loyalty / general), chosen over turnout alone after both were scored (turnout alone 1.39);
- k = 1 mean reversion;
- the Ra'am exclusion (finding 10).

The 2026 anchor reaches the past only through `pollShares` (finding 4).

The backtest's sector width (0.12, carrier-scaled) equals the shipped one: 0.196 = 0.12 × 11.42/6.99. B's memo text
for 2026, "width 0.14", describes the unshipped override. sdLog 0.10 to 0.30 leaves the per-list error at
1.281–1.306.

### 10. NOTE: dependence on the Ra'am exclusion (1c)

`attack.mjs --group=sector`:

| Variant | Per-list | Netanyahu-bloc error | Mean bloc error | Wrong calls | Majority Brier | Per election |
|---|---|---|---|---|---|---|
| Version 2 | 1.385 | 2.111 | 1.472 | 4 | 0.091 | 1.64 3.00 0.80 0.67 1.29 0.92 |
| **Version 3** (sector on non-Ra'am Arab lists) | **1.306** | 0.944 | 1.069 | 4 | 0.071 | 1.51 2.71 0.60 0.89 1.14 0.97 |
| Sector on all Arab lists | 1.440 | 1.000 | 1.208 | **6** | 0.058 | 1.51 3.00 0.60 0.89 1.71 0.92 |
| Sector on `jl` only (none in Apr 2019, 2022) | 1.345 | 1.000 | 1.167 | 4 | 0.054 | 1.51 3.00 0.60 0.89 1.14 0.92 |
| Sector logShift 0 (draw only; carriers' prior gone) | 1.375 | 1.167 | 1.444 | 4 | 0.037 | 1.51 2.86 1.00 0.67 1.24 0.97 |
| Sector sdLog 0 (shift only) | 1.323 | 1.000 | 1.125 | 4 | 0.066 | 1.51 2.71 0.60 0.89 1.14 1.08 |
| No sector; carriers' +0.5 dropped, Arab swing kept | 1.383 | 1.222 | 1.472 | 4 | 0.040 | 1.51 2.86 1.00 0.67 1.29 0.97 |
| Version 2, carriers' +0.5 dropped | 1.393 | 2.111 | 1.528 | 4 | 0.079 | 1.58 2.86 1.00 0.67 1.29 0.97 |
| Version 3, Ra'am's prior dropped too | 1.299 | 0.667 | 1.083 | 4 | 0.050 | 1.51 2.57 0.60 0.89 1.14 1.08 |

- The gain is the shift (item 3 of the Summary), not the removal of the prior.
- The exclusion matters a great deal. Scaling Ra'am with the sector loses outright, which is B's own finding.
- Ra'am's +0.5 class prior is not load-bearing for version 3 (1.299 without it). That is a reason to doubt keeping
  Ra'am's +0.6 for 2026 as a "measurement" term rather than to keep it.

### 11. NOTE: overfitting and fragility (2)

**Seeds, runs, data** (`v3.mjs`):

| Run | Version 2 | Version 3 |
|---|---|---|
| 10,000 runs, 3 seeds | 1.385 | 1.306 |
| 5 seeds | 1.385 | 1.303 |
| 20,000 runs | 1.385 | 1.306 |
| data-full | 1.385 | 1.306 |
| Outlet Filber rule | 1.361 | 1.306 |

data-full is not an independent check: the 7-day field is the same poll set, and only the `printedBy` fallbacks can
differ (CRPS 2.100 against 2.099).

**Perturbations** (`--group=perturb`):

| Variant | Per-list | Netanyahu-bloc error | Mean bloc error | Majority Brier | List CRPS |
|---|---|---|---|---|---|
| Version 3 | 1.306 | 0.944 | 1.069 | 0.071 | 2.099 |
| swingFloor 1.0 / 2.0 / 3.0 | 1.306 / 1.306 / 1.316 | 0.889 / 0.944 / 0.944 | | 0.060 / 0.086 / 0.120 | 2.075 / 2.130 / 2.210 |
| swingDfMin 5 / 30 | 1.325 / 1.314 | 0.889 / 0.944 | | 0.070 / 0.063 | 2.085 / 2.072 |
| Sector sdLog 0.10 / 0.30 | 1.306 / 1.281 | 0.944 / 1.000 | | 0.070 / 0.096 | 2.082 / 2.298 |
| Sector logShift 0 / × 0.5 | 1.375 / 1.330 | 1.167 / 1.167 | | 0.037 / 0.048 | 2.124 / 2.096 |
| Unprinted 2% / 3% | 1.306 / 1.306 | 0.944 | | 0.071 | 2.098 / 2.100 |
| Fringe 1.5% / 2.1% | 1.306 / 1.306 | 0.889 / 0.944 | | 0.072 / 0.070 | 2.095 / 2.103 |

- The yardstick depends on one thing, the strength of the Arab shift.
- The width parameters trade majority Brier against nothing on the yardstick. The narrowest swing (floor 1.0) scores
  best in sample. G was right not to take it.
- The unprinted fallback and the fringe are invisible to the backtest. Both are overrides, as their memos say.
- The fringe of 1.8% is a 2026 figure applied to 2015–2022 (history 0.4–1.5%). It is neutral, but strictly the
  backtest should use the historical fringe.

### 12. NOTE: bugs checked and found absent (3)

- **No double application.** With an Arab list in a `replacesPriors` sector, `arabSd` = 0 (model.mjs:138). The sector
  draw adds g·v to the carriers and subtracts g·S·v/R from every other list, so it sums to zero. The fringe is
  untouched: it is outside `ids`, and both renorms target 1 − fringe.
- **Version 2's Arab swing survives where it should.** It fires under `opts.v2` or `sectorTurnout: false`
  (`arabBySector` false).
- **`randt` with an empty or one-election record.**
  - With n = 0 (2015): df = max(3, −1) = 3, scale = max(1.5, 0) = 1.5.
  - With n = 1 (Apr 2019): `resid` is 0 by construction, so df is 3 and the scale 1.5 again.
  - No crash and no NaN. But the swing in the first two backtest elections is set entirely by `swingFloor` and
    `swingDfMin`. That is why 2015's list error moves with them (finding 5).
- **`opts.v2` reproduces the published version 2 exactly.** `cmp2026.mjs` (scratchpad) runs the same inputs with
  `{ v2: true }`. Lists, blocs, majority, `netLargerThanOpp` and `largestList` all equal data/forecast.json. Only new
  parameter keys differ: `unprintedBelowShare`, `sectorTurnout`, `swing*` and `blocPoint`, plus the listPriors
  `about` text.
- **`FC_V2=true` parses to `opts.v2 = true`.** `parameters.version` is 2, blocSd 3.1, fringe 1.5, unprinted 2.
  `V2` is spread before `opts`, so `{ v2: true, sectorTurnout: true }` works as intended.
- **The `shares()` fallback chain** is the printed % → the same outlet's last printed % in the window → the other
  field polls' median → UNPRINTED (2.5%). `printedBy` keys on `pollster`, so a relabelled Filber poll is never used
  as the outlet's own figure.
- **The Filber relabel works as intended** (`filber.mjs`).
  - In April 2019 the poll rule keeps Kan 11's own Kantar poll of Apr 4 in the field. Its Direct Polls poll falls
    outside the 7-day window.
  - The outlet rule drops Kan's own poll, which is D2's bug.
  - In 2020–2022 the relabelled poll is a check under both rules. It is never the outlet's latest field poll,
    because it carries a different `pollster` key.
- **`parameters.version`** is 3 when the swing is t, the bloc point is the median or a sector is active. A run with
  only the fringe or the unprinted share changed would be labelled 2. That is cosmetic.

### 13. NOTE: the Oct 23 polls (1d)

`round1/E-context.md` §1.1 quotes the Oct 22–23 finals: Netanyahu bloc 48–50, Arab lists 14 in four, 16 in one.
H's turnout signals cite E's "Maariv certain-to-vote 74% → 81% (Oct 23)", which is a figure from an Oct 23 poll. No
shipped parameter is numerically derived from those polls:

- the fringe of 1.8% uses Sep 7–Oct 22;
- the swing comes from the 2015–2022 record;
- the history-only Arab centre comes from the series to 2022.

But every version-3 change that moves the 2026 output moves it toward those finals:

- Netanyahu bloc 54 → 53.
- P(61) 3% → 1%.
- B's 57%-turnout override was not taken, which keeps the Arab lists at 15 rather than 16.

Each has a backtest reason that does not need the held-out polls. The synthesis agent was told to skim E, so the
Oct 23 set **cannot count as independent confirmation of those three choices**. Say so in the record. The list
points are unchanged from version 2, so the held-out set can still validate them.

### 14. NOTE: the swing scale understates G's own formula slightly

model.mjs:127 computes `resid` as a W-weighted mean square, with divisor W rather than its n − 1 analogue. Line 132
then uses df = n − 1 = 5 and √(1 + 1/n) with n = 6, ignoring the recency weights (effective n = W²/Σw² = 4.5).

- The textbook t predictive gives a scale of 1.82 (unbiased, n = 6) or 1.92 (n_eff = 4.5, df 3.5).
- The shipped scale is 1.66.
- 2026 effect: none. P(net ≥ 61) stays 1% and the interval goes 49–58 → 48–58 (`swingFloor` 1.82 and 1.92).

Optional patch:

```js
const nEff = W ? W * W / errs.reduce((s, e) => s + e.w * e.w, 0) : 0;
const sHat = nEff > 1 ? resid * Math.sqrt(nEff / (nEff - 1)) : 0;
const swingScale = Math.max(o.swingFloor, sHat * Math.sqrt(1 + 1 / Math.max(1, nEff)));
const swingDf = Math.max(o.swingDfMin, nEff - 1);
```

`randt` loops `k < df`, so a fractional df rounds up. Use `Math.ceil` explicitly if this is taken.

### 15. NOTE: smaller items

- **v3.mjs `table()` reports `perElection` from the first seed only** (line 87: strings take `v[0]`). The
  seed-averaged version-3 row is `1.51 2.71 0.60 0.89 1.14 0.97`, against the printed `1.45 ... 0.92`. The printed
  per-election figures do not add up to the printed mean. Patch: average the split numbers across seeds, as
  `attack.mjs` does.
- **`forecast.mjs` env parsing ignores upper-snake keys.** `FC_SWING_FLOOR=1` becomes the key `sWING_FLOOR`. The run
  is still flagged as a sensitivity run, so it prints the default model as if it were the variant. Patch:
  `const key = k.slice(3).toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());`. That maps FC_V2 to
  v2 and FC_SWING_FLOOR to swingFloor.
- **forecast-history.json mixes definitions.** Version-2 entries hold `blocs` = list sums; version-3 entries hold
  medians plus `blocListSums`. The page's history table shows `blocs.net` under one column. The version column is
  there, but add "version 3 rows: bloc medians" to the history `about` and the table caption.
- **`forecast.mjs` `method` names the version-2 document**
  (`docs/research/polls-method/2026-10-23-forecast-algorithm.md`). Add the round-2 synthesis memo.
- **Decision 8 (blackout widening) is not in version 3.** D's recommended baseline-4 term is zero by construction with
  Oct 23 polls (a 4-day gap), so the omission changes nothing. It must still be listed as an override (finding 2).
- **Constants that are in-sample for both models:**
  - `perListError.meanAbsSeats` 1.16 is theMadad 2022, used for 2015–2021;
  - `arabSwing.sdSeats` 1.7 comes from the 2020–22 misses (version 2 only);
  - `smallList.sdFloorPoints` 1.0 comes from 2015–2022;
  - CLASSES membership (finding 5).

  These are shared, so they do not favour version 3, but they inflate both rows.
- **Noam** (polled at 0%) gets 1-point floor noise and passes in 0.1% of runs. This predates version 3 and is
  harmless.

## Verdict

Version 3's gain over version 2 survives the attack in direction but not in its headline size.

**Robust:**
- The Arab turnout term cuts the Joint List / Hadash–Ta'al seat error by about 3 seats over six elections with the
  shipped priors, and by 5 with honest leave-future-out priors.
- It holds across seeds, run counts, the data-full set and every width perturbation.
- It is a turnout effect, not an artefact of dropping the +0.5 prior.

**Not robust:**
- The other half of the 1.385 → 1.306 margin is D'Hondt knock-on that reverses under leave-future-out class
  magnitudes. There the margin is 0.010.
- 60% of it is April 2019.
- 0.02 of it is a 2015 swing set by a floor with no data behind it.
- The Ra'am exclusion that makes the term work was chosen after seeing it fail.

**The honest size:** about 0.04–0.07 seat per list, inside the noise of six elections. It changes **no 2026 list
point**. Where version 3 does change 2026 is the uncertainty and the bloc headline:

- the t swing;
- the bloc median, Netanyahu bloc 53 instead of 54;
- P(61) 1% instead of 3%;
- Ra'am at 98.8%.

Those rest on calibration evidence: majority Brier 0.091 → 0.071, CRPS 2.163 → 2.099, Netanyahu-bloc error under
every seed. That evidence is sound but thin, and it moves the 2026 output toward the held-out Oct 23 polls, so those
polls cannot confirm it.

Version 3 can ship once the three blocking items are fixed:
1. the tests that will stop the polls job;
2. the changelog and pre-registration entry for the changed bloc point;
3. a version-2 rerun on the final polls.

It should be described as "the same seats as version 2, a better-calibrated spread and a bloc median", not as a
6% more accurate list forecast. Before the lock, also:
- correct the four site texts;
- reconcile the 53 and 54 shown on different pages;
- decide on Ra'am's turnout variance.
