---
version: 1
slug: "app-parties-id-page-tsx"
primary_target: "app/parties/[id]/page.tsx"
related_targets: ["components/PartyProfile.tsx"]
---

# Surface brief: party profile (app/parties/[id])

## Scope
The full party profile page, one template for all 15 lists (the Likud page is the pilot). Visitor mode: Read. The reader's question: who is this party, how big is it, what does it stand for, who votes for it. The drawer profile inside the Party Map and the Coalition Builder keeps the existing ProfileDetail until this template is approved.

## Audience and job
American readers and educators who arrive from the Party Map, the Builder, search or a share. They need the party's size and trend, its positions, its voters and its people, every number dated and sourced. Returning readers check the numbers; teachers project the page.

## Decision (Daniel, 2026-10-05 evening)
Daniel chose the election-guide spread from three real-data Likud mocks and asked to keep the six-issue card's way of presenting the issues. GATE: proceeding to build on a branch with a Vercel preview for Daniel before merge; proceeded because he chose the structure in his own words and his standing authority turns remaining checkpoints into logged decisions.

## Direction contract
THESIS: Every section of the profile is a figure beside its sentences, so the party can be taken in by scanning one column of charts; the page refuses the dossier of stacked bullet lists with one chart at the bottom.
OWN-WORLD: Paper and two inks with colour as data: the party's own colour owns the running head and every figure; bloc colours mark context; stance tiles use an ordinal ramp per issue shared across all lists; Frank Ruhl for display, numbers and prose, Public Sans for labels and tabular figures; square sheets, hairlines, one heavy rule meaning 61.
STORY: The reader sees the party's size and trend first, then its voters and where they live, then its stances as a row of tiles, then the people and pledges, and leaves able to say how big it is, where it stands and who votes for it.
FIRST VIEWPORT: A running head in the party colour: ballot letters, name, leader, bloc with the bloc total. Beneath, two columns in the 1200px wrapper: left (5/12) the at-a-glance block of four numbers and the seat sparkline over every poll since dissolution with Channel 14 and i24NEWS as hollow points and the 2022 result as a dotted rule; right (7/12) "Who they are" and the start of the stance tiles. The primary action is the stance tiles opening to the party's words and sources.
FORM: The election-guide spread, position 6 on the ordered list of seven; seed key cfdcdb5b; raised by the six-issue card (position 3), whose stance tiles replace the plain strip under "Where they stand".
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved
Whether the drawer profiles adopt the figures (voter-base bar, sparkline) after the page ships.
