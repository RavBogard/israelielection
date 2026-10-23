# E. Context: what the polls do not carry, and what other forecasters say

Research memo, round 1, Friday 2026-10-23 (four days before the vote; poll publication closes tonight).
Scope: final-week events, turnout, surplus agreements, other forecasts and markets, late swing.
Compared against `data/forecast.json` as generated 2026-10-23T21:44Z (Netanyahu bloc 52 central,
P(61+) 6%; Zionist opposition 54; Arab lists 14; Likud 21, Yashar 23).

## 0. Bottom line

1. **All five surplus pairs the model uses are official.** The Central Elections Committee published
   them in the Official Gazette on Oct 19 (Yalkut HaPirsumim 15045, p. 1098), with a sixth fringe pair.
   No change to the model. `data/results.json` (two pairs listed "unconfirmed") and `parties.json`
   (Shas–UTJ "signing not found") are out of date.
2. **Blue and White withdrew on Oct 19** but stays on the ballot, and votes for it are wasted. The model
   still gives it 1.1%, averaged from two polls taken before the withdrawal. That share should go mostly
   to the non-Netanyahu lists and Reservists. Worth about one seat outside the Netanyahu bloc.
3. **Five final polls published Oct 22–23 are not in the forecast inputs**: Israel Hayom/Kantar,
   Maariv, Kan, Channel 12 and Channel 13. Every mainstream final has the Netanyahu bloc at 50 (Maariv
   48), the Arab lists at 14–16, and Amcha Yisrael below the threshold. The Trump endorsement (Oct 18)
   and Gantz's exit produced no visible movement toward Netanyahu.
4. **Arab turnout is the largest non-poll risk, and it points up.** Arab lists beat their final
   polls in every election where Arab turnout rose (Sep 2019 +1.8, 2020 +1.2, 2022 +2.0 seats). They
   fell short in every election where it dropped (Apr 2019 −0.6, 2021 −1.9). The 2026 indicators show
   a rise. A +1 seat lean for the Arab lists is defensible, with moderate-to-low confidence.
5. **In the final days, votes move within the Netanyahu bloc more than into it.** The 2015 "late
   surge" moved the bloc by under one seat. Likud gained about 9 seats from its partners. Two patterns
   recur in the history and are bloc-neutral. Shas beats its final polls (5 of 6 elections, mean +1.4
   seats). The religious-right partner lists fall short of theirs, and every right-wing fringe list
   polled near 4 seats has failed (4 of 4). Amcha Yisrael fits that profile, so 47% is too high for
   it to pass.
6. **Le Millénaire's 55–56 seats and 23–26% differ from our model mainly because it counts the Filber
   firms (Channel 14, Direct Polls), weighted by accuracy.** That disagreement is about which polls to
   use. It adds no new information about this election, so it is no reason to move the lean.

## 1. What happened, Oct 15–23

| Date | Event | Likely effect on votes | Source |
|---|---|---|---|
| Oct 15 | Likud and Religious Zionism announce ~2,000 activists at Arab polling stations, citing unsubstantiated fraud claims; Arab MKs call it intimidation | Backlash mobilisation of Arab voters (the Sep 2019 precedent, §2.2) | https://www.timesofisrael.com/liveblog_entry/likud-smotrich-to-station-2000-activists-at-arab-polling-stations-on-election-day-citing-unsubstantiated-concerns-of-fraud/ |
| Oct 15–16 | Diplomatic-mission voting: 86.7% (4,218 voters), up 17.1 points from 2022 | A weak sign of engaged electorate; tiny n | https://www.timesofisrael.com/israeli-emissaries-abroad-end-voting-with-turnout-17-percentage-points-higher-than-2022/ |
| Oct 16 | Surplus-agreement deadline (noon, at the CEC). Five main pairs signed; no deal for Otzma Yehudit, Amcha Yisrael, Reservists, Blue and White | See §3 | https://www.kikar.co.il/political-news/surplus-agreements-elections-hendel-winter-ben-gvi ; https://www.ynet.co.il/news/elections2026/article/hjextlj2gl |
| Oct 18 | **Trump endorses Netanyahu** ("Great Warrior Prime Minister"; suggests the US might not "finish the job" on Iran without him) | Final polls after it show no gain for the bloc (Ch12 51 on Oct 19 → 50 on Oct 23) | https://www.itv.com/news/2026-10-18/trump-endorses-embattled-israeli-leader-benjamin-netanyahu-for-reelection ; https://www.ynetnews.com/opinions-analysis/article/by0f11mbhge |
| Oct 18 | The Gerrer Rebbe's directive to vote UTJ is a bare request to vote: no campaign headquarters, no instruction to mobilise. UTJ officials fear Ger abstention | Small downside risk for UTJ turnout (§2.3) | https://www.israelnationalnews.com/news/434775 |
| Oct 18 | Former Likud tech official's affidavit: the Likud app could track voters at polling places | Legal; little vote effect | https://en.wikipedia.org/wiki/2026_Israeli_legislative_election |
| **Oct 19** | **Gantz withdraws Blue and White**, eight days out. It stays on the ballot and its votes are wasted. No endorsement. Its candidates resign within two days. Reservists and Amcha court its voters. Sa'ar and RZP call on right-wing lists near the threshold (named: Amcha Yisrael) to follow | Moves the ~1% B&W share; raises pressure on Amcha | https://www.timesofisrael.com/blue-and-whites-benny-gantz-pulls-out-of-race-sealing-precipitous-political-fall/ ; https://www.aljazeera.com/news/2026/10/19/benny-gantz-drops-out-of-israels-election-race ; https://he.wikipedia.org/wiki/הבחירות_לכנסת_העשרים_ושש |
| Oct 19 | Stone attack on Amcha candidate Fleur Hassan-Nahoum's car (West Bank); salt shakers thrown at Bennett in Bnei Brak, two staff hurt; Golan billboard defaced | Atmosphere; no measurable effect | https://en.wikipedia.org/wiki/2026_Israeli_legislative_election |
| Oct 19 | Reuters/ToI: Stat-Net projects Arab turnout 63% (vs 56% in 2022 on its measure) | §2.2 | https://www.timesofisrael.com/turnout-among-israels-arab-voters-could-make-or-break-hopes-to-unseat-netanyahu/ |
| Oct 20–21 | Soldiers begin voting at 850 military stations | — | https://www.ynetnews.com/article/bkws4y8nzl |
| Oct 21 | Netanyahu meets Haredi Public Party leader Moti Leitner (0.5–1.3% in polls) and asks him to withdraw; no deal as of the report | If he withdraws, ≈0.5 point returns to the Netanyahu bloc | https://www.israelnationalnews.com/news/434946 |
| Oct 21–22 | FT report that Trump blocked a planned Israeli strike on Iran (Netanyahu denies); Katz says opposition leaders will be to blame for future attacks | Security-fear messaging; no visible poll movement | https://www.timesofisrael.com/liveblog-october-22-2026/ ; https://www.ynetnews.com/article/hkbuyph2fx |
| Oct 22 | High Court (2–1): party representatives may not count and transmit voter numbers digitally in real time (the Likud app) | Blunts Likud's election-day targeting of non-voters in its strongholds. Speculative; do not model it | https://en.wikipedia.org/wiki/2026_Israeli_legislative_election |
| Oct 22 | CEC chair Sohlberg orders Likud to remove Arabic billboards linking Eisenkot and others to Tibi and Abbas | The 2015/2019 "Arabs" playbook, partly blocked | https://www.haaretz.com/israel-news/elections/2026-10-23/ty-article-live/.free/netanyahu-cancels-all-friday-campaign-events-due-to-west-bank-shooting-attack/000001a1-65f1-d6e1-abb7-77ffe02e0002 |
| Oct 22 | Shas: Rabbi Moshe Maya says Likud voters have "no share in the world to come"; Rabbi Yitzhak Yosef says a vote for Ben-Gvir is forbidden. UTJ builds a workaround for the turnout-data ban (booths, Agudah tents) | Shas mobilising against defections to Likud (§2.3, §5) | https://www.ynetnews.com/article/sk400k2v2ml |
| Oct 22 | Glass bottle thrown at Netanyahu's motorcade near Mahane Yehuda; Herzog condemns political threats | — | https://en.wikipedia.org/wiki/2026_Israeli_legislative_election |
| Oct 23 | Shooting attack near Hebron (two wounded); **Netanyahu cancels all Friday campaign events**; Eisenkot praises soldiers for preventing a "massive terror attack" | A small security-salience bump is possible; precedent says such bumps are small | Haaretz live blog (above) |
| Oct 23 | Netanyahu: US aid at its current scale is "over"; asks officials for a crypto plan to bypass sanctions; Lapid and Forer attack it | Economic-risk story on the last campaign day | Haaretz live blog (above) |
| Oct 23 | A small party led by Rabbi Haim Yosef David Abargel (arrested 2025 on suspicion of sexual offences against minors) drops out in a deal with Likud | Negligible vote; signals Likud's consolidation drive | Haaretz live blog (above) |
| Oct 23 | Smotrich tours six hesder yeshivas with ten rabbis (electioneering-law concerns); High Court halts his E1 housing push over campaigning concerns | — | Haaretz live blog; https://www.ynetnews.com/article/syegcluhfg |

No new scandal, debate or list disqualification turned up in the scan. Eisenkot asked for a debate;
none was confirmed. The ballot has 38 lists. The list withdrawals happened in September (Unity, A
Place for Us All and others), apart from Blue and White and the Abargel list.

### 1.1 Final polls not in the forecast inputs

The forecast's newest inputs are dated Oct 22, and Zman Yisrael's fieldwork for it ran Oct 21–22. These
were published afterwards, or are missing:

| Poll | Published | Net bloc | Zionist opp. | Arab | Likud | Yashar | Shas | Res | Amcha | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| Israel Hayom / Kantar | Oct 22 | 50 | 52 (+Res 4) | 14 | 21 | 23 | 8 | 4 | <thr. | https://www.ice.co.il/research/news/article/1134739 |
| Maariv / Lazar (fw Oct 19–22) | Oct 23 | 48 | 54 | 14 | 19 | 21 | 8 | 4 | 3.0% | https://www.jpost.com/israel-election-2026/article-912649 |
| Kan 11 / Kantar (n 1,106) | Oct 23 | 50 | 52–53 | 14 | 20 | 22 | 7 | 4 | 2.9% | https://www.haaretz.co.il/news/elections/2026-10-23/ty-article/000001a1-69ad-d29a-a1a5-ebaf49c50000 |
| Channel 12 / Midgam (n 1,018) | Oct 23 | 50 | 56 | 14 | 21 | 23 | 8 | 2.4% | 2.5% | same |
| Channel 13 (n 1,084) | Oct 23 | 50 | 54 | 16 | 19 | 22 | 7 | 3.0% | 3.1% | same |

The model's Israel Hayom input is from Oct 8, while a newer Oct 22 poll from the same publisher exists.
Its Maariv input is from Oct 16 and is superseded by Oct 23. The Kan, Channel 12 and Channel 13 inputs
are each superseded by Friday releases. Haredi Public (Leitner) appears at 0.5–1.3% in two finals.
Researcher A/B owns the import; I note it here because it bears on items 2, 6 and 7 of §6.

## 2. Turnout

### 2.1 Overall

- Electorate: about 7.3M registered (CEC via Al Jazeera). About 810,000 of them, one in nine, live
  abroad and mostly cannot vote, so official turnout has a ceiling near 89%.
  https://www.ynetnews.com/article/hk5ryml3fl ;
  https://www.aljazeera.com/amp/news/2026/10/20/israels-elections-2026-explained-in-maps-and-charts
- History (CEC): 2015 72.3%, Apr 2019 68.5%, Sep 2019 69.8%, 2020 71.5%, 2021 67.4%, 2022 70.6%.
  https://www.timesofisrael.com/interim-data-shows-election-turnout-is-lowest-since-2009/
- Expectations: no CEC forecast exists. Haaretz expects turnout to be "high". In Maariv's final poll,
  81% say they are certain to vote, against 71% actual turnout in 2022 (opposition supporters 87%,
  coalition 83%, Arab-party supporters 81%, up from 74% on Oct 8). Polymarket's turnout market: 74%+
  at 37%, 72–74% at 25%, so roughly a 60% chance of 72% or more, i.e. above 2022. It is a thin market
  ($11K). About 50,000 expatriates are expected to fly in (ToI).
  https://www.jpost.com/israel-election-2026/article-912649 ; https://polymarket.com/politics/israel-election
- Threshold arithmetic (Taub Center via Ynet): about 171,000 votes at 70% turnout and about 183,000 at
  75%, against about 155,000 in 2022. The threshold is a share of the vote, so a high overall turnout
  changes nothing unless it is *differential*. https://www.ynetnews.com/article/rkszhiolfg

**Implication:** none for the central forecast on its own. What matters is which groups' turnout
moves, below.

### 2.2 Arab turnout: history, surprise, 2026

| Election | Arab turnout | Change from the previous election | Arab lists, final-week poll mean (seats) | Result | Miss |
|---|---|---|---|---|---|
| Mar 2015 | ≈63% | up (Joint List formed) | 12.7 | 13 | +0.3 |
| Apr 2019 | 49.2% | −14 | 10.6 (H-T 6.8 + Ra'am–Balad 3.7) | 10 | −0.6 |
| Sep 2019 | 59.2% | +10 | 11.2 | 13 | **+1.8** |
| Mar 2020 | ≈64–65% | +5 | 13.8 | 15 | **+1.2** |
| Mar 2021 | 44.6% | −20 | 11.9 (JL 8.1 + Ra'am 3.75) | 10 | **−1.9** |
| Nov 2022 | 53.2% | +9 | 8.0 (H-T 4 + Ra'am 4) | 10 | **+2.0** |

Poll means are my own: every non-exit poll in the final week before the silence period, taken from the
Wikipedia polling pages for
[2015](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2015_Israeli_legislative_election),
[Apr 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election),
[Sep 2019](https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election),
[2020](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election),
[2021](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election) and
[2022](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election).
Turnout figures: IDI for Sep 2019 (https://en.idi.org.il/articles/28660, which gives 49.2% → 59.2%);
IDI for 2021 and 2022 (https://en.idi.org.il/articles/47297: 44.6% → 53.2%, 2013–22 average 55.9%);
ToI/Al-Monitor for 2020 (63.5–65%: https://www.timesofisrael.com/surveys-predict-bump-in-arab-voter-turnout-ahead-of-november-1-elections/ ,
https://www.al-monitor.com/originals/2022/09/polls-predict-new-lows-arab-israeli-voter-turnout); Channel 12
via ToI for 2015 (63%).

**The pattern.** The sign of the poll miss on the Arab lists matched the sign of the turnout change
in all five elections since 2015 where turnout moved materially (5 of 5). The size was 1–2 seats.
Pollsters weight to the previous electorate, so they lag turnout swings.

**The surprise was measurable in 2022.** Before the vote, Arab-turnout projections were 40.5% (Makan),
49% (Konrad Adenauer Program) and "slightly less than 40%" (Al-Monitor's summary). The result was
53.2%. In Sep 2019 IDI attributed the 10-point jump "in large part" to a reaction against Likud's
"government of the Left and the Arabs" campaign.

**2026 indicators.** All of them point up:
- Stat-Net projects 63%, against 56% in 2022 on its own measure (IDI's figure for 2022 is 53.2%).
  Jewish Insider quotes Stat-Net at 68–69%, so the reports conflict.
  https://www.timesofisrael.com/turnout-among-israels-arab-voters-could-make-or-break-hopes-to-unseat-netanyahu/ ;
  https://jewishinsider.com/2026/10/final-israeli-polls-stalemate-tuesdays-election/
- Konrad Adenauer Program, May 2026: 53% as things stood, 67% if the Joint List reunited. Hadash,
  Ta'al and Balad did reunite; Ra'am runs separately.
  https://www.acitaskforce.org/resource/arab-society-and-israels-2026-elections-between-electoral-power-and-political-influence/
  The program's Nov 2025 survey gave 52.4%, or 61.8% with a reunified list (Dayan Center, Hebrew).
- Maariv: Arab-party supporters "certain to vote" rose from 74% (Oct 8) to 81% (Oct 23).
- Backlash triggers like 2019's are present: the Likud billboards tying Eisenkot to Tibi and Abbas,
  ordered removed on Oct 22, and the 2,000 activists at Arab polling stations. Abbas is campaigning
  explicitly on turnout. https://www.jpost.com/israel-election-2026/article-912145
- One counter-indicator: the surge rests on a ballot without Balad's leader (Abu Shehadeh withdrew
  Oct 2) and on lists that were only reinstated by the Supreme Court on Oct 2.

**What it implies for the 14 seats.** The model gives jl + raam 10.9% of the vote, about the same as
the 10.7% all three Arab lists won in 2022 at 53% turnout (H-T 3.75 + Ra'am 4.07 + Balad 2.90). So
the model implicitly assumes 2022-level Arab turnout. Arab citizens are about 16% of the resident
electorate, and about 85% of their votes go to Arab lists. Moving Arab turnout from 53% to 60–63%,
with Jewish turnout near 72%, raises the Arab lists to roughly 12–13% of valid votes, or **15–16
seats**. Three Friday finals give 14 and one gives 16. Ra'am, polled at 5–7, has never failed when
polled at 4 or more (Ra'am–Balad 2019 passed at 3.33%; Ra'am 2021 at 3.79%; Ra'am 2022 at 4.07%). The
model's 90% is low; Polymarket has 96% and Le Millénaire 80%. A side effect: every extra point of Arab
vote share lowers each Jewish list's share by about 1%, which slightly hurts Reservists and Amcha at
the threshold.

### 2.3 Haredi turnout

Signals are mixed and none of them is quantified:
- UTJ: the Gerrer Rebbe's "minimum directive" and no Ger headquarters (INN, Oct 18). Degel is
  "unimpressed". The draft-law fight ended in a pre-election enforcement freeze, not a law
  (JTA, Oct 23: https://www.jta.org/2026/10/23/israel/will-this-election-end-the-battle-over-drafting-haredi-men-into-the-israeli-army).
  A Kol Chai assessment of "up to 10%" Haredi abstention is reported second-hand and unverified
  (Media Line: https://themedialine.org/top-stories/israels-election-the-polls-are-split-and-so-is-the-press/).
- Shas: unusually strong rabbinical messaging (Maya, Yitzhak Yosef) aimed at stopping defections to
  Likud and Otzma.
- Record: UTJ's final-week poll mean against its result was −0.4, +1.5, −0.4, −0.4, +0.1, +0.1
  (2015 → 2022; mean +0.1). Shas: −0.4, **+2.75, +2.0**, +0.7, +0.75, **+2.6** (mean +1.4; beat
  the polls in 5 of 6). Polls have never overstated the Haredi lists by more than half a seat, and
  they systematically understate Shas, whose traditional Mizrahi voters are hard to poll and mobilised
  late.

**Implication:** leave UTJ alone and widen it a little at most. Shas has the strongest list-level
history of beating its polls of any list in the model (§6, item 3).

## 3. Surplus-vote agreements, as officially published

**Primary source:** CEC notice under s. 67(c) of the Knesset Elections Law, signed by CEC chair Noam
Sohlberg on 18 Oct 2026 and published in Yalkut HaPirsumim 15045, p. 1098, on 19 Oct 2026:
https://www.gov.il/BlobFolder/guide/candidates-lists-26/he/yp15045.pdf (read directly; Hebrew).
The deadline was Friday Oct 16 at noon (11 days before the vote).

| # | Pair (ballot letters) | In the model | Status |
|---|---|---|---|
| 1 | B'Yachad (רק) – Yisrael Beiteinu (ל) | yes | **Official** (signed Sep 10) |
| 2 | Joint List (ודם) – Ra'am (עם) | yes | **Official** (signed Sep 11) |
| 3 | Religious Zionism–Zehut (ט) – Likud (מחל) | yes, as "reported" | **Official** (signed Oct 6) |
| 4 | UTJ (ג) – Shas (שס) | yes, as "reported" | **Official** (signed Oct 11) |
| 5 | The Democrats (אמת) – Yashar! (דרך) | yes | **Official** (signed Sep 10) |
| 6 | Brit Olam LeGeulat Yisrael (זץ) – HaTikun LeShitat HaBechirot VeHaMimshal (נקי) | no | Official; both fringe, irrelevant |

**No agreement:** Otzma Yehudit (Likud declined it; Ben-Gvir refused Amcha: "Winter is Bennett II"),
Amcha Yisrael / People of Israel, Reservists–Economic (Hendel and Winter each refused the other),
Blue and White (refused both blocs), and Noam.
Press: https://www.jpost.com/israel-election-2026/article-911320 (Shas–UTJ, Oct 11),
https://jpost.com/israel-election-2026/article-911592 (Ben-Gvir refusal, Oct 13),
https://www.timesofisrael.com/liveblog_entry/likud-and-religious-zionism-sign-surplus-vote-agreement/ (Oct 6),
https://www.emess.co.il/radio/1945293 (deadline day).

**For the model:** no change. `forecast.mjs` already pairs all five, because it concatenates
`agreements` and `unconfirmedAgreements`. Housekeeping for others: in `data/results.json`, move
Likud–RZ and Shas–UTJ to `agreements` with the gazette as source. Update `surplusLine` for Shas and UTJ
in `parties.json`. In the algorithm memo's step 9, replace "three signed per press reports, two
reported" with "five published by the CEC on Oct 19". Otzma's lack of a partner costs it nothing in
expectation beyond the small D'Hondt pooling edge, which the allocator already handles.

## 4. Other forecasts and markets (as of Oct 23–24)

| Source | Date | Netanyahu bloc, central | P(bloc ≥ 61) | Other | Polls included / lean | URL |
|---|---|---|---|---|---|---|
| **This model** | Oct 23 | **52** (mean 53.1) | **6%** | Opp 54, Arab 14; Res 46%, Amcha 47%, Ra'am 90% | 7 field polls (latest per firm, 14 days), Filber firms excluded; +1.7 lean | data/forecast.json |
| Le Millénaire | Oct 24 update | 55.4 (shown as 55; range 45–67) | **23%** (Oct 23: 56.1 / 26%; Oct 14: 29%) | Anti-Netanyahu 61+: 8%; neither 69%; Likud 23, Yashar 21; Hendel–Zelekha 28%, Amcha 34%, Ra'am 80%; Likud first 55% | 67 polls, 8 firms incl. Direct Polls and Next Data (Ch14), Sep 7–Oct 23; weighted by recency, size and past accuracy; replays one of the five 2019–22 errors per run (e.g. +2.4 for 2022, −4.4 for Sep 2019) | https://forecast.lemillenaire.org/en/israel/knesset/2026/ |
| Polymarket | Oct 23 | — (no bloc-61 market) | — | Next PM: Eisenkot 50%, Netanyahu 29% ($52M); more seats: opposition 60%, Bibi 40% ($23K); largest party Yashar 70%; Likud 20–24 seats 44%, <20 28%; first mandate Eisenkot 57%; Ra'am wins seats 96%; turnout ≥74% 37% | Market | https://polymarket.com/politics/israel-election |
| MEF poll of polls | Oct 23 | 53 | — | Opp 53, Arab 14; Res mean 2.9 seats, Amcha 1.1 | Latest per house within 14 days, all houses incl. Filber, unweighted, sub-threshold = 0 | https://israelvote.meforum.org |
| Jewish Insider average | Oct 22 | 54 (all polls); 50 (mainstream, last two days) | — | Opp 50 / 52; Ch14 + i24 average 61 | Simple averages | https://jewishinsider.com/2026/10/final-israeli-polls-stalemate-tuesdays-election/ |
| Maariv average | Oct 21 | ≈50 | — | Zionist opp 53; Yashar 22.5, Likud 19.75 | Ch12, Ch13, Kan, Walla | via https://themedialine.org/top-stories/israels-election-the-polls-are-split-and-so-is-the-press/ |
| JDN (Haredi site) model | Oct 19 | 58 | — | Zionist opp 47, Arab 15 | 13 polls, 8 firms; focuses on wasted right-wing votes | via Media Line (above); original not retrieved |
| Mainstream final polls (5) | Oct 22–23 | 50, 50, 50, 50, 48 | 0 of 5 at 61 | Arab 14–16 | — | §1.1 |
| Channel 14 / Next Data | Oct 21–22 | 62 | — | Likud 30 | — | https://www.c14.co.il/article/1750553 |
| Good Judgment Open (Likud seats) | live | — | — | Likud <22: 41%; 22–26: 35%; 27–31: 19% | Crowd | https://www.gjopen.com/questions/5007-how-many-seats-will-likud-win-in-the-2026-israeli-legislative-elections |
| Octagon AI | undated | — | — | Netanyahu next PM: market 30%, model 24% | Market + model | https://www.octagonai.co/markets/main-election/israel-election/prime-minister-of-israel-after-the-next-election.md |
| Ynet analysts (Azulay, Hess) | Oct 21 | — | "unlikely" | Most likely outcome: another election | Judgment | via Media Line |

Not found or not reachable: theMadad's 2026 model (HTTP 403 from here:
https://themadad.com/english/2026-election-model/), Knesset Jeremy, Project 61, Metaculus, Manifold. I
found no academic model.

**Why they differ from 52 / 6%:**
- *Le Millénaire.* Nearly all of the gap comes from including Channel 14 and Direct Polls with
  accuracy weights. Direct Polls was the most accurate firm in 2022. Our own sensitivity run gives the
  same answer: all nine polls with the +1.7 lean produce 57 seats and 21%. Its 23% also reflects a
  much wider error distribution (range 45–67, replaying Sep 2019's −4.4). Its threshold
  probabilities sit below ours for Amcha (34% vs 47%), Reservists (28% vs 46%) and Ra'am (80% vs 90%).
  The first two fit §5; the third conflicts with §2.2.
- *MEF and the Jewish Insider average* include the Filber firms unweighted and apply no lean. Without
  the Filber firms they land at 50, plus our 1.7 lean, which is about our 52.
- *JDN's 58* comes from all polls plus an assumption that right-wing votes now wasted (Amcha, Haredi
  Public, Noam) come back. This is the consolidation argument in §5, taken to its maximum.
- *Polymarket* prices who governs, not seats. "Opposition wins more seats 60%" is close to our
  "Netanyahu bloc larger than Zionist opposition 54%" (i.e. 46% the other way). The market is a little
  more anti-Netanyahu than our model, and that market is thin ($23K).
- Every source agrees on the scored majority outcome: no bloc at 61 is the most likely result (our
  93%, Le Millénaire 69%, every mainstream final poll).

## 5. Late swing and "shy" voters: the record

Final-week poll means (non-exit, pre-silence) against the result, in seats, from the same Wikipedia
tables. Bloc misses are from `scripts/forecast/calibration.json`.

| Election | Bloc miss (field) | Likud | Religious-right partner(s) | Shas | Right-fringe lists polled ≈4+ | What happened late |
|---|---|---|---|---|---|---|
| Mar 2015 | +0.6 | **+8.8** (21.2 → 30) | Jewish Home −3.8 (11.8 → 8) | −0.4 | Yachad (4–5) **failed**, 2.97% | Netanyahu's "no Palestinian state" (Mar 16) and "Arabs flocking" (Mar 17). Election-day exit polls also had Likud at 27, so this was partly differential response, not only late movement. Votes moved *within* the bloc |
| Apr 2019 | +0.3 | **+6.75** (28.3 → 35) | URWP −1.3 | **+2.75** | New Right (5–7) **failed**, 3.22%; Zehut (4–8) **failed** | A two-party squeeze: Blue and White also gained 5.75 |
| Sep 2019 | −0.6 | −0.6 | Yamina −1.1 | **+2.0** | Otzma (4 in 6 of 9 polls) **failed**, 1.88% | Likud's Arab-themed campaign backfired: Arab turnout +10, Joint List +1.8 |
| Mar 2020 | +0.7 | +1.9 | Yamina −1.5 | +0.7 | Otzma (≈2%) failed as polled | Mild consolidation to Likud |
| Mar 2021 | +1.7 | −0.7 | RZ **+1.1**; Yamina −2.6 | +0.75 | none | Gevalt for a threshold list: Blue and White polled 4, got 8. Arab turnout collapse: JL −2.1 |
| Nov 2022 | +3.7 | +0.8 | RZP–OY 0 (14 → 14) | **+2.6** | none on the right; Meretz (4–5) failed on the left | About 2 of the 3.7 seats are threshold mechanics: Meretz's 3.16% wasted (≈4 seats × 64/120). The rest is Likud and Shas share |

**What the record says.**
1. *Does the bloc swing late toward the incumbent?* Only a little. The bloc beat the final field in 5
   of 6 elections, but the miss was under one seat in four of the six. The +3.7 in 2022 is half threshold
   mechanics, which the model's simulation already draws explicitly. The lean of +1.7 (half-life two
   elections) is driven by 2022, so it partly counts the Meretz failure twice: once in the lean, and
   again whenever an opposition list fails in a simulation run. I estimate that inflates the lean by
   up to ≈0.5–1 seat. That is for the lean researcher to rule on, not a change I make here.
2. *Do votes move within the bloc?* Yes, and by a lot. Likud beat its polls by 7–9 seats in the two
   elections where the right was most fragmented (2015, Apr 2019), at the expense of its religious-right
   partners and fringe lists. The partner lists (Jewish Home, URWP, Yamina, RZ) fell short of their
   final polls in 4 of 6 elections (2022 even; 2021 RZ +1.1 while Yamina fell 2.6), mean ≈ −1.1. Right-fringe lists polled at about 4 seats failed in
   all four cases (Yachad, New Right, Zehut, Otzma 2019). Lists of other kinds polled at about 4 seats
   passed 8 of 9 times (Kulanu, Ra'am–Balad, YB, Meretz 2019 and 2021, Labor 2022, B&W 2021, Ra'am
   2021). Meretz 2022 was the one failure. This agrees with `calibration.json`'s 7 of 12 overall: most
   of the failures are right-fringe lists.
3. *Shas* beat its final polls in 5 of 6 elections.
4. *Arab lists* follow Arab turnout (§2.2), and Likud's Arab-themed campaigns have raised Arab turnout
   (Sep 2019) as often as they have mobilised Likud's own voters (2015).

**Does 2026 look like 2015 or 2022?**
- *Like 2015:* Likud trails the largest list in the final polls (by 1–4 seats), as it trailed Zionist
  Union by 3–4. It runs a late "Arabs" campaign (billboards, activists at polling stations) and a
  security-fear message (Katz, Iran, the Hebron attack). And it is pressing right-fringe lists to quit
  (Leitner, the Abargel deal, Sa'ar and RZP naming Amcha). This is the setting where Likud gained from
  its partners. Two differences matter. In 2015 there was no anti-Netanyahu "wasted vote" pool to
  exploit. And 2026's version is partly blocked: the CEC ordered the billboards removed, and the High
  Court banned the real-time turnout app.
- *Like Sep 2019:* the "Arabs" campaign coincides with signs that Arab turnout is rising, which is the
  backfire pattern.
- *Unlike 2022:* the wasted-vote risk is now roughly symmetric. In 2022 the anti-Netanyahu side wasted
  ≈6% (Meretz, Balad) and the right ≈1.2% (Jewish Home). Now the Netanyahu side has Amcha ≈3%, Haredi
  Public 0.5–1.3% and Noam ≈0.5%, against Reservists ≈3% (which sits outside both blocs) and the
  B&W remnant. So the 2022 mechanism that produced the +3.7 should not be expected to repeat in the
  same direction.
- No evidence of movement after the last polls: the finals published Oct 23 have the bloc flat at 50,
  after Trump's Oct 18 endorsement.

## 6. Adjustments the model could justify

Sizes are central-seat effects. "Bloc-neutral" means the item moves seats inside the Netanyahu bloc
and leaves its total unchanged.

| # | Adjustment | Size | Confidence | Evidence |
|---|---|---|---|---|
| 1 | **Blue and White → about 0.3%** (wasted residual), not 1.1%. Its share comes only from the Oct 8 and Oct 16 polls, both before it withdrew. Reallocate the rest to Yashar, Reservists and B'Yachad (Gantz's old partner is Eisenkot; Reservists explicitly court B&W voters), or simply drop `bw` from the field average. | ≈+1 seat to opposition plus Reservists; raises Reservists' pass chance a few points | High on direction, medium on size | ToI and Al Jazeera, Oct 19; `forecast.mjs` averages a list only over the polls that list it |
| 2 | **Import the five final polls** (§1.1). Owned by A/B; listed here because it is the largest single input change | Net bloc field average ≈50 (unchanged to −0.5); Arab ≈14.4; Amcha below in all five | High | §1.1 |
| 3 | **Shas +1 seat, taken from Likud or the lean's allocation** (bloc-neutral). Apply the lean in proportion to each list's historical miss, not to its share | 8 → 9 | Moderate (5 of 6, mean +1.4; one list, small n) | §2.3, §5 |
| 4 | **Directional consolidation**: a ≈1-seat mean shift from Otzma and RZ to Likud, instead of the current mean-zero draw (bloc-neutral) | Likud +1, RZ or Otzma −1 | Moderate-low (4 of 6 directionally; 2022 even, 2021 mixed) | §5, item 2; 2026 Likud consolidation drive |
| 5 | **Amcha Yisrael passes ≈25–35%, down from 47%.** Right-fringe lists near 4 seats failed 4 of 4; Amcha is below the threshold in all five finals (2.5–3.1%), lacks a surplus partner and is under public pressure to quit. The threshold *call* (fail) does not change; the bloc mean falls slightly and the calibration improves | point unchanged; mean −0.5 for the bloc | Moderate-high | §5; Le Millénaire 34% |
| 6 | **Arab lists +1 (14 → 15), mostly the Joint List; Ra'am pass ≈95%.** Exempt the Arab lists from the lean's negative side: the lean currently shrinks their shares in proportion, which runs against the turnout evidence | +1 Arab; about −0.5 each from the net and opposition blocs | Moderate-low on size, moderate on direction | §2.2: 5 of 5 sign agreement with turnout change; Stat-Net 63%; Maariv 74 → 81%; Ch13 final 16; Polymarket Ra'am 96% |
| 7 | **Reservists: leave at about 50%.** The finals split 3 to 2 (Kan, Israel Hayom and Maariv at 4; Ch12 2.4%, Ch13 3.0%). B&W's exit helps it; higher Arab turnout hurts it slightly. Non-fringe lists near 4 seats passed 8 of 9 times. If items 1 and 2 push it just over 50, let the call flip; do not force it | — | Low (a true coin flip) | §1.1, §5 |

Rough combined effect of items 1 and 3–6: Netanyahu bloc 51–52 (unchanged to −1), Zionist opposition
54–55, Arab 15, Likud 22, Shas 9. P(61+) stays in the single digits, and "neither" remains the modal
outcome.

## 7. Adjustments the model should NOT make

1. **No Trump-endorsement or security-event bump.** No final poll moved after Oct 18 or Oct 23. Past
   final-week security events have produced at most small movements, and those are already inside the
   historical bloc residual.
2. **No separate "shy Likud" or late-surge term on top of the +1.7 lean.** The lean is estimated from
   the same final-week misses that would justify such a term, so adding one counts them twice. The
   2015 surge was within the bloc (+0.6 for the bloc).
3. **Do not move toward Le Millénaire's or JDN's 55–58** on the strength of their numbers. The
   difference is the Filber-firm decision (the model's step 5) plus a maximal consolidation
   assumption. Neither is new evidence about this election.
4. **Do not use Polymarket as an input.** The large markets price who governs, and the seat markets
   are thin ($11K–$25K). It is a useful sanity check, and it currently leans slightly against
   Netanyahu compared with our model.
5. **Do not cut UTJ for Haredi abstention.** The Ger story and the "up to 10%" claim are unverified,
   and UTJ has matched its final polls for a decade (mean +0.1). At most, widen its noise a little.
6. **Do not adjust for expatriates flying in** (≈50,000 expected; perhaps 0.5 seat net, of unknown
   lean) or for overall turnout as such. The threshold is a share of the vote.
7. **Do not model the High Court's ban on Likud's real-time app or the billboard order** as seat
   effects. The direction is plausible (less Likud election-day targeting) and the size is unknowable.
8. **Do not re-open the agreements.** All five are official, and the fringe sixth pair is irrelevant.

## Sources (beyond those inline)

- Wikipedia, 2026 election: https://en.wikipedia.org/wiki/2026_Israeli_legislative_election
- Ynet, final 100 hours: https://www.ynetnews.com/article/rjgschongx
- Ynet election topic index (Oct 20–23 items): https://www.ynetnews.com/topics/Israel_elections_2026
- Walla poll Oct 20 (post-Gantz): https://www.jpost.com/israel-election-2026/article-912291
- Taub/Ynet on eligible voters and threshold votes: https://www.ynetnews.com/article/rkszhiolfg
- IDI on Arab turnout 2022: https://en.idi.org.il/articles/47297 ; Sep 2019: https://en.idi.org.il/articles/28660
- AP/ITV on the Trump endorsement: https://www.itv.com/news/2026-10-18/trump-endorses-embattled-israeli-leader-benjamin-netanyahu-for-reelection
- Media Line pollster roundup, Oct 23: https://themedialine.org/top-stories/israels-election-the-polls-are-split-and-so-is-the-press/
