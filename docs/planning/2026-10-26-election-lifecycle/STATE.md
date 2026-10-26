# Election lifecycle release state

October 26, 2026. All roadmap waves implemented; production release in progress. [Plan](PLAN.md) · [source and operator runbook](../../../scripts/election-lifecycle/README.md).

## Behavior and scope

All seven editions share one coherent 120-seat snapshot. Current builders automatically update seats while preserving party/cabinet/support/abstention choices and highlighting changes; copied links pin seats. Political claims remain explicitly current even on pinned seat views. Confirmed positions precede undecided and remain proposal-specific. Failed, expired, disputed or unavailable primary sources hide affected claims, decisions and clocks while retaining published seats and saved history. Unknown elected lists remain neutral and count toward 120. Cold configured storage failures return unavailable rather than substituting campaign data; visible clients retain last-good evidence, reject older sequences and recover through one RSC refresh.

Completed surfaces: Home/results/masthead/Countdown; builder; Compare/Match/PartyMap/profiles/news/ballot/search/resources; seven-language government tracker and timeline; forecast/poll frozen evaluation; journey/guides; verified 2026 locality maps with separately reported envelopes and exact official-seat revisions; OG/cards/metadata/embeds/exports and immutable shares. Official seats replace unresolved probabilities; the bounded election window also archives forecasts before official publication without relabeling estimates. Archived traces stay reachable. Current routes are request-time when enabled; current API reads and political claims do not use long-lived page caches.

Backend includes ordered Redis immutable snapshots/captures, idempotent signed workers, current/pinned resolution, exit/joint-point bridge, strict CEC finality/correction validators, primary-source discovery and exact-evidence extraction, target-specific decisions, sourced legal clocks with explicit Gazette anchor, independent formation/daily jobs, frozen scoring and strict geography reconciliation. Campaign forecast/prior/history artifacts remain unchanged; the live baseline adds a versioned representative joint draw without recalibration.

## Verification

Full integration: 929 tests across 98 files pass (924 baseline before source extraction regressions); production build and standalone typecheck pass; full ESLint has zero errors and 144 pre-existing warnings. Latest backend focused 52 tests, typecheck and ESLint pass. Final enabled preview build passes and marks current routes dynamic. Exact release overlay: 141 task files on base 129d931ae07eb1f6f0e04c966da2cc9dea66ae23; the implementation commit defines the durable manifest. Unrelated research/final-review files and private QA/env artifacts are excluded.

Browser QA: seven-language mobile official results/government, desktop English and dark Hebrew, neutral unknown and re-entering list, role-preserving builder updates and pins, expired-claim redaction with retained seats, and cold-unavailable recovery all pass without overflow/runtime errors. Mock facts stayed local. Evidence is ignored under .vercel/lifecycle-qa; temporary scripts are outside the repository.

Preview: https://israelielection-lifecycle-preview.vercel.app points to dpl_HucNDSgbnW34ooCLau8reVG8mChN. Actual signed election/formation/briefing requests pass; unsigned requests return 401; genuine QStash delivery returns 200; duplicate receipt is idempotent and unchanged acquisition retains one seat snapshot. Nine SSR routes return no-store/MISS with the identical coherent revision. Missing pins return 404. Preview namespace is election-lifecycle:2026:v1:preview:. Preview minute schedule lifecycle-preview-election-2026 ran and is now paused by actual delayed self-PATCH receipt msg_7YoJxFpwkEy4DbXxvCTiXYPNi7o9Jh88Qpv1RgoHmV5Gpsdz1iogF (DELIVERED 200).

## Actual iad1 source probe

| Source | Observed result |
| --- | --- |
| Historical CEC25 | 28,014 characters; strict raw-table parser accepted; 40 lists, 120 seats in regression fixture |
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

Remaining release actions: commit/push this exact reviewed overlay, verify GitHub CI; deploy production with the configured flags; verify signed modes/probe, public API/SSR coherence, isolated store, unsigned401 and unchanged-history behavior; create lifecycle-production-election-2026 (every minute), lifecycle-production-formation-2026 (every 15 minutes), lifecycle-production-briefing-2026 (06:00 UTC daily). The new election schedule must receive a verified delayed auto-pause on 2026-11-03T00:00:00Z; formation and daily briefing continue independently. Record actual commit/deployment/schedule and cleanup receipts below after activation.
