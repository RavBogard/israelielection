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

- Coalition Builder default is now "Average" = mean of the latest poll per pollster in the
  current window (Daniel: "should only average the most recent polls"). Single polls remain
  selectable.
- docs/00-PLAN.md: merged the Cowork lane's 2026-10-05 spec, restoring the Gemini lines its
  older base copy had reverted.
- News (/news): 8 feeds across 7 outlets, server-fetched, ISR 15 min, no AI. Kan English
  omitted (only feed is a 9 MB podcast feed); ToI uses its politics + elections feeds (main
  feed is behind Cloudflare). General feeds (Jewish Insider, Forward) keyword-filtered to Israel.
- GATE: briefing email = GitHub issue assigned to RavBogard (then closed), not Resend.
  Proceeded because it needs no new service, account or spend and still reaches Daniel's
  inbox; switch to Resend if he wants a real email.
- Briefing: daily 10:30 UTC (6:30am ET). Gemini structured output; each sentence must cite
  1–3 numbered headlines and share ≥2 content words with them, or it is dropped; <3 surviving
  sentences = no briefing that day (and the issue says so). Kill switch: delete
  data/briefings/DATE.json.

- First live runs 2026-10-05: polls job merged 28 polls and opened PR #1 (6 for review:
  4× Channel 16, S.M.L.T., Kan Oct 4 summing to 123). Briefing 2026-10-05 published (6
  sentences). Issue #2 was a false "live" notice from a run whose commit failed (fixed with
  --autostash); #3 is the real one.
- Open: Times of Israel and +972 feeds block datacenter IPs (GitHub runners and Vercel), so
  /news and the briefing currently run on 5 outlets. Needs a fetch path that isn't a
  datacenter IP, or permission from the outlets; not spoofing a browser.
- Election night: CEC publishes CSVs at media26.bechirot.gov.il/files/expc.csv (per locality)
  and expb.csv (per ballot box); 2026 files exist (test data, Last-Modified Sep 30). Columns
  are Hebrew ballot letters; the letter→party mapping must be verified from the CEC's
  official list before the /results route can use it.

- Election night (/results, built 2026-10-05): reads the committee's expc.csv (per locality),
  sums to national votes, estimates seats (threshold, Bader-Ofer, surplus agreements).
  Reproduces the 2022 Knesset exactly from the committee's 2022 file (test fixture). Hidden
  until polls close (Oct 27 22:00 IST); before then the page shows the ballot letters and how
  seats are counted. The Coalition Builder adds "Results" as its first choice (and default)
  once the count is open. Home and /results revalidate every 60 s.
- GATE: ballot letters → party ids from press reports of the committee's Sep 27 approval (Ynet,
  Emess, full list in Ice); the committee's own list page was down (maintenance.gov.il). Proceeded
  because three outlets agree and the rehearsal check compares them with the live CSV header.
- GATE: seat estimates use all five reported surplus agreements, including Likud–RZ and
  Shas–UTJ, whose signing is unconfirmed. Before election night: confirm against the
  committee's list of filed agreements and fix `data/results.json`.
- The committee's test file still uses 2022 letters (no דרך, רק, די, ודם columns); that is
  expected. `scripts/jobs/results-check.mts` reports the mismatch; run it locally on election night.
- Reachability (Oct 5): the committee's CDN (CloudFront) returns 404 to GitHub runners but
  serves Vercel (iad1) and a US home connection. So the results page fetches from Vercel
  directly; no Actions job sits in the path. Risk: the committee may tighten blocking on the
  night. Fallback to decide then: a manual upload of the CSV into data/.

- Ruling (Daniel, 2026-10-05): party-text changes merge automatically when well sourced
  ("hands off as possible"), superseding the plan's "always a PR". Implemented in the daily
  workflow's `register` job: Gemini proposes leader/status/surplus/pledge changes from the
  day's headlines; the grounding check requires real citations that name the party and share
  words with the change; tests + build gate the commit; Daniel gets a closed `register` issue.
- GATE: leader and status changes (withdrawal, disqualification, merger) auto-merge only when
  two outlets report them; one outlet → PR labelled `party-text`. Proceeded because those are
  the edits that change what the Coalition Builder shows, and a second outlet is cheap insurance.
  Surplus-agreement changes don't update `data/results.json` automatically; the notice says so.
- Surplus check (Oct 5). The committee's site is still down (gov.il "not found").
  - Joint List–Ra'am is now "signed": Walla, Sep 12, reports a signing on Fri Sep 11.
  - Likud–Religious Zionism: announced Sep 8 (Channel 14, Israel Hayom). Channel 14 reported it still unsigned on Sep 15, with a signing "in about two weeks". No later report found.
  - Shas–UTJ: JDN and JPost reported it as "expected" on Sep 10. No signing report found.
  - Several search hits were stale articles from 2019, 2021 and 2022 elections; checked each one's datePublished.
  - Both pairs stay in the seat method as "reported". Recheck nearer election day.
- GATE: Times of Israel and +972 headlines now fall back to Bing News's public index of each site when their own feed refuses our server. Proceeded because:
  - It's an honest fetch, with no browser spoofing and our own User-Agent.
  - It links to the outlet's canonical article URL (Bing's click wrapper is removed, and only links on the outlet's host are kept).
  - /news says which outlets came via Bing.
  - Their own feeds are still tried first.
  - Asking the outlets for allowlisting is Daniel's call (it means messaging people), and stays open.
- Daniel (Oct 5) asked for a home-page redesign and a logo ("look awesome and less ai generic").
  - Delegated to a design subagent on a worktree branch; I review and merge.
  - Added `.claude/` to the tsconfig, ESLint and Vitest ignores, so agent worktrees don't leak into checks.
  - Result: branch `redesign` (Vercel preview). Design: paper and ink with no accent colour, so only the bloc colours carry colour; Frank Ruhl Libre with Source Serif and Sans; a ballot-slip logo; a front page above the builder with "where the race stands", a seat strip and an index of the site.
  - Held for Daniel's look (user-visible identity change, no precedent). Daniel approved ("go live", Oct 5); merged to main.
- Session 1 deck on /teach (Daniel asked, Oct 5).
  - Cowork exported a PPTX and a PDF to public/teach/, with privacy removals logged in docs/teach-private/ (gitignored). Its notes JSON lists the removed trip dates, so it is kept out of public/.
  - I read all 31 slides and all speaker notes before publishing. Clean: no emails, Zoom or registration links, or trip dates.
  - Left for Daniel: the notes name CRC ("home to Zionists, non-Zionists and anti-Zionists"), and quote two private people from a published Ynetnews/Media Line story (May 2024).
  - Session data lives in data/teach.json.

## Next (phase 2, remaining)
- Done: polls job + validator, news page, daily briefing, election-night results.
- Coalition-process tracker after the election.
- Confirm Likud–RZ and Shas–UTJ surplus agreements nearer election day.
- Reference pages: system mechanics, tribes, issues, timeline, glossary, sources/method.

## Deploy log
- 2026-10-04: Vercel project (preset "Other", created on the empty repo) failed twice: lockfile
  out of sync on Linux (regenerated), then "No Output Directory named public" (fixed with
  `vercel.json` framework: nextjs). Third deploy Ready; www.israelielection.org serves it.
- Internal docs class-00/03/09 kept out of the public repo (.gitignore): staff email, Zoom
  registration link, trip dates, private artifact links.
