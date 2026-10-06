# Hebrew positions overlays: research log (he-positions, 2026-10-06)

Files written: `data/he/positions/*.json` (7), `data/he/comparison-questions.json`, `data/he/gaza-security-evidence.json`.
Check script: `node --no-warnings scripts/he/positions-check.mjs` (validate) or `--write` (refresh every `src` from the current English, then validate). It imports `srcHash` and `fieldAt` from `lib/i18n/localize.ts`, so hashes and paths are the ones the pages use.

## Counts

| File | Fields | Translated quotes (`translated: true`) |
|---|---|---|
| positions/courts | 22 | 1 |
| positions/economy | 22 | 10 |
| positions/haredi-draft | 23 | 3 |
| positions/palestinian-state | 23 (incl. `columnNote`) | 3 |
| positions/religion-state | 21 | 7 |
| positions/war-hostages | 20 (Noam row has no text) | 0 |
| positions/west-bank | 23 | 0 |
| comparison-questions | 87 | 7 |
| gaza-security-evidence | 12 (incl. `_` `unstated.otzma.text`) | 5 |
| **Total** | **253** | **36** |

Every English field these overlays cover has Hebrew; none is left in English. Not covered (outside the OVERLAYS.md contract): the comparison file's top-level `method`, and the Gaza rows' `evidence.kind` / `evidence.limitation` strings.

## Original Hebrew sources found (fetched 2026-10-06)

Ynet / Yedioth series "ביקשנו מכל המפלגות" (the Hebrew originals behind the ynetnews English questionnaires):
- Draft, 16.9.26: https://www.ynet.co.il/news/elections2026/article/yokra14898966 ("ביקשנו מכל המפלגות את התוכנית לסוגיית הגיוס. רק אחת לא ענתה"). Used for the draft rows of Likud (opening quote), Shas, UTJ, RZ, Otzma, Yashar (3% line), B'Yachad, Democrats, Yisrael Beytenu, Reservists, Joint List, Ra'am, Blue and White; the economy row of Blue and White; comparison draft-left-yeshiva Yashar, Blue and White, Reservists.
- Courts, 22.9.26: https://www.ynet.co.il/news/elections2026/article/yokra14903844 ("שלא יגידו 'לא ידענו'"). Used for Likud ("לא משתתפים בשאלונים"), Shas (Deri), and the comparison unstated entries for Reservists ("הרכב מאוזן") and the Joint List ("שישמור על עצמאות מערכת המשפט"). Note: the Hebrew Democrats answer here is about repealing "חוקי ההפיכה המשטרית"; the English row's content (delays, overloaded courts, intermediate appeals court) is from ynetnews and was kept as the English states it, unquoted.
- West Bank, 30.9.26: https://www.ynet.co.il/news/elections2026/article/yokra14910407 ("פינוי או בינוי"). Used for every quoted row in palestinian-state and west-bank except Likud, Noam, Blue and White (pstate), Reservists (pstate) and Netanyahu's video.
- Oct 7 inquiry, 4.10.26: https://www.ynet.co.il/news/elections2026/article/yokra14915209 ("ממלכתית, 'לאומית' או משהו אחר"). Every war-hostages quote except Otzma.
- Shabbat transport, 31.8.26: https://www.ynet.co.il/news/elections2026/article/yokra14883243. Likud ("רוצים לחבר את ישראל בששת ימי המעשה, תוך שמירת השבת"), RZ ("שמירה על השבת בפרהסיה הציבורית..."), Blue and White ("כחלק מרפורמה להעברת סמכויות לרשויות המקומיות", Ynet's wording), Joint List (written as reported speech).

Other Hebrew originals:
- Likud on the Oct 2025 sovereignty bills: Kipa, https://www.kipa.co.il/חדשות/1213720-0/ ("הטרלה של האופוזיציה, שמטרתה לפגוע ביחסינו עם ארה"ב" ... "ריבונות אמיתית תושג לא בחוק ראווה לפרוטוקול, אלא בעבודה נכונה בשטח"). English said "provocation"; the Hebrew word is "הטרלה".
- Knesset resolution, 18.7.24: Kan, https://www.kan.org.il/content/kan-news/politic/774418/ ("כנסת ישראל מתנגדת באופן נחרץ להקמת מדינה פלסטינית ממערב לירדן"). UTJ pstate row.
- Opposition leaders' joint statement, 27.3.25: Srugim (URL in the English data) ("בממשלה הבאה נדאג שהחוק לשינוי הוועדה לבחירת שופטים יבוטל").
- Liberman, 15.2.23: https://www.inn.co.il/news/592411 ("פסקת התגברות ברוב של 70 ח"כים").
- Hendel, 12.9.21: https://www.inn.co.il/news/504642 ("צריך לספק חלופה למי שלא יכול להתחתן").
- Ben Gvir, 7.9.22: https://www.inn.co.il/news/576700 ("המדינה יהודית, הנישואים צריכים להיות כדת משה וישראל").
- Ben Gvir in cabinet, 17.11.25: Mako (URL in data) ("המתווה חייב להיות לאומי ללא אנשי מערכת המשפט, אלו שיושבים על הכס הם חלק מהנחקרים").
- Maoz, 14.7.26: https://www.c14.co.il/article/1620270 ("פלסטר לקראת הבחירות"; "מי שלומד צריך להמשיך ללמוד, ומי שאינו לומד, צריך להתגייס ולשאת יחד איתנו במצווה הגדולה של הגנה על המולדת").
- Maoz, 7.9.26: https://www.c14.co.il/article/1692880 (west-bank quote verbatim; the pstate "terror" line is indirect speech in the source, so the Hebrew row renders it as "לדברי אבי מעוז, ...", unquoted).
- Maoz on the budget, 28.1.26: https://www.jdn.co.il/news/2568429/ ("זהו תקציב שמתעלם לחלוטין מהזהות היהודית של מדינת ישראל").
- Otzma platform: https://ozma-yeudit.com/program/?lang=he ("קפיטליזם יהודי"; "מצע חברתי וכלכלי מפורט יפורסם בנפרד").
- People of Israel founding principles: https://amchaisrael.co.il/foundations ("מדינה שהיהדות בה מזמינה ולא כופה, משתפת ולא מכתיבה").
- B'Yachad Hebrew home page: https://be-yahad.org.il/ ("תוך שלוש שנים נוריד את מחירי המזון ב-30%"; "אנחנו נצא למלחמת חורמה לפירוק קרטלי המזון"). The English data cites the English site.
- B'Yachad security plan (Hebrew): URL in data ("אין לנו עניין לנהל את עזה").
- RZ–Otzma 2022 (Ynet Judaism, 30.10.22): https://www.ynet.co.il/judaism/article/bysw00aons ("לעגן בחוק את מעמדו הבלעדי של הגיור הממלכתי הכפוף לרבנות").
- Blue and White 2019 (Ynet, 7.4.19): https://www.ynet.co.il/articles/0,7340,L-5490470,00.html ("נחוקק את ברית הזוגיות"; "דרך המלך של העם היהודי").
- Noam (israel2026.co.il Hebrew page): https://israel2026.co.il/parties.html ("שמירת השבת במרחב הציבורי וחיזוק הרבנות, הגיור והכשרות האורתודוקסיים"). The comparison file cites the English page; the Hebrew page's own wording is used there too.
- Mansour Abbas, 6.12.25: Mako, https://www.mako.co.il/news-politics/2025_q4/Article-970dc7c2394fa91027.htm ("רע"ם היום הולכת בכיוון של להיות מפלגה אזרחית לחלוטין, עם מוסדות נפרדים").
- Winter, comparison draft-left-yeshiva: Srugim, https://www.srugim.co.il/101010208-וינטר-בתנאי-לנתניהו-נשב-בממשלה-רק-עם-חוק ("אין מגזר מעל החוק"; the rest is Srugim's indirect speech). Same statement as the Jerusalem Post's Sep 2 quote, as far as I can tell; Daniel may want to check the date matches.

## Translated quotes (original Hebrew not found, or the original is English)

Original is English, so a Hebrew quote is always a translation: Netanyahu to Fox (Gaza likud), Gantz's NYT op-ed (pstate bw), IDI English guide (economy likud, utj, yashar, dem, yb; religion-state dem), Jerusalem Post summaries (economy jl, raam; religion-state shas, utj; comparison draft-exemptions shas, utj; relig-shabbat shas, utj), Jewish Chronicle (religion-state yashar), Times of Israel's rendering of the RZ coalition deal (religion-state rz, second quote).

Hebrew speaker, original not found after searching: Ben Gvir "just the beginning" (courts otzma); Smotrich budget (economy rz); Deri on food stamps (economy shas); Winter "the more you serve" (economy poi); Karhi July 2025 (draft likud); Winter "Full stop" (draft poi); Eisenkot "revoke any state incentives" (draft yashar); Netanyahu campaign video (pstate likud); Gantz "not about a Palestinian state" (pstate bw); Hendel Aug 2026 (pstate res); Gafni "moral compass" (religion-state utj); Lapid and Bennett (religion-state byachad); Liberman five-point pledge (religion-state yb); Smotrich "Whoever is not studying Torah must enlist" (draft-left-yeshiva rz) and "anyone who is not studying must enlist" (draft-exemptions rz); Gantz 2021 civil marriage (relig-marriage bw); Smotrich Gaza, Liberman Gaza, Ben Gvir "Nisanit", Gantz 2024 governance mechanism (Gaza).

Two very short fragments were rendered as indirect speech rather than flagged (the fact is unchanged): Degel HaTorah's "at this time" (west-bank utj) and Hadash's "separation of religion from state" (religion-state jl).

## Writing decisions

- English "(translated)" markers are dropped wherever the Hebrew original is now quoted.
- Rows with English basis "unstated" (palestinian-state utj, religion-state likud) open with "לא הביעה עמדה בפומבי". The script enforces this.
- "On the record:" inside record rows is "לפי התיעוד:".
- "Joint list" (a merged slate) is "ריצה משותפת" / "איחוד" / "שותפתה לרשימה", never "רשימה משותפת", so it can't be confused with הרשימה המשותפת.
- Quotes keep the source's own spelling (רע"מ, פלשתינית, "מיהודה שומרון", ״/׳ marks); prose uses STYLE.md names (רע"ם).
- Dates: the year is dropped for Aug–Oct 2026 campaign dates and kept for everything earlier.
- Stance labels for war-hostages say "החוק מ-1968" to keep the 1968 law distinction.
