# Hebrew parties overlay: research log (he-parties, 2026-10-06)

File: `data/he/parties.json`. Script: `scripts/he/parties.mjs` (validate; `--stamp` fills empty `src`; `--restamp` only after rereading the Hebrew). Contract: `docs/planning/2026-10-06-hebrew/OVERLAYS.md`; style: `STYLE.md`.

## Coverage
- 25 keys: 15 parties, 4 `bloc:<id>`, 6 `issue:<key>`. 391 fields, every rendered English text field (name, short, leader, surplusLine, status, thin, who/voters/pledges/issues text, names name/note, bios name/text, surplusPartner, quote.text, quote.speaker).
- `quote.speaker` is not in the OVERLAYS.md table but PartyProfile renders it, so it is included (fieldAt reads it; `partyText(p, "quote.speaker", lang)`).
- Sources (`source`, `namesSource`, `quote.source`) are not translated: they name English-language articles.

## Method for quotations
- `quote.text`: original Hebrew used where found (7); otherwise a Hebrew rendering flagged `translated: true` (6).
- Quotes inside `who` / `voters` / `issues` / `pledges`: kept in quotation marks only when the original Hebrew was found (list below). Everything else is written as reported speech (לדברי..., אמר ש..., לטענתה...), with no quotation marks, so no rendering is presented as the speaker's words. Facts and numbers unchanged.

## Originals found (Hebrew URL, date)
| Field | Hebrew used | Source |
|---|---|---|
| likud quote.text | "זה או שמאל או ימין. זאת תמצית הבחירות. או שמאל או ימין. אין ישר - זה בלוף." | Walla, 18 Sep 2026, https://www.walla.co.il/news/breaking-news/3868649 (also Haredim10 https://ch10.co.il/news/1102486/) |
| likud issues.courts (Levin 2023) | "אנחנו הולכים לקלפי, בוחרים ומצביעים אבל פעם אחר פעם אנשים שלא בחרנו מחליטים עבורנו - זו לא דמוקרטיה" | Haredim10, 4 Jan 2023, https://ch10.co.il/news/790480/ |
| likud issues.courts (Levin 2026) | "פשוט תיכחדו" (rest paraphrased) | Behadrei Haredim headline, https://www.bhol.co.il/news/1735878 (403 on fetch; wording from the search index); Kan https://www.kan.org.il/content/kan-news/politic/1088166/ |
| otzma quote.text | "עברנו את פרעה, נעבור גם את סטארמר." | Kikar HaShabbat, 10 Jun 2025, https://www.kikar.co.il/scoop-news/43723 |
| otzma issues.draft | "חרדי ולצאת ממנו חרדי" | ynet, 16 Sep 2026, https://www.ynet.co.il/news/elections2026/article/yokra14898966 |
| shas quote.text | "ביבי נתניהו יחזור בתשובה? אין סיכוי… איזנקוט אולי כן יחזור בתשובה." | Kipa, Aug 2026, https://www.kipa.co.il/חדשות/1229440-0/ |
| shas pledges.0 | "אנחנו תומכים בנתניהו, נקודה." | Arutz Sheva, 16 Jul 2026, https://www.inn.co.il/news/701704 |
| utj quote.text | "יש הרבה שנראים כמו אתרוגים - אבל זה לא אתרוג." | Arutz Sheva, 27 Sep 2026, https://www.inn.co.il/news/707134 |
| utj pledges.2 | "אין לנו יותר אמון בנתניהו" | ynet headline, https://www.ynet.co.il/news/article/b1oaq00gjmx |
| rz quote.text | "כל יישוב, כל שכונה, כל יחידת דיור היא מסמר נוסף בארון הרעיון המסוכן הזה." | ynet, https://www.ynet.co.il/news/article/hkzhhmxfgg (E1 approval; fetch reported 12 May 2025, unverified) |
| rz issues.wb | "מוחק הלכה למעשה את אשליית 'שתי המדינות'" | same ynet article |
| poi issues.draft | "לא ניכנס לממשלה שלא תעביר לפני הקמתה חוק ששם סוף להשתמטות ומחייב את כולם להתייצב ולתרום." | Srugim, 2 Sep 2026, https://www.srugim.co.il/101010208-וינטר-בתנאי-לנתניהו-נשב-בממשלה-רק-עם-חוק |
| yashar issues.draft | "שירות ממלכתי לכל" | ynet, 16 Sep 2026 (yokra14898966) |
| dem quote.text | "בממשלה שלנו יהיו אפס נאשמים בפלילים." | Yair Golan on X, https://x.com/YairGolan1/status/2079579891574485311 |
| dem issues.draft | "במסגרת ממלכתית ושוויונית" | ynet, 16 Sep 2026 (yokra14898966) |
| yb quote.text | "הליכוד של פעם." | ynet, https://www.ynet.co.il/news/article/b1af00mk011l (party messaging: ישראל ביתנו היא "הליכוד של פעם") |
| yb issues.draft | "יהודים, מוסלמים, נוצרים, דרוזים וצ'רקסים" | ynet, 16 Sep 2026 (yokra14898966) |
| jl issues.draft | "אין להטיל סנקציות על אדם שבוחר שלא להתגייס" | ynet, 16 Sep 2026 (yokra14898966) |
| raam pledges.1 | "לאיזנקוט לא תהיה ממשלה בלי רע"ם" | Zman Yisrael live, https://www.zman.co.il/live/727769/ |

## Rendered, flagged `translated: true` (quote.text)
- poi (Winter): closest original is "פחות פוליטיקה - יותר מנהיגות. אנשים שלא לקחו חלק בכשלי השביעי באוקטובר" (Kipa, 25 Aug 2026, https://www.kipa.co.il/חדשות/1230278-0/). Different wording ("failures", not "events"), so not used. Daniel may prefer to swap in the original.
- yashar (Eisenkot, "I forced it upon him on the ninth day"): not found. Coverage confirms the hostages were added as a war goal on 16 Oct 2023 at his demand (ynet https://www.ynet.co.il/news/article/rklp9o19gg), but not his words.
- byachad (Bennett, "not a schmuck"): said in English at the JNS conference; ynet's Hebrew headline is "אני איש ימין אבל לא שמוק" (https://www.ynet.co.il/news/article/hjg5l3pzge). Flagged because the original is English.
- res ("Our mission is solely to establish a Zionist government"): not found. Closest Hendel line: "ממשלה ציונית ללא מפלגות חרדיות וערביות, חוק גיוס והכרעה בשדה הקרב" (ynet, 17 Jun 2026, https://www.ynet.co.il/news/article/hkkpofgffg).
- jl (committee decision "political, racist, anti-democratic… more than one million voters"): Walla (23 Sep 2026, https://www.walla.co.il/news/politics/383955133) reports the first part; the fetch returned it in English, and the "million voters" sentence was not found.
- raam (Segalovitz, "I am going to an Arab party"): not found (Kikar full statement https://www.kikar.co.il/political-news/segalovitz-joins-raam-full-statement has other lines).

## Searched, not found (written as reported speech)
Netanyahu "As long as I am prime minister…", Likud "does not participate in questionnaires", Deri "get that into your head" (Walla 3 Sep 2026 has a different line: "צה"ל לא רוצה חיילים חרדים, זה עושה לו כאב ראש"), UTJ draft statement, Eisenkot "won't be part of my next government" (Walla 26 Sep 2026 has "הם לא יהיו חלק מהממשלה", about Ra'am, not Abbas personally), Golan's Haredi and Arab-party lines, Hendel's lines, Ben-Gvir on separate runs, Smotrich on arrests, Abbas lines, Jabareen lines.

## For Daniel's review (wording I was unsure of)
1. Bloc labels: `bloc:opp` = "גוש האופוזיציה (המפלגות הציוניות)" (the English has the parenthetical; STYLE's long form is "האופוזיציה הציונית"). `bloc:arab` = "הרשימה המשותפת ורע"ם", STYLE's exact long form, because the English label names the lists (ruling 107) rather than saying "Arab parties". Switch to "המפלגות הערביות" if the short bloc name is wanted here.
2. `issue:wb` label "יו"ש / הגדה המערבית" (STYLE pairs the names; short form for a chip). `issue:war` "המלחמה ועזה".
3. likud quote.text: the English quote (Reuters, Sep 29) continues "Do you want a Palestinian state? (or) do you want a Jewish state?"; the Hebrew original found (Sep 18 event) has only the left/right/bluff part, so the Hebrew is shorter than the English.
4. dem quote.text drops the closing "Zero." (the X post continues "אפס זה כלל יסוד של דמוקרטיה").
5. yb quote.text is the phrase "הליכוד של פעם." without "אנחנו", which was not seen verbatim.
6. "settlements" written as התנחלויות (rz voters.2, wb text, jl pledges). An alternative is יישובים.
7. Name spellings not checked against a Hebrew source: יוסף אלנתנוב (Shas no. 11), נטלי שם טוב (People of Israel no. 3), חביב וליבוביץ' (Reservists no. 4), שטרק (UTJ "Stark"), פינקלשטיין. The rest follow STYLE.md or standard spelling (סגלוביץ without geresh, per STYLE).
8. otzma "התנתקות 710" is a guessed Hebrew name for the "Disengagement 710" plan.
9. rz short name is "הציונות הדתית" (STYLE) rather than "הציונות הדתית–זהות"; jl short is "המשותפת".
10. noam/bw `thin`: written impersonally (טרם נמצאו..., מאגרי המחקר אינם כוללים...) because STYLE keeps "אנחנו" to the method tab. PartyProfile rewrites the English `thin` with a regex; the Hebrew is already in final form, so the page should not run that regex on the Hebrew.
11. poi who.0 drops the English opener "Amcha Yisrael." (a transliteration Hebrew readers don't need).
