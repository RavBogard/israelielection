---
name: Israel Votes 2026
description: The shape of a majority. Paper and two inks; 120 seats, 61 marked; colour only as data.
colors:
  paper: "#f6f5f1"
  sheet: "#ffffff"
  cell: "#e4e2db"
  ink: "#000000"
  text: "#2a2925"
  ink-2: "#5f5d57"
  ink-3: "#8b8880"
  line: "#dedcd5"
  line-2: "#bdbab1"
  warn-bg: "#fff4c7"
  warn-ink: "#5a4200"
  warn-line: "#e6cf74"
  info-bg: "#efede7"
  info-ink: "#4a4843"
  info-line: "#c9c6bd"
  bloc-net: "#233f86"
  bloc-net-ink: "#ffffff"
  bloc-opp: "#d98a1f"
  bloc-opp-ink: "#16120a"
  bloc-mid: "#3fb0a2"
  bloc-mid-ink: "#0b1a18"
  bloc-arab: "#8d4fae"
  bloc-arab-ink: "#ffffff"
  stance-ramp-start: "#233f86"
  stance-ramp-end: "#dfe6f5"
  stance-numeral-on-dark: "#ffffff"
  stance-numeral-on-light: "#000000"
  tint-base: "#e9ecf2"
  map-low-dark: "#2a2d33"
  party-fallback: "#8c939b"
  dark-paper: "#121210"
  dark-sheet: "#1b1a17"
  dark-cell: "#2b2a26"
  dark-ink: "#ffffff"
  dark-text: "#e6e3da"
  dark-ink-2: "#b4b0a5"
  dark-ink-3: "#85817a"
  dark-line: "#2f2e2a"
  dark-line-2: "#45433d"
  dark-warn-bg: "#3a300f"
  dark-warn-ink: "#f1d98a"
  dark-warn-line: "#6b5722"
  dark-info-bg: "#23221e"
  dark-info-ink: "#cfc8b8"
  dark-info-line: "#45433d"
  dark-bloc-net: "#5a7bd0"
typography:
  display-hero:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "clamp(44px, 5.6vw, 76px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "clamp(38px, 4.4vw, 56px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "clamp(26px, 2.4vw, 32px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  standfirst:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "clamp(18px, 1.5vw, 21px)"
    fontWeight: 400
    lineHeight: 1.45
  prose:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  figure-number:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
  ballot-letters:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: 1
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  paper: "0px"
  control: "4px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "22px"
  xl: "36px"
  section: "44px"
  column-gap: "56px"
  gutter: "clamp(16px, 3vw, 40px)"
  wrap: "1200px"
  wide: "1320px"
  reading: "700px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    typography: "{typography.body}"
  button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
  segmented:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.paper}"
    padding: "22px"
  slip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.paper}"
    padding: "14px 14px 8px"
    height: "190px"
  stance-tile:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.paper}"
    padding: "0 9px 10px"
    height: "132px"
  glance-cell:
    textColor: "{colors.ink}"
    typography: "{typography.figure-number}"
    padding: "14px 14px 12px"
  majority-bar:
    backgroundColor: "{colors.cell}"
    height: "10px"
  voter-base-bar:
    backgroundColor: "{colors.cell}"
    height: "30px"
  matrix-cell:
    textColor: "{colors.stance-numeral-on-dark}"
    rounded: "{rounded.paper}"
    height: "44px"
  matrix-cell-light-shade:
    textColor: "{colors.stance-numeral-on-light}"
  bloc-bar:
    backgroundColor: "{colors.cell}"
    height: "44px"
---

# Design System: Israel Votes 2026

## Overview

**Creative North Star: "The Shape of a Majority"**

An Israeli voter drops a printed slip in an envelope; the count turns slips into 120 seats; 61 is a government. The system makes that arithmetic the identity: a grid of 120 squares with one heavy rule meaning 61, and party cards drawn as ballot slips with real Hebrew letters. Everything else is paper and two inks (black for display, numbers, rules and selected states; dark grey for prose), set ragged right on one left edge.

Colour is never decoration. The four bloc colours mark bloc context; each list's editorial colour (lib/party-colors.ts) owns that list's surfaces and figures; a shared ordinal ramp shows where an answer sits in its issue's order. A page with no data on it is black and white.

Density is a reference work's: figures sit beside the sentences they illustrate, every number dated and sourced, sources folded one tap away at the foot.

**Key Characteristics:**
- 120-seat grid, 12 across, heavy rule under row five so the next cell is the 61st.
- Party cards are ballot slips: square sheet, hairline edge, colour bar on top, Hebrew letters in Frank Ruhl 900.
- Frank Ruhl Libre carries display, numbers and reading prose; Public Sans carries labels, controls, tables and captions.
- Square, flat paper; 4px only on controls; one drawer shadow in the whole system.
- Colour appears only where it encodes data.

## Colors

Paper and two inks, with colour reserved for data.

### Primary
- **Ballot Black** (ink): display type, numbers, rules, link text, focus rings and every selected state. Inverts to white in dark mode.

### Secondary (data: the four blocs)
- **Coalition Navy** (bloc-net; dark mode bloc-net in dark-bloc-net): the Netanyahu bloc.
- **Opposition Amber** (bloc-opp): the Zionist opposition.
- **Between Teal** (bloc-mid): unaligned lists.
- **Arab-led Violet** (bloc-arab): Arab-led lists.
- Each bloc has a paired ink (`-ink` tokens) chosen for contrast when a surface is filled with it.

### Tertiary (data: lists and stances)
- **Party colours**: one editorial colour per current list, grouped by political family in related shades (likud #245b94, otzma #514394, rz #7d67b3, noam #b29bda, poi #597fbd, shas #147c88, utj #65adb5, byachad #ce542d, yashar #ed9859, dem #a72f65, yb #9e3826, bw #db7898, res #b48727, jl #267b44, raam #80b667; unknown lists fall back to party-fallback). Text on a party colour is black or white by WCAG luminance (threshold 0.179), never chosen by eye. Source of truth: lib/party-colors.ts.
- **Stance ramp** (stance-ramp-start to stance-ramp-end): `color-mix(in oklab, #233f86 (100 - position*80)%, #dfe6f5)`, position 0 at the first option of an issue's scale. The shade means the answer's place in the issue's order, from one end of the debate to the other; it does not say how near an answer sits to the governing coalition. The light end is therefore 20% navy, not the pure end token. Same shade for every list holding the same stance, on the profile tiles and in the Compare matrix.
- **Stance numerals** (stance-numeral-on-dark, stance-numeral-on-light): the answer's number on a ramp shade is #fff on the dark half (position under 0.5) and #000 on the light half; on the ink-2 fill of unordered answers it is the page ground (`var(--bg)`).
- **Tint base** (tint-base): the fixed light endpoint for party-colour tints in figures (voter-base bar, locality dot map).

### Neutral
- **Cool Paper** (paper): page ground; also the drawer ground.
- **Sheet White** (sheet): slips, panels, tiles, segmented controls.
- **Empty Cell** (cell): unfilled seat cells and the empty track of every bar.
- **Prose Ink** (text): reading prose and standfirsts.
- **Secondary Ink** (ink-2) / **Tertiary Ink** (ink-3): labels and meta; sources, captions and placeholders.
- **Hairline** (line) / **Strong Hairline** (line-2): row dividers; sheet edges and link underlines.
- **Notice** (warn-*) and **Info** (info-*) triplets for callouts.
- Overlay: scrim `rgb(0 0 0 / .45)` light, `/ .6` dark; drawer shadow colour `rgb(0 0 0 / .22)` light, `/ .6` dark.

### Dark mode
Follows `prefers-color-scheme` unless `data-theme` pins it. Swaps every neutral to its `dark-` token and the navy to dark-bloc-net; the other bloc colours, party colours, the stance ramp and the tint base stay fixed so a figure reads the same in both modes. Print forces paper, black ink and the light navy, and keeps grid, swatch and slip colours with `print-color-adjust: exact`.

### Named Rules
**The Colour Is Data Rule.** A colour appears only where it encodes a bloc, a list or a stance position. Chrome, headings, links and buttons are ink.

**The Fixed Endpoints Rule.** Ramps and tints use fixed endpoints (stance-ramp-start/end, tint-base), not theme variables, so a shade means one thing in light, dark and print. The Compare matrix draws the same ramp with the same endpoints (`shade()` in components/compare/model.ts), as do the profile tiles, so one answer has one shade wherever it appears. The one exception is the locality map's low end, which dims to map-low-dark on dark paper so weak places never outshine strongholds.

## Typography

**Display Font:** Frank Ruhl Libre (with Georgia, Times New Roman, serif), weights 400/500/700/900, Latin and Hebrew subsets, via next/font as `--font-frank`.
**Body Font:** Public Sans (with system-ui, -apple-system, Segoe UI, sans-serif), weights 400/500/600/700, via next/font as `--font-sans`.

**Character:** One Hebrew-newspaper serif carries the voice, the numbers and the reading prose; a plain US civic sans does the interface. They never swap roles.

### Hierarchy
- **Display hero** (display-hero): the home headline only.
- **Display** (display): every page title in the page head; the profile running head uses clamp(38px, 4.2vw, 54px), tools clamp(34px, 3.6vw, 48px).
- **Headline** (headline): section heads on a 1px ink rule; profile text-column heads clamp(24px, 2.2vw, 28px).
- **Standfirst** (standfirst): the sentence under every page title, prose ink, max 62ch.
- **Prose** (prose): notes and reading text, max 72ch; profile prose 16.5-17px at 1.55.
- **Figure number** (figure-number): at-a-glance numbers and big counts, tabular. Smaller figure numbers in Frank Ruhl 700: 36px slip seats, 25px home bloc values, 22px bloc totals, 15-17px chart end labels and table cells.
- **Ballot letters** (ballot-letters): Hebrew list letters, 900 weight; 54px in the profile running head, 32px on phone slips.
- **Body** (body): interface text, controls (14-14.5px, 500-600), tables 14.5px.
- **Label** (label): sentence case, ink-2, or ink when sitting on a figure's rule.
- **Caption** (caption): source lines in ink-3; 12.5px inside figures; chart ticks 11.5px.

### Named Rules
**The Sentence Case Rule.** No all-caps labels and no tracking-out. Labels are Public Sans 600 13px, sentence case.

**The Tabular Numbers Rule.** Every number that can be compared (tables, meters, seat counts, glance figures, source list markers) uses tabular numerals.

**The Plain Headline Rule.** Headlines carry no eyebrow above them and no single accented word.

## Layout

- **Wrapper:** one wrapper on every page, max wrap (1200px) with gutter `clamp(16px, 3vw, 40px)`; wide data views (treemap, poll table) may use wide (1320px). Reading column 700px, left-aligned inside the wrapper. Every page title sits on the same left edge. Ragged right; nothing centred.
- **Masthead:** nameplate row (34px mark, Frank Ruhl 700 26px wordmark, utilities, countdown) over a row of three grouped disclosure menus, closed by a 1px ink rule. Under 900px: brand plus a Menu toggle; groups stack in place.
- **Page head:** title (display), standfirst 14px below, optional note (14px ink-2, 70ch). Padding 36px top, 24px on phones.
- **Section head:** headline set 44px below the previous block, 14px padding over a 1px ink top rule.
- **Spread (party profile and home hero):** two columns 5/12 figures + 7/12 text, column gap 56px (home 64px), row gap 44px, each figure on the same grid row as its first sentence. Under 860px one column, figure directly above its text.
- **Footer:** 1px ink rule, 64px above; brand and about (1.2fr) beside three link columns (2fr); one column under 860px.
- **Breakpoints observed:** 1100 (tool panels unstick, tiles shorten), 900 (masthead collapses), 860 (spreads and footer stack), 700/640 (heads tighten), 520 (tiles two across), 440 (map stacks over its table).

## Elevation & Depth

Flat. Depth is conveyed by sheet-on-paper contrast and hairlines, never by shadow. The one shadow is the drawer that opens over the Coalition Builder and Party Map: `box-shadow: -16px 0 48px var(--shadow)` over a scrim, removed on phones where the drawer is full width.

### Shadow Vocabulary
- **Drawer** (`box-shadow: -16px 0 48px rgb(0 0 0 / .22)`; dark `/ .6`): the profile drawer only, with the scrim behind it.

### Named Rules
**The Flat Paper Rule.** Sheets, slips, tiles, panels and grid cells take no shadow. Lift is a hairline (line-2) on sheet white; hover is the hairline turning ink.

## Shapes

- Radius 0 on paper (rounded.paper): slips, sheets, panels, tiles, grid cells, bars, chips.
- Radius 4px on controls only (rounded.control): buttons, segmented controls, alphabet and timeline buttons.
- Circles only for data points: sparkline dots, key dots, locality dots, timeline events.
- Hairlines are 1px (line between rows, line-2 on sheet edges); structural rules are 1px ink (masthead, section heads, figure labels, sources, footer).
- **The 61 Rule.** The only heavy rule in the system is the majority line: 2.4 units in the seat grid, a 2px ink tick at 61/120 in the majority bar and in the polls page bloc bar, and the 2px tick at 61 on each bloc strip axis. A heavy rule anywhere else is wrong.
- **The Pull Quote Rule.** The only left-edge colour rule is the 3px party-colour rule on a pull quote (ink when no party colour applies). Slips and party letter boxes carry their colour as a top bar instead (5px slip, 4px compare chip and drawer letters).
- Dashed means absent or out: a slip out of a coalition, a tile with no recorded stance, the 2022 reference line, the West Bank line on the map.

## Components

### Buttons
- **Shape:** 4px (rounded.control), 1px ink border.
- **Default:** transparent, ink text, Public Sans 600 14.5px, 8px 14px. Hover fills ink with paper text.
- **Primary:** ink fill, paper text; hover ink-2.
- **Focus:** 2px ink outline, 3px offset (global).

### Segmented control
- One 1px ink frame, 4px radius, sheet white; options split by 1px line; option 14px 500, optional small second line 11.5px ink-3 tabular.
- Selected (`aria-pressed="true"`): ink fill, paper text, 600. Hover: paper.

### Links
- Ink, underlined 1px in line-2 at 3px offset; underline goes to currentColor on hover. Current page in nav: 2px underline. No arrows.

### Navigation (masthead)
- Three groups as full-height disclosure buttons (Public Sans 600 15px with an 11.5px preview line), divided by hairlines; the active section carries a 2px ink bottom rule. Panels are sheet white in a 1px ink frame. Disclosure buttons carry a small rotated-square caret; links never do. Under 900px: a bordered Menu toggle that inverts when open, groups stacked.

### Sheet
- Sheet white, 1px line-2 edge, square, no shadow. Tool side panels: 22px padding, sticky at 16px above 1100px.

### SeatGrid (signature)
- 120 cells, 12 across and 10 down, cell 10 on a 12-unit pitch, filled from the top left in segment order; fractional seats allocated by largest remainder. Empty cells use cell. A 2.4-unit ink rule under row five; optional "61" label in Frank Ruhl 700 beside it.
- Variants in code: `hero` and `meter`. The home mosaic is a sibling SVG in the same class. The mark and the share card redraw the same shape.
- Segments with an href become one accessible link; hover strokes cells ink .7, focus 1.4.
- Motion: the home hero fades cells in once (0.32s, 6ms stagger); nothing else moves unprompted; reduced motion turns it off.

### Ballot slip (signature)
- Sheet white, 1px line-2 edge, 5px top bar in the fill colour, min-height 190px (170 on phones), auto-fill columns min 176px, 14px gap.
- Letters Frank Ruhl 900 40px; name 700 16.5px; leader 13.5px ink-2; seats Frank Ruhl 700 36px bottom, tabular; a dashed hairline foot with one underlined "Profile" text link.
- Selected: full fill colour with its paired ink. Out: transparent, dashed edge, top bar at 40% fill, ink-3 text. Hover: edge goes ink.

### Sources
- A native disclosure at the page foot: 48px above, 1px ink top rule, summary "Sources" in Frank Ruhl 700 20px with the count in Public Sans 14px ink-3 and an open/close hint pushed right. Numbered list (citations are a reference sequence), 13.5px ink-2, 110ch. Open by default on single-subject pages.

### Drawer profile
- Fixed right, min(620px, 100%), paper ground, 1px ink left edge, the one drawer shadow, slides in 0.2s ease-out (off under reduced motion). Letters box with a 4px top bar in the party colour; label-on-rule section heads; poll bars 12px on cell.

### Party profile figure vocabulary
Each figure is a label on a 1px ink rule, the figure, then a 12.5px source line, 12px apart. The party's colour (`--pc`, with `--pc-ink`) owns the running head and every figure; bloc colours mark bloc context only.
- **Running head:** full-bleed band in the party colour with paired ink; letters 54px in a 1.5px frame at 70% ink; name as display; a bloc chip and the bloc total right-aligned.
- **At-a-glance block:** four numbers two by two in a hairline (line-2) grid; figure-number values, 13px 600 label below, 12.5px ink-3 qualifier. Secondary values ("of 61") 18px 500 ink-2.
- **Majority bar:** a 10px bar on cell representing 120 seats, filled to the bloc's seats in the bloc colour, with a 2px ink tick at 61 overhanging 4px each side.
- **Seat sparkline:** every poll since dissolution in the party colour; line 2px with round joins; solid dots r 3.4 for pollsters in the main average, hollow dots r 4 (sheet fill, colour stroke 1.5) for the pollsters the alternative average excludes; the 2022 result as a 1.2px ink dotted rule (2 4) with a 600 label; hairline gridlines, 11.5px ink-3 ticks, end value in Frank Ruhl 700 15px. A key underneath names both point styles.
- **Voter-base bar:** one 30px stacked bar on cell, segments split by 1.5px sheet gaps, tints of the party colour toward tint-base at fixed steps 100 / 68 / 42 / 22%; key with 9px squares and Frank Ruhl 700 16px values; then a "share won" list with 10px party-colour bars on cell.
- **Locality dot map:** localities as dots sized by valid votes (r 1.1 / 1.9 / 2.6), shaded from the ramp's low end to the party colour by share relative to the party's strongest (low end tint-base on light paper, map-low-dark on dark, so the strongest places are always the most saturated marks); labelled localities r 4-5 with a 0.8 ink stroke and a 10.5px 600 label haloed in paper; West Bank as a dashed ink-2 line. A table beside it: strongest localities, the national share on an ink rule, the big cities; values Frank Ruhl 700 17px tabular. Stacks under 440px.
- **Stance tiles:** seven tiles, four across (two under 520px), 8px gap, sheet white, 1px line-2 edge, min-height 132px. A 9px top bar in the stance ramp shade; ink-2 (grey) bar when the issue's options are not a scale (Economy); dashed tile, transparent bar and italic ink-3 text when no stance is recorded. Issue 12px 600 ink-2; stance Frank Ruhl 700 16px; basis 11px ink-3 at the foot. Hover: edge goes ink. Open: 2px ink frame with a square pointer into the panel below. The panel (sheet, line-2, 16px 18px) gives the question, the party's own words in prose, the source, and chips for lists holding the same stance. One tile open at a time; the first recorded stance opens on load.

### Compare matrix
One table: questions down the side, every list across, each cell the list's recorded answer. Real row and column headers; bloc colour appears only as a 3px bar over each column group and on the chips and key dots, never in the cells. Source: components/Compare.tsx, components/compare.css, components/compare/model.ts.
- **Column-set control:** a "Show" label and a segmented control (the same frame, 4px radius, 14px 500 options with an 11.5px tabular second line) choosing every list, either bloc, the core opposition, the outgoing government or the reader's own set; beside it a link into the Coalition Builder.
- **Choose lists one by one:** a native disclosure, 14px 600. Open, it sets four bloc columns, each headed by a 10px bloc swatch and name on a 1px ink rule, with list chips (sheet, line-2 edge, 4px party-colour top bar, Hebrew letters 17px); a chosen chip fills with the party colour and its paired ink. A live hint says how many are chosen; two is the fewest.
- **Key:** under a 1px ink rule, 13px ink-2. The ramp as five 22 by 16 swatches with its meaning, then the cell states as 16px glyphs, then "Open any row for every list's own words and source" in 600.
- **Bloc header row:** each bloc's name, 12.5px 600, under a 3px bar in the bloc colour, spanning its lists; a 12px gap separates blocs.
- **Vertical names:** each list's name set vertical, read bottom to top, 12.5px 600 ink, max 150px, a link to the profile; underline on hover.
- **Pinned strip:** the ballot letters (Frank Ruhl 900 17px in a small sheet box with a 4px party-colour top bar) and the seats in the polling average (Frank Ruhl 700 15px tabular; "out" in Public Sans 11.5px ink-3 for lists out of the average) stay sticky at the top over a 1px ink rule while rows scroll beneath. The corner carries "Seats, polling average" in 12px ink-3.
- **Rows:** a 1px hairline between rows, 1px ink above each of the seven issues, dotted line-2 above the narrower questions, which are indented 18px and set in Public Sans 600 14px against the issue's Frank Ruhl 700 18px. The row header is a button with a small rotated-square caret, the question in 13px ink-2, and a legend.
- **Row header legend:** one line per answer: a 17 by 15 key in the answer's shade with its number, the answer's label in 12.5px ink-2, and the seats those answers hold in the polling average (Frank Ruhl 700 13.5px tabular, right-aligned). The answer under the pointer turns ink 600. A row with no recorded answers says so in italic ink-3.
- **Cell states:** 44px tall (30px on narrow questions), square, 2px apart. A stance is the ramp shade with its number, 13px 700 tabular, in stance-numeral-on-dark or stance-numeral-on-light. A top-right 6px notch in the page ground marks an answer taken from the record rather than a questionnaire answer. None: dashed line-2 border, empty. Declined: line-2 border with a 135-degree ink-3 hatch (1px lines, 5px pitch). Recorded, not classified: a sheet-white cell with a line-2 edge, no number. Priorities that can coexist (unordered options): ink-2 fill with the number in the page ground.
- **Hover and focus:** hovering or focusing a cell dims every cell in that row not holding the same answer to 28% and gives the matching cells a 1px ink outline at 1px offset; the legend line for the answer turns ink. Keyboard focus is a 3px ink ring at 3px offset. Opacity eases .12s, off under reduced motion.
- **Open-row panel:** a full-width sheet row under the question: sheet white, line-2 edge, a 1px ink top edge, padding 18px 22px. The question in Frank Ruhl 19px, a one-line reading of the field in 14px ink-2, then one group per answer (keyed heading on a hairline), each list's own words in Frank Ruhl 16px prose over a 12.5px ink-3 source line, two columns; then the lists recorded but not classified, then those with no position found or declined, set quieter, with the evidence date; a note and links at the foot.
- **Phone reflow (under 760px):** the table becomes a grid with one column per list shown, so all fourteen fit with no sideways scroll; each question label spans the full width above its row of cells, the legend runs as a wrapped row, cells drop to 34px (24px on narrow questions), names to 10.5px, letters to 11px, bloc names to 10.5px, and the open panel stacks to one column. The pinned letters row stays sticky; the corner cell is kept out of sight so headers still pair with cells. At 1100px the row-header column narrows from 300px to 230px.

### Polls overview
Under "What the polls say now" on the polls page: a bloc bar, two bloc strips, then a dot table. Bloc colours mark blocs; party colours mark lists. Source: components/polls/PollsNow.tsx, components/polls/polls-now.css.
- **120-seat bloc bar:** 44px on cell, segments in the bloc colours with their paired ink, in the order Netanyahu bloc, between, Arab-led, opposition, separated by 2px page-ground gaps, each labelled with its seats in Frank Ruhl 19px (the between segment 14px, hidden on phones). A 2px ink majority tick at 61 overhangs 6px top and bottom. Below it a key of 10px swatches, bloc names and tabular totals. The numbers are the average scaled to 120.
- **Bloc-per-poll strips:** one for the Netanyahu bloc and one for the opposition, each headed by the swatch, the name in 600 and a plain reading of how many polls reach 61 and the range. The axis runs 40 to 70 seats with ticks every 5 (11.5px ink-3) on a line-2 baseline; a 2px ink rule at 61 with "61" in Frank Ruhl 14px beside it. Each poll is a 13px dot in the bloc colour, polls landing on the same number stacked 22px apart. Polls from the pollsters the alternative average excludes are hollow dots (page-ground fill, bloc-colour 2px ring). Each dot carries its pollster's name, 11px ink-2, rotated 40 degrees up from the dot; hidden on phones, where the axis drops from 84px to 54px and the title tooltip carries the name.
- **List dot table:** each list is a row grouped by bloc and ordered by average seats, with the bloc name over the first row of its group on a 10px swatch. Beside the name, average, range, passes and alternative-average columns sits a chart column: a 22px track on a seat axis (0 to 30 or beyond, ticks every 5) holding a bar at the average, 8px high in the party colour at 55% opacity, drawn only when the list's average is stated; a 14px dot per poll in the party colour with a 2px sheet-white ring; hollow dots (page ground, party-colour ring) for the excluded pollsters; a dashed 1.5px ink-3 ring on an empty dot for a poll that had the list below the threshold; and a dashed line-2 line at 4 seats for the threshold. A key beneath names each mark. Under 760px the chart column narrows to 150px and the list name may wrap.

## Do's and Don'ts

### Do:
- **Do** draw any count of the Knesset as the 120-seat grid or a 120-seat bar, with the heavy ink rule at 61.
- **Do** keep colour to data: bloc colours for blocs, the list's own colour for that list, the stance ramp for stance positions.
- **Do** pick text on a party or bloc fill by luminance (partyInk or the `-ink` tokens).
- **Do** set every page head as title, then standfirst, inside the 1200px wrapper on the shared left edge.
- **Do** put a figure beside the sentences it illustrates, with a label on an ink rule and a dated source line.
- **Do** use 0 radius on paper and 4px on controls.
- **Do** fold sources into the end-of-page disclosure, open by default on single-subject pages.
- **Do** use dashed strokes to mean absent, out or reference.
- **Do** shade a stance by its place in the issue's order, with the same ramp everywhere an answer appears.

### Don't:
- **Don't** set labels in all caps or tracked-out caps.
- **Don't** put an eyebrow or kicker above a headline.
- **Don't** append arrows to links.
- **Don't** build meta lines as middle-dot strings.
- **Don't** number items (01/02/03) unless the content is a sequence; list slot numbers and source citations are data, not markers.
- **Don't** draw a heavy rule that does not mean 61.
- **Don't** use a coloured left rule anywhere but the 3px party-colour rule on a pull quote.
- **Don't** add shadows to paper; the drawer is the only shadow.
- **Don't** draw the Knesset as a hemicycle.
- **Don't** colour chrome, headings or buttons.
