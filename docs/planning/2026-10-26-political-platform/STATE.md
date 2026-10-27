# Political platform implementation state

Updated October 27, 2026, 00:54 UTC. The [six-milestone plan](PLAN.md) is approved and implementation continues with Sol 6.1 agents. This is a preview release, not a production migration.

## Current state

- Preview branch: `codex/political-platform-preview`, latest deployed commit `a7953df`.
- Integrated: election readiness, stable identities and append-only records, private-capture adapters, qualified formation/government/parliament/policy contracts and views, measurable commitment rubrics, public API/bulk exports, subscriptions/delivery controls, device-local opt-in recommendations, future-election activation guards, independent monitoring, localized reference/search/exports/embeds.
- Backend agent: automatic producer integrated at `d15a8e6`; real preview storage rehearsal passed. Full-ledger monitoring is integrated. Actual CBS collection passed; the hosted publication rehearsal stopped on a numeric-validation rejection, under repair with bounded retries and private diagnostic evidence.
- UI agent: party index/PartyMap and ballot interactions integrated in seven languages at `7b8cf83`, including future-edition roster isolation. Start is integrated in seven languages. Match is frozen for integration review. The remaining vote map, history, timeline, glossary, resources and corrections interactions are in progress; About has localized wrappers with reviewed prose still pending. Full site parity is not complete.
- Root: integration, source/service qualification, release gates and documentation. No application implementation by Astra.

## Verified evidence

Latest full integrated suite: **1,195 tests in 157 files**, isolated TypeScript and diff checks pass. Producer production build passed. The subsequent exact-host signing guard has four focused tests passing. Hosted `a7953df` is Ready at `https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app`. [Draft PR #29](https://github.com/RavBogard/israelielection/pull/29) is attached to this task.

UI checks include seven-language mobile readiness; 57 reference cases; 28 subscription routes/actions; 14 briefing routes; keyboard search; future-edition/late-response isolation; 28 embed/export cases; 14 qualified-record fixture views; eight follow/preference cases; and nine final export-method/future-branding cases. Hebrew dark/mobile rendering and overflow were inspected. Fixtures were not published as facts.

Database tests execute the exact migration DDL in PGlite, including append-only restrictions, idempotence, rollback, cursors and provenance. The subsequent real Neon/Blob rehearsal passed: migrations001–006, restricted-role denials, concurrent CAS/idempotent record/outbox/edition writes, exact logical-core restore into a separate database, private-object authenticated readback, anonymous403 and corrupt-hash rejection. A third isolated runtime database uses a restricted branch-only URL; it now contains two actual CBS observations, with no QA fixtures. Provider PITR and subscriber/PII recovery are not certified by this core-record rehearsal. Mail gates remain below.

Briefing verification uses captured article bodies, exact numeric/quote support, independent atomic-claim review and two independent reporting origins for factual developments/context. Individually failed claims are omitted; 1–8 verified claims can form a limited-coverage edition, zero cannot publish. Single-source perspectives remain attributed. Hosted dry-run [40418677784](https://github.com/RavBogard/israelielection/actions/runs/40418677784) qualified three claims and five translated editions; Chinese remained pending. No publication or notifications. Fresh post-contract dry-run40426009349 also passed: five of sixteen article captures, three independently qualified claims and five of six translated editions (Chinese pending), with no publication or notification.

Independent monitoring rehearsal [40422558173](https://github.com/RavBogard/israelielection/actions/runs/40422558173) passed seven rendered-browser checks (21 page views) and US/Germany/Israel HTTPS/TLS probes. Israel's locale redirect was followed successfully. Briefing/notification jobs were skipped; artifacts are redacted. The separate 15-minute monitor schedule is implemented but disabled, and private incident persistence is unconfigured.

## Translation work

Five independently reviewed seats-guide editions are published to the preview ledger: Persian, Hebrew, corrected/re-reviewed Chinese, Arabic and French. German remains pending. The reviewed Hebrew seats chart has 71 labels and passed actual mobile rendering. Never publish the earlier Chinese candidate with a stale review.

- Prose batch `40417641522`: running, 132-edition/120-minute cap, two workers, 22 source documents.
- Widget batch `40421287094`: queued behind prose, 126-edition/120-minute cap, 21 chart sources; already-current editions are skipped.

Only independently validated artifacts can be published. Rejected/deferred editions remain explicitly pending with original-language access. Full source hashes include chart data; translations cannot change numbers, URLs or executable content. Remaining legacy interactive pages also need registered/reviewed content, not route wrappers alone.

## Activation gates and constraints

Current production Redis/QStash collection and the approved 15-minute-first-ten-hours then three-hour cadence remain authoritative. Forecast artifacts and count-calibration gates are preserved. No production deployment, database cutover or actual email send has occurred for this platform expansion. Preview-only Neon/private Blob provisioning was explicitly approved; no paid plan upgrade was made.

Approved preview Neon/private Blob qualification is documented in [Sources and services](SOURCES-AND-SERVICES.md). Storage, core restore and restricted-role checks passed. The initial owner credentials were removed from hosted environments and rotated; old direct/pooled logins fail while the restricted runtime remains valid. Only preview collection and publication-producer flags are enabled for bounded rehearsals. Public reads, API, subscriptions, email, discovery, activation and new recurring schedules remain off. Actual publication replay is under test. Sender-domain/test-recipient approval, email delivery/suppression/unsubscribe/correction races, provider PITR and subscriber recovery remain separate gates. Production cutover is not authorized.

Knesset/parliamentary and procedural-law sources remain unqualified because their actual endpoints returned maintenance/access restrictions. CBS CPI has a real qualified structured sample; observation periods/base units are preserved and no causal claims are made. No missing source is replaced with invented facts. Count-informed probabilities remain disabled without held-out replay/calibration evidence.

## Next actions

1. Repair the observed producer numeric-validation failure, then use audited recovery on the same preview job and verify exact reviewed publication replay. Actual CBS collection, full-ledger source monitoring, storage and briefing dry-run have passed.
2. Continue remaining locale-route milestones and publish only qualified translation artifacts.
3. Complete approved real-service rehearsals when available; retain explicit unavailable states otherwise.
4. Present the tested preview and draft PR with implementation versus activation gaps clearly separated. Do not call the roadmap complete while these gates or route/content work remain.

Existing unrelated research, outreach, attachments and artifacts are untouched. Exact frozen path manifests and verbose test/QA logs are in ignored `.vercel/`; only task-owned files enter the preview branch.
