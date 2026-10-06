# Position gaps, October 6, 2026

Lane: data/positions/*.json and lib/positions.ts. Ruling: Daniel, 2026-10-06. Where a party has a clear position it will not say out loud, include it and say so.

## Basis values

- No basis: the party said it, in a questionnaire or a statement.
- `record`: the party skipped the questionnaire. The stance comes from a dated statement, bill or vote by the party or its leader. Qualifier: "Record evidence: ".
- `unstated` (new): the party has not said it publicly. The stance is read from what it does: votes on other parties' motions, coalition deals, the laws its government passed. Qualifier: "Not said publicly: ". The row text opens "Has not said…" or "Has not answered…" and names the evidence. A test enforces that opening.

How I drew the line: an explicit statement by the party's leader, even an old one, is `record`. A vote, a deal or a pattern, with no statement of the position itself, is `unstated`.

## Rows filled

| Issue | Party | Stance | Basis | Confidence |
|---|---|---|---|---|
| courts | Otzma Yehudit | curb | record | clear |
| economy | Blue and White | reward-service | record | likely |
| haredi-draft | Noam | draft-leavers | record | clear |
| palestinian-state | UTJ | oppose | unstated | clear |
| religion-state | Likud | orthodox | unstated | clear |
| religion-state | Otzma Yehudit | orthodox | record | clear (2022 source) |
| religion-state | Religious Zionism–Zehut | orthodox | stated | clear |
| religion-state | Blue and White | civil-local | stated | likely |
| war-hostages | Otzma Yehudit | other-commission | record | clear |

### Sources

- **courts, Otzma.** Jerusalem Post, Sep 24, 2026, https://www.jpost.com/israel-election-2026/article-909348. Ben-Gvir supported the 2023 overhaul, opposed softening it, and called the reasonableness law "just the beginning." Times of Israel, Mar 27, 2025, https://www.timesofisrael.com/knesset-passes-law-greatly-boosting-political-control-over-judicial-appointments/. After the selection law passed, Ben-Gvir said the government must push on with the rest of the overhaul. The Ynet survey of Sep 22, 2026 (no position) stays cited.
- **economy, Blue and White.** Ynet (Hebrew), Sep 16, 2026, https://www.ynet.co.il/news/elections2026/article/yokra14898966: "הטבות סוציאליות ינתנו קודם כל למי שמשרת". This comes from its draft answer, not an economic platform, hence "likely." Daniel should confirm that a draft-answer line can set the economy stance. People of Israel's reward-service row is the same kind of statement.
- **haredi-draft, Noam.** Channel 14, Jul 14, 2026, https://www.c14.co.il/article/1620270. Maoz voted for the arrest-freeze law and called it a "bandage." He said: "מי שלומד צריך להמשיך ללמוד, ומי שאינו לומד, צריך להתגייס". This replaces the December 2025 Times of Israel row.
- **palestinian-state, UTJ.** JNS, Jul 18, 2024, https://www.jns.org/israel-news/knesset-votes-68-9-for-resolution-against-a-palestinian-state. "Other co-sponsors of the resolution included Likud, Shas, Religious Zionism, Otzma Yehudit and United Torah Judaism." The vote was 68 to 9, on the text "opposes the establishment of a Palestinian state on any piece of land west of the Jordan River." Ynet, Jul 23, 2025, https://www.ynetnews.com/article/bkxfw9algl. UTJ representatives voted for the sovereignty motion.
- **religion-state, Likud.** Times of Israel, Jul 15, 2026, https://www.timesofisrael.com/knesset-passes-law-restoring-chief-rabbinates-monopoly-over-kosher-certification/. The kashrut monopoly law passed 46 to 41 as part of the coalition's deal with the Haredi parties. Ynet (Hebrew), Aug 31, 2026, https://www.ynet.co.il/news/elections2026/article/yokra14883243. On Shabbat transport, Likud's answer was "רוצים לחבר את ישראל בששת ימי המעשה, תוך שמירת השבת", keeping the status quo. Times of Israel, Dec 28, 2022, https://www.timesofisrael.com/religious-zionism-coalition-deal-settlement-growth-changes-to-discrimination-laws/. Under the deal Likud signed, only Orthodox Chief Rabbinate conversions are recognized. Two caveats. Likud voted for these laws as coalition trades, and Netanyahu allowed a free vote on the Western Wall bill. The Shabbat answer is stated, but marriage and conversion are not, so I marked the row unstated.
- **religion-state, Otzma.** Arutz Sheva, Sep 7, 2022, https://www.inn.co.il/news/576700: "המדינה יהודית, הנישואים צריכים להיות כדת משה וישראל". Ynet, Apr 7, 2019, https://www.ynet.co.il/articles/0,7340,L-5490470,00.html. Otzma's answer: "נפעל לחזק את מעמד הרבנות הראשית לישראל", plus no shops open on Shabbat in public space. Its current platform (https://ozma-yeudit.com/program/?lang=he) has no religion section. No 2026 statement found.
- **religion-state, RZ.** Ynet (Hebrew), Aug 31, 2026, same URL. The party opposes any change to Shabbat transport: "שמירה על השבת בפרהסיה הציבורית היא ביטוי להיותה של ישראל מדינה יהודית". Times of Israel, Dec 28, 2022 (above), for the Orthodox-only conversion clause. This replaces the israel2026.co.il aggregator row.
- **religion-state, Blue and White.** Ynet (Hebrew), Aug 31, 2026. Gantz backs Shabbat transport set by local authorities. Ynet, Apr 7, 2019, for the pledge to "legislate the partnership covenant," which also called marriage by Jewish tradition "the main road of the Jewish people." That is a civil union, not full civil marriage. Hence "likely": civil-local is the nearest option.
- **war-hostages, Otzma.** Mako, Nov 17, 2025, https://www.mako.co.il/news-diplomatic/2025_q4/Article-f713e4147839a91027.htm. In the cabinet, Ben-Gvir said: "המתווה חייב להיות לאומי ללא אנשי מערכת המשפט, אלו שיושבים על הכס הם חלק מהנחקרים". He sits on Levin's ministerial panel (Times of Israel, https://www.timesofisrael.com/levin-to-lead-ben-gvir-smotrich-and-others-in-delineating-governments-oct-7-probe/). Mako's party labels for the panel members are muddled (it lists Strock and Eliyahu under Otzma), so I quote only Ben-Gvir.

## Rows left open

- **economy, Otzma.** Its platform pairs "Jewish capitalism" and deregulation with more resources for weaker groups. Its 2025 budget fights were over the police budget and the attorney general, not economic policy. No single option fits.
- **economy, Noam.** Maoz voted against the 2026 budget for mixed reasons: Jewish identity, religious-national schools, dairy, cost of living. No option fits.
- **haredi-draft, Ra'am.** It declined. Three of its MKs voted in January 2022 for the Bennett–Lapid bill with Haredi enlistment targets (Ynet, Sep 16, 2026). That was a coalition vote and sets no current stance. I added it to the text.
- **religion-state, People of Israel.** Its platform is "to be published soon." The only line is "Judaism invites and does not coerce."
- **religion-state, Reservists–Economic.** No list position. Maariv (Sep 7, 2026, https://www.maariv.co.il/news/politics/article-1364043) covers monopolies and a "Zionist government" only. Hendel's 2021 line stays as context.
- **religion-state, Joint List.** Its Aug 31, 2026 answer backs Shabbat transport nationwide, which is wider than "local Shabbat rules." Hadash wants separation of religion and state, but the list has no joint marriage or conversion position. None of the three options fits, so I updated the text and left the stance open. For Daniel: the options lack a "separate religion from state" choice.
- **religion-state, Ra'am.** No position. The options describe Jewish institutions, so they do not fit a Muslim party.
- **war-hostages, Noam.** No vote or statement found. Coverage of the Jul 7, 2026 first reading (59 to 0) does not name Noam. Coverage of the Oct 22, 2025 committee vote names only Likud, UTJ and Shas.
- **west-bank, Shas.** Its MKs co-submitted the July 2025 non-binding motion for sovereignty over the areas of Jewish settlement, which passed 71 to 13 (Ynet, https://www.ynetnews.com/article/bkxfw9algl). It was absent from the October 2025 binding vote (Arutz Sheva, https://www.israelnationalnews.com/news/416645). That matches Likud's pattern, and Likud's row is settle-no-annex. Annex-part is defensible, but annex-part for Shas next to settle-no-annex for Likud would be inconsistent. **For Daniel:** choose both, or neither.
- **west-bank, UTJ.** Its factions are split. Both backed the July 2025 motion. On Maoz's bill in October 2025, Agudat Yisrael voted for it "to highlight the hypocrisy" of the government, and Degel HaTorah voted against: sovereignty "at this time" puts Israel in conflict with the US (Times of Israel, https://www.timesofisrael.com/2-west-bank-annexation-bills-get-initial-nod-with-mks-rebelling-against-pm-as-vance-visits/). I added the votes to the text.

## Old or weak rows reviewed

- west-bank, Noam (2025 bill): updated to Maoz's Sep 7, 2026 statement (Channel 14, https://www.c14.co.il/article/1692880), "תחיל ריבונות ביהודה ושומרון". Still annex-all.
- courts, Ra'am (2023 votes): no newer evidence found. It declined Ynet in 2026. It stays as is.
- palestinian-state, Blue and White (2025 op-ed plus 2026 line) and Reservists–Economic (Hendel, Aug 2026, before the merger): no newer statements found. They stay as is.
- haredi-draft, Likud (2025 Karhi quote) and west-bank, Likud (Oct 2025): still the latest Likud statements on record. Likud also voted for the July 2025 sovereignty motion, which leans against settle-no-annex. See the Shas note.
- religion-state, Otzma: rests on 2022 and 2019 statements, as above.
- lib/positions.ts: removed "otzma" from the courts sub-question evidence override. The override labelled its row "Party questionnaire answer, Sep 22, 2026", and the row now rests on the Jerusalem Post.
