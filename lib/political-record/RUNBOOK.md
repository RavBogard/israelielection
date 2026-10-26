# Platform backend rehearsal and activation

All additions in this slice default off. Redis remains authoritative for election seats and visible political claims. No service was bought, no production SQL was run, and no schedule was changed. Configuration names without values are in `platform.env.example`.

## Runtime contracts

- Existing signed `/api/election-lifecycle/worker` adds `platform_collect`, `platform_shadow`, and `platform_deliver`. Existing QStash exact-subject signature validation applies to every mode. These are explicit calls; this change does not create or modify schedules.
- `platform_collect` requires `POLITICAL_PLATFORM_COLLECT_ENABLED=true` and a configured PostgreSQL database. It fetches only the fixed CBS price-index endpoint, validates its JSON contract and stores observation revisions. Without a configured database it acquires nothing. An unavailable source does not erase prior observations. The actual public response recorded in `fixtures/cbs-price-120010.json` was HTTP200 application/json,895 bytes on2026-10-26; its source URL is `https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false&last=2&lang=en`. Observation months, index base, monthly percent and annual percent remain distinct; the response does not establish a release timestamp or government causation.
- `platform_shadow` and the optional post-publication mirror require `POLITICAL_RECORD_SHADOW_ENABLED=true`, PostgreSQL and private Blob. Automatic mirroring is bounded to20 recent events,1 seat snapshot and at most10 captures/2 MB. Missing captures remain explicit. It never promotes PostgreSQL or changes the Redis result; failure/cleanup is independent. Full backfill remains a separate explicit CLI operation.
- Private captures use the official `@vercel/blob` SDK with `access:'private'`, `allowOverwrite:false`, no random suffix, authenticated origin reads and SHA256 verification. No raw capture URLs/content are exported. `POLITICAL_RECORD_BLOB_TOKEN` must belong to a reviewed **private** store; no store is provisioned by code.
- Source-confirmed `mandate_returned`, `mandate_failed`, `government_ended`, `election_called` events now enter the existing strict primary-source extractor. Irrelevant decision fields and speculative text are rejected. An unavailable newer transition cannot resurrect an older live government/clock; an unrelated nominee's failure does not end the active mandate. No new legal duration or automatic deadline-to-failure inference was added.

## Versioned read API

Enable `PUBLIC_V2_API_ENABLED` only after configuring `PUBLIC_API_CURSOR_SECRET` (at least32 random characters) and the existing Redis REST credentials. `/api/v2/{elections,entities,events,publications}` accepts `election`, `view=latest|history`, `limit`(1..100), and opaque `cursor`. New capabilities are off by default.

The response includes `schemaVersion:2`, stable election ID, storage basis, history readiness, as-of watermark, continuation cursor, records and explicit third-party rights limitations. A cursor binds collection/election/view/limit and the watermark; callers cannot silently mix selections. PostgreSQL history pages preserve their original watermark while new corrections append. Latest records retain withdrawn statuses. A bridge cursor is valid only while the underlying current/reference snapshot matches; changed snapshots return409. Missing durable publications/history return503, not an invented empty historical archive.

`POLITICAL_RECORD_PUBLIC_READ_ENABLED=true` enables durable record reads. Otherwise election/party references and validated current Redis events can be read with an explicit non-durable basis. Latest events require exact visible event revision and source-capture binding; unavailable/mismatched claims are withheld. Historical records are labeled as historical, not live decisions. Public publication text remains withheld pending the later source/edition publication-promotion gate; current output is metadata/reference IDs. Raw source quotations/captures/import audits/private storage keys are removed in all exports. Source-specific redistribution rights are not a blanket license.

Responses use `no-store`, including live claims and failures. The shared Redis budget is600 APIrequests/minute plus60/client/minute. Vercel's overwritten `x-vercel-forwarded-for` is used only when running on Vercel; arbitrary forwarding headers elsewhere are ignored. Client keys are HMAC-hashed with a daily scope, expire with the counter, and contain no raw IP. A denied client does not consume the global bucket. Missing rate storage fails closed. No raw IP or signature is logged.

## Private subscriptions and email

`SUBSCRIPTIONS_ENABLED` and `SUBSCRIPTION_DELIVERY_ENABLED` remain off. A configured path additionally requires all of: PostgreSQL schema002;32 byte base64 `SUBSCRIPTION_ENCRYPTION_KEY`; at least32 character `SUBSCRIPTION_TOKEN_SECRET`; canonical HTTPS `SUBSCRIPTION_SITE_ORIGIN`; published `SUBSCRIPTION_CONSENT_VERSION`; `RESEND_API_KEY`; `RESEND_FROM`; verified sending-domain proof and `RESEND_DOMAIN_VERIFIED=true`; and `RESEND_WEBHOOK_SECRET`.

POST `/api/subscriptions`: `{email,locale,topics,consent:true}` returns a generic202 accepted result. Current topic values are `digest|results|formation|policies`; locale is one of all7 site editions. Only a requested confirmation is queued before verification. Existing confirmed addresses are not exposed or silently changed. Address-level cooldowns and shared30/hour plus3/client/hour signup limits bound requests. Settings/confirmation actions have their own shared/per-client limits. Missing provider/database configuration returns503 without claiming a send.

POST `/api/subscriptions/confirm` consumes a one-use,24 hour confirmation token. It returns separate preferences/unsubscribe tokens; consent is not active until this succeeds. POST `/preferences` reads/updates locale/topics with its scoped token; POST `/unsubscribe` suppresses immediately and is idempotent. Human email links point to `/subscriptions/{confirm,preferences,unsubscribe}?token=...`; UI pages must call the POST action and set no-referrer/no-telemetry handling. GET never mutates consent, protecting against link scanners. RFC8058 one-click POST uses the scoped APIunsubscribe URL. Tokens are random256 bit values; only purpose-bound HMAC hashes are stored, while pending delivery tokens are encrypted. Addresses and delivery bodies use AES256-GCM. Private recipient tables are in `political_private`, separate from append-only public records.

The worker consumes recipient-free publication intents. It only queues confirmed current publications whose referenced primary facts remain current and whose exact-revision language edition is ready. Unsupported/unavailable source qualification blocks sends; stale live formation facts are checked against the current redacted Redis projection. Locale-specific fanout is resumable in25 recipient pages, so an unavailable edition does not block a ready language. Subscribers confirmed after a publication are excluded from that publication's fanout. It rechecks consent, topic/language selection, source eligibility and correction status immediately before sending. An obsolete/withdrawn queued message is suppressed. Correction publications use a separate revision/key and localized correction label. No open/click tracking is requested.

`ResendMailProvider` uses the documented `/emails` API and a stable per-delivery idempotency key. The provider's documented deduplication window is24 hours; retries stop after23 hours from queue creation and move to an ambiguous/manual-review state rather than risking a duplicate. Attempts are bounded; the signed delivery worker uses a45 second budget and at most5 send attempts. Transactional templates include all7 languages. Actual deliveries are not operationally verified because no sending service/domain is configured.

POST `/api/subscriptions/webhook` verifies the raw request with official Svix signature verification before accepting provider events. Persisted webhook IDs make replay idempotent. Bounces/complaints suppress the matching stored provider message's subscriber; an unsubscribe cannot downgrade hard suppression. This endpoint cannot add recipients or publish facts. Before activation, prove real signed bounce/complaint events, suppression/unsubscribe races, domain authentication, provider limits, unsubscribe UI, retention/key-rotation procedures and least-privilege roles in a private preview rehearsal. No real contacts may be imported or sent mail without verified consent.

## Explicit commands and recovery

No application request runs DDL. Configure a separate approved development/preview database before explicit application:

```powershell
npx tsx scripts/election-lifecycle/political-record.ts schema
npx tsx scripts/election-lifecycle/political-record.ts schema --apply --target=preview
npx tsx scripts/election-lifecycle/political-record.ts backfill --ledger=C:\private\ledger.json
npx tsx scripts/election-lifecycle/political-record.ts backfill --ledger=C:\private\ledger.json --archive=C:\private\captures --apply --target=preview
npx tsx scripts/election-lifecycle/political-record.ts compare --ledger=C:\private\ledger.json --apply --target=preview
npx tsx scripts/political-platform/run.ts collect
npx tsx scripts/political-platform/run.ts collect --run --target=preview
npx tsx scripts/political-platform/run.ts deliver --run --target=preview
```

The schema command covers001,002 and003. CLI commands refuse production targets/environments and emit only counts/status, never keys, addresses, tokens, raw provider messages or source assertions. Signed production worker modes remain off until reviewed configuration/activation; these commands do not authorize production migrations.

For a later real PostgreSQL backup/restore rehearsal, use separately restricted libpq service entries (no credentials in command text), a private destination and an isolated restore database:

```powershell
pg_dump --dbname="service=political_record_preview" --format=custom --file=C:\private\political-record.dump
pg_restore --dbname="service=political_record_restore" --no-owner --no-acl --single-transaction C:\private\political-record.dump
```

Then run revision/hash/count comparisons, private Blob authenticated-read checks, correction/as-of/pinned replay, transactional outbox replay and application-role UPDATE/DELETE/TRUNCATE/DDL denial. Protect the dump and encryption keys separately; do not use a public Blob bucket or commit a dump. This restore procedure has **not** been executed; PGlite tests prove local SQL behavior, not production recovery, role isolation or concurrent delivery guarantees. Block cutover until the actual rehearsal passes.

## Cost/readiness boundaries and follow-on work

No paid service, domain, key or schedule was added. PostgreSQL/Blob/email credentials are absent in the inspected deployment metadata. Review Neon compute/storage/restore/transfer, private Blob storage+PUT/GET/transfer, and Resend recipient volume before provision. Automatic mirror's2 MB/cycle cap gives at most16 MB/day at regular3 hour cadence before content deduplication; election-night40 slots could reach80 MB. This is an upper bound, not a measured bill. Daily digests to1000 recipients are about30000 recipient emails/month before alerts/corrections/confirmations. Use the latest official pricing and the source/service evidence in the parent planning document; do not infer a fixed total from a headline tier.

This slice does not claim complete platform delivery: typed party/issue/place follows and digest-versus-major-event taxonomy, public bulk manifests/downloads/embeds, qualified publication-text promotion, typed publication promotion and distribution are subsequent bounded work. Announcement/workspace, commitment and qualified parliament paths are now implemented below, but not deployed or source-qualified merely by this code. CBS observations are election-independent (`electionId:null`) and must enter that global projection rather than being miscast as current-election facts. Current-only source adapters are not automatically qualified for another edition. Count-informed probabilities remain validation gated. Existing production schedules, source limitations, immutable forecast artifacts and shared pins are unchanged.


## Qualified global records and dynamic election workspaces

`getPoliticalPlatformReadModel().global` is independent of the current election. It exposes typed CBS observations, commitment evidence chains and assessments, source-qualified member/bill/government records, and an explicit storage/source state. No membership is inferred from seats. `loadGlobalProjection` reads a fixed PostgreSQL insertion watermark with per-kind windows; `complete:false` discloses truncation. A missing/unqualified Knesset contract produces no parliamentary facts. Rehearsal contracts are excluded from public qualified projections. Actual legacy/v4 Knesset endpoints returned HTML maintenance in the recorded source investigation; no production parliament contract is installed.

`storeParliamentContract(repository, definition, archive, now, fetcher)` requires live XML metadata plus captured primary documentation for every mapped field. `collectParliament` rechecks that schema, validates a complete bounded JSON page, and atomically appends document revisions and its continuation cursor. Same-origin, same-entity pagination only; absence from a partial page never ends a membership. The signed `platform_parliament` worker and `parliament` CLI process one configured contract/page per call. Configure these only after confirming actual source semantics. The contract adapter does not guess OData entity or column names from third-party examples.

`ingestPromise` imports an exact captured own-party quote from the verified source registry. `saveCommitment` links immutable evidence revisions; `saveCommitmentRubric` requires an explicit versioned methodology and qualified observation reference. The read model shows the evidence chain even without a rubric. Assessments have no overall score; missing evidence is not assessable, future deadlines are not yet due, conflicting observations remain mixed evidence, and measured outcomes do not establish causation. Rubrics use explicit metric/scope/unit/base period/deadline/assessment period; corrections append revisions rather than rewriting earlier assessments.

The fixed CEC index discovery path accepts one explicit term/date notice, rejects proposed/test/conflicting dates, saves a private capture, and creates a date-only draft when no closing time has been authoritatively supplied. It does not invent future polling hours. `platform_workspaces` (signed existing worker) or the `workspaces` CLI stages announced editions and checks one candidate per call. Activation additionally requires PostgreSQL round-trip in an edition namespace, all seven deployed edition/locale markers, retained historical routes and pinned revisions, and an authenticated read of the actual private announcement capture. The pointer changes with compare-and-append; concurrent stale activators retry. No source/model/count/formation capability is enabled by basic workspace activation. The old26 live political collector stops when another workspace becomes current, avoiding mislabeling new-election positions as26; explicit older seats/pins remain addressable. Global government/indicators do not move with the election pointer.

```
npx tsx scripts/political-platform/run.ts parliament
npx tsx scripts/political-platform/run.ts workspaces
npx tsx scripts/political-platform/run.ts workspaces --run --target=preview
```

All new flags remain unset/off. The site origin is deployment configuration, never caller input. Preview protection bypass is forwarded only in preview and never returned. Local/PGlite rehearsal uses `captureElectionAnnouncement(..., rehearsal=true)` and separate rehearsal pointer; production rejects rehearsal activation. Tests exercise synthetic27→28 succession, retained dynamic historical workspace pins, missing locale markers, private capture outage, idempotence and CAS conflicts. These are executable local rehearsals, not authentic future announcements or production readiness proof. No schedules or production pointers were changed. Read-only registry outages expose unavailable state and retain a process last-good registry when present; a cold enabled outage never silently claims26 as current.

Current bounded limits are explicit: registry/projector queries disclose incomplete windows rather than certifying an unbounded history, route probes examine at most50 historical routes per candidate, and automatic collection requires signed invocations to be operationally scheduled later. A draft basic edition has no automatically qualified future party list, exit calibration, CEC finality contract, count model, or live formation claims. Public v2 rejects unqualified future party entities. Existing API bulk archives/embeds, topic follows and public publication-text promotion remain follow-on work.
