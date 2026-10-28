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

## 2026-10-28 12:10 Israel — regular count at 70.7%, envelopes from midnight
- Site matches the CEC: file of 10:50 Israel, 4,008,086 votes, 1,057 localities, 70.7% counted; raw seats 54/47/19 (as ynet reports); count estimate 52 (52–53) / 50 (49–50) / 18 (18–19).
- Pre-close check of the count model (2022 replay in 9 reporting orders, envelope-arrival and Arab-locality stress tests): bloc within 1–2 seats of truth in every case; no double count when envelopes arrive.
- GATE: disabled the Polls workflow (twice-daily pre-election poll ingestion) — proceeded because voting is over, exit polls are entered by hand, and `gh workflow enable polls.yml` restores it.
- Kept on until the double envelopes are counted (expected Thursday 29 Oct): local capture loop, count-capture backup (cron ends 29 Oct), lifecycle cadence, platform monitor, live refresh after deploy. Daily briefing kept (post-election news).
- Stopped the manual exit-poll sweep (no further exit updates are meaningful).

## 2026-10-28 — "now 68" chips renamed
Readers took the "now N" chip (outgoing-Knesset seats) for a live-count figure. Renamed chip and column to "last Knesset" in all seven editions, said in the key that it is not the 2022 result, captioned the hollow tick on the bloc bars, and put the estimate first in the hero's bloc line.
GATE: rewrote the chip wording without a wording round — proceeded because Daniel reported the confusion, the chip itself and its meaning were already approved, and only the label changed.

## 2026-10-28 — home hero is the chamber (option C)
Daniel picked option C of three (artifact https://claude.ai/artifact/5NAvrdfK8ouTykXKHRUt4j). Once the seat context is partial_count or official_seats, the home hero is ChamberHero: "No bloc has 61 seats", the 120 seats as the plenum (Netanyahu bloc on the right), and each bloc with its distance from 61, its range and its last-Knesset seats. Headlines stay; the tabs go. Before the count, the old hero is unchanged.
GATE: wrote the hero copy in seven editions without a wording round — proceeded because Daniel approved the option with its English copy on the comparison page; the other editions follow the house voice and are listed for review.

## 2026-10-28 — post-election review rulings
Daniel: /match retired (redirect to /parties, code kept); "red lines in play" panel in the Coalition Builder approved (arithmetic and sourced pledges, no odds); no forecast scorecard now (do not build it); everything else in the review approved (https://claude.ai/artifact/ReeQJfT71dD3Hp8wExsBmh).
Wave 1 (this week): three builders: results+chrome+match+capture window; parties+compare+builder; home tiles+government+briefing. After-result items wait for the official allocation.

## 2026-10-28 — full review approved; alignment answers
Daniel: do every recommendation; my call from here. Answers: forecast scorecard + /about "how our forecast did" built hidden, publish on certification; count-based figures now, labelled provisional, swapping to official automatically; brand becomes "Israel Votes" with no year anywhere; /api/v2 promise removed (code stays dark), CSV downloads instead; translations written by Claude and published without a queue; 2019-2022 back-filled as summary edition pages; home keeps the chamber hero until a government is sworn in, then a standing-reference home; briefing twice daily until certification; count log on /changes; lists below the threshold greyed and kept for the record after certification; no email formation topic until delivery exists.
Wave 1: PR 42 merged; 41 (lint fixed by lead) and 43 merging. Wave 2 slices: S1 reference prose and guides; S2 records and data (profiles, polls, communities, ballot, party history); S3 platform (one election config, brand, editions, exports, OG, embeds, count log, vote map, workflows); S4 translations; S5 certification-gated (scorecard, freeze, home switch).
