# B. Which kinds of lists do Israeli polls miss, and should the 2026 forecast correct for it?

Round 1, researcher B. Written 2026-10-23, four days before the vote. Status: a recommendation.
Nothing in the model has been changed.

**Lists named in this memo.** The brief calls Yashar "Naftali Bennett's new list". In
`data/parties.json`, **Yashar! is Gadi Eisenkot's list** (17.2% central). **B'Yachad is Bennett's list,
with Yair Lapid at no. 2** (10.3%). This memo follows the repo. The two lists have different
historical analogues, and section 5 treats them separately.

## 0. Bottom line

1. **Some kinds of lists show a stable bias across seven elections (2013 to 2022).** These are the
   biases that held in both halves of the record:
   - **Shas is under-polled**: +1.0 points on average, under-polled in 6 of 7 elections, sd 0.8.
   - **Ra'am is under-polled**: +0.8 points, 4 of 4.
   - **Arab lists as a whole are under-polled whenever Arab turnout rises.** That happened in 4 of 4
     such elections, and Arab lists were over-polled in 2 of 2 elections where turnout fell.
   - **New small lists fall short of their final polls**: −1.0 points, 8 of 8. All five lists
     polled at 2.4–4.6% that were either new or running alone for the first time (Yachad 2015, New
     Right, Zehut and Gesher in April 2019, Otzma in September 2019) failed the threshold.
   - **Bennett's lists fall short**: 6 of 6, −1.5 points on average.
   - **Yesh Atid as an established list falls short**: 3 of 3, −1.1 points.
2. **Some kinds of lists show no reliable bias.** For these, apply nothing:
   - **Likud**: +0.9 points on average, but the median is −0.2 and the last four elections average
     −0.3. Its two big misses (2015, April 2019) were late consolidation, not a constant bias.
   - **UTJ**, **Yisrael Beiteinu** and **Labor/Meretz** are all close to zero.
   - **Far-right lists** were over-polled through 2020 and under-polled in 2021 and 2022, so the sign
     has flipped.
   - **First-time large centrist lists did not deflate.** All four met or beat their final polls.
3. **The model's +1.7-seat Netanyahu-bloc lean is almost entirely Shas.** Weighted by recency the
   same way, Shas's own seat error is +1.6 seats; take it out and the lean is **+0.1**. Applying a
   Shas prior and the lean together counts the same miss twice.
4. **Leave-one-election-out test.** Each election was predicted with priors estimated from the other
   six, by deterministic allocation (section 6). The recommended package against the final-poll
   baseline:

   | | Polls only | Recommended package |
   |---|---|---|
   | Mean absolute seat error per list | 1.62 | 1.41 to 1.44 (−13%) |
   | Correct threshold calls, out of 27 near-threshold lists | 22 | 24 |
   | Bloc error, 3.25% era only | 1.83 seats | 1.67 to 1.83 (neutral) |

   The bloc lean alone did not change the per-list error. Stacking the lean on top of the class
   priors made the bloc error *worse* (3.00 against 2.43 seats).
5. **Recommendation: apply the class priors only.** The six priors are in the table below. Cut the
   common lean to about 0, using the lean ex-Shas, because the Shas prior now carries it.

   | List | Prior (vote-share points) |
   |---|---|
   | Shas | +0.8 |
   | Ra'am | +0.6 |
   | Joint List | +0.4 |
   | B'Yachad | −0.8 |
   | Reservists | −0.8 |
   | Amcha Yisrael (poi) | −0.8 |

   Do not apply a prior to Yashar, Likud, UTJ or Blue and White.
6. **Effect on the 2026 central forecast.** Four lists move one seat each: Shas 8→9, Ra'am 5→6,
   B'Yachad 14→13, Religious Zionism 7→6.

   | Bloc | Now | With the recommendation |
   |---|---|---|
   | Netanyahu bloc | 52 | 52 |
   | Anti-Netanyahu Zionist bloc | 54 | 53 |
   | Arab lists | 14 | 15 |

   The most likely majority outcome stays "neither bloc at 61". The threshold calls do not change:
   Reservists and Amcha both still fail, but their chance of passing falls from about 46% to about
   10–15%.

## 1. Data and method

**Sources.** I used the raw wikitext of the English Wikipedia pages (`action=raw`), read on
2026-10-23:

- The polling pages:
  - "Opinion polling for the 2013 Israeli legislative election", "…2015…", "…April 2019…",
    "…September 2019…", "…2020…", "…2021…" and "…2022…".
  - Example URL: https://en.wikipedia.org/w/index.php?title=Opinion_polling_for_the_2022_Israeli_legislative_election&action=raw
- The results: the `{{Election results}}` template on each election article (votes, %, seats).
  - Example URL: https://en.wikipedia.org/w/index.php?title=2022_Israeli_legislative_election&action=raw

**Final week.** The final week is the last poll by each outlet (firm × publisher) dated within 7 days
before the publication blackout.

| Election | Window |
|---|---|
| 2013 | Jan 11–18 |
| 2015 | Mar 6–13 |
| April 2019 | Mar 29 – Apr 5 |
| September 2019 | Sep 6–13 |
| 2020 | Feb 21–28 |
| 2021 | Mar 12–19 |
| 2022 | Oct 21–28 |

Exit polls were excluded. Between 8 and 16 outlets fall in each window, all firms included.
Leaving out Direct Polls / Channel 14 moves no class mean by more than 0.04 points.

**Cross-check against the repo.** My final-week Netanyahu-bloc means reproduce
`calibration.json`'s "field" figures to within 0.1–0.7 seats: 2022 60.2 against 60.3, 2021 50.3
against 50.3, 2020 57.4 against 57.3.

**How errors are measured.** Signed error = result − polls. It is reported three ways:

- **Seats.** Comparable to the scoring rule, but threshold failures make it jump: a list polled at
  4.6 seats that gets 3.16% scores −4.6.
- **Vote-share points.** The main measure. A poll's seats are converted to a share of the vote that
  passed. Lists a poll printed below the threshold keep the percentage it printed.
- **Seat-equivalents (share × 120 / passing share).** Used in the cross-validation.

The conversion to vote share uses the election's actual passing share as the scale. This is a
small, common rescaling, and it is a known leak.

**Scripts and tables.** These are in the scratchpad, not the repo:

- `/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/B-listbias/code/`
  - `finalweek.py`, `analyze.py`, `classes.py`, `cv2.py`, `cv3.py`, `apply2026b.py`
- Per-list table: `/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/B-listbias/table_all.json`

The full per-election tables are in the Appendix.

## 2. Signed error by class of list (result − final-week polls)

The table has 85 list-elections across 2013–2022. For the error columns, + means the polls
under-estimated the list. "Early" is 2013 to April 2019; "late" is September 2019 to 2022.

| Class | n | Mean (pts) | sd | Times under-polled | Mean (seats) | Early (pts) | Late (pts) | Stable? |
|---|---|---|---|---|---|---|---|---|
| Likud (2013: Likud–YB) | 7 | +0.94 | 3.07 | 3/7 | +1.9 | +2.60 | −0.32 | **No**: two consolidation spikes, about 0 since |
| Shas | 7 | **+1.02** | 0.76 | **6/7** | +1.2 | +0.75 | +1.23 | **Yes** |
| UTJ | 7 | +0.25 | 0.41 | 4/7 | +0.2 | +0.41 | +0.12 | Small |
| Arab lists (each list) | 13 | +0.44 | 0.91 | 10/13 | +0.3 | +0.18 | +0.66 | Yes in direction; the size follows turnout (§3.4) |
| Far right / religious Zionist* | 11 | −0.80 | 0.98 | 3/11 | −1.2 | −1.30 | −0.52 | **Flips**: − to 2020, + in 2021–22 |
| Other right (YB, Kulanu 2019, Yamina 2021) | 8 | +0.02 | 0.77 | 5/8 | −0.1 | +0.58 | −0.31 | None |
| New centrist list, first run: Yesh Atid 2013, Kulanu, Blue and White April 2019, National Unity | 4 | **+2.59** | 2.39 | **4/4** | +3.8 | +3.36 | +0.29 | Never deflated; size erratic |
| Other new lists, first run** | 8 | **−1.03** | 0.74 | **0/8** | −2.8 | −0.83 | −1.65 | **Yes** |
| Established centre: Yesh Atid 2015–22, Blue and White Sep 2019–21, Kadima | 7 | −0.15 | 1.37 | 2/7 | 0.0 | −0.33 | −0.08 | None (but Yesh Atid itself 3/3 −) |
| Labor / Meretz / left | 13 | −0.26 | 1.20 | 5/13 | −0.7 | −0.91 | +0.30 | Flips |

\* Jewish Home 2013, 2015 and 2022; Otzma 2013, September 2019 and 2020; URWP; Yamina September 2019 and 2020; Religious Zionism 2021; RZP–Otzma–Noam 2022.

\** Hatnuah, Am Shalem, Yachad–Otzma, New Right, Zehut, Gesher, New Hope, New Economic.

**The brief's own grouping of new centrist lists.** The brief's class is Yesh Atid 2013, Kulanu,
Blue and White April 2019, Zehut, New Hope and National Unity. As one group they average +1.05
points with sd 2.9, from +6.0 down to −2.7: no usable signal. The split above is what carries
information. The list that became the main new vehicle was under-polled. Smaller new lists, and new
lists that were sliding, were over-polled.

**Near-threshold lists.** In the 3.25% era, 24 lists were polled at an implied 2.4–4.6%.

- **New lists, or lists running alone for the first time:** 5 of 5 failed (Yachad 2015, New Right,
  Zehut and Gesher in April 2019, and Otzma in September 2019, its first solo run since it had sat
  inside joint lists). Their mean error was −1.0 points.
- **Established lists** (Meretz, Labor, Ra'am, Hadash–Ta'al, Yisrael Beiteinu, Blue and White 2021,
  Religious Zionism 2021, Kulanu 2019, Shas April 2019): 18 of 19 passed, Meretz 2022 being the one
  exception. Their mean error was **+0.72** points. These are the "rescue vote" cases: Blue and White
  2021 +2.9, Labor 2021 +1.9, Meretz 2021 +1.2.

The same rule appears in a different form in `calibration.json`'s 7-in-12 threshold record. Every
listed failure except Meretz 2022 was a new list or a first solo run.

**Bennett's and Lapid's records.** The two names at the head of B'Yachad have their own records
against the final polls:

| Election | Bennett's list | Error (pts) | Yesh Atid as an established list | Error (pts) |
|---|---|---|---|---|
| 2013 | Jewish Home | −1.61 | — | — |
| 2015 | Jewish Home | −2.61 | Yesh Atid | −0.98 |
| April 2019 | New Right | −1.30 | — | — |
| September 2019 | Yamina (no. 2) | −0.97 | — | — |
| 2020 | Yamina | −0.91 | — | — |
| 2021 | Yamina | −1.59 | Yesh Atid | −1.26 |
| 2022 | — | — | Yesh Atid | −1.05 |

Bennett's lists fell short 6 times in 6 (mean −1.50 points). Yesh Atid fell short 3 times in 3
(mean −1.10 points). Its first run in 2013 (+6.0) is in the new-list class above.

**Yisrael Beiteinu.** +0.77, +1.13, +0.15, +0.23, −0.43, +0.09: mean +0.32, positive 5 times in 6.
This is consistent with under-coverage of Russian-speakers, but the effect is small.

**Largest list and consolidation.** The list leading the polls, or the leading pair in a two-horse
race, gained sharply in two elections. In 2015 Likud gained +6.0 points while trailing Zionist
Union. In April 2019 Likud gained +4.8 and Blue and White +3.6. In 2013 the leader, the merged
Likud–Yisrael Beiteinu, was over-polled by −3.0. From September 2019 to 2022 the leader was within
±1.5 points.

The spikes came from the leader's own camp:

- **2015:** Jewish Home −2.6, Yachad failed.
- **April 2019:** New Right and Zehut failed, URWP −1.1, Labor −2.8, Meretz −0.65.

This is a variance term, which the model already has (consolidation sd 1.5 seats). It is not a
constant bias.

## 3. Mechanisms, with sources

### 3.1 Over-stating large lists, under-stating sectoral ones: undecided and "label" answers

Nehemia Gershuni-Aylho (Project 61, later theMadad) ran the first systematic Israeli poll audit, of
2006, 2009 and 2013. Pollsters "pretty consistently predict too many seats for Likud, Labor, centrist
parties … and Meretz — and just as consistently predict too few for ultra-Orthodox and Arab parties."
Examples: Teleseker over-stated Labor by 2.5 seats on average, and Hagal Hahadash over-stated Likud
by 4.

His mechanisms:

- **Label answers.** Undecided respondents name a big party to signal their camp. Right-leaners say
  "Likud" and then vote for a smaller right list.
- **Hard-to-reach groups.** Arabs and Haredim answer phone polls less.
- **Undecideds.** 20–50% of respondents are undecided, and about 7 seats often move unexpectedly.

Source: Times of Israel, H. Rettig Gur, 27 Jan 2015,
https://www.timesofisrael.com/how-a-28-year-old-analyst-is-fixing-israels-polls/

My data reproduce his sectoral finding for Shas and the Arab lists after 2013. They do not reproduce
his finding of a constant Likud over-statement: since 2015 Likud has been at or above its polls.

### 3.2 Late consolidation and the blackout (Likud 2015, April 2019)

- **Gershuni-Aylho, the day after the 2015 vote.** The polls missed only "the split inside the right
  bloc": "קמפיין הגיוועלד של נתניהו שינה את החלטתם של רבים ולכן תוצאות האמת שונות מהסקרים"
  (Netanyahu's gevalt campaign changed many people's decisions, so the real results differ from the
  polls). Source: Kipa, N. Laifer, 18 Mar 2015, https://www.kipa.co.il/חדשות/%d7%99%d7%95%d7%9d-%d7%94%d7%9b%d7%99%d7%a4%d7%95%d7%a8%d7%99%d7%9d-%d7%a9%d7%9c-%d7%94%d7%a1%d7%95%d7%a7%d7%a8%d7%99%d7%9d-%d7%94%d7%a1%d7%a7%d7%a8%d7%99%d7%9d-%d7%94%d7%99%d7%95-%d7%90%d7%9e%d7%99/
- **Brookings.** Netanyahu framed the race as a two-party contest his side was losing, which "ignited
  a panic" on the right. Source: https://www.brookings.edu/articles/israels-election-what-happened/
  (via search summary).
- **Gal Ariely, 2026.** "Election polls, at the end of the day, are accurate for their moment."
  Source: Times of Israel, B. Sales, 16 Oct 2026,
  https://www.timesofisrael.com/3-experts-on-how-youre-reading-election-polls-wrong-and-why-they-cant-predict-the-result/
- **The blackout.** No new polls may be published from midnight Friday 23/24 October until the
  polls close. Source: Maariv, M. Cohen, 12 Oct 2026,
  https://www.maariv.co.il/news/elections-2026/article-1376327
  So the last four days of movement are unmeasured by construction.

**Implication.** The leader's late gain is real but campaign-dependent. 2026 has the 2015 shape:
Likud trails the largest opposition list by 2 to 3 seats in the field. That argues for keeping, or
widening, the consolidation variance, not for a central shift.

### 3.3 Shas: hard-to-reach traditional voters

- **The pattern.** Shas's under-polling is the most stable list-level bias in the record: +1.9 points
  in April 2019, +1.8 in September 2019 and +1.8 in 2022.
- **Gershuni-Aylho (2015 article above).** He attributes it to sectoral non-response.
- **A sampling-hours argument, from one columnist.** A Hebrew opinion column argues that phone
  polls fielded on Saturday afternoons, or on weekday evenings during prayer times, miss observant
  voters. This is the most direct mechanism offered, but it is one writer's claim. It surfaced in a
  search summary, linked from https://www.inn.co.il/news/139544; I did not read the column itself.
- **Respondents misreporting.** In a post-election survey by Camil Fuchs, over 80% of respondents
  said they had voted, against about 60% actual turnout. Polls mis-model who votes. Source: Ynet,
  https://www.ynet.co.il/news/article/HymMjypQd, via search summary.

Shas's electorate (Mizrahi, traditional, lower-income, peripheral) sits where both problems are
largest. UTJ's Ashkenazi-Haredi bloc vote is more predictable and polled closely (+0.25).

### 3.4 Arab lists: pollsters anchor sector turnout

Shmuel Rosner (Madad, Channel 13) notes that pollsters must estimate "אחוזי השתתפות של מגזרים שונים"
(turnout by sector) when they turn answers into seats. Source: Maariv, 15 Aug 2026,
https://www.maariv.co.il/news/opinions/article-1355773

My data show what happens when that estimate is wrong. The table pairs the Arab lists' combined
error with Arab turnout. Turnout figures are from the INSS/IDI series, read through a search summary
of https://www.inss.org.il/wp-content/uploads/2022/11/No.-1661.pdf and
https://en.idi.org.il/articles/47297.

| Election | Arab turnout | Change from previous | Combined Arab error (pts) |
|---|---|---|---|
| 2015 | 63.5% | +7.0 | +0.56 |
| April 2019 | 49.2% | −14.3 | **−0.45** |
| September 2019 | 59.2% | +10.0 | +1.69 |
| 2020 | 64.8% | +5.6 | +1.28 |
| 2021 | 44.6% | −20.2 | **−1.15** |
| 2022 | 53.2% | +8.6 | +2.79 |

Polls under-estimated the Arab lists in 4 of 4 rising-turnout elections (mean +1.58 points) and
over-estimated them in 2 of 2 falling ones. This fits turnout assumptions anchored on the previous
election.

Ra'am is under-polled in every case: +0.94, +0.46, +0.70, +1.03. Its base is Negev Bedouin
(about 74% Ra'am in 2021, and Bedouin-periphery turnout of 29%). Source: Dayan Center, Z. Abu Habla,
May 2021, https://dayan.org/content/analysis-arab-voting-patterns-elections-24th-knesset

That population, including the unrecognized villages, is the hardest in Israel to sample.

**2026 turnout.**

- **Stat-Net projects 63%**, against the 56% the article gives for 2022. The IDI/INSS series has
  53.2%, the baseline used in this memo. Either way the direction is up. Source: Times of Israel /
  Reuters, 21 Oct 2026,
  https://www.timesofisrael.com/turnout-among-israels-arab-voters-could-make-or-break-hopes-to-unseat-netanyahu/
- **The Konrad Adenauer Program (Dayan Center), May 2026, found 53%** in the landscape at the time,
  and 67% if the Joint List re-formed. Source:
  https://dayan.org/content/integration-and-influence-survey-arab-citizens-israel

The Joint List did re-form in August as Hadash–Ta'al–Balad, without Ra'am. Rising turnout is
therefore the expected case, which history says the polls under-shoot.

### 3.5 New lists: soft support and "wasted vote" desertion

New lists near the threshold lose voters at the end. Those voters fear wasting the ballot and have
no habit of voting for the list. This happened to all five such lists in the record.

- **2015.** Left Foot Forward: Likud's surge came "mainly at the expense of other right wing parties,
  especially … Jewish Home and … 'Yahad', the latter failing to reach the threshold." Source:
  https://leftfootforward.org/2015/03/israeli-elections-how-netanyahu-defied-the-pollsters/ (via
  search summary).
- **2026.** Rosner warns that "you might have to redistribute somewhere between zero and 10 seats
  on the day after election day" because of threshold lists. Source: the Times of Israel article of
  16 Oct 2026 cited in §3.2.

Established small lists show the opposite, a late rescue: Blue and White, Labor and Meretz in 2021.

### 3.6 Shy Likud voters: no evidence in the pre-election polls

Two things are true, and they point in opposite directions:

- **Refusals were real in the 2015 exit polls.** Fuchs blamed his 2015 exit-poll miss on higher
  refusal rates, which a rival said were highest at pro-Likud stations. Source: Times of Israel,
  https://www.timesofisrael.com/botched-tv-exit-polls-earn-vote-of-non-confidence/ (via search summary).
- **Fuchs says undecideds lean centre-left.** He argued in 2020 that undecided voters lean
  centre-left, which would bias party-based polls toward the right. Source: Times of Israel,
  23 Jul 2020,
  https://www.timesofisrael.com/top-pollster-challenges-assertion-right-wing-bloc-has-been-gaining-ground/

In the final-week polls, Likud's error over the last four elections is −0.3 points. The bloc misses
of 2021 and 2022 came from Shas, Religious Zionism and Meretz's threshold failure, not from Likud
(§6).

### What I could not get

- No IDI post-mortem of poll error turned up. IDI material was used only for turnout.
- No Haaretz post-mortem, no Mano Geva interview and no Knesset Jeremy accuracy table.
- I did not find theMadad's 2022 per-party table beyond the 1.16-seat figure already in
  `calibration.json`.

None of these is cited above.

## 4. 2026 conditions that bear on the priors

- **Haredim and the draft law.** Shas and UTJ say they will not join a government without a draft
  exemption. Channel 12 reports that Gur Hasidim, about 30,000 potential voters (about 0.6 seats),
  plan not to vote or to cast protest ballots, with "no efforts to mobilize". Source: Times of Israel
  liveblog, 14 Oct 2026,
  https://www.timesofisrael.com/liveblog_entry/netanyahu-reportedly-worried-gur-hasidim-wont-turn-out-to-vote/
  That is a UTJ-specific downside, roughly the size of UTJ's historical +0.25-point under-polling.
  The two cancel, so the UTJ prior is none. Shas has no comparable report.
- **Yashar (Eisenkot) against B'Yachad (Bennett and Lapid).**
  - B'Yachad fell from about 25 seats in May to about 13. Pollsters attributed the loss mostly to
    movement to Yashar (`data/parties.json`; Times of Israel, 7 Sep 2026).
  - In September and October the field has Yashar slipping from 23–25 to 20–23 and B'Yachad steady
    at 11–15.
  - Every Bennett list since 2013 and every established Yesh Atid run has finished below its final
    polls.
- **The far right running separately.** Otzma is at 6.5% and RZ–Zehut at 5.4%, with Amcha Yisrael
  (Ofer Winter) competing for the same voters at 3.2%.
  - When the far-right lists ran apart from each other with Likud contesting first place (2015,
    April 2019), they lost 1 to 2.6 points.
  - When united and surging (2021–22), they gained 0.4 to 1.1.
  - 2026 looks more like the first case, but the evidence is weak.

## 5. Proposed 2026 priors

Values are vote-share points added to the field mean share before the lean and the allocation, then
renormalised. Confidence is how sure I am of the sign, and that the size is not larger than the
evidence supports.

| List | Prior | Confidence | Evidence |
|---|---|---|---|
| shas | **+0.8** | Medium-high | Under-polled 6 of 7 elections, mean +1.02, sd 0.76, both halves of the record. Shrunk 20% toward 0. |
| utj | none | Low | Historical +0.25, offset by the Gur abstention report (about −0.6 points at most). |
| likud | none | Medium | Median −0.24; −0.32 over the last four elections. The 2015 and April 2019 spikes were late consolidation, carried by the consolidation variance. If anything, widen that variance, since this is a 2015-shaped race for first place. |
| otzma | none (optional −0.2) | Low | Far-right class −0.80, but the sign flipped in 2021–22. |
| rz | none (optional −0.4) | Low | As Otzma. RZ also absorbs Zehut, which deflated 1.4 points in 2019. |
| poi (Amcha Yisrael) | **−0.8** | Medium-high on the sign | New list near the threshold: 5 of 5 new or newly solo lists failed, mean −1.0; the new-list class is 8 of 8 negative. It competes for right voters with Likud and RZ, the Yachad/New Right/Zehut pattern. |
| noam | none | — | No polling. |
| yashar | **none** | Low | First-time large centrist lists were never deflated (4 of 4 at or above their polls; mean +2.6, but driven by 2013 and April 2019 late surges). The leave-one-out test gives no gain from applying +2.6. Do **not** apply "new-party deflation" to it. |
| byachad | **−0.8** | Medium | Bennett's lists 6 of 6 negative (mean −1.5); Yesh Atid established 3 of 3 negative (mean −1.1); falling list (New Hope 2021, also falling, was −2.65). List-specific, so not testable by class in the leave-one-out run; shrunk about 40%. |
| dem | none | Low | Left class −0.26, flips by era. |
| yb | none (optional +0.3) | Low | 5 of 6 positive, mean +0.32. |
| bw | none | High on the call | At 1.1%, below the threshold in every poll. Its 2021 rescue (+2.9) came when it polled 4 seats, not 1. Gantz may withdraw. The call stays "fails". |
| res | **−0.8** | Medium-high on the sign | New list near the threshold: 5 of 5 new or newly solo lists failed. Its two components both deflated in their last runs: Zelekha's New Economic −0.65 in 2021, and Hendel's Derech Eretz ran inside New Hope at −2.65. |
| jl | **+0.4** | Medium-low | Arab lists are under-polled in 4 of 4 rising-turnout elections, and 2026 turnout is projected to rise (Stat-Net 63%). Scaled down because the turnout forecast itself is uncertain. |
| raam | **+0.6** | Medium | Under-polled 4 of 4 (mean +0.78): the Negev Bedouin sampling problem. It also lifts Ra'am clear of the threshold. |

The net-bloc sum of the recommended priors is +0.8 (Shas) − 0.8 (Amcha) = 0.0 points. Amcha's share
is below the threshold anyway, so in seats the bloc gains about +1 from Shas.

## 6. The bloc lean and the class priors: complement, replace, or double count?

### Decomposition of the bloc miss

The table splits the Netanyahu-bloc seat miss by class, using `calibration.json`'s bloc
definitions. Values are result − final-week polls, in seats.

| Election | Bloc miss | Likud | Shas | UTJ | Far right | New small | Other right |
|---|---|---|---|---|---|---|---|
| 2015 | −0.1 | +8.2 | −0.4 | −0.6 | −3.8 | −4.1 | +0.6 |
| April 2019 | −0.4 | +6.5 | +2.7 | +1.5 | −1.3 | −11.4 | +1.6 |
| September 2019 | −0.7 | −0.8 | +2.0 | −0.4 | −1.4 | — | — |
| 2020 | +0.6 | +1.8 | +0.7 | −0.4 | −1.4 | — | — |
| 2021 | +1.7 | −0.4 | +0.9 | +0.1 | +1.1 | — | — |
| 2022 | +3.8 | +0.9 | +2.6 | +0.1 | +0.2 | — | — |
| Mean | +0.8 | +2.7 | +1.4 | +0.0 | −1.1 | −2.6 | +0.4 |

Two conclusions follow.

1. **Within-bloc errors are several times the bloc error.** The per-list part of the score is driven
   by redistribution inside the bloc. A common swing in proportion to share cannot correct that. It
   gives Likud about 40% of the +1.7 seats, although Likud has had no lean since 2019.
2. **The lean is Shas.** Weighted by recency (half-life two elections, as in `forecast.mjs`):

   | | Seats |
   |---|---|
   | Lean, as used now | +1.75 |
   | Shas's own seat error, same weights | +1.64 |
   | Lean with Shas's error removed | **+0.11** |

   Adding a Shas prior while keeping the +1.7 lean counts the same miss twice. In the 2026 central
   forecast the double-counted variant gives the Netanyahu bloc 53, against 52 for the clean variant.

### Leave-one-election-out test

Each election was predicted with priors estimated from the other six elections. Shares were allocated
deterministically (D'Hondt, threshold on seat-equivalents). The test covers 85 lists, 7 elections and
27 near-threshold cases.

| Method | Per-list absolute error (seats) | Bloc absolute error, all 7 | Bloc absolute error, 3.25% era | Threshold calls right |
|---|---|---|---|---|
| Final-week polls only | 1.62 | 2.57 | 1.83 | 22/27 |
| + bloc lean only | 1.62 | 2.57 | 1.67 | 22/27 |
| + Likud prior only | 1.62 | 2.57 | 1.67 | 22/27 |
| + new-large prior only (the "Yashar" question) | 1.62 | 3.00 | 2.50 | 22/27 |
| + Shas prior only | 1.58 | 2.29 | 1.33 | 22/27 |
| + Arab prior only | 1.55 | 2.57 | 2.00 | 22/27 |
| + new-small prior only | 1.53 | 3.00 | 2.17 | 23/27 |
| + all ten classes ×1.0 | 1.53 | 3.29 | 2.67 | 22/27 |
| + all ten classes ×0.5 | 1.44 | 2.43 | 1.67 | 24/27 |
| **+ Shas, Arab, new-small ×1, far right ×0.5** | **1.41** | 2.71 | 1.83 | **24/27** |
| **+ same ×0.75, far right ×0.4** | **1.44** | **2.43** | **1.67** | **24/27** |
| + bloc lean **and** Shas, Arab, new-small ×0.75 | 1.44 | 3.00 | 2.00 | 23/27 |

What the test shows:

- **The selected classes help.** Shas, Arab and new-small priors cut the per-list error by about
  13% (1.62 to 1.41–1.44) and gain two threshold calls. The gain is concentrated in April 2019,
  September 2019, 2020 and 2022.
- **Unselected classes add noise.** Using all ten classes at full strength is worse on the bloc. The
  Likud, new-large, centre and left priors carry no out-of-sample signal.
- **The lean adds nothing to the per-list score** and little to the bloc, and stacked on the class
  priors it worsens the bloc error. That is the double count.

Back-of-envelope for 2026: the expected gain is about 0.1–0.2 seats per list, roughly 1.5–2.5 total
absolute seats over 13 lists. The bloc error is unchanged in expectation if the lean is replaced
rather than stacked. No threshold call changes; the calls are only made more robust (next section).
The highest-probability outcome is unchanged.

**Limits.** Seven elections is a small sample. The classes were chosen after looking at the data,
which is partly mitigated by leave-one-out and by keeping only the classes whose sign held in both
halves of the record. The deterministic test does not include the model's noise terms.

### Effect on the 2026 central seats

Computed from the current `data/forecast.json` field shares with the model's own Bader-Ofer and
surplus agreements. Variant A reproduces the published point exactly.

| List | A: now (lean 1.7) | B: priors + lean 1.7 (double count) | C: **recommended**: priors + lean 0.1 | D: C + optional priors |
|---|---|---|---|---|
| likud | 21 | 21 | 21 | 21 |
| otzma | 8 | 8 | 8 | 8 |
| shas | 8 | 9 | **9** | 9 |
| utj | 8 | 8 | 8 | 8 |
| rz | 7 | 7 | **6** | 6 |
| poi | 0 (3.20%) | 0 (2.42%) | **0 (2.32%)** | 0 (2.32%) |
| yashar | 23 | 22 | 23 | 23 |
| byachad | 14 | 13 | **13** | 12 |
| dem | 9 | 9 | 9 | 9 |
| yb | 8 | 8 | 8 | 9 |
| bw | 0 | 0 | 0 | 0 |
| res | 0 (3.18%) | 0 (2.39%) | **0 (2.47%)** | 0 (2.48%) |
| jl | 9 | 9 | 9 | 9 |
| raam | 5 (4.29%) | 6 | **6 (5.02%)** | 6 |
| **Netanyahu bloc** | 52 | 53 | 52 | 52 |
| **Zionist opposition** | 54 | 52 | 53 | 53 |
| **Arab lists** | 14 | 15 | 15 | 15 |

**Threshold robustness.** Without the lean, Reservists sit at 3.3% and would be called *passing*
(4 seats). The current "fails" call rests on a lean that is really a Shas effect. With the −0.8 prior,
Reservists sit at about 2.5% and Amcha at about 2.3%. Under the model's list noise (about 0.66 points
at a 3% share) that puts their chance of passing at roughly 10–15%, against 46–47% now.

`data/polls.json` already holds newer polls than the ones `forecast.json` used: Maariv 22 Oct
replaces Maariv 16 Oct, and both Maariv and Zman Yisrael give Reservists 4 seats. The next run
could therefore flip Reservists to "passes" unless a prior is applied. Since 2015, every new list in
this position, or running alone for the first time, has failed.

## 7. Recommendation

**Apply only these:**

| List | Prior (pts) |
|---|---|
| shas | +0.8 |
| raam | +0.6 |
| jl | +0.4 |
| res | −0.8 |
| poi | −0.8 |
| byachad | −0.8 |

**At the same time, replace the common lean with the lean net of Shas: +0.1 seats, effectively 0.**
The lean's *width* (bloc sd 3.1) stays as it is.

**Do not apply:**

- a Likud prior;
- a Yashar prior in either direction;
- UTJ, far-right, left, centre or Yisrael Beiteinu priors. The optional far-right and Yisrael
  Beiteinu values in §5 are for sensitivity runs only.

**Implementation sketch.** For whoever owns `scripts/forecast/forecast.mjs`:

1. Add `listPriors: { shas: 0.8, raam: 0.6, jl: 0.4, res: -0.8, poi: -0.8, byachad: -0.8 }`
   (points) to `calibration.json`.
2. In `forecast.mjs`, after `const base = meanShares(...)`, add each prior / 100 to `base[id]`
   (floor 0.002) and renormalise.
3. Recompute the lean from `result − field − shasSeatError` per election, or store the Shas errors
   (−0.4, +2.7, +2.0, +0.7, +0.9, +2.6 seats) in `calibration.json`. This gives a lean of about 0.1.
4. No new width is needed. The historical sd of the class errors (Shas 0.76, new-small 0.74, Arab
   0.91) is within the existing list noise (1.08 points at 8%).
5. Log the change in the changelog of `2026-10-23-forecast-algorithm.md` with this memo as the
   reason, before the final lock on Oct 26.

**If only one change is made:** move the lean onto Shas, as a +0.8-point Shas prior with a lean of
about 0. It is the best-supported single item: under-polled 6 of 7 times, and it explains 94% of
the current lean.

## Appendix: per-election evidence tables

"Polls" is the mean of each outlet's final poll in the final-week window (§1); a poll that put a
list below the threshold counts 0 seats. The "%" columns are implied vote shares as defined in §1.
Error = result − polls.

**2013 (Jan 22; threshold 2%)**: 14 outlets

| List | Class | Polls (seats) | Result (seats) | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud–Yisrael Beiteinu | likud | 34.0 | 31 | −3.0 | 26.33 | 23.34 | −2.99 |
| Yesh Atid | new centrist | 10.7 | 19 | +8.3 | 8.30 | 14.33 | +6.03 |
| Labor | left | 16.8 | 15 | −1.8 | 13.00 | 11.39 | −1.61 |
| Jewish Home | far right | 13.9 | 12 | −1.9 | 10.73 | 9.12 | −1.61 |
| Shas | shas | 10.7 | 11 | +0.3 | 8.30 | 8.75 | +0.45 |
| UTJ | utj | 5.8 | 7 | +1.2 | 4.48 | 5.16 | +0.68 |
| Hatnuah | new small | 7.8 | 6 | −1.8 | 6.03 | 4.99 | −1.04 |
| Meretz | left | 5.5 | 6 | +0.5 | 4.26 | 4.55 | +0.29 |
| UAL–Ta'al (Ra'am) | arab | 3.5 | 4 | +0.5 | 2.71 | 3.65 | +0.94 |
| Hadash | arab | 3.9 | 4 | +0.1 | 3.04 | 2.99 | −0.05 |
| Balad | arab | 3.2 | 3 | −0.2 | 2.49 | 2.56 | +0.07 |
| Kadima | centre | 2.3 | 2 | −0.3 | 1.77 | 2.09 | +0.32 |
| Otzma LeYisrael | far right | 2.1 | 0 | −2.1 | 1.63 | 1.76 | +0.13 |
| Am Shalem | new small | 1.8 | 0 | −1.8 | 1.36 | 1.20 | −0.16 |

**2015 (Mar 17)**: 16 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud | likud | 21.8 | 30 | +8.2 | 17.36 | 23.40 | +6.04 |
| Zionist Union | left | 24.2 | 24 | −0.2 | 19.30 | 18.67 | −0.63 |
| Joint List | arab | 12.6 | 13 | +0.4 | 10.05 | 10.61 | +0.56 |
| Yesh Atid | centre | 12.3 | 11 | −1.3 | 9.80 | 8.82 | −0.98 |
| Kulanu | new centrist | 8.9 | 10 | +1.1 | 7.06 | 7.49 | +0.43 |
| Jewish Home | far right | 11.8 | 8 | −3.8 | 9.35 | 6.74 | −2.61 |
| Shas | shas | 7.4 | 7 | −0.4 | 5.87 | 5.74 | −0.13 |
| Yisrael Beiteinu | right | 5.4 | 6 | +0.6 | 4.33 | 5.10 | +0.77 |
| UTJ | utj | 6.6 | 6 | −0.6 | 5.22 | 4.99 | −0.23 |
| Meretz | left | 4.9 | 5 | +0.1 | 3.93 | 3.93 | 0.00 |
| Yachad–Otzma | new small | 4.1 | 0 | −4.1 | 3.28 | 2.97 | −0.31 |

**April 2019**: 13 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud | likud | 28.5 | 35 | +6.5 | 21.70 | 26.46 | +4.76 |
| Blue and White | new centrist | 29.5 | 35 | +5.5 | 22.52 | 26.13 | +3.61 |
| Shas | shas | 5.3 | 8 | +2.7 | 4.05 | 5.99 | +1.94 |
| UTJ | utj | 6.5 | 8 | +1.5 | 4.99 | 5.78 | +0.79 |
| Hadash–Ta'al | arab | 7.1 | 6 | −1.1 | 5.40 | 4.49 | −0.91 |
| Labor | left | 9.5 | 6 | −3.5 | 7.27 | 4.43 | −2.84 |
| Yisrael Beiteinu | right | 3.2 | 5 | +1.8 | 2.88 | 4.01 | +1.13 |
| URWP | far right | 6.3 | 5 | −1.3 | 4.81 | 3.70 | −1.11 |
| Meretz | left | 5.6 | 4 | −1.6 | 4.28 | 3.63 | −0.65 |
| Kulanu | right | 4.2 | 4 | −0.2 | 3.69 | 3.54 | −0.15 |
| Ra'am–Balad | arab | 3.3 | 4 | +0.7 | 2.87 | 3.33 | +0.46 |
| New Right | new small | 5.9 | 0 | −5.9 | 4.52 | 3.22 | −1.30 |
| Zehut | new small | 5.5 | 0 | −5.5 | 4.16 | 2.74 | −1.42 |
| Gesher | new small | 0.4 | 0 | −0.4 | 2.48 | 1.73 | −0.75 |

**September 2019**: 9 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Blue and White | centre | 32.1 | 33 | +0.9 | 26.00 | 25.95 | −0.05 |
| Likud | likud | 32.8 | 32 | −0.8 | 26.54 | 25.10 | −1.44 |
| Joint List | arab | 11.0 | 13 | +2.0 | 8.91 | 10.60 | +1.69 |
| Shas | shas | 7.0 | 9 | +2.0 | 5.67 | 7.44 | +1.77 |
| Yisrael Beiteinu | right | 8.4 | 8 | −0.4 | 6.84 | 6.99 | +0.15 |
| UTJ | utj | 7.4 | 7 | −0.4 | 6.03 | 6.06 | +0.03 |
| Yamina | far right | 8.4 | 7 | −1.4 | 6.84 | 5.87 | −0.97 |
| Labor–Gesher | left | 4.8 | 6 | +1.2 | 3.87 | 4.80 | +0.93 |
| Democratic Union | left | 5.3 | 5 | −0.3 | 4.32 | 4.34 | +0.02 |
| Otzma Yehudit | far right | 3.0 | 0 | −3.0 | 3.18 | 1.88 | −1.30 |

**2020 (Mar 2)**: 9 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud | likud | 34.2 | 36 | +1.8 | 28.29 | 29.46 | +1.17 |
| Blue and White | centre | 33.3 | 33 | −0.3 | 27.56 | 26.59 | −0.97 |
| Joint List | arab | 13.8 | 15 | +1.2 | 11.39 | 12.67 | +1.28 |
| Shas | shas | 8.3 | 9 | +0.7 | 6.89 | 7.69 | +0.80 |
| UTJ | utj | 7.4 | 7 | −0.4 | 6.15 | 5.98 | −0.17 |
| Labor–Gesher–Meretz | left | 8.8 | 7 | −1.8 | 7.26 | 5.83 | −1.43 |
| Yisrael Beiteinu | right | 6.7 | 7 | +0.3 | 5.51 | 5.74 | +0.23 |
| Yamina | far right | 7.4 | 6 | −1.4 | 6.15 | 5.24 | −0.91 |
| Otzma Yehudit | far right | 0.0 | 0 | 0.0 | 1.71 | 0.42 | −1.29 |

**2021 (Mar 23)**: 8 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud | likud | 30.4 | 30 | −0.4 | 24.94 | 24.19 | −0.75 |
| Yesh Atid | centre | 18.5 | 17 | −1.5 | 15.19 | 13.93 | −1.26 |
| Shas | shas | 8.1 | 9 | +0.9 | 6.67 | 7.17 | +0.50 |
| Blue and White | centre | 4.5 | 8 | +3.5 | 3.70 | 6.63 | +2.93 |
| Yamina | right | 9.5 | 7 | −2.5 | 7.80 | 6.21 | −1.59 |
| Labor | left | 5.1 | 7 | +1.9 | 4.21 | 6.09 | +1.88 |
| UTJ | utj | 6.9 | 7 | +0.1 | 5.65 | 5.63 | −0.02 |
| Yisrael Beiteinu | right | 7.4 | 7 | −0.4 | 6.06 | 5.63 | −0.43 |
| Religious Zionism | far right | 4.9 | 6 | +1.1 | 4.00 | 5.12 | +1.12 |
| Joint List | arab | 8.1 | 6 | −2.1 | 6.67 | 4.82 | −1.85 |
| New Hope | new small | 9.0 | 6 | −3.0 | 7.39 | 4.74 | −2.65 |
| Meretz | left | 4.1 | 6 | +1.9 | 3.39 | 4.59 | +1.20 |
| Ra'am | arab | 3.5 | 4 | +0.5 | 3.09 | 3.79 | +0.70 |
| New Economic | new small | 0.0 | 0 | 0.0 | 1.44 | 0.79 | −0.65 |

**2022 (Nov 1)**: 9 outlets

| List | Class | Polls | Result | Seat error | Polls (%) | Result (%) | Error (pts) |
|---|---|---|---|---|---|---|---|
| Likud | likud | 31.1 | 32 | +0.9 | 23.65 | 23.41 | −0.24 |
| Yesh Atid | centre | 24.8 | 24 | −0.8 | 18.84 | 17.79 | −1.05 |
| RZP–Otzma–Noam | far right | 13.8 | 14 | +0.2 | 10.48 | 10.84 | +0.36 |
| National Unity | new centrist | 11.6 | 12 | +0.4 | 8.79 | 9.08 | +0.29 |
| Shas | shas | 8.4 | 11 | +2.6 | 6.42 | 8.25 | +1.83 |
| UTJ | utj | 6.9 | 7 | +0.1 | 5.24 | 5.88 | +0.64 |
| Yisrael Beiteinu | right | 5.8 | 6 | +0.2 | 4.39 | 4.48 | +0.09 |
| Ra'am | arab | 4.0 | 5 | +1.0 | 3.04 | 4.07 | +1.03 |
| Hadash–Ta'al | arab | 4.0 | 5 | +1.0 | 3.04 | 3.75 | +0.71 |
| Labor | left | 5.1 | 4 | −1.1 | 3.89 | 3.69 | −0.20 |
| Meretz | left | 4.6 | 0 | −4.6 | 3.46 | 3.16 | −0.30 |
| Balad | arab | 0.0 | 0 | 0.0 | 1.86 | 2.91 | +1.05 |
| Jewish Home | far right | 0.0 | 0 | 0.0 | 1.84 | 1.19 | −0.65 |
