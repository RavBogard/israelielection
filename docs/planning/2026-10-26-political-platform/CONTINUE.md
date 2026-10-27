# Continuation — political platform preview

Updated 2026-10-27. Sol 6.1 implemented and integrated this release. Do not restart the audit or provision services.

## Checkout and release

- Main workspace: `C:/Users/dsbog/israelielection`; preserve unrelated user work.
- Release worktree: `C:/Users/dsbog/.codex/worktrees/political-platform-preview/israelielection`, branch `codex/political-platform-preview`. Main/production remain unchanged.
- Build snapshot: main `.vercel/platform-preview-path.txt`. Approved-path manifest: `.vercel/final-platform-manifest.txt`.
- Preview: https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app . Latest branch commit/status identifies its immutable deployment.

## Completed and verified

- Real CBS collection produced one publication with seven independently reviewed editions. Seven-language API/economy/changes source, unit, period and privacy checks passed; English ETag returned304.
- Real preview logical core and synthetic subscription-state restore passed. Six private captures were copied and recovered under separate keys. This is same-store logical recovery, not provider PITR/account-loss/key-loss recovery.
- Resources, VoteMap, timeline and party-history interactions now have seven-language routes/controls, original-language factual text explicitly marked while exact-revision translations remain pending, stable historical IDs and locale-preserving links.
- Final combined local gate: **1,256 tests/172 files passed**, full TypeScript passed, optimized Next build passed. Scoped lint passed; CSS is outside the ESLint matcher.
- Map/Resources seven-language browser checks and eight EN/HE historical desktop/mobile interaction checks passed. Timeline edge-hit-area overflow was fixed.
- Actual mobile ChangesPage checks exposed a long source URL overflow. Wrapping was fixed and locally proved in both languages; final deployed confirmation is in the receipt below.
- Local ignored receipts: `.vercel/platform-preview-read-qa.receipt.json`, `.vercel/platform-preview-mobile-qa.receipt.json`, `.vercel/history-preview-qa.receipt.json`. Failed/missing receipts are unfinished gates.

## Remaining gates

1. Many prose/tool translations remain pending or rejected. Exact source hashes, protected numbers/links and independent review still govern publication. Existing bounded runs40421287094 and40430871011 may finish independently: inspect artifacts once if needed; do not launch new runs or blindly retry. Timeline/history factual originals remain labeled pending.
2. Resend account/sender approved; sole test recipient is recorded privately in task authorization. Account/key/domain/webhook qualification remains unavailable. No real email sent. Never connect a real sender to synthetic QA subscribers; later tests need an exact recipient allowlist and isolated cohort. Never request keys in chat.
3. Knesset/President/current CEC and some party sources remain blocked/maintenance/unqualified. Do not invent official seats, government events, operative legal deadlines, membership or bills. CBS CPI is qualified; outcomes do not imply causation.
4. No main/production push, database cutover, new paid service, schedule or production activation. Redis/QStash and the frozen forecast remain authoritative. Count-informed probabilities stay gated. Registry activation/discovery, subscriptions and delivery remain off.
5. Provider PITR, independent account/region backup, key-disaster recovery, ongoing retention and production RPO/RTO remain unqualified. Preview resources/receipts are preserved.

## Safe continuation

- Dev3116 stopped. Run focused checks for a new change; repeat the full suite/build only when relevant changes justify it.
- Read-only remote checks use existing private environment files without printing them:
  `node --env-file=.vercel/platform-services.private.env --import tsx scripts/political-platform/preview-read-qa.ts --run --mobile-only --mobile-dark`
  `node --env-file=.vercel/platform-services.private.env --import tsx scripts/political-platform/history-browser-qa.ts --run`
- Helpers require preview environment/exact owned host. They perform no provider calls, job recovery, source mutation or email.
- Secrets/private backups remain ignored under `.vercel/`; none are in this note. The preview owner credential rotation is already qualified; do not repeat it. Restricted runtime remains unchanged.
