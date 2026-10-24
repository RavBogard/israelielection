# H. What the 2026 polls do not carry: new lists, Haredi and Arab turnout, pollster methods, mechanics

Round 2 research memo, agent H. Written Saturday 2026-10-24 (vote Tuesday 2026-10-27; final lock Monday 9 PM
Central). Scope: context outside the 62 polls in `data/polls.json` (through Oct 22) that should shape version 3's
priors and risk terms. It builds on `round1/E-context.md` and does not repeat it. Where E already settled a point
(the five gazetted surplus pairs, the Oct 15–23 event timeline, the 2015–2022 Arab-turnout sign rule), I cite it and
add only what is new.

**Blindness.** I did not search for, open or read any 2026 poll published on or after Oct 23. Two caveats for the
red team:
- `round1/E-context.md` §1.1 and three rows of its §4 table contain held-out figures (the Oct 22–23 finals). They
  were written before the round-2 blind rule existed. Anyone who reads E, as this brief requires, has seen them. I
  use none of them, and nothing below is tuned to them.
- The cached Wikipedia wikitext from round 1 (scratchpad `wiki/2026.wiki`) contains the Oct 23 rows. My parser
  (scratchpad `H/others.py`) filters to fieldwork dates up to Oct 22 before printing anything. I read only the
  "Haredi Public" and "Others" columns from it.

Scripts are in `scripts/forecast/round2/H/` (Node ESM, read-only on the repo data; nothing committed):
`analogues.mjs` (new-list analogues), `trend2026.mjs` (2026 field trajectory by phase), `fringe.mjs` (historical
unpolled-list share), `arab-turnout.mjs` (the Arab turnout implied by the polls and by v2). No proposal here changes
model.mjs. The harness was checked once (`node scripts/forecast/backtest/v2.mjs 2000`; v2 row 1.36 / 2.00 / 1.42 /
4 / 6-6 / 0.091 at 2,000 runs).

## Summary

1. **The new lists split cleanly into two historical families, and v2's priors already follow the split.**
   - *Large new centrist lists never deflated.* Kulanu 2015 was +1.1 seats on its final-week mean, Kahol Lavan
     April 2019 +5.8, National Unity 2022 +0.5, and Yesh Atid 2013 +8.3 (B).
   - *New right-wing splinters and Bennett vehicles always did.* Yachad 2015 was −4.4, New Right −5.8, Zehut −5.6,
     Yamina September 2019 −1.5, Yamina 2021 −2.4, New Hope 2021 −3.0. New Hope's and Yamina's 2021 slides had
     already begun within the 28 days (10.9 → 9.0 and 10.8 → 9.4).
   - The 2026 counterparts:
     - Yashar is in the first family, so no prior.
     - B'Yachad is a Bennett list (−0.8 in v2).
     - Amcha Yisrael is a new right-wing splinter. It is also the only 2026 list with a falling field trajectory:
       3.8 → 2.8 → 1.5 seats across the campaign's three phases. Its pass chance should stay low, at or under v2's 19%.
     - Reservists–Economic is a first-time list (−0.8 in v2), but its field trajectory is rising (2.3 → 3.2 → 3.3).
     - Religious Zionism–Zehut has no clean analogue. It is an established list absorbing a 2019 bubble (Zehut:
       polled 5.6, got 2.74%).

   Nothing here argues for a change to the v2 priors.
2. **Nothing in the campaign after Oct 22 that I could find changes the list set.** Gantz's Blue and White
   withdrawal (Oct 19) is stronger than round 1 recorded. Every candidate resigned. The CEC ordered the slips removed
   from polling booths and will count any Blue and White ballot, including those already cast abroad and at army
   stations, as **invalid**. Those votes are therefore out of the denominator, not wasted.
   - Abergel's Ahi list withdrew on Oct 23 in a deal with Likud. Field polls had it at 0.1–0.8%.
   - Winter (Amcha) and Leitner (Haredi Public) both refused Netanyahu's and Smotrich's pressure to quit (Oct 21–22).
     Smotrich offered Winter a ministry. Winter's no. 8 quit.
   - I found no withdrawal by any modelled list as of Oct 24.
3. **Haredi turnout: one quantified downside for UTJ, one offset, and no reason to change Shas.**
   - Channel 12 (Oct 14) put about 30,000 potential Gur voters at risk of abstaining or casting protest votes, with
     no mobilisation effort. That is about 0.57% of the vote, or **0.7 of a seat at most**, and about 0.3 seats if
     half stay home.
   - Rabbi Lando (Degel) called incitement not to vote a "great crime". The CEC enjoined a Satmar-linked scheme that
     paid NIS 200 for a pledge not to vote.
   - Two new modern-Haredi lists (Haredi Public, HaKahal) poll at 0.1–1.3%.
   - Shas's late rabbinical mobilisation against defections to Likud fits its usual pattern. Its under-polling comes
     from traditional Mizrahi voters, whom the 2026 pollster designs do not reach any better (§4).
   - Recommendation: leave Shas's +0.8 prior alone. Give UTJ a small mean shift (−0.15 points) and a wider sd
     (override only).
4. **Arab turnout: the analysts' consensus is about 60% (IDI scale), and v2 already sits on it.**
   - The 2022 benchmark is 53.2% (IDI).
   - The pre-Oct-23 expectations:
     - Stat-Net: 63%, against 56% on its own 2022 measure, so about +7 points; possibly 68–69%.
     - Dahlia Scheindlin: "60 per cent, possibly more".
     - Joint List and Ra'am internal polls: above 60%.
     - Konrad Adenauer Program, May: 53% as things stood, 67% with a full reunification (which happened only in part).
     - Abraham Initiatives, Feb (young voters): 58.8–61.9%.
   - With 2022 as the anchor, the field polls alone imply about **56–57.5%** Arab turnout. v2's Arab-list share,
     priors included, implies **61.5–63.4%**.
   - So v3 should not add a further Arab shift on top of v2's +0.4 / +0.6 priors. Upside risk remains if Stat-Net's
     68–69% is right: about +1.5 to +2 seats beyond v2.
   - I found no organised 2026 boycott call. The Gaza war appears in reporting only as one grievance among several.
     Crime is named as the top concern, and fear of Ben-Gvir as the stated motivator.
5. **Pollster methods: most of the field's history does not carry over by firm, so historical house effects must be
   mapped by firm and shrunk hard.**
   - Of the seven field outlets, three have a 2019–22 firm record: Channel 12/Midgam, Kan/Kantar, and Maariv and
     Walla/Lazar (continuous only in part).
   - Israel Hayom changed firm (now Kantar).
   - Channel 13 changed to a new consortium (Panel Project HaMidgam, theMadad, Stat-Net, Askaria). Its 2021–22 Camil
     Fuchs record must not be applied to it.
   - Zman Yisrael/Tatika and Next Data have no record. Direct Polls kept the firm but lost its founder.
   - Channel 13's filing shows its Arab estimate rests on **100 phone interviews**, with seats "computed by sector
     weights in the population". Its Arab seats are therefore largely a turnout assumption, not a measurement. The same
     is likely true elsewhere: Kantar is online-only with an Arab component of unstated size.
   - Recommendation for agent A's house-effect step: map by firm, give new firms zero history, and treat 2026's
     within-field relative effects as more informative than 2019–22 ones (testable on the backtest only for the
     mapping rule).
6. **Mechanics.**
   - Electorate: 7,331,981 eligible (IDI/CEC), about 810,000 of them abroad.
   - At 70 / 72 / 74% turnout and about 0.6% invalid ballots, the threshold is **about 166,000 / 171,000 / 175,000
     votes**, and one seat is worth about 40,000–42,000 votes.
   - Lists: 38 approved, 36 still competing once Blue and White and Ahi are out.
   - The unmodelled vote:
     - In field polls dated Sep 7 to Oct 22, Haredi Public ran 0.1–1.3% (most 0.3–1.1%) and "Others" (Noam,
       Tzomet–Beit Yisrael, the "Code Black" list, Israel First) 0.2–1.3%.
     - Historically the unpolled lists took 0.4–1.5% (mean 1.0%; 2022 1.49%).
     - I recommend raising v2's fringe reservation from 1.5% to **1.8%**, with a range of 1.3–2.5 (override only; the
       v2 backtest shows the fringe term is neutral historically).
7. **The Filber question: new evidence since round 1 strengthens "checks, not inputs".**
   - An Oct 8 petition to the CEC chair (Academy for a Democratic Israel, with expert opinions) documents internal
     inconsistencies in two Next Data filings:
     - respondents exceeding the initial sample by 365;
     - 112 people unaccounted for;
     - "raw" percentages back-calculated from seats;
     - support figures that cannot come from whole respondents out of 535;
     - shares summing to 93.4%;
     - undecided respondents excluded under unstated rules.
   - Filber publicly defended the coalition weighting by pointing to the current Knesset's 68 coalition seats. That
     confirms round 1's inference: the frame targets current seat strength, not the 2022 vote (49.6–50.3%).
   - I found no CEC ruling on the petition. Keep Channel 14 and i24NEWS as checks. No 2026 evidence supports
     treating their 8–12 seat excess as signal.

## 1. The new lists and their analogues

### 1.1 Who they are

| List (id) | Leader | Formed | Base (from `data/parties.json` and the sources there) | Closest analogues |
|---|---|---|---|---|
| Yashar! (`yashar`) | Gadi Eisenkot (ex-Chief of Staff); Yoram Cohen no. 2; Chili Tropper joined from Hendel's alliance | Sep 16, 2025 | Centre and soft right, "Route 4" commuter suburbs; Eisenkot ran on National Unity in 2022 | Kahol Lavan Apr 2019 (general-led centrist list), Kulanu 2015, National Unity 2022, Yesh Atid 2013 |
| B'Yachad (`byachad`) | Naftali Bennett; Yair Lapid no. 2 (Yesh Atid holds 10 of the top 24 slots) | Apr 25–26, 2026 (technical union) | Yesh Atid's secular centre plus Bennett's soft right | Bennett's lists (Jewish Home 2013–15, New Right 2019, Yamina 2019–21: 6 of 6 under their polls, B) and Yesh Atid as an established list (3 of 3 under) |
| Reservists–Economic (`res`) | Yoaz Hendel; Yaron Zelekha no. 2; Einat Wilf no. 3 | Reservists Sep 18, 2025; joined Zelekha Sep 6, 2026 | Reservists, secular right-of-centre, "third bloc"; courting Gantz voters since Oct 19 | Derekh Eretz (never ran alone), New Economic 2021 (polled ≈2%, got 0.79%), Gesher Apr 2019; first-time lists 8 of 8 under their polls (C) |
| Amcha Yisrael / People of Israel (`poi`) | Ofer Winter (retired brigadier general); Yoseph Haddad no. 2 | Aug 25, 2026 | Younger right-wingers and reservists who reject the current government | Yachad 2015, New Right and Zehut 2019, Otzma Sep 2019: right-wing fringe lists polled near 4 seats failed in 4 of 4 (E) |
| Noam (`noam`, unmodelled) | Avi Maoz | Ran on the RZ joint slate in 2021–22; alone in 2026 | Hardline national-Haredi (anti-LGBT agenda) | No solo Knesset record. Polled 0.1–0.9% (field, Sep 7 to Oct 22) |
| Religious Zionism–Zehut (`rz`) | Bezalel Smotrich; Moshe Feiglin no. 2 | Technical bloc, Sep 2026 | National-religious; Feiglin's libertarian-right following | Zehut Apr 2019 (polled 5.6 seats, got 2.74%); religious-right partner lists fell short of their final polls in 4 of 6 elections (E §5) |

### 1.2 How the analogues did against their polls

`node scripts/forecast/round2/H/analogues.mjs` (every poll in the backtest files, Filber firms included; a list
below the threshold counts as 0 seats):

| Election | List | Polls 28d (7d) | Mean seats 28d | Mean seats 7d | Range 7d | Result seats | Result % | Miss vs 7d (seats) |
|---|---|---|---|---|---|---|---|---|
| 2015-03 | Kulanu (Kahlon, new centre-right) | 43 (14) | 8.5 | 8.9 | 8–11 | 10 | 7.49 | +1.1 |
| 2015-03 | Yachad (Yishai, new right splinter) | 43 (14) | 4.3 | 4.4 | 4–5 | 0 | 2.97 | −4.4 |
| 2019-04 | Kahol Lavan (Gantz–Lapid, new centre) | 37 (12) | 30.2 | 29.3 | 27–32 | 35 | 26.13 | +5.8 |
| 2019-04 | New Right (Bennett–Shaked) | 37 (12) | 5.9 | 5.8 | 5–7 | 0 | 3.22 | −5.8 |
| 2019-04 | Zehut (Feiglin) | 37 (12) | 5.1 | 5.6 | 4–8 | 0 | 2.74 | −5.6 |
| 2019-04 | Gesher (Levy-Abekasis) | 37 (12) | 0.4 | 0.3 | 0–4 | 0 | 1.73 | −0.3 |
| 2019-04 | Kulanu (2nd run, falling) | 37 (12) | 3.8 | 4.2 | 0–6 | 4 | 3.54 | −0.2 |
| 2019-09 | Yamina (Shaked, re-merger) | 28 (10) | 9.3 | 8.5 | 7–9 | 7 | 5.88 | −1.5 |
| 2021-03 | Yamina (Bennett) | 30 (8) | 10.8 | 9.4 | 8–10 | 7 | 6.21 | −2.4 |
| 2021-03 | New Hope (Sa'ar, new right splinter) | 30 (8) | 10.9 | 9.0 | 7–10 | 6 | 4.74 | −3.0 |
| 2021-03 | New Economic (Zelekha) | 30 (8) | 0.0 | 0.0 | 0–0 | 0 | 0.79 | 0.0 |
| 2022-11 | National Unity (Gantz–Sa'ar–Eisenkot) | 32 (11) | 11.7 | 11.5 | 10–13 | 12 | 9.08 | +0.5 |

Plus Yesh Atid 2013 (2% threshold): polled 10.7, got 19, +8.3 (`round1/B-list-bias.md` §2, 2013 table).

**Reading.**
- **The two families are clean.** All four new centrist lists beat or met their final-week mean (Yesh Atid 2013,
  Kulanu, Kahol Lavan, NU). All six right-of-centre new or re-formed lists fell short, by 1.5–5.8 seats.
- **The sizes are not stable,** and the centrist overshoots are driven by late two-party squeezes (2013, April 2019).
  B's leave-one-out found no gain from applying a +2.6 prior to Yashar, and I agree. The sign is consistent, the
  size is not.
- **Trajectory carried information in 2021.** New Hope and Yamina were already falling inside the 28 days, and the
  fall continued to the result (D in round 1: 7 of 9 lists that moved ≥0.5 seats in the final two weeks of 2021
  kept moving). No 2015 or 2019 analogue was falling like that. That is a small sample, so it bears only on the
  direction of Amcha's risk, not on a fitted parameter.

### 1.3 2026 field trajectory

`node scripts/forecast/round2/H/trend2026.mjs` (field pollsters only, mean seats; a list below the threshold counts
as 0):

| List | Sep 6–25 (19 polls) | Sep 26–Oct 12 (13) | Oct 13–22 (11) |
|---|---|---|---|
| Likud | 20.0 | 20.2 | 19.4 |
| Otzma | 7.2 | 7.8 | 7.5 |
| Shas | 7.4 | 7.4 | 7.6 |
| UTJ | 7.6 | 7.8 | 7.5 |
| RZ–Zehut | 5.4 | 5.8 | 6.5 |
| **Amcha Yisrael** | 3.8 | 2.8 | **1.5** |
| Yashar | 23.4 | 22.0 | 22.2 |
| B'Yachad | 12.9 | 12.2 | 13.2 |
| Democrats | 9.4 | 9.0 | 9.0 |
| Yisrael Beiteinu | 8.5 | 8.9 | 8.3 |
| **Reservists** | 2.3 | 3.2 | 3.3 |
| **Joint List** | 7.3 | 8.0 | **8.6** |
| Ra'am | 5.1 | 5.1 | 5.5 |

- **Amcha Yisrael** is the only list on a steady fall. Pressure to withdraw grew after Oct 19, with the bereaved
  families' letter, the Netanyahu–Smotrich visit to Winter's rabbi, Smotrich's ministry offer and the resignation of
  candidate no. 8. That is the New Right / Zehut / New Hope pattern (a list its own bloc's leader targets as a wasted
  vote). Every element points the same way: v2's 19% pass chance is, if anything, high.
- **Reservists** rose through the campaign and courts the Blue and White remnant. The first-time-list prior
  (−0.8 points; C: 8 of 8 under) argues against it. I would not move it either way.
- **RZ–Zehut** rose about one seat over the campaign while Amcha fell. That is consistent with Smotrich winning back
  right-wing votes from Winter. The record for religious-right partner lists (4 of 6 under) argues for caution, but
  round 1's "directional consolidation" term failed the backtest. No change.
- **The Joint List rose 1.3 seats** after the Supreme Court reinstated it (Oct 2). See §3 for what that implies for
  turnout.

### 1.4 Campaign facts the Oct 22 polls may not fully reflect

| Date | Event | Bearing | Source |
|---|---|---|---|
| Oct 2 | Supreme Court overturns the CEC's disqualification of the Joint List, Ra'am and Ofer Cassif. Balad's Sami Abu Shehadeh withdraws after the panel signals it would bar him | Removes the disqualification risk for the Arab lists. Polls taken before Oct 2 carried that uncertainty | https://www.jpost.com/israel-election-2026/article-910410 ; https://www.aljazeera.com/news/2026/10/2/arab-party-leader-forced-to-withdraw-from-israeli-elections |
| Oct 8 | Petition to the CEC chair against two Next Data/Channel 14 polls (§6) | Filber question | https://www.maariv.co.il/news/politics/article-1375084 |
| Oct 14 | Channel 12: Netanyahu worried that Gur Hasidim (≈30,000 potential voters) won't vote or will cast protest votes; "no efforts underway to mobilize" | UTJ downside (§2) | https://www.timesofisrael.com/liveblog_entry/netanyahu-reportedly-worried-gur-hasidim-wont-turn-out-to-vote/ |
| Oct 19–21 | Blue and White: every candidate resigns; the CEC orders the slips removed, X's the party on the booth posters, and rules any B&W ballot invalid, including votes already cast abroad and at army stations | B&W votes leave the denominator. They do not sit as wasted share. v2 already drops `bw` | https://www.timesofisrael.com/liveblog_entry/blue-and-white-ballot-slips-to-be-removed-from-polling-stations-after-all-party-members-withdraw-from-election/ |
| Oct 20–21 | Netanyahu and Smotrich meet Winter's rabbi (Eli Sadan); Netanyahu posts the bereaved families' letter; Smotrich offers Winter a ministry; Winter refuses and says it "may not have been right" to pledge to recommend only Netanyahu | Amcha: wasted-vote pressure plus a muddied bloc identity. Both are negative for its vote | https://www.timesofisrael.com/winter-says-may-have-erred-pledging-support-for-pm-smotrich-offers-him-minister-role-to-quit/ ; https://www.ynetnews.com/article/7f1a3cnnl |
| Oct 21–22 | Amcha's no. 8 (Davidi Ben Zion) quits, citing the threshold; Winter and Leitner both announce they stay in | As above | https://www.jns.org/news/israel-news/no-8-on-winters-party-list-quits-netanyahu-and-smotrich-urge-others-to-follow ; https://www.i24news.tv/fr/actu/israel/artc-nous-ne-nous-retirons-pas-malgre-les-pressions-de-netanyahou-winter-et-leitner-maintiennent-leur-candidature |
| Oct 21 | Leitner (Haredi Public) refuses Netanyahu's offer (an adviser post) to withdraw | Haredi Public stays as a sub-threshold Haredi and Netanyahu-bloc sink | https://www.timesofisrael.com/liveblog_entry/charedi-public-party-leader-leitner-refuses-to-quit-election-race-despite-pressure-from-netanyahu/ |
| Oct 23 | Abergel's Ahi list withdraws in a deal with Likud | Field polls had it at 0.1–0.8%. Its votes go mostly to Likud or Shas; under 0.5 seat | `round1/E-context.md` §1 (Haaretz live blog) |

The Trump endorsement (Oct 18), the ban on Likud's real-time voter app (Oct 22) and the billboard order are already
in E and are not re-argued here.

## 2. Haredi lists in 2026

**The draft crisis, as it stands.**
- No legal exemption has existed since June 2023, and the High Court ruled the exemption illegal in June 2024.
- The coalition's July 2026 law freezing enforcement until after the election was **struck down on Sep 3**.
- About 90,000 Haredi men are legally draft evaders. Enlistment rose to 4,298 (Jul 2025 to Jun 2026, against 2,811 a
  year earlier). Arrests have triggered mass protests in recent weeks.
- Sources: JTA, Oct 23: https://www.jta.org/2026/10/23/israel/will-this-election-end-the-battle-over-drafting-haredi-men-into-the-israeli-army ;
  `data/parties.json` (UTJ quit the government in July 2025).

**Signals by group.**

| Group | 2026 signal | Size | Direction for the model | Source |
|---|---|---|---|---|
| Gur (Agudah, UTJ) | Anger at Netanyahu and the party over the draft. The rebbe's directive is a bare request to vote, with no headquarters. Channel 12: "no efforts underway to mobilize"; may stay home or cast protest votes | ≈30,000 potential voters ≈ 0.57% of ≈5.25M valid votes ≈ **0.74 seat** if all abstain; ≈0.3–0.4 seat if half do | UTJ down, small | ToI Oct 14 (above); INN Oct 18 (E) |
| Degel HaTorah (UTJ) | Rabbi Dov Lando: "Woe to anyone who incites people not to go vote"; inciting abstention is a "great crime". Gafni and Maklev dropped from the slate on Lando's instructions; Yaakov Asher heads it | — | Mobilising | https://www.ynetnews.com/jewish-world/article/h1lsgx5qfl |
| Satmar-affiliated (Shekel HaTahor) | Allegedly offered NIS 200 for a pledge not to vote; temporary CEC injunction | These voters were largely non-voters anyway (Edah Haredit ≈7% of Haredim did not vote for ideological reasons in 2022) | ≈0 | Same Ynet; Haredi Institute: https://machon.org.il/en/publication/12028/ |
| Modern Haredim | Two new lists, Haredi Public (Leitner) and HaKahal. Haredi Public: 0.1–1.3% in field polls Sep 7 to Oct 22 (Channel 13 consortium 1.1–1.3, Lazar 0.4–1.0, Midgam 0.1–1.2, Maagar Mochot 0.4–1.1) | ≈0.7% mean; sub-threshold | Wasted, drawn from UTJ, Shas and Likud | JTA Oct 23; scratchpad `H/others.py` on round 1's cached wikitext |
| Shas | Unusually explicit rabbinical messaging against defections to Likud and Otzma (Maya, Yitzhak Yosef; E §1) | — | Mobilising, which is Shas's usual late pattern | E |
| After the election | i24: Agudah, and possibly Degel, would not vote against an Eisenkot-led government | — | No vote effect; coalition only | https://www.i24news.tv/en/news/israel-election-s-2026/artc-utj-faction-won-t-vote-against-eisenkot-led-government-report |

**Is there reason to expect 2026 to differ from 2013–2022?**
- **UTJ:** a modest, specific downside. The poll record is excellent: mean miss +0.1 seats, never more than −0.4
  (E §2.3). That record rests on bloc voting under rabbinical instruction, and that is exactly what is weaker this
  time in one large Hasidic court.
  - Polls cannot see it well. Channel 13's dedicated Haredi sample of 500 is online. Gur voters who will abstain on
    the day may still name UTJ in a poll, and the Channel 12 report says the decision is communal, not individual.
  - Against that: Lando's call, UTJ's workaround for the turnout-data ban (booths and Agudah tents, E), and the usual
    final-days pressure.
  - Net: a downside of about 0.2–0.4 seats in expectation, with a fatter left tail. I would not move the point.
- **Shas:** no. Its under-polling (6 of 7 elections, B) comes from traditional Mizrahi voters who are hard to poll
  and decide late. Nothing in 2026's pollster designs targets them; a Haredi subsample samples the wrong group. The
  2026 campaign (Likud weakening, Shas rabbis campaigning against defections to Likud) is if anything the setting in
  which Shas over-performed before (Apr 2019 +2.75, 2022 +2.6). Keep v2's +0.8 points. A larger prior is not
  supported out of sample (B shrank it on purpose).
- **Haredi turnout overall:** the turnout-data ban, Gur's anger and the two new Haredi lists all point slightly
  down for UTJ. The Satmar and Edah voters were non-voters already. I found no quantified Haredi turnout projection
  for 2026. The Kol Chai "up to 10%" figure is second-hand (E).

## 3. Arab turnout

**The lists.**
- The Joint List re-formed on Aug 19 as Hadash–Ta'al–Balad, led by Yousef Jabareen with Tibi at no. 2. It runs
  without Ra'am, which kept its condition of being free to join a coalition.
- Ra'am separated formally from the Islamic Movement's Shura Council, held its first primary on Aug 22, and put a
  Jewish ex-police commander (Segalovitz) at no. 2.
- The two signed a surplus agreement (Sep 11).
- The CEC disqualified both lists. The Supreme Court restored them on Oct 2, and Balad's leader withdrew.
- Sources: https://www.acitaskforce.org/?p=17639 ; `data/parties.json`; Oct 2 links above.

**Expectations published before Oct 23.**

| Source | Date | Arab turnout | Note |
|---|---|---|---|
| IDI (2022 actual, the benchmark) | 2022 | 53.2% | https://en.idi.org.il/articles/47297 |
| Konrad Adenauer Program (Tel Aviv Univ.) | May 2026 | 53% as things stood; 67% if the Joint List re-formed | The re-formation was partial (no Ra'am). https://www.acitaskforce.org/?p=17639 |
| Abraham Initiatives (young Arab voters, n = 614) | Feb 2026 | 58.8–61.9% | https://abrahaminitiatives.org/young-arab-voter-survey/ |
| Stat-Net | Oct 19 | 63%, against 56% on its own 2022 measure; "may be as high as 68–69%" | So about +7 points on its own scale, or about 60% on IDI's. https://www.timesofisrael.com/turnout-among-israels-arab-voters-could-make-or-break-hopes-to-unseat-netanyahu/ |
| Dahlia Scheindlin | Oct 19 | "60 per cent, possibly more"; driven by fear of Ben-Gvir joining the government | https://www.thenationalnews.com/news/mena/2026/10/19/arab-vote-could-prove-decisive-in-israels-election-as-fears-grow-over-far-right/ |
| Joint List and Ra'am internal polls | Oct 20–21 | "above 60%" | https://www.csmonitor.com/World/Middle-East/2026/1021/israel-arab-election-netanyahu-palestinian ; https://www.jpost.com/israel-election-2026/article-912145 |

**Consensus as of Oct 22:** about 60% on IDI's scale, with a plausible range of 55–66%.

**Boycott:** none found for 2026. Abnaa el-Balad and the Northern Islamic Movement boycott as a standing position,
but I found no 2026 campaign. **The Gaza war** is cited as one grievance among several. Crime is the top concern in
Arab polling (CSM), and fear of a Ben-Gvir government is the motivator analysts cite.

**What the polls and v2 already imply.** `node scripts/forecast/round2/H/arab-turnout.mjs` uses a one-parameter
proportional model anchored on 2022: Arab lists 10.70% of valid votes at 53.2% turnout. Arab-list votes scale with
Arab turnout, and all other votes scale with non-Arab turnout relative to 2022.

| | Arab-list share | Implied Arab turnout (non-Arab turnout as 2022) | Implied Arab turnout (non-Arab turnout +3%) |
|---|---|---|---|
| Field polls alone (v2 share minus priors) | 11.17% | 55.8% | 57.5% |
| **v2 with its +0.4 / +0.6 priors** | 12.17% | **61.5%** | **63.4%** |

| Arab turnout | Arab-list share | ≈ Seats (non-Arab as 2022) |
|---|---|---|
| 53.2% | 10.70% | 13.8 |
| 56% | 11.20% | 14.5 |
| 60% | 11.90% | 15.4 |
| 63% | 12.43% | 16.0 |
| 66% | 12.94% | 16.7 |
| 69% | 13.45% | 17.4 |

**Reading.**
- The field polls already price in a little of the rise, about +3 points. Pollsters weight the Arab sector to an
  assumed turnout; Channel 13 states that its seats are computed from sector weights, with only 100 Arab
  respondents.
- v2's priors bring the implied figure to about the analysts' consensus. Adding E's proposed "+1 Arab seat" on top
  of v2 would imply about 64–66%, above every published estimate except Stat-Net's upper figure.
- Historically pollsters lagged turnout swings (5 of 5 sign agreement, E §2.2), but in 2022 the pre-election
  projections themselves were too low (40–49% against 53.2%). Stat-Net's upper figure is therefore a real tail, not
  noise.
- **v3 should keep v2's Arab priors, add no further mean shift, and keep an upside-skewed or wide Arab swing:** sd
  1.7 seats as in v2, or a +0.5 seat skew.
- Caveat: the proportional model ignores Arab votes for Zionist lists (about 15%) and Jewish votes for Hadash. Both
  move the implied turnout by a point or two, not the conclusion.

## 4. Pollster methods this cycle

| Outlet | Firm (2026) | Firm's 2019–22 record? | Mode (as filed or reported) | n (polls.json) | Undecided published? | Change since 2022 |
|---|---|---|---|---|---|---|
| Channel 12 | Midgam Research & Consulting (Mano Geva) | Yes (2019–22) | Online panel plus phone, as in past cycles; not verified in a 2026 filing | 501–509 | Not in its publications as imported; see D2 | None known |
| Channel 13 | Consortium: Panel Project HaMidgam (Ariel Ayalon), theMadad (Shmuel Rosner), Stat-Net (Yousef Makladeh), Askaria (Dudi Dror); statistical adviser David Steinberg | Only HaMidgam (2019–20). **Not** Camil Fuchs, who polled for Channel 13 in 2021–22 | Mixed. CEC filing Survey_4193 (Oct 6–7): 1,163 Jewish respondents online in three separate samples (adults n ≈ 603, young n ≈ 60, Haredi n = 500), plus **100 non-Jewish respondents by phone**. Response rates 13.5% / 3.6% / 15.9% / 22.8%. Seats computed "by the weights of the sectors in the population" | 886–1,503 | **Yes**: 11.3% undecided among Jewish adults, plus a lean question (Yashar 16%, Amcha 10%, B'Yachad 9%, YB 6%, Likud 4%, 38% don't know). Noam, HaKahal, Code Black and Israel First offered as a sub-list under "other" | New consortium in 2026 |
| Kan 11 | Kantar (formerly TNS) | Yes (2019–22) | **Online**, Arab sector included. Aug 18 filing: 2,327 invited, 558 responded | 551–554 | Not stated | None known |
| Israel Hayom | Kantar (since Dec 2025) | Kantar yes; **Israel Hayom's 2019–22 record is Maagar Mochot's** | As Kan | 551–555 | Not stated | **Firm change** |
| Maariv, Walla | Lazar Research Institute + Panel4All | Partly: Menachem Lazar ran Panels Politics (Maariv until Jul 2023); the panel may differ | Online panel (Panel4All) | 506–1,048 | Not stated | Firm change in 2023 (D round 1) |
| Zman Yisrael | Yossi Tatika | **None** | Not found | 500 | Not found | New |
| Channel 14 | Next Data (founded 2026 by the channel's owners), analysed by Filber | **None** | Online panel; "undecided excluded" under unstated rules; 0.6–4% undecided; 54/46 coalition/opposition frame | 483–7,937 | 0.6–4% (filings) | New firm; Oct 8 petition (§6) |
| i24NEWS | Direct Polls (Zuriel Sharon; Filber left in June 2025) | Firm yes (2020–22, most accurate on the bloc) | Online "digital" panel, about 6% response | 504–1,210 | Not stated; filings incomplete (IPF) | Founder left; new client |
| (not in config) DRI | DRI institute, self-commissioned | None found | Online plus panel, n ≈ 2,100–2,200, 13.5% response (Survey_4133) | — | — | — |
| (not in config) Channel 16 | Maagar Mochot | Yes (weakest of the 2019–22 firms, D) | n > 5,000 | — | — | Polls outside our list |

Sources: CEC filings Survey_4193, Survey_4133, Survey_4150/4175/4176, nd4236 (read from round 1's cached copies;
URLs in `round1/D-pollsters.md` §4); Kan Aug 18 filing summary via https://www.kan.org.il/content/kan-news/politic/1090501/ ;
Israel Policy Forum, Aug 20: https://israelpolicyforum.org/2026/08/20/israeli-election-polls-pollsters/ (TV polls
"usually" n ≈ 500; roughly 10% undecided in most polls; the CEC filing rule took effect at the end of July and
requires results and methodology within 96 hours); the ToI blog by Haim V. Levy, Sep 25:
https://blogs.timesofisrael.com/same-night-same-election-fourteen-different-seats/ ; Maariv on publication rules
(lists polling above 1% but under the threshold must be shown with their share):
https://www.maariv.co.il/news/elections-2026/article-1376327 .

**What this implies for house effects in 2026 compared with 2019–22.**
1. **History transfers by firm, never by outlet.**
   - Channel 13's and Israel Hayom's 2019–22 rows belong to firms that no longer poll for them.
   - Zman Yisrael and Next Data have no rows.
   - Only Midgam (Ch12), Kantar (Kan and now Israel Hayom), Lazar (Maariv/Walla, partly) and Direct Polls (i24) have
     usable history.
   - Agent A's estimator should key on `firm` and give a firm with no record a zero history term, so that it shrinks
     entirely to the field. This is testable on the backtest in the sense that the 2019–22 data already key by firm
     (D2 notes this).
2. **The 2019–22 record showed little firm-level skill to carry over** (round 1 D: MAE sd 0.1–0.3 seats between
   firms; rank persistence ρ = 0.39 / 0.24). With half the 2026 field new, the prior should be shrunk at least as
   hard as history suggests, i.e. at least 70% toward zero.
3. **The mode is online almost everywhere, and the Arab component is thin.** Channel 13's 100 phone interviews are
   the extreme case. So the 2026 Arab and Haredi seat estimates are partly modelling assumptions shared across firms,
   which supports treating the Arab miss as one common term (v2's Arab swing), not a house effect. The same applies
   to Haredi sub-samples (Channel 13's is n = 500, online).
4. **Undecided handling differs widely** (≈10% typical; Channel 13 11%; Next Data ≤4%). In Channel 13's lean
   question the undecided split across Yashar, Amcha, B'Yachad, YB and Likud with 38% not knowing, so it gives no
   directional signal for the bloc.
5. **Data-handling note on unprinted sub-threshold shares.** Under the publication rules, lists polling between 1%
   and the threshold must be shown with their share. A sub-threshold list printed without a share is therefore, in
   principle, under 1%, or its share is in the CEC filing. That argues against v2's 2% default for unprinted shares
   (C, round 1) and for reading the share from the filing where one exists. It applies to 2026 only and cannot be
   backtested. I have not verified whether the rule predates 2026.

## 5. Election-day mechanics

**Surplus agreements:** the five gazetted pairs are in `data/results.json`, from the CEC gazette of Oct 19 (E §3).
No change.

**Lists:**
- 38 approved (IDI: https://en.idi.org.il/israeli-elections-and-parties/elections/2026/ ; Ynet:
  https://www.ynetnews.com/article/no1cetlga). Blue and White is out, with its ballots invalid, and Ahi withdrew on
  Oct 23, leaving 36 competing.
- Outside the 15 ids in `parties.json`, about 22 lists remain (Ahi, the "Achi Movement" in the IDI list, is Abergel's and has withdrawn). The named ones are Haredi Public, HaKahal, Black Color /
  "Code Black", Israel First–Ale Yarok, Tzomet–Beit Yisrael, Seder Chadash,
  Kol HaNashim, The Pirates, Tekuma and others (IDI list). Noam is in `parties.json` but unmodelled (share 0 in v2).

**Unpolled-list share.**
- Historical (`node scripts/forecast/round2/H/fringe.mjs`):

  | Election | Valid votes | Lists polled | Unpolled lists' share | Polled lists that failed | Threshold in votes |
  |---|---|---|---|---|---|
  | 2015-03 | 4,210,884 | 11 | 1.53% | 2.97% | 136,854 |
  | 2019-04 | 4,309,270 | 14 | 0.80% | 7.69% | 140,052 |
  | 2019-09 | 4,436,806 | 10 | 0.97% | 1.88% | 144,197 |
  | 2020-03 | 4,590,062 | 9 | 0.38% | 0.42% | 149,178 |
  | 2021-03 | 4,410,052 | 14 | 0.68% | 0.79% | 143,327 |
  | 2022-11 | 4,764,742 | 13 | 1.49% | 7.27% | 154,855 |

- 2026, field polls Sep 7 to Oct 22:
  - Haredi Public 0.1–1.3%, about 0.7% on average among the firms that print it.
  - "Others" 0.2–1.3%: Noam 0.1–0.9% (median about 0.5%), Ahi 0.1–1.1% (now withdrawn), Tzomet–Beit Yisrael 0.2–0.5%,
    Code Black ≤0.5%, Israel First ≤0.5%.
  - Without Ahi, the unmodelled lists sum to about 1.3–1.6% in polls. Micro-lists that no poll names have added
    0.3–0.5% historically.
  - **Expected unmodelled share: about 1.8% (range 1.3–2.5%)**, against v2's 1.5%. This is higher than 2015–22
    because 2026 has an unusually large number of sub-threshold Haredi and right-wing lists.
  - Effect: about −0.4 seats spread across the modelled lists, and a slightly higher bar for Reservists and Amcha in
    vote terms (the threshold is on all valid votes).

**Eligible voters and turnout.**
- 7,331,981 eligible (IDI, from the CEC). About 810,000 live abroad (E), so official turnout has a ceiling near 89%.
- History: 67.4–72.3% (2015–22; E). No CEC forecast exists.
- Signals point to "high":
  - diplomatic-mission voting up 17 points (E);
  - Maariv's "certain to vote" figures (E);
  - Next Data's panel projects 67.8% (its filing, round 1 D), the one low figure;
  - a thin Polymarket market centred near 72–74% (E).
- Central assumption: **72%** (range 69–75).

**Threshold in votes (3.25% of valid; invalid ballots ≈0.6% as in 2022).**

| Turnout | Votes cast | Valid | Threshold | One seat ≈ |
|---|---|---|---|---|
| 70% | 5.13M | 5.10M | ≈166,000 | ≈40,000 |
| 72% | 5.28M | 5.25M | ≈171,000 | ≈41,000 |
| 74% | 5.43M | 5.39M | ≈175,000 | ≈42,000 |

The model works in shares, so none of this enters it except through *differential* turnout (§2, §3).

## 6. The Filber question in 2026: new evidence since round 1

1. **The Oct 8 petition** (Academy for a Democratic Israel, through the Meitar firm, with expert opinions from
   statisticians and voting-behaviour scholars) asks the CEC chair to take down two Next Data/Channel 14 polls (Aug 27,
   Sep 23). It documents:
   - more respondents than the stated initial sample (+365);
   - 112 people unaccounted for;
   - a stated 8.9% response rate that the stated figures put at 7.4%;
   - "raw" percentages back-calculated from seats;
   - 9 of 16 support figures that cannot come from a whole number of respondents out of 535;
   - shares summing to 93.4%;
   - undecided respondents excluded under unstated rules;
   - asymmetric "like most / like least" questions on Netanyahu and Eisenkot.

   No ruling found. https://www.maariv.co.il/news/politics/article-1375084
2. **Filber's defence of the weighting.** Answering a critic who showed the polls weight the coalition to 54% of the
   vote against 50.3% in 2022 (Yamina included), Filber cited the current Knesset's 68 coalition seats (after New
   Hope joined). That confirms round 1's inference: the frame weights to current seat strength, not to the 2022 vote.
   https://www.ice.co.il/culture/news/article/1134409
3. **Direct Polls (i24)** has had incomplete CEC filings since August (IPF), and its 2026 lean was shrinking through
   the campaign (round 1 D). Its 2020–22 bloc record (about +2 over the field, in the right direction) remains the
   only evidence for any right-leaning correction. That is what v2's lean already encodes.
4. **Corroboration from right-leaning firms outside the config.** DRI showed the bloc near 59–60 in September (round 1 D).
   I found no new pre-Oct-23 DRI material. Channel 16 / Maagar Mochot sits on the other side.

**Conclusion:** keep Channel 14 and i24NEWS as checks, not inputs. The new evidence concerns process quality and the
weighting frame, which bear on whether their excess is method. It adds nothing on whether it is signal. This is
override-only: the backtest cannot see Next Data (no history), and Direct Polls' history is already in the lean.

## Recommendation: prior adjustments and risk terms for v3

Seat figures are central-forecast effects. "Testable on the backtest" means the rule (not necessarily its 2026
input) can be scored on 2015–2022 with the `v2.mjs` harness pattern. I ran no new backtest variants: every item
below is either already scored by another agent's harness (noted) or depends on 2026-only information.

| # | Proposal | Magnitude | Tag | Why |
|---|---|---|---|---|
| H1 | **No new-list prior for Yashar**; keep B'Yachad −0.8, Reservists −0.8, Amcha −0.8 | as v2 | Testable on the backtest (B round 1 did; v2 row) | Analogues §1.2: centrist new lists never deflated (4 of 4); right-wing and Bennett vehicles always did (6 of 6) |
| H2 | **Amcha: let the falling trajectory and the withdrawal pressure count.** If C's sub-threshold swing model has a "trend" or "targeted by own bloc" covariate, Amcha qualifies on both. Otherwise leave v2's −0.8 | Pass chance ≈ 10–19% (v2 19%); point 0 either way | Testable on the backtest (C's covariates; the 2019/2021 cases); the 2026 classification is override | 3.8 → 2.8 → 1.5 seats; New Right/Zehut/New Hope pattern; no. 8 quit; ministry offer |
| H3 | **Arab lists: keep v2's +0.4 / +0.6 priors; no further mean shift; keep the Arab swing (sd 1.7 seats) or make it upside-skewed (+0.5 seat)** | 0 extra on the point; tail to +2 seats | Sign rule testable (E §2.2, B's turnout model); level override only | v2 already implies 61.5–63.4% Arab turnout, at or above the ≈60% consensus. Adding E's +1 seat would imply 64–66% |
| H4 | **UTJ: −0.15 vote-share points and sd ×1.25** for Gur abstention and Haredi Public | ≈ −0.2 seat mean; wider left tail | Override only | ≈30,000 Gur voters (≤0.74 seat), half at risk; offset by Lando's call. UTJ's 2013–22 poll record (+0.1) gives no historical basis |
| H5 | **Shas: no change** (keep +0.8 points) | 0 | Testable on the backtest (B's prior) | The under-polling mechanism (traditional Mizrahi voters) is untouched by 2026 designs; 2026 resembles the elections where Shas over-performed most |
| H6 | **Fringe reservation 1.5% → 1.8%** | ≈ −0.4 seat spread across the modelled lists; the threshold bar for Res and Amcha rises ≈0.01 points | Override only (the term is neutral on the backtest: "v2, no fringe" row) | 2026 polls: Haredi Public ≈0.7%, Noam ≈0.5%, others ≈0.3–0.5%; history 0.4–1.5% |
| H7 | **House effects keyed by firm; zero history for Channel 13's consortium, Zman Yisrael/Tatika and Next Data; Israel Hayom inherits Kantar, not Maagar Mochot; shrink ≥70%** | Under 0.5 seat per list | Mapping testable on the backtest (A); the 2026 firm map is data | §4 |
| H8 | **Channel 14 and i24NEWS stay as checks, not inputs** | 0 | Override only | §6: new process-quality evidence; Filber confirms the seat-based frame |
| H9 | **Unprinted sub-threshold shares:** read from the CEC filing where one exists; otherwise prefer <1% (e.g. 0.8%) to the 2% default for 2026 publications | Moves Res and Amcha pass chances a few points | Override only (2026 publication rule; not verified for 2019–22) | §4, item 5 |
| H10 | **No term for overall turnout, the Trump endorsement, Ahi's withdrawal or the expatriate vote** | 0 | — | Shares, not counts; Ahi is under 0.5 seat, mostly inside the bloc (Likud/Shas) |

**What is likely noise here.**
- Every 2026-specific magnitude above (H3's level, H4, H6) is a judgment from a single campaign. None was fitted.
- The analogue table is 12 cases. Its sign pattern is consistent; its sizes are not.
- The Arab turnout model has one parameter, and its anchor (IDI's 53.2%) differs from Stat-Net's (56%) by about 3
  points, which is the size of the effect being measured. Read §3 as "v2 is at the consensus, give or take 2 points".

**Net effect if H4 and H6 are adopted** (the others leave v2's point unchanged): UTJ −0.2 and every modelled list
−1.5% of its share. On the 2026 inputs that is at most one seat moved, most likely from the largest lists. No bloc
total changes by more than one seat, and no threshold call flips.
