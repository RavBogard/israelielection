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
  - Daniel (Oct 5): cut the CRC sentence from the slide 2 notes. The note now reads "This is a good frame for a class on an election, and for this room. Everyone is welcome at this table." The PDF never had it. The Ynetnews quotes stay.
- Daniel (Oct 5): docs/research/HANDOFF-RESEARCH.md removed from the public repo; kept locally in docs/teach-private/ (gitignored). It is still in git history (commit a60949e and earlier); purging history needs a force-push, so it is left for Daniel.

- Reference layer (Daniel, Oct 5: "rulings are in. go"). Rulings in docs/research/RULINGS.md: 1–25 Daniel's; 26–32 delegated to Claude; Part 2 Claude-decided, overridable.
  - Framework: page copy is MDX in content/ (as the plan's output format says); charts in data/charts/<slug>.json; party tables in data/positions/<issue>.json.
  - Components (Chart, Positions, Quote, Note) look data up by id, so no number appears without its source.
  - Routes: /issues, /issues/[slug], /communities, /communities/[slug], /american-lens. Nav gains Issues and Communities; the home index gains those plus the American lens (nine items, 3×3).
  - lib/articles.test.ts turns the checkable rulings into tests: sections, length, Misreadings heading, no "unverified", terminology and house spellings outside quotes, https sources, internal links resolve, no first person, chart and positions data shape.
  - GATE: the section name "Communities" for the nine sociology pages. Proceeded because the plan names no section label, and "Communities" is plain and not a hierarchy (the plan says flat, no tribes).
  - GATE: charts are single-hue ink bars or tables, no categorical palette. Proceeded because the identity reserves colour for blocs, and one-measure-per-chart keeps different surveys apart (ruling 20 and the verification collisions).
  - GATE: drafting delegated to 12 parallel agents under DRAFTING-SPEC.md; then an independent fact-check pass against sources before publish (00-PLAN Proof). Text changes later go by PR per the plan.
  - docs/research/HANDOFF-RESEARCH.md was recreated by the research lane; it is now gitignored, so it stays out of the public repo (Daniel's Oct 5 instruction).

  - Result (Oct 5): 17 pages drafted and then independently fact-checked against sources (FACTCHECK-SPEC.md), with one checker per page or pair.
    - Checkers opened most sources directly, recomputed every town vote cell from the CEC files and corrected many errors, for example:
      - a misread IDI figure (11.4% vs 13.7%);
      - JPPI support figures derived wrongly;
      - the attorney-general law, which did pass on July 15, 2026 (the research said no final vote);
      - Pew wording;
      - quotes cut mid-sentence;
      - press paraphrase presented as party quotes.
    - Every Wikipedia citation was replaced with a primary or major-outlet source. The only exception is the 2026 opinion-polling table, which is the site's own poll source.
    - A test now enforces this. The word counter was fixed, since it had dropped quote and note text; length ceilings were reset to fit.
  - GATE: party rows that quote a news outlet's summary (Ynet, JPost, JC) rather than the party's own words are kept, labelled as the outlet's summary. Proceeded because they are the only sourced statement of those positions, and the label keeps them honest.
  - GATE: ruling 35 (Claude-decided) reworded to "split the coalition in its last year", because "weeks before" did not fit the dates. Ruling 84 (Claude-decided): "Zera Beta Israel" dropped, because no source that can be opened says it is the preferred term. Both are logged in RULINGS.md.
  - Chart notes may carry bare URLs; the Chart component renders them as short site-name links.

## For Daniel: reference layer (Oct 5)
Party-profile items the reference pages turned up. data/parties.json was not edited, because these change stated positions or quotes:
- shas: the draft entry rests on a Deri quote whose JPost link returns 404.
- utj: the draft entry quotes Asher ("will not support or enter any government without…"); its source is a class doc nobody re-opened. The economy entry ("Housing for Haredi communities; yeshiva funding") is not on IDI's UTJ page ("education and welfare").
- rz:
  - The draft entry says most RZ MKs voted for the July 14 arrest-ban law; that also comes from a class doc nobody re-opened.
  - The war line ("Return to the whole of Gaza in a big way", JPost Aug 18) has no URL on file.
- res (Reservists):
  - The draft entry says "Those who do not serve cannot vote or be elected", but no source was found; Ynet lists benefit sanctions only.
  - The economy lines ("paradise for monopolies; 170 average salaries") have no source that can be opened.
  - The Gaza entry merges two separate Hendel proposals (JPost 904910, Aug 11), and that article says the party has no formal Gaza position.
- yashar:
  - The profile says "Opposes a Palestinian state". Its own Ynet answer (Sep 30) is that a state "is not on the agenda as far as we are concerned."
  - Economy pledges (15% raise, renter protections, 50-day reserve cap) are not on IDI's page.
- poi: the courts entry says "no details", but Ynet (Sep 22) now gives specifics.
- dem: Ynet (Sep 16) says "the obligation to serve the state should apply to all citizens", while the profile has Golan calling mass Haredi conscription "impractical". The two may be reconcilable.
- yb: "a capitulation to terror" about the Board of Peace (JPost Aug 12) could only be found as a 2018 use.
- jl:
  - The profile puts "a Palestinian state alongside Israel" in quotation marks, but in JPost 907154 that is the reporter's paraphrase.
  - The draft, courts and economy entries are null, but sourced answers now exist (Ynet; JPost).
- raam: draft and courts entries are null, but sourced answers now exist (Ynet).
- bw: no issue entries at all; Ynet has positions.
- Several profile sources read "JPost, Sep 8, 2026". The religion-state checker found the Shas/UTJ article dated Sep 10. Not changed, since the other citations with that date may be different articles.
- Courts, ruling 40: no named, sourced claimant was found for the claim that the overhaul serves Netanyahu's trial. The page attributes the prosecutor-general authority line to JPost's own description of the bill, plus Limon's "an abolition bill".
- Courts: the attorney-general law. Times of Israel (twice) says the split of the role was dropped; World Israel News says it splits the role. The page follows ToI.
- Done mechanically (ruling 32): "Lieberman" → "Liberman" in parties.json, pledge-rules.json and the home page.

## Next (phase 2, remaining)
- Done: polls job + validator, news page, daily briefing, election-night results.
- Coalition-process tracker after the election.
- Confirm Likud–RZ and Shas–UTJ surplus agreements nearer election day.
- Done: issues (7), communities (9), American lens.
- Done: vote map, 2019–2022 (add 2026 after the final file).
- Done: How it works (seats, forming a government, voting), each drafted and then fact-checked by a separate agent; menu item under Understand.
- Done Oct 5: timeline and glossary (see below). Still to do: election-night page (partly covered by /how-it-works/voting and /results), sources/method (Daniel).

## Vote map (Oct 5)
- /vote-map: 2019a–2022 by locality.
  - Shading is the share for a chosen list (ruling 101).
  - Special-envelope votes get a separate national bar (ruling 100).
  - The Green Line is drawn, settlements are mapped, and a note says who votes (ruling 99).
  - IdanTravitsky is credited as precedent only (ruling 102).
  - Lists appear as they ran (ruling 28). Lists under 1% nationally count in the totals but can't be picked.
- Build: `npx tsx scripts/vote-map/build.mts` writes public/vote-map/.
  - It fetches the five CEC expc.csv files with an honest user agent.
  - It fails unless every list's column sum equals the national page; all 184 lists match.
  - lib/votemap.test.ts re-checks the output.
- GATE: boundaries are the research prototype (Transport 2026 + CBS 2008), copied, not refetched — proceeded because data.gov.il returns 403 without a browser user agent and spoofing is ruled out.
- GATE: the Green Line and Gaza outlines come from OCHA's COD-AB for the State of Palestine on HDX (CC BY-IGO; HDX lists the source as the PA Ministry of Planning). Credited on the page. Proceeded because Natural Earth's West Bank leaves out East Jerusalem and Latrun, so it is not the 1949 line; OCHA's follows the 1949 line through Jerusalem.
- GATE: spellings.
  - English list names are translated from the CEC Hebrew names (data/vote-map/lists.json).
  - English place names come from CBS, with the house spellings (lib/votemap.ts NAME_OVERRIDES, ruling 32), plus Qiryat→Kiryat and Bet→Beit.
  - Four localities that appear only in 2019–2021 are transliterated from the Hebrew.
  - Proceeded because these are spellings, not claims.
- Page text sources:
  - ToI, Oct 30, 2022: eligibility and double envelopes.
  - ToI, Jan 13, 2020: East Jerusalem residency.
  - Everything else is computed from the CEC files.
  - Independent fact-check pass: queued.
- Still open:
  - 2026 results, once the final file is posted (about a week after Oct 27).
  - The CBS 2022 layer, which needs a person to download it in a browser.

## Timeline and glossary (Oct 5)
- /timeline: scrubbable 1977–2026 (components/Timeline.tsx, data/timeline.json): 17 elections, 14 PM terms, 47 events; the full event list and tables below it. /glossary: 56 terms (data/glossary.json), A–Z, anchors like /glossary#area-c. Checks in lib/reference.test.ts.
- Drafted by research agents, then independent fact-checks: timeline 14 fixes (~190 claims, all opened), glossary 44 entries edited (~230 claims). Knesset pages blocked (HTTP 474); PM dates confirmed on 2013 Internet Archive copies.
- GATE: placement in the Understand group's `more` slot (home index and footer, not masthead), per the design session — proceeded because it adds no masthead item.
- GATE: kept the Feb 28, 2026 US–Israel strikes on Iran as an event (confirmed at Al Jazeera) — proceeded because it is a dated, sourced war event in the election year.
- GATE: Madrid 1991 recited from an Al Jazeera opinion piece to the State Department Office of the Historian — proceeded because a news/primary source is preferred.
- GATE: glossary Hebrew kept only where seen in a Hebrew source (11); Bibi and Torato Umanuto Hebrew removed — proceeded under "every fact sourced".
- For Daniel: (1) glossary "Occupied" no longer mentions "disputed" (no source found); ruling 3 covers the west-bank page only. (2) The haredi-draft page states the 1977 lifting of the Torato Umanuto cap, cited to a Knesset PDF no checker could open; the research record confirms it only from Wikipedia. (3) Oct 5 briefing says the court "bar[red]" Abu Shehadeh (Haaretz headline wording); Al Jazeera and the site's community page say he withdrew after the court signaled a majority to disqualify. Briefings are yours to correct.

## Deploy log
- 2026-10-04: Vercel project (preset "Other", created on the empty repo) failed twice: lockfile
  out of sync on Linux (regenerated), then "No Output Directory named public" (fixed with
  `vercel.json` framework: nextjs). Third deploy Ready; www.israelielection.org serves it.
- Internal docs class-00/03/09 kept out of the public repo (.gitignore): staff email, Zoom
  registration link, trip dates, private artifact links.

## Redesign 2 (2026-10-05, evening; branch `design`)
- Daniel: holistic rework of UI, menu, look, branding and layout ("still feels pretty generic").
  Answered four questions: full identity rework incl. a new mark; menu grouped by what the reader
  is doing; Hebrew ballot letters on cards and profiles; sources folded one tap away.
- Spec and gates: docs/planning/2026-10-05-redesign/DESIGN.md. Identity: 120-seat grid with the
  61st marked (mark, home hero, builder meter, Party Map overview, Polls average, Results); party
  cards as ballot slips with their letters; white paper and two inks; Frank Ruhl Libre + Public
  Sans; one 1200px wrapper and one page-header pattern; grouped masthead menu with a phone sheet;
  sources in a <details> at each page's end; the dateline bar and all-caps labels removed.
- Daniel approved on the preview ("go live", 2026-10-05 evening); fast-forwarded main to 10ef2ff, which also
  carries the Vote map restyled onto the new grammar. Styling files stay with the design lane; the reference
  lane asks for CSS changes rather than editing them.

### 2026-10-05, later: naming, masthead, share cards
- "Teach it" → "Teaching resources" (Daniel: "Teach it!" felt lame). Footer link under it: "Decks, source sheets and guides".
- Masthead rebuilt for eleven links: group labels sit above their links; Menu button now below 1200px (was 860). GATE: breakpoint moved up to 1199px — proceeded because five Understand items plus the longer label overflow a 1200px row at every width below it, and the full-screen sheet with group labels is the better tablet experience.
- NAV_GROUPS gained `more?: NavItem[]`: pages listed on the home index and in the footer but not in the masthead. Timeline and Glossary (other lane) go there. The masthead stays at eleven links.
- Share cards: openGraph/twitter metadata in app/layout.tsx; app/opengraph-image.png and twitter-image.png (1200×630: the 120-seat grid with the 61 rule, wordmark, description, domain), rendered from scratchpad og.html with the site fonts. Facebook still shows the old title "Israel Votes: Build a coalition" from its cache; Daniel can re-scrape at developers.facebook.com/tools/debug.
- Icons: app/icon.svg redrawn as the solid majority shape over a dimmed house (no row stripes, which moiré at 16px); app/apple-icon.png 180; app/favicon.ico (16+32, RGBA PNG entries, which Next's image pipeline requires). public/logo.svg and logo-dark.svg removed (unreferenced).
- Desktop masthead shows the countdown again (it had only been in the phone sheet).

## 2026-10-05, later still: the share card in colour
- Daniel: the share image was "super black and white and dull". Replaced the static PNG with
  `app/opengraph-image.tsx`: the home hero (120 seats by bloc, headline, totals) rendered with
  next/og at request time, revalidated hourly, so shared links show the current average.
- GATE: fonts committed as TTFs under `assets/og/` (about 250 KB) rather than fetched from Google
  at request time — proceeded because the renderer must not depend on a third party at share time.
- GATE: no separate twitter-image — proceeded because X reads og:image when twitter:image is absent
  (verified in the rendered head: Next fills twitter:image from the OG image).

## 2026-10-05: six-perspective review, step 1 (reference lane)
- Reviews: Palestinian American, J Street liberal Zionist, American Jewish anti-Zionist, then counter-reviews from a mainstream pro-Israel reader, an Israeli center-right reader and a neutral academic (38 claims spot-checked, all numbers matched). Daniel's answers are RULINGS Part 3 (103–109) and Part 4 (110–113).
- Step 1 (now): factual and sourcing fixes; Coalition Builder pledge bug (rule now keys on a `noArabPledge` tag: Yashar!, B'Yachad, Yisrael Beiteinu; The Democrats said the opposite); deck trip references removed; bloc label "Joint List and Ra'am"; /issues/not-on-ballot → /issues/palestinian-state (308 redirect).
- Academic fixes: seats.mdx counterfactual credited to CEC arithmetic (Fruits and Votes doesn't name Labor); JPPI "<1%" cut (base unclear); Arab share 21.7% per CBS; Peace Now 58 farms; CBS self-identification dated "2025, released Sept 2026"; "comparable" and "Israelis moved" claims narrowed; Arab non-response "cannot be read as a change of mind"; Peace Index 2023 baseline "about 38%".
- Ruling 112 applied: "Jewish-majority lists" in the site's voice; IDI's own "Zionist parties" category attributed; druze chart column "Arab-led lists combined".
- GATE: bloc label "Zionist opposition" kept — proceeded because its members (Yashar!, B'Yachad, Yisrael Beiteinu, Yesh Atid) call themselves Zionist, so #112's self-description test is met and UTJ is not in it.
- GATE: issue-page length ceiling raised 1500 → 1650 words — proceeded because the review additions (courts, conversion, the draft) are what Daniel asked for and the cap was a house guideline, not a ruling.
- GATE: deck slide 20 "Calls for judicial reform" → "Calls for a judicial overhaul"; slide 25 (Reservists) "Reform; 8-year term limits" kept — proceeded because #38 bans "judicial reform" for the 2023 programme, and Hendel's own proposal is not that programme; slide 16's Shas quotation is verbatim and attributed.
- For Daniel: re-open the PPTX in PowerPoint once; slides 19 and 20's longer Courts lines may wrap differently (the PDF was checked).
- Academic review → rulings 110–113: poll average over passing polls with "passes in k of n", √n weighting (median-n fallback), Channel 14 in, a "Without Filber" variant; "Jewish-majority lists"; INES in step 4.
- GATE: the average used for coalition arithmetic (Coalition Builder, Party Map, home hero, share card) is scaled down in proportion to 120 when the passing-only averages add to more — proceeded because #110 makes them sum above 120 (123.2 today) and 61 must stay a majority of 120; /polls shows the unscaled figures and says so.
- Owner's direction (2026-10-05): rulings 114–118 — the American lens leads with what the election is not about; "occupied" plainly; no generic "the conflict"; findings first with Israel's response in one line; "genocide" only in quotations from the courts/UN/rights groups or case names; educational, not advocacy. Two Fable sweeps (log: sweep-2026-10-05.md), Palestinian opinion (PCPSR, Pew 2026, the 2024 Pulse) and three Palestinian voices added; every addition independently fact-checked.
- New page /how-it-works/who-votes. Courts page: the trial, protests, Bar, the disqualification fight, the right's case. War page: Oct 7, other fronts, ceasefire conduct. West Bank: OCHA tolls in both directions.
- GATE: Cassif profile row paraphrases Likud's "genocide" accusation instead of quoting it — proceeded because #118 limits the word to quotations from the courts, UN bodies or rights groups.
- GATE: Google Analytics (G-DB53C0NZHB) via @next/third-parties in app/layout.tsx, production only — the owner asked for it; design session told and agreed.
- For Daniel: Israeli toll since Oct 7 (1,318 / 1,029) still cites Arutz Sheva (no mainstream copy found); Sasson Report outpost definition still unsourced; Zehut's relation to the RZ list (Ynet says it campaigns separately; parties.json treats RZ–Zehut as a technical bloc); a footer privacy note for GA was offered, not added; teaching-deck language changes are listed as proposals in the sweep log, not made; who-votes page has no named Palestinian voice yet (at its word ceiling).

## 2026-10-05, evening: the approved build, round one
- Daniel approved all of EVAL.md ("everything is approved. build them"); rulings he must make are in
  docs/planning/2026-10-05-eval/HANDOFF.md (he answers in ChatGPT and brings them back).
- Home re-cut: hero plus a computed reading sentence; "What this election is about" (IDI top three,
  the not-about sentence); Today from the briefing; Start here; Try it; Teach band; compact index.
  Builder at /coalition-builder with its Sources box; /coalition redirects there.
- New: /compare (seven axes, status-driven "Declined to answer" and "No position found"), /embed/*
  with copy-embed on Teach, /news/feed.xml, sitemap, robots, custom 404, print styles in globals.
- GATE: the "not about" sentence shipped in draft wording built from the lens dek and the peer's
  IDI note — proceeded because Daniel approved the item and the wording is flagged for him in
  HANDOFF item 1; the signed note is gated on data/home-note.json and hidden until he writes it.
- GATE: the no-vote total is not on the home strip until the content lane sends a sourced figure.

## 2026-10-05, late: EVAL build (content lane)
- Daniel approved EVAL.md; lanes split with israelielection-9b (structure/styling vs content/data). Done here: exit polls as `kind: "exit"` (never averaged, exempt from the move rule; enter by hand on the night); stance labels + declined/none status for the Palestinian-state comparison column; Teach promise reworded; Builder links → /coalition-builder; deck calendar stripped; drift notes removed from /results, /parties, Sources; 17 bare IDI citations dated.
- results-check (run locally Oct 5): media26.bechirot.gov.il/files/expc.csv reachable (HTTP 200) but still a July 2025 placeholder (16 localities); letters דרך (yashar), רק (byachad), די (res), ודם (jl) not yet in it. Re-run `npx tsx scripts/jobs/results-check.mts` weekly and on Oct 26; the committee's template should update before the vote.
- Election night: enter exit polls in data/polls.json by hand with "kind": "exit" as Kan, Channel 12 and Channel 13 air them at 10 pm Israel time.
- Round two (same evening): the election-night package. A results strip under the masthead on
  every page once polls close (client, polls /api/count each minute); on Results, "What to watch"
  before the count (close time in Israel and ET computed, exit-poll caution with the 2022 Meretz
  case, lists the average puts near the threshold, the double-envelope note), exit polls beside
  the count once they exist, and a threshold watch (lists within half a point, with what crossing
  is worth). Briefing permalinks at /news/<date>. Rehearsed with RESULTS_FIXTURE and the 2022
  file: strip, hero, builder and results all switch to the count; headline becomes "Israel voted."
- Daniel's rulings are arriving via a walkthrough (DECISIONS.md, written outside both sessions).
  Item 1 ruled: the home line is his approved wording.
- Round three: /government, the formation clock, rendered from data/formation.json (content lane's
  data; dates fill in once the official-results milestone carries `actual`). "Government" joins
  Follow in the masthead; the post-election countdown links to it.
- GATE: Vote map moved from the masthead to Understand's `more` (home Try-it card, index and footer
  keep it) — proceeded because twelve links overflowed at every width and the masthead rule is
  about eleven; Government matters more than the map from Oct 28 on. Masthead re-measured: fits
  1200 to 1600 after spacing went from 22 to 18 px.
- Round four: the coalition share card. A Builder link with ?with= now carries its own og:image
  (/api/card): the chosen parties on the grid in bloc colours, the total against 61, the pledge
  count, the poll and date, "built by a reader, not a forecast". Shared drawing code in lib/og.tsx.
  Satori has no bidi, so the Hebrew letters are reversed by hand before drawing.

## 2026-10-05: content batch shipped (d3b13ed, 5d13ada)
- No-vote total (about 5.4 million; OCHA 2026 Flash Appeal PDF) fact-checked and sent to the design session for the home strip.
- GATE: home-strip wording sent without Daniel's review — proceeded because it restates the fact-checked who-votes sentence and the home line Daniel already ruled.
- Note for Daniel: OCHA's 3.3 million is stated as the people whose movement is restricted, not as a population count; PCBS gives 3,325,905 for the West Bank (2024) as a cleaner alternative source.
- forming-a-government now links /government.
- Round five: the threshold what-if (<WhatIf /> in the seats guide: lists near 3.25% set to pass
  or fail, seats re-counted by allocate(), bloc deltas and wasted share shown; arithmetic from the
  average, labelled as such); the home strip gains the sourced no-vote line (about 5.4 million,
  OCHA Dec 16, 2025, from the content lane's fact-check). "Last checked" already exists on every
  reference page as "Facts checked <date>" from frontmatter, so that EVAL item needs no build.

## Round six: the home page cut to its job
Daniel, 2026-10-05: "the front page is now suuuuper bloated" and the Builder thumbnail copied the hero grid; then, mid-build: the note from him and the "what this election is about" strip "isn't for the homepage". Before: 3,685px at 1440, 5,878px at 390, eight sections, three of them indexing pages the masthead already lists. After: 1,900px and 2,784px, five pieces: hero, one-sentence reader's path, today's first briefing sentence, four tools with their own pictures, the teaching and about invitations. Removed: the About strip (its substance is the opening of /american-lens), the signed note (data/home-note.json kept; About carries his approved text, which opens with the same sentence), the Start here cards, the Try it cards, the "Also on this site" index (masthead and footer carry it).
GATE: the signed home note is no longer rendered anywhere — proceeded because Daniel said it is not for the home page, and the About text he approved covers the same ground; asked him whether he wants it as a signed foreword on About.
Glyphs (components/HomeGlyphs.tsx, 300 by 190 each, drawn from live data): Builder = four ballot slips fanned, the largest list of each bloc, letters and seats from the current poll; Party Map = squarified treemap, blocs then lists; Polls = the site's running average for the two big blocs against the 61 line; Vote map = localities from Beersheba north as round-cap zero-length strokes bucketed by Likud-share bin and size (about 19KB of markup), Gaza and the West Bank drawn as the map draws them.

## Handoff items 7 to 11 closed, 2026-10-05
Lanes agreed with the content session (it: content, data, RULINGS, this STATE file's content rounds, jobs, data logic in lib, Scenarios; me: app, components, CSS, lib/site, lib/og, lib/watch, lib/compare, mdx-components, public, next.config; Codex: DECISIONS.md; I integrate). Applied: 7 no change; 8 footer line (mine, d656311) and About Privacy section (content, 4dabdb2); 9 ruling 119 and the haredim and settlers citations; 10 deck relabelled, fresh 31-page PDF with fonts embedded (17c6c2b); 11 Defense Ministry and NII-via-JNS citations. Daniel's signed note is the About foreword (5902400). Verified on production: footer link and anchor, foreword, 400 tests, lint and typecheck clean; PDF text scan clean on all 31 pages (one descriptive "Arab-led parties" on slide 26 kept as source wording); pages 8, 21 to 24, 26 to 28 and 30 inspected as rendered images, no overflow or wrap faults. Open for Daniel: the About foreword and body share their first sentence.

## 2026-10-05 (later): handoff items and Teach scenarios
- Glossary auto-links (485ed09); timeline gaps (6 events) and pledge-source fixes (4e0fa6a).
- DECISIONS items 8-About, 9, 11 (4dabdb2) and 10, deck relabel + fresh PDF (17c6c2b). Public Sans
  installed for this Windows user so PowerPoint exports embed the deck fonts.
- Teach scenario cards published (af880c0), styled by the design session (20b8870); Daniel reviewing live.
- Lanes: content session = main checkout, content/data/RULINGS/lib data logic; design session =
  israelielection-design, app/components/CSS/og/mdx-components, final integration; Codex = DECISIONS.md.
- Open: US-stakes explainer, masorti Likud voices, INES (step 4), election-night dry run; weekly
  results-check (and Oct 26); exit polls by hand on the night; formation.json `actual` ~Nov 4.
  Blocked on sources: a named Palestinian voice on no-vote; the Gaza toll actor.
