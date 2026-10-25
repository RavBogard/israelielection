# D. Pollsters: weights, house effects, recency, and the Filber question

Round 1 research memo, 2026-10-23 (four days before the vote). Researcher D. Scope: how the forecast
(`scripts/forecast/forecast.mjs`) should select, weight and correct polls. Nothing in the repo was changed
except this file. Scripts (scratchpad, not committed):
`/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/D-pollsters/`
(`house.mjs` = 2026 house effects; `hist.mjs` = 2019–2022 final-poll accuracy and aggregation backtest on
Wikipedia wikitext; `options.mjs` = the forecast's own shares → lean → Bader-Ofer → simulation pipeline,
replayed under each option below; `cec/` = Central Elections Committee poll filings).

## Summary

1. **Windowing and weighting barely matter this year.** Most selection rules give the same central
   result: Netanyahu bloc 52, the same list seats, and a 4–6% chance of 61. These rules are a 7- or 5-day
   window, n or equal weights, the last two polls per pollster, exponential decay, and per-firm
   de-duplication. History favours the current kind of rule, the latest poll per firm. Every rule that
   lets older polls back in scored worse in 2019–2022.
2. **Pollster accuracy weights would not help.** In 2019–2022 the firms' final-poll errors differed by a
   standard deviation of only 0.1–0.3 seats per list. The firms' rankings carried over weakly from one
   election to the next: rank correlation 0.39 on list error and 0.24 on bloc error. Weighting by past
   accuracy improved the backtest by at most 0.02 seats.
3. **The Filber decision is the only large lever (3–4 bloc seats).** On the evidence, the 2026 gap
   between these firms and the field is mostly method, not signal:
   - The firms changed. Channel 14 is now polled by Next Data, a firm the channel's owners set up in 2026
     with no track record. Filber left Direct Polls in June 2025, and Direct Polls now polls for i24NEWS.
   - Next Data's own filings show methodological choices that alone can move the bloc by several seats.
     It weights to the 2022 vote and to ideology, it reports 0.6–4% undecided, and it states a fixed
     54/46 split between 2022 coalition and opposition voters.

   **Recommendation: option (c).** Include both firms, but correct each to Direct Polls' historical lean
   of +2 bloc seats over the field, and recompute the lean with Direct Polls counted in the historical
   field (+1.5). Effect on the central forecast: Netanyahu bloc 52 → 53, Likud 21 → 22, Yashar 23 → 22,
   P(61) unchanged at about 5%, and "neither" stays the modal outcome. Reject (b), full inclusion: it
   gives a bloc of 55–56 and Likud 24–25, which needs the field to miss by two to three times its worst
   miss since 2015.

## 1. 2026 house effects

**Method.** Each poll is compared with a reference: the mean of the other field pollsters' polls
published within ±5 days, with each pollster averaged first. Results are in seats. The reference for every
firm, Filber's included, excludes Channel 14 and i24NEWS. A firm's house effect is the mean of its per-poll
deviations. `data/polls.json` holds 62 polls from Sep 6 to Oct 22 (Maariv's Oct 22 poll, n = 1,048, is
included). A threshold miss counts as 0 seats, and Kan's combined Shas+UTJ figure of Sep 28 is split
evenly.

| Pollster (firm) | polls | Likud | Otzma | Shas | UTJ | RZ | Amcha | Yashar | B'Yachad | Dem | YB | Reserv. | JL | Ra'am | **Net bloc** | **Opp bloc** | Arab |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Channel 14 (Next Data / Filber) | 11 | +10.6 | +0.1 | +2.4 | +0.1 | +1.3 | −2.4 | −1.7 | −4.7 | −0.2 | −2.7 | −2.5 | −0.5 | +0.2 | **+12.0** | **−9.2** | −0.3 |
| i24NEWS (Direct Polls) | 8 | +6.7 | +1.0 | −0.3 | +0.5 | +0.1 | +0.2 | −1.4 | −2.0 | +0.2 | −1.6 | −3.1 | −0.5 | +0.3 | **+8.2** | **−4.9** | −0.2 |
| Channel 12 (Midgam R&C) | 8 | +0.4 | −0.9 | −0.2 | 0.0 | −0.1 | +0.2 | +1.0 | +0.5 | +0.5 | 0.0 | −0.8 | +0.1 | −0.7 | −0.5 | +1.9 | −0.6 |
| Channel 13 (Midgam Project / theMadad / Stat-Net / Askaria) | 8 | −1.6 | +0.3 | −0.5 | +0.1 | +1.2 | +2.1 | −2.1 | −0.4 | +1.1 | −0.5 | −1.2 | +0.9 | +0.7 | +1.6 | −1.9 | +1.5 |
| Kan 11 (Kantar) | 7 | +0.5 | +0.2 | −0.3 | −0.1 | +0.2 | +0.2 | +0.4 | −1.0 | −0.9 | −0.8 | +1.8 | −0.3 | 0.0 | +0.8 | −2.3 | −0.4 |
| Israel Hayom (Kantar) | 2 | +0.6 | +1.0 | −0.4 | −0.2 | +0.1 | −1.1 | −0.6 | +0.3 | −0.5 | −0.7 | +2.0 | −0.3 | −0.2 | +0.1 | −1.5 | −0.6 |
| Maariv (Lazar + Panel4All) | 8 | −1.4 | +0.9 | −0.6 | −0.7 | 0.0 | +0.5 | −0.4 | +0.7 | +0.7 | +0.1 | +0.8 | −0.5 | −0.1 | −1.4 | +1.1 | −0.6 |
| Walla (Lazar + Panel4All) | 3 | 0.0 | +0.1 | −0.2 | −0.4 | −0.3 | −0.8 | +0.6 | +0.7 | +0.3 | +0.2 | 0.0 | −0.3 | +0.1 | −1.7 | +1.8 | −0.2 |
| Zman Yisrael (Yossi Tatika) | 7 | +1.5 | −1.1 | +1.6 | +0.9 | −1.2 | −1.7 | +1.0 | −0.5 | −1.4 | +1.1 | −0.7 | +0.3 | +0.1 | 0.0 | +0.3 | +0.5 |

**Stability: Netanyahu-bloc house effect by phase.** The three phases are Sep 6–25, Sep 26–Oct 12 and
Oct 13–22. "sd" is the standard deviation of the per-poll deviation.

| Pollster | Sep 6–25 | Sep 26–Oct 12 | Oct 13–22 | sd | last poll |
|---|---|---|---|---|---|
| Channel 14 | +12.4 (5) | +11.4 (3) | +12.1 (3) | 0.7 | +12.3 |
| i24NEWS | +9.0 (3) | +8.5 (2) | +7.3 (3) | 1.0 | +8.2 |
| Channel 12 | −0.3 | −2.6 | +1.3 | 1.7 | +1.2 |
| Channel 13 | +1.9 | +3.6 | −0.1 | 1.8 | −1.1 |
| Kan 11 | +0.6 | +0.9 | +1.3 | 0.9 | +1.3 |
| Maariv | −2.5 | +0.1 | −0.5 | 1.9 | −2.1 |
| Walla | −0.5 | −2.3 | −2.2 | 1.0 | −2.2 |
| Zman Yisrael | −0.5 | +0.6 | +0.1 | 1.3 | +1.5 |

**Findings**

- **Size of the Filber firms' lean.**
  - **Channel 14** sits **+12.0 seats** above the field on the Netanyahu bloc and −9.2 on the Zionist
    opposition. This is extremely stable: the per-poll sd is 0.7 and the effect never left +11 to +12.5
    over seven weeks. Almost all of it is Likud (+10.6) plus Shas (+2.4) and RZ (+1.3). On the other side
    it comes out of B'Yachad (−4.7), Yisrael Beiteinu (−2.7), Yashar (−1.7), Reservists (−2.5) and Amcha
    (−2.4, which Channel 14 never puts over the threshold). It is not a uniform right-wing lean. It is a
    Likud effect, and Channel 14 keeps one Netanyahu-bloc list (Amcha) out.
  - **i24NEWS** sits **+8.2** above the field, again mostly Likud (+6.7), with B'Yachad −2.0, YB −1.6,
    Yashar −1.4 and Reservists −3.1 (it never shows them passing). Its lean is shrinking: from +9.0 to
    +7.3 on the bloc, and from −6.2 to −3.7 on the opposition.
  - Against **all** other firms, Channel 14 included, the effects are +10.8 (Channel 14) and +6.5 (i24).
    The field firms then look 1.4–4.3 seats "anti-Netanyahu". This is why a house-effect correction
    centred on all firms, as Peilingwijzer and the israel-polls-2026 tracker do, shifts the field toward
    Filber.
- **The field firms are close to each other.** Their bloc house effects run from −1.7 (Walla) to +1.6
  (Channel 13), sd about 1.2 seats. That is the same spread the final polls showed in 2020–2022 (a range
  of 2–3 seats).
  - Lazar runs both Maariv and Walla, which lean slightly toward the opposition (−1.4 and −1.7, t about
    −2 to −3). Channel 13 and Kan lean slightly toward the bloc (+1.6, +0.8).
  - These t-statistics are inflated because overlapping polls share a reference, so read anything below
    |t| = 3 as noise.
  - The most consistent effects within the field are on threshold lists. Kantar (Kan and Israel Hayom)
    shows the Reservists at 4–5 seats in almost every poll (+1.8 to +2.0 seats), while Channel 13
    (+2.1) and Maariv lean toward Amcha passing.
- **Two lists are double-counted.** Maariv and Walla are one firm (Lazar Research Institute + Panel4All).
  Kan 11 and Israel Hayom are one firm (Kantar, which has polled for Israel Hayom since Dec 2025, per
  Wikipedia's pollster table). The current rule, one poll per pollster, gives each of these firms two
  votes in the field of seven.
- **Raw dispersion does not identify a biased firm.** Every firm's poll-to-poll sd on the bloc is below
  pure sampling noise: Kan 0.7, Channel 14 1.0, Channel 12 1.2, i24 1.4, Channel 13 2.2, against about
  2–2.7 expected at n ≈ 500. So all firms weight heavily, and Channel 14's stability is not by itself a
  sign of manipulation.

## 2. Historical accuracy, 2019–2022

**Method.** Source: the raw wikitext of the English Wikipedia opinion-polling pages, read 2026-10-23, for
[April 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election),
[September 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election),
[2020](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election),
[2021](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election) and
[2022](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election).
- Each firm's last poll before the silence is scored if it fell within 14 days of the last poll.
- MAE is the mean absolute seat error over every list in the table. A list printed below the threshold
  counts as 0 seats.
- Bloc is the Netanyahu bloc as defined in `calibration.json`, given as poll minus result.
- My field means reproduce `calibration.json` exactly: 57.3, 50.3 and 60.3 for 2020–22 without Direct
  Polls.

| Firm (2026 client) | Apr 2019 | Sep 2019 | Mar 2020 | Mar 2021 | Nov 2022 | Mean MAE 2020–22 |
|---|---|---|---|---|---|---|
| Midgam / Mano Geva (Channel 12) | 2.71 / −2 | 1.40 / 0 | 0.89 / 0 | 1.43 / −1 | 1.08 / −4 | 1.13 |
| Kantar, formerly TNS (Kan 11, Israel Hayom) | 2.86 / −1 | 1.40 / 0 | 0.89 / 0 | 1.43 / −1 | 1.08 / −4 | 1.13 |
| Panels Politics, then Lazar (Maariv, Walla)* | 3.00 / −3 | 1.78 / +5 | 0.89 / −1 | 1.54 / −3 | 0.92 / −4 | 1.12 |
| Panel Project HaMidgam (part of Channel 13's 2026 consortium) | 2.86 / +1 | 1.40 / −1 | 0.89 / −2 | — | — | — |
| Camil Fuchs (Channel 13 until Mar 2024; not in 2026) | — | — | — | 1.43 / −2 | 1.54 / −4 | — |
| **Direct Polls (i24NEWS since Jun 2025)** | 2.86 / −1 (Mar 28) | — | 0.89 / **+1** | **1.00** / **+1** | 1.08 / **−2** | **0.99** |
| Smith (no 2026 seat polls in our list) | 2.57 / +1 | 0.80 / +2 | 0.75 / 0 | 1.43 / −1 | 0.92 / −3 | 1.03 |
| Maagar Mochot (Channel 16 in 2026; not in our list) | 3.36 / +1 | 1.20 / −1 | 1.11 / −1 | 1.86 / −2 | 1.23 / −3 | 1.40 |
| Next Data (Channel 14 since May 2026) | — | — | — | — | — | no record |
| Yossi Tatika (Zman Yisrael) | — | — | — | — | — | no Knesset final polls found |

Cells are MAE / bloc error. *Menachem Lazar ran Panels Politics. Maariv moved from Panels Politics to
the Lazar Research Institute in Jul 2023, so the person is continuous but the panel may not be. The firm
mapping is from the
[2026 pollster table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election).

**Threshold calls.** Every firm made the same mistakes: New Right and Zehut in Apr 2019, Otzma in
Sep 2019 (Smith and Panels got it right), Meretz in 2022. Threshold misses are shared errors, not house
errors.

**Other scorecards.**
- theMadad's 2022 page (https://themadad.com/english/poll-accuracy-2022/; Cloudflare returns 403, so the
  figures come from search excerpts) covers all 24 of Filber & Sharon's polls in the campaign. Their mean
  error was 1.87 seats per party, against 1.92 for theMadad's average; their coalition-bloc error was
  3.46, against 5.53.
- Project 61 (Nehemia Gershuni-Aylho) ranked pollsters for 2006–2013. The best, Mina Tzemach of Dahaf,
  had retired. Panels Politics was second and Mano Geva third. He also reported that biases are
  persistent by party (large parties overstated, Haredi and Arab parties understated) more than by
  pollster
  ([Times of Israel, Jan 2015](https://www.timesofisrael.com/how-a-28-year-old-analyst-is-fixing-israels-polls/)).
- I found no independent 2019–2021 scorecard beyond these, and Knesset Jeremy's archive was not reachable.

**Is accuracy persistent?** Weakly, and too little to use.
- **Spread between firms is small.** The sd of final-poll MAE across firms within an election was 0.29,
  0.29, 0.11, 0.25 and 0.21 seats. The common error was 0.9–2.9 seats. Firms are hard to tell apart.
- **Rankings carry over weakly.** The Spearman correlation between consecutive elections averaged
  **0.39** for MAE (from 0.32 to 0.43) and **0.24** for signed bloc error (from −0.49 to 0.94).
- **Accuracy weighting barely helps.** Weights of 1/MAE², taken from earlier elections only, changed the
  average's MAE by −0.014 (Sep 2019), −0.023 (2020), +0.005 (2021) and +0.007 (2022). Using the best
  previous firm alone (Smith) was better twice and worse twice.
- **The one firm with a consistent bloc record is Direct Polls**, which was closest or tied-closest on
  the bloc in 2020, 2021 and 2022. It is the 2026 outlier camp, and it has since lost Filber. Weighting
  it up for that record is the Trafalgar-2016 trap the earlier memo describes.

## 3. Recency and windowing

**Backtest.** Same Wikipedia data, five elections. Each rule's seat average is scored against the result.
Polls are equal-weighted because Wikipedia rarely gives n.

| Rule | Apr 19 | Sep 19 | 2020 | 2021 | 2022 | mean MAE | mean abs bloc | mean bloc |
|---|---|---|---|---|---|---|---|---|
| **Latest per firm, 14 d (current)** | 2.77 / +0.2 | 1.28 / +0.7 | 0.89 / −0.4 | 1.39 / −1.3 | 0.99 / −3.4 | **1.463** | **1.20** | −0.9 |
| Latest per firm, 7 d (also 4 d) | 2.76 / +0.4 | 1.28 / +0.7 | 0.89 / −0.4 | 1.39 / −1.3 | 0.99 / −3.4 | 1.460 | 1.24 | −0.8 |
| Last 2 per firm, 14 d | 2.78 / −0.2 | 1.30 / +0.2 | 0.92 / −0.8 | 1.48 / −2.3 | 0.96 / −3.6 | 1.488 | 1.44 | −1.3 |
| All polls, 14 d (prolific firms count more) | 2.67 / −0.2 | 1.30 / +0.3 | 0.99 / −1.4 | 1.75 / −3.6 | 0.94 / −3.7 | 1.531 | 1.83 | −1.7 |
| Decay, half-life 3 d, per firm | 2.76 / +0.1 | 1.33 / +0.5 | 0.90 / −0.8 | 1.46 / −2.0 | 0.97 / −3.6 | 1.486 | 1.39 | −1.2 |
| Decay, half-life 7 d, per firm | 2.70 / −0.1 | 1.34 / +0.6 | 0.96 / −1.1 | 1.60 / −2.7 | 0.96 / −3.6 | 1.511 | 1.59 | −1.4 |
| Decay, half-life 14 d, per firm | 2.62 / −0.4 | 1.35 / +0.7 | 1.01 / −1.4 | 1.71 / −3.0 | 0.96 / −3.6 | 1.531 | 1.80 | −1.5 |
| Median of latest per firm | 2.71 / +2.0 | 1.50 / +2.0 | 0.78 / −1.0 | 1.36 / −1.0 | 0.92 / −3.0 | 1.454 | 1.80 | −0.2 |
| Latest per firm, ex Direct Polls | 2.76 / +0.4 | 1.28 / +0.7 | 0.89 / −0.7 | 1.45 / −1.7 | 1.13 / −3.7 | 1.501 | 1.41 | −1.0 |
| Current rule run 7 days earlier | 2.59 / +0.8 | 1.40 / +0.7 | 1.17 / −2.2 | 2.33 / −5.5 | 0.92 / −3.6 | 1.683 | 2.54 | −2.0 |
| Current rule run 14 days earlier | 2.62 / −1.0 | 1.44 / +1.4 | 1.22 / −2.2 | 2.17 / −4.7 | 1.00 / −4.0 | 1.690 | 2.65 | −2.1 |

**How much polls move in the final two weeks.** I measured the mean absolute change per list in the
latest-per-firm average from T−14 to the final pre-silence poll (T0).
- The change was 0.42, 1.41, 0.48, 1.01 and 0.37 seats in the five elections. The Netanyahu bloc moved
  +1.2, −0.7, +1.8, +3.4 and +0.6 seats.
- The final week carried real information. The T−7 average was worse than T0 by 0.22 seats of MAE and
  1.3 seats of bloc error on average.
  - In 2021, 7 of the 9 lists that moved ≥0.5 seats kept moving the same way to the result (Likud, Shas,
    Meretz and Ra'am up; Yamina and New Hope down).
  - In 2020, 2 of 3 did (Likud).
  - In 2022 and April 2019, the late shift happened entirely inside the blackout, where no poll could see
    it.
- The Israeli pattern is that the latest polls beat a smoothed trend, and that what moves after the last
  poll moves toward Likud and the Netanyahu bloc (2015, Apr 2019, 2020, 2021, 2022). That is what the
  forecast's lean already models.
- A momentum rule, T0 + ½(T0 − T−7), helped in 2020 and 2021 and hurt in the other three elections. It is
  not robust. It would also push 2026 the other way: the field's Netanyahu bloc slid from 51.4 (Oct 12)
  to 49.9 (Oct 22).

**sqrt(n) against n.** Sampling error per list at n = 500 is about 1.0–1.5 seats. The house-effect spread
among field firms is about 1 seat per list (table 1). With non-sampling error of the same size, the
efficient weight is much flatter than n, so sqrt(n) or equal weights are right. n-weighting is dangerous
here: Channel 14's last poll reports **n = 7,937**. With all nine polls n-weighted and no lean, the bloc
goes to 58 and Likud to 27. Within the field, n against sqrt(n) against equal weights changes nothing.

**What each rule gives for the 2026 forecast.** I replayed `forecast.mjs` under each rule: shares, lean
+1.7, Bader-Ofer with the five agreements, and 20,000 runs with the same seed.

| Option (field only, lean +1.7 unless stated) | Net / Opp / Arab / Res | Likud | Yashar | B'Yachad | Mean list change vs A | P(net ≥ 61) | Pass: Res / Amcha / Ra'am |
|---|---|---|---|---|---|---|---|
| **A: current** (latest per pollster, 14 d, sqrt n) | 52 / 54 / 14 / 0 | 21 | 23 | 14 | — | 5% | 45 / 43 / 86 |
| B: latest per **firm** (Lazar, Kantar once) | 53 / 53 / 14 / 0 | 22 | 22 | 14 | 0.15 | 5% | 40 / 47 / 87 |
| B2: latest per pollster, each firm's weight split between its outlets | 52 / 54 / 14 / 0 | 21 | 23 | 14 | 0 | 5% | 42 / 45 / 87 |
| C: 7-day window (drops Israel Hayom, Oct 8) | 52 / 54 / 14 / 0 | 21 | 23 | 14 | 0 | 4% | 41 / 46 / 89 |
| D: n-weights; D2: equal weights | 52 / 54 / 14 / 0 | 21 | 23 | 14 | 0 | 5–6% | 45 / 43 / 86 |
| E: last two per pollster | 52 / 54 / 14 / 0 | 21 | 23 | 14 | 0 | 5% | 41 / 45 / 88 |
| F: decay, half-life 3 or 7 d, all polls | 52 / 54 / 14 / 0 | 21 | 23 | 14 | 0 | 6% | 45 / 43 / 87 |
| G: median | 52 / 54 / 14 / 0 | 22 | 23 | 14 | 0.15 | 4% | 41 / 41 / 78 |

The campaign was flat: the field's bloc was 51.7 on Sep 12, 51.4 on Oct 12 and 49.9 on Oct 22, so the
rules agree. Every option leaves the Reservists and Amcha just under 50% to pass (both called "fails") and
leaves "neither bloc at 61" as the modal outcome.

## 4. The Filber question

### What changed since the 2020–2022 record

- **Direct Polls, the firm with the record, polls for i24NEWS.** Filber founded it and left in June 2025
  ([Wikipedia: Shlomo Filber](https://en.wikipedia.org/wiki/Shlomo_Filber)). The i24 filings name
  "Direct Polls Ltd., headed by Zuriel Sharon", the "Sharon" of theMadad's 2022 "Filber & Sharon".
  - Method: an online respondent panel. About 8,600 were invited and about 504–518 answered, a 5.9–6.0%
    response rate. Raw Likud was 22.0% (Oct 1) and 19.8% (Oct 7) of decided voters. No weighting or
    undecided share is stated (CEC filings
    [Survey_4178](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election92/he/Survey_4178.pdf),
    [Survey_4199](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election104/he/Survey_4199.pdf)).
  - Israel Policy Forum reported that its early 2026 CEC submissions were missing or did not meet the
    requirements.
- **Channel 14's polls are Next Data's**, "a polling company which Channel 14 itself established"
  ([Israel Policy Forum, Aug 20, 2026](https://israelpolicyforum.org/2026/08/20/israeli-election-polls-pollsters/)),
  with Filber analysing them.
  - Haaretz reported that the firm is held through companies controlled by the channel's owner and that
    the link was not disclosed
    ([May 18, 2026](https://www.haaretz.com/israel-news/israel-politics/2026-05-18/ty-article/.premium/channel-14-aired-election-polls-by-firm-it-formed-without-disclosing-ownership/0000019e-39f1-dd4b-a7be-fdf1e4390000)).
  - Channel 14 failed to file legally required poll data
    ([Aug 14](https://www.haaretz.com/israel-news/israel-politics/2026-08-14/ty-article/.premium/right-wing-channel-14-failed-to-report-legally-required-election-poll-data/0000019f-feff-d222-abbf-ffffaef80000)).
    When it did file, researchers said little could be learned and the CEC asked for corrections
    ([Aug 18](https://www.haaretz.co.il/news/elections/2026-08-18/ty-article/000001a0-0f5e-db35-afee-7ffe6c0a0000)).
  - Next Data has no Knesset record. Filber's own last tested record, the Direct Polls / Channel 14 exit
    poll of the 2024 municipal elections, was wrong on the winner, the margin or the runoff in 14 of 40
    cities ([The Seventh Eye, Mar 2024](https://www.the7eye.org.il/513107)).
- **Consequence for the repo's framing.** `data/polls.json` (`withoutVariant.note`) and the algorithm
  memo describe both firms as "Shlomo Filber's firms" sharing one historical signal. That is out of date:
  the 2020–22 record belongs to Direct Polls (i24), and Channel 14's firm is new.

### Why the 2026 gap might be 8–12 seats rather than 2

Next Data's own CEC filings document these methodological choices (read in full:
[15 Sep](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election73/he/Survey_4150.pdf),
[28 Sep](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election89/he/Survey_4175.pdf),
[1 Oct](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election91/he/Survey_4176.pdf),
[19 Oct](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election126/he/Surveyl_4236-4233.pdf)):

- **Fixed 2022 bloc ratio.** The Sep 28 filing states that the total for every content question and the
  prime-minister question "is computed at a fixed ratio of 54% coalition-2022 voters and 46%
  opposition-2022 voters", with weights inside each bloc by gender, region, religiosity and ideological
  position.
  - The Oct 19 filing says the data are weighted by age, gender, region, religiosity, **ideology and 2022
    vote**. It does not say whether the seat question uses the same 54/46 frame.
  - In 2022 the coalition lists (Likud, RZP–Otzma, Shas, UTJ, Jewish Home) won **49.6%** of the valid
    vote, against about 49% for the opposition lists. 54% is roughly their 2022 *seat* share, 64/120.
  - If the vote question is weighted the same way, that alone overweights 2022 coalition voters by about
    4 points. With about 85% of them staying in the bloc, that is roughly **+3 to +5 bloc seats**.
    *(Inference from the filing, not stated by the firm.)*
- **Almost no undecided.** Reported undecided was 4.0%, 3.2%, 1.2% and 0.6% across the four filings. By
  contrast, Channel 13's filing
  ([Survey_4193](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election101/he/Survey_4193.pdf))
  reports 11.3% undecided among Jewish adults. Asked which way they lean, those undecided named Yashar
  (16%), Amcha (10%), B'Yachad (9%), YB (6%) and Likud (4%), and 38% did not know. So forcing the
  undecided to choose would not, on Channel 13's data, produce Likud 30.
- **Raw shares, not only allocation.** Next Data's raw Likud share is 22.5–24.9% of respondents. Channel
  13's unweighted Jewish-adult sample has Likud at 15.1%. The difference is in who is sampled and how they
  are weighted, not in rounding or seat allocation.
- **An unusual respondent pool.** In Next Data's panel, 96% say they will certainly vote; it projects
  67.8% turnout by scaling 2022's 69.6%.

**Neutral assessments in 2026.**
- Israel Policy Forum (Aug 20) calls the gap "much larger than in previous elections" and its cause
  "unclear". It says the gap likely reflects differing assumptions about undecided voters and demographic
  weighting, "barring a very different sampling approach or outright political bias".
- A Times of Israel blog by Haim V. Levy (Sep 25) notes that Channel 14 "gives substantially less detail
  about sampling, weighting, interviewing mode", while stressing that this "doesn't prove one poll is
  better"
  ([link](https://blogs.timesofisrael.com/same-night-same-election-fourteen-different-seats/)).
- Eran Halperin in Haaretz (Aug 30) argues that Filber's numbers mix "research and interpretation"
  ([link](https://www.haaretz.co.il/opinions/2026-08-30/ty-article-opinion/.premium/000001a0-5334-d3eb-abf5-577f5b440000)).
- The Media Line, Oct 21: "Both cannot be accurate descriptions of the electorate"
  ([link](https://themedialine.org/top-stories/israels-election-the-polls-are-split-and-so-is-the-press/)).
- Defenders argue that the field is herding. A Maariv column by Dror Refael is titled "Filber sees what
  almost every pollster misses, or is hugely wrong"
  ([link](https://www.maariv.co.il/breaking-news/article-1363118); headline only).
- I found no neutral analyst who endorses the Channel 14 or i24 level.

**Evidence on the other side.**
- **DRI, an independent pollster not in our list**, published polls in September (n ≈ 1,900–2,200,
  online plus panel) with Likud at 25–26 and the bloc at 59
  ([Survey_4133](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election59/he/Survey_4133.pdf),
  [Survey_4154](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election76/he/Survey_4154.pdf)).
  The Center for Israel Education reports DRI at 60 late in the campaign
  ([link](https://israeled.org/israeli-election-watch-8/)).
- On the other side of the field, Channel 16 / Maagar Mochot (n > 5,000) has Likud at 17.
- So the right-leaning reading is not Filber's alone. Pollsters also disagree more widely than our nine
  show, in both directions.
- The field has understated the bloc in 4 of the last 5 elections. Online panels plausibly under-reach
  Haredi and peripheral voters.

### The three options, evaluated

**Historical test, 2020–22.**
- Direct Polls sat 1.7, 2.7 and 1.7 seats above the field, and the field missed by +0.7, +1.7 and +3.7.
- Adding Direct Polls to the field improved the backtest: MAE 1.46 against 1.50, mean absolute bloc error
  1.20 against 1.41.
- The out-of-sample alternative (field without Direct Polls, plus a lean estimated only from earlier
  elections) did equally well on the bloc: mean absolute error 1.68 against 1.70.
- So historically, options (a), (b) and (c) were nearly the same, because Direct Polls' lean and the
  field's miss were the same 2 seats. They split only this year.

**2026, replayed through `forecast.mjs`:**

| Option | Lean | Net / Opp | Likud | Yashar | B'Yachad | YB | P(net ≥ 61) | Pass: Res / Amcha |
|---|---|---|---|---|---|---|---|---|
| (a) exclude both, lean +1.7 (current) | 1.7 | 52 / 54 | 21 | 23 | 14 | 8 | 5% | 45 / 43 |
| (b) include both, full weight, no lean | 0 | 55 / 51 | 24 | 22 | 13 | 7 | 10% | 24 / 13 |
| (b′) include both and keep the lean (algorithm memo's sensitivity row) | 1.7 | 56 / 50 | 25 | 21 | 13 | 7 | 20% | 20 / 16 |
| (c1) include, fully de-housed (centred on the field) | 1.7 | 52 / 54 | 21 | 22 | 15 | 8 | 4% | 44 / 34 |
| **(c2) include, corrected to Direct Polls' historical +2 over the field; lean recomputed with DP in the historical field** | 1.5 | **53 / 53** | 22 | 22 | 14 | 8 | 5% | 40 / 30 |
| (c4) i24 only, corrected by its historical −2 only (excess kept); Channel 14 out | 1.5 | 53 / 53 | 22 | 22 | 14 | 8 | 6% | 44 / 44 |
| (c6) both, half the 2026 excess treated as signal | 1.5 | 54 / 52 | 23 | 22 | 14 | 7 | 10% | 30 / 23 |
| (c5) both, all of the excess treated as signal | 1.5 | 55 / 51 | 24 | 22 | 13 | 7 | 14% | 26 / 19 |

**Reading.**
- **The 2020–22 record supports one claim only:** Direct Polls' lean of about +2 over the field was in
  the right direction and about the right size. That is exactly what the lean already encodes, which is
  why (a), (c1) and (c2) land within one seat of each other.
- **What (b) adds is the 2026 excess:** +6 for i24 and +10 for Channel 14 beyond the historical +2. For
  that excess to be signal, the field would have to miss the bloc by 8–12 seats. The worst field miss
  since 2015 is 3.7.
- **The excess has documented methodological causes:**
  - a fixed 2022 bloc frame that overweights 2022 coalition voters;
  - ideology and 2022-vote weights;
  - about 1% undecided;
  - a channel-owned firm with no record;
  - a firm (Direct Polls) that lost its founder;
  - an i24 gap that has been shrinking.
- **A rough expected-score view.**
  - Suppose about 15% probability that the excess is real signal, with the bloc at about 59. That is
    generous given the record, but DRI and the herding argument deserve some weight.
  - The rest of the probability goes to the field-plus-lean view, around 52.
  - The mixture's median, which minimises expected absolute bloc error, is about 52.5–53. That is the
    point (c2) produces.
  - "Neither bloc at 61" stays the modal outcome under every option except n-weighting.

## 5. Recommendations

Each recommendation lists its evidence and its expected effect on the central forecast (`point`), the
quantity that is scored.

| # | Recommendation | Evidence | Expected effect on 2026 |
|---|---|---|---|
| 1 | **No accuracy-based pollster weights.** Keep weights at sqrt(n) and never use raw n. | Firm-to-firm MAE sd 0.1–0.3 seats. Rank persistence ρ = 0.39 (MAE) and 0.24 (bloc). Backtest gain ≤ 0.02 seats. The best past firm (Smith) is absent in 2026. n-weighting would give Channel 14's n = 7,937 poll about half the weight. | None. |
| 2 | **Weight by firm, not by outlet:** split a firm's weight across its outlets (Lazar: Maariv and Walla; Kantar: Kan 11 and Israel Hayom). Use rule B2, which keeps both polls at half weight; B, keeping only the latest per firm, is also acceptable. | House effects are firm properties. The historical backtest already groups by firm, and grouping polls by client instead ("all polls") scored worse (1.53 against 1.46). | B2: 0 seats now (P(Res) 45 → 42, P(Amcha) 43 → 45). B: bloc +1 (53), Likud +1, Yashar −1. Protects against double-counting one panel. |
| 3 | **Final-week window of 7 days, latest poll per firm. No decay, no last-two, no momentum.** | Latest-per-firm is the best or tied-best rule in 2019–22 (MAE 1.46, bloc 1.20). Rules that admit older polls lose 0.03–0.07 MAE and 0.2–0.6 bloc. T−7 averages are 0.22 MAE and 1.3 bloc worse than T0. Momentum is not robust (helped 2 of 5). | 0 seats now. It drops Israel Hayom's Oct 8 poll: P(Res) about 41, P(Amcha) about 46. |
| 4 | **Filber, option (c2):** include i24NEWS and Channel 14. Remove each firm's 2026 house effect, estimated per list against the field over ±5 days, *except* +2 bloc seats, which is Direct Polls' 2020–22 lean over the field, kept pro rata across lists. Recompute the lean with Direct Polls counted in the historical field (+1.5 instead of +1.7). | Direct Polls' 2020–22 record supports a +2 lean, not +8 to +12. Next Data is new, channel-owned and non-compliant, and documents weighting choices that plausibly explain much of the excess. No neutral 2026 assessment backs the level. A mixture's median sits at 52.5–53. | **Bloc 52 → 53**, Likud 21 → 22, Yashar 23 → 22. Mean list change 0.15 seats. P(61) about 5%; "neither" still modal. Threshold calls unchanged (Res about 35–40%, Amcha about 30%, both "fail"). |
| 4′ | If (c2) is judged too complex for the last four days, **keep (a)**. | (a) and (c2) differ by under a seat on the bloc. | Status quo, 52. |
| 5 | **Do not adopt (b), full inclusion,** or the "all nine plus lean" sensitivity row as the headline. | (b) imports the unexplained 2026 excess. (b′) counts the historical lean twice. | (b) would move the bloc +3 (55) and Likud +3 (24), and push both threshold lists to 13–24%. |
| 6 | **Housekeeping.** (i) Re-run the forecast: `data/forecast.json` lists Maariv's Oct 16 poll, but `polls.json` now has Maariv's Oct 22 poll (n = 1,048). The re-run gives the same central result, with P(61) 5% instead of 6%. (ii) Correct the "Filber's firms" wording (Next Data / Filber; Direct Polls / Zuriel Sharon). (iii) In `shares()`, `parseFloat("<1%")` returns NaN, which turns a whole poll to NaN. No current poll triggers it, but an i24 poll with "<1%" would under `FILBER=1`. | — | None on the numbers. |

All of the recommended changes together (firm-split weights, 7-day window, Filber via (c2), lean +1.5):
bloc 53 / 53 / 14 / 0; Likud 22, Otzma 8, Shas 8, UTJ 8, RZ 7, Yashar 22, B'Yachad 14, Democrats 9,
YB 8, Joint List 9, Ra'am 5; P(net ≥ 61) 5%; pass probabilities Reservists 35%, Amcha 30%, Ra'am 92%.

**The honest bottom line.** In 2026, poll weighting and windowing are not where the score will be won.
Every defensible rule lands within one seat of 52 on the bloc and makes the same threshold and majority
calls. The scored outcome will be decided by:
- the size of the lean, which belongs to Researcher B and the calibration;
- the two threshold lists, which each move about 4 seats of per-list error (Researcher C);
- whether the field's 2026 miss resembles its history. That is the Filber question, and the evidence
  answers it "mostly method; keep the +2".

## Sources

- Wikipedia opinion-polling pages for
  [Apr 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election),
  [Sep 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election),
  [2020](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election),
  [2021](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election),
  [2022](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election) and
  [2026](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election)
  (pollster/publisher table). Raw wikitext read 2026-10-23.
- [Wikipedia, Shlomo Filber](https://en.wikipedia.org/wiki/Shlomo_Filber): Direct Polls founded by
  Filber; he left in June 2025.
- Central Elections Committee poll filings: Next Data / Channel 14
  [4150](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election73/he/Survey_4150.pdf),
  [4175](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election89/he/Survey_4175.pdf),
  [4176](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election91/he/Survey_4176.pdf),
  [4236](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election126/he/Surveyl_4236-4233.pdf);
  Direct Polls / i24
  [4178](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election92/he/Survey_4178.pdf),
  [4199](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election104/he/Survey_4199.pdf);
  Channel 13
  [4193](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election101/he/Survey_4193.pdf);
  DRI
  [4133](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election59/he/Survey_4133.pdf),
  [4154](https://www.gov.il/BlobFolder/dynamiccollectorresultitem/knesset_election76/he/Survey_4154.pdf).
- [Israel Policy Forum, "Israeli Election Polls & Pollsters", Aug 20, 2026](https://israelpolicyforum.org/2026/08/20/israeli-election-polls-pollsters/).
- Haaretz:
  [May 18](https://www.haaretz.com/israel-news/israel-politics/2026-05-18/ty-article/.premium/channel-14-aired-election-polls-by-firm-it-formed-without-disclosing-ownership/0000019e-39f1-dd4b-a7be-fdf1e4390000),
  [Aug 14](https://www.haaretz.com/israel-news/israel-politics/2026-08-14/ty-article/.premium/right-wing-channel-14-failed-to-report-legally-required-election-poll-data/0000019f-feff-d222-abbf-ffffaef80000),
  [Aug 18 (Hebrew)](https://www.haaretz.co.il/news/elections/2026-08-18/ty-article/000001a0-0f5e-db35-afee-7ffe6c0a0000),
  [Halperin op-ed, Aug 30](https://www.haaretz.co.il/opinions/2026-08-30/ty-article-opinion/.premium/000001a0-5334-d3eb-abf5-577f5b440000).
  Paywalled pieces were read only through their summaries.
- The Seventh Eye:
  [2024 municipal exit-poll audit](https://www.the7eye.org.il/513107) and
  [2026 polls feed](https://www.the7eye.org.il/topic/%D7%A1%D7%A7%D7%A8%D7%99%D7%9D).
- [Times of Israel blog, Haim V. Levy, Sep 25, 2026](https://blogs.timesofisrael.com/same-night-same-election-fourteen-different-seats/);
  [The Media Line, Oct 2026](https://themedialine.org/top-stories/israels-election-the-polls-are-split-and-so-is-the-press/);
  [Center for Israel Education, Election Watch, Oct 23](https://israeled.org/israeli-election-watch-8/);
  [Maariv, Dror Refael](https://www.maariv.co.il/breaking-news/article-1363118) (headline only).
- theMadad, [Poll accuracy 2022](https://themadad.com/english/poll-accuracy-2022/). The page returns
  403 here; its figures were taken from search excerpts and are unverified.
- [Times of Israel, Jan 27, 2015 (Project 61)](https://www.timesofisrael.com/how-a-28-year-old-analyst-is-fixing-israels-polls/).
- [israel-polls-2026 tracker](https://israel-polls-2026.pages.dev/) (centred house-effect method).
