# Hebrew builder data overlays: research log (he-builder-data, 2026-10-06)

Files: data/he/{pledge-rules,coalition-scenarios,outgoing-government,pollsters,voter-base,results}.json.
Hashes: `node scripts/he/builder-data-check.mjs --write` fills every `src` from the current English (same FNV-1a as lib/i18n/localize.ts srcHash); without `--write` it checks keys, field paths, src, empty text, `{and:}`/`{comma:}` placeholders and that every number in the English is in the Hebrew. Last run: 0 errors, 0 warnings.

## Counts
| File | Items | Fields | Translated quotes |
|---|---|---|---|
| pledge-rules.json | 16 | 16 (`message`) | 10 |
| coalition-scenarios.json | 4 (3 scenarios + `historical`) | 21 | 0 |
| outgoing-government.json | 1 (`_`) | 15 | 0 |
| pollsters.json | 23 names | 23 | 0 |
| voter-base.json | 2 (likud, byachad) | 13 | 0 |
| results.json | 1 (`_`) | 8 | 0 |

## Field choices
- pledge-rules: `message` only (as OVERLAYS.md). `{and:...}` / `{comma:...}` placeholders kept verbatim; they are always set after a colon ("בקואליציה הזאת: {and:arab}") so no verb has to agree with one party or several. lib/coalition.ts `fill` joins with English names and English " and " today; the Hebrew builder needs a Hebrew join (Intl.ListFormat he) and Hebrew party names.
- coalition-scenarios: `title`, `agenda`, `obstacles.0/1`, `leadership`, `source`; plus key `historical` (`title`, `text`, `source`), which has no id, so pages read it with `overlayText(english, OVERLAYS.scenarios.historical?.[field], lang)`.
- outgoing-government (`_`): `title`, `seatsNote`, `events.N.text`, `events.5.seatsText` ("62 או 63", still parsed by the CoalitionSeats range regex), `status.text`, `noam.text`. Source outlet names (`events.N.source.name`) left in English. status.text uses "ממשלת מעבר": OutgoingGovernment's `linked()` looks for "transitional government" and needs the Hebrew phrase to link the glossary.
- voter-base: `listName`, `source`, `groups.N.label` (bare group nouns for the key: מסורתיים...), `won.N.label` (with ה, for a "זכתה ב-X% מ{label}" frame). `note` is not rendered; skipped.
- results (`_`): `source.label`, `source.note`, `thresholdSource`, `lettersSource`, `agreements.N.source`, `agreementsNote` (all rendered on /results or the builder sources box). `unconfirmedAgreements` is not rendered; skipped.
- Citations inside prose fields name outlets in Hebrew (טיימס אוף ישראל, ג'רוזלם פוסט, וואלה, ynet, אמס, אייס); dates and numbers unchanged.

## Quotes (pledge-rules)
Originals (no flag):
- byachad-no-netanyahu, Bennett: "ברור שלא. אני הולך להחליף אותו" — Ynet (Hebrew), Jul 3, 2026, as recorded in docs/research/2026-10-06-gaps/pledges.md.
- rz-no-arab-parties, Smotrich: "חמור פי 1,000" — from "מי שבמודע מכר את מדינת ישראל לאויביה ולתנועה האסלאמית, עשה משהו שחמור פי 1,000 מהמחדל הכי נורא", 103FM interview, May 5, 2026 (Maariv breaking news https://www.maariv.co.il/breaking-news/article-1317541; also Kan, Srugim https://www.srugim.co.il/1303662).

Translated ("translated": true), original Hebrew not found:
- eisenkot-no-raam (Eisenkot on Abbas, Sep 26)
- lieberman-no-arab-no-haredi ("not for the Arab parties and not for the haredi parties", JPost Sep 21, 2025; Srugim Mar 13, 2025 interview checked, line not there)
- joint-list-no-netanyahu ("send Netanyahu and Smotrich home")
- yashar-no-netanyahu ("unfit to lead")
- dem-no-likud-rz-otzma ("fundamentally and decisively unacceptable"; "No")
- dem-no-haredi (Golan, May 27, 2026; Maariv article-1326077 of that date checked: it quotes "המפלגות החרדיות פסלו את עצמן, נקודה", not the line in the English)
- yb-no-netanyahu (Liberman on X, Sep 17, 2026)
- bw-no-netanyahu (Gantz, JPost Aug 20, 2026). Candidate: search snippets give Gantz "אני לא אתן לנתניהו את האצבע ה־61. מעולם לא נתתי לו", undated; not matched to the Aug 20 statement, so kept as a translation (the translation uses his idiom "האצבע ה-61").
- res-zionist-unity-only (Hendel)
- otzma-no-eisenkot (Ben-Gvir on X, JPost Aug 29, 2026)
No quote, no flag: zionist-opp-no-arab-parties, byachad-zionist-only, utj-yeshiva-status-law, poi-draft-law-first.

## Pollster and firm names
Outlets: Channel 12 חדשות 12; Channel 13 חדשות 13; Channel 14 חדשות 14 (STYLE.md: credit the outlet as "סקר חדשות 14", matching 12 and 13); Kan 11 כאן 11; Maariv מעריב; Zman Yisrael זמן ישראל; Israel Hayom ישראל היום; i24NEWS (Latin); Walla וואלה; Yedioth Ahronoth ידיעות אחרונות; Ynet ynet; Makor Rishon מקור ראשון; Haaretz הארץ (the last four are in polls.config.pollsters only).
Firms (expansions from the Wikipedia 2026 polling page's pollster table):
- Lazar → לזר מחקרים (STYLE.md).
- LRI+P4A (Lazar Research Institute + Panel4All) → לזר מחקרים + Panel4All.
- Midgam R&C (Midgam Research & Consulting) → מדגם מחקרים וייעוץ (Mano Geva's firm; verified in Hebrew press).
- MP+TM+SN+A (Midgam Project, The Madad, Stat-Net, Askaria) → פרויקט מדגם + המדד + סטט-נט + אסקריה. המדד and סטט-נט per STYLE.md; **"פרויקט מדגם" and "אסקריה" are unverified transliterations.**
- Kantar → קנטאר (STYLE.md marks Kan's firm name unverified).
- Next Data / Filber → Next Data / פילבר; SF+ND (Shlomo Filber + Next Data) → שלמה פילבר + Next Data (STYLE.md keeps NEXT DATA in Latin).
- Direct Polls → דיירקט פולס (STYLE.md).
- Tatika → טאטיקה מחקרים ומדידה; Yossi Tatika → יוסי טאטיקה. Spelling from Srugim: "סקר חדש שערך יוסי טאטיקה ("טאטיקה מחקרים ומדידה") עבור אתר "זמן ישראל"" (https://www.srugim.co.il/1297937). This resolves STYLE.md's "Zman Yisrael's pollster name: unverified".

## Open questions for Daniel
- Unverified firm spellings: פרויקט מדגם, אסקריה (Channel 13's credit line), קנטאר.
- events.6: English says "police minister" (ToI shorthand); Hebrew uses the office's name, השר לביטחון לאומי.
- status.text: "the Attorney General" rendered as "הייעוץ המשפטי לממשלה" (gender-neutral institutional form).
