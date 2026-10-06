# Full-site audit build (2026-10-06)

Source: full-site critique and technical audit, 2026-10-06 (snapshot .impeccable/critique/2026-10-06T14-49-54Z__app.md).
Design health ~26/40; technical 15/20. 0 P0, 10 P1.

## Daniel's answers (2026-10-06)
- Order: election night first.
- Before Oct 27: Builder (two-row meter and Paths to 61), Since yesterday home with cite, polls desk with lean masthead, explainer pictures (formation clock, drawn ballot, what-if lead, election on one page, locator maps).
- Evidence standard loosened: include positions a party clearly holds but will not say out loud, notated as unstated with their basis; run research rounds to fill the gaps.
- Corrections email: keep it; PRODUCT.md updated.
- "Codex (automated)" becomes "automated" source review.
- After the election: vote-map 2026 lens, Party Map coalition board, community party colours.

## Waves
- [x] Wave 1a Election night: phases (closed, exit polls, early count, count), home after close, /results order, waiting state, legend in bloc colours, stale edge, early-count hatch
- [x] Wave 1b Builder: two-row meter with verdict, verdict and pledges under the meter, governing summary, roles only for chosen parties, live region, Paths to 61
- [x] Wave 1c Fix batch A: Compare chips and smooth scroll, ChartViz aria, Article rounding and split-bar labels, vote map ramp, touch, wheel, dark, export overflow
- [x] Wave 1d Fix batch B: tokens (dark navy, touch targets, footer columns, fig-src measure), news heading and brief rule, /start order, party sparkline text, embeds, search title, article title size, metadata (canonical, titles, RSS link, theme-color)
- [x] Wave 1e Evidence research rounds (positions and comparison questions)
- [x] Wave 2 Since yesterday home, cite, figures in search; polls desk; lean masthead
- [x] Wave 3 Explainer pictures, election on one page, locator maps; apply research
- [ ] Wave 4 Review, DESIGN.md, push

## Decisions
- GATE: notation for unstated positions — proceeded with basis "unstated" shown as "Not said publicly" plus its basis line, because Daniel asked for the notation and the existing "record" basis sets the pattern; label is his to change.
- GATE: election-night thresholds — early count while counted localities hold under 10% of the voter roll (2022 roll until the 2026 roll is published); "waiting" until 02:00 Israel time; results seat grid recoloured to bloc colours to match its legend. Proceeded because they follow the audit and are reversible. Rehearsed exit and count phases with RESULTS_NOW and the 2022 fixture.
- GATE: Paths to 61 opens "With Likud" (plain arithmetic order) — proceeded; toggle shows the alternative. Pledge rules lacked the refusals to serve under Netanyahu, so conflict-free paths were misleading; a follow-up adds sourced rules and ranks conflict-free paths first.
- Open for Daniel: Shas West Bank row (co-sponsored the July 2025 sovereignty motion, absent on the binding bill, like Likud's settle-no-annex) — change both or neither.
- Open for Daniel: exit polls must be entered on the night (kind "exit", pollster "Kan 11" / "Channel 12" / "Channel 13", broadcastAt); no job fetches them.
- Research round 1 (logs in docs/research/2026-10-06-gaps/): issue positions 9 of 20 gaps filled (2 unstated, 7 stated or record), 11 left open with reasons; comparison questions 53 filled (28 stated, 25 unstated). For Daniel: four new stance options added for coalition positions with no slot (exempt full-time yeshiva students; abolish reasonableness for cabinet decisions; keep the current Shabbat rules; Israeli control of Gaza), override stance relabelled to "70 MKs or more"; Likud civil marriage left blank on purpose (Ohana's Dec 2025 vote).
- GATE: Paths to 61 pledge rules (data/pledge-rules.json, 16 rules, log in docs/research/2026-10-06-gaps/pledges.md) — added sourced refusals to serve under Netanyahu (Yashar!, B'Yachad, Democrats, Yisrael Beiteinu, Blue and White) plus Reservists, RZ and Otzma rules; Likud in a cabinet is read as Netanyahu-led; `support: true` marks pledges that also rule out outside support. Proceeded because Daniel asked for the conflict fix and every rule cites a fetched source. On the average no path is clear; Maariv and Channel 14 each show one. For Daniel: Otzma-with-Ra'am rule held (no explicit pledge found); Winter's refusal reported both ways; Gantz's 2025 "would join" vs Aug 20 refusal; Liberman cited via JFeed (his X post).
- GATE: Polls desk Pollsters tab holds the 120-seat bloc bar and per-poll bloc strips — proceeded because they are per-pollster views. Wording for Daniel: "Cite this average", "How to read this", tab labels; menu fact shortened to "Poll Oct 5, briefing Oct 5" so it fits at 1280px.
- GATE: community pages say "the issues" instead of a count (their sections cover six of the seven issues); PartyMap now says "seven issues", matching the profile tiles. Content-lane wording only; proceeded because the old counts were wrong.
- GATE: West Bank areas map uses OCHA oPt / PA Ministry of Planning Oslo areas (HDX, 2004, HDX "Other" licence), attributed in the figure; the file mislabels Area B as A, corrected by point tests (Area A ~18%, B ~21%). E1 placed from Wikipedia coordinates. For Daniel: confirm the licence is acceptable for publication.
- Open (data lane): seats guide chart titles say "step one/two" for what the numbered list calls steps 3 and 4; Communities index still previews settlers.vote-trend rather than the new map.
