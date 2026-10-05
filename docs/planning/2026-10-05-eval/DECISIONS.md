# Handoff decision walkthrough — 2026-10-05

Source: `C:/Users/dsbog/israelielection-design/docs/planning/2026-10-05-eval/HANDOFF.md`.
Daniel requested a guided, one-item-at-a-time discussion, with pop-up choices and research
before and after decisions where useful. Record his actual answers; recommendations are drafts.

## 1. Homepage framing — approved by Daniel, 2026-10-05

Approved wording: “For most Jewish Israeli voters, Palestinian rights and statehood are not
at the center of this election. Read why—and who has no vote in it.”

- Ruling 114 supplies the intended framing; 115–118 supply the voice rules.
- Verified [IDI's September 2026 survey](https://en.idi.org.il/articles/66177): security,
  economy and conscription rank prominently, but Palestinian rights/statehood were not a
  separate response option. This survey alone cannot establish the proposed claim.
- Verified [Ynet's party questionnaire](https://www.ynetnews.com/article/h1dpvu9cgl): several
  Jewish-majority parties oppose statehood; Yashar! says it is not on its agenda. The broad
  voter framing remains an interpretation of combined evidence.
- Daniel answered “approved” after the recommendation. Applied the exact wording and retained
  both destination links in the design checkout's `app/page.tsx`; updated its HANDOFF.md.

## 2. Signed homepage note — approved by Daniel, 2026-10-05

Daniel answered “approved” to writing block 73591. Saved its exact text, with paragraph breaks,
to the design checkout's `data/home-note.json`, signed Rabbi Daniel Bogard and dated 2026-10-05.
The page already renders the signature and date separately. Updated its HANDOFF.md.

Approved text (canonical copy):

> I made this site to help American readers understand Israel’s election on its own terms. The questions shaping Israeli voters’ choices often differ from those driving our conversations here. I want us to see those differences clearly, including whose lives are affected and who has no vote.
>
> You can explore the parties, follow the polls and try building a coalition. Numbers come with dates and sources. Automated checks screen new polls. The daily briefing is written by AI and published automatically, with source links for every sentence. My decisions about language are documented openly, and I’m responsible for correcting mistakes.
>
> I hope it helps you learn, teach and ask better questions.

Preserved paragraph breaks in the homepage renderer; signature/date remain separate.

Checked the existing method before drafting: polls are screened by a deterministic validator;
accepted imports are merged automatically, exceptions go to review. The daily AI briefing uses
feed headlines and summaries, publishes automatically after source-link/headline-overlap checks,
and can be corrected or removed. Those checks do not establish the truth of every sentence.
Keep the signed note brief and truthful; explain detailed limitations on About.

## 3. About/method page — approved with tool attribution, 2026-10-05

Daniel approved writing block 58216, replacing generic “AI” with named tools: Gemini Flash 3.8,
and site development primarily through Claude Code using Fable 5.1 and Opus 5.5.
GitHub corrections are included in the otherwise-approved draft; no email address was supplied.

Implementation: `content/about.mdx` and `app/about/page.tsx` in the design checkout, using
the existing article shell. Linked through Understand's `more` items, the home index and
footer; `NAV` includes the route in the existing sitemap. Updated its HANDOFF.md.

Factual clarification explained to Daniel: scripts fetch feeds and poll tables; Gemini writes
the briefing from feed material. The page names Gemini's actual role rather than claiming the
model does the fetching. Claude Code/Fable/Opus development attribution is Daniel's account.

Verification: full lint, typecheck, all 391 tests in 15 files, and production build passed.
Browser checked the production page at 1440px and 390px; no horizontal overflow at phone width.
Rendered content includes all named tools and the corrections link. Temporary browser tab closed.

## Research supporting item 3

Item 3 research (2026-10-05):
- GitHub repository is PUBLIC and issues are enabled (verified with `gh repo view`).
  Recommended correction channel: `https://github.com/RavBogard/israelielection/issues`.
- IDI's [own description](https://en.idi.org.il/about/about-idi/) is nonpartisan and committed
  to strengthening Israeli democracy. Peace Now's [own mission](https://peacenow.org.il/en/about-us)
  is advocacy for a two-state agreement and against settlement expansion. Attribute these
  stated perspectives rather than assigning unsourced ideological labels.
- [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) permits sharing/adaptation
  for noncommercial use with credit, a license link and indication of changes. Existing
  approval covers teaching materials; do not imply the entire repository has that license.
- Average: latest campaign poll per publisher within 14 days of the newest; sqrt(sample size)
  weights, median-known-size fallback; passing-only per-list average; lists passing fewer than
  half the reporting polls excluded from default coalition totals; scale down totals above 120.
- [IPF's pollster review](https://israelpolicyforum.org/2026/08/20/israeli-election-polls-pollsters/)
  describes Direct Polls as Filber's former firm, not necessarily currently his. About draft
  names the two excluded publishers instead of repeating the imprecise “Filber's firms” claim.
  Any correction to that existing note needs direct-source verification; values remain unchanged.
- Handoff says About is built, but no `app/about` route was present in the inspected design
  checkout. Add it after the copy is settled, using the existing article styling.

## Remaining decisions

Item 4 resolved: Daniel selected “Use the proposed wording (recommended)” for writing block
82417 in the pop-up. Applied that exact Voice paragraph in both checkouts' `docs/00-PLAN.md`
and updated both HANDOFF.md copies. This records existing rulings 114–118, not a new public slogan.

Item 5 research: one Session 1 deck is actually distributed (PowerPoint/PDF plus cover), with
class date 2026-10-06. No published source sheets, teacher guides, discussion questions or Jewish-texts
route were found. `/teach` currently promises decks; embeds and linked reference pages are available.
The plan already requires individual Daniel approval before publishing Jewish-text materials and
leaves timing to him. Recommend preserving that approval process with no announced release date.
The session is labelled “taught” before its future class date; correct the label without asserting
the session has happened when finalizing the teaching copy.

Item 5a resolved: Daniel answered “a” in chat on 2026-10-05: teaching materials added as ready,
with no public deadline. Updated Dates in both plans and item 5 in both handoffs.
Pop-ups did not appear for Daniel; use one question at a time directly in chat going forward.

Item 5b resolved: Daniel chose “b” on 2026-10-05: downloadable class sheets only, individually
approved before publication. He clarified that traditional Jewish texts will not be a major
part of the site. Updated both plans/hand-offs to remove the separate `/teach/texts` section
and promised text series. Design homepage/teaching copy describes available resources and
additions as ready; removed “taught” from the upcoming session's date label.

Item 6 research: `opp` groups Yashar!, B'Yachad, The Democrats, Yisrael Beiteinu and Blue & White
(the latter below threshold in all recent polls). Ra'am/Joint List are grouped separately, and
Reservists–Economic is between the blocs. Ruling 112 supplies “Jewish-majority lists” as house
language. IPF's polling review uses opposition excluding Arab-led parties for bloc comparisons;
the label must make that scope clear and avoid implying Ra'am/Joint List are not opposition.
Recommendation: “Jewish-majority opposition,” with the grouping defined in the glossary.

Item 6 resolved: Daniel chose “c”: “Anti-Netanyahu bloc (Jewish-majority parties)”. Applied in
both checkouts' shared party data, glossary, source explanations and warning text; clarified
ruling 112. Kept bloc membership, arithmetic, and internal rule ids unchanged. Warnings name only
selected parties with recorded pledges. The first glossary check failed its 400-character limit;
shortened the definition while retaining its sourced 2022 example and grouping explanation.
Then all 395 tests in 16 files passed, scoped lint passed, and the production build/TypeScript
passed. Phone checks: home, builder, polls and Party Map had no horizontal overflow. Full label
is visible in the home/Party Map legends; compact treemap headings retain existing truncation.
Generated share card displays the full label and seat total without overlap.

Item 7 resolved: Daniel answered “i dont care” to the address choice. Keep the implemented
`/coalition-builder`; the existing `/coalition` redirect preserves query parameters. No code
change needed. Verified the redirect returned HTTP 308 in the previous focused check.

Item 8 research: both checkouts load Google Analytics property `G-DB53C0NZHB` only when
`VERCEL_ENV` is `production`. The installed component initializes GA with its default config.
Targeted source searches found no privacy notice or consent control. The GA property's remote
sharing/advertising settings have not been inspected. Do not promise anonymous tracking or
absence of advertising data sharing on that evidence. About currently exists in the design
checkout, not the main checkout.

Google's Privacy Disclosures Policy requires disclosure of GA and how it processes data;
the US terms section 7 requires a posted privacy policy explaining cookies or similar technology.
Default collection includes visits/session statistics, browser/device data and approximate
location; GA4 uses first-party cookies. Proposed footer: “This site uses Google Analytics to
understand visits and page use. Privacy.” Link Privacy to an About section explaining those
categories and linking Google's data handling and opt-out information. Daniel approved this
wording and linked explanation on 2026-10-05. It does not resolve consent behavior or validate
remote account settings. Implementation belongs to the coders; no application files edited here.
Sources checked 2026-10-05:
- https://support.google.com/analytics/answer/7318509
- https://marketingplatform.google.com/about/analytics/terms/us/
- https://support.google.com/analytics/answer/11593727
- https://support.google.com/analytics/answer/11397207

Item 8 implementation copy, within Daniel's approved scope:
- Footer: “This site uses Google Analytics to understand visits and page use. Privacy.”
- Link Privacy to `/about#privacy`; add a Privacy section to About:
  “This site uses Google Analytics to understand visits and page use. Google Analytics uses
  cookies and collects information about page visits, browsers and devices, and approximate
  location. Read [how Google collects and processes this information](https://support.google.com/analytics/answer/6004245).
  Google also offers an [Analytics opt-out browser add-on](https://tools.google.com/dlpage/gaoptout)
  for supported browsers.”
- Check the footer link and section on desktop and phone after integration. Do not claim
  there is a site consent control or that data are anonymous without verifying those features.

Item 9 research: current bare “far-right” mentions are in the Haredim and settlers pages,
describing the Religious Zionism–Otzma Yehudit electoral list. IDI's party profiles explicitly
place both Otzma Yehudit and the Religious Zionist Party on the far right. The latter profile
also identifies Noam as extreme right-wing and distinguishes the 2021/2022 electoral alliance
from the Religious Zionist Party and wider community. Daniel approved the following rule on
2026-10-05; implementation belongs to the content coder:
“Use ‘far-right’ in the site's voice for Otzma Yehudit and the Religious Zionist Party, and for
their 2021/2022 joint electoral lists. Cite the classification at its first substantive use on
each page; repeated uses need not reattribute it. Name the party or list so it is unambiguous.
Do not apply the label to Haredim, settlers, religious Zionists as a community, or coalition
allies without separate supporting evidence.”
Sources checked 2026-10-05:
- https://en.idi.org.il/israeli-elections-and-parties/parties/otzma-yehudit/
- https://en.idi.org.il/israeli-elections-and-parties/parties/religious-zionist-party/

Item 10 inspection: compared the design checkout's PDF and PowerPoint and visually checked
PDF pages 8, 26, 27, 28 and 30. Confirmed stale PDF wording: “inside the territories” (8),
“Arab-led” grouping labels (26–28), and “the Arab lists” in the event heading (30). PowerPoint
already replaces these with the occupied West Bank and the Joint List/Ra'am names. The
PowerPoint still uses “Zionist opposition” on slides 21–24 and 28, so a fresh export alone
would retain a label superseded by Daniel's item 6 approval. PDF has 31 pages; producer metadata
is pypdf. Did not verify the handoff's proposed font/glyph explanation as the cause.

Item 10 correction task for the content coder: update the editable source and PowerPoint
slides 21–24 and 28 to “Anti-Netanyahu bloc (Jewish-majority parties)”, retaining the existing
seat figures and dated poll basis. Export a fresh 31-page PDF from that corrected source using
the deck fonts; preserve speaker notes in the PowerPoint. Visually inspect every exported page,
especially the longer headings and pages 8, 21–24, 26–28 and 30. Check the PDF and PowerPoint
agree on the approved labels. Preserve descriptive source wording and direct quotations where
the existing rulings allow them. This applies already-approved wording, not a new editorial
choice. No deck binaries changed by Codex while concurrent ownership is unsettled.

Item 11 research completed 2026-10-05; no new editorial ruling required:

1. Israeli toll: directly verified the Defense Ministry's dated 2026-10-04 release giving
   1,318 personnel added to the official fallen roll since 2023-10-07. Includes police, Shin Bet,
   prison/fire services, security coordinators and local security squads, not just IDF soldiers.
   Primary citation: https://www.mod.gov.il/כתבות-ומבזקים/חדשות-משרד-הביטחון/שלוש-שנים-למלחמת-התקומה
   JNS's 2026-10-04 report corroborates the separately reported National Insurance Institute
   count of 1,029 civilians killed in terrorist attacks, including foreign nationals, excluding
   security personnel/local response squads. A direct NII release was not located in focused
   English/Hebrew searches. Use explicit secondary attribution for that count; do not represent
   JNS as an independent casualty tally. Arutz Sheva's article says 778 killed on October 7 and
   252 subsequently (summing to 1,030); JNS says 778 + 251 = 1,029. Do not reproduce Arutz Sheva's
   inconsistent breakdown. Both cumulative totals already include October 7, not additions to it.
   Corroborating report: https://www.jns.org/news/israel-news/israel-marks-1-318-slain-security-personnel-since-oct-7
   Suggested replacement for the second sentence of the Israel toll paragraph:
   “On October 4, 2026, the Defense Ministry reported that 1,318 security personnel had been
   added to its official fallen roll since October 7, 2023. Separately, the National Insurance
   Institute reported 1,029 civilians killed in terrorist attacks over that period, according
   to JNS's October 4 report. These cumulative counts include October 7 itself.” Link each
   attribution to its corresponding source; retain the preceding sourced attack/hostage count.

2. Outposts: the handoff's missing Sasson citation is stale. In both current checkouts the
   glossary now explicitly attributes its definition to Peace Now and links its 2009-06-01 page.
   Verified the quoted definition and source date directly:
   https://peacenow.org.il/en/west-bank-settlements-facts-and-figures
   No correction required for that existing entry; the page's historic counts should not be
   imported as current figures. A UN-hosted copy of the Prime Minister's Office's Sasson summary
   is available in search-index text, but direct opening returned 403. It distinguishes local-law
   authorization from international-law legality. Do not describe it as a UN-authored report.
   https://www.un.org/unispal/document/auto-insert-203215/

3. Religious Zionism/Zehut: already clarified in current parties.json and glossary. The party
   card names the joint list, the separate leaders, their 2026-09-01 technical alliance, and their
   ability to separate afterward. IDI confirms they run a joint list in 2026, and Times of Israel's
   September 1 report quotes the announcement. Preserve two separate parties on one electoral
   list; no merged-party claim, duplicate coalition seats or new arithmetic required.
   https://en.idi.org.il/israeli-elections-and-parties/parties/religious-zionist-party/
   https://www.timesofisrael.com/liveblog_entry/smotrich-feiglin-confirm-joint-run-for-elections-urge-other-right-wing-parties-to-join/

All user-facing editorial choices in the handoff are now recorded. Pending implementation:
analytics footer/About Privacy section; sourced far-right usage and public ruling; synchronized
PowerPoint/PDF; primary/secondary casualty citations and scope. Reconcile current files with
this record before editing; two sourcing issues were already corrected concurrently. Final
integration and post-change checks remain with the assigned coders.

## Integration context and next action

Daniel confirmed two Claude coders are working concurrently on 2026-10-05. Several approved
design changes have since been incorporated into their commits; the main checkout still has
shared uncommitted changes, including unrelated teaching/scenario work. Preserve all of it.
Until implementation ownership is clear, Codex will write only this decision record and continue
research and decision gathering. Ask the coders to identify their checkouts, owned files, and
integration owner before further application/data/test edits.

Next: Daniel relays this decision record to the coders. They should agree ownership, apply
remaining changes, update both handoffs/plans and verify the integrated result. Codex can
review the completed changes after their ownership/integration status is supplied.

## Follow-up: coalition cohesion and party comparison (assessment, not an approved build)

Daniel asks whether the site explains the difficulty of an anti-Netanyahu government and
offers useful comparisons of party ideology/positions. Live pages inspected 2026-10-05:
`/compare` already supports 2–4 parties across seven issues, with shareable selections.
It is in the footer/home index, outside the main navigation. Six axes use party-profile
snippets with mostly plain-text source labels; Palestinian-state cells have structured links.
The cells can address different policy questions (e.g. food prices versus conscript pay).
`/teach` has coalition scenarios, including opposition partner exclusions; the builder itself
explains seats and recorded pledges, without a synthesis of governing agreements/disagreements.
Live test: the four main Jewish-majority opposition lists yielded 48.9 seats in the average;
adding Joint List/Ra'am yielded 61.4 and pledge warnings. These are a dated snapshot, not fixed
figures to hard-code. Neither state explained the policy compromises needed to govern.

Recommendation: make “Can they govern together?” a core part of the builder, showing shared
agenda, substantive fault lines, partner refusals/conditions and dependence on each partner.
Distinguish government membership from outside parliamentary support. Do not assign an
unsupported numerical stability score or predict inevitable collapse. Apply the same framework
to all combinations, including Netanyahu's bloc. The core opposition does have policy overlap:
Yashar/B'Yachad both seek repeal of the judicial appointments law, for example. Wider agreement
on conscription still masks differences in exemptions/enforcement. “No common ideology except
anti-Netanyahu” is too absolute; distinguish the core lists from partners needed for a majority.

Improve the existing comparison: prominent navigation and builder entry; presets (including
the four core opposition lists); concise answers to identical policy questions; expandable
evidence with direct links/dates; explicit unknown/refused-to-answer states. Add a comparison
for the selected coalition that can accommodate more than four parties. Explain ideological
dimensions using sourced policy positions rather than one left/right score. Acceptance: a new
reader can identify both one shared policy and two real disagreements, and explain how adding
a needed partner changes governability. No application files changed for this assessment.

Evidence for the political framing:
- Party answers on judicial policy: https://www.ynetnews.com/article/hkcjtk1cme
- West Bank party answers: https://www.ynetnews.com/article/h1dpvu9cgl
- Sept 27 analysis of agreement/remaining partner and leadership disputes:
  https://www.jpost.com/israel-news/article-909892
- May 27 reporting distinguishes Golan's undated willingness-to-sit clip from his subsequent
  exclusion of Haredi parties; do not present the older clip as his uncontested current pledge:
  https://www.timesofisrael.com/opposition-party-leaders-spar-over-potential-inclusion-of-haredim-in-future-coalition/

## Feature-gap review update — October 5, 2026

The comparison assessment above is historical: the Claude coders have since shipped prominent
comparison navigation, any-set selections, presets, sourced policy strips, builder integration,
agreement/split summaries and partner dependence. Daniel asked for a full feature-gap analysis
and then said this comparison work was ready to review. The current assessment and proposed
priorities are in [FEATURE-GAPS.md](FEATURE-GAPS.md): 5 substantial additions, 10 medium
additions and 16 small changes. These are proposals, not build approvals. Targeted existing
comparison/cohesion tests passed (20 tests). No application files changed. Main findings:
overlapping policy categories can overstate disagreement, missing positions can still count
as agreement, and the 61-vote confidence wording needs correction. Next: choose a first
package and coordinate file ownership before implementation.
