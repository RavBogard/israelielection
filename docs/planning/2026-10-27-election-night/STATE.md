# Election night, 2026-10-27: state

Polls closed 20:00 UTC (22:00 Israel). Worktree for lead edits: C:/Users/dsbog/ie-live.

## Done
- 20:3x UTC: Channel 12, Channel 13 and Kan 11 first exit polls entered by hand in data/polls.json (82926a3). All direct broadcaster adapters and the Wikipedia fallback had no usable exits.
- 20:4x UTC: live forecast reads hand-entered exits as an authoritative `manual` transport (9774cc3). 20:30 UTC cycle: mode exit; blocs net 50 (46-53), opp 52 (49-55), arab 17 (15-20); Likud largest 71%.

## Daniel's rulings (popups, 2026-10-27 ~20:50 UTC)
1. Home hero grid default: live forecast (exit-informed). 2. Keep headline "Polls have closed." 3. Exit polls on home: table under the hero AND grid can switch to any single exit poll. 4. Caution: one clear line next to the exit polls (estimates, often off by a few seats per list, the count decides). 5. /results: exit polls at the top. 6. Updated versions: latest only, with update time. 7. No exit-poll average (forecast covers it). 8. Channel 14 exit poll: shown, set apart, outside the model. 9. All seven editions at once. 10. Builder default: live forecast. 11. Site-wide masthead: compact exit-poll bloc line linking home. 12. When the count flows: forecast leads, partial count beside, exits stay until final. 13. Enter every exit update as it airs. 14. Single-source update: publish if it sums to 120 and matches independently reported bloc totals; note the source. 15. Times: Israel time plus reader's local. 16. Share cards: live forecast seats.

GATE: building UI changes straight to main via PRs without a preview gate. Proceeded because Daniel asked to "make the changes and deploy" tonight.

## Later rulings and log (UTC)
- ~20:50 Grid best guess: the hero's parliament is the draw closest to the bloc medians (7eae2e1). Plain labels in all seven editions (4ef1e2c).
- ~21:00 Daniel: cut the saved campaign forecast from headline places; once polls close it leaves the home hero (4ef1e2c). It stays on /forecast.
- ~21:05 Outgoing 25th Knesset seats: faction seats at dissolution, Jul 17 2026 (data/outgoing-seats.json, #33); shown as a "now N" chip beside projections (#35). Likud 36 includes New Hope's 4 (Sa'ar and Elkin on Likud's list); Blue and White is formally 8 but in no exit poll.
- ~21:10 Daniel: "we only care about getting it right ... we do not care about previous rules if they get in the way." So Channel 14 and i24NEWS inclusion goes by historical exit-poll evidence (calibration agent, branch live/exit-calibration), not by ruling 111 or the Oct 26 exclusion. GATE: the Oct 26 live-model exclusion had no written reason; it stays until the calibration evidence lands.
- Channel 13 partial update (ynet: B'Yachad 13, Joint List 11, blocs 50/52/18) held until Democrats and Yisrael Beytenu are known.
- Open for tomorrow: polls.json withoutVariant note says "Filber's firms" (stale: he left Direct Polls in June 2025; Channel 14 polls through Next Data); parties.json still says Gantz may drop out (Wikipedia: Blue and White withdrew Oct 19); share images exist only for en and he.
- Ops: the live model reads hand-entered exits at each 15-minute cycle after deploy. Tests that read data/polls.json must not assume which exits exist (fixed twice tonight).

## 2026-10-28 ~01:10 Israel
- GATE: /results count seat grid held as "awaiting" below 5% of the roll counted (11d3206) — proceeded because Daniel's "only care about getting it right" ruling; 0.1% coverage from 15 localities showed Netanyahu bloc 75. Same threshold the live forecast uses (count-nowcast minCoverage).
- Reactions: added Deri, Ben Gvir; Liberman now paraphrase (soldiers' votes, results by Friday); Netanyahu note updated to 1 a.m. + Likud no-interviews instruction (ToI liveblog).
- Sweep 01:01: no newer exit polls than Kan 23:11 / Ch13 22:57 / Ch12 22:44; no final turnout; CEC count unchanged at 2,661 votes. Netanyahu not expected at Likud HQ before ~03:00.
- Earlier this session (logged in batch): headlines rail on home; coalition scenarios removed (Daniel ruling); JPost Israel-clock fix; bloc "now" chips + bloc story line; i24NEWS exit (set apart); mid row hidden at 0 + below-threshold line; election-night notes + formation steps; home reorder; tighter headline rail.
- Support link (Daniel "Go", 2026-10-28 ~02:30): Venmo URL in lib/i18n/support.ts (empty string hides all links). Footer line on every page ×7 editions + "Support" section on /about with funding policy. Wording per my recommendation (approved with "Go"): "Support this work", not tax-deductible, Venmo US accounts only; no money from parties/lists/candidates/campaigns/governments. Open: disclosure threshold (not set, so not stated); Venmo is US-only and a personal profile — consider Venmo business/charity profile or Stripe for international readers; Israeli election-finance check before promoting.
- Support methods: Venmo (link), PayPal (dsbogard@gmail.com shown as text; no PayPal.me handle given), Cash App (cash.app/$ravbogard). Note now says Venmo/Cash App need a US account, PayPal works anywhere.
- GATE: Fixed 3 hand-entered exit updates (Ch13 01:14, Kan 01:40, Ch12 02:17) silently dropped by the model because published was 2026-10-28 (validExit requires election date). Set published 2026-10-27; added lib/live-forecast/manual-exits.test.ts guard — proceeded because they met ruling 14 and the model was running on stale exits.
- Daniel ruling 2026-10-28 ~04:30: 'Count only' — once seat context basis is partial_count/official, the home page drops the exit-poll forecast panel; count projection is the only estimate there. /results keeps the panel.
- GATE: Count model overhaul (Daniel 'don't go small… Go', ~05:00): Fable builder on branch model/count-fixes (worktree C:/Users/dsbog/ie-model) implementing review fixes 1–6 (volume/roll, sector turnout, per-list shrinkage, frozen prior + exit blend, envelopes + Res lean, joint-draw intervals). Lead reviews PR + CI, then merges. Review: scratchpad/count-model-review.md.
- Merged #39 (276b82e) count model overhaul; live at 1,597,973 votes (28%): 51/51/18 (80%: net 50–53, opp 48–51, Arab 17–19), Res P(pass) 15%. Hold-out bloc error 5.7→3.2 pt. Bloc ranges in API only — not yet in grid.
- Live count section on home (raw CEC votes by list, % of expected vote, threshold line, auto-refresh 60s), Daniel 2026-10-28. Incident: forced removal of worktree ie-model followed its node_modules junction and deleted part of israelielection/node_modules; restored with npm install (package.json/lock restored from backup, unchanged). Capture loop kept running.
- Phone footer tightened; PayPal (and public email) removed from support popup until Daniel sends a paypal.me link (Daniel 2026-10-28).
