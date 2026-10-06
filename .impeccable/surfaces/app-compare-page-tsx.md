---
version: 1
slug: "app-compare-page-tsx"
primary_target: "app/compare/page.tsx"
related_targets: ["components/Compare.tsx", "components/compare/model.ts", "components/compare.css"]
---

# Surface brief: Compare the parties (app/compare)

## Scope
The whole Compare page. Visitor mode: Read. The reader's question: on the questions that divide this election, who agrees with whom, and where does the field split? Every recorded answer, its words and its source stay on the page.

## Audience and job
American readers and educators arriving from the menu, a party profile tile, the Coalition Builder or search. They need to see the whole field at once, then read any party's own words with a dated source. Teachers project it.

## Decision (Daniel, 2026-10-05)
Daniel called the old page "confusing, and not clear, and hard to compare". Agreed plan: rebuild Compare as a matrix after the profile pilot. He approved the profile and gave go-live discretion for this series. GATE: the matrix shows the seven broad issue classifications (the ones the profile tiles already publish) as parent rows, with the narrow questions from comparison-questions.json indented beneath them; proceeded because both classifications are already published data, the narrow rows keep their rule that broad answers are never carried down, and Daniel asked for full question coverage in one view.

## Direction contract
THESIS: The whole field on one sheet: questions down, every list across, each cell shaded by the recorded answer, so agreement reads across a row at a glance; the page refuses one long section per question with a few slips in mostly empty columns.
OWN-WORLD: The site's paper and two inks; the stance ramp from the party profile tiles (fixed endpoints #233f86 to #dfe6f5) for ordered answers, ink-2 for coexisting priorities; dashed for no position, hatched for declined, a corner notch for answers taken from the record; bloc colours only on the column heads; Frank Ruhl for issue labels and the party's words, Public Sans for everything else.
STORY: The reader sees the full matrix, with the seats each answer holds in the polling average beside it, with blocs labelled over the columns, scans a row to find where the field splits, hovers or taps a cell to light up the lists that share that answer, and opens a row to read each list's words grouped by answer, with sources and evidence dates.
FIRST VIEWPORT: Title and standfirst, the column-set control (every list, either bloc, the core opposition, the outgoing government, or the reader's own ?p= set), the key, then the column heads: bloc names, vertical list names, ballot letters with seats. The letters-and-seats strip stays pinned while rows scroll.
FORM: No concept roll: the surface inherits the world DESIGN.md records and the profile pilot established (seed cfdcdb5b), and the form was fixed by the agreed plan (the matrix). A table with real row and column headers. Seven issue rows in the profile tiles' order, each followed by its narrower questions, then Gaza. Numbers in cells name the answer's place in the issue's order and match the row legend. Under 760px each question's label spans the width above its row of cells, so all fourteen columns fit without sideways scroll.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.

## Unresolved
Whether the export for a broad issue row should include the broad classification as well as its narrower questions (lib/export-data.ts, content lane).
