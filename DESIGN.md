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
  ink-3: "#706d66"
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
  stance-ramp-start: "#34322d"
  stance-ramp-end: "#eae8e1"
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
  dark-ink-3: "#8d8982"
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
  headline-3:
    fontFamily: "Frank Ruhl Libre, Georgia, Times New Roman, serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.005em"
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
  matrix-cell-unordered:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
  bloc-bar:
    backgroundColor: "{colors.cell}"
    height: "44px"
---

# Design System: Israel Votes 2026

## Overview

**Creative North Star: "The Shape of a Majority"**

An Israeli voter drops a printed slip in an envelope; the count turns slips into 120 seats; 61 is a government. The system makes that arithmetic the identity: a grid of 120 squares with one heavy rule meaning 61, and party cards drawn as ballot slips with real Hebrew letters. Everything else is paper and two inks (black for display, numbers, rules and selected states; dark grey for prose), set ragged right on one left edge.

Colour is never decoration. The four bloc colours mark bloc context; each list's editorial colour (lib/party-colors.ts) owns that list's surfaces and figures; a shared graphite ramp shows where an answer sits in its issue's order. A page with no data on it is black and white.

Two owner rulings (Daniel, 2026-10-06) shape every page. Graphic first: each page opens with its infographic, and the page head is the title plus at most one short sentence; method, notes and caveats go in captions, folds or below. Teaching resources were dropped (the interactive embeds stay), so no surface is designed for a classroom.

Density is a reference work's: figures sit beside the sentences they illustrate, every number dated and sourced, sources folded one tap away at the foot.

**Key Characteristics:**
- 120-seat grid, 12 across, heavy rule under row five so the next cell is the 61st.
- Party cards are ballot slips: square sheet, hairline edge, colour bar on top, Hebrew letters in Frank Ruhl 900.
- Frank Ruhl Libre carries display, numbers and reading prose; Public Sans carries labels, controls, tables and captions.
- Square, flat paper; 4px only on controls; one drawer shadow in the whole system.
- Colour appears only where it encodes data; government figures are ink, because a coalition is not a bloc.
- One number per fact: a list's seats are the polling average scaled to 120, one decimal, or "below", wherever they appear.
- Every page opens with its graphic, then the words.

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
- **Graphite stance ramp** (stance-ramp-start to stance-ramp-end, CSS `--ramp-start` / `--ramp-end`): `color-mix(in oklab, var(--ramp-start) (100 - position*80)%, var(--ramp-end))`, position 0 at the first option of an issue's scale (`shade()` in components/compare/model.ts). A warm graphite, not a bloc colour, so the shade means only the answer's place in the issue's order, from one end of the debate to the other; it does not say how near an answer sits to the governing coalition. The light end is 20% graphite, not the pure end token. Same shade for every list holding the same stance: profile tiles, the Compare matrix, the Positions block and the issue splits.
- **Stance numerals** (stance-numeral-on-dark, stance-numeral-on-light): the answer's number on a ramp shade is #fff on the dark half (position under 0.5) and #000 on the light half; components/compare/ramp.test.ts pins every step at 4.5:1 or better and checks the start token stays graphite.
- **Ramp edge** (`--ramp-edge`): transparent on light paper and in print, ink-3 on dark paper, drawn as a 1px inset edge on dark-half shades and record cells so the dark end of the ramp does not sink into the dark page.
- **Coexisting answers**: options that are priorities rather than a scale take no ramp step. They are sheet paper with a faint line-2 dot screen (0.9px dots on a 5px pitch), a 1px inset ink edge and an ink numeral (`UNORDERED_FILL`, `UNORDERED_EDGE`), so they read neither as a ramp shade nor as an empty bar.
- **Tint base** (tint-base): the fixed light endpoint for party-colour tints in figures (voter-base bar, locality dot map, closed-state resource thumbnails).
- **Party fallback** (party-fallback, `PARTY_FALLBACK`): the one grey for a list with no editorial colour (unlisted Builder segments, the home mosaic).
- **Party strokes**: lines and dots in a list's colour use `partyStroke` (lib/party-colors.ts), the party colour moved toward black on light paper or toward white on dark paper just far enough to reach 3:1, applied through `strokeVars` and the `.pstroke` class (components/party-stroke.css), which switches to the dark stroke under the dark theme and back to the light one in print. Area fills (slips, bars, map cells, swatches) keep `partyColor`.

### Neutral
- **Cool Paper** (paper): page ground; also the drawer ground.
- **Sheet White** (sheet): slips, panels, tiles, segmented controls.
- **Empty Cell** (cell): unfilled seat cells and the empty track of every bar.
- **Prose Ink** (text): reading prose and standfirsts.
- **Secondary Ink** (ink-2) / **Tertiary Ink** (ink-3): labels and meta; sources, captions and placeholders. Light ink-3 is #706d66, darkened so small caption text clears 4.5:1 on paper; dark ink-3 is #8d8982 for the same reason on dark paper.
- **Hairline** (line) / **Strong Hairline** (line-2): row dividers; sheet edges and link underlines.
- **Notice** (warn-*) and **Info** (info-*) triplets for callouts.
- Overlay: scrim `rgb(0 0 0 / .45)` light, `/ .6` dark; drawer shadow colour `rgb(0 0 0 / .22)` light, `/ .6` dark.

### Dark mode
Follows `prefers-color-scheme` unless `data-theme` pins it. Swaps every neutral to its `dark-` token and the navy to dark-bloc-net; the other bloc colours, party fills, the stance ramp and the tint base stay fixed so a figure reads the same in both modes. Three things answer the dark page instead: the ramp edge turns on, party strokes lighten to their dark value, and the map low ends darken. Print forces paper, black ink and the light navy, and keeps grid, swatch and slip colours with `print-color-adjust: exact`.

### Named Rules
**The Colour Is Data Rule.** A colour appears only where it encodes a bloc, a list or a stance position. Chrome, headings, links and buttons are ink.

**The Bloc Data Only Rule.** Bloc colours appear only on bloc data (the polls bloc bar and strips, the Compare group bars). Figures about the government itself, the coalition's seats and the formation clock, are drawn in ink and greys.

**The Fixed Endpoints Rule.** The stance ramp and party tints use fixed endpoints (stance-ramp-start/end, tint-base), not theme variables, so a shade means one thing in light, dark and print; one `shade()` serves every surface, so one answer has one shade wherever it appears. Two named exceptions follow the theme on purpose: the map low ends (the profile locality map dims to map-low-dark; the vote map's low end and land fill switch per theme) so weak places never outshine strongholds, and article heat tables, which blend the theme's ink into its page ground.

**The Stroke Contrast Rule.** A party-coloured line or dot reaches 3:1 against the paper in both themes through `partyStroke`; never draw a party line in the raw fill colour.

**The Bloc Order Rule.** Lists, keys, legends and tables run the blocs in `BLOC_ORDER` (Netanyahu bloc, opposition, between, Arab-led), the two contenders first. A 120-seat bar or grid runs them in `BLOC_SEAT_ORDER` (Netanyahu bloc, between, opposition, Arab-led), so the unaligned list sits between the two blocs. Both live in lib/polls.ts.

## Typography

**Display Font:** Frank Ruhl Libre (with Georgia, Times New Roman, serif), weights 400/500/700/900, Latin and Hebrew subsets, via next/font as `--font-frank`.
**Body Font:** Public Sans (with system-ui, -apple-system, Segoe UI, sans-serif), weights 400/500/600/700, via next/font as `--font-sans`.

**Character:** One Hebrew-newspaper serif carries the voice, the numbers and the reading prose; a plain US civic sans does the interface. They never swap roles.

### Hierarchy
- **Display hero** (display-hero): the home headline only.
- **Display** (display): every page title, at one size, through the shared page head (components/PageHead.tsx); tools take the same size. The party profile's running head, a band of its own, uses clamp(38px, 4.2vw, 54px).
- **Headline** (headline, `--fs-sec`): section heads on a 1px ink rule (`.sec-h`); profile text-column heads clamp(24px, 2.2vw, 28px).
- **Headline 3** (headline-3, `--fs-sec3`): a sub-section or an item in a list of sections (`.sec-h3`). Component headings that cannot take the class use the same two tokens.
- **Standfirst** (standfirst): the sentence under every page title, prose ink, max 62ch.
- **Prose** (prose): reading text and the prose reading note (`.note`) between a section head and its figure, max 72ch; profile prose 16.5-17px at 1.55.
- **Figure number** (figure-number): at-a-glance numbers and big counts, tabular. Smaller figure numbers in Frank Ruhl 700: 36px slip seats, 25px home bloc values, 22px bloc totals, 15-17px chart end labels and table cells.
- **Ballot letters** (ballot-letters): Hebrew list letters, 900 weight; 54px in the profile running head, 32px on phone slips.
- **Body** (body): interface text, controls (14-14.5px, 500-600), tables 14.5px.
- **Label** (label): sentence case, ink-2, or ink when sitting on a figure's rule.
- **Caption** (caption): figure notes (`.fig-note`, 13px ink-2) and keys (`.fig-key`, 13px ink-2); the figure source line (`.fig-src`) is 12.5px ink-3; chart ticks and small labels 12px. The page-head meta line (`.ph-meta`) is 14px ink-2.

### Named Rules
**The Sentence Case Rule.** No all-caps labels and no tracking-out. Labels are Public Sans 600 13px, sentence case.

**The Tabular Numbers Rule.** Every number that can be compared (tables, meters, seat counts, glance figures, source list markers) uses tabular numerals.

**The Plain Headline Rule.** Headlines carry no eyebrow above them and no single accented word.

**The Text Floor Rule.** No text under 12px, in CSS or SVG. Two sanctioned exceptions: the 11px footnote superscripts in the poll table, and the "61" beside the seat grid, which is set in grid units and scales with the figure.

**The One Number Rule.** A list's seats print the same everywhere: its polling average scaled to 120, one decimal (`seatFigure`), or "below" when it counts 0 (`seatText`; lib/list-seats.ts for every page); a single poll prints whole seats. The figure is always called "Seats, polling average" (`SEATS_LABEL`).

## Layout

- **Wrapper:** one wrapper on every page, max wrap (1200px) with gutter `clamp(16px, 3vw, 40px)`; wide data views (treemap, poll table) may use wide (1320px). Reading column 700px, left-aligned inside the wrapper. Every page title sits on the same left edge. Ragged right; nothing centred.
- **Masthead:** a slim line (countdown left, utilities right: Start here, Search, All resources, About, Media and corrections), the nameplate row (34px mark, Frank Ruhl 700 26px wordmark) with the tools row set right (Polls, Party Map, Coalition Builder, Vote map, News), then a row of four grouped disclosure menus, closed by a 1px ink rule. Under 900px: brand plus a Menu toggle, the countdown on one line beneath.
- **Page head:** one component on every page (components/PageHead.tsx): title (display), then at most one short standfirst 14px below, then optionally one meta line (`.ph-meta`, 14px ink-2, 10px below). A tool's controls sit in the head's aside, right of the title on wide screens and under it on narrow ones. Notes, method and caveats move to captions, folds or below the figure; the page's graphic follows the head directly (graphic first). Padding 36px top (24px on phones), 8px below. Article titles carry no kicker or breadcrumb above them.
- **Lead figure:** reference and community pages draw their chart straight under the title and leave it out of the body (`components/article/leads.ts` maps page to chart id; the chart moves, it is not duplicated). Issue pages lead with the Knesset split by answer (PositionsLead). Start here sets one figure inside every step.
- **Section head:** `.sec-h`, headline set 44px below the previous block, 14px padding over a 1px ink top rule, 10px to what follows.
- **Notes:** three kinds, never mixed. A reading note in prose (`.note`, Frank Ruhl 17px) sits between a section head and its figure; a callout (`.callout`, sheet, 1px line-2 edge, 14px 18px, Public Sans 15px) sets a definition, caution or exclusion apart; a figure note (`.fig-note`, Public Sans 13px ink-2) says how to read a figure or control.
- **Touch targets:** buttons and segmented options are at least 44px tall on coarse pointers and under 640px; phone menu links, selects and pickers keep the same 44px.
- **Spread (party profile and home hero):** two columns 5/12 figures + 7/12 text, column gap 56px (home 64px), row gap 44px, each figure on the same grid row as its first sentence. Under 860px one column, figure directly above its text.
- **Footer:** 1px ink rule, 64px above; brand, about and the utility links (1.2fr) beside four link columns, one per menu group (2fr), two across under 1100px; one column of about under 860px. The footer follows the menus' polls-close rule.
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
- Circles only for data points: sparkline dots, key dots, locality dots, timeline events. Chart marks may also be a diamond or a square (article charts), still data marks.
- Hairlines are 1px (line between rows, line-2 on sheet edges); structural rules are 1px ink (masthead, section heads, figure labels, sources, footer).
- **The 61 Rule.** The only heavy rule in the system is the majority line: 2.4 units in the seat grid, the 2px ink tick at 61/120 on every SeatBar, the 2px line at 61 in the bloc race and on each bloc strip axis, and the 2px rule at 61 on any article bar chart of seats (`barRefs` in lib/chart-form.ts, which draws a threshold row as a 1px rule instead). A heavy rule anywhere else is wrong. Every other ink rule is 1px, including the Government page's today and current-step rules and its outgoing-coalition head, which were 2px and are now 1px.
- **The Pull Quote Rule.** The only left-edge colour rule is the 3px party-colour rule on a pull quote (ink when no party colour applies). Slips and party letter boxes carry their colour as a top bar instead (5px slip, 4px compare chip and drawer letters).
- **Hatched means absent or cannot** (135-degree lines): no recorded stance (profile tile bar, Compare "none" in a light line-2 hatch), a declined answer (a denser ink-3 hatch), a list with no polling on the Party Map, the SeatBar remainder when it is set to hatch, the results board awaiting the count, a status that cannot vote, a discretionary extension that may be refused, the 0 to 4 seat gap no list can occupy.
- **Dashed means out:** a slip out of a coalition, a Party Map chip below the threshold, an empty poll dot for a poll that had the list below the threshold. An empty slot in the stance mark is a solid 1px outline, not dashed.
- Dashed or dotted reference lines are the other use, each labelled or keyed: the 2022 result on the seat sparkline (dotted), the West Bank outline on both maps, the threshold line in the poll list tracks, the next election on the timeline strip.
- **Named exception, the perforation.** The foot of a Coalition Builder ballot slip is a dashed hairline (line) above its Profile link: the tear line of a printed slip, part of the world, not a state.

## Components

### Buttons
- **Shape:** 4px (rounded.control), 1px ink border.
- **Default:** transparent, ink text, Public Sans 600 14.5px, 8px 14px. Hover fills ink with paper text.
- **Primary:** ink fill, paper text; hover ink-2.
- **Focus:** one global ring, 2px ink outline at 3px offset, for every focusable element. Kept exceptions: Compare cells and Party Map cells take a 3px ring (the map cell adds an inset in its paired ink), seat-grid and mosaic links stroke their cells ink 1.4, vote map pies stroke their outline ink 3px.

### Segmented control
- The `.seg` class is only this control. One 1px ink frame, 4px radius, sheet white; options split by 1px line; option 14px 500, optional small second line 12px ink-3 tabular; 44px tall on phones.
- Selected (`aria-pressed="true"`): ink fill, paper text, 600. Hover: paper.

### Links
- Ink, underlined 1px in line-2 at 3px offset; underline goes to currentColor on hover. Current page in nav: 2px underline. No arrows.

### Navigation (masthead)
- One catalog (`lib/site.ts`) feeds the menus, footer, All resources, search and the sitemap. Four groups: Polls and news (Polls, News and briefings; Results and Forming a government join the menus and the footer only when polls close, or on their own pages, and stay in search and the sitemap throughout; the Changes log is gone and /changes redirects to /news), Parties (Party Map, Compare positions, Coalition Builder, Party family tree, Every ballot list), Voters and places (Vote map, Communities, Issues), How it works (Guides, Timeline, Glossary, American lens). Group labels use "and", never "&"; item descriptions stay under 70 characters.
- Groups are full-height disclosure buttons (Public Sans 600 15px), divided by hairlines; under each label a 12px line states one live fact computed from the data (lib/nav-facts.ts: newest poll and briefing dates, the Netanyahu bloc's seats in the average to one decimal, localities counted, elections on the timeline), never a list of the items inside. The active section carries a 2px ink bottom rule. Panels are sheet white in a 1px ink frame. Disclosure buttons carry a small rotated-square caret; links never do.
- The tools row and utilities are plain links underlined in line-2; the current page takes a 2px underline in ink.
- Under 900px: a bordered Menu toggle (44px) that inverts when open. The menu shows the five tools (Polls, Party Map, Coalition Builder, Vote map, News) as a two-across grid of 52px sheet tiles with a line-2 edge, then the groups stacked with the current group open, then the utilities. The countdown appears once, under the brand, not again in the menu.
- All resources is a visual index: per group, a tile for every page with a small picture drawn from its data (or a neutral mark) and a current fact as its caption, then the utilities. Links take the nav's underline; no left-edge accent rules.

### SeatBar (signature)
The Knesset as one bar (components/SeatBar.tsx, components/seatbar.css): segments (`.sb-seg`) sized by seats out of 120 on the cell-coloured track, split by page-ground gaps (1px small, 2px larger), and the 2px ink tick at 61 overhanging the bar. Sizes: s 10px (meters), m 22px (index minis, news), l 34px (issue split), xl 44px (polls bloc bar, Frank Ruhl 19px figures, centred). Labels are 12-12.5px tabular; a remainder may be hatched as absent. With `sb-fit` a segment too narrow for its number hides it, and a MiniKey under the bar names each hidden one. Without a label the bar is decorative and the numbers sit in text beside it. Every 120-seat bar on the site is this component.

### Figure furniture
- **Figure source** (`.fig-src`): the dated source line under every figure, chart, table or quoted position; Public Sans 12.5px ink-3, links ink-2. A component class beside it may set placement only.
- **Figure key** (`.fig-key`): the swatches and marks that name what a figure draws, a wrapped row (gaps 6px 20px), 13px ink-2, values in ink tabular. Keys run in `BLOC_ORDER`.
- **Figure note** (`.fig-note`), **callout** (`.callout`) and **reading note** (`.note`): see Layout.

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
- **Seat sparkline:** every poll since dissolution in the party stroke; line 2px with round joins; solid dots r 3.4 for pollsters in the main average, hollow dots r 4 (sheet fill, colour stroke 1.5) for the pollsters the alternative average excludes; the 2022 result as a 1.2px ink dotted rule (2 4) with a 600 label; hairline gridlines, 12px ink-3 ticks, end value in Frank Ruhl 700 15px to one decimal. A key underneath names both point styles.
- **Voter-base bar:** one 30px stacked bar on cell, segments split by 1.5px sheet gaps, tints of the party colour toward tint-base at fixed steps 100 / 68 / 42 / 22%; key with 9px squares and Frank Ruhl 700 16px values; then a "share won" list with 10px party-colour bars on cell.
- **Locality dot map:** localities as dots sized by valid votes (r 1.1 / 1.9 / 2.6), shaded from the ramp's low end to the party colour by share relative to the party's strongest (low end tint-base on light paper, map-low-dark on dark, so the strongest places are always the most saturated marks); labelled localities r 4-5 with a 0.8 ink stroke and a 10.5px 600 label haloed in paper; West Bank as a dashed ink-2 line. A table beside it: strongest localities, the national share on an ink rule, the big cities; values Frank Ruhl 700 17px tabular. Stacks under 440px.
- **Stance tiles:** seven tiles, four across (two under 520px), 8px gap, sheet white, 1px line-2 edge, min-height 132px. A 9px top bar in the stance ramp shade (dark-half bars take the ramp edge); the dotted paper with a 1px ink edge when the issue's options are priorities that can coexist; a hatched bar and italic ink-3 text when no stance is recorded. Issue 12px 600 ink-2; stance Frank Ruhl 700 15px; at the foot the stance mark, then the basis 12px ink-3.
- **Stance mark** (components/StanceSlots.tsx, shared with the Builder's "Can they govern together?"): one slot per answer in the issue's order, each list a 7px square in its own colour, stacked two wide; an empty slot is a solid 1px line-2 outline; lists with no answer sit in a quiet cell-grey slot at the end. Hover: edge goes ink. Open: 2px ink frame with a square pointer into the panel below. The panel (sheet, line-2, 16px 18px) gives the question, the party's own words in prose, the source, and chips for lists holding the same stance. One tile open at a time; the first recorded stance opens on load.

### Compare matrix
One table: questions down the side, every list across, each cell the list's recorded answer. Real row and column headers; bloc colour appears only as a 3px bar over each column group and on the chips and key dots, list colour as the 4px top bar of each column's letters box, never in the cells. Source: components/Compare.tsx, components/compare.css, components/compare/model.ts.
- **Column-set control:** a "Show" label and a segmented control (the same frame, 4px radius, 14px 500 options with a 12px tabular second line) choosing every list, either bloc, the core opposition, the outgoing government or the reader's own set; beside it a link into the Coalition Builder.
- **Choose lists one by one:** a native disclosure, 14px 600. Open, it sets four bloc columns, each headed by a 10px bloc swatch and name on a 1px ink rule, with list chips (sheet, line-2 edge, 4px party-colour top bar, Hebrew letters 17px); a chosen chip fills with the party colour and its paired ink. A live hint says how many are chosen; two is the fewest.
- **Key:** under a 1px ink rule, 13px ink-2. The ramp as five 22 by 16 swatches with its meaning (dark half edged on dark paper), then the cell states as 16px glyphs, then "Open any row for every list's own words and source" in 600.
- **Bloc header row:** each bloc's name, 12.5px 600, under a 3px bar in the bloc colour, spanning its lists; a 12px gap separates blocs.
- **Vertical names:** each list's name set vertical, read bottom to top, 12.5px 600 ink, max 150px, a link to the profile; underline on hover.
- **Pinned strip:** the ballot letters (Frank Ruhl 900 17px in a small sheet box with a 4px party-colour top bar) and the seats in the polling average (Frank Ruhl 700 15px tabular; "out" or "below" in Public Sans 12px ink-3) stay sticky at the top over a 1px ink rule while rows scroll beneath. The corner carries "Seats, polling average" in 12px ink-3.
- **Rows:** a 1px hairline between rows, 1px ink above each of the seven issues, dotted line-2 above the narrower questions, which are indented 18px and set in Public Sans 600 14px against the issue's Frank Ruhl 700 18px. The row header is a button with a small rotated-square caret, the question in 13px ink-2, and a legend.
- **Row header legend:** one line per answer: a 17 by 15 key in the answer's shade with its number, the answer's label in 12.5px ink-2, and the seats those answers hold in the polling average (Frank Ruhl 700 13.5px tabular, right-aligned). The answer under the pointer turns ink 600. A row with no recorded answers says so in italic ink-3.
- **Cell states:** 44px tall (30px on narrow questions), square, 2px apart. A stance is the ramp shade with its number, 13px 700 tabular, in stance-numeral-on-dark or stance-numeral-on-light; dark-half cells take the ramp edge. A top-right 6px notch in the page ground marks an answer taken from the record rather than a questionnaire answer. None: line-2 border over a light line-2 hatch on cell. Declined: line-2 border with a denser 135-degree ink-3 hatch (1px lines, 5px pitch). Recorded, not classified: a sheet-white cell with a line-2 edge, no number. Priorities that can coexist (unordered options): the dotted paper with a 1px inset ink edge and an ink numeral.
- **Hover and focus:** hovering or focusing a cell dims every cell in that row not holding the same answer to 28% and gives the matching cells a 1px ink outline at 1px offset; the legend line for the answer turns ink. Keyboard focus is a 3px ink ring at 3px offset. Opacity eases .12s, off under reduced motion.
- **Open-row panel:** a full-width sheet row under the question: sheet white, line-2 edge, a 1px ink top edge, padding 18px 22px. The question in Frank Ruhl 19px, a one-line reading of the field in 14px ink-2, then one group per answer (keyed heading on a hairline), each list's own words in Frank Ruhl 16px prose over a 12.5px ink-3 source line, two columns; then the lists recorded but not classified, then those with no position found or declined, set quieter, with the evidence date; a note and links at the foot.
- **Phone reflow (under 760px):** the segmented control becomes one 44px select in an ink frame; the matrix comes first and its key and notes follow it; the table becomes a grid with one column per list shown, so all fourteen fit with no sideways scroll; each question label spans the full width above its row of cells, the legend runs as a wrapped row, cells drop to 34px (24px on narrow questions), names and letters to 12px, seats turn vertical at 12.5px, bloc names move into the key while the bars keep their colour, and the open panel stacks to one column. The pinned letters row stays sticky; the corner cell is kept out of sight so headers still pair with cells. At 1100px the row-header column narrows from 300px to 230px.

### Bloc race
The polls page leads with it (components/polls/BlocRace.tsx, bloc-race.css): the Netanyahu and opposition bloc totals of the site average on each poll date as 2.5px lines in the bloc colours, against the 2px ink 61 line labelled in 12px 600; every poll as a dot in the bloc colour at 75% (hollow, page-ground fill and a 1.5px ring, for the pollsters the alternative average leaves out); the range of the current polls as a 13% band in each bloc colour. End values in Frank Ruhl 600 17px to one decimal, ticks 12px ink-3, hairline grid. 400px tall from 640px wide, 320px below. Pointer and arrow keys step through dates, read out in a 14px line under the plot. The data table folds below.

### Pick a party
"How each party has moved" (components/PollComparison.tsx): every list's polling average as a 1.25px line-2 grey line on a shared 0-to-max seat scale, with up to three picked lists drawn in their party stroke (2.5px line, poll dots r 3 at 70%, hollow for the excluded pollsters) and their end values in Frank Ruhl 600 15px beside the names. The picker is a wrap of sheet chips (1px line edge, 10px swatch, the value at the selected date); a picked chip takes an ink edge and 600. 44px tall on phones.

### House effects
One row per pollster (components/polls/HouseEffects.tsx): the gap from the site average for each bloc as a 12px bar either side of a 1px ink-3 zero line, in the bloc colour (hollow, 1.5px ring, for the excluded pollsters), the value to one decimal beside it.

### Polls overview
Under "What the polls say now" on the polls page: a bloc bar, two bloc strips, then a dot table. Bloc colours mark blocs; party colours mark lists. Source: components/polls/PollsNow.tsx, components/polls/polls-now.css.
- **120-seat bloc bar:** a SeatBar xl, segments in the bloc colours with their paired ink in `BLOC_SEAT_ORDER` (Netanyahu bloc, between, opposition, Arab-led), each labelled with its seats in Frank Ruhl 19px (the between segment smaller). Below it a key in `BLOC_ORDER` of swatches, bloc names and tabular totals to one decimal. The numbers are the average scaled to 120.
- **Bloc-per-poll strips:** one for the Netanyahu bloc and one for the opposition, each headed by the swatch, the name in 600 and a plain reading of how many polls reach 61 and the range. The axis runs 40 to 70 seats with ticks every 5 (12px ink-3) on a line-2 baseline; a 2px ink rule at 61 with "61" in Frank Ruhl 14px beside it. Each poll is a 13px dot in the bloc colour, polls landing on the same number stacked 22px apart. Polls from the pollsters the alternative average excludes are hollow dots (page-ground fill, bloc-colour 2px ring). Each dot carries its pollster's name, 12px ink-2, set flat above the dot; hidden on phones, where the axis drops from 84px to 54px and the title tooltip carries the name.
- **List dot table:** each list is a row grouped by bloc and ordered by average seats, with the bloc name over the first row of its group on a 10px swatch. Beside the name, average, range, passes and alternative-average columns sits a chart column: a 22px track on a seat axis (0 to 30 or beyond, ticks every 5) holding a bar at the average, 8px high in the party stroke, drawn only when the list's average is stated; a 14px dot per poll in the party stroke with a 2px sheet-white ring (both reach 3:1 in either theme); hollow dots (page ground, party-colour ring) for the excluded pollsters; a dashed 1.5px ink-3 ring on an empty dot for a poll that had the list below the threshold; and a dashed line-2 line at 4 seats for the threshold. A key beneath names each mark. Under 760px the chart column narrows to 150px and the list name may wrap.

### News bloc bar
The news page opens with the home race's average as a SeatBar m in `BLOC_SEAT_ORDER` (app/news/NewsBlocs.tsx), a key in `BLOC_ORDER` with each bloc's seats to one decimal and its signed change over the past week, and a source line naming the newest poll.

### Government figures
Two figures on the Government page, ink and greys only (bloc colours do not apply). Source: components/government/CoalitionSeats.tsx, components/government/FormationClock.tsx, components/government.css.
- **Coalition seats:** a step chart of the outgoing coalition's seats after each dated change, on a 56 to 80 seat axis, from swearing-in to election day. The line is 2.5px ink; the 61 majority is a 2px ink rule labelled "61, a majority" in Frank Ruhl 700; a change reported as a range ("62 or 63") is a 60% ink-3 band. After the Knesset dissolves the line goes ink-3 (the coalition governs on as a transitional government), with a 1px ink-2 marker for the dissolution and one for election day. Values in Frank Ruhl 700 15px haloed in the page ground. Two SVGs, wide (760 by 230) and narrow (360 by 240, fewer ticks, year labels as two digits), switched at 640px; the caption names the grey and the band.
- **Formation clock:** one bar per step on a shared day axis from the published results, each a row of a two-column grid (label up to 15.5em, track). Ink bars are a nominee's time to build a coalition; ink-3 bars are the president's or the Knesset's turn; the hatched bar (ink-2 hatch, 1.5px ink-2 frame) is the extension the president may grant or refuse; an ink-2 half-height bar is the any-time line "a government can be sworn in at any point". Step numbers in Frank Ruhl 700 ink-3; day counts inside bars of 21 days or more; 1px line gridlines; a 1px ink rule closes the longest path (day 117, then a new election); once results are published the axis carries dates and a 2px ink "Today" marker. Under 640px each label sits above its track.

### Results board
One election-night layout (app/results, components/results.css): the 120-seat grid by bloc beside a legend of bloc totals (Frank Ruhl 22px), a "share counted" bar (14px, line-2 edge, ink fill), then the list table. Until the count is published the grid cells, the counted bar and the table's seat cells are hatched in cell (3px on 7px) as awaiting the count, with the wait stated in 13px ink-3; the final poll average and the difference from it sit beside the official figures once they exist. On phones seats follow the name directly.

### Threshold watch
On the Results page and in Start here. One row per list that misses the threshold in any current poll or averages six seats or fewer: name with party swatch, a track from 0 to 10 seats, and "k of n" polls in which the list passes in Frank Ruhl 700 17px. A dot per poll (11px, party stroke, 1.5px page-ground ring; hollow, page-ground fill and 2.5px party ring, for pollsters the alternative average excludes), polls on the same value stacked 9px apart. The 0 to 4 seat gap is the threshold itself: a cell-colour hatch (135 degrees, 3px on 7px) with a 1px ink-2 right edge, since a list wins none or at least four. A dot at zero is a poll that had the list below the threshold. Source: components/results/ThresholdWatch.tsx, components/results.css.

### Party family tree lanes
On the party history page, above the full histories. One lane per 2026 list on a shared axis, grouped by political family under a 13px 600 ink-2 name; the lane line is 3px in the list's colour from its first event to the election, the name a link with party swatch to its history below. Four SVG marks, in ink, tell what an event does: filled circle starts a party, diamond (page-ground fill, 2.2px ink ring) joins an alliance or merger, filled triangle is a split or a leader's move, filled bar is a rename or the 2026 filing. An event over several years carries a 3px ink-2 bar beside its mark. The axis is piecewise: 1965 to 2005 gets 30% of the width, 2005 to 2026 the rest, with the change of scale marked by a double ink-2 line at 2005 and explained in the 12.5px source line; the axis is sticky on a 1px ink rule. Under 640px names stack over tracks. Source: components/history/PartyLanes.tsx, components/PartyHistory.css.

### Ballot tray
On the ballot directory, leading the page: all 38 filed lists as slips, auto-fill columns min 118px, 6px gap, 104px high, Hebrew letters Frank Ruhl 900 30px, name 12px ink-2. A polled list's slip takes its party colour as a 5px top bar and edge, with its average seats in a corner tab in the party colour and paired ink (Frank Ruhl 700 14px tabular); an unpolled list's slip keeps a plain 1px edge and no colour. Hover edge goes ink. Source: components/BallotDirectory.tsx, components/BallotDirectory.css.

### Vote map
The locality map (components/votemap.css, lib/votemap-visual.ts). One list's share is a seven-step ramp (6, 20, 36, 52, 68, 84, 100%) from a low end to the list's own colour; the low end is #f4f6f9 on light paper and #3a414b on dark, where the top keeps 45% of the hue so the steps stay apart; land outside any voting locality takes its own plain fill (#dcdbd7 light, #1d1d1b dark) so it never reads as a low share. A historical list that runs on in 2026 takes the 2026 list's colour; others keep a fixed editorial colour, and other lists combined are #9299a0. The West Bank outline is a dashed ink-2 line, named in the caption. VM_RAMP and votemap.css are kept equal.

### Who votes matrix
A table of legal status down the side against the Knesset and Israeli municipal elections across, with a key above. A black cell (ink, page-ground text) can vote; a hatched cell (line hatch on a line-2 inset edge, ink-2 text) cannot; a cell-grey cell depends on the person's status. Row heads: status 15px 600, place 13px ink-2, detail 12.5px ink-3 (dropped under 620px); cells are 4px apart with the answer's words inside and the kind repeated for screen readers. Source: components/VotingRightsGuide.tsx, components/VotingRightsGuide.css.

### Issue split (PositionsLead and SplitMini)
One SplitBar, the Positions block's 34px stance bar of the Knesset's 120 seats by answer, drawn twice: PositionsLead under an issue title with a 1px ink rule, a legend of keyed answers and each answer's lists with their seats; SplitMini, a 22px bar with a one-line reading, under each issue's title on the Issues index (and once in Start here). Segments are square, split by 2px page-ground gaps, with the 61 tick. Source: components/article/Article.tsx.

### Timeline prime-minister terms
The strip's prime-minister bands take the colour of the 2026 list that carries the party on (Likud and Likud/Kadima in likud, Alignment, Labor and One Israel in dem, Yamina and Yesh Atid in byachad) with its paired ink; Kadima has no successor and is ink-2. The selected term is marked by a 2px ink inset ring over a 2px page-ground ring, not a fill. The key says so in words. Source: components/Timeline.tsx, components/timeline.css.

### Start here figures
Each step of the guided route carries a figure from the site's own charts, 760px max, a 15px 700 caption, a 12.5px ink-3 source line: the who-votes matrix, the threshold watch, each bloc as a stacked bar of its lists in their own colours (a party is not a bloc), the 120-seat grid with its 61 rule, and an issue split. Source: app/start/page.tsx, components/journey.css.

### Party Map preview panel
Choosing a party on the map opens a preview panel, not the full profile. Its one action is a solid ink "Open the full profile" button (44px high, 15px 600, ink fill, page-ground text; hover fills text colour; the global focus ring) linking to the party page. Method, the minor lists and the colour key sit under the map in a 1px line-ruled "about" block, so the map follows the one-sentence head directly. Source: components/ProfileDetail.tsx, components/interactives.css, components/map.css.

### Article charts
A data/charts table in an article is drawn in one of four forms, chosen from its cells and never set by hand; the table itself always stays on the page so every number keeps its printed value. Source: components/article/ChartViz.tsx, components/article/Article.tsx, components/article/article.css.
- **Which form** (`formOf` in lib/chart-form.ts): two or more columns are needed for any of them. Every cell a plain percentage, rows that are a run of years or elections (four or more), up to four series: lines. Every cell a plain percentage, two to four series, twelve rows or fewer: a dot plot. Columns that are a run of three or more elections or dates, each cell one percentage (a list name may come with it): transposed so time runs across, up to four rows as lines ("trend"), more as one sparkline per row on a shared scale ("sparks"). Rows a run of elections with cells of two percentages under headings that name both: one small panel of two lines per column, three across ("pairs"). Counts in two or three parts and a last Total column they add up to: one stacked bar per row ("stack"). Otherwise two or more value columns where at least half the filled cells carry exactly one percentage: a heat table. Anything else is a plain table. The scale maximum is 100 when any value passes 60, else the largest value rounded up to the next 10, never under 20.
- **Marks:** series are told apart by mark as well as position, so nothing depends on colour. In column order: solid (ink circle), ring (sheet circle, 2.5px ink ring), grey (ink-3 diamond), grey ring (sheet square, ink-3 ring). They are ink and greys only; party and bloc colours are not used here. A legend of the marks sits above the figure, 13.5px ink-2.
- **Dot plot:** each row is a 0-to-max track on a 1px line hairline, one 12px mark per column, 16px tall. The rows are a subgrid of one list, so every row shares one track width: label (up to 13em, with its dated source link beneath), track, then the values. Each value sits beside its own mark (lowest left, highest right, any between above, then below), tabular, bold ink for solid and ring, 600 ink-2 for the grey marks; the track keeps an inset at both ends for them. A 2px ink-3 span joins the lowest and highest mark only when every column header names a date, since only then is low to high a change; otherwise the marks stand alone. The axis is 0% and the maximum at 12px ink-3. Under 640px the label takes its own full-width line above the track.
- **Lines:** one 2.2px line per column with round joins, a 3.4 radius dot at each point, hairline gridlines at quarters of the maximum, and 12px ink-3 ticks. Points are spaced by date when every row names a year (a month counts only directly before its year), so uneven gaps stay uneven. Each line is ink (solid), ink-2 (ring) or ink-3 (grey, grey ring) and its dots carry the same marker as the legend. Lines are never dashed, because dashed means absent. The latest value of each series is printed at its end in Frank Ruhl 700 16px with the series name in 12.5px ink-2, labels kept at least 14 units apart and cut at a word to fit. X labels are the first and last row plus any between that keep 70 units clear. Two drawings are in the page and CSS switches between them at 640px: wide (640 by 260, room at the right for names) and narrow (360 by 250, values only, first and last x labels, 12px ticks, 14px end values). The drawings are hidden from assistive technology; the table carries the data.
- **Sparklines, pairs, stacked parts:** sparklines run one row per place or list, elections across, every row on one scale, first and last values either side; list names that will not fit under the line are listed under it with the election they start at. Pairs draw two lines per panel on one scale, three panels across. Stacked bars fill parts in ink, ink-3 and line-2 with text at 4.5:1 on each, the count inside each part and the total at the end.
- **Reference rules on bars:** a threshold row comes out of the bars as a 1px rule; a seats chart reaching 61 gets the 2px 61 rule; a page-ground edge keeps each visible across a filled bar.
- **Heat table:** the plain table with each percentage cell shaded by blending the theme's ink into its page ground in oklab (`color-mix(in oklab, var(--ink) k%, var(--bg))`), up to 42% (`HEAT_TOP`) at the scale maximum, so more is always more ink in light and dark and every cell keeps ink text at 4.5:1 (pinned in chart-form.test.ts). With five or more columns, each row becomes a card of labelled tiles on phones. Turnout columns are never shaded, since turnout is a share of eligible voters, not of the vote. The source line begins "Darkest shade: N%" and, when a turnout column is present, adds that it is not shaded.
- **The numbers:** under a lines or dot figure the table folds into a native disclosure, summary "The numbers" in 13.5px 600 with the chart title for screen readers. It is open by default for lines when any row carries its own source, so those links stay visible. A heat or plain table is not folded.
- **Positions block:** what each list says on one issue. A 34px stance bar on cell stands for the 120 seats of the polling average, one segment per answer in the order of the issue's scale, separated by 2px page-ground gaps, shaded on the shared stance ramp with the answer's number (white on the dark half, black on the light half, ink on the dotted paper for unordered priorities; numbers too narrow to fit hide and a MiniKey names them) and a cell-coloured remainder for lists with no recorded answer or under the threshold. A 2px ink tick at 61 overhangs 5px, and a 12.5px ink-3 note says the bar is the 120 seats and the tick is 61. Below, the lists are grouped by answer: a heading on a 1px ink rule with a 20 by 18 key in the answer's shade and number and the group's seats at right in Frank Ruhl 15px tabular; each list is a swatch in its own colour, a bold linked name, its seats, its own words in Frank Ruhl 16.5px and a dated source line, noting when the answer is taken from the record. Lists recorded but not classified, then those with no position found or who declined, follow as quiet groups (ink-2 heading on a line-2 rule); a list that declined carries "Declined to answer" in 13px ink-3.

## Do's and Don'ts

### Do:
- **Do** draw any count of the Knesset as the 120-seat grid or a 120-seat bar, with the heavy ink rule at 61.
- **Do** keep colour to data: bloc colours for blocs, the list's own colour for that list, the stance ramp for stance positions.
- **Do** pick text on a party or bloc fill by luminance (partyInk or the `-ink` tokens).
- **Do** open every page with its graphic: a head of title plus at most one short sentence, then the figure; method and caveats go in captions, folds or below.
- **Do** set every page head through PageHead: title, then standfirst, then at most one `.ph-meta` line, inside the 1200px wrapper on the shared left edge.
- **Do** draw every 120-seat bar with SeatBar, and source, key and annotate figures with `.fig-src`, `.fig-key` and `.fig-note`.
- **Do** print a list's seats as the scaled average to one decimal, or "below", from lib/list-seats.ts; run lists and keys in `BLOC_ORDER` and bars and grids in `BLOC_SEAT_ORDER`.
- **Do** draw party lines and dots in `partyStroke`; keep `partyColor` for fills.
- **Do** put a figure beside the sentences it illustrates, with a label on an ink rule and a dated source line.
- **Do** use 0 radius on paper and 4px on controls.
- **Do** fold sources into the end-of-page disclosure, open by default on single-subject pages.
- **Do** use hatching to mean absent or cannot, and dashed strokes to mean out or a labelled reference line; the slip perforation is the one decorative dash.
- **Do** shade a stance by its place in the issue's order, with the same graphite ramp everywhere an answer appears, and set coexisting answers on the dotted paper with an ink edge.
- **Do** keep text at 12px or more, the global focus ring, 44px touch targets on phones, and no motion under reduced motion.

### Don't:
- **Don't** set labels in all caps or tracked-out caps.
- **Don't** draw an absent state dashed, or a party line in the raw fill colour.
- **Don't** put an eyebrow, kicker or crumb above a headline or an article title.
- **Don't** colour a government figure by bloc; ink and greys only.
- **Don't** use middle dots anywhere, menu previews and correction lines included; use commas and full stops.
- **Don't** build a teaching surface (decks, packets, classroom paths); embeds stay.
- **Don't** append arrows to links.
- **Don't** build meta lines as middle-dot strings.
- **Don't** number items (01/02/03) unless the content is a sequence; list slot numbers and source citations are data, not markers.
- **Don't** draw a heavy rule that does not mean 61; every other rule is 1px.
- **Don't** use a coloured left rule anywhere but the 3px party-colour rule on a pull quote.
- **Don't** add shadows to paper; the drawer is the only shadow.
- **Don't** draw the Knesset as a hemicycle.
- **Don't** colour chrome, headings or buttons.
