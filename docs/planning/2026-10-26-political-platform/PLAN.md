# Political reference platform — approved implementation plan

Approved October 26, 2026 in the project conversation. Implementation uses Sol 6.1 agents. This expands the [released election lifecycle](../2026-10-26-election-lifecycle/STATE.md); it does not replace the current live pipeline before election night.

## Product decisions

- Serve international newcomers, Israeli readers and journalists/data readers equally, with answer → figure → explanation → evidence → method/data.
- Preserve the restored hero and existing visual identity. Keep numerical analysis central; no coalition-success or government-survival probabilities.
- Support exit polls, published counts, official results, formation, government/parliament/policy and permanent future elections, including concurrent elections and incumbent government activity.
- Keep confirmed primary facts, corroborated reported developments and derived/attributed analysis distinct everywhere. Reported information never establishes official seats, mandates, appointments, recorded votes or enacted law.
- Hide unverifiable current negotiation claims. Retain official results, prior publications, withdrawals, corrections and historical source-unavailability notices.
- Mostly automatic publishing; Daniel handles consequential unresolved readiness issues and occasional corrections. No autonomous original opinion.
- Full seven-language parity includes reference, sharing, search, subscriptions and emails. Failed editions show localized pending/unavailable state tied to the current factual revision, not stale facts.
- Commitments compare promise, agreement, action, implementation and outcome. Individually rate only measurable commitments using a versioned public rubric; no aggregate government score and no unsupported causal claims.
- Anonymous complete access; verified opt-in email digests, major-event alerts, party/issue/place follows. Secure email preference links initially.
- Reading-history recommendations are explicitly opt-in, initially local to the device with a rolling 30-day history, reasons/reset/off controls. Global headlines and corrections are not personalized; email alerts use explicit follows.
- Source-attributed exports, multilingual embeds, documented versioned public APIs and bulk history. Private/restricted captures and subscriber records are excluded from public exports.
- Investigate paid services and present costs separately; no purchase authorization. No guessed official source facts or bypassing source access restrictions.

## Milestones and acceptance

1. **Current-election readiness:** honest coverage/denominators, estimate/count/official separation, unprofiled lists, phase-aware journeys/copy, meaningful changes, deadline-aware source health and incidents. Preserve published forecast, scheduling and count-model safety gates.
2. **Durable evidence and editions:** stable election/person/party/list/term/government/proposal/attempt identities; fact and known/publication times; append-only PostgreSQL records; private content-addressed captures; current Redis/QStash retained. Backfill → shadow compare → separately gated cutover. Preserve URLs, hashes and known provenance gaps.
3. **Formation:** proposal-specific positions/arithmetic, distinct attempts, failed/returned mandates, later government changes, agreements and chronology. Formal transitions require current authoritative evidence; never advance by elapsed time alone.
4. **Reference and verification:** parliamentary records, first deep policy areas (institutions, budget/economy, draft/religion-state), commitment rubric, source-qualified indicators, stronger briefing atomic-claim verification and multilingual canonical publications.
5. **Distribution and reuse:** revision-matched seven-language content, verified subscriptions, transactional outbox, correction delivery, public `/api/v2`, bulk manifests and downloads/embeds. Mail failure does not roll back facts.
6. **Recommendations and repeat-election rehearsal:** opt-in discovery; verified announcement creates draft edition; automatic basic activation passes identity/date/source/storage/language/archive checks. Maps/models have independent gates; previous government/history remains accessible.

Count-model research is independent: timestamp-correct historical replay with entire elections held out, probability score/coverage against pre-count baseline. Missing replay evidence or unsupported calibration leaves probabilities disabled. Broadcaster coverage, parliamentary/legal sources, multilingual source discovery and future CEC formats need actual qualification; passing unit tests is not feed readiness.

## Interfaces and operations

- One Next.js application with bounded workers. Managed Postgres authoritative after approved/readiness-gated migration, private object archive, Redis projections/leases and QStash jobs.
- Stable edition routes such as `/elections/il-knesset-26`; old short URLs stay valid. Election allocations differ from later parliamentary membership. Pinned links preserve selected edition/revision.
- Canonical publication with per-locale revision status; immutable correction/withdrawal history; transactional publication outbox.
- `/api/v2` election/entity/event/publication resources, cursor pagination, ETags, historical revisions, provenance/license metadata, anonymous rate limits and bulk manifests.
- Source states distinguish unconfigured, inaccessible, healthy-no-new-fact, stale and disputed. Deadline-aware validation replaces fixed rotation that can starve claims.
- Bounded recovery, deduplicated actionable incidents, grouped routine warnings, independent multi-location HTTP/TLS and browser availability checks. Current 15-minute then three-hour collection and daily briefing remain unchanged.

## Validation and rollout

Test missing/conflicting exits, count corrections/decreases, unknown lists, 100% without finality, unsupported probability models, repeat nominees/failed attempts/later breakdowns, concurrent elections, hidden current claims with retained history, locale failures/withdrawals, subscription consent/dedup/unsubscribe/corrections, opt-in history expiry, mobile/RTL/keyboard/table alternatives, link/API compatibility and backup/rollback.

Each milestone needs focused tests, integration typecheck/lint/build and bounded browser QA for changed UI. New capabilities remain gated until their actual dependencies work. No production database cutover or paid-service provisioning is implied by development.

Candidate services: Neon Postgres, Vercel private Blob, Resend; retain existing services. Measure document/translation workload and recipient volumes before cost approval. AP/Reuters are quote/licensing investigations, not approved purchases.

## Work ownership

- Root: product direction, architecture, integration/review, approved documentation, release coordination. No implementation coding with Astra.
- `live_forecast_backend` (Sol 6.1): backend/data/worker/storage/API implementation, focused checks and backend runbooks.
- `live_forecast_ui` (Sol 6.1): components/pages/i18n/journeys and client experience, focused checks and visual QA.

Current progress and exact verification are maintained in [STATE.md](STATE.md), not inferred from this plan.
