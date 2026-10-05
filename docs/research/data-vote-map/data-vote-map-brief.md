# Vote map: data brief

**Verdict: feasible.** A prototype built in this session joins 2022 results for 1,215 localities: 1,179 with polygons, 35 as points (one unmapped). Download for a reader is about 330 KB for the map plus about 85 KB per election (gzipped).

## What carries the build

1. **The CEC publishes one CSV per election, by locality** (`expc.csv`) and by polling station (`expb.csv`), at `media21–25.bechirot.gov.il/files/`. They are mirrored on data.gov.il, license "Other (Open)". The party columns add up exactly to the national totals.
2. **Locality codes are CBS codes.** 1,214 of 1,216 rows from 2022 join to the CBS localities file. The exceptions are Hebron and the special-envelope row.
3. **Special-envelope votes can't be mapped:** 9.6% of valid votes in 2022 (458,714), up from 5.5% in April 2019.
4. **Boundaries: two free layers together.** Ministry of Transport (2026, 1,174 locality polygons) lacks West Bank settlements; the CBS 2008 census layer adds them. Only 0.49% of 2022 votes are left without a polygon (mostly Negev Bedouin tribes, drawn as dots).
5. **Join trap:** the Transport layer codes the whole West Bank as 9999, the same code the CEC uses for envelope votes.
6. **Ballot letters move between parties.** `פה` was Blue and White in 2019–20 and Yesh Atid in 2021–22. `כן` became Gantz's list. Each election needs its own party table; all five are scraped.
7. **2026 looks set up the same way.** `media26.bechirot.gov.il/files/expc.csv` already exists as a test file (dated July 2025) with the 2022 column layout. Files are cached for 60 seconds. In 2022 the final files were posted Nov 8, a week after the vote.
8. **Precedent:** `IdanTravitsky/israel-votes` already maps 1996–2022 results on CBS 2022 boundaries.

## Pipeline

| Step | What |
|---|---|
| 1 | Fetch `expc.csv` ×5. Use cp1255 encoding for 2019a–2021 and UTF-8 for 2022. Join on code, never on name. |
| 2 | Hand-checked letters → party table per election (draft in `samples/`) |
| 3 | CBS `bycode2023.xlsx`: English name and a point (convert from ITM grid) |
| 4 | Move the envelope row (9999 / 99999) into national totals |
| 5 | Check that totals match the national page |
| 6 | Write `localities-2022.json` (412 KB, 84 KB gzipped) |
| 7 | Merge the Transport and CBS 2008 polygons, then mapshaper 5% → TopoJSON (1.0 MB, 326 KB gzipped) |
| 8 | Election night: poll `media26` every few minutes |

## Coverage by election

| Election | Envelope share | Votes with no polygon |
|---|---|---|
| Apr 2019 | 5.54% | 0.28% |
| Sep 2019 | 6.32% | 0.40% |
| 2020 | 7.14% | 0.41% |
| 2021 | 9.56% | 0.35% |
| 2022 | 9.63% | 0.49% |

## Risks

- **Settlement boundaries** come from an 18-year-old layer and look different in style from the rest of the map. The CBS 2022 layer would fix this, but CBS blocks downloads from here. Someone needs to try it in a browser.
- **Mixed cities** are a single number each. Haifa: 9.3% for the Arab lists. There is no current polling-station address list, so no neighborhood view.
- **Election night:** envelope votes (nearly 10%) are counted last, so live maps lean. Not confirmed that the CSV updated live in 2022.

## Open questions

- Can the CBS `statistical_areas_2022.gdb.zip` be downloaded, and is its license open?
- IdanTravitsky's license: reuse or credit?
- The 2026 ballot letters (CEC list page).

## Framing choices for your ruling

1. **West Bank:** draw settlements like any locality, *or* show the Green Line with a note on who votes there.
2. **Envelope votes:** a separate national bar, *or* a footnote only.
3. **Lists across years:** each list as it ran that year, *or* assigned to today's party ids for trends.
4. **English names:** CBS official ("Bene Beraq"), *or* common American spelling ("Bnei Brak").
5. **Default colour:** winner by locality, *or* share for a chosen party.

Verification status (2026-10-05): 24 items checked (11 sources, 13 claims), 21 confirmed; the locality-count wording was corrected. Still unverified: the CBS 2022 statistical-areas layer (download and licence); the IdanTravitsky repo's licence (GitHub unreachable); whether the 2022 CSV updated live on election night.
