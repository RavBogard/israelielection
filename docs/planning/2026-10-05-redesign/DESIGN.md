# Redesign: the shape of a majority (2026-10-05)

Daniel asked for a holistic rework of the site's look, menu, layout and usability ("still feels
pretty generic"). He answered four questions (2026-10-05, afternoon): full identity rework
including a new mark; menu grouped by what the reader is doing; Hebrew ballot letters on cards
and profiles; sources folded one tap away. Everything else here is Claude's call, logged.

## The subject, and the one memorable thing
An Israeli voter picks a paper slip (petek) printed with a list's letters and drops it in the
envelope. The count turns slips into 120 seats; 61 is a government. The site's identity is that
arithmetic made visible: **a grid of 120 squares, one per seat, with the 61st marked.** It is
the mark, the home page's opening, the Coalition Builder's meter and the results display, so
the same shape means the same thing on every page. The party cards are the slips.

Not a hemicycle: the Knesset does not sit in one, and the semicircle is what every other
election site draws.

## Tokens
Paper and two inks. Colour is still data only (the four blocs).
- Paper `#f6f5f1`, sheet (cards, slips) `#ffffff`
- Ink (display, numbers, rules, selected states) `#000000`
- Text ink (prose) `#2a2925`; secondary `#5f5d57`; tertiary `#8b8880`
- Rules `#dedcd5`, strong rules `#bdbab1`
- Blocs unchanged: navy `#233f86`, amber `#d98a1f`, teal `#3fb0a2`, violet `#8d4fae`
- Dark: paper `#121210`, sheet `#1b1a17`, ink `#ffffff`, text `#e6e3da`
- Radius: 0 on paper (slips, panels, grid cells); 4px on controls (buttons, segmented picker)
- Shadow: none on paper; one soft scrim+shadow on the drawer only

## Type
- **Frank Ruhl Libre** (500/700/900): display, the big numbers, and the reading prose. One
  face carries the voice; its Hebrew-newspaper lineage is the reason it is here.
- **Public Sans** (400/500/600/700): interface, labels, tables, captions, tabular figures.
  Chosen because it is the deck's face (Teach it) and a US civic face for a US audience, and
  it is clearly distinct from Frank Ruhl.
- Scale (ratio ~1.25): 13 / 15 / 17 / 20 / 25 / 32 / 40 / 52 / 68 / 96. Prose 18/1.6 (17 on
  phones); UI 15/1.45; captions 13.
- No all-caps labels. Labels are Public Sans 600, sentence case, 13px, secondary ink.
- Headlines are plain: no single accented word, no eyebrow above them.

## Layout
- One wrapper: max 1200px, 20–40px gutters; wide data (treemap, poll table) may use 1320px.
  Reading column 700px, left-aligned inside the same wrapper so every page's title sits on the
  same left edge. Ragged right everywhere; nothing centred.
- Masthead, one row: mark + wordmark; the grouped menu; the countdown. Under 900px: mark,
  countdown, a Menu button opening a full-screen sheet.
- Menu groups (visible labels on desktop, no dropdowns):
  Explore: Coalition Builder, Party Map. Follow: Polls, News, Results.
  Understand: How it works, Issues, Communities, Vote map, The American lens. Teaching resources (apart, right). Further Understand pages (Timeline, Glossary) live in `more`: home index and footer only.
- The dateline bar is removed; the countdown lives in the masthead, the "polls updated" date
  sits beside the data it describes.
- Page header pattern everywhere: title (52), standfirst (Frank Ruhl 20, text ink), content.
- Home: headline + the 120 grid (hero) → Coalition Builder → "Also on this site" in three
  groups → Sources (folded).

```
┌──────────────────────────────────────────────────────────────────┐
│ ▣ Israel Votes 2026   Explore ·· Follow ·· Understand   Teaching resources│
│                                               22 days to the vote │
├──────────────────────────────────────────────────────────────────┤
│ Israel votes in 22 days.          ■■■■■■■■■■■■  Netanyahu bloc 53 │
│ Standfirst, two lines.            ■■■■■■■■■■■■  Zionist opp.   51 │
│                                   ■■■■■■■■■■■■  Between         3 │
│                                   ■■■■■■■■■■■■  Arab-led       13 │
│                                   ■■■■■■■■■■■■                    │
│                                   ■━━━━━━━━━━━ 61                 │
│                                   ■■■■■■■■■■■■                    │
│                                   ···                             │
├──────────────────────────────────────────────────────────────────┤
│ Build a coalition      [Average | Kan 11 | Maariv | …]   Reset   │
│ ┌slip┐ ┌slip┐ ┌slip┐ ┌slip┐          ┌─ Your coalition ─────────┐│
│ │מחל │ │ שס │ │ ג  │ │ ב  │          │  0                        ││
│ │Likud│ │Shas│ │UTJ │ │Otzma│         │  ░░░░░░░░░░ 120 grid      ││
│ │21.3│ │7.5 │ │7.8 │ │7.5 │          │  pledges, link            ││
│ └────┘ └────┘ └────┘ └────┘          └───────────────────────────┘│
```

## Components
- `SeatGrid`: 120 cells, 12 across; `seats` = ordered segments {bloc|party, n}; the 61st
  cell carries the majority rule; sizes: mark (SVG), hero, meter, strip (one row of 120 for
  narrow places). Reduced motion respected; the hero fills once on load, nothing else moves
  unprompted.
- `Mark`: the grid at icon size, 61 filled. Favicon and logo.
- `Slip`: the party card. Letters (Frank Ruhl 900) top, name, leader, seats bottom right;
  selected = bloc fill with inverted ink; out = dashed, grey. One text link "Profile" at the foot.
- `Sources`: `<details>` with "Sources (n)" summary; open by default on party and article pages.
- `SiteNav`: grouped; mobile sheet; current section marked with the heavy rule.

## Chrome rules (what is removed)
All-caps eyebrows; arrows appended to links; middle-dot meta strings; the 01/02/03 index;
the repeated site description; identical bordered cards. Numbered lists stay only where the
content is a sequence (how votes become seats).

## Self-review against the generic default
A generated "serious reference" page in 2026 is cream paper, serif display, hairlines, caps
eyebrows, arrow links, numbered index, same card everywhere. This plan replaces the paper and
the ink system, keeps one typeface for a reason the subject supplies, adds a UI face tied to
the project's own deck, removes every piece of listed chrome, and spends its boldness in one
place: the 120 grid and the slips with real ballot letters. Rules remain, but fewer, and the
one heavy rule always means 61.

## Gates
- GATE: proceeding to build on branch `design` (worktree) with a Vercel preview, then showing
  Daniel before merge, as with the first redesign. Proceeded because Daniel answered the four
  identity and structure questions and his standing authority turns remaining checkpoints into
  logged decisions.
- GATE: site name stays "Israel Votes 2026" though the domain is israelielection.org. Naming is
  Daniel's; flagged, not changed.
- GATE: Public Sans added as the interface face. Reversible; one import.

## Build notes (2026-10-05, evening)
- Built on branch `design`; all 279 tests, eslint, tsc and `next build` pass. Screenshots at
  1440 and 390 of every route, light and dark, reviewed.
- GATE: the surplus-partner line left the party cards (it stays in every profile). Proceeded
  because the slip carries letters, name, leader and seats; a fifth line made it a form.
- GATE: the home-page site index is now "Also on this site" in the menu's groups, after the
  builder; the hero no longer repeats the site description.
- GATE: article pages put the section's other pages in a sticky rail beside the text (wide
  screens) instead of a list after it; section landing pages drop the 01/02 numbering, since
  issues and communities are not a sequence.
- Open for Daniel: the name. The wordmark says Israel Votes 2026; the domain is
  israelielection.org.

## Share card and icons (2026-10-05)
- The share image is the home page's opening, drawn on request: `app/opengraph-image.tsx` renders
  the 120 seats coloured by bloc from the current poll average (or the count, on election night),
  the headline with the days left, the standfirst, the bloc totals and the domain. Cached an hour.
  Daniel's ruling on the first, all-black version: "super black and white and dull, for a site
  that is supposed to be beautiful and dynamic." Colour is data, and the card shows the data.
- Fonts for the renderer are static TTFs in `assets/og/` (Frank Ruhl Libre 400/700, Public Sans
  500/600, OFL). Satori needs explicit `display: flex` on every box with children and has no SVG
  `<text>`; the 61 label is a positioned div.
- X falls back to og:image, so there is no separate twitter-image.
- Icon: black square, white majority shape, the rest of the house as a 22% white block. No cell rows in icons: at 16px they moiré.
