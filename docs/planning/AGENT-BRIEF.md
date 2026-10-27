# Agent brief: israelielection (standing)

- Repo: RavBogard/israelielection, Next.js 16 (read node_modules/next/dist/docs before using unfamiliar APIs). Production deploys on every push to main (Vercel, ~3 min).
- Never work in C:/Users/dsbog/israelielection (stale dirty checkout). Each builder works in its own git worktree created from origin/main: `git -C C:/Users/dsbog/israelielection worktree add ../ie-<slice> origin/main -b live/<slice>`, then make a junction for node_modules: PowerShell `New-Item -ItemType Junction -Path <wt>\node_modules -Target C:\Users\dsbog\israelielection\node_modules`. Run `node scripts/build-briefings-index.mjs` once before tests.
- Seven editions share components: en (app/(en)), he, ar, fa, de, fr, zh. Strings live in lib/i18n/<lang>/*.ts and lib/i18n/*.ts. Every new user-visible string needs all seven; write Hebrew fresh in natural Israeli Hebrew. RTL for he/ar/fa.
- Design identity: the 120-seat grid with the 61st marked; bloc colours via `var(--b-<bloc>)`; no all-caps labels, no arrows on links, no middle-dot meta strings, no numbered markers; data in colour, never grey shades. Graphic leads; no explanatory text above it. Mobile 320px with no horizontal overflow; dark mode.
- Data honesty: never invent figures. Exit polls are `kind:"exit"` rows in data/polls.json (lib/data.ts `exitPolls`). Channel 14 and i24NEWS (pollsFile.config.withoutVariant.pollsters) are always shown set apart and never enter the forecast or averages.
- The vote matcher never recommends a list.
- Checks (local, targeted only): `npx tsc --noEmit` (ignore PageProps/LayoutProps errors from missing generated route types), the changed/new vitest files plus `lib/data.test.ts lib/polls.test.ts`. Never run the full suite. New tests assert behaviour/roles/test IDs, not copy.
- Commit format: `<area>: <what>` body explains why; end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push your branch, open a PR to main with `gh pr create`, and STOP. Do not wait on CI, do not merge.
- Report under 15 lines: PR number, what changed, what you could not do, any wording you chose that the lead should check.
