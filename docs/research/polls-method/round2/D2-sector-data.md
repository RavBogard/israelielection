# D2: sector turnout, sector poll gaps and undecided handling (data for the turnout model)

2026-10-24 · Agent D2, research round 2 · Scope: the tables a sector turnout model (agent B) needs for 2013–2022,
2026 expectations published before 2026-10-23 that are not seat polls, and how each pollster treats undecided
respondents and the threshold. Data agent: no model change is proposed, so there is no backtest row (see §6).

## Summary

1. **Four data files were built in `scripts/forecast/round2/data/`, each from a script.**
   - `turnout.json`: overall, Arab, Haredi-city and implied general-sector turnout for every election 2013–2022. It
     also holds the analysis rows and the 2026 expectations.
   - `turnout-cec.json`: the raw sector sums behind `turnout.json`.
   - `sector-gaps.json`: the final-week field against the result, by sector, in seats and in vote share.
   - `undecided.json`: how each pollster handles undecided respondents and sub-threshold lists.
   
   The Arab and Haredi turnout figures are **recomputed from the Central Elections Committee's (CEC) per-locality
   results**, not copied from press. They reproduce the published Arab series: exactly for 2022 (938,401
   registered, 498,894 voters, 53.2%) and within 0.2 points for every other election.
2. **Arab turnout swings far more than anything else in the electorate.** By the standard definition (Arab and
   Druze localities), it was 56.3, 63.5, 49.2, 59.2, 64.8, 44.6 and 53.2% from 2013 to 2022. The moves between
   elections were +7, −14, +10, +6, −20 and +9 points.
   - The general sector stayed between 69 and 73% throughout.
   - Haredi cities stayed between 76 and 83%.
3. **The Arab turnout change explains most of the Arab lists' poll miss.** Across the six elections under the 3.25%
   threshold:
   - **Fit:** the miss in vote share is about **+0.5 + 0.097 × (change in Arab turnout, points)**, with r = 0.93.
     The sign matched 6 of 6 times.
   - **Out of sample:** predicting each election from the other five gives a mean absolute error of **0.49
     points**, against 1.24 points for predicting no miss.
   - **How much of the swing the polls catch:** a +1-point rise in Arab-locality turnout mechanically adds about
     0.18 points to the Arab lists' share. The polls miss about 60% of that mechanical effect, so they capture
     roughly 40% of the turnout swing. On top of that there is a constant under-polling of about +0.4 points.
   - **Caveat:** six points, and two of them (2019-04 and 2021) drive the negative side.
4. **The Shas + UTJ under-polling is Shas's, and it does not track turnout.**
   - **The miss:** Shas missed by +1.0 point on average (5 of 6 elections; +1.4 seats). UTJ missed by −0.01 points.
   - **Haredi cities:** neither miss moves with Haredi-city turnout (r = −0.13). Turnout there fell 3 points in
     April 2019, the year Shas beat its polls by 1.6 points.
   - **Shas strongholds:** the miss barely moves with turnout in a fixed set of 11 Shas-stronghold towns relative to
     the general sector (r = 0.21). Only 11–16% of Shas votes are cast in Haredi cities.
   - **Reading:** the sources and these data point to **non-response and late decision**, not a turnout surge.
     The direct source evidence for that mechanism is thin (§4).
5. **Undecided handling is mostly undisclosed.**
   - **The only pollster that says its seats include allocated undecideds** is Channel 12 (Midgam: "the raw data do
     not take into account the cracking of the undecided").
   - **Channel 13** (Rosner/Madad) asks undecided respondents which list they lean to. It builds seats from separate
     Jewish, young, Haredi and Arab samples weighted by "the sectors' weights in the population". That makes it an
     explicit, though undisclosed, sector-turnout model.
   - **Reported undecided shares:**

     | Pollster | Undecided share reported |
     |---|---|
     | Next Data (Channel 14) | 0.6–4% |
     | Lazar (Maariv, Walla) | 5–6% |
     | Midgam (Channel 12) | about 10% |
     | Channel 13, Jewish adults | about 11% |
     | Kantar (Kan, Israel Hayom), Direct Polls (i24NEWS) | none reported |
   - **Sub-threshold lists:** every 2026 pollster prints a percentage for them. Direct Polls prints one only at 1% or
     more.
6. **A quirk for the synthesis, and a constraint on reading 2013.**
   - **April 2019 field.** `model.mjs` drops a whole outlet when any of its polls in the file was by a Filber firm.
     Kan 11 commissioned one Direct Polls poll on 17 March 2019, so the April 2019 field loses Kan's Kantar poll of
     4 April. `sector-gaps.json` reproduces this on purpose, to stay consistent with the model.
   - **2013 row.** It is computed from D1's `data-full/2013-01.json` (final 28 days). That election had a 2%
     threshold and 4.1% of the vote went to lists the polls did not report, so its vote-share gaps are rougher than
     the others.

## 1. What was built, and how to rebuild it

| File | Script | What |
|---|---|---|
| `scripts/forecast/round2/data/turnout-cec.json` | `python3 -I scripts/forecast/round2/D2/sector_turnout.py CACHE_DIR --write` | CEC final results by locality for the 19th–25th Knesset (data.gov.il, dataset `votes-knesset`, CKAN datastore API) joined to the CBS locality file (`bycode2022.xlsx`, field `דת יישוב`). Registered, voters and valid votes, plus Arab-list, Shas and UTJ votes, by sector, with the Shas-stronghold set. Downloads go to CACHE_DIR (use the scratchpad). |
| `scripts/forecast/round2/data/sector-gaps.json` | `node scripts/forecast/round2/D2/gaps.mjs --write` | Final-week field against result, by sector, per election (2013 from `data-full/2013-01.json`, 2015–2022 from `backtest/data/`). |
| `scripts/forecast/round2/data/turnout.json` | `node scripts/forecast/round2/D2/build-turnout.mjs` | The turnout table with the published comparison figures and URLs, the analysis rows and fits of §3–4, and the 2026 expectations. Run it after the two above. |
| `scripts/forecast/round2/data/undecided.json` | `node scripts/forecast/round2/D2/undecided.mjs` | Hand-curated from 33 CEC poll filings (2 Sep–19 Oct 2026) and press, with links. |

### Definitions

- **Arab sector.** Localities the Central Bureau of Statistics (CBS) classes as non-Jewish (2) or Bedouin tribe (3).
  - **Why this definition:** it is the definition behind the Dayan Center / IDI / INSS series (Rudnitzky). It
    reproduces their 2022 counts exactly.
  - **What it leaves out:**
    - the mixed cities (Haifa, Jerusalem, Lod, Ramla, Akko, Tel Aviv-Jaffa, Nof HaGalil, Ma'alot-Tarshiha);
    - Arabs living in Jewish localities;
    - double envelopes.
  - **Druze:** Druze localities are included.
  - **Coverage of the Arab lists' vote:** 83–87% of all Arab-list votes are cast in these localities. The share
    falls over time as the mixed cities grow.
- **Haredi sector.** The Haredi cities: Bnei Brak, Modi'in Illit, Beitar Illit, El'ad, Immanuel, Rechasim and
  Kiryat Ye'arim.
  - These hold about 3% of registered voters, 35–40% of UTJ's votes and 11–16% of Shas's.
  - Jerusalem's and Beit Shemesh's Haredi neighbourhoods are not included. That would need ballot-box files and a
    neighbourhood list, which I did not build. No published per-election Haredi-sector turnout series was found.
- **General (implied).** National minus the two sectors.
  - All double-envelope votes are assigned here (soldiers, diplomats and others; 5–10% of all voters).
  - About 10% of registered voters live abroad, almost all in this sector. Resident general-sector turnout is
    therefore several points higher than the figure shown.
- **Turnout** is voters divided by registered.
  - The 2013 locality file has no double-envelope row, so national totals come from the official figures (English
    Wikipedia's `{{Election results}}`, CEC numbers).
  - 2013's "change from previous" uses Dayan's published 2009 figure (53.4%), a slightly different reckoning.

## 2. Turnout table

Source: `turnout.json` (CEC locality files; "published" is the Dayan Center / IDI figure, URL in the file).

| Election | Overall | Arab & Druze localities | Change | Published | Arab lists' share of Arab-locality vote | Haredi cities | Shas+UTJ share there | General (implied) | Shas strongholds minus general |
|---|---|---|---|---|---|---|---|---|---|
| 2013-01 | 67.77 | 56.31 (697k reg.) | +2.9 | 56.5 | 77.2 | 81.61 | 86.7 | 68.98 | −3.48 |
| 2015-03 | 72.34 | 63.51 (748k) | +7.2 | 63.5 | 82.4 | 82.71 | 83.4 | 73.31 | −1.93 |
| 2019-04 | 68.46 | 49.21 (849k) | −14.3 | 49.2 | 70.8 | 79.70 | 89.0 | 71.14 | −1.49 |
| 2019-09 | 69.83 | 59.16 (858k) | +10.0 | 59.2 | 80.6 | 80.12 | 90.4 | 71.17 | −0.35 |
| 2020-03 | 71.52 | 64.81 (873k) | +5.7 | 64.8 | 87.6 | 79.72 | 91.3 | 72.30 | +0.27 |
| 2021-03 | 67.44 | 44.59 (900k) | −20.2 | 44.6 | 80.2 | 76.36 | 88.8 | 70.87 | −1.83 |
| 2022-11 | 70.63 | 53.16 (938k) | +8.6 | 53.2 | 85.8 | 79.15 | 90.3 | 73.21 | +1.83 |

How sound each figure is:

- **Well-sourced:**
  - overall turnout (official);
  - Arab-locality turnout (official counts; it agrees with the literature, which has two independent sources for
    2015 and 2021 counts).
  - The Arab lists' share of the Arab-locality vote matches Rudnitzky's series (77.2, 83.2, 71.6, 81.6, 87.6, 80.1,
    85.8) within 1 point.
- **Exact but partial:** Haredi-city turnout. These are exact counts for a partial definition; they are not "Haredi
  turnout".
- **Estimates:**
  - "general (implied)" (it carries double envelopes and voters abroad);
  - the Shas-stronghold set.
  - The stronghold set is 11 Jewish non-Haredi towns with at least 5,000 registered voters and Shas at 12% or more
    in 2015: Beit She'an, Beit Shemesh, Dimona, Migdal HaEmek, Netivot, Ofakim, Or Yehuda, Kiryat Malachi, Tiberias,
    Yeruham and Safed. Beit Shemesh has a large Haredi population, so this set is a proxy.

## 3. Sector poll-to-result gaps

Source: `sector-gaps.json`, from `gaps.mjs`.

- **The field** is model.mjs's own: the latest poll per outlet within 7 days of the newest poll, Filber-firm outlets
  dropped, and outlets of one firm sharing its weight.
- **Seats** are the field's weighted mean of printed seats; a list below the threshold counts as 0.
- **Vote share** uses model.mjs's seats-to-shares conversion: the threshold-aware D'Hondt midpoint, sub-threshold
  lists at their printed %, and the model's 1.5% fringe.
  - `gaps.mjs` re-implements the conversion so it can use 2013's 2% threshold.
  - It checks itself against `forecast()` to within 0.01 points for every list in 2015–2022.
- **Gap** = result minus polls.
- **Groups:** "rest of the Netanyahu bloc" and "neither camp" follow each backtest file's `blocs`.

| Election | Outlets | Arab lists, seats (polls → result) | Arab, pts | Shas+UTJ, seats | Shas+UTJ, pts | Shas, pts | UTJ, pts | Rest of Netanyahu bloc, seats | pts | Zionist opposition, seats | pts | Neither camp, seats | pts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2013-01 | 11 | 10.55 → 11 (+0.45) | +0.05 | 16.33 → 18 (+1.67) | +0.76 | +0.40 | +0.36 | 49.5 → 43 (−6.5) | −5.24 | 32.16 → 29 (−3.16) | −3.07 | 11.39 → 19 (+7.61) | +4.90 |
| 2015-03 | 15 | 12.68 → 13 (+0.32) | +0.29 | 13.94 → 13 (−0.94) | −0.96 | −0.45 | −0.51 | 43.15 → 44 (+0.85) | +2.69 | 41.38 → 40 (−1.38) | −2.16 | 8.94 → 10 (+1.06) | +0.10 |
| 2019-04 | 10 | 10.38 → 10 (−0.38) | −1.00 | 11.81 → 16 (+4.19) | +2.16 | +1.63 | +0.53 | 52.94 → 49 (−3.94) | +0.68 | 44.87 → 45 (+0.13) | −1.14 | — | — |
| 2019-09 | 9 | 11.07 → 13 (+1.93) | +1.55 | 14.43 → 16 (+1.57) | +1.45 | +1.64 | −0.19 | 41.22 → 39 (−2.22) | −2.00 | 41.92 → 44 (+2.08) | +1.12 | 11.36 → 8 (−3.36) | −1.57 |
| 2020-03 | 8 | 14 → 15 (+1.00) | +1.36 | 15.58 → 16 (+0.42) | +0.74 | +0.87 | −0.13 | 41.66 → 42 (+0.34) | +1.43 | 42.09 → 40 (−2.09) | −1.18 | 6.67 → 7 (+0.33) | −1.21 |
| 2021-03 | 7 | 11.66 → 10 (−1.66) | −1.35 | 15 → 16 (+1.00) | +0.57 | +0.61 | −0.04 | 35.16 → 36 (+0.84) | +1.66 | 48.57 → 51 (+2.43) | +1.43 | 9.58 → 7 (−2.58) | −1.49 |
| 2022-11 | 8 | 8 → 10 (+2.00) | +1.89 | 15.34 → 18 (+2.66) | +1.82 | +1.53 | +0.29 | 44.84 → 46 (+1.16) | −0.30 | 51.84 → 46 (−5.84) | −2.80 | 0 → 0 | −0.61 |

Mean over the six elections under 3.25%:

| Group | Mean miss (seats) | Mean miss (points) | Mean absolute miss (seats) |
|---|---|---|---|
| Arab lists | +0.54 | +0.46 | 1.22 |
| Shas + UTJ | +1.48 | +0.96 | — |
| Shas | +1.43 | +0.97 | — |
| UTJ | — | −0.01 | — |

Notes:
- **Seat gaps and share gaps differ when lists fail the threshold.** In April 2019 the rest of the Netanyahu bloc
  was +0.7 points but −3.9 seats, because New Right and Zehut wasted their votes. 2022's opposition −5.8 seats is
  mostly Meretz's failure.
- **The 2013 "neither camp" (+7.6 seats) is Yesh Atid's late surge.** It is not a sector effect.

## 4. First-order facts for agent B

### 4.1 Arab turnout: how much it varies, and how much of the poll miss it explains

| Election | Arab turnout | Change | Mechanical effect (pts)\* | Arab poll miss (pts) | Arab poll miss (seats) |
|---|---|---|---|---|---|
| 2013 | 56.3 | +2.9 | +0.42 | +0.05 | +0.45 |
| 2015 | 63.5 | +7.2 | +1.07 | +0.29 | +0.32 |
| 2019-04 | 49.2 | −14.3 | −1.97 | −1.00 | −0.38 |
| 2019-09 | 59.2 | +10.0 | +1.59 | +1.55 | +1.93 |
| 2020 | 64.8 | +5.7 | +0.96 | +1.36 | +1.00 |
| 2021 | 44.6 | −20.2 | −3.34 | −1.35 | −1.66 |
| 2022 | 53.2 | +8.6 | +1.55 | +1.89 | +2.00 |

\* The Arab lists' actual share minus their share had Arab-locality turnout stayed at the previous election's level,
everything else fixed. The Arab electorate's votes are scaled by prev/now. Each point of Arab turnout is worth about
0.17–0.18 points of Arab-list share, about 0.2 seats.

- **The fits** (`build-turnout.mjs` prints them):

  | Fit | Elections | Intercept (pts) | Slope | r |
  |---|---|---|---|---|
  | miss on turnout change | 6 (2015–2022) | +0.51 | 0.097 per point | 0.93 |
  | miss on turnout change | 7 (2013–2022) | +0.40 | 0.095 per point | 0.91 |
  | miss on mechanical effect | 7 | +0.37 | 0.60 | 0.92 |

  - **Leave-one-out over the six:** mean absolute error 0.49 points, against 1.24 for a zero prediction. Predicted
    against actual: 2015 +1.49/+0.29, Apr 2019 −0.81/−1.00, Sep 2019 +1.44/+1.55, 2020 +0.98/+1.36, 2021
    −1.64/−1.35, 2022 +1.14/+1.89.
  - **Where it fails:** the out-of-sample miss is worst in 2015, the Joint List's first run. Polls already expected
    a rise there.
- **Interpretation.**
  - **A lagged turnout anchor.** Polls behave as if they anchored Arab turnout near the previous election's level
    and moved about 40% of the way to the actual level. That fits Rosner's statement that pollsters must estimate
    sector turnout, and it fits Channel 13's explicit sector weights.
  - **A small constant on top.** A residual under-polling of about +0.4–0.5 points remains, roughly half a seat.
- **For the 2026 model** (a conditional statement, not a forecast):
  - **If Arab turnout rises from 53.2% to 60–63%**, the fit implies the final polls under-state the Arab lists by
    about **+1.2 to +1.5 points (1.5–2 seats)**.
  - **If it falls back to about 48%**, they would over-state them by about 0.
  - **The scenarios:**

    | Arab-locality turnout | Arab lists' mechanical share, all else at 2022 |
    |---|---|
    | 48% | 9.8% |
    | 53.2% | 10.7% |
    | 58% | 11.6% |
    | 60% | 11.9% |
    | 63% | 12.4% |
    | 65% | 12.8% |

  - **Caution 1: the turnout expectations come from inside the polls' own world.** Stat-Net, which projects 63%, is
    one of Channel 13's polling partners. Channel 13 may therefore already carry part of the rise.
  - **Caution 2: do not double count.** Version 2 already adds +0.5 points per Arab list as a prior class. With two
    Arab lists in 2026, that is +1.0 point, which already exceeds the regression's constant (+0.5). A turnout term
    should replace the per-list Arab priors, not sit on top of them.
- **2026 expectations, none of them a seat poll** (`turnout.json` `expectations2026`, all published before Oct 23):
  - **Stat-Net:** 63% Arab turnout. Its own 2022 baseline is 56%; on this file's definition 2022 was 53.2%
    (ToI/Reuters, Oct 21).
  - **Konrad Adenauer Program:** 53% as things stood, 67% if the Joint List reunited (May 2026); 52.4% / 61.8%
    (Nov 2025). Hadash–Ta'al–Balad did reunite; Ra'am runs separately.
  - **Track record:** projections missed 2022 by 4–13 points on the low side (40.5%, 49%, below 40%, against 53.2%).
  - **Overall turnout:** no official projection exists. Next Data scales 2022's turnout to 67.8%. Polymarket's
    thin market puts about 60% on 72% or more. Diplomatic-mission voting rose 17 points (tiny n).

### 4.2 Haredi lists: turnout or non-response?

- **Haredi-city turnout is high and flat:** 76–83%, a range of 6.4 points over seven elections, against 20 points
  for the Arab sector.
  - Its largest fall, −3.4 in 2021, came during Covid restrictions.
  - Its next largest, −3.0 in April 2019, came in the election with Shas's largest miss.
- **UTJ is polled almost exactly.** The mean miss is −0.01 points and the largest is 0.5. Turnout variation among
  UTJ's voters is small and the polls track it. 35–40% of UTJ's vote is cast in these cities.
- **Shas is the miss:** +1.0 point and +1.4 seats on average, under-polled in 5 of 6 elections.
  - Shas's vote is mostly outside Haredi cities: only 11–16% is cast there. It is concentrated in traditional
    Mizrahi towns.
  - **Turnout test:** I fixed a set of 11 Shas strongholds on 2015 results and compared each election's change in
    their turnout, relative to the general sector, with Shas's miss. The correlation is r = 0.21 (slope 0.09 points
    of miss per point of relative turnout). Against Haredi-city turnout it is r = −0.13. Shas beat its polls in
    2021 even though stronghold turnout fell 2.1 points relative to the general sector.
  - **Conclusion:** turnout does not explain the Shas miss in these data.
- **What the sources say:**
  - **Non-response:** Gershuni-Aylho (Project 61; ToI, 27 Jan 2015) attributes Haredi and Arab under-polling to
    non-response: these groups answer phone polls less.
  - **Late or label answers:** undecided respondents name a large party.
  - **Phone timing:** one columnist argues that phone polls fielded on Saturdays or at prayer times miss observant
    voters (round 1 B §3.3, via search summary).
  - **No source found** attributes Shas's miss to turnout.
  - **2026 filings:** Channel 13's Haredi oversample shows 66% "certain to vote", against about 79% actual
    Haredi-city turnout, and its Haredi sample has a 15.9% response rate. Stated intention under-states Haredi
    turnout. A pollster that down-weights by stated likelihood would under-poll Haredi lists. That is a weighting
    mechanism, not a turnout swing.
- **Recommendation to B.** Model Shas's miss as a **constant non-response bias**: version 2's +0.8-point prior, which
  held in both halves of the record. Do not tie it to a turnout term. Do not give UTJ a turnout or bias term. A
  Haredi turnout swing term would be fitted to noise: Haredi-city turnout has an sd of about 2 points, and the
  observed seat effect is nil.

### 4.3 General sector

Implied general turnout, double envelopes included, ran 69.0, 73.3, 71.1, 71.2, 72.3, 70.9 and 73.2%: a range of
4.3 points, and 2.4 points after 2013. The changes in overall national turnout between elections are mostly the Arab
sector:
- In 2021 national turnout fell 4.1 points while general turnout fell 1.4.
- In 2022 national turnout rose 3.2 points while general turnout rose 2.3.

A general-sector swing term is not identified from six elections. Keep it in the bloc noise.

## 5. Undecided respondents and the threshold, by pollster (`undecided.json`)

| Pollster (firm) | Undecided reported (2026 filings) | Treatment / seats after allocation? | Turnout or sector handling | Sub-threshold lists |
|---|---|---|---|---|
| Maariv (Lazar / Panel4All) | 5.2–6.4% | Raw % of decided; no allocation stated | Asks likelihood to vote (78% certain overall, Oct 8–9) | % printed, 0 seats |
| Walla (Lazar) | Not given; 5% "still undecided" on certainty | As Maariv | — | % printed |
| Channel 12 (Midgam, Mano Geva) | 10.2% (Sep 9) | **Seats include "cracking of the undecided"** (method undisclosed) | — | % printed, 0 seats |
| Channel 13 (Rosner/Madad: Panel Project HaMidgam, Stat-Net, Askaria) | Per sample: Jewish adults 11–12%, Haredi 6–10%, Arab 10–11% | Asks undecideds' leaning; seats "by the sectors' weights in the population" | **Explicit sector model**, four samples; vote likelihood asked per sample | % printed |
| Kan 11 (Kantar) | None reported | Not stated | Not stated | % printed |
| Israel Hayom (Kantar) | None reported | Not stated | Not stated | "Tested, did not pass" block with % |
| i24NEWS (Direct Polls) | None reported | Not stated | Online panel, 6% response | % only for lists at 1% or more; the rest named "under 1%" |
| Channel 14 (Next Data) | 4.0% → 1.2% → 0.9% → 0.6% | Seats exclude the undecided | Fixed 54/46 2022-coalition/opposition frame, 2022 non-voters counted with the coalition; turnout projected at 67.8% | Separate block with % |
| Zman Yisrael (Tatika / Adgenda) | Not for the vote question | Not found | Stratified by age, religion, gender, region | % printed |
| Yedioth, Ynet, Makor Rishon, Haaretz | No 2026 polls and no filings found | — | — | — |

**2019–2022:**
- **Undecided statements:** hardly any were found.
  - Camil Fuchs, who polled for Channel 13 in 2021–22 and for Haaretz: most undecideds lean centre-left. He places
    them with an extra bloc question (ToI, 23 Jul 2020).
  - Gershuni-Aylho: 20–50% undecided in campaign polls (2006–2013).
- **Sub-threshold percentages:** printed in almost every entry from April 2019 on, per the backtest files. The
  exceptions are 103fm (April 2019) and one Knesset Channel poll (Sep 2019). In 2015 the polls mostly did not show
  sub-threshold lists at all.

**Not found:** method statements for Kantar, Direct Polls, Zman, or any 2019–2022 CEC filing. The archive listing is
behind Cloudflare. I located the 2026 PDFs by probing file paths and read only filings dated before Oct 23.

**What this means for the model.**
- The seat figures the model converts back to shares are, for every pollster except Channel 12, shares of decided
  respondents, with no stated allocation.
- The 5–11% undecided are therefore spread in proportion to the decided vote, within each pollster's weighting.
  That is the mechanism by which a late-deciding group under-polls.
- No pollster discloses enough to correct for this per firm. A per-firm house effect (agent A) absorbs it.

## 6. What this does not do, and the backtest

- **No model change is proposed, so there is no five-column backtest row.** These tables are inputs for agent B.
  The out-of-sample test that matters here is the leave-one-out in §4.1 (MAE 0.49 against 1.24 points).
- **Noise.** With six points, the slope (0.097) has a wide interval. Removing 2021, the largest point, gives a slope of
  0.104 and an intercept of +0.46, so the sign and size hold, but the size should still be shrunk.
- **What would sharpen it:**
  - Haredi neighbourhoods inside mixed cities, from the ballot-box files (data.gov.il has them);
  - the mixed cities' Arab turnout (IDI samples polling stations);
  - a 2026 Arab turnout figure on this file's definition. That figure will exist on the night.
