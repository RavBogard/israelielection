# Product feature-gap assessment — October 5, 2026

Status: recommendations for Daniel's review, not an implementation plan or approval to build. Includes the comparison/cohesion work after Daniel said it was ready for review. No application files changed. Two Claude coders retain ownership of their implementation work.

## Judgment

The site has a strong reference library and a substantial set of interactive tools. Its largest opportunity is to connect those tools into explanations: help a newcomer get oriented, help a reader distinguish an arithmetic majority from a governing arrangement, and help a returning reader understand what changed and how certain it is.

Recommend **5 substantial additions, 10 medium additions and 16 small changes**. These are ceilings-informed choices, not a request to build 31 things before the election. Priorities below distinguish immediate correctness work from extensions worth planning. Several small fixes support larger additions; do not count their effort twice.

## Scope and evidence

Reviewed the live homepage, party map, comparison, coalition builder, polls, news, election results preparation, government tracker, teaching resources, historical vote map, timeline, glossary, and the how-it-works/issues/communities entry journeys. Inspected targeted implementation and data for those features, including article navigation, About, positions, polling, results fetching, and map behavior. This is a feature and comprehension audit, not a line-by-line fact check of every article or a complete accessibility/security audit.

Local code snapshot: `40a06e7`. The live site and repository changed during the review. Comparison observations below supersede the earlier comparison assessment in `DECISIONS.md`. Recheck the snapshot before implementing a recommendation.

Browser checks included the homepage at 390 CSS pixels, polls and comparison/builder at 320. The sampled pages did not show document-wide horizontal overflow. The poll tables correctly retain horizontal scrolling; this is not itself an accessibility failure. The map initially showed a loading state and subsequently loaded successfully. Do not report that initial state as a broken map.

Existing comparison/cohesion tests: **20 passed across 2 files**, using the local Vitest runner. Passing these tests establishes the tested mechanics, not the editorial validity of every policy category. No new code tests or production changes were made.

### Features already present — preserve and extend

| Reader job | Existing capability | Remaining opportunity |
|---|---|---|
| Understand the race | Homepage seat picture, bloc explanations, introductory links | A short, coherent learning path |
| Understand parties | Profiles, party map, sourced positions | Party/list lineage, complete ballot directory, better search |
| Compare positions | Prominent navigation, presets, any-set selection, shared questions, expandable evidence | More defensible policy categories and clearer evidentiary limits |
| Build a government | Poll selection, seat totals, pledge warnings, new agreement/split panel and partner dependence | Outside support, abstention, governing compromises and leadership arrangements |
| Read polling | Individual polls, current average, trend charts, pass counts, alternate exclusion average | Coalition sensitivity across polls and assumptions; easier exploration |
| Follow developments | Headlines, dated daily briefings, source links and automated-publication disclosure | Material changes tied to the relevant facts and tools |
| Follow election night | Results page, count parser, exit-poll/count separation, scheduled refresh and error state | Last-known-good results, explicit completeness and changes since refresh |
| Follow government formation | Legal clock, milestones and outgoing-government history | Negotiation substance, beyond statutory deadlines |
| Learn political history | 1977–2026 timeline; five-election locality vote map | Party lineage and a locality's history in one view |
| Teach | Downloadable deck/PDF, four scenarios and three embeds | Standalone learner sheets, facilitator notes and accessible exports |
| Check terms and sources | Glossary, article sources, About/method, GitHub corrections | In-context definitions, easier correction reporting and visible correction history |

Do not propose another basic comparison page, poll-trend chart, timeline, coalition scenario collection, RSS feed, map town search, government clock, or teaching deck as if missing. These already exist. The signed introductory note is now on About; its absence from the shortened homepage is not evidence that it was lost.

## Review of the completed comparison and coalition-cohesion work

**Verdict:** a meaningful improvement that directly addresses Daniel's original concern. The four-core-opposition preset now shows common positions on the draft and October 7 inquiry, and differences on the other five categories. The builder carries that assessment into the selected coalition. It also shows recorded partner pledges and whether removing a party loses a numerical majority. Source expansions and shareable selections are useful foundations.

It should not yet be read as a reliable measure of ideological distance or governing stability. Three issues deserve priority:

1. **Some buckets overlap rather than oppose each other.** In `data/positions/courts.json`, “Write the rules into Basic Laws” and “Keep the courts independent” can both be true. Their placement in separate columns is not by itself evidence of incompatible goals. In the economy file, free-market methods, lowering living costs and rewarding military service are different kinds of propositions, and can coexist. Broad statements about cost of living also do not establish agreement on taxation, spending or regulation. Use comparable policy subquestions; distinguish shared objectives from disputed means. This is M1.
2. **Missing evidence can still produce an agreement verdict.** `lib/cohesion.ts` treats a single populated stance group as `agree`, even if other selected parties have no stance. The detailed sentence appends a missing-position caveat, but `components/Governing.tsx` counts that issue in the top-level “Agree on…” summary. A known answer from one party cannot demonstrate agreement between parties. Report coverage explicitly and reserve full agreement for complete evidence. This is Q4.
3. **A count of matching categories can look like a stability score.** “Agree on two issues, split on five” gives equal weight to seven editorially chosen categories. Differences in emphasis, genuine policy conflicts and firm conditions for joining a government require different treatment. Preserve the useful rows, but qualify the summary and explain what can be negotiated. This is Q5 and the larger S1 extension.

The current seven axes also leave Gaza/war policy outside the comparison: the former war axis now asks specifically about the October 7 inquiry. That inquiry matters, but cannot stand in for policy on Gaza, hostages, security arrangements or diplomacy. Any additions should use sourced, date-specific questions rather than one broad “security” label.

On Daniel's initial premise: the useful question is **where shared anti-Netanyahu goals stop being enough to sustain a particular governing arrangement**. The site should show actual overlap as well as conflict. “Almost no ideological overlap” is too absolute for the core parties, and “inherently unstable” turns a risk into a predetermined conclusion. Apply the same analysis to Netanyahu-led combinations.

## Five substantial additions

“Substantial” means a new reader workflow with a meaningful data/editorial model, not just another route. Order reflects suggested product priority, not a deadline commitment.

### S1. From coalition arithmetic to a governing arrangement

Extend the existing builder and cohesion panel into a guided explanation of how the selected parties could govern. Give each party a role: cabinet member, outside supporter, opposition, or hypothetical abstainer. Separate seat majority, confidence support, recorded refusals and substantive policy conflict. Offer a small set of researched scenarios showing shared agenda, leadership/rotation questions, negotiable differences and explicit red lines. Show how adding a needed partner changes those constraints.

**Why:** this completes the user's central learning objective; the newly shipped agreement rows are the foundation. The formation clock answers when, not what bargain would be required.

**Acceptance:** a reader can explain why a combination has enough seats, what cooperation it still needs, and two concrete compromises or obstacles. Hypothetical choices are clearly separated from recorded commitments. No invented stability probability. Correct the confidence-vote wording first (Q1); revise policy categories first (M1).

**Timing:** highest-value substantial extension, but begin with two or three editorially researched scenarios rather than an exhaustive negotiation engine.

### S2. A guided first visit

Create short routes for “I have five minutes,” “Help me understand the parties,” and “I'm leading a discussion.” Reuse existing articles and tools in a purposeful sequence: who votes → how votes become seats → parties and disagreements → possible governments. Use a few optional comprehension checks and a clear next step. Let visitors leave or skip freely.

**Why:** the content is plentiful; the reader currently has to assemble the curriculum. Homepage entry links and four teaching scenarios are helpful but do not form a complete journey.

**Acceptance:** a newcomer can complete a short route and explain the threshold, the difference between party and bloc, and why the largest party may not form the government. Validate with several readers unfamiliar with Israeli elections.

**Timing:** pre-election priority; primarily an integration and editorial investment.

### S3. A polling uncertainty workbench

For a chosen coalition or bloc, show its total in each current poll, the range across pollsters, threshold dependencies and sensitivity to transparent inclusion/weighting choices. Reuse the existing trend charts, alternate average and threshold experiment. Label “a majority in X of Y polls” as a description of that sample, never as a chance of winning. Explain why a one-seat movement or fractional average is not a forecast.

**Why:** the current default produces a precise-looking total from threshold-conditioned averages, with proportional normalization to 120. Readers need to see the conclusions that survive changes in inputs, not just the headline number.

**Acceptance:** a reader can identify which small party or polling assumption changes the majority, see every input and reproduce the comparison. No vote-share uncertainty or confidence interval is inferred from seat estimates alone.

**Timing:** valuable before the election; requires an explicit methodology review and careful explanatory copy.

### S4. “What changed since my last visit?”

Build an editorial change feed connecting a new poll, changed pledge, court ruling, list change or corrected factual claim to its consequence for the relevant page/tool. Each entry should say what changed, previous versus current state, effective date, evidence and why it matters. Offer topic filters and optional local bookmarks; no account required for the first version.

**Why:** a chronological headline feed and daily digest help people read news, but do not reliably explain what changed in the site's model of the election.

**Acceptance:** a returning reader can identify the three material developments in a chosen period, follow the evidence, and open the affected tool. Updated claims supersede earlier ones visibly; duplicated reporting does not masquerade as multiple developments.

**Timing:** start with a small human-reviewed feed. Do not automate consequential interpretations merely because a headline mentions a party.

### S5. A party family tree connected to political history

Let readers trace a current electoral list back through mergers, splits, previous names, leaders and participation in governments. Connect it to the existing timeline and historical vote map. Keep a leader's movement, a legal party, an electoral alliance and a parliamentary faction distinct.

**Why:** current profiles and a general timeline do not give a newcomer a compact answer to “Where did this party come from?” Historical results are otherwise easy to misread when names, letters and alliances change.

**Acceptance:** a reader can trace one current alliance to its constituent parties and understand why its historical vote share cannot simply be compared with today's list. Provide a readable chronology/table alongside the diagram.

**Timing:** durable post-election value; defer until the immediate accuracy and orientation work is sound.

## Ten medium additions

| ID / priority | Addition | Concrete scope and completion check |
|---|---|---|
| **M1 — first** | Refine policy comparison into comparable subquestions | Separate outcomes from mechanisms: appointments/override/review for courts; tax/spending/competition for economics; distinct religion-and-state policies. Add dated Gaza/security questions where evidence permits. Label compatible differences, opposed policies and insufficient evidence separately. A reviewer must be able to justify each classification from the displayed evidence. |
| **M2 — next** | Site-wide search with aliases | Search parties, leaders, issues, glossary and articles; recognize common transliterations, Hebrew names and former names. A search for a leader or old party name should reach the current relevant entry without requiring the user to know its category. |
| **M3 — next** | A usable poll browser | Filter by dates, pollster and parties; open a compact method card showing fieldwork dates, sample/population/mode where known, original source and inclusion status. Explicitly mark missing metadata. Existing tables remain available. |
| **M4 — later** | A town's voting history in one view | Add a locality detail view showing turnout and results across the five existing elections, with election-specific lists and alliance-change warnings. Do not infer individual voter switching from aggregate changes. Reuse the map's existing town search and data. |
| **M5 — next** | Ready-to-use lesson packets | Adapt the existing teaching scenarios into short learner sheets plus facilitator notes, source lists, suggested timing and discussion prompts. Supply accessible HTML and printable files. Respect the approved occasional-resource approach: no promised release calendar or traditional Jewish texts series. |
| **M6 — next** | A visual guide to voting rights and political reach | Connect existing explanatory material into a clear citizenship/residency/geography guide: who can vote in this Knesset election and who is affected without a vote. Date and source distinctions; do not collapse all Palestinians or all residents into one legal category. A reader should correctly distinguish national and municipal voting eligibility. |
| **M7 — later** | A complete ballot directory | Add a compact directory of all officially approved lists, letters, leaders and status, linked to full profiles where available. Explain why the main interactive tracks fewer lists. Verify against the final official list; do not fabricate full position profiles for minor lists. |
| **M8 — before election night** | Resilient live-results presentation | Preserve last-known-good data with a conspicuous stale label if fetching fails; separate source-update time from fetch time; explain count completeness and special-envelope votes; show changes since the prior snapshot. Rehearse partial, failed and corrected feeds. The results page already exists—this is an extension. |
| **M9 — next** | A public corrections and verification register | Record substantive corrections with date, changed claim and supporting evidence. Distinguish automated source checks from human factual review. Make it possible to report a correction without a GitHub account, with appropriate spam protection and a named review owner. Extend the existing About disclosure instead of duplicating it. |
| **M10 — later** | Reusable, sourced exports | Add clean print/export views for an issue, selected coalition or locality: title, selected assumptions, data-as-of date, source links and required attribution. Build on existing decks/embeds; do not assume all third-party graphics share the teaching-material license. Verify that exported numbers and source dates match the view. |

## Sixteen small changes

“Small” describes a bounded change, not low importance. Q1–Q6 address misleading interpretations and should precede major new features.

| ID | Change | Why / acceptance |
|---|---|---|
| **Q1** | Correct the universal “61 to win confidence” wording | Builder and results currently present 61 as an unconditional legal requirement. Explain that 61 is an absolute seat majority and that confidence-vote rules differ; a government was confirmed 60–59 in 2021. Verify the current applicable legal rules before adding outside-support mechanics. Keep the familiar 61-seat planning target accurately labeled. |
| **Q2** | Replace “votes are shared out” for failed lists | Results uses this wording even though its method section correctly says votes are not transferred. Say the seats are allocated among lists that pass; votes for failed lists yield no seats. Align pre-count and live-count wording. |
| **Q3** | Make unconfirmed surplus agreements unmistakable | Current seat estimates use both signed and merely reported/expected agreements. Before election night, reconcile against filed agreements; while unresolved, clearly label provisional seat estimates and show the assumption. Never present an expected agreement as confirmed. |
| **Q4** | Stop counting incomplete evidence as coalition-wide agreement | If only one selected party has a recorded stance, say so. Show “recorded positions align; N missing” when appropriate. The aggregate summary must preserve the same limitation as each row. |
| **Q5** | Qualify the agreement/split headline | Explain that these are classifications of recorded answers on selected questions, not a forecast or seven equally weighted governing obstacles. Use “shared recorded position” and “different recorded positions” until stronger classifications are justified. |
| **Q6** | Expose evidence age/type before expansion | Show whether a classification rests on a current answer, an older vote, a party charter or secondary description, with its actual evidence date. “Accessed October” must not look like “adopted in October.” |
| **Q7** | Add an issue jump bar to comparison | Seven long sections, especially on mobile, need direct topic links. Keep the current party selection when jumping; the destination heading must be visible. |
| **Q8** | Offer “show only occupied positions” in comparison | Empty categories create a long mobile page. Default or optional compact view should keep missing-evidence groups visible and allow restoring the full category set. |
| **Q9** | Put selected map state in the URL | Share election, list and locality, with a clear copy-link action. Existing town search is useful but a link should reopen the same historical observation. |
| **Q10** | Add an on-page contents list to long articles | Existing article rails link to sibling pages, not sections within the current article. A short contents list helps readers find the answer they came for. |
| **Q11** | Add a glossary filter | The glossary already has alphabetical navigation. A small name/alias filter lets readers find an unfamiliar term without scanning 69 entries. |
| **Q12** | Keep poll-row identity visible while scrolling | Pin the date/pollster identification in wide poll tables and provide an obvious scroll cue. Test at narrow width; do not shrink every column into unreadable text. |
| **Q13** | Label raw versus normalized averages next to numbers | The explanation exists in prose, but different figures on polls versus builder/home can look inconsistent. Put a concise label and method link beside each relevant average. |
| **Q14** | Collapse duplicate/syndicated headlines | The live feed showed overlapping outlet coverage including syndication. Group exact/syndicated duplicates while preserving source links and genuinely different reporting. |
| **Q15** | Mark known paywalls and original-source language | Add conservative, maintained labels where known; uncertain access stays unlabeled. Readers should understand why a cited source may not open in full or in English. |
| **Q16** | Put a correction link beside page sources | Prefill the page URL and invite the specific claim plus evidence. Surface the existing correction process where a reader encounters an error; pair with M9's account-free option when available. |

## Recommended sequence

1. **Accuracy and interpretation:** Q1–Q6, plus M1. Have the comparison coders review these findings before adding more axes or a visual distance score.
2. **Make the existing site easier to learn and use:** S2, M2, Q7–Q13, then M5. This is the strongest near-term usability package.
3. **Explain consequential uncertainty:** build a bounded S1 scenario set and S3 using the existing builder/poll data. Define the editorial model before adding controls.
4. **Prepare the live service:** M8, M9 and Q14–Q16; then the minimum reviewed version of S4.
5. **Extend durable reference value:** S5, M4, M6, M7 and M10 as capacity allows. M6 can move earlier if Daniel prioritizes the voting-rights framing.

Avoid adding an opaque “which party are you?” quiz, a numerical coalition-stability score, a broad unsupervised political chatbot, or accounts merely to save a selection. None is needed to solve the observed gaps, and each introduces substantial interpretive or maintenance costs.

## Research supporting these recommendations

- [Knesset: the 36th government confirmed 60–59, June 2021](https://main.knesset.gov.il/EN/News/PressReleases/Pages/press14621d.aspx). Direct counterexample to an unconditional 61-vote confidence claim; a full current legal model still requires separate verification.
- [AAPOR: best practices for survey research](https://aapor.org/standards-and-ethics/best-practices/) and [polling accuracy](https://aapor.org/polling-accuracy/). Support transparent methods and careful uncertainty language; they do not validate this site's particular weighting model or supply an Israeli seat forecast.
- [W3C: complex images](https://www.w3.org/WAI/tutorials/images/complex/). Supports accompanying charts/diagrams with an explanation and accessible detail. Existing map tables and text are useful foundations.
- [W3C: reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Supports narrow-width reading while allowing appropriate exceptions for inherently two-dimensional content such as data tables and maps.
- [Ynet party answers on courts](https://www.ynetnews.com/article/hkcjtk1cme) and [the West Bank](https://www.ynetnews.com/article/h1dpvu9cgl). Relevant to the distinction between overlapping goals, differing mechanisms and genuine disagreements. The comparison review above primarily evaluates how the site's own cited text supports its assigned categories; it is not a fresh verification of every party position.

## Return note

Completed: live feature inventory, targeted implementation review, sampled mobile checks, completed comparison/cohesion assessment, external methodology/accessibility research and passing existing comparison/cohesion tests. Deliverable: this proposal document. Application/data files untouched; no commits, deployment or messages to the Claude coders.

Next: Daniel chooses a first package. Recommended package is the accuracy/interpretation items followed by the guided first-visit work. Confirm file ownership with the existing coders before any shared application edits. Review against the latest code if their work changes after this snapshot.
