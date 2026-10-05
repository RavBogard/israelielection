# Group page research — Mizrahi-traditional (masorti) Israel
Slug: group-masorti. Compiled 2026-10-05. Builds on class docs 05 (tribes), 06 (stats refresh), 11a (Likud, Shas), 11b (RZ, Otzma), 11c (Yashar). Where a figure comes from a class doc and was not re-opened here, it is marked "class doc, not re-opened."

Method notes that matter for the page:
- All locality election results below were computed here from the Central Elections Committee's own per-locality CSV files for the 21st–25th Knessets (April 2019, Sept 2019, March 2020, March 2021, Nov 2022). Files: https://media21.bechirot.gov.il/files/expc.csv through https://media25.bechirot.gov.il/files/expc.csv. Shares are of valid votes cast inside the locality. They do not include soldiers', diplomats', prisoners' and hospital "double-envelope" votes, which the CEC reports in a separate national row. National totals were summed from all rows and match the official national results (Likud 2022: 23.4%; RZ–Otzma 2022: 10.8%; Shas 2022: 8.2%). The computed table is saved as `cec-localities-computed.json` in this folder.
- CBS's own site would not load from here. CBS figures are as reported by the press or by Wikipedia (which cites CBS), and are marked `verified: false` in the data file.
- Automated readers misread two IDI tables during this research (they swapped trust-in-the-President figures into the Supreme Court row). Every IDI Democracy Index number below was re-read directly from the downloaded PDF text.

---

## 1. Size, growth, geography

### Masorti share over time
- CBS Social Survey, Jews aged 20+, Sept 2026 release: "traditional, not so religious" 21.8% and "traditional-religious" 14.0%, together 35.8% (our addition). Secular 39.6%, religious 12.4%, Haredi 11.5%. (CBS via VIN News 2026-09-09, https://vinnews.com/2026/09/09/israel-enters-5787-with-population-growth-high-birthrate-and-rising-emigration/ and Ynet https://www.ynet.co.il/news/article/sjc9lpcufl — class doc, not re-opened.)
- CBS Sept 2025 release: both traditional categories 33.5% (21.5 + 12.0). (CBS via JPost, class doc 06, not re-opened.)
- CBS 2009: 26.3% traditional-not-religious + 13.0% traditional-religious = 39.3%. (CBS tec25, class doc 05, not re-opened.)
- IDI Israeli Democracy Index 2025, sample profile (Jews 18+, weighted, fieldwork May 4–28, 2025, n=1,205 Jews): traditional religious 13.0%, traditional non-religious 18.9%, together 31.9%; secular 43.6%. (https://en.idi.org.il/media/30427/the-israeli-democracy-index-2025-full-english-version.pdf, appendix sample table.) IDI weights to CBS, so this is not an independent count.
- Pew 2016 (face-to-face, Oct 2014–May 2015): Masortim 29% of Israeli Jews, 23% of all Israeli adults. (https://www.pewresearch.org/religion/2016/03/08/israels-religiously-divided-society/) Older than two years.
- JPPI 2023 (Even Tzur): 19% use "masorti" as their main identity; about 45% use it as a secondary identity. (https://jppi.org.il/wp-content/uploads/2023/06/traditionalism_heb_2023-WEB-1.pdf — class doc, not re-opened.)

What is worth noticing: the long-run line is roughly flat to slightly down (39% in 2009, 33.5% in 2025), and the 2026 CBS figure jumps 2.3 points in one year while "secular" drops 3.1 points. A one-year move that size is unusual for a census-style series; Daniel may want to show 2009 / 2025 / 2026 and note it, rather than build a trend story on the last point. The bigger point for readers: depending on how you ask, "masorti" is between one-fifth and one-third of Israeli Jews — roughly the size of the secular camp's challenger, not a niche.

### Mizrahi share of the Jewish population, and why the number is soft
- IDI Democracy Index 2025 self-identification (Jews 18+): Ashkenazi 39.8%, Mizrahi 35.2%, mixed Ashkenazi-Mizrahi 15.3%, FSU immigrant 5.3%, Ethiopian 0.6%, other 1.5%, don't know 2.3%. (IDI PDF above, sample table.)
- Pew 2016: Ashkenazim 45%, Sephardim or Mizrahim 48%. (https://www.pewresearch.org/religion/2016/03/08/identity/)
- Wikipedia (secondary): "45% of Jewish Israelis identified as either Mizrahi or Sephardic" (2018). (https://en.wikipedia.org/wiki/Mizrahi_Jews_in_Israel)
- CBS counts origin only by a person's own or father's continent of birth. Once both a person and their father are Israel-born, CBS records them as "Israel-born, father Israel-born" and origin disappears. The newest CBS continent-of-origin table found is 2015 (class doc 05). CBS April 2026: about 81% of Jews are Israel-born (Ynet via class doc 06, not re-opened).
- Intermarriage: "By the late 1990s 28% of all Israeli children had multi-ethnic parents (up from 14% in the 1950s)." (Wikipedia, https://en.wikipedia.org/wiki/Mizrahi_Jews_in_Israel; underlying source not opened.) IDI's 15.3% "mixed" self-ID is the current version of the same fact.

Limits to state on the page: (a) "Mizrahi" is now mostly a self-identification, not a statistic; (b) one in six Jewish adults says "mixed"; (c) the CBS data that could settle it stop at the grandparent generation; (d) "Mizrahi" and "Sephardi" are used interchangeably in Israeli speech but are not the same thing; (e) some development-town residents counted as "FSU" are from the Caucasus or Bukhara (e.g., Sderot's 1990s arrivals were mainly from the Caucasus), whom many Israelis would not call Mizrahi or Ashkenazi.

### The overlap between "Mizrahi" and "traditional"
- Pew 2016: of Sephardi/Mizrahi Jews, 42% identify as Masorti, about 32% as secular, and roughly a third as religiously observant (Dati or Haredi). Two-thirds of Ashkenazim are secular. (https://www.pewresearch.org/religion/2016/03/08/identity/)
- IDI 2026 (Finkelstein): 57% of Likud's 2022 voters were traditional. (https://en.idi.org.il/articles/64807)

So: most masortim are Mizrahi, but fewer than half of Mizrahim are masorti. Treating the two as one group leaves out secular Mizrahim (about a third) and Mizrahi Haredim (Shas's core), and leaves in Ashkenazi and FSU traditional Jews. This is the framing issue flagged below.

### Development towns and the periphery
- Development towns: built in the 1950s to house mass immigration; "over 80%" of residents came from Arab and Muslim countries; by the 1960s–70s "85–90 percent of development town residents were Mizrahi Jews." "Most of the towns (particularly those in the south) have fared poorly in the economic sense." (Wikipedia, https://en.wikipedia.org/wiki/Development_town; secondary.)
- About 25% of Israelis live in development towns and southern cities (ToI 2019-04-30, class doc 05 — old and not re-opened).

Populations, end-2024, CBS via Wikipedia (secondary; replace with CBS when reachable):
| Town | Pop. 2024 | Founded / first residents |
|---|---|---|
| Sderot | 37,239 | 1951 transit camp, Kurdish and Iranian Jews; 87% North African (mostly Moroccan) by 1961 census (https://en.wikipedia.org/wiki/Sderot) |
| Netivot | 56,019 (45,024 in 2022) | Moroccan and Tunisian Jews; tomb of the Baba Sali (https://en.wikipedia.org/wiki/Netivot) |
| Ofakim | 39,893 | 1955, Moroccan, Tunisian, Egyptian, Iranian Jews; 7,000+ FSU in the 1990s (https://en.wikipedia.org/wiki/Ofakim) |
| Beit She'an | 19,073 (end-2022) | North African transit camp; David Levy's home base (https://en.wikipedia.org/wiki/Beit_She'an) |
| Kiryat Shmona | 24,437 | 1949, Yemenite Jews, then Iraq, Iran, Kurdistan, North Africa (https://en.wikipedia.org/wiki/Kiryat_Shmona) |
| Dimona | 39,590 | 1955, North African Jews; ~7,500 Indian (Bene Israel) Jews (https://en.wikipedia.org/wiki/Dimona) |

Netivot grew by about a quarter in two years, largely through Haredi in-migration and new neighborhoods; its 2022 vote (Shas 42.5%) reflects that and should not be read as a pure "masorti" result.

Socioeconomic clusters: the CBS 2021 socio-economic index release (https://www.cbs.gov.il/en/mediarelease/Pages/2024/Characterization-and-Classification-of-Geographical-Units-by-the-Socio-Economic-Level-of-the-Population-2021.aspx) loads only as an empty script shell from here; cluster numbers per town were NOT obtained. The only figure found: Netivot ranked 3 of 10 in 2001 (Wikipedia). Ofakim had Israel's highest unemployment in 1997 (15.3%) and 2004 (~14%) (Wikipedia). This gap needs a CBS pull before the page ships.

Socioeconomic gaps (secondary, Wikipedia, underlying not opened): Ashkenazi average income 36% above Mizrahi (2004); Israel-born Ashkenazim "up to twice more likely" to attend university than Israel-born Mizrahim. These are old and should be replaced with Taub or Adva figures.

---

## 2. Voting pattern, 2019–2022 (CEC locality results, computed here)

### Six named towns combined (Sderot, Netivot, Ofakim, Beit She'an, Kiryat Shmona, Dimona), % of valid in-locality votes
| Election | Likud | Shas | Far-right list* | UTJ | Main center list** | Turnout |
|---|---|---|---|---|---|---|
| Apr 2019 | 44.8 | 15.7 | 4.9 | 5.5 | 7.9 | 65.7 |
| Sep 2019 | 44.0 | 20.1 | 3.5 | 5.0 | 8.4 | 65.8 |
| Mar 2020 | 50.7 | 20.4 | 0.7 | 5.0 | 8.2 | 67.1 |
| Mar 2021 | 43.1 | 20.3 | 7.3 | 4.8 | 3.8 | 61.5 |
| Nov 2022 | 40.2 | 22.2 | 17.0 | 4.9 | 4.5 | 67.6 |
| National 2022 | 23.4 | 8.2 | 10.8 | 5.9 | 17.8 | 70.6 |

*Far-right list = the list Otzma Yehudit ran on: Apr 2019 Union of Right-Wing Parties (Jewish Home + National Union + Otzma, ballot "טב"); Sep 2019 Otzma alone ("כף"); 2020 Otzma alone ("נץ"); 2021 and 2022 Religious Zionism–Otzma–Noam joint list ("ט"). Not the same list each time — the page must say so.
**Blue and White 2019–2020; Yesh Atid 2021–2022 (National Unity 2022 added 4.0 in the six towns).

Coalition parties of the 2022 government (Likud + Shas + UTJ + RZ–Otzma) in the six towns: 84.3% in 2022, versus 48.3% nationally. The same four-list sum was 70.9% in April 2019.

### By town, 2022 (and Likud's 2020 peak)
| Town | Likud 2020 | Likud 2022 | Shas 2022 | RZ–Otzma 2022 | UTJ 2022 | Yesh Atid + Nat. Unity 2022 |
|---|---|---|---|---|---|---|
| Sderot | 51.1 | 41.5 | 12.1 | 24.6 | 1.0 | 11.4 |
| Netivot | 36.5 | 27.5 | 42.5 | 15.7 | 6.0 | 3.6 |
| Ofakim | 40.4 | 32.1 | 23.1 | 15.9 | 15.0 | 7.6 |
| Beit She'an | 62.7 | 47.9 | 25.0 | 16.1 | 0.8 | 6.3 |
| Kiryat Shmona | 58.1 | 49.5 | 11.0 | 13.7 | 0.6 | 13.9 |
| Dimona | 61.8 | 50.9 | 11.7 | 15.8 | 2.8 | 10.6 |
| Comparison: Tel Aviv-Yafo | 21.8 | 17.0 | 4.3 | 4.5 | 0.8 | 43.8 |
| Comparison: Givatayim | 20.3 | 15.8 | 1.5 | 4.0 | 0.5 | 52.5 |

Other periphery towns computed (2022 Likud / Shas / RZ–Otzma): Kiryat Malakhi 38.1 / 19.6 / 25.2; Yeruham 37.5 / 12.6 / 17.6; Or Akiva 47.2 / 10.7 / 11.8; Or Yehuda 45.7 / 19.0 / 11.0; Tiberias 40.4 / 20.4 / 12.8; Shlomi 43.5 / 9.5 / 15.6; Beersheba 40.3 / 9.0 / 15.7; Ashkelon 39.7 / 11.8 / 13.3. All in the CEC files above.

What the shift across five elections shows:
1. Likud stays far above its national share in every one of these towns (17–21 points above in the six-town total), but its peak was March 2020, and it fell back in 2021 and 2022. In Beit She'an Likud dropped from 62.7% (2020) to 47.9% (2022).
2. The 2022 change was not a move away from the right; it was a move within it. The Ben-Gvir–Smotrich list went from under 1% (Otzma alone, 2020) to 17% in the six towns and 24.6% in Sderot, 25.2% in Kiryat Malakhi — more than double its national 10.8%.
3. Shas rose steadily (15.7% to 22.2% in the six towns) and is the largest party in Netivot.
4. Centrist lists are small here (4–14%), and fell sharply from 2019–2020 (Blue and White) to 2021–2022.
5. Turnout in these towns is slightly below the national rate except in Netivot (75.5% in 2022), which looks like Haredi/Shas mobilization.

Caution for the page: these are town results, not a "Mizrahi vote." Netivot and Ofakim have large Haredi populations; Ashkelon and Migdal HaEmek have large FSU populations (Yisrael Beytenu 10.6% and 13.3%). Survey data (below) are the better guide to how masortim as people vote; the town data show place.

### Survey-based vote of self-defined traditional Jews, 2022
IDI, Ariel Finkelstein, 2026-06-28; 20 Viterbi Center surveys Nov 2022–Oct 2023, 12,322 Jewish respondents, 10,694 voters analyzed (https://en.idi.org.il/articles/64807):
- Traditional voters' 2022 vote: Likud 46.5%, RZ–Otzma 14%, Yesh Atid 13%, National Unity 12.5%.
- Change from 2021: Likud 39% → 46.5%; RZ–Otzma 4% → 14%.
- Camps: 66.5% of traditional voters voted for the parties that formed the coalition, 33.5% for opposition parties.
- Likud's voters: 57% traditional, 32% secular, 10% national-religious, 1% Haredi. "42% [of coalition voters] are traditional."
- IDI does not split "traditional religious" from "traditional non-religious" in this piece.

### 2026 polling by self-defined masortim
NOT FOUND. IDI Israeli Voice Index releases for July, August and September 2026 (https://en.idi.org.il/articles/65483, https://en.idi.org.il/articles/66177, and the August data PDF https://en.idi.org.il/media/32364/august-voice-index-data.pdf) report results by vote intention or by religiosity on single questions, but not 2026 vote intention by religiosity. No public pollster cross-tab of 2026 vote by masorti self-identification was located. What exists is indirect:
- Shas polling at 7 seats vs. 11 won in 2022; Shas worried Eisenkot is pulling traditional Sephardi voters in Kiryat Shmona, Shlomi, Or Yehuda and southern moshavim (ToI, Shalom Yerushalmi, 2026-08-21, https://www.timesofisrael.com/eisenkot-threatens-to-siphon-traditional-voters-away-from-a-panicking-shas/).
- JTA (2026-09-09) reports Likud's attacks on Eisenkot reflect concern in "previously secure strongholds like Dimona and Kiryat Shmona" (https://www.jta.org/2026/09/09/israel/meet-gadi-eisenkot-the-novice-who-plays-hardball-and-who-may-unseat-benjamin-netanyahu).
- Finkelstein (IDI): Smotrich draws "mainstream Religious Zionists," Ben-Gvir "traditional Mizrahi voters from the periphery" (ToI 2026-04-15, class doc 11b, not re-opened).
This is a real gap: the page can describe the contest for these voters but cannot give a 2026 masorti vote number unless one is published before Oct 27.

---

## 3. Attitudes on the six issues (Jewish samples, by self-defined religiosity)
The Democracy Index 2025 uses five categories: Haredi, national religious, traditional religious, traditional non-religious, secular. The two traditional groups usually sit between secular and national-religious, and the "traditional religious" group is consistently closer to the religious right. Fieldwork May 4–28, 2025; 1,205 Jews (IDI PDF above).

**Political self-placement** (Democracy Index 2025 sample table): Right — traditional religious 76.8%, traditional non-religious 64.2%, secular 37.2%, Haredi 84.5%. Left — 2.2% and 6.3% for the two traditional groups. By origin (footnote 18, ch. 6): Mizrahim 73% Right, 20% Center, 5% Left; Ashkenazim 49% / 31% / 18.5%.

**Courts and the judicial overhaul**
- Trust in the Supreme Court (Table 2.6): traditional religious 24% (2023), 22% (2024), 21% (2025); traditional non-religious 36%, 40%, 40%; secular 66.5%, 58.5%, 66%; Haredi 11, 7, 3.
- Trust in the Attorney General 2025 (Table 2.18): 18% / 36% (trad. religious / trad. non-religious); secular 65%.
- "What constitutes a democratic decision?" (Table 3.8): decisions by a government with a Knesset majority "are inherently democratic" — traditional religious 43%, traditional non-religious 41%, secular 14.5%; "decisions opposed to basic democratic values ... are not democratic even if passed" — 35%, 43%, 72.5%.
- July 2026 Voice Index: about one-half of traditional religious Jews support the attorney-general bill and the gender-segregation-in-academia bill; numbers only in a chart (https://en.idi.org.il/articles/65483).

**Haredi draft**
- March 2026 Voice Index (fieldwork Mar 22–26, 2026; 604 Hebrew interviews): asked about the government's decision "to suspend the Military Service Exemption Law and to transfer billions of shekels to Haredi institutions": "a political deal" — traditional non-religious 54%, traditional religious 37%, secular 82.5%, Haredi 18%; "a responsible decision" — 25%, 43%, 8%, 51% (https://en.idi.org.il/articles/63856).
- July 2026: in every group except Haredim, only a minority back the bill halting arrests of yeshiva students who don't report for service (https://en.idi.org.il/articles/65483).
- Sept 2025: "about half of the traditional non-religious public" supports drafting all young Haredi men; no number in the text (https://en.idi.org.il/articles/61845).
- Reserve duty, average month 2025: traditional men 2.6%, religious 4.3%, secular 1.7%, Haredi 0.3% (IDI 2026-08-20, class doc 05, not re-opened).

**The war and the hostages / security**
- Support for continuing Operation Roaring Lion (March 2026): traditional religious 85%, traditional non-religious 84%, secular 67.5%, Haredi 84.5%, national religious 87% (https://en.idi.org.il/articles/63856).
- "Israel ensures the security of its citizens" (Table 2.29): traditional religious 30% (2022) → 51% (2025); traditional non-religious 37% → 52%; secular 52% → 30%. The war reversed which groups feel protected.
- Trust in the IDF 2025 (Table 2.4): 85% and 88.5%.
- Oct 7 as a central voting consideration (Sept 2026): about three-quarters of secular and traditional non-religious; about two-thirds of traditional religious (https://en.idi.org.il/articles/66177; approximate wording).
- A religiosity breakdown on hostage deals was not found; August 2025 data are by political camp only (Right 47% support, 44% oppose; https://en.idi.org.il/articles/61601).

**West Bank and annexation**
- Dec 2025 Voice Index (Nov 30–Dec 3, 2025; 604 Jews): security forces treat violent settlers "too leniently" — traditional non-religious 43%, traditional religious 36%, secular 66.5%, national religious 20.5%; "too harshly" — 27%, 32.5%, 9%, 46% (https://en.idi.org.il/articles/62468).
- Support for Jewish settlement in Gaza: "significant decline" among traditional non-religious between Nov 2024 and Aug 2025; no numbers in text (https://en.idi.org.il/articles/61601).
- No 2025–26 annexation-by-religiosity number found. Pew 2016 (old): 45% of Masortim said settlements help Israel's security, 22% hurt.

**Religion and state**
- Jewish vs. democratic balance (Table 2.26, 2025): "Jewish component too dominant" — traditional religious 28%, traditional non-religious 40%, secular 69%; "democratic component too dominant" — 29%, 17%, 7.5%; "good balance" — 25%, 28%, 12%. The traditional religious group is split almost evenly; the traditional non-religious lean toward "too Jewish."
- Importance of a constitution (Table 3.9): 66% and 72% (secular 80%, Haredi 48.5%).
- JPPI 2023: 87% of masortim say "Judaism is far more than observing commandments" (class doc 05, not re-opened).
- Pew 2016 (old): 57% of Masortim favor democratic principles over halakha; 44% favor closing public transport nationwide on Shabbat, 52% keep some service.

**Cost of living and the economy**
- "Israel ensures the welfare of its citizens" (Table 2.32): traditional religious 19% (2022) → 28% (2025); traditional non-religious 20% → 26.5%; secular 22% → 8%.
- Personal situation good or very good, 2025 (Table 1.5): traditional religious 57%, traditional non-religious 52%, secular 43%, Haredi 85%.
- March 2026: about 31% of traditional non-religious report negative financial impact over the past three years (https://en.idi.org.il/articles/63856; approximate, from automated reading).
- Economy and cost of living is one of the two top voting considerations among Jews (Sept 2026, https://en.idi.org.il/articles/66177); no religiosity split given.

**One number worth a sentence on the page:** asked which social tension is most acute, 1.7% of Jews chose Mizrahi–Ashkenazi in 2025 (2–3% every year since 2012); 54.9% chose right–left (Democracy Index 2025, appendix Q12). The old ethnic divide is now mostly described in political terms.

---

## 4. Lived texture

**The Likud–Mizrahi bond since 1977.** Likud won 43 seats to the Alignment's 32 in May 1977 — the "mahapakh" (upheaval), a word coined by anchor Haim Yavin on air. Begin's appeal resonated with "the predominantly Mizrahi working class living in urban neighbourhoods and peripheral towns" who "felt abandoned by the ruling party" (https://en.wikipedia.org/wiki/1977_Israeli_legislative_election; secondary). David Levy — born in Rabat, arrived 1957, settled in Beit She'an, a construction worker blacklisted for organizing a strike — became the face of Mizrahi Likud; a scholar quoted by ToI: "There is no David Levy without the Panthers, there is no Likud as a popular movement without the Panthers" (Charlie Summers, ToI 2024-06-02, https://www.timesofisrael.com/david-levy-who-mainstreamed-mizrahi-involvement-in-politics-dies-at-86/). Zehava Galon at his death: "Most of his political life he was subjected to racist ridicule" (ToI 2024-06-03, https://www.timesofisrael.com/trailblazer-david-levy-remembered-for-forging-space-for-mizrahi-voices-in-politics/). Lapid: "He brought to the Knesset the voice and representation of the development towns that were so lacking in it" (same).

**Shas as a social movement.** Founded 1984 by Rabbi Ovadia Yosef; slogan "to return the crown to its former glory"; built the Ma'ayan HaHinuch HaTorani school network, which "became popular in poor Sephardic towns"; peak 17 seats in 1999 (https://en.wikipedia.org/wiki/Shas; secondary). IDI's Gilad Malach: "Shas has at least three or four Knesset seats' worth of voters who are simply not Haredi" (Shomrim 2026-06-30, class doc 11a, not re-opened). A veteran Shas activist, unnamed, to ToI: "Drive out to the moshavim in the south. You'll see Sephardim wearing black kippahs or large knitted kippahs." and "You can't turn a Sephardi into an anti-Zionist." (ToI 2026-08-21, URL above.)

**Oct 7 and the Gaza-envelope towns.** Sderot: Hamas gunmen took the police station; about 18 police and at least 20 civilians were killed; about 90% of 36,000 residents evacuated; ~90% back by Aug 2024. Ofakim: 47 residents killed, 27 of them in the town, including six police officers. Netivot: attackers stopped at the outskirts; a rocket killed three members of one family. Kiryat Shmona (north): nearly all residents evacuated Oct 2023 because of Hezbollah fire; ~80% still away in Feb 2025. (All via Wikipedia town pages above — secondary; to replace with ToI/Ynet primary reporting.) Note for the page: Sderot and Ofakim are Mizrahi development towns hit on Oct 7 alongside the kibbutzim, which are the communities most American coverage pictured.

**Periphery and center.** Sources gathered here describe the grievance in terms of housing, schooling, distance and representation (Levy, Lapid quotes above). IDI's 2025 data add a turn: since the war, traditional Jews say the state protects and provides for them more than secular Jews do (Tables 2.29, 2.32). No 2025–26 survey measuring periphery resentment as such was found.

**Voices (opened):**
- Inbar Harush-Gity (Yashar! candidate) to JTA: "Gadi defines himself as traditional, as do I, and this also gives a lot of space for people for whom Judaism or Jewish identity is important." (JTA 2026-09-09, URL above.)
- Gadi Eisenkot, on Shas: his mother "voted for them for 30 years"; "I know Shas voters, I meet them, I grew up with some of them." (ToI liveblog 2026-07-09, https://www.timesofisrael.com/liveblog_entry/eisenkot-ill-partner-with-shas-if-it-accepts-my-principles-my-mom-voted-for-them-for-30-years/)
- Missing: a named ordinary resident of Sderot, Netivot or Dimona talking about the 2026 vote. Not found in what could be opened.

---

## Source disagreements
1. Size of the group: CBS 2026 35.8% (two traditional categories, Jews 20+); IDI 2025 31.9% (Jews 18+); Pew 2014–15 29%; JPPI 2023 19% as main identity. Different questions, not errors — the page should say which is used.
2. CBS 2025 (33.5%) to 2026 (35.8%) is a large one-year jump, matched by a 3.1-point secular drop. Not explained in reporting seen.
3. Mizrahi share: IDI 2025 35.2% Mizrahi + 15.3% mixed; Pew 2016 48% Sephardi/Mizrahi (no mixed option reported); Wikipedia 45% (2018). The mixed category drives the difference.
4. Pew 2016's figure on Masorti support for expelling Arabs was returned by an automated reader as 27% agree; that conflicts with what Pew published (believed to be about half). Not used; needs a manual check if Daniel wants it.
5. Town results vs. survey results: in the six towns Likud fell from 2021 to 2022 (43.1 → 40.2), while IDI's survey shows Likud rising among traditional voters nationally (39 → 46.5). Both can be true (Otzma took town votes; Likud gained traditional voters elsewhere), but the page should not present one as the other.

## Stale or missing
- 2026 vote intention by masorti self-ID: not found.
- CBS socio-economic cluster for each town (2021 index): not obtained; CBS site would not render.
- CBS religiosity and population figures: second-hand via press/Wikipedia; CBS not opened.
- CBS origin table: newest 2015.
- Mizrahi–Ashkenazi income and education gaps: only 2004–2015 figures via Wikipedia; need Taub/Adva.
- INSS National Security Index: public English releases found only to 2019–20; no religiosity cross-tabs located.
- INES (Israel National Election Studies) 2022 cross-tabs by religiosity or origin: not located.
- Pew 2016 attitudes: 10+ years old; Pew 2025 switching study URL not reached (404 at guessed address).
- Hostage-deal and annexation attitudes split by religiosity: not found for 2025–26.
- Oct 7 casualty and evacuation figures: Wikipedia only.
- Named ordinary resident voices on 2026: not found.
