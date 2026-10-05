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

## Rulings received 2026-10-04 (evening)
- Home page is the playable Coalition Builder; teaching materials moved one level down to /teach.
  /coalition 308s to / (query kept), so earlier shared links still work.
- Footer: "A project of Rabbi Daniel Bogard" linking to danielbogard.com.
- License approved: CC BY-NC 4.0 for teaching materials (footer + /teach).

## For Daniel
- About/method page text.
- Domain: live at https://www.israelielection.org (apex 308s to www); metadataBase matches.
- Doc 09 open items (quotes seen through summaries, Kan Shas/UTJ, C14 dates) carry over and
  are flagged on the pages.

## Phase 2 (started 2026-10-04, evening)
- Footer line "Learning, not advocacy…" removed (Daniel). Nav: Coalition Builder, Party Map, Polls, Teach it.
- GATE: polls are read from Wikipedia by a deterministic wikitext parser (`lib/wikipolls.ts`),
  not by the LLM. Proceeded because the tables are structured and a parser cannot invent a
  number; the plan's validator is unchanged and is the gate either way. Gemini is used where
  language is needed (briefing).
- GATE: import window starts 2026-09-05 (`data/poll-sources.json` importFrom). Proceeded
  because earlier Wikipedia tables have different party lineups (RZP and Zehut separate,
  Unity, Zionist Home, "Winter party"); mapping them onto today's lists is a method call that
  needs a documented rule before backfilling to dissolution (Jul 17).
- GATE: "current polls" = each pollster's latest poll within 14 days of the newest poll;
  Channel 14 shown but excluded (carried over from v2). Builder, map and averages all use it.
- GATE: pollster whitelist = Maariv, Channel 12, 13, 14, Kan 11, Zman Yisrael, Israel Hayom,
  i24NEWS, Walla, Yedioth, Ynet, Makor Rishon, Haaretz. Channel 16 and S.M.L.T. are NOT on it,
  so their polls go to the review PR; Daniel adds them to `config.pollsters` if he wants them.
- Validator extras beyond the plan: no 1–3 seat results (a list that passes the threshold wins
  ≥4), below-threshold readings must be 0 seats, no duplicate pollster+date, no unknown party.
- First catch (dry run): Kan's Oct 4 poll on Wikipedia adds to 123 seats; held for review.
- GATE: enabled "Allow GitHub Actions to create pull requests" on the repo, so the polls job
  can open its review PR (one rolling PR on branch `polls/review`, assigned to RavBogard, which
  is the "email Daniel" path via GitHub notifications).
- Bloc colors fail the dataviz lightness band (navy) and warn on contrast (orange, teal); kept
  as the site's established tokens. Relief: every panel is titled and value-labelled; full
  table view on /polls.

## Next (phase 2, remaining)
- Polls job + validator (sum 120, pollster whitelist, fieldwork date, ≤5-seat move, below-threshold
  flagged); auto-commit on pass, PR + email on fail.
- News RSS page (ISR 15 min). Daily briefing (Gemini), sourced per sentence, emailed.
- Reference pages: system mechanics, tribes, issues, timeline, glossary, sources/method.

## Deploy log
- 2026-10-04: Vercel project (preset "Other", created on the empty repo) failed twice: lockfile
  out of sync on Linux (regenerated), then "No Output Directory named public" (fixed with
  `vercel.json` framework: nextjs). Third deploy Ready; www.israelielection.org serves it.
- Internal docs class-00/03/09 kept out of the public repo (.gitignore): staff email, Zoom
  registration link, trip dates, private artifact links.
