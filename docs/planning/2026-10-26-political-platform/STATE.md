# Political platform implementation state

Updated October 27, 2026, 00:14 UTC. The [six-milestone plan](PLAN.md) is approved and implementation continues with Sol 6.1 agents. This is a preview release, not a production migration.

## Current state

- Preview branch: `codex/political-platform-preview`, latest integrated commit `e600cf2`.
- Integrated: election readiness, stable identities and append-only records, private-capture adapters, qualified formation/government/parliament/policy contracts and views, measurable commitment rubrics, public API/bulk exports, subscriptions/delivery controls, device-local opt-in recommendations, future-election activation guards, independent monitoring, localized reference/search/exports/embeds.
- Backend agent: finishing the automatic verified-publication producer, archived briefing/locale replay, correction/withdrawal handling and active-source health signalling.
- UI agent: final export-method translations, edition-aware branding and evidence timestamps are integrated. Now implementing localized party index/PartyMap and ballot interactions. Remaining legacy destinations include Start, Match, vote map, party history, timeline, glossary, resources and corrections; seven-language site parity is not complete.
- Root: integration, source/service qualification, release gates and documentation. No application implementation by Astra.

## Verified evidence

Latest integrated suite: **1,152 tests in 149 files**, isolated TypeScript and diff checks pass. Prior full production build passed; every pushed integration through `2de56f8` has confirmed hosted build success. The latest `e600cf2` deployment still needs confirmation.

UI checks include seven-language mobile readiness; 57 reference cases; 28 subscription routes/actions; 14 briefing routes; keyboard search; future-edition/late-response isolation; 28 embed/export cases; 14 qualified-record fixture views; eight follow/preference cases; and nine final export-method/future-branding cases. Hebrew dark/mobile rendering and overflow were inspected. Fixtures were not published as facts.

Database tests execute the exact migration DDL in PGlite, including append-only restrictions, idempotence, rollback, cursors and provenance. This is not a provisioned PostgreSQL restore/concurrency test. Real storage and mail gates remain below.

Briefing verification uses captured article bodies, exact numeric/quote support, independent atomic-claim review and two independent reporting origins for factual developments/context. Individually failed claims are omitted; 1–8 verified claims can form a limited-coverage edition, zero cannot publish. Single-source perspectives remain attributed. Hosted dry-run [40418677784](https://github.com/RavBogard/israelielection/actions/runs/40418677784) qualified three claims and five translated editions; Chinese remained pending. No publication or notifications. A new dry-run is due after the final archive/producer contract changes.

Independent monitoring rehearsal [40422558173](https://github.com/RavBogard/israelielection/actions/runs/40422558173) passed seven rendered-browser checks (21 page views) and US/Germany/Israel HTTPS/TLS probes. Israel's locale redirect was followed successfully. Briefing/notification jobs were skipped; artifacts are redacted. The separate 15-minute monitor schedule is implemented but disabled, and private incident persistence is unconfigured.

## Translation work

Five independently reviewed seats-guide editions are published to the preview ledger: Persian, Hebrew, corrected/re-reviewed Chinese, Arabic and French. German remains pending. The reviewed Hebrew seats chart has 71 labels and passed actual mobile rendering. Never publish the earlier Chinese candidate with a stale review.

- Prose batch `40417641522`: running, 132-edition/120-minute cap, two workers, 22 source documents.
- Widget batch `40421287094`: queued behind prose, 126-edition/120-minute cap, 21 chart sources; already-current editions are skipped.

Only independently validated artifacts can be published. Rejected/deferred editions remain explicitly pending with original-language access. Full source hashes include chart data; translations cannot change numbers, URLs or executable content. Remaining legacy interactive pages also need registered/reviewed content, not route wrappers alone.

## Activation gates and constraints

Current production Redis/QStash collection and the approved 15-minute-first-ten-hours then three-hour cadence remain authoritative. Forecast artifacts and count-calibration gates are preserved. No production deployment, database cutover, service purchase or actual email send has occurred for this platform expansion.

A concrete preview-only free Neon/private Blob rehearsal is prepared in [Sources and services](SOURCES-AND-SERVICES.md). Approval is requested before provisioning. Required real checks: PostgreSQL app-role restrictions and concurrency; backup/restore into an isolated database; private Blob authenticated readback/public inaccessibility; exact publication replay; approved sender-domain/test-recipient setup, delivery deduplication, suppression webhooks and unsubscribe/correction races. Production cutover is a separate gate.

Knesset/parliamentary and procedural-law sources remain unqualified because their actual endpoints returned maintenance/access restrictions. CBS CPI has a real qualified structured sample; observation periods/base units are preserved and no causal claims are made. No missing source is replaced with invented facts. Count-informed probabilities remain disabled without held-out replay/calibration evidence.

## Next actions

1. Integrate the frozen automatic producer/source-health slice; run focused review, full tests, isolated typecheck/build and one fresh safe briefing dry-run.
2. Continue remaining locale-route milestones and publish only qualified translation artifacts.
3. Complete approved real-service rehearsals when available; retain explicit unavailable states otherwise.
4. Present the tested preview and draft PR with implementation versus activation gaps clearly separated. Do not call the roadmap complete while these gates or route/content work remain.

Existing unrelated research, outreach, attachments and artifacts are untouched. Exact frozen path manifests and verbose test/QA logs are in ignored `.vercel/`; only task-owned files enter the preview branch.
