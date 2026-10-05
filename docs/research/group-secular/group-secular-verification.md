# Verification — group-secular

Checked 2026-10-04. Method: WebFetch of recorded URLs; IDI Democracy Index 2025 PDF and Taub PDF re-downloaded and searched; all five CEC locality files (media21–25.bechirot.gov.il/files/expc.csv) re-downloaded and every locality figure in the brief recomputed independently. CBS kibbutz list from bycode2022.xlsx (as in the agent's script).

| Claim (brief) | Status | What the source says | URL |
|---|---|---|---|
| CBS 2026: 39.6% of Jews secular | CONFIRMED | 39.6% secular, 21.8 trad-not-so-religious, 14 trad-religious, 12.4 religious, 11.5 Haredi (published 9 Sept 2026; age not stated in ynet; vinnews says 20+) | https://www.ynet.co.il/news/article/sjc9lpcufl |
| CBS 2025: 42.7% (open question) | CONFIRMED (data file had verified:false) | JPost 22 Sept 2025: 42.7 secular, 33.5 traditional, 12 religious, 11.4 Haredi | https://www.jpost.com/israel-news/article-868315 |
| IDI 2025: 43.6% secular | CONFIRMED | DI 2025 Appendix 3, Jewish sample religiosity: secular 43.6 (n=1,205 Jews, May 4–28 2025) | https://en.idi.org.il/media/30427/the-israeli-democracy-index-2025-full-english-version.pdf |
| "about 29% of all residents" | DERIVED (our arithmetic) | Not a published figure; it applies a Jews-20+ share to the whole population. Label as an estimate. | — |
| Fertility ~1.6 secular vs ~5.5 Haredi (Taub, 2023) | CONFIRMED with caveat | Values are read from a chart (Fig. 4); Taub's "secular" category includes traditional non-religious. Text confirms Haredim have "around four more children" than secular+traditional. Note the RZ brief uses JPPI's secular TFR of 2.0 — different source and category; the two pages must not show different secular fertility figures without explanation. | https://www.taubcenter.org.il/wp-content/uploads/2025/12/Demography-2025-ENG-7.pdf |
| Secular self-placement L 24 / C 38 / R 37 | CONFIRMED | 23.8 / 37.7 / 37.2 (DI 2025 App. 3) | DI 2025 PDF |
| 74% voted opposition 2022 | CONFIRMED | IDI (Finkelstein, 28 June 2026), pooled 20 surveys Nov 2022–Oct 2023, 10,694 Jewish voters | https://en.idi.org.il/articles/64807 |
| Voting pattern 2021: YA 31, Likud 17, Lab+Mer 19, B&W+NH 18; 2022: 39/20/16/13 | CONFIRMED | Same article. 2021 figures are recall asked in 2022–23, not 2021 surveys — say so. | https://en.idi.org.il/articles/64807 |
| Draft: 71% "draft all", 4% no change (Sept 2025) | CONFIRMED (chart-read) | Option wording is "conscript all young Haredi men **except a few outstanding yeshiva students**". Page text gives ~70 / ~5. Sept 14–18 2025, n=1,000 (800 Jews). Brief's "want all young Haredi men drafted" drops the exception — reword. | https://en.idi.org.il/articles/61845 |
| Chart C draft row: 71 / 49 / 30.5 / 8 | CONFIRMED (chart-read, consistent with text) | ~70 / ~50 / ~33 / minimal | same |
| Supreme Court trust: secular 66, trad-non-rel 40, nat-rel 19, Haredi 3 | CONFIRMED | DI 2025 Table 2.6 | DI 2025 PDF |
| Violent settlers "too leniently": 66.5 / 43 / 20.5 / 12.5 (Dec 25) | CONFIRMED | Nov 30–Dec 3 2025, 604 Jews; Jewish sample | https://en.idi.org.il/articles/62468 |
| Considering leaving: 39 / 24 / 14 / 3 (Apr 25) | CONFIRMED | Apr 6–17 2025, 720 Jews; published 3 Dec 2025 | https://en.idi.org.il/articles/62287 |
| 60% of younger secular Jews | CONFIRMED | ToI: "Among younger secular Jewish Israelis, 60% said they would consider leaving" — no age bracket given | https://www.timesofisrael.com/some-1-in-4-israelis-considering-leaving-the-country-poll-finds/ |
| Reservists 2025: secular 1.7, religious 4.3, traditional 2.6; secular still largest group | CONFIRMED | IDI (Finkelstein & Portal, 20 Aug 2026), CBS Labor Force Survey | https://en.idi.org.il/articles/65427 |
| Pew: ~4 in 10 Hilonim not Ashkenazi (2014–15) | NOT ON PAGE (fetched pages) | Pew pages fetched give 67% of Ashkenazim Hiloni and ~3 in 10 Mizrahim Hiloni, not the Hiloni ethnic split. Figure may be in a Pew table not reached. | https://www.pewresearch.org/religion/2016/03/08/identity/ |
| 15% of Jews say "mixed" | CONFIRMED | 15.3% (DI 2025 App. 3) | DI 2025 PDF |
| Chart A 2022: YA, Likud, Nat. Unity, Labor+Meretz for National, TA, Givatayim, Ramat HaSharon, Herzliya, kibbutzim | CONFIRMED (recomputed) | All match to 0.1 (Givatayim Lab+Mer 19.0 by direct sum vs 19.1 in brief — rounding) | media25 expc.csv |
| Chart A "Netanyahu bloc" column | **MISMATCH** | Recomputed Likud+Shas+UTJ+RZ–Otzma: National 48.4 (48.3 as sum of rounded), **Tel Aviv 26.7 (brief 25.8), Givatayim 21.7 (21.3), Ramat HaSharon 23.9 (ok), Herzliya 31.1 (30.4), kibbutzim 11.0 (10.5)**. Cause: the agent's results file kept only parties ≥1%, so UTJ (and on kibbutzim Shas) dropped out of the city sums but not the national one. Same error likely in the 2021 bloc figures in the findings file. | media25 expc.csv |
| Chart B Tel Aviv five elections (45.7 / 42.7 / 48.2 / 22.1 / 32.8; Likud 19.3 / 19.0 / 21.8 / 17.0 / 17.0) | CONFIRMED | Exact match | media21–25 expc.csv |
| "Blue and White took 45–60% in 2019–20" in most secular places | MINOR | Range is 42.7 (TA, Sep 19) to 59.6 (Ramat HaSharon, 2020); say 43–60%. | CEC |
| "Yesh Atid 33–42% in 2022"; "Likud 15–23%" | CONFIRMED | YA 32.8–42.2; Likud 15.7–23.4 in the cities (kibbutzim 6–8) | CEC |

## Must fix before the brief goes to Daniel
1. Chart A bloc column: replace with TA 26.7, Givatayim 21.7, Ramat HaSharon 23.9, Herzliya 31.1, kibbutzim 11.0, national 48.4 (and recheck the 2021 bloc line in the findings).
2. Draft wording: "71% want all young Haredi men drafted, except a few outstanding yeshiva students."
3. Fertility: say Taub's 1.6 covers secular and traditional non-religious women, read from a chart; reconcile with the RZ page's secular 2.0 (JPPI).
4. "29% of all residents": label as our estimate.
5. Voting pattern 2021 column: note these are 2022–23 recall answers.

## Cannot verify from this session
- Pew "~4 in 10 Hilonim weren't Ashkenazi" (not found on the two Pew pages fetched).
- Kibbutz list itself depends on CBS bycode2022.xlsx codes (used the agent's downloaded copy; the CBS site was not re-fetched).
