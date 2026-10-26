# Election lifecycle: shared evidence and coalition formation

Status: full implementation authorized, October 26, 2026. All implementation and release work is assigned to GPT-6.1 Sol; Astra coordinates architecture and integration.
Starting point: [released Live Balance of Power state](../2026-10-26-live-forecast/STATE.md); preserve its immutable prior, source limitations, count gate, deployment isolation and rollback controls.
Product decisions: after results, lead with coalition scenarios and a sourced negotiations tracker. Automatically publish confirmed authoritative changes after validation; do not require routine human approval.

## Acceptance contract

Every current tool uses the same versioned seat context and states its basis. Campaign history remains available. Exit/count estimates never acquire official status merely through age, apparent completeness or unchanged numbers. Political talks may begin before official seat publication, so election evidence and political progress are independent.

### Axis 1: election evidence and shared seats

Introduce a server-owned `SharedSeatContext` and pure selection reducer, with a serializable client/API form:
- Identity: election, context revision, schema/model version, selected seat snapshot revision, immutable source references and correction lineage.
- Evidence: campaign / exit / counting / official-result stage; campaign estimate / validated exit estimate / qualified live projection / explicitly selected partial-count allocation / CEC-published seats basis.
- State: provisional versus CEC official seat publication; source publication, observation, successful check and attempted check times; per-source freshness; unavailable/disputed/invalid reasons.
- Data: exact seats when known, estimate intervals/joint-draw reference when uncertain, party identities including unprofiled elected lists, and independently qualified count coverage. Reporting-locality eligible voters are not percentage counted.
- A single parliament consumed by builder/compare/maps must be one coherent 120-seat point allocation: a selected named exit poll, published official seats, or a representative projection with a documented selection method. Independent party posterior medians cannot become that parliament. Carry joint-draw uncertainty and marginal intervals separately, with their original semantics.
- Default precedence: campaign before close → validated exit or qualified live projection while counting is incomplete → CEC-published official seats. If newer qualified evidence is unavailable, retain the last qualified context with an explicit waiting/stale label.
- Raw partial-count seats are an explicit labeled view, never the automatic final/default basis. Do not bypass the live count model's existing coverage/calibration gate.
- Historical shared URLs remain pinned. New “current” share links record their selected revision. The open current builder automatically follows new seat revisions, preserving selected parties and cabinet/support/abstention roles and highlighting changed seat totals. Shared links stay pinned to their saved revision; unavailable pins never substitute current evidence.
- Official publication requires a verified CEC source identifying the election and published seat allocation, with unique lists and 120 seats. Never infer it from “100%”, an HTTP Last-Modified value, or a quiet feed. Preserve official corrections as new revisions.
- An emergency sourced editorial override uses the same schema, authority checks and audit trail; it is not an alternative routine approval requirement.

### Axis 2: political events and negotiations

Maintain independently sourced political events and active processes: reported talks, consultations, presidential recommendations, mandate assignment/extensions, agreements, confidence commitments, cast confidence votes and formed government. Overlapping processes are allowed; do not force them into one inferred linear sequence.
- Each event records type, subjects/parties, source authority, published/observed/effective times, evidence URL/capture hash, version, confirmation status and correction/supersession links.
- All seven editions render the same structured event/status records through localized templates using party IDs, timestamps and roles, so factual state cannot drift across languages. Clearly identify original source quotations and translations.
- Separate a report of talks, a party's own stance, a presidential recommendation, a signed agreement, an intended confidence vote and a recorded vote. An unknown decision remains unknown, never implied opposition.
- Keep the existing builder's explicitly hypothetical cabinet/support/abstention roles separate from reported or confirmed party decisions. Unknown tracker positions cannot be silently converted into the helper's default opposition role.
- Use CEC publications for official seat results; the President for assignments/extensions; Knesset records for confidence votes and government formation. Party official sources establish their own statements only; joint agreements require the relevant joint document, all affected signatories' evidence, or appropriate official publication.
- Validated authoritative events publish automatically and idempotently. Attributed news can report unconfirmed talks without altering confirmed state. Conflicts become disputed records; never silently choose the most recently fetched contradictory claim.
- The publication event anchors publication-based dates; actual assignment anchors the nominee's 28-day clock. A possible extension of up to 14 days is not automatic: show the actual granted extension only after the relevant presidential event. Reuse `lib/formation.ts` with event-specific anchors rather than its longest-path dates as a live countdown.
- Sources: [President's account of consultation and assignment](https://www.president.gov.il/en/institution/), [Knesset formation overview](https://main.knesset.gov.il/en/about/lexicon/pages/formation-government.aspx), and existing `data/formation.json` provenance. Keep legal explanation brief; verify operative rules against current primary sources during implementation.

## Existing seams and migration targets

`lib/results-phase.ts` currently exposes only before/exit/early/count and uses reporting-locality roll coverage for the early boundary. `lib/results-live.ts` and `lib/results-snapshot.ts` distinguish fresh/stale acquisitions but have no finality state. Preserve those acquisition safeguards while separating presentation stage from actual count coverage.

`lib/data.ts`, `lib/forecast.ts` and `lib/list-seats.ts` expose static campaign pseudo-polls. `components/CoalitionBuilder.tsx` defaults to the first usable count or the campaign forecast; its picker and URL restoration need explicit context semantics. `lib/coalition-arrangement.ts` already supplies yes/no/abstention arithmetic, completeness checks, pledge warnings and pivotal partners.

`data/formation.json` is a separate sourced milestone store. Its results-publication `actual` field currently drives `withDates`; connect authoritative events without equating count capture with publication. Keep source-specific revision histories instead of overwriting campaign data.

| Surface / existing seam | Exit and incomplete count | Published seats and negotiations |
| --- | --- | --- |
| Home/navigation; `components/pages/HomePage.tsx`, results strip | One shared context, uncertainty and clear entry to results; remove obsolete voting countdown copy | Coalition scenarios and tracker become primary; show publication/correction provenance and current political status |
| Results and Live Balance; `ResultsPage.tsx`, `lib/live-forecast/*` | Distinguish forecast, exit, partial count and gated projection; preserve source health | Exact winner/ties, threshold outcome and seats replace unresolved election probabilities; retain historical traces and separate political uncertainty |
| Forecast/polls; `ForecastPage.tsx`, `PollsPage.tsx`, forecast scripts | Preserve registered campaign predictions and dated comparisons | Score frozen eligible predictions against the selected official revision; keep provisional predictions labeled, never retroactively declare registration/finality |
| Builder and named scenarios; `CoalitionBuilder.tsx`, role helpers | Default to qualified shared estimate, preserve explicit pins and uncertainty | Exact cabinet/support/no/abstention totals, pivotal partners and sourced constraints; hypothetical success is not probability of agreement |
| Compare; `ComparePage.tsx`, `components/Compare.tsx` | Shared seat context alongside unchanged sourced campaign positions | Show representation and documented later position changes with dates; preserve original campaign answers |
| Match; `MatchPage.tsx` | Keep question/score methodology stable | Reframe as comparing representation and positions; do not recalculate personal match scores because seats changed |
| Party map/profiles; `PartyMap.tsx`, `PartyProfile.tsx`, `profile/model.ts`, `lib/list-seats.ts` | Replace implicit average seats with qualified context | Exact elected representation, failed-list outcomes, sourced stance/negotiation events and historical campaign profiles |
| News; `news/NewsBlocs.tsx` | Shared evidence labels and attributed reports | Distinguish attributed talks from confirmed event state; use current seats without rewriting archived reporting |
| Government/timeline/guides; `app/(en)/government/page.tsx`, `lib/formation.ts` | Explain concurrent talks and remaining count uncertainty | Formation hub: sourced event ledger, current mandate/actual deadlines, scenario links; formed status requires official evidence |
| Start/journey pages | Route visitors to current tasks and explain the selected basis | Lead with representation, coalition options and formation; retain campaign learning paths as history |
| Vote map/communities/history; `lib/votemap.ts`, historical archives | Keep 2019–2022 history; no invented 2026 geography | Add 2026 only from validated locality data; envelopes remain separate; no inferred alliance vote transfers |
| Metadata/OG/embeds/exports/search/share/cards | Carry basis, revision, timestamp and uncertainty consistently | Export exact official revision/provenance; preserve existing historical endpoint semantics, make new current-basis endpoints explicit, retain pinned links and prevent mixed-revision summaries |

## Delivery waves

### Wave 1 — before close: shared state and safe defaults

1. Define context/event schemas, pure precedence/correction reducer and compatibility adapter for `Poll` consumers. Keep seat evidence independent of political events from the first schema version.
2. Add a shared server resolver/API with durable revision references and last-good behavior; compare it in shadow mode with existing outputs. Prepare official-result and political-event adapter interfaces now, without fabricating source success.
3. Fix early-count builder default and exit selection first. Preserve explicit URLs/local selections and supply revision-bearing new links. Never construct a “coherent” live builder result by summing marginal medians.
4. Move home/nav, results/live balance, builder and shared seat helpers to the context, including topline seats, basis labels and crosslinks in Compare, Match, PartyMap, profiles and NewsBlocs through shared helpers/adapters. These surfaces must not remain campaign-based until wave 2. Update core phase wording in all seven editions, including RTL; remove date-expired current-task wording. Bound this to shared context, labels and links rather than a full-site audit; defer complete post-result redesign and scoring to wave 2.
5. Scaffold waves 2/3 behind separate flags and rehearsable contracts before results arrive. Exit criterion: core tools agree on one context revision, partial counts cannot silently become defaults, and production fixtures cannot leak.

### Wave 2 — official seats: finality, exact arithmetic and evaluation

1. Implement the verified CEC official-seat adapter and automatic promotion/correction rules; retain complete raw publication evidence and list mapping. Source format discovery is a dependency, not permission to infer finality.
2. Promote official seats across every consumer; remove unresolved election odds/threshold risk from current views while preserving historical probability traces. Use exact scenario arithmetic and surfaced unknown political decisions.
3. Add immutable prediction registration/selection metadata and scoring against versioned official outcomes without altering the existing forecast record. Recalculate evaluation visibly when the official result is corrected.
4. Refine final-result-specific treatment in profiles, compare, match framing and news; deepen comparisons, export/cards/search and campaign archives using the context already adopted in wave 1. Exit criterion: every matrix surface identifies its basis and official correction revision, with no campaign average masquerading as current seats.

### Wave 3 — primary post-result destination: scenarios and tracker

1. Expand the existing government/formation route into the primary formation hub; home/nav lead to scenarios plus the sourced tracker. Prepare this layout and event taxonomy during wave 1.
2. Add narrowly scoped President, Knesset and party/joint-document adapters with per-event authority/schema checks, deduplication, timestamp validation, disputed state and append-only correction audit. Automatically publish confirmed changes; retain unsupported claims only as attributed news.
3. Connect actual publication, assignment, granted extension and vote events to the clock. Distinguish recommendations from confidence support, commitments from cast votes, agreement from installed government; do not invent formation odds.
4. Give formation acquisition its own 15-minute/configurable authoritative-fetch schedule plus a daily briefing, health policy and stop/continuation rules. Existing live worker and automatic count capture stop around November 3; do not extend minute election ingestion indefinitely to cover negotiations. Archive the finished election forecast explicitly and hand off to formation: settled official seats are not permanently “stale/paused” after election ingestion stops. Use phase-appropriate source freshness thresholds; distinguish completed evidence from failed scheduled acquisition.
5. Exit criterion: an independently sourced political update can change the tracker and clock without changing seat evidence, and official seat correction can change arithmetic without fabricating a political event.

### Wave 4 — secondary detail as validated data permits

Add 2026 locality/community views, historical comparisons and deeper representation analysis only when locality semantics, unknown-list mappings and envelopes are verified. Preserve campaign position snapshots; annotate documented changes. No synthetic election geography or unsupported vote-transfer story.

## Verification and release

- Reducer tests: overlapping talks/count/publication; corrections that decrease counts or change seats; stale/offline acquisition; disputed evidence; unknown parties; envelopes; partial localities; apparent 100% never certifies publication.
- Contract tests: all tools use the same context revision and coherent 120-seat point allocation; marginal intervals/joint uncertainty retain their semantics; source type/authority required for every confirmed event; future times and invalid elections rejected; old shared links stay pinned; new links round-trip revision; user selections do not move silently.
- Regression tests: frozen registered forecast bytes unchanged; provisional prior remains provisional; no current exit election probability after official seats; exact yes/no/abstention arithmetic; unknown political decisions never become opposition.
- Clock tests: actual publication/assignment anchors, event correction, delayed observation, timezone changes and only explicitly granted extensions. No countdown invented from date passage alone.
- Operations tests: November scheduler shutdown archives completed election evidence without perpetual stale/paused UI; formation's independent cadence/briefing and freshness policy continue, and historical metadata/export endpoints keep their documented semantics.
- Rehearse campaign → exit → incomplete count → official publication, plus talks before publication, an offline source, corrected publication and confidence vote. Use isolated fixture namespaces and captured source examples; fixture injection remains development/test-only.
- Run focused checks per wave, then full tests/typecheck/lint/build. Verify seven editions, Hebrew/Arabic/Persian RTL, mobile layouts, hydration/polling, exported context and crosslinks.
- Roll out with separate shared-context, official-seats and formation-tracker flags: preview/shadow checks, then production with the existing isolated namespaces. Automatic authoritative event publication begins only for validated enabled adapters; failures retain last-good evidence and explicit health.
- Rollback disables the affected presentation/adapter flag and pauses its schedule, retaining all immutable source/event revisions. Restore the prior deployment/context selection without deleting corrections, rewriting forecasts or falsely downgrading known official publication to “counting”.

## First implementation milestone

Implement **wave 1's schema, pure resolver and builder-default correction**, with current/explicit-pinned link semantics and boundary/partial-count tests. Review that concrete result before expanding migrations; prepare the official-result and event interfaces in the same milestone so waves 2/3 do not wait for final results to begin.
