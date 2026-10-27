# Election night, 2026-10-27: state

Polls closed 20:00 UTC (22:00 Israel). Worktree for lead edits: C:/Users/dsbog/ie-live.

## Done
- 20:3x UTC: Channel 12, Channel 13 and Kan 11 first exit polls entered by hand in data/polls.json (82926a3). All direct broadcaster adapters and the Wikipedia fallback had no usable exits.
- 20:4x UTC: live forecast reads hand-entered exits as an authoritative `manual` transport (9774cc3). 20:30 UTC cycle: mode exit; blocs net 50 (46-53), opp 52 (49-55), arab 17 (15-20); Likud largest 71%.

## Daniel's rulings (popups, 2026-10-27 ~20:50 UTC)
1. Home hero grid default: live forecast (exit-informed). 2. Keep headline "Polls have closed." 3. Exit polls on home: table under the hero AND grid can switch to any single exit poll. 4. Caution: one clear line next to the exit polls (estimates, often off by a few seats per list, the count decides). 5. /results: exit polls at the top. 6. Updated versions: latest only, with update time. 7. No exit-poll average (forecast covers it). 8. Channel 14 exit poll: shown, set apart, outside the model. 9. All seven editions at once. 10. Builder default: live forecast. 11. Site-wide masthead: compact exit-poll bloc line linking home. 12. When the count flows: forecast leads, partial count beside, exits stay until final. 13. Enter every exit update as it airs. 14. Single-source update: publish if it sums to 120 and matches independently reported bloc totals; note the source. 15. Times: Israel time plus reader's local. 16. Share cards: live forecast seats.

GATE: building UI changes straight to main via PRs without a preview gate. Proceeded because Daniel asked to "make the changes and deploy" tonight.
