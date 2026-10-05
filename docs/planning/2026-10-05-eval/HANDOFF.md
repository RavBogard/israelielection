# Handoff for Daniel (2026-10-05): rulings and words needed to finish the approved build

Everything in EVAL.md is approved and being built. These are the items only you can supply.
Answer in any order; paste the answers back to the code session (or edit this file) and the
build picks them up. Where a draft is given, it is placeholder wording taken from existing site
copy; it ships as a draft and is replaced by yours.

## 1. The one line on what this election is not about (home hero)
Approved by Daniel, 2026-10-05; applied to the homepage in the design checkout:
> For most Jewish Israeli voters, Palestinian rights and statehood are not at the center of
> this election. Read why—and who has no vote in it.
Links: "Read why" → /american-lens; "who has no vote" → /how-it-works/who-votes.
Resolved. The IDI survey did not offer Palestinian rights/statehood as a separate answer;
the framing is a synthesis of that survey and documented party positions (ruling 114).

## 2. A note from Daniel (home page, about 120 words, signed)
Why this site exists, who it is for, how it is made (every number dated and sourced; a daily
AI-written briefing in which every sentence links its source; polls merged by a validator; your
rulings on language in the open). The section is built and hidden until the text exists in
`data/home-note.json` (`{ "text": "...", "signed": "Rabbi Daniel Bogard", "date": "2026-10-06" }`).
Resolved: Daniel approved the drafted note on 2026-10-05. The approved text and signature
are saved in `data/home-note.json`, dated 2026-10-05. It explicitly discloses that the
AI briefing publishes automatically and carries source links for every sentence.

## 3. About and method page (/about)
The route and styling are built; the copy is yours. Suggested sections: who made this and why;
how it is made (the method statement: sources, dating, the validator, the briefing, the
fact-check rounds, the language rulings, the licence); what it is not (not advocacy, not a
congregation project); how to correct it (an email or GitHub issues). The pollster-leaning note
from ruling 22 goes here.
Resolved: Daniel approved the drafted page on 2026-10-05, with named tools instead of generic
“AI”: Gemini Flash 3.8 for the briefing; site development primarily through Claude Code using
Fable 5.1 and Opus 5.5. Fetching is done by scripts, so the page describes Gemini's briefing
role separately. Added `/about` with the approved copy, GitHub issues for corrections, and
links in the home index, footer and sitemap. Source perspectives follow ruling 22.

## 4. Plan amendment
Resolved: Daniel selected the proposed detailed wording (writing block 82417) on 2026-10-05.
The Voice line in `docs/00-PLAN.md` now records rulings 114–118, distinguishes evidence from
interpretation, and preserves his signed introductions on the homepage and About. Applied
to both the main and design checkouts.

## 5. Teaching resources: the promise
The page and footer promise "source sheets, teacher's guides and discussion questions"; one deck
exists. Being done now: reworded to what exists. Ruling needed: when the sheets and questions
come, and whether the Jewish-texts section (Berakhot 58a and the class sheets) goes up under
/teach/texts with your approval text by text, as the plan said.

## 6. "Zionist opposition" as a bloc label
It sits on the home page, polls, results and the glossary. RULINGS 112 flagged the tension. Ruling
needed: keep, or rename (candidates: "Opposition, Zionist parties"; "Anti-Netanyahu bloc (Zionist
parties)"; the IPF's wording). Changing it touches data/parties.json blocs and the share card.

## 7. Coalition Builder address
Moving to /coalition-builder (the old /coalition redirect follows it). Ruling needed only if you
prefer another slug (/build, /coalition).

## 8. Google Analytics notice
The content session added GA at your request. A footer privacy line ("This site uses Google
Analytics to count visits; no accounts, no ads") was offered and not added. Ruling needed: add it
or not.

## 9. "Far-right" as a label in the site's voice
The settlers and haredim pages use "far-right" for Otzma Yehudit and allies in page voice; press
usage, unruled. Ruling needed: allow it as the common press label, or attribute it each time.

## 10. Session 1 deck PDF
The PowerPoint carries the new labels (no class calendar, rulings 116 to 118 applied), but the
PDF export still says "inside the territories" (p. 8), "Arab-led" (pp. 26 to 28) and "the Arab
lists" (p. 30) because its embedded fonts lack the glyphs. Needed: a fresh PDF export from the
Slides source, or permission for the content session to regenerate it.

## 11. Open sourcing items (content lane)
The Israeli toll since Oct 7 cites Arutz Sheva only; the Sasson Report outpost definition is
unsourced; the Zehut and Religious Zionism list relationship is unclear in parties.json. No ruling
needed unless you have a preferred source; listed so you know.
