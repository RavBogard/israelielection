# Site-wide design review, October 6, 2026

**Approved in full by Daniel, 2026-10-06.** Build plan and gates: STATE.md in this folder.

Six isolated reviews: navigation, home and live pages, party tools, explainers, design-system code, detector and accessibility. Evidence: 92 screenshots in `.impeccable/review/full/` (desktop 1440 and phone 390, dark for key pages, every menu state).

Already fixed and pushed (commits 9ddcd9a, 551cf42 and earlier today): middle dots site-wide; /changes on tokens, dark mode, no all-caps; 2px rules reduced to 1px except the 61 line; selected states in ink; dark ink-3 contrast; 44px phone controls; global reduced motion; Hebrew marked lang=he in the family tree; heading levels; corrections entries; Builder panel order, empty state and drawer label; Governing squares in list colours; compact index previews; formation-clock extension no longer hatched; stale "Today" label; teaching leftovers and dead CSS; Compare focus ring; compare-matrix branch deleted.

## Major

1. **Regroup the navigation around reader tasks, with the main tools one tap away.** Groups: Polls and news (Polls, News and briefings, What changed; Results and Government appear when polls close) / Parties (Party Map, Compare, Builder, Family tree, Ballot lists) / Voters and places (Vote Map, Communities, Issues) / How it works (Guides, Timeline, Glossary, American lens). About moves to the utilities. Add a direct tools row (Polls, Party Map, Coalition Builder, Vote Map, News). Replace the restating preview sublines with live facts (bloc totals, today's headline) or delete them. Phone menu: tools as a tile grid first, then the groups.
2. **Polls page: lead with the bloc race over time.** Full-width chart of the Netanyahu and Anti-Netanyahu bloc averages against the 61 line, each poll as a dot (hollow for Channel 14 and i24NEWS), the range of current polls shaded and labelled as a range, not a confidence interval. The 14-line party chart becomes pick-a-party (2–3 highlighted over grey). Add a house-effects chart (each pollster's average gap from the site average). Method text goes below.
3. **Home and news: show what changed.** A signed change per bloc ("+0.8 since Sep 28") with a 7-day trend line, and a "Newest poll" line linking to it. /news opens with the same compact bloc bar and change, groups briefing sentences under topic subheads, and moves headlines that name no party, leader or election term into an "Other Israel news" fold.
4. **Re-hue the stance ramp and give Compare its colour from the lists.** The ramp's dark end is exactly the Netanyahu-bloc navy (#233f86), so "answer 1" reads as "coalition". Proposed: graphite ramp with fixed endpoints (about #34322d to #e4e2db), and each Compare column headed by its party colour. Profile stance tiles gain the slot glyph (one square per answer, this party's filled) so all four tools share one stance mark. Palette change: needs Daniel's sign-off.
5. **Draw change over time as lines, and give bar charts reference lines.** Community tables with elections across the columns all fall through to shaded tables, which wrap one word per line on phones and hide the story (Blue and White to Yesh Atid). Transpose them: few rows become lines, many rows become one sparkline per place on a shared scale; keep the table in "The numbers". Bars get a reference rule: the threshold as a 1px rule (not a bar named "The threshold"), 61 as the 2px rule on seat charts.

## Medium

1. **Coalition Builder panel:** only the total and seat grid stay sticky; the rest flows in the page (today it is a scroll box inside the page). Poll picker becomes one labelled select; the outgoing government is the first scenario button; Start over joins that row.
2. **Party Map:** treemap full width at rest; drop the duplicate 120-seat grid; open the preview only on selection and dim unselected cells; fold the method paragraphs into one "About this map".
3. **One number per fact.** Likud shows 22.1, 22.8, 21 and 22 across Map, profile, sparkline and Compare. Use the scaled average everywhere as "Seats, polling average", one exported bloc order everywhere, label any 120-scaled figure as such, and write "below" not "0".
4. **Results page for election night:** one-line head with capture time; the home mosaic against 61; a share-of-votes-counted bar; final-poll-average and difference columns; before polls close, the same layout hatched as awaiting count so nothing reflows on the night.
5. **Vote map colour:** ramp from tint-base to the selected list's own colour, a dark-mode low end, historical lists that continue into 2026 mapped to their party colours, no-locality land filled distinctly; method note below the map.
6. **Consolidate the design system's furniture:** one PageHead (titles currently render at two sizes, 48 and 56px); one SeatBar (the 120 bar with the 61 tick is built four ways); shared figure source and key classes (12 and 20+ variants); rename bar segments off `.seg`; one section-heading scale (11 sizes now); split the five meanings of `.note`.
7. **All resources:** either a visual index with a thumbnail per tool and live captions, or retire it in favour of search; drop the footer's "Find your way" column. The full link list currently appears four times.
8. **Phone menu:** tools grid, then groups (current group expanded), then utilities; drop the duplicate countdown.
9. **Polls table:** the date/pollster cell becomes the method link (rows drop from about 90px to 36px); drop columns empty in every poll; "–" for not reported; caveats stated once; a column picker on phones.
10. **Dark-mode graphics contrast:** party-colour lines and dots (Likud, Otzma, Democrats, Yisrael Beiteinu) are under 3:1 on dark paper; lighten strokes only. Edge dark-end ramp cells in Compare.

## Small

1. Search: drop the "Tool or resource" label above each result; put the kind at the end of the description.
2. Search empty state: show the tools row, keep the "Try Lieberman, Meretz or threshold" line.
3. Start here: route buttons directly under the standfirst; "Next step" instead of "Next step / skip"; "October 5, 2026" instead of ISO.
4. Plainer nav labels: "Every ballot list", "Forming a government", "Changes log", "Compare positions"; descriptions under 70 characters.
5. "&" in group labels becomes "and", matching the item labels.
6. Browser-tab titles use a middle dot ("Polls · Israel Votes 2026"); switch to "Polls | Israel Votes 2026".
7. data/journeys.json still holds the teaching route (filtered at runtime): delete it (content lane). lib/export.ts says "Original teaching text" in the CSV licence line: Daniel's wording.
8. DESIGN.md: navigation section still says three menus and three footer columns.
9. Home: the "These political groupings do not establish coalition agreements" sentence moves into the chart's caption.
10. Polls bloc strips: rotated pollster labels collide (Maariv over Kan 11).
11. Poll browser: "14 combined*" cells widen Shas and UTJ; use a footnote marker.
12. Results threshold strip: identical values smear (Ra'am); stack them.
13. Polls head: add "Updated October 5".
14. Builder slips: the role shows twice (text and select); drop the text when the select shows; 16px select on touch.
15. Compare on phones: "Between the blocs" clips; right-align the legend seat figures.
16. Family tree: the 2026 lane end shares the rename mark; label 2005 at the scale break.
17. Ballot tray: a "Roster order / Polled first" toggle.
18. Article dot plots: values overflow their column; print each beside its mark.
19. Issue split bar: a segment label collides with the 61 tick.
20. American lens: subtitle to one sentence (content lane).
21. Coalition seats chart: the dissolution line runs through "Election day".
22. Seats guide on phones: "Round 1 (seat 114)" wraps to four lines; split into a Seat column.
23. Timeline strip: 2019–2026 dots overlap; stack collisions.
24. Left-edge accent rules (home expanded bloc, article rail current page, resources): use the nav's underline instead.
25. Token hygiene: ramp endpoints, tint base and fallback grey as tokens; StanceTiles imports shade(); text under 12px (11px in home, map, article); remove 31 per-component focus rules in favour of the global one.
