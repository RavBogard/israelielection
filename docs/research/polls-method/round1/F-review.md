# F. Statistical and implementation review of the forecast simulation

Round 1, researcher F. Written 2026-10-23, four days before the vote. This review covers
`scripts/forecast/forecast.mjs` as committed in `436b30b`, run on `data/polls.json` as it stands now,
with the Maariv 2026-10-22 poll in the field instead of Maariv 2026-10-16. I am reviewing it as a
referee who wants it to score well under the pre-registered rule:

1. mean absolute seat error of `point` per list;
2. absolute error of each bloc total;
3. threshold calls (`passes` ≥ 50 and passed, or < 50 and failed);
4. whether the most probable majority outcome happened.

Nothing in the repo was changed apart from this memo. Every number below comes from scripts in the
scratchpad (`/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/`).
The main one is `model.mjs`, a parametric copy of the script. With its default options it reproduces
`forecast.mjs` exactly: same seed, same draws, same table. Each finding names the script that produced it.

## Summary, ranked by expected effect on the score

| # | Finding | Effect on the score | Change |
|---|---|---|---|
| 1 | **The seats-to-shares step is biased.** It undercounts lists at 4–5 seats and overcounts large lists. It pushes a quarter of the 4-seat lists in the 2026 polls under the threshold, and on the real 2022 result it drops Labor. | **Largest.** The Reservists call flips to "passes" (45% → 56%). Points move: Likud 21→20, Yashar 23→21, B'Yachad 14→13, Reservists 0→4. Blocs move: opp 54→51, net 52→51, mid 0→4. In synthetic tests the per-list error falls by 0.06–0.09 seats, the bloc error by 0.15–0.23 seats, and threshold calls improve by 3–4 points. | Replace `shares()` with a D'Hondt interval-midpoint inversion that respects the threshold (diff in F1). |
| 2 | **A printed share of `"<1%"` turns the whole forecast into NaN.** | Catastrophic if it fires: every point becomes 0. Channel 13, a field firm, printed `"<1.0%"` on Sep 23, and i24NEWS does it routinely. | Parse percentages safely and assert that every share is finite (F2). |
| 3 | **The point rule.** `allocate(central)` can disagree with the threshold call and with the bloc median. | Small. After F1, the reconciled per-list median equals `allocate(central)` on today's data. The bloc median for the Netanyahu bloc is 53 against a list sum of 51, which is worth about 0.07 seats of expected bloc error. | Make `point` the per-list median reconciled to 120. Compute the threshold call from the unrounded probability. Option: `blocs.*.point` = bloc median (F3). |
| 4 | **The threshold denominator.** Simulated shares do not add to 1 (sd 3.8 points). The fringe vote (1–1.5% in 2021–22) is missing, so the model's threshold is about 0.05 points too lenient. | Small. P(pass) for poi and the Reservists moves 2–3 points. No call flips today, but this is a coin-flip list. | Test the threshold against the run's total plus the fringe (F4). |
| 5 | **Variance double-counts.** Independent per-list noise already gives the Netanyahu bloc sd 3.0 seats before the common swing adds 3.1, so the realised bloc sd is 4.7 seats, not the 3.1 the memo states. Within-bloc substitution is missing, and the √share scaling makes large lists too wide. | Almost none on points or calls. P(net ≥ 61) drops from 5.5% to 3.4%, and "neither" stays the most likely outcome (91–96% in every variant). It matters for honesty, not for the score. | Zero-sum noise within each bloc plus the bloc swing, a separate Arab-turnout swing, and a floor on small-list sd (F5). |
| 6 | **Lean details.** The half-life cannot be identified from five out-of-sample points. The lean is taken proportionally from the Arab lists and the Reservists, which history does not support. | Small. The Reservists' share rises about 0.08 points (+4 pp P(pass)) if the lean is taken from the Zionist opposition only. | Optional (F6). |
| 7 | **Smaller issues:** the √n default of 600, lists a poll leaves out, combined entries, the arithmetic of the `listSd` conversion, the RNG, the memo's count of agreements. | Negligible today. | Listed in F7. |

Validation of the count (Part 0 below): `allocate()` **reproduces 2022 and 2021 exactly**. It also
agrees with an independent statutory quota-and-remainder implementation on 20,000 random elections.
The only disagreement is a rounding tie exactly at the threshold.

Recommended configuration on today's polls (F1 + F2 + F4 + median point, published variance; `final.mjs`):

| | Likud | Otzma | Shas | UTJ | RZ | poi | Yashar | B'Yachad | Dem | YB | B&W | Res | JL | Ra'am |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Published `point` | 21 | 8 | 8 | 8 | 7 | 0 | 23 | 14 | 9 | 8 | 0 | 0 | 9 | 5 |
| Recommended `point` | 20 | 8 | 8 | 8 | 7 | 0 | 21 | 13 | 9 | 8 | 0 | **4** | 9 | 5 |
| Published `passes` (today's data) | | | | | 99 | 43 | | | | | 0 | 45 | | 86 |
| Recommended `passes` | | | | | 99 | 43 | | | | | 0 | **56** | | 90 |

Blocs: net 52 → 51 (bloc median 53), opp 54 → 51, mid 0 → 4, Arab 14 → 14. P(net ≥ 61) is 5% either
way, and "neither" stays the modal majority outcome.

---

## 0. Validation of the count: `allocate()` against real elections

**Data.** The official per-list votes and surplus agreements come from Wikipedia, which cites the
Central Elections Committee:

- **2022:** valid votes 4,764,742. Agreements: Likud–RZ, Yesh Atid–National Unity, Shas–UTJ, Labor–Meretz. The Arab lists signed none.
- **2021:** valid votes 4,410,052. Agreements: Yamina–New Hope, Yesh Atid–Yisrael Beiteinu, Blue and White–New Economic, Likud–RZ, Labor–Meretz, Shas–UTJ.

**Method.** I copied `allocate()` verbatim, with the list ids and agreements as parameters
(`alloc.mjs`), and ran it on the shares of all valid votes (`validate.mjs`).

| Election | `allocate()` | Without agreements | Shares renormalised over the polled lists (what the forecast does) |
|---|---|---|---|
| 2022 | **Exact**: Likud 32, YA 24, RZ 14, NU 12, Shas 11, UTJ 7, YB 6, Ra'am 5, H-T 5, Labor 4 | Likud 31, Labor 5 (wrong) | Exact |
| 2021 | **Exact**: Likud 30, YA 17, Shas 9, B&W 8, Yamina 7, Labor 7, UTJ 7, YB 7, RZ 6, JL 6, NH 6, Meretz 6, Ra'am 4 | Likud 31, Meretz 5 (wrong) | Exact |

So the surplus-pair logic is exercised: it decides two seats in each year, and it gets them right.

**A pair where one partner fails the threshold.** `paired` is built only when both partners pass, so
a failed partner's votes are wasted and the other list allocates alone. That is the law. It is
exercised by Labor–Meretz in 2022 and B&W–New Economic in 2021, both exact. The synthetic case in
`validate.mjs` gives the same seats as no agreement at all.

**Splitting a pair's seats.** The seats are split by `dh()` on the two partners' own votes. That is
D'Hondt, the same as Bader-Ofer within the pair, as the law requires. Two checks confirm it:

- In 2021 five pairs were split, all exactly right.
- `fuzz.mjs` compares `allocate()` with an independent statutory implementation in `alloc.mjs::statutory`: whole quotas, then remainders one at a time by votes/(seats+1), with pairs as units, then the same procedure inside each pair. On 20,000 random 12-list elections with four pairs and a 1.5% fringe, they disagree once. In that case one list has 3.2499999% and rounds onto the threshold when converted to integer votes.

D'Hondt over the whole house is equivalent to quotas followed by highest averages, so computing it
with `dh()` alone is correct.

**Verdict:** the count is correct. The only caveat is the denominator of the threshold (F4).

---

## F1. Seats-to-shares reconstruction is biased: replace it (largest effect)

**What the code does.** A passing list's share is `seats/120 × (1 − Σ printed below-threshold %)`.
That is the Hare quota, and it inverts the wrong method: pollsters, like the committee, allocate by
D'Hondt with surplus agreements. D'Hondt gives large lists about half a seat more than
proportionality and small lists less. Inverting with seats/120 therefore:

- overstates large lists and understates small ones;
- puts the bonus back in when `allocate()` runs D'Hondt again, so the bias is counted twice.

**Evidence 1: the real 2022 result, with a perfect "pollster"** (`recon_actual.mjs`). I fed the
official seats and the official sub-threshold percentages through `shares()`. Labor (4 seats, 3.69%
in reality) is reconstructed at **3.09%**, below the threshold. Re-allocating then drops Labor and
gives its 4 seats to the large lists, for 8 seats of total error. Likud is reconstructed at 24.72%
against an actual 23.41%. The threshold-aware midpoint method below reconstructs Labor at 3.35% and
re-allocates exactly.

| Reconstruction on the real result | MAE of passing-list shares 2022 | Seat error after re-allocation 2022 | MAE 2021 | Seat error 2021 |
|---|---|---|---|---|
| Current `shares()` | 0.41 pt | **8 seats** | 0.26 pt | 0 |
| D'Hondt midpoint (`mid`) | 0.30 pt | 0 | 0.25 pt | 0 |
| Threshold-aware midpoint (`mid2`, proposed) | **0.28 pt** | **0** | **0.25 pt** | **0** |

**Evidence 2: round trip on every 2026 poll since Sep 15** (`roundtrip2.mjs`, 48 polls). I
reconstructed each poll's shares, re-allocated them with the 2026 agreements, and compared the result
with the seats the poll printed.

| Method | Polls reproduced exactly | 4-seat lists pushed under the threshold | Bias by printed size: 4–5 / 6–9 / 10–15 / 16+ |
|---|---|---|---|
| Current | 37 of 48 | **11 of 44** | −0.48 / +0.02 / +0.17 / +0.29 seats |
| `mid2` | **48 of 48** | **0 of 44** | 0 / 0 / 0 / 0 |

**Evidence 3: today's field.** The Reservists are at 4 seats in 5 of the 7 field polls and at 5 in
Israel Hayom, so 6 of 7 show them passing. Only Channel 12 has them below, at 2.8%.

- The current method reconstructs each 4-seat showing at 3.23%, below the threshold. The model then
  calls the Reservists *failing* (45%), against its own inputs.
- People of Israel (poi) passes in only 1 of 6 polls, and the model rates it about the same (43%).
- The site average (`lib/polls.ts`, k = 6 of n = 7) calls the Reservists passing.
- The calibration file's base rate for "lists shown at 4–5 by most final-week polls" is 7 of 12, 58%.
- `mid2` gives 56%.

| Field poll | Reservists printed | Current share | `mid2` share |
|---|---|---|---|
| Zman Yisrael 10-22 | 4 | 3.23 | 3.49 |
| Maariv 10-22 | 4 | 3.23 | 3.49 |
| Channel 13 10-21 | 4 | 3.23 | 3.48 |
| Channel 12 10-21 | below (2.8%) | 2.80 | 2.80 |
| Walla 10-20 | 4 | 3.33 | 3.58 |
| Kan 11 10-18 | 4 | 3.23 | 3.49 |
| Israel Hayom 10-08 | 5 | 4.00 | 4.13 |

**Evidence 4: an out-of-sample synthetic test** (`synth.mjs`, 3,000 trials, three noise settings).

- **Setup.** In each trial I drew a true share vector around today's field, with the Reservists, poi
  and Ra'am drawn near the threshold and a 1.5% fringe. Seven pollsters each added a house effect and
  sampling noise, allocated by Bader-Ofer under either 3 or 5 agreements, and printed seats plus
  sub-threshold percentages (15% printed none). Each estimator then tried to recover allocate(truth).
- **Result.** `mid2` comes within 0.02–0.03 seats of the oracle, an estimator that sees the pollsters'
  raw shares, and it beats both the current method and averaging seats directly.

| Estimator | Per-list MAE (house sd 0.3 / 0.6 / 1.0 pt) | Bloc MAE | Threshold calls right |
|---|---|---|---|
| Current `shares()` | 0.612 / 0.633 / 0.720 | 1.30 / 1.30 / 1.44 | 79.7 / 80.3 / 77.9% |
| Average seats directly (site rule: k/n, scaled to 120, largest remainder) | 0.556 / 0.605 / 0.714 | 1.18 / 1.27 / 1.46 | 82.6 / 81.3 / 78.4% |
| `mid` | 0.525 / 0.564 / 0.659 | 1.08 / 1.13 / 1.28 | 83.7 / 83.1 / 80.5% |
| **`mid2` (proposed)** | **0.521 / 0.558 / 0.655** | **1.07 / 1.12 / 1.27** | **84.1 / 83.5 / 80.8%** |
| Oracle (raw poll shares) | 0.492 / 0.540 / 0.640 | 0.99 / 1.08 / 1.24 | 85.6 / 84.2 / 81.5% |

The current method's mean signed errors in that test:

- large lists: Likud +0.6, Yashar +0.8, B'Yachad +0.4 seats;
- threshold lists: Reservists −0.6 to −0.8, poi −0.5 to −0.7, Ra'am −0.4 to −0.5.

That is the pattern visible in today's forecast.

**Averaging seats directly versus averaging reconstructed shares.** Averaging seats directly (the
site's method) is better than the current reconstruction but worse than `mid2`. Seat averages carry
each pollster's own D'Hondt bonus and rounding, and the site's k/n rule is crude at the threshold. A
correct reconstruction followed by one allocation is the best of the three.

**The 2% default for a sub-threshold list with no printed percentage.** It does not bite today:
every sub-threshold entry in the field prints a percentage. When it does bite, it is biased against
lists just under the line, which are the only ones whose share matters. Use the median percentage
other current polls printed for that list, and fall back to 2% only when none did.

**Proposed code** (replaces `shares()`; it also contains F2's safe parse):

```js
// 2. Seats back to vote shares. Under Bader-Ofer (D'Hondt) a list with k seats has a share in
//    [k·λ, (k+1)·λ) for the poll's divisor λ, and at least the threshold since it passed. Take the
//    midpoint of that interval, with λ solved so the passing lists add to the passing vote.
const pctOf = (s) => { if (s == null) return null; const x = parseFloat(String(s).replace(/[<>~%\s]/g, "")); return Number.isFinite(x) ? (String(s).includes("<") ? x / 2 : x) / 100 : null; };
const printedBelow = (id, ps) => { const xs = ps.map((p) => p.results[id]).filter((r) => r && (r.belowThreshold || r.seats === 0)).map((r) => pctOf(r.pct)).filter((x) => x != null).sort((a, b) => a - b); return xs.length ? xs[xs.length >> 1] : null; };
function shares(p, pool = current) {
  const s = {}; let below = 0; const pass = [];
  for (const [id, r] of Object.entries(p.results)) if (r.belowThreshold || r.seats === 0) { s[id] = pctOf(r.pct) ?? printedBelow(id, pool) ?? 0.02; below += s[id]; } else pass.push([id, r.seats]);
  for (const c of p.combined) pass.push([c.parties.join("|"), c.seats]);
  const P = 1 - below; let lam = P / pass.reduce((a, [, k]) => a + k + 0.5, 0);
  const at = (k) => (Math.max(THRESHOLD, k * lam) + (k + 1) * lam) / 2;
  for (let it = 0; it < 50; it++) lam *= P / pass.reduce((a, [, k]) => a + at(k), 0);
  for (const [id, k] of pass) { const v = at(k); if (id.includes("|")) { const ids2 = id.split("|"); for (const x of ids2) s[x] = v / ids2.length; } else s[id] = v; }
  return s;
}
```

Surplus pairs are ignored in the inversion. That is second order: the round trip above reproduces
all 48 polls with the 5-agreement allocation.

---

## F2. `parseFloat("<1%")` is NaN and poisons the whole forecast

`shares()` computes `r.pct ? parseFloat(r.pct) / 100 : 0.02`. Six polls in `data/polls.json` print
B&W as `"<1%"` or `"<1.0%"`:

- `channel-13-2026-09-23` (Channel 13 is a field firm);
- `i24news-2026-09-17`, `-09-24`, `-10-08`, `-10-13`, `-10-18`.

`parseFloat("<1%")` is NaN. NaN then spreads through `below` into every passing list of that poll,
through `meanShares` into every list, and through `allocate()` into
`{"undefined": NaN}` (`nanbug.mjs`). Every `point` becomes 0, and nothing errors.

None of the polls in today's field or check set has this, which is why the published run is fine.
But Friday's imports, the last before the publication ban, can add one. The `FILBER=1` sensitivity
run is exposed whenever i24NEWS's latest poll carries it.

**Fix:** use the `pctOf` above (`"<1%"` becomes 0.5%) and fail loudly:

```js
const base = meanShares(...);
for (const [id, v] of Object.entries(base)) if (!Number.isFinite(v)) throw new Error(`forecast: non-finite share for ${id}; check pct strings`);
```

---

## F3. The point estimate

Under absolute error, the optimal point for each list is the median of its predictive distribution.
For a list near the threshold, the median is 0 if P(pass) < 50% and about 4 otherwise, so a median
point always agrees with the threshold call scored under (3). `allocate(central)` agrees only when the
central share and the simulated probability fall on the same side of the line, and nothing forces
that.

`points.mjs` and `final.mjs` compare three rules. "Median, reconciled" moves one seat at a time, from
the list whose mass lies most to the needed side, until the lists add to 120, and never moves a list
across 0 and 4.

| Rule (today's data) | Likud | Otz | Shas | UTJ | RZ | poi | Yashar | B'Y | Dem | YB | Res | JL | Ra'am | Sum | net/opp/mid/arab |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Current recon: `allocate(central)` (published) | 21 | 8 | 8 | 8 | 7 | 0 | 23 | 14 | 9 | 8 | 0 | 9 | 5 | 120 | 52/54/0/14 |
| Current recon: median, raw | 21 | 8 | 8 | 8 | 7 | 0 | 22 | 13 | 9 | 8 | 0 | 8 | 5 | 117 | 52/52/0/13 |
| Current recon: median, reconciled | 22 | 8 | 8 | 8 | 7 | 0 | 22 | 14 | 9 | 8 | 0 | 9 | 5 | 120 | 53/53/0/14 |
| Current recon: mode | 21 | 8 | 8 | 8 | 7 | 0 | 22 | 13 | 9 | 8 | 0 | 8 | 5 | 117 | 52/52/0/13 |
| `mid2`: `allocate(central)` | 20 | 8 | 8 | 8 | 7 | 0 | 21 | 13 | 9 | 8 | 4 | 9 | 5 | 120 | 51/51/4/14 |
| `mid2`: median, reconciled | 20 | 8 | 8 | 8 | 7 | 0 | 21 | 13 | 9 | 8 | 4 | 9 | 5 | 120 | 51/51/4/14 |
| `mid2`: mode | 20 | 8 | 8 | 8 | 7 | 0 | 21 | 13 | 9 | 8 | **0** | 8 | 5 | 115 | 51/51/0/13 |

Two notes on these rows:

- Under the current reconstruction, the reconciled median disagrees with `allocate(central)` on
  Likud and Yashar by a seat each. That is the reconstruction bias of F1 showing through.
- The mode is wrong for threshold lists. A list that passes 56% of the time has its mass split across
  0, 4 and 5, so 0 is the single most frequent value even though the list probably passes.

In-sample expected per-list error differs by at most 0.03 seats across the median and
`allocate(central)` rules.

**Recommendation.** Make `point` the per-list median reconciled to 120. It is optimal for criterion
(1), consistent with (3) by construction, and equal to `allocate(central)` once F1 is in, so nothing
visible changes today. It is a guard against the two drifting apart.

Compute the threshold call from the raw fraction, not from `pct()`. `Math.round` turns 49.5% into 50,
which the rule then calls a pass.

**Bloc point (a decision for the lead).** Criterion (2) scores `blocs.*.point`. The median of the
bloc total is the optimal number for it, and it is not the sum of the list medians when a
threshold list is a coin flip. poi passes 43% of the time, so the Netanyahu bloc is about 51 if poi
fails and about 55 if it passes, with a bloc median of **53** against a list sum of **51**. On the
model's own draws the expected bloc error is 2.61 with bloc medians against 2.67 with list sums
(`rec.mjs`). The cost is that bloc points no longer add up from the list points.

```js
// after the loop
const med = (xs) => q(xs, 0.5);
const pointMed = reconcile(Object.fromEntries(ids.filter((id) => id in base).map((id) => [id, med(seatRuns[id])])), seatRuns); // see points.mjs::medianPoint
const passesRaw = (id) => seatRuns[id].filter((n) => n > 0).length / RUNS;          // call = passesRaw >= 0.5
const blocPoint = Object.fromEntries(blocs.map((b) => [b, med(blocRuns[b])]));        // optional: score blocs on this
```

---

## F4. The threshold denominator

1. **Simulated shares do not add to 1.** The swing and the consolidation conserve the total, but the
   per-list noise does not. Across runs the sum has sd 3.8 points (5–95%: 0.937–1.062), and
   `allocate()` tests 3.25% against 1, not against that run's total. On today's data this moves
   nothing beyond 1 pp (`thr.mjs`), but the threshold should be relative to the total.
2. **The fringe vote is missing.** The shares are renormalised over the polled lists, so the 25 or so
   unpolled lists, Noam among them, count for 0. They took 1.49% in 2022 (outside the 13 polled lists)
   and 0.68–1.47% in 2021. In the model's units the legal threshold is therefore
   3.25%/(1 − fringe), about 3.28–3.30%. With 1.5%, P(pass) falls about 2–3 points (Reservists
   56 → 53, poi 45 → 42).

```js
const FRINGE = 0.01; // vote for lists the polls do not report: 0.7–1.5% in 2021–22
// in allocate():
const total = ids.reduce((a, k) => a + Math.max(0, votes[k] ?? 0), 0) / (1 - FRINGE);
const pass = ids.filter((k) => (votes[k] ?? 0) >= THRESHOLD * total);
```

---

## F5. Variance and correlation

### Per-list errors against history

theMadad's 1.16-seat figure could not be found online to verify. I recomputed it from the Wikipedia
final-week tables (`hist2022.mjs`, `hist.mjs`). The field is the last poll of each firm, without
Direct Polls.

| Election | Individual polls, MAE per list | Field average, MAE per list | Field average, excluding threshold events |
|---|---|---|---|
| Mar 2020 | 1.00 | 1.00 | 1.00 |
| Mar 2021 | 1.62 | 1.56 | 1.64 |
| Nov 2022 | 1.33 (1.07 including two lists at 0–0) | 1.33 | 1.02 |

Two conclusions follow:

- The average's error equals the single poll's: the error is common to firms, so averaging does not
  reduce it. Using an individual-poll statistic for the average's noise is therefore defensible.
- The model's expected |run − point| over lists above 5% is **1.38 seats**, against a historical
  1.0–1.6. The overall per-list width is about right, and 2021 says it is not too wide.

**Scaling with size is not supported.** Field-average errors by list size, 2020–22 (n = 30):

| Size | MAE | RMS |
|---|---|---|
| 3.5–7 seats | 1.18 | 1.55 |
| 7–12 seats | 1.52 | 1.79 |
| 12+ seats | 1.02 | 1.14 |

√share scaling gives Likud and Yashar sd 2.8–2.9 seats and small lists 0.69 points. The 12+ seat
lists missed by RMS 1.1 in 2020–22. The large Likud misses of 2015 (+8) and April 2019 (+5) are
better carried by the consolidation draw, which does that job.

Small lists miss by more in share than √share allows. These sub-threshold-area lists missed by
roughly 0.5–1.8 points:

- Zehut 2019: polled about 4.5% → 2.74%;
- Otzma, September 2019: about 3.2% → 1.88%;
- Meretz 2022: about 3.6% → 3.16%;
- Balad 2022: 2.0% → 2.91%;
- Meretz 2021: about 3.4% → 4.59%.

Their RMS is about 1.0 point, excluding the 2021 B&W outlier. The poll shares are approximate,
converted from seats. Proposal: sd ∝ share^0.25, or keep √share with a floor of 0.8 points.

**Small conversion slip.** In `listSd`, a ten-seat list is 8.33% of the vote, not 10%. 1.45 seats is
1.21 points at 8.33%, which is 1.18 points at 8%, not 1.08. This partly offsets the scaling issue.

### Bloc interval 45–61 against history: the components double-count

`width.mjs` decomposes the simulated variance:

| Configuration | Net bloc sd | Opp bloc sd | Arab bloc sd |
|---|---|---|---|
| As published | **4.71** (90%: 45–61) | 3.73 | 2.44 |
| Bloc swing off | 3.01 | 2.88 | 2.30 |
| List noise off | 4.34 | 2.51 | 0.68 |
| Swing at the historical residual (1.5) | 3.49 | 3.09 | 2.33 |

The memo says the bloc width is 3.1 seats ("twice the historical residual"), but the realised sd is
4.7. That 4.7 is the root-sum-square of three parts:

- the swing, 3.1;
- the poi threshold coin flip, about 2 seats, which is legitimate;
- the sum of independent per-list noise, about 2.2 seats.

The third part double-counts. The per-list error it is calibrated on (1.16) is a raw per-list miss,
and the bloc swing is already inside it: in 2022 every Netanyahu-bloc list's error contained part of
the 3.7-seat bloc miss.

Against the record: after the +1.7 lean, the six historical bloc misses are −1.1, −1.4, −2.3, −1.0,
0.0 and +2.0, all within ±2.3.

- With sd 4.7, the chance that all six land within ±2.3 is 0.3%.
- With the stated 3.1, it is 2.5%.
- With the historical 1.5, it is 45%.

The "doubled for 2026" judgment can stand, but it should be the *total*, not added on top of
independent list noise.

### Correlation structure

History shows strong substitution inside blocs. I pooled the field-average errors of 2020–22 by bloc
(`corr.mjs`) and compared the variance of the bloc sum with the sum of the list variances:

- ratio **0.65**, mean pairwise within-bloc correlation **−0.10**;
- the clearest case is 2021, where the opposition lists missed by −3.2 to +3.8 while their total
  missed by −0.1.

The published model gives a ratio of 1.10 for the Netanyahu bloc and 0.91 for the opposition
(`corrsim.mjs`); correlations: Likud–Otzma −0.03, Likud–RZ −0.07, Yashar–Dem −0.14. Apart from the
consolidation draw, which only moves the largest list against the rest, the model has independent
lists plus a bloc shift. That gives within-bloc correlations of zero or positive, the opposite sign
from history.

Two further gaps:

- The common swing moves the Netanyahu bloc against everyone else proportionally, so the Arab bloc
  has no turnout swing of its own. Historically it missed by +1.0, −1.7 and +2.0 seats (RMS about 1.6).
- `largest.opp` is Yashar, so the opposition's consolidation draw moves Yashar against Democrats and
  B'Yachad. That is plausible.

**Proposed structure.** It is implemented as `noise: "zerosum"` in `model.mjs`; the parameters come
from the data above.

```js
// per run, after swing and consolidation:
const e = {}; for (const id of ids) if (id in v) e[id] = randn() * Math.max(0.008, listSd * Math.sqrt(Math.max(v[id], 0.01) / 0.08));
for (const b of ["net", "opp", "arab"]) {                    // zero-sum inside the bloc: substitution, not bloc movement
  const m = ids.filter((id) => bloc[id] === b && id in v), tot = m.reduce((a, id) => a + v[id], 0), se = m.reduce((a, id) => a + e[id], 0);
  for (const id of m) e[id] -= se * v[id] / tot;
}
const ar = randn() * 1.7 / KNESSET;                           // Arab turnout: RMS of 2020–22 Arab-bloc misses
for (const id of arabIds) e[id] += ar * v[id] / arabTot;
// balance the mid list and the Arab swing against the Zionist lists, then v[id] = max(0, v[id] + e[id]);
// then normalise v to sum 1 (F4).
```

**Result** (`final.mjs` R2):

| | Published | Proposed |
|---|---|---|
| Net bloc | 45–61, sd 4.7 | 46–60, sd 4.1 |
| Opposition bloc | 46–58 | 47–56 |
| Opp-bloc ratio | 0.91 | 0.65, matching history |
| Yashar–Dem correlation | −0.14 | −0.26 |
| P(net ≥ 61) | 5.5% | 3.4% |
| Points | | unchanged |
| P(pass): Ra'am / Reservists / poi | | 88 / 55 / 44 |

**Effect on the score.** Effectively none:

- (1) and (2) do not change.
- (3) does not change: no list crosses 50.
- (4) does not change: "neither" is 91–96% in every variant I ran.

Do it for the honesty of the intervals, not for the score.

The floor of 3 on `blocSd` does not bind (2 × 1.53 = 3.07). It is harmless.

---

## F6. The lean

**The half-life cannot be identified from the data** (rolling-origin test: predict each election's
miss from the earlier ones):

| Half-life | MAE of the five out-of-sample predictions | Lean for 2026 |
|---|---|---|
| 0.5 elections | 1.18 | +3.1 |
| 1 | 1.25 | +2.4 |
| **2 (used)** | 1.29 | **+1.75** |
| 3 | 1.30 | +1.5 |
| ∞ (plain mean) | 1.31 | +1.1 |
| No lean | 1.40 | 0 |

Every lean beats no lean, and shorter half-lives do marginally better because the misses are
trending up. The differences are within noise, so there is no data-driven reason to change the
choice. Each +0.6 of lean is worth about one Netanyahu-bloc seat in `point`.

**Where the lean comes from.** The lean multiplies every non-Netanyahu list by
1 − sw/(1 − ns), including the Arab lists and the Reservists, each losing about 2.4% of its share.
History says the Zionist opposition paid for the misses (2020–22: −1.7, 0.0, −5.7), not the Arab
lists (+1.0, −1.7, +2.0). Taking the lean from the Zionist opposition alone:

- raises the Reservists' central share about 0.08 points (+4 pp P(pass)) and Ra'am's about 0.1;
- removes about 0.3 seats from the Zionist opposition's point.

This is optional. It is a judgment, but a better-founded one than proportional.

The multiplicative swing conserves the total exactly and keeps every list positive for any swing
under 25 seats. It does not distort small lists beyond the proportionality assumption itself.

---

## F7. Smaller issues

- **The `sqrtN` default is 600; `lib/polls.ts` uses the median known n.** It has no effect today:
  every field poll has an n. Use the site's rule for consistency. More fundamentally, between-firm
  spread in 2022 was 0.4–1.0 seats per list, below what simple random sampling at n = 500 implies
  (about 1.5 seats for an 8% list). Firms herd or weight, so n carries little information, and √n is
  a reasonable middle ground. Nothing to change.
- **A list a poll leaves out.** Walla 10-20 leaves out poi, and that poll's `below` does not include
  poi's roughly 3%. Its other lists are therefore about 3% too large relative to the other polls,
  which moves the field mean about 0.4% relative. It is negligible, but an omitted list should be
  imputed at the median of the other polls before renormalising.
- **Combined entries** (`p.combined`, only Kan's September Shas+UTJ) are not scaled by (1 − below),
  despite the comment "refined below". `mid2` treats them as one passing unit. No current effect.
- **`passes` rounding:** see F3.
- **RNG.** mulberry32 with the cosine half of Box-Muller is fine. The number of draws per run is
  fixed, so runs are reproducible. With 50,000 runs the Monte Carlo error on P(pass) is ±0.2 pp,
  which matters only when the call sits at 49.6–50.4%. Report one decimal and call from the raw
  value.
- **The forecast memo says "the six reported surplus agreements".** The script uses five: three
  signed and two reported. `results.json`'s own note says provisional seat estimates assume only the
  three signed. The difference changes no seat today (`agr.mjs`: 3, 5 or no agreements give the same
  `point` with `mid2`, except that no agreements gives Likud +1 and JL −1). Fix the memo's wording,
  and confirm the agreements against the committee's register before the final run.
- **The window.** Israel Hayom 10-08 is 14 days older than the newest poll and weighs as much as a
  poll from Oct 22. That is a weighting question for another memo; no correctness issue.

---

## Reproduction

All scripts are in
`/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/` and run
with `node <file>`. They read the repo data by absolute path and write nothing to the repo.

| Script | What it does |
|---|---|
| `model.mjs` | Parametric copy of `forecast.mjs` (`check_repro.mjs` verifies it reproduces the published table) |
| `alloc.mjs`, `validate.mjs`, `fuzz.mjs` | Validation of the count |
| `recon.mjs`, `recon_actual.mjs`, `roundtrip2.mjs`, `synth.mjs` | F1 |
| `nanbug.mjs` | F2 |
| `points.mjs`, `rec.mjs`, `final.mjs` | F3, and the recommended configuration |
| `thr.mjs` | F4 |
| `hist2022.mjs`, `hist.mjs`, `width.mjs`, `corr.mjs`, `corrsim.mjs` | F5 |
| `agr.mjs` | Agreement sensitivity |

**Sources:** Wikipedia, "2022 Israeli legislative election" and "2021 Israeli legislative election"
(results tables, citing the CEC); Wikipedia opinion-polling pages for 2020, 2021 and 2022 (final-week
rows, read 2026-10-23).
