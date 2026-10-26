# Live Balance of Power — release state

Updated 2026-10-26 16:02 UTC. Implementation and release actions performed by GPT-6.1 Sol agents. No task commit or push yet; repository publication awaits the user's pending approval.

## Current state

- Canonical production: https://www.israelielection.org/results. New backend deployed **behind the disabled flag**; `GET /api/live-forecast` returns `enabled:false`, results shows no live panel, unsigned worker requests return 401.
- Current production deployment: `dpl_4FjTh58Ccz37ugMz6nM8sFKe5kDA`, https://israelielection-8s14f35nm-ravbogards-projects.vercel.app. Based on production commit `31b43a0ce100ad3322b8fedb6f35e1efb73d01c3` plus the 32 files below. All six newer forecast metadata/scoring documentation changes are preserved. Shared checkout was fast-forwarded safely to that same commit.
- Original production rollback target: `dpl_9GKS3RtQXJKNUefE3RBMs7Ej3tDK`, https://israelielection-d1f9513ti-ravbogards-projects.vercel.app. An initial deployment from the older checkout was immediately rolled back after detecting newer production metadata; the corrected deployment above preserves it.
- Review preview: https://israelielection-live-forecast-preview.vercel.app/results; deployment `dpl_p6QUEqHAXMfagzV8JdFWomBVJFgq`. Protected by Vercel authentication; a private automation credential was used for machine checks. Preview predates only the six preserved metadata/doc updates, which do not change numeric forecasts.
- Home compact view and full results view cover all seven editions, with three equally prominent questions, explicit ties, conditional confidence-vote probabilities, pledge cautions, threshold associations, actual history, source health, and 80% intervals. Last-good data survives failed or out-of-order refreshes.

## Verification

- Full suite: **884 tests passed in 85 files**, including all tests run again against the corrected isolated production stage.
- Full TypeScript check passed. Local production build and final Vercel preview/production builds passed. Full lint: 0 errors, 144 existing warnings; focused feature lint clean.
- UI: 13 focused tests; backend: 23 focused tests. Historical plumbing replay: 30 synthetic-order checks across five actual historical final-count archives; this is not accuracy calibration.
- Headless render QA inspected desktop English results/home, mobile English, and mobile Hebrew dark/RTL screenshots. All seven locales render three questions and working details at 320px; no feature overflow or browser exceptions. An existing German results seatbar exceeds 320px outside this feature.
- True QStash signed preview delivery published a stable snapshot to Redis. Two subsequent minute deliveries succeeded; acquisition time advanced while unchanged input retained one history point. Public preview read returned 200/current; unsigned worker returned 401.
- Preview minute schedule `live-forecast-preview-2026` is **paused**. Its documented delayed QStash PATCH cleanup automatically paused it at `2026-10-26T15:56:43Z`; cleanup message `msg_7YoJxFpwkEy56tfzhppAEMVcyyxdUHxjeVa3KMwHFPMZP8DtWjEbJ`. This proves the shutdown mechanism.

## Durable infrastructure

Vercel team `ravbogards-projects`, project `prj_yCbAJvShotcDd7gaV1jbYHZ5H8lh` (`israelielection`). Both services are claimed durable pay-as-you-go resources, connected to this project:

- Redis `election-night-2026`, resource `store_kKc0kcZgaPNgp0F3`.
- QStash `election-night-scheduler-2026`, resource `store_YWIpewY11KiQcTIC`.
- Integration configuration: `icfg_HzLrR6WZzdSuhEj3PT6eMF1j`.
- Credentials present in Vercel: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `QSTASH_TOKEN`, `QSTASH_URL`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. No credential values belong in this note or Git.
- Preview: `LIVE_FORECAST_ENABLED=true`, worker URL `https://israelielection-live-forecast-preview.vercel.app/api/live-forecast/worker`; namespace `live-forecast:2026:v1:preview:`.
- Production: `LIVE_FORECAST_ENABLED=false`, worker URL `https://www.israelielection.org/api/live-forecast/worker`; namespace `live-forecast:2026:v1:production:`. No active production schedule exists.

## Next release actions

1. After the pending user approval, commit/push only the 32 files below plus this note. Existing scheduled Git pushes would otherwise remove the CLI-only feature on their next deployment. Do not include unrelated untracked material.
2. Update the production flag to `true`, deploy the tested stage/current committed source, and explicitly promote if Vercel's rollback state prevents automatic domain assignment. Verify the canonical URL, source base, and signed worker delivery before starting the production schedule.
3. Create `live-forecast-production-2026` with one-minute UTC cron, raw body `{}`, destination exactly the production worker URL, POST, 60-second timeout, and retries. Production uses the public canonical domain and needs no preview protection-bypass header. Verify signed delivery, durable production publication, public read, and no preview/production key crossover.
4. Bound that schedule with a one-off QStash message to `https://qstash-us-east-1.upstash.io/v2/schedules/live-forecast-production-2026/pause`: HTTP PATCH, `Upstash-Not-Before` for **2026-11-03T00:00:00Z**, retries, and a privately forwarded QStash Authorization header. Record its message ID and verify the stored deadline. [Paid QStash permits delays up to one year](https://upstash.com/docs/qstash/features/delay); the analogous preview cleanup was tested successfully. The worker separately rejects work outside October 26–November 2 UTC.
5. Rollback: pause the production schedule first, set production flag false, then redeploy or `vercel rollback` to the original deployment above. A Vercel rollback can require an explicit subsequent `vercel promote` to resume normal domain assignment.

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
