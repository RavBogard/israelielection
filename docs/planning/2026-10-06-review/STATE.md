# Site-wide review: build state

## Decision (Daniel, 2026-10-06)

"all of this is approved." Every item in RECOMMENDATIONS.md (5 major, 10 medium, 25 small) is approved to build, including the three choices put to him: the new menu grouping (Major 1), re-hueing the stance ramp (Major 4) and the All resources page (Medium 7). He asked for preparation only, then a compaction, then the build.

Readings of open points, logged as gates:
- GATE: Medium 7, All resources becomes a visual index (a thumbnail per tool with live captions), not retired. Proceeded because the October 5 handoff asks to "preserve a complete resource directory" and the visual index keeps it while meeting graphic first.
- GATE: Small 6, browser-tab titles become "%s | Israel Votes 2026". Proceeded because it was the recommendation as written and it was approved.
- GATE: Small 7, the CSV licence line drops "teaching": "Original text is CC BY-NC 4.0 ..." with credit and link unchanged. Proceeded because Daniel approved the item; the licence's scope and terms are not changed, only the word "teaching", which no longer names anything on the site. PRODUCT.md licence wording to match.
- GATE: content-lane items (data/journeys.json teaching route, American lens subtitle in content/american-lens.mdx) are edited by this session. Proceeded because Daniel approved them directly; each change is a deletion or a shortening, no new claims.
- GATE: Major 4 palette. Graphite ramp with fixed endpoints about #34322d to #e4e2db, numeral rule and light/dark split kept; check contrast of the numeral on every step in both themes before shipping, and update DESIGN.md and .impeccable/design.json.

## Build order

Each wave: build, screenshot desktop 1440 and phone 390 (light and dark for touched pages), fix, commit, push. Finish review and documenter after the last wave.

1. **Shared components first** (Medium 6), because later waves use them: PageHead (one title size), SeatBar (the 120 bar with the 61 tick, replacing .pp-majority, .cb .ma-bar, .pn-bar, .ps-bar), .fig-src and .fig-key, bar segments renamed off .seg, one section-heading scale, .note split into .callout and .fig-note. Token hygiene (Small 25) in the same pass.
2. **Navigation** (Major 1, Mediums 7–8, Smalls 1–6, 8): regroup lib/site.ts into Polls and news / Parties / Voters and places / How it works, About to utilities, tools row, live facts in place of preview sublines, phone menu order with current group open, no duplicate countdown, plainer labels, "and", search eyebrow and empty state, Start here order, visual All resources, footer without "Find your way", tab title, DESIGN.md navigation section. Update tests that pin the nav catalog.
3. **Polls and home** (Majors 2–3, Mediums 3, 9, Smalls 9–13): bloc race over time with poll dots and range band, pick-a-party chart, house effects, slimmer table, change figures and newest-poll line on home, news opening bar and grouping, one number per fact and one bloc order (export BLOC_ORDER), Updated date.
4. **Stance ramp and Compare colour** (Major 4, Medium 10, Smalls 15, 19): graphite ramp, party-coloured Compare columns, slot glyph on profile stance tiles, dark-mode stroke lift for party lines.
5. **Charts** (Major 5, Smalls 18, 21–23): transpose election-across-columns tables into lines or sparklines, reference rules on bars (threshold 1px, 61 2px), dot-plot values at marks, coalition seats label, seats table on phones, timeline collisions.
6. **Tools** (Mediums 1–2, 4–5, Smalls 14, 16–17, 24): Builder sticky top only and poll select, Party Map full width with preview on selection, Results election-night layout, vote map list-colour ramp and dark mode, slip role duplicate, family tree marks, ballot toggle, left-edge accents.
7. **Content-lane and copy** (Smalls 7, 20): journeys.json teaching route, licence line, American lens subtitle.
8. **Finish review** (impeccable-finish-reviewer on fresh captures), apply fixes, **documenter** updates DESIGN.md.

## Status

- [ ] Wave 1 shared components
- [ ] Wave 2 navigation
- [ ] Wave 3 polls and home
- [ ] Wave 4 stance ramp and Compare
- [ ] Wave 5 charts
- [ ] Wave 6 tools
- [ ] Wave 7 content and copy
- [ ] Wave 8 finish review and documentation
