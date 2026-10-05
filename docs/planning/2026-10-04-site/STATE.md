# israelielection.org — build state

Plan: `docs/00-PLAN.md`. This file logs decisions and gates (standing authority, 2026-07-25).

## Phase 1: repo, port, shell (2026-10-04)
The plan has no numbered phases. Phase 1 is read as the Code lane's first block: repo setup, the
port of the two artifacts onto shared data, and a deployable site shell. Jobs (polls, news,
briefing) are phase 2.

Done:
- Repo initialized locally, remote `RavBogard/israelielection` (was empty).
- Next.js 16 (App Router, TS, Tailwind 4) at repo root; Node 24.
- `data/parties.json` (15 parties), `data/polls.json` (4 averaged polls + Channel 14),
  `data/pledge-rules.json` (6 rules). Extracted by `scripts/port-artifacts.mjs` from the v2
  artifact's own literals; the two artifacts' profile data were byte-identical.
- Pledge warnings: if-statements → declarative rules (`lib/coalition.ts`), parity-tested.
- Routes: `/` (two front doors), `/coalition`, `/parties`, `/parties/[id]` (15 static pages).
- Tests: vitest, 15 passing (tally, pledge parity, data integrity, all averaged polls = 120).
- CI: `.github/workflows/ci.yml` (lint, test, build, typecheck).
- Visual check at 1440px and 390px: builder, drawer, map. No horizontal scroll.

## Gates and decisions
- GATE: phase 1 scope as above. Proceeded because the plan names no phases and this is the
  prerequisite for everything else.
- GATE: AI provider is Gemini, not Anthropic (Daniel, 2026-10-04, mid-session; supersedes the
  plan's "Anthropic API for the jobs"). Model `gemini-3.8-flash`, verified as the stable ID on
  ai.google.dev/gemini-api/docs/models. Config in `lib/ai.ts`; key `GEMINI_API_KEY` is in Vercel
  and GitHub secrets. `gemini-smoke.yml` (manual) checks the key + model.
- GATE: deploy authorized by Daniel, 2026-10-04 ("deploy at will when ready").
- GATE: copy edits made in porting (meaning unchanged):
  - Public footers drop "CRC" and the internal note "check wording before quoting on a slide";
    now: "their wording has not yet been checked against the originals." (Same caveat, public
    phrasing; site is not CRC-branded.)
  - Poll note "The poll's own bloc count" → "Seats by bloc in this poll", computed from data;
    it now also lists "Between the blocs" where the original omitted it for Maariv/C13/Kan.
  - Zman's "unaligned 5" is shown as "Between the blocs 5" (same party: Reservists–Economic).
- GATE: added features not in v2 (small, reversible): shareable coalition URL
  (`?poll=…&with=…`) with a copy-link button; Party Map selection written to `#id`; per-party
  static pages linked from each profile.
- Home page copy is neutral site copy, not Daniel's voice. About/method page NOT written: it's
  Daniel's (plan §Authority).

## For Daniel
- About/method page text; license for teach-it (CC BY-NC proposed).
- Domain: metadataBase is set to https://israelielection.org; connect the domain in Vercel.
- Doc 09 open items (quotes seen through summaries, Kan Shas/UTJ, C14 dates) carry over and
  are flagged on the pages.

## Next (phase 2)
- Polls job + validator (sum 120, pollster whitelist, fieldwork date, ≤5-seat move, below-threshold
  flagged); auto-commit on pass, PR + email on fail.
- News RSS page (ISR 15 min). Daily briefing (Gemini), sourced per sentence, emailed.
- Reference pages: system mechanics, tribes, issues, timeline, glossary, sources/method.
