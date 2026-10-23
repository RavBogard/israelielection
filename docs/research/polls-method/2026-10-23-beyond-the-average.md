# Beyond the average: what a forecast would add, and what the evidence says

Research memo, 2026-10-23 (four days before the vote). Status: recommendation, nothing built.

## 1. What the site does now

`lib/polls.ts`: one poll per pollster within 14 days of the newest poll, weighted by √n, each list
averaged over the polls where it passed, "near threshold" when it passes in under half, scaled to 120.
No house-effect correction, no time decay, no uncertainty, no probability. House effects are shown
(`lib/house-effects.ts`) but not used. The eval docs (FEATURE-GAPS, research-product) rule that
"X of Y polls" is a description of the sample, never a chance of winning.

## 2. The shape of the 2026 data

Nine current polls. Netanyahu-bloc totals: Channel 14 62, i24NEWS 58, everyone else 48–52.
Campaign-long means: Channel 14 62.9 (n=11), i24NEWS 59.0 (n=8), the other seven firms 49.3–52.1.
So the pollsters are bimodal, about ten seats apart, and the site's headline (≈52–55 depending on the
formula) is a midpoint that no poll shows. The question "is there something better than a pure
average" is, in this election, mostly the question "what do we do with Shlomo Filber's firms".

Threshold lists this year: Reservists (res) <2.6% to 5 seats across current polls, Amcha Yisrael (poi)
<1.5% to 4, Ra'am 5–6. Each threshold outcome moves about four seats.

## 3. What the Nate Silver toolkit contains, ingredient by ingredient, tested against Israel

**House-effect correction** (Jackman 2005; Peilingwijzer, NL). Each firm's deviation is estimated and
subtracted; the identifying assumption is that house effects sum to zero across firms, i.e. the
pollster consensus is unbiased. Peilingwijzer's own method page says it cannot correct a bias shared
by all pollsters. Israel's record is that the shared bias is the problem:

| Election | Final polls, Netanyahu bloc | Result | Miss |
|---|---|---|---|
| Mar 2015 | Likud-plus 47 | 50 | +3 (Likud alone +9) |
| Apr 2019 | 62–67 | 65 | ≈0 (Likud +7; New Right and Zehut polled 5–8 each, both failed) |
| Sep 2019 | — | 55 | −4.5 (Le Millénaire's figure) |
| Mar 2020 | 56–59 | 58 | ≈0 |
| Mar 2021 | 49–53 | 52 | +1.5 |
| Nov 2022 | 60–62 | 64 | +2.5 to +4 (Meretz polled 4–5, got 3.16%) |

Four of the last five elections understated the Netanyahu bloc; in 2022 every final poll did, and the
outlier (Direct Polls, 62) was closest on the bloc. A centred house-effect correction in 2026 would
pull toward the mainstream firms, which is the direction the polls have erred. Conclusion: keep house
effects as a display, not a correction.

**Pollster accuracy weights** (FiveThirtyEight ratings; Le Millénaire does this for Israel). theMadad's
2022 scorecard: Filber & Sharon (Channel 14) 1.87 seats per party error vs 1.92 for theMadad's own
average; bloc error 3.46 vs 5.53. So the 2022 evidence favours the outlier. But it is one election,
firms re-brand between elections (Direct Polls now polls for i24NEWS, Channel 14 lists "SF+ND"), and
weighting a firm up for being right once is the Trafalgar-2016 trap. Too thin to drive the headline.

**Time decay / trend line.** Matters in a long campaign. With 24 polls in the last 14 days and four days
to go, immaterial now. theMadad: per-party error 1.16 seats at 0–14 days out vs 2.52 at 90+ days.

**Monte Carlo seat simulation with the threshold.** This is the ingredient Israel actually needs. The
dominant surprise mechanism in every recent election was a list falling under 3.25% (Yachad 2015,
New Right and Zehut 2019, Meretz 2022), not a mis-measured big party. A simulation turns the site's
binary k/n rule into "passes in X% of runs" and gives bloc distributions instead of a point. Cost: Israeli
polls publish seats, not shares, so shares must be back-derived (seats/120 adjusted for the reported
sub-threshold percentages); the allocator exists (`allocate` in `lib/results.ts`, Bader-Ofer with
agreements). SekerKolshehu (GitHub, MIT, Python, Dirichlet noise + Bader-Ofer) is a reference
implementation per poll.

**Probability from replayed historical error.** Le Millénaire replays the five 2019–2022 bloc errors
(+0.3, −4.5, +0.2, +1.5, +2.5) plus pollster spread, 20,000 runs. Backtest run four days before each vote:
Brier 0.092 (0.240 for the climatological baseline); outcome was the most likely in 4 of 5. Honest
and light, but five data points.

## 4. What the alternatives say today

| Source | Netanyahu bloc | P(Netanyahu bloc ≥ 61) |
|---|---|---|
| Site method, all 9 polls (my share-based rerun) | 55 | 3–6% (rough sim, noise likely understated) |
| Site method without Channel 14 and i24NEWS | 48 | ≈1% |
| Median of the 9 current polls | 51 | — |
| Le Millénaire (accuracy-weighted + error replay, Oct 23) | 56.1 | 26%; no majority 66%; Netanyahu stays PM 92% |
| Polymarket (Oct 24) | opposition wins more seats 60% | Eisenkot PM 50%, Netanyahu 29% |
| Jewish Insider's average of final polls | 54 vs 50 | — |

The spread between 48 and 56 is entirely the Filber-firm decision. No weighting formula closes it.

## 5. Recommendation

**Before Oct 27: no change to the headline number, no probability.** Four days is not enough to
validate a model, and the site's line that the average is not a forecast is correct for this data.
Two cheap, honest additions if there is time:
1. Method tab: say in one paragraph that the pollsters sit in two camps about ten seats apart, that the
   average is a midpoint no poll shows, and point to the two figures (with / without).
2. Pre-register the scorecard. Write down now, before results, exactly what will be scored on election
   night: each pollster's final poll and both site averages against the official result, per-party
   absolute error, bloc error, threshold calls. Publishing the criteria first is what makes the ratings
   credible later.

**Election night and after: build the scorecard page** ("How the polls did"). This is the one Nate Silver
move that is genuinely available: pollster ratings from this election, in the site's own data, with the
2022 theMadad figures beside them as the second data point.

**For the next election: a seat simulator, not a forecast.** Seats→shares, noise calibrated on the
2019–2026 misses, Bader-Ofer with filed agreements, outputs "passes in X% of runs" per list and a
bloc distribution; house effects displayed; pollster weights only if 2026 confirms a direction. Whether
the output is ever labelled a "chance" is an editorial ruling, not a modelling one.

**One formula change worth considering now:** median instead of √n-weighted mean across the current
polls. It is still "a pure average", needs no theory of who is biased, and is robust to a two-firm
outlier. It moves the Netanyahu-bloc headline from ≈52–55 to 51. The cost is that if the historical
pro-Netanyahu lean holds this year, the median is further from the result than the mean.

## Sources

- Le Millénaire, Israel 2026 forecast and backtest: https://forecast.lemillenaire.org/en/israel/knesset/2026/
- theMadad, poll accuracy 2022: https://themadad.com/english/poll-accuracy-2022/ (Cloudflare-blocked from here; figures via search excerpts)
- theMadad, 2026 model: https://themadad.com/english/2026-election-model/
- SekerKolshehu (Monte Carlo + Bader-Ofer): https://github.com/isaranga/SekerKolshehu
- Peilingwijzer method (house effects, random walk): https://peilingwijzer.tomlouwerse.nl/methode
- Wikipedia polling pages, final polls vs results: 2022, 2021, 2020, April 2019
- Princeton Election Consortium on 2015: https://election.princeton.edu/?p=1042
- Jewish Insider, final polls 2026: https://jewishinsider.com/2026/10/final-israeli-polls-stalemate-tuesdays-election/
- Foreign Policy on right-wing non-response: https://foreignpolicy.com/2026/10/20/israel-election-netanyahu-eisenkot-trump-palestinians-gaza/
- Polymarket Israel election markets: https://polymarket.com/politics/israel-election
- Bias analysis (unvetted blog): https://danielspeaksup.substack.com/p/election-polling-bias
