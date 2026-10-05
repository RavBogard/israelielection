# Can they govern together? Design note, 2026-10-05

Daniel approved the build from DECISIONS.md ("Follow-up: coalition cohesion and party comparison") and put the design session in charge end to end, with the content session on the data. His standard: intuitive, a joy to use; learn from the home page.

## What the reader should be able to do

Pick any set of parties and see, on seven issues, where they agree, where they split and who has said nothing, with the parties' own words one tap away. Then read how much the set depends on each partner. The same treatment for every set, Netanyahu's bloc included. No stability score, no prediction of collapse.

## Data (content lane)

Each `data/positions/<issue>.json` gains a `question` (the one question every party answers) and `stances`: three to five comparable options `{ id, label }`, ordered so neighbours are closest in substance. Every row carries `stance` (an id) or `status: "declined" | "none"`. Every pickable list has a row on every issue, so silence is a recorded fact, not an omission. Glossary: support from outside the coalition, since Daniel chose to explain that rather than build it as a mechanic.

## The one device: ballot slips sorted along an issue

The Compare page becomes seven issue strips. Each strip is the issue's stance options as columns, and the selected parties sit under their stance as small ballot slips (bloc-colour top bar, ballot letters, name). Agreement shows as a pile of slips in one column; a split shows as distance. Parties with nothing recorded sit at the end under "No position found" or "Declined to answer". A disclosure under each strip opens what each party said, with sources. This scales from two parties to all fifteen, which the four-column table could not.

```
Haredi draft                       Should yeshiva students be drafted?
Keep exemptions   Quotas and sanctions   Draft everyone        Nothing recorded
[שס] [ג]          [מחל]                  [פה] [ל] [מרצ]        Noam
Read what each party said
```

The Builder's panel gets the same device at thumbnail scale: under "Can they govern together?", seven rows of issue label, a strip glyph (one slot per stance option, the selected parties as squares in their slot) and the reading ("Agree", "Split two ways", "Three have no recorded position"), then the existing pledge and condition notes, then dependence ("Holds 61 without People of Israel; needs each of the others"), then "Compare these parties" carrying the selection to /compare.

## What is not built

A stability score or any number summarising cohesion; outside support as a Builder state; any change to the home page.

## Checks before shipping

1440 and 390 renders of /compare with two, five and fifteen parties and of the Builder panel with the outgoing government and the four core opposition lists; keyboard through the picker and the disclosures; the Builder link round-trips the selection; tests for the cohesion derivation and the selection parsing.
