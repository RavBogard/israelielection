# Election lifecycle release state

October 26, 2026. All roadmap waves implemented and released. Automated negotiation extraction is externally blocked by the configured provider returning HTTP402 RESOURCE_EXHAUSTED; published seats/history and safe schedules remain available. [Plan](PLAN.md) · [source and operator runbook](../../../scripts/election-lifecycle/README.md).

## Behavior and scope

All seven editions share one coherent 120-seat snapshot. Current builders automatically update seats while preserving party/cabinet/support/abstention choices and highlighting changes; copied links pin seats. Political claims remain explicitly current even on pinned seat views. Confirmed positions precede undecided and remain proposal-specific. Failed, expired, disputed or unavailable primary sources hide affected claims, decisions and clocks while retaining published seats and saved history. Unknown elected lists remain neutral and count toward 120. Cold configured storage failures return unavailable rather than substituting campaign data; visible clients retain last-good evidence, reject older sequences and recover through one RSC refresh.

Completed surfaces: Home/results/masthead/Countdown; builder; Compare/Match/PartyMap/profiles/news/ballot/search/resources; seven-language government tracker and timeline; forecast/poll frozen evaluation; journey/guides; verified 2026 locality maps with separately reported envelopes and exact official-seat revisions; OG/cards/metadata/embeds/exports and immutable shares. Official seats replace unresolved probabilities; the bounded election window also archives forecasts before official publication without relabeling estimates. Archived traces stay reachable. Current routes are request-time when enabled; current API reads and political claims do not use long-lived page caches.

Backend includes ordered Redis immutable snapshots/captures, idempotent signed workers, current/pinned resolution, exit/joint-point bridge, strict CEC finality/correction validators, primary-source discovery and exact-evidence extraction, target-specific decisions, sourced legal clocks with explicit Gazette anchor, independent formation/daily jobs, frozen scoring and strict geography reconciliation. Campaign forecast/prior/history artifacts remain unchanged; the live baseline adds a versioned representative joint draw without recalibration.

## Verification

Full integration: 934 tests across 99 files pass (924 baseline before source/extraction regressions); production build and standalone typecheck pass; full ESLint has zero errors and 144 pre-existing warnings. Latest backend focused 57 tests, typecheck and ESLint pass. Final enabled preview build passes and marks current routes dynamic. Exact initial release overlay: 141 task files on base 129d931ae07eb1f6f0e04c966da2cc9dea66ae23; the diagnostic follow-up adds one test file, for 142 task paths. Implementation commits define the durable manifests. Unrelated research/final-review files and private QA/env artifacts are excluded.

Browser QA: seven-language mobile official results/government, desktop English and dark Hebrew, neutral unknown and re-entering list, role-preserving builder updates and pins, expired-claim redaction with retained seats, and cold-unavailable recovery all pass without overflow/runtime errors. Mock facts stayed local. Evidence is ignored under .vercel/lifecycle-qa; temporary scripts are outside the repository.

Preview: https://israelielection-lifecycle-preview.vercel.app points to dpl_HucNDSgbnW34ooCLau8reVG8mChN. Actual signed election/formation/briefing requests pass; unsigned requests return 401; genuine QStash delivery returns 200; duplicate receipt is idempotent and unchanged acquisition retains one seat snapshot. Nine SSR routes return no-store/MISS with the identical coherent revision. Missing pins return 404. Preview namespace is election-lifecycle:2026:v1:preview:. Preview minute schedule lifecycle-preview-election-2026 ran and is now paused by actual delayed self-PATCH receipt msg_7YoJxFpwkEy4DbXxvCTiXYPNi7o9Jh88Qpv1RgoHmV5Gpsdz1iogF (DELIVERED 200).

## Actual iad1 source probe

| Source | Observed result |
| --- | --- |
| Historical CEC25 | 28,014 preview / 28,016 production characters; strict raw-table parser accepted; 40 lists, 120 seats in regression fixture |
| Current CEC26 | CDN fetch failed; alternate host 404; no official result inferred |
| Presidency | 307 without Location; unavailable |
| Knesset agreements/government | 303 to geo-maintenance; unavailable |
| Yisrael Beytenu | Discovered dated article, 1,291 body characters |
| Democrats | Nine separately dated excerpts, 495 characters total |
| Likud / Yashar | Reachable indexes, no supported dated article body; no claims invented |
| Byachad | 403; unavailable |

Ordinary verified-host redirects are bounded and supported. No challenge bypass is attempted. HTTP or worker success is not acquisition/finality success. Current-source coverage is incomplete; automatic publication operates only on validated available evidence. No political commitments, clocks, geography or official seats were fabricated in production.

## Infrastructure and release

Canonical site: https://www.israelielection.org. Existing durable KV election-night-2026 (store_kKc0kcZgaPNgp0F3) and QStash election-night-scheduler-2026 (store_YWIpewY11KiQcTIC), team ravbogards-projects. Private credentials remain server-only. Production lifecycle configuration uses ELECTION_LIFECYCLE_ENABLED, ELECTION_OFFICIAL_ENABLED, ELECTION_FORMATION_ENABLED, ELECTION_LIFECYCLE_WORKER_URL=https://www.israelielection.org/api/election-lifecycle/worker and ELECTION_LIFECYCLE_NAMESPACE=production; preview uses its own exact destination and namespace. Gemini key targets include preview and production without exposing its value.

Pre-release production rollback target: dpl_BXbojmJuvW7MuZHWRdkQHjkQftpo, source 129d931. Normal Git custom-domain auto-assignment is enabled. Original live-forecast minute schedule and its existing Nov3 cleanup are untouched.

## Released commits and receipts

Implementation: [2ed8b3af6b2f149402ebae9ffabee478a32435e7](https://github.com/RavBogard/israelielection/commit/2ed8b3af6b2f149402ebae9ffabee478a32435e7), exact 141 files; [GitHub CI passed](https://github.com/RavBogard/israelielection/actions/runs/40373644415). Initial canonical production deployment dpl_CNc8jbCq6FLXSrGHi2Fa4uttetFJ.

Diagnostic follow-up: [f7816bd6cba55cc09e0ac5457a95ad575dc6bd63](https://github.com/RavBogard/israelielection/commit/f7816bd6cba55cc09e0ac5457a95ad575dc6bd63), exact 8 files including new extraction regressions; [GitHub CI passed](https://github.com/RavBogard/israelielection/actions/runs/40374885666). Canonical production code deployment dpl_HPtHuU9Dn6sutj5U34mzFtQLTktW (israelielection-j6l6hb6n3-ravbogards-projects.vercel.app). Normal Git domain assignment verified true, including automatic canonical assignment after the follow-up push. A subsequent STATE-only commit contains identical application code.

Production signed election/formation/briefing/source-probe requests pass; unsigned 401. Exact extraction probe returns provider_billing /402/RESOURCE_EXHAUSTED/writes0. Three article health records report that safe diagnostic. No events or clocks invented. Production namespace election-lifecycle:2026:v1:production: remains isolated from preview; repeated unchanged workers retain one seat snapshot and duplicate receipts return duplicate. Nine public SSR routes 200/no-store/MISS match the API's coherent 120-seat revision. Missing pins 404, evaluation awaits official seats and geography awaits validated localities. Actual desktop Results and mobile Hebrew dark Government browser smoke passed; screenshots inspected. Original live-forecast API remains200/current with all three questions rendered.

Actual QStash production delivery msg_7YoJxFpwkEy3LJPvSGkiMUDyaPBAroLXgvdePeNn1sS3V6tDpGjdk: DELIVERED 200. First observed automatic minute tick msg_7YoJxFpwkEy3LJPvPRb9JSu9bUU71CqsXVA3J1EJtHCDUopaw9gNr: DELIVERED 200/SUCCESS; later ticks also SUCCESS.

| Active schedule | UTC cadence | Lifecycle |
| --- | --- | --- |
| lifecycle-production-election-2026 | Every minute | Auto-pause November 3, 00:00 UTC |
| lifecycle-production-formation-2026 | Every 15 minutes | Continues after November 3 for official publication and negotiations |
| lifecycle-production-briefing-2026 | Daily 06:00 | Continues independently |

All destinations are exactly https://www.israelielection.org/api/election-lifecycle/worker. Election cleanup message msg_7YoJxFpwkEy3LJPu9YKRSGCA7kJBiVyuV6s9BqwpSHAni1JJBaUqe persists with PATCH destination /v2/schedules/lifecycle-production-election-2026/pause, notBefore1793664000000 (2026-11-03T00:00:00Z), five retries. The identical delayed self-PATCH mechanism actually delivered 200 and paused the preview schedule. Original live-forecast schedule/cleanup remain untouched.

## External provider action and recovery

The fixed real-article extraction probe in preview and production confirms a configured Gemini gemini-3.8-flash provider request returns 402 RESOURCE_EXHAUSTED. This is an external billing/quota failure, not a successful empty extraction, unavailable article or schema bug. Model/key/billing configuration was not silently changed. User provider-path decision is pending; current provider is retained. Automatic negotiation publication cannot be described as operational until this is resolved. Authoritative government feeds also retain the distinct access limits listed above. Safe workers retry within their budgets and hide affected claims; official result acquisition and published history do not depend on model extraction.

After restoring the approved provider account/quota, publish signed body {"mode":"extraction_probe"} through QStash to the exact canonical worker URL. Expected result: status accepted, stage extraction, HTTP 200, writes0; zero accepted events is valid for this historical real article. Then publish {"mode":"formation"}, verify article health and immutable capture/publication behavior, and recheck source probe {"mode":"probe"}. Use existing server-only QStash credentials; never paste keys into commands or public logs. An alternative provider/model requires the user's chosen path and compatibility verification.

Rollback: pause the three lifecycle schedules; disable the three lifecycle flags and redeploy, or restore dpl_BXbojmJuvW7MuZHWRdkQHjkQftpo (129d931). Preserve immutable published records/correction history and the original live-forecast service. Restoring a prior Vercel deployment can disable automatic domain assignment; explicitly promote the intended release and verify autoAssignCustomDomains before returning to unattended Git deployments.
