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
Timing resolved: Daniel chose “As they’re ready, with no public deadline” on 2026-10-05.
Format resolved: Daniel chose downloadable class sheets only, approving each sheet before
publication. Traditional Jewish texts will be occasional; no separate `/teach/texts` section.
Public descriptions name materials actually available, with additions as they are ready.

## 6. "Zionist opposition" as a bloc label
Resolved: Daniel chose “Anti-Netanyahu bloc (Jewish-majority parties)” on 2026-10-05.
Applied to the shared bloc data and glossary in both checkouts; derived labels feed home,
polls, results, Party Map, builder, embeds and share cards. Coalition warning/explanatory copy
now names the selected parties with recorded pledges, rather than describing the whole bloc
as having pledged to exclude Arab parties. Bloc membership and seat arithmetic are unchanged.

## 7. Coalition Builder address
Resolved: Daniel has no preference (2026-10-05). /coalition-builder stays; the old /coalition
redirect (308, query preserved) follows it. No change.

## 8. Google Analytics notice
Resolved: Daniel approved the footer line "This site uses Google Analytics to understand visits
and page use. Privacy." with Privacy linking to a Privacy section on About (2026-10-05). Footer
line added by the design session; the About section, with Codex's approved text, is the content
session's. No claim of anonymity or of a consent control: neither has been verified.

## 9. "Far-right" as a label in the site's voice
Resolved: Daniel approved the rule (2026-10-05), recorded as RULINGS #119. "Far-right" in page
voice only for Otzma Yehudit, the Religious Zionist Party and their 2021/2022 joint lists, named,
with IDI's classification cited at first substantive use. Applied on the haredim and settlers
pages (4dabdb2). The timeline's "far-right Jewish activist" for Yigal Amir is its source's wording
(Jerusalem Post) and stays.

## 10. Session 1 deck PDF
Resolved (content session, 2026-10-05): slides 21 to 24 and 28 and their notes now read
"Anti-Netanyahu bloc (Jewish-majority parties)"; "Lieberman" corrected to "Liberman" (ruling 32).
Fresh 31-page PDF exported from the corrected PowerPoint with the deck fonts (Libre Baskerville,
Public Sans) embedded; the old PDF's font substitution was the cause of its stale wording. Slide
28's bloc heading widened so the longer label fits. Every slide inspected; PDF text checked: no
"Zionist opposition", "inside the territories" or "the Arab lists". Speaker notes preserved.

## 11. Open sourcing items (content lane)
Resolved (2026-10-05): the war page's Israeli toll now cites the Defense Ministry's Oct 4, 2026
release (1,318 security personnel) and attributes the National Insurance Institute's 1,029
civilians to JNS's Oct 4 report; both include Oct 7; Arutz Sheva dropped (4dabdb2). The outpost
definition is attributed to Peace Now in the glossary; Religious Zionism–Zehut is described as two
parties on one list. No further action.
