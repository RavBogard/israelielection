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
- [x] Wave 4 Review, DESIGN.md, push

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
- Wave 4: finish review on 48 fresh captures (finish-review folder); 7 fixes applied; DESIGN.md and design.json updated from shipped code. Audit P1s (Compare chip text, vote-map swipe, hidden chart links) confirmed fixed in wave 1c.
- Daniel approved the data fixes (2026-10-06): seats chart titles renumbered to steps 3 and 4; Communities index previews the settlements map.

## Daniel's answers, round 2 (2026-10-06, popup)
- West Bank: "isn't it fairer to say that Likkud is more 'flirt with annexation and annexationists, but not say it out loud, particularly in english'?" Resolved: a new stance "Backs sovereignty in principle, blocks binding bills" for Likud and Shas, rows quoting both tracks.
- Civil marriage: Likud "is trying to have its cake and eat it too." Resolved: a third stance for Likud, "Split: coalition deals keep the rabbinate's monopoly; senior MKs vote for civil marriage".
- Otzma + Ra'am: add the rule (his own words as the basis). Gantz: latest (Aug 20, 2026) refusal wins, the flag notes his 2025 opposite. Liberman: cite his X post directly. Winter: held. Paths default "With Likud": kept.
- Kept as is: "Not said publicly"; polls tabs and "Cite this average"; the four new stance options; OCHA/HDX map with credit; results grid in bloc colours.
- Exit polls: an import job (not manual entry). Rehearsal: Tue Oct 20, 2026.
- [x] Built (2026-10-06): West Bank stance "Backs sovereignty, blocks binding bills" for Likud and Shas, rows quoting both tracks (Illouz co-sponsored the Jul 2025 motion, the Levin ministers' letter, the Oct 2025 boycott); Shas's row corrected: its MKs voted for the motion, not co-submitted it (Times of Israel). Position files may now carry 6 options (lib/positions.test.ts); the issue page's split fits 6 at 390px. Civil marriage: "Split" for Likud as a Compare answer (its religion-state row carries the Ohana vote, basis unstated, so it reads "Not said publicly"). Paths to 61: otzma-no-raam (JPost, Sep 9, 2026: the petition's "Hamas-supporting terrorists"); Liberman's source reads "on X, as reported by JFeed". All with Hebrew.
- Not done, with reasons: Gantz's 2025 "would join Netanyahu" could not be sourced (Ynet, Aug 23, 2025 has him saying "no" to joining alone), so no note was added; Liberman's X post URL could not be found and no major outlet carried the quote.
- [x] Exit polls: the polls job imports Wikipedia rows dated election day or shaded #FFD (the 2022 page's exit-poll rows) as `kind: "exit"`, aired at the close; a changed reading is a new version with the run time; every 10 minutes 22:00–04:00 Israel time on Oct 27–28. Manual fallback: Polls workflow "Run workflow" with pollster + seats (scripts/jobs/add-exit-poll.mts). Test timeout raised to 20s so the gate can't fail on a slow runner.
- GATE: Hebrew for the new stances, rows and the Otzma rule written by me and published unreviewed — proceeded because Daniel approved the Hebrew wholesale.

## Compare colour (2026-10-06, late)
Daniel: the Compare page is "hard to decode, and the blocks of black and grey are really ugly and monotonous. even just coloring everything instead of shades of black and grey would really help."
- The graphite stance ramp is replaced by a diverging stance scale: pomegranate → coral → sand → sage → forest (components/compare/ramp.ts), on every surface that used `shade()` (Compare matrix, profile tiles, issue-page positions). Numerals pick black or white by luminance; ramp.test.ts pins 4.5:1, distance from the four bloc colours, and separation of six steps.
- Coexisting options (economy, Gaza) take pale category tints with an ink edge instead of dotted paper.
- "No position found" is an empty dashed cell instead of grey hatching; declined keeps a lighter hatch.
- GATE: replaced the graphite ramp DESIGN.md had ruled — proceeded because Daniel asked for colour in place of the greys; hues kept off bloc colours and off red-against-blue so the scale still says only "place in the issue's order". DESIGN.md updated; .impeccable/design.json sidecar left stale (reported, not repaired).

## Builder and Compare labels (2026-10-06, late)
Daniel: "the 'paths to 61' part is really confusing and not helpful. Lets just have the deal where you can build your coalitions, and it shows you the issues with it." And short labels on Compare, "if it doesn't get too bloated."
- Paths to 61 removed (component, lib/paths-to-61, its strings in both editions, CSS, DESIGN.md section). The builder opens on the named arrangements and the slips; pledge warnings and "Can they govern together?" are unchanged. The earlier "Paths default: With Likud" ruling is moot.
- Compare: every answer has a short name (lib/i18n/compare-short.ts, en + he, max 16 characters, distinct within a row; test checks coverage). A cell 76px or wider prints it in place of the number, so choosing a few lists gives a readable row; with all 14 lists the cells keep numbers.
- GATE: wrote 50 short labels in each edition without review — proceeded because Daniel asked for labels and approved Hebrew wholesale; the full labels stay in the key and the open row.

## Builder meter (2026-10-07)
Daniel approved: one Cabinet bar by default; the First confidence vote bar, its key and a one-line note ("needs more votes for than against, not 61") appear only once a list outside the cabinet is set to outside support or abstain.
