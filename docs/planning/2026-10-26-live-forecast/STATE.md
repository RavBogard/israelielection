# Live Balance of Power — release state

Updated 2026-10-26 16:09 UTC. Implementation and release actions performed by GPT-6.1 Sol agents. **Released and enabled.** Implementation commit [42eca9022c86964230a5315f85ae9ada8dfe02a5](https://github.com/RavBogard/israelielection/commit/42eca9022c86964230a5315f85ae9ada8dfe02a5) is on main; [GitHub CI](https://github.com/RavBogard/israelielection/actions/runs/40355575405) completed successfully.

## Current state

- Canonical production: https://www.israelielection.org/results, with a compact view on https://www.israelielection.org/. `GET /api/live-forecast` returns `enabled:true` with a stable pre-election snapshot and current source health; unsigned worker requests return 401.
- Verified activation deployment: `dpl_6xvcn4E8vY8qEqTSigRqS928DGte`, https://israelielection-bb96msd29-ravbogards-projects.vercel.app, from implementation commit `42eca90`. It includes production base `31b43a0ce100ad3322b8fedb6f35e1efb73d01c3` and preserves all six newer forecast metadata/scoring documentation changes. Subsequent documentation-only builds may have newer deployment IDs.
- Original production rollback target: `dpl_9GKS3RtQXJKNUefE3RBMs7Ej3tDK`, https://israelielection-d1f9513ti-ravbogards-projects.vercel.app. Normal future Git deployment domain assignment is restored and verified: the Git-triggered implementation build automatically received every canonical production alias.
- Review preview: https://israelielection-live-forecast-preview.vercel.app/results; deployment `dpl_p6QUEqHAXMfagzV8JdFWomBVJFgq`. Protected by Vercel authentication; a private automation credential was used for machine checks. Preview predates only the six preserved metadata/doc updates, which do not change numeric forecasts.
- Home compact view and full results view cover all seven editions, with three equally prominent questions, explicit ties, conditional confidence-vote probabilities, pledge cautions, threshold associations, actual history, source health, and 80% intervals. Last-good data survives failed or out-of-order refreshes.

## Verification

- Full suite: **884 tests passed in 85 files**, including all tests run again against the corrected isolated production stage.
- Full TypeScript check passed. Local production build and final Vercel preview/production builds passed. Full lint: 0 errors, 144 existing warnings; focused feature lint clean.
- UI: 13 focused tests; backend: 23 focused tests. Historical plumbing replay: 30 synthetic-order checks across five actual historical final-count archives; this is not accuracy calibration.
- Headless render QA inspected desktop English results/home, mobile English, and mobile Hebrew dark/RTL screenshots. All seven locales render three questions and working details at 320px; no feature overflow or browser exceptions. An existing German results seatbar exceeds 320px outside this feature.
- True QStash signed preview delivery published a stable snapshot to Redis. Two subsequent minute deliveries succeeded; acquisition time advanced while unchanged input retained one history point. Public preview read returned 200/current; unsigned worker returned 401.
- Production signed delivery published at `2026-10-26T16:07:25.596Z`; the minute schedule succeeded at `16:08:00.870Z`. Acquisition time advanced, model generation time stayed fixed, and durable/public history retained one point. Preview data stayed in its separate namespace. Public API, home, results, and Hebrew mobile RTL rendered all three questions with no feature overflow or browser exceptions; actual production screenshots were inspected.
- Preview minute schedule `live-forecast-preview-2026` is **paused**. Its documented delayed QStash PATCH cleanup automatically paused it at `2026-10-26T15:56:43Z`; cleanup message `msg_7YoJxFpwkEy56tfzhppAEMVcyyxdUHxjeVa3KMwHFPMZP8DtWjEbJ`. This proves the shutdown mechanism.

## Durable infrastructure

Vercel team `ravbogards-projects`, project `prj_yCbAJvShotcDd7gaV1jbYHZ5H8lh` (`israelielection`). Both services are claimed durable pay-as-you-go resources, connected to this project:

- Redis `election-night-2026`, resource `store_kKc0kcZgaPNgp0F3`.
- QStash `election-night-scheduler-2026`, resource `store_YWIpewY11KiQcTIC`.
- Integration configuration: `icfg_HzLrR6WZzdSuhEj3PT6eMF1j`.
- Credentials present in Vercel: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `QSTASH_TOKEN`, `QSTASH_URL`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. No credential values belong in this note or Git.
- Preview: `LIVE_FORECAST_ENABLED=true`, worker URL `https://israelielection-live-forecast-preview.vercel.app/api/live-forecast/worker`; namespace `live-forecast:2026:v1:preview:`.
- Production: `LIVE_FORECAST_ENABLED=true`, worker URL `https://www.israelielection.org/api/live-forecast/worker`; namespace `live-forecast:2026:v1:production:`. Minute schedule `live-forecast-production-2026` is active, POST body `{}`, 60-second timeout, two retries.
- Production auto-pause message `msg_7YoJxFpwkEy3LJPujzJv3THzG8v9EMnNtSdzLTTtkHDBYf1HW6su9` is durably queued for **2026-11-03T00:00:00Z**. A GET of the stored message verified method PATCH, the regional schedule-pause endpoint, and `notBefore:1793664000000` (milliseconds). The private forwarded provider Authorization header is not recorded here.

## Operations and rollback

- The feature is committed on main, so existing poll/results/briefing Git pushes preserve it. No remaining release approval is pending.
- QStash schedule `live-forecast-production-2026` calls the exact canonical worker URL once per minute. The independently queued one-off message calls `https://qstash-us-east-1.upstash.io/v2/schedules/live-forecast-production-2026/pause` at **2026-11-03T00:00:00Z**, with PATCH and five retries. [Paid QStash permits delays up to one year](https://upstash.com/docs/qstash/features/delay); the analogous preview shutdown was verified, and the actual production delay was accepted and read back. The worker separately rejects work outside October 26–November 2 UTC.
- Rollback: pause the production schedule first, set production flag false, then redeploy or `vercel rollback` to the original deployment above. A Vercel rollback can require an explicit subsequent `vercel promote` to resume normal domain assignment. Pause/delete the already queued cleanup message too if replacing the schedule under the same ID with a different lifetime.
- Secrets remain in Vercel and ignored local environment files only. Provider billing is usage based; Redis snapshots/history persist after the scheduler stops.

## Limits to preserve

The immutable prior is explicitly the saved **October 25 provisional** prior, not a final submission; the original scored forecast remains separate. Do not regenerate it merely because the main forecast's timestamp/scoring text changed on October 26. The direct Channel 13 schema is verified; complete N12/Kan live schemas remain unverified, with validated Wikipedia fallback. Count-informed publication stays blocked until actual 2026 coverage/completed-locality semantics are established. Synthetic geographic replay does not establish those semantics or forecast calibration. Method and operational details: [backend README](../../../scripts/live-forecast/README.md).

## Exact implementation manifest (32 files)

The local ignored `.vercel/live-forecast-stage.json` records the production base and SHA-256 hashes for these exact stage overlays; local test scripts/screenshots and credentials are excluded from deployments and Git.

```text
app/api/live-forecast/route.ts
app/api/live-forecast/worker/route.ts
components/live-forecast/ForecastClient.tsx
components/live-forecast/LiveForecast.tsx
components/live-forecast/live-forecast.css
components/live-forecast/live-forecast.test.ts
components/live-forecast/presentation.ts
components/pages/HomePage.tsx
components/pages/ResultsPage.tsx
data/live-forecast-prior.json
data/live-forecast.json
lib/i18n/live-forecast.ts
lib/live-forecast/auth.ts
lib/live-forecast/direct.ts
lib/live-forecast/fixtures/channel13-2022.json
lib/live-forecast/geography.test.ts
lib/live-forecast/geography.ts
lib/live-forecast/model.test.ts
lib/live-forecast/model.ts
lib/live-forecast/official.ts
lib/live-forecast/server.test.ts
lib/live-forecast/server.ts
lib/live-forecast/sources.ts
lib/live-forecast/store.ts
lib/live-forecast/types.ts
lib/live-forecast/worker.test.ts
lib/live-forecast/worker.ts
scripts/live-forecast/README.md
scripts/live-forecast/freeze-prior.mjs
scripts/live-forecast/generate.mts
scripts/live-forecast/replay-results.json
scripts/live-forecast/replay.mts
```
