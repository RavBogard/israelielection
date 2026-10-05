# Verification — group-masorti

Checked 2026-10-04. CEC locality files for 2019–2022 re-downloaded (media21–25.bechirot.gov.il/files/expc.csv) and every town figure recomputed independently (locality codes: Sderot 1031, Netivot 246, Ofakim 31, Beit She'an 9200, Kiryat Shmona 2800, Dimona 2200, Tel Aviv 5000). IDI Democracy Index 2025 PDF re-downloaded and searched; other URLs opened with WebFetch.

| Claim (brief) | Status | What the source says | URL |
|---|---|---|---|
| CBS 2026: 35.8% traditional | CONFIRMED | 21.8 trad-not-so-religious + 14.0 trad-religious (9 Sept 2026; vinnews says Jews 20+) | https://www.ynet.co.il/news/article/sjc9lpcufl ; https://vinnews.com/2026/09/09/israel-enters-5787-with-population-growth-high-birthrate-and-rising-emigration/ |
| IDI 2025: 31.9% | CONFIRMED | 13.0 trad-religious + 18.9 trad-non-religious (DI 2025 App. 3, n=1,205 Jews) | https://en.idi.org.il/media/30427/the-israeli-democracy-index-2025-full-english-version.pdf |
| JPPI 2023: 19% as main identity | CONFIRMED (data file had verified:false) | JPPI: 19% identify as masorti "as a noun"; ~45% as a secondary identity | https://jppi.org.il/wp-content/uploads/2023/06/traditionalism_heb_2023-WEB-1.pdf |
| Pew 2016: 42% of Mizrahim Masorti, ~32% secular, "~a third Dati/Haredi" | PARTLY CONFIRMED | 42% Masorti and "about three-in-ten" secular confirmed. The Dati/Haredi remainder is not printed on the page; by subtraction it is under 30%, so "~a third" overstates. Say "most of the rest are Dati or Haredi." | https://www.pewresearch.org/religion/2016/03/08/identity/ |
| 15% of Jews "mixed" origin | CONFIRMED | 15.3% (DI 2025) | DI 2025 PDF |
| Traditional voters 2022: Likud 46.5, RZ–Otzma 14, YA 13, NU 12.5; 57% of Likud voters traditional | CONFIRMED | IDI article published 28 June 2026, but data are 20 surveys Nov 2022–Oct 2023. Brief's "(IDI 2026)" reads as 2026 data — change to "IDI surveys 2022–23". | https://en.idi.org.il/articles/64807 |
| Six towns: coalition parties 84% vs 48% nationally | CONFIRMED | Recomputed 84.3 vs 48.4 | media25 expc.csv |
| Chart A six-town series (Likud, Shas, far-right, center, Likud national; all five elections) | CONFIRMED | Every cell matches to 0.1. Far-right ballot letters: 2019a טב (URWP), 2019b כף (Otzma), 2020 נץ (Otzma), 2021–22 ט. | media21–25 expc.csv |
| Likud 2020 peak 50.7 → 40.2; Ben-Gvir–Smotrich 17%, Sderot 24.6% | CONFIRMED | Recomputed | CEC |
| Voting-pattern table by town (Likud 2020, Likud 2022, Shas, RZ–Otzma) | CONFIRMED | All match | CEC |
| Voting-pattern table, YA+NU 2022 column | CONFIRMED (rounding) | Direct sums: Sderot 11.5 (brief 11.4), Beit She'an 6.4 (6.3), Kiryat Shmona 14.0 (13.9); others exact. Brief summed rounded figures — trivial. | CEC |
| Supreme Court trust: trad-rel 21, trad-non-rel 40, secular 66 (and Haredi 3, nat-rel 19) | CONFIRMED | DI 2025 Table 2.6 | DI 2025 PDF |
| Chart B: government trust 45/36/36/26/9 | CONFIRMED | Table 2.12 | DI 2025 PDF |
| Chart B / finding 6: "Israel ensures security" 68/65/51/52/30; trad-rel 30→51, secular 52→30 (2022→25) | CONFIRMED | Table 2.29 | DI 2025 PDF |
| Chart B: self-ID Right 84.5/84.2/76.8/64.2/37.2 | CONFIRMED | App. 3 | DI 2025 PDF |
| Draft-exemption decision "a political deal": trad-non-rel 54, trad-rel 37 (Mar 2026) | CONFIRMED | Full option wording: "A political deal that prioritizes sectoral interests over the good of the public." Mar 22–26 2026, 604 Hebrew interviews. | https://en.idi.org.il/articles/63856 |
| 1.7% name Mizrahi–Ashkenazi as sharpest tension; 55% right–left | 55 CONFIRMED; 1.7 NOT ON PAGE | DI 2025 Table 4.7 / App. 2 (Jews, 2025): Right–Left 55; Mizrahim–Ashkenazim printed as **2** (rounded). 1.7 may come from a chart label; use "about 2%". | DI 2025 PDF |
| Chart C: CBS 2025 33.5 | CONFIRMED | JPost 22 Sept 2025 | https://www.jpost.com/israel-news/article-868315 |
| Chart C: CBS 2009 39.3 | UNVERIFIED-SECONDHAND | URL recorded is the CBS home page only | https://www.cbs.gov.il/ |
| Open question: Shas at 7 seats; Eisenkot in Dimona, Kiryat Shmona | PARTLY CONFIRMED | ToI 21 Aug 2026: Shas "polling at just seven seats in several recent surveys"; Eisenkot quote names Kiryat Shmona, Shlomi, Or Yehuda — **not Dimona** | https://www.timesofisrael.com/eisenkot-threatens-to-siphon-traditional-voters-away-from-a-panicking-shas/ |
| Oct 7 town figures | UNVERIFIED-SECONDHAND | Wikipedia only (brief already says so) | en.wikipedia.org |

Arithmetic spot-check requested: Sderot 2022 row from media25 expc.csv (code 1031): valid 15,242; Likud 41.5, Shas 12.1, RZ–Otzma 24.6, YA+NU 11.5, turnout 65.6 — matches cec-localities-computed.json and the brief.

## Must fix before the brief goes to Daniel
1. Label the traditional-voter figures "IDI surveys Nov 2022–Oct 2023," not "IDI 2026."
2. Pew: drop "~a third Dati/Haredi"; the page supports only 42% Masorti and ~3 in 10 secular.
3. Mizrahi–Ashkenazi tension: "about 2%" (the printed table), not 1.7.
4. Remove Dimona from the Eisenkot note.

## Cannot verify from this session
- CBS 2009 (39.3%) — no primary URL.
- Oct 7 town figures (Wikipedia only).
- CBS socio-economic clusters (not obtained, as the brief says).
