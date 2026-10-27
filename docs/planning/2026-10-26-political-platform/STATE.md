# Political platform implementation state

Updated October 27, 2026, 01:25 UTC. The [six-milestone plan](PLAN.md) is approved. Implementation uses Sol 6.1 agents. This is a preview release, not a production migration.

## Current state

- Preview branch: `codex/political-platform-preview`; latest deployed commit `bcdf028`. [Draft PR #29](https://github.com/RavBogard/israelielection/pull/29) is attached.
- Implemented: election readiness, stable identities/append-only records/private captures, qualified formation/government/parliament/policy contracts and views, measurable commitment rubrics, API/bulk exports, subscription/delivery controls, device-local opt-in recommendations, future-election guards, independent monitoring, localized reference/search/exports/embeds.
- UI: party index/PartyMap, ballot, Start and Match have seven-language interactions. Match scores/IDs remain invariant; analytics are disabled before answer URLs enter browser history, with sensitive-referrer guards. Glossary and reviewed-prose layout are integrated. Remaining interactions: corrections, timeline, party history, resources and vote map. Reviewed prose/chart/tool coverage is still incomplete; pending editions retain explicit original-language access.
- Backend: actual CBS collection and English plus five other independently reviewed publication editions succeeded. French was correctly held at the numeric gate because a valid series identifier was not recognized; exact failed drafts are privately captured. The narrow typed-identifier repair is frozen for integration, followed by audited recovery of the same job.
- Root owns integration/review and operations; no application implementation by Astra.

## Verification

Latest completed full integrated suite: **1,206 tests in 160 files** at the Match/privacy integration. Later typed-number checks passed28 tests; reviewed-prose/referrer checks passed57 tests. Isolated TypeScript and scoped lint pass. Hosted `bcdf028` is Ready. The glossary/recovery/identifier suite passed1,218 tests with one stale navigation assertion; that assertion was corrected and its seven focused tests passed. GitHub CI and hosted build pass at `bcdf028`.

Preview: https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app

Bounded browser evidence covers mobile/RTL/keyboard behavior across the changed surfaces, source-language/pending states, unknown lists, future-edition isolation, exports/embeds and questionnaire share/reload/privacy. Real reviewed Chinese American Lens and Hebrew voting articles were inspected after restoring the native article frame. Fixtures have not been published as political facts.

Real approved Neon/private Blob qualification passed:

- Exact migrations001–006, restricted-role denials, owner append-only enforcement and atomic rollback.
- Concurrent CAS/idempotent record/outbox/edition writes, exact logical-core restore, authenticated private captures, anonymous403 and corrupt-hash rejection.
- Separate synthetic subscriber rehearsal: exact five-table restore; copied-object recovery without original-key fallback; preserved consent, token consumption, unsubscribes, bounce/complaint suppression and delivery/fanout/webhook deduplication. Replay sent zero duplicate messages. No real mail or runtime-database connections occurred in this rehearsal.
- Hosted collector stored two actual CBS observations. All seven locale editions passed independent review with archived evidence; values and observation/base periods remain intact. First collection did not create historical alerts.

These checks do not certify provider PITR, independent-account/key disaster recovery or production recovery objectives. Owner credentials were removed from hosted environments and rotated; old direct/pooled logins fail, while the restricted runtime remains valid.

Briefing dry-run40426009349 qualified three independently verified atomic claims and five translated editions; Chinese remained pending. No publication or notification. Claims retain exact numeric/quote support and independent-source/semantic requirements; individual failures are omitted and zero qualified claims cannot publish.

Monitoring rehearsal40422558173 passed21 rendered views and US/Germany/Israel HTTPS/TLS checks. Private persistence was unconfigured in that rehearsal. The separate15-minute monitoring schedule remains disabled.

## Translation work

The original five reviewed seats-guide editions plus28 newly validated prose editions are in the preview ledger; seats-guide prose now covers all six additional languages. One reviewed Hebrew seats-chart edition is published. Never publish the earlier Chinese seats candidate with a stale review.

- Completed prose run40417641522:28 validated,56 rejected,43 deferred,5 already-current skipped. Only validated artifacts were published.
- Widget run40421287094: running,126-edition/120-minute cap,21 sources, two workers; current editions skipped.
- Deferred policy prose run40430871011: queued,42 editions/120-minute cap, seven issue documents, all six additional locales. These were never attempted in the first run; no blind retry of rejected content.
- One deferred Chinese who-votes edition and rejected tool/prose candidates remain pending. Tool quiz pilot failed numeric invariants and was not published.

Translation readiness requires exact source hashes, protected numbers/links/executable content and independent review. Localized route wrappers do not establish prose parity.

## Activation and access boundaries

Production Redis/QStash and the approved15-minute-first-ten-hours then three-hour cadence remain authoritative. No production deployment/cutover, new recurring schedule, probability-calibration bypass or real email send occurred for this expansion.

Preview-only Neon/private Blob was explicitly approved. Preview collection/producer flags are active. Branch-only database-read/API flags and a sensitive server cursor key are active. Actual API checks returned200 in all seven locales and304 on ETag revalidation; all seven economy views preserved exact source/units/periods with no private data leaks. /changes omitted global publications; a bounded feed fix is underway. Registry/discovery/activation/subscription/send flags remain off.

User approved the existing Resend account, sender `updates@israelvotes.org`, and the sole privately authorized test recipient for confirmation/digest/correction/unsubscribe tests. No paid upgrade or other recipients are authorized. Authentication/key access is still missing: user is on a phone and cannot sign in to the desktop browser. A secure phone-accessible Vercel environment setup link was provided; never request an API key in chat or re-ask recipient permission.

Knesset/parliamentary and procedural-law sources remain unqualified due actual maintenance/access restrictions. CBS CPI is qualified with preserved units/period/base and no causal claims. Count-informed probabilities remain disabled without held-out replay/calibration.

## Next actions

1. Finish the verified /changes global-publication gap, then recheck its seven locale views against the actual publication.
2. Finish the remaining five legacy interactions and publish only independently qualified translation artifacts as bounded runs finish.
3. Run real email/domain/webhook checks once secure Resend access is available, using only the approved sender/recipient.
4. Present implementation versus activation/content gaps clearly. Production release/cutover is a separate approval; the roadmap is not complete while required work remains.

Exact frozen manifests and verbose QA logs are in ignored `.vercel/`. Existing unrelated research, outreach, attachments and artifacts remain untouched.

## Final Sol preview integration

Resources, VoteMap, timeline and party history now have seven-language interaction routes and explicit original/pending factual-text semantics. Combined gate:1,256 tests/172files, full TypeScript and optimized Next build passed. Map/Resources seven-language and historical EN/HE desktop/mobile checks passed. Actual seven-language database/API/Changes/economy reads passed. The known mobile source-URL wrap fix awaits final deployed confirmation in the local mobile receipt. See [CONTINUE.md](CONTINUE.md) for exact remaining translation, service, source and production gates. No production release or real email occurred.
