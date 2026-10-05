# Approved feature expansion — working state

## Authorization and ownership

Daniel approved every recommendation in FEATURE-GAPS.md on October 5, 2026, then authorized Sol subagents to research and implement all of them. Codex's primary agent directs scope, reviews outcomes and makes integration decisions; only Sol workers write implementation code. Daniel subsequently confirmed the Claude coders are finished.

Worktree: `C:/Users/dsbog/.codex/worktrees/feature-expansion/israelielection`.
Branch: `codex/feature-expansion`, starting at `40a06e7`.
The original main/design checkouts and unrelated outreach files remain untouched.

The assessment's earlier proposal-only/ownership statements are historical. This note records the subsequent approval. Scope is implementation and verification; no production push/deployment has yet been performed. Preserve signed copy and existing source/terminology rulings. Do not fabricate unavailable political data, quotes, contact addresses or credentials.

## Delivery sequence

1. Sol research briefs: political/legal/data evidence and product/method/architecture.
2. Correctness and interpretation; discovery and guided learning.
3. Governing arrangements, polling sensitivity and live-service reliability.
4. Historical/rights/ballot reference features, map history, teaching and sourced exports.
5. Integrated verification, independent review, desktop/mobile checks and final return note.

File ownership is assigned per worker batch. Shared navigation, schemas and cross-feature changes require coordination with the current owner. Workers must not reset or revert each other's work. Root performs no implementation edits.

## Acceptance ledger

| Item | Approved scope | State |
|---|---|---|
| S1 | Governing arrangements and support roles | Implemented; share/reload/mobile/production checks passed |
| S2 | Guided first visit | Implemented; developer walkthrough passed; reader study not performed |
| S3 | Polling uncertainty workbench | Implemented; interaction/mobile/share checks passed |
| S4 | Material change feed | Implemented; filters/bookmarks/mobile reviewed; automated source review labeled |
| S5 | Party family tree/history | Implemented; mobile/filter review passed |
| M1 | Comparable policy subquestions | Implemented; evidence gaps and comparability reviewed/tested |
| M2 | Search with aliases | Implemented; reviewed and revised |
| M3 | Poll browser and methodology cards | Implemented; mobile containment checked |
| M4 | Locality voting history | Implemented; Haifa five-election values, history and URL checks passed |
| M5 | Learner/facilitator packets | Four PDFs and HTML implemented; visual check passed |
| M6 | Visual voting-rights guide | Implemented; six legal-status distinctions reviewed |
| M7 | Complete verified ballot directory | All 38 official published entries implemented; nonfinal status explicit |
| M8 | Resilient live results | Implemented; fixture failures/rotation tests and cross-review passed |
| M9 | Corrections/verification register and account-free reporting | Implemented; approved media/corrections address and draft details verified |
| M10 | Sourced print/export views | Three HTML/CSV exports implemented; values/source links checked |
| Q1 | Confidence-vote wording | Implemented, including OG/embed consistency |
| Q2 | Failed-list vote wording | Implemented; reviewed |
| Q3 | Surplus-agreement confirmation | Expected/unsigned excluded; signed reports labeled provisional |
| Q4 | Incomplete evidence versus agreement | Implemented; tested |
| Q5 | Qualify category counts | Implemented; reviewed |
| Q6 | Evidence age/type | Implemented; conservative provenance labels reviewed |
| Q7 | Comparison topic jumps | Implemented; mobile reviewed |
| Q8 | Compact comparison | Implemented; mobile reviewed |
| Q9 | Share map state | Implemented; selected locality/list/election and back navigation checked |
| Q10 | Article contents | Implemented; anchors checked |
| Q11 | Glossary filter | Implemented; tested |
| Q12 | Poll table row identity | Implemented; narrow sticky identity checked |
| Q13 | Raw/normalized labels | Implemented; wording reviewed |
| Q14 | Headline deduplication | Implemented; conservative URL/title grouping and 36-hour bounds tested |
| Q15 | Known source access/language labels | Implemented; maintained conservative evidence-backed rules |
| Q16 | Contextual correction links | Implemented; contextual URL checked |

## Verification requirements

Each batch: focused meaningful checks for changed logic, verified source/data links, and clear empty/unknown states. Integration: repository CI gates (lint, tests, build, typecheck), internal-link checks, representative desktop/mobile and keyboard journeys, printable/download checks, and results-feed failure/partial-data rehearsal. Record material limitations explicitly; unavailable evidence is not a completed feature.

## Current return note

### Approved homepage simplification — October 5

Daniel found the multicolor homepage mosaic confusing on mobile and approved replacing it with four directly labeled majority bars and expandable party lists. Product Sol implemented app/page.tsx, components/HomeRace.tsx, components/home.css and the small lib/home-race model/test. The homepage now uses independent neutral bars on one zero-based scale (0–70 for the current figures, expanding if necessary), a 61-seat marker, full approved group names and exact fractional gaps: 54.5 means 6.5 short, not 6. Each native disclosure reveals named party rows, existing party colors, estimates/status and links to the selected Party Map panel. Missing and combined estimates remain distinct from zero; the current normalized model remains the same. Long source details follow the chart on mobile, with explicit Party Map/Builder links and the grouping/agreement distinction. This supersedes the earlier homepage mosaic design; the interactive seat grids elsewhere remain in place.

Verification: **532 tests across 45 files, full lint without warnings, production build and TypeScript pass**. Four focused tests cover fractional gaps, expanding shared scale, missing/threshold/model coverage, and combined reports without invented splits. Root reviewed desktop and actual 320/390 CSS-pixel layouts, no document overflow, native Enter expansion, Tab into the first party link and the selected Likud profile. All four groups start collapsed. Research rationale is the approved conversation proposal (direct labels, shared bar scales, progressive disclosure), supported by the previously checked ONS and Datawrapper guidance. Prepared for commit, main integration and production deployment under Daniel's continuing authorization; confirm the production deployment before reporting publication.

### Commit and push authorization — October 5

Daniel authorized committing and pushing the completed work. Delivery is on `codex/feature-expansion` to `origin`; merging into main and production deployment remain separate. Before committing, the feature branch was fast-forwarded to the latest origin/main documentation-only commit (`7b2f2be`), preserving its updated STATE.md without changing the verified application. The reconciliation gates below remain applicable. Disposable QA files stay in ignored cache directories.

### Reconciliation of the interrupted conversation — October 5

Reconciled the recent chat, original design HANDOFF, DECISIONS, approved 31-item assessment and subsequent requests against current source and the production preview. The 31 workflows are implemented; this does **not** mean every external acceptance condition is complete. This section supersedes historical pending/next-action statements below and in the older proposal/decision records.

Seven concrete omissions repaired by Sol during this audit: shared polling URLs now preserve the fictional threshold setting; opening a poll method card brings it into view and focuses it, with Close/Escape returning focus; correction addresses follow same-route query changes while preserving edits belonging to that context; existing uncertain figure dates are disclosed in polling charts, browser cells and method cards; the who-votes casualty paragraph now uses the approved primary/secondary citations and cumulative scope; palette family labels use the approved bloc names; and an obsolete Channel 14 exclusion-policy sentence was removed from both its saved import note and seed script, retaining citation/date context. Also removed a trailing blank line flagged by diff checking. No polling figures, inclusion rules or averaging mathematics changed.

Recent-request reconciliation:

| Request | Verified outcome |
|---|---|
| Coalition fragility and party comparison | Comparable sourced questions, evidence gaps, selected-party comparison, cabinet/outside-support/abstention roles, explicit policy/partner/leadership obstacles; no unsupported stability score or inevitable-collapse claim |
| Approved feature expansion | All 5 substantial, 10 medium and 16 small implementation items accounted for in the acceptance ledger |
| Media inquiries/corrections | Approved daniel@centralreform.org contact, account-free unsent draft and contextual reporting |
| Flat poll panels / repeated blocks | Labeled zoomed small panels with shared-scale option, all-party comparison graph and accessible values |
| Clickable home/main squares | Known-party cells open Party Map with that party selected; general cue opens Party Map; full profiles remain available in the panel |
| Educational party colors | Distinct related current-party shades, approved family names, contrast ink and explicit limits on coalition inference |
| Geographic comparison | Colored single-list, leading-list and vote-mix modes; election/locality/mode sharing and honest Other/missing-data handling |
| Resource discovery | Five disclosure groups, visible Start here/All resources/Search, shared directory/footer catalog and contextual detail routes |
| Earlier editorial approvals | Signed note retained on About following the later shortened-homepage design; named-tool attribution with recorded fetching/writing clarification; Privacy, terminology and source rulings reconciled |
| Original teaching deck | 31 PDF pages and 31 PPTX slides synchronized; substantive speaker notes retained; all PDF pages visually inspected, embedded fonts verified. Native PowerPoint rendering not repeated. New four lesson PDFs retain their earlier eight-page visual check |

Final gates: **528 tests in 44 files, full lint with zero warnings, production build, TypeScript and git diff --check pass**. The first audit test run found the expanded citation paragraph exceeded its existing article-length cap; prose was tightened and the full suite then passed. Root verified the rebuilt production threshold URL/copy/Back behavior, method-card focus/Escape return, same-route correction prefill/manual-edit/Back behavior, visible uncertain-date disclosure and containment at actual 320/390 CSS pixels. New-reader route to the opposition governing scenario reviewed; browser error log empty. Prior full route/anchor, maps, exports and navigation checks remain applicable. Logs: node_modules/.cache/navigation-review/reconciliation-*. Deck audit evidence: node_modules/.cache/reconciliation-deck.

Still open, rather than claimed complete: validation with unfamiliar readers (S2); independent human editorial approval of the change feed (S4); reconciliation with the final official ballot publication (M7) and official surplus filings (Q3); and exercising acquisition against an actual live count (pre-election tests use fixtures). These are research/operational acceptance limits, not missing implemented controls. No new reader study, exhaustive article fact-check or screen-reader certification is claimed.

Current production preview: **http://localhost:3210/**, root session **12798**; app browser restored to `/resources`. All full gates repeated successfully after the final import-note edit; its production method-card wording verified. Final screenshot: node_modules/.cache/navigation-review/reconciliation-method-desktop.jpg. Original main checkout still contains only its pre-existing untracked planning/outreach files. No commit, merge, push or deployment. Next action: review the isolated preview, then integrate/publish when requested; retain the explicit external acceptance items above.

### Completed navigation redesign — October 5

Daniel requested a research-informed navigation rethink to make the full collection findable. Delivered five descriptive disclosure groups: Parties & coalitions; Polls & updates; Election explained; Teaching resources; About & contact. Start here, All resources and Search stay visible on mobile and desktop. The server-rendered `/resources` directory, header and footer share one catalog; it also fills missing search destinations. Teaching anchors lead directly to packets, session materials, scenarios and embeds. The XML sitemap includes Home and dated briefings without fragment duplicates. Detail/profile/export/embed routes remain contextual rather than cluttering the primary menu.

Root-directed IA and research drew on WAI disclosure navigation, USWDS and NN/g guidance. Political Sol inventoried 23 original destinations including Home, then independently reviewed six findability tasks and the implementation; product Sol implemented all code. This is expert review and technical verification, not a real-user study or screen-reader certification. Research/decisions: `navigation-inventory.md`, `navigation-research.md`.

Verified **525 tests across 44 files, full lint without warnings, production build and TypeScript**. All **33 navigation/directory links across 28 unique pages** and their section anchors passed production HTTP checks. SSR directory content and canonical sitemap verified. Root checked desktop 900/960/1265/1440 and mobile 320/390 layouts, visible utility access, Enter/Tab/Escape focus return, focus-leave dismissal, same-page teaching anchors, current-section indication, search for Government, and final production Party Map navigation. Corrected a 320px brand/button overlap. Light and app-default dark rendering reviewed. Screenshot: `node_modules/.cache/navigation-review/navigation-desktop.jpg`.

Current local production preview **http://localhost:3210/** (root session **72045**); user's app browser is open to `/resources`. Dev server stopped. No commit, merge, push or deployment; original checkout remains untouched. A premature preview restart failed while build output was incomplete; the completed build/typecheck and subsequent restart/smoke checks passed. Next action: user reviews this isolated preview; merge/deploy only when requested.

### Completed visual follow-up — October 5

Daniel's latest instructions are implemented: distinct current-party shades grouped into political color families; each known-party square opens `/parties?party=<id>` with its profile selected; the general homepage cue opens `/parties`. Full profile pages remain linked from the panel. Family legends explicitly distinguish descriptive grouping from coalition agreements. Related homepage runs are adjacent, bloc keys match the new colors, and foreground contrast is tested at 4.5:1 or better. Combined/unknown groups remain neutral rather than inventing party shares. Static social images retain their existing aggregate-bloc encoding.

The polls page replaces repeated seat blocks with an all-party timeline, date/party inspection and visibility controls. Small multiples use clearly labeled individual zoom scales with a shared-scale option. Missing observations break lines; zero stays zero; averaging mathematics is unchanged. Historical vote maps offer colored single-list share, leading-list plurality and proportional vote-mix pies. Historical identities, Other totals, uncertain leaders, missing coordinates and overlap omissions are explicit; selected election/list/locality/mode survive shared links, reload and history.

Verification: **522 tests across 43 files pass; full lint (zero warnings), production build and TypeScript pass**. Final scoped lint/typechecks cover the last palette edits. Root reviewed desktop and 390px layouts, homepage keyboard links, Party Map selection/back/reload/mobile scrolling, chart controls, historical map modes and share restoration. All eight affected production smoke routes returned HTTP 200; emitted CSS includes the final Builder label-opacity correction. Screenshot: `node_modules/.cache/chart-review/home-final.jpg` (disposable QA evidence). Research and detailed ownership remain in the linked worker notes.

Current local production preview: **http://localhost:3210/**, root exec session **56002**. Development server stopped. Original main checkout retains only its pre-existing untracked planning/outreach files. No commit, merge, push or deployment. All application implementation was performed by the two authorized Sol workers; root directed, reviewed and verified. Next action: user reviews this isolated preview, then merge/deploy when requested.

### Completed feature-expansion baseline

All 31 approved recommendations are implemented. Final full gates including Daniel's contact-address follow-up: **507 tests across 39 files, lint without warnings, production build and TypeScript all passed**. The earlier complete production route/link sweep returned HTTP 200 for all 85 checked paths; the changed contact page was rechecked in the final production build. Desktop/mobile interactions, shared URLs, back navigation, source-bearing CSVs, eight teaching PDF pages and missing/stale states were checked. The production preview is on port 3210. No commit, push or production deployment has been performed.

Daniel approved `daniel@centralreform.org` for **media inquiries and corrections**. The `/corrections` route now has a prominent media contact, an account-free correction email draft, updated footer/search labels and media/press/interview aliases. Root verified the recipient, subject and preserved page/claim/evidence fields in the generated unsent draft; no email was sent. Prior "email pending" notes below are historical. Temporary QA artifacts are disposable and excluded from the deliverable; persistent verification results are recorded here and source evidence is in the linked research notes. A Windows build-log lock was resolved by writing the log outside Next's output directory; the rerun passed.

Next action: review the local production preview and decide when to merge/deploy this isolated worktree. Current preview entry points: `/start`, `/coalition-builder`, `/compare`, `/polls#sensitivity`, `/party-history`, `/ballot`, `/changes`, `/vote-map`, `/teach#packets`, and `/corrections`.

Consequential limits: change-log source review is automated, not independent human editorial approval; a new-reader study has not been run; the official roster remains the published submitted/nonfinal roster pending October 18 final publication; surplus assumptions are press-reported signed pairs, not independently verified official filings. The pre-election results store is deliberately empty; failure recovery is exercised with fixtures rather than a nonexistent live count. Signed introductions and original main/design worktrees remain unchanged by this implementation. Detailed evidence and batch history follow in the linked research notes.

Research briefs: `research-politics.md` and `research-product.md`. Dependencies installed without manifest changes; baseline 443 tests across 20 files passed.

Implementation batch 1 assigned:
- `political_research` (Sol): S1/M1/Q1–Q8; comparison/cohesion/builder, supporting data and tests, bounded results-language/agreement edits.
- `product_research` (Sol): S2/M2/M5/M9/Q10/Q11/Q16; journeys/search/packets/corrections/article navigation/glossary, shared navigation/sitemap and additive global styles.

Root requested the public correction email; no address will be invented. Ordinary investiture uses more yes than no votes; constructive no-confidence requires 61 supporting an alternative government. Incomplete evidence must not count as agreement. The roster needs verified official/other source extraction and status distinctions; no fabricated complete list. For resilient results, GitHub's direct CEC access is unreliable, so the planned snapshot workflow will use a validated fresh-count endpoint served by the site and reject fallback/stale responses.

First milestone review: production build passed (`build-first-batch.log`). Root checked guided-step navigation/URLs, nickname search, completed comparison reading at desktop/390px, and one governing scenario's roles/arithmetic/shared URL. Initial search typing/empty-state and desktop-navigation overflow findings were corrected by Sol. All eight teaching PDF pages inspected in the final contact sheet; no clipping. Latest worker-reported full test suite: 460 passed; scoped lint/typecheck passed. Small mobile feedback and zero-seat-cabinet edge cases also corrected, with focused tests; root's final combined pass remains.

Implementation batch 2 assigned:
- `political_research`: S5/M6/M7, sourced party lineage, visual voting rights, verified ballot directory.
- `product_research`: S3/M3/M8/Q12/Q13, polling sensitivity/browser and durable result snapshots; add verified Q1/Q2 correction entries.

Second milestone review: polling presets, 7-day/equal-weight settings and shared URL exercised; incomplete polls excluded from the observed-majority denominator. Poll tables contained at 390px with narrow sticky identifiers. Ballot Hebrew-letter lookup and lineage branch filtering passed, with no mobile page overflow. The official directory contains all 38 published submitted entries and distinguishes that status from final eligibility; final publication is scheduled October 18. Voting-rights cards reviewed for national/municipal distinctions. Results snapshot validation, source/fetch times, distinct-history rotation and stale fallback reviewed; date added to strip timestamps so a prior-day saved count is distinguishable.

Root found a coalition shared-link restoration race during fresh navigation: initial URL synchronization could erase cabinet/support/abstention roles. Product worker owns its correction and regression before final integration.

Final batch assigned: political worker S4/Q14/Q15 material changes/news labels/grouping; product worker M4/Q9/M10 map history/share state/sourced exports and the builder restoration fix. Public review provenance must distinguish automated source review from human editorial approval. M9's public email remains pending Daniel's answer. New-reader validation is not established by developer walkthroughs. No production deployment yet.
