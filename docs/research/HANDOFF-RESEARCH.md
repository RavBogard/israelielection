# HANDOFF — research layer for israelielection.org (2026-10-05)

Executor: Code session, phase 2 (content + data), after Daniel rules on REVIEW-PACKET.md Parts 1–2.
Status: research done, independently verified, corrections applied. Waiting on Daniel's rulings. Nothing here is site copy yet.

## What is in docs/research/
- `REVIEW-PACKET.md` — Daniel's review doc. Part 1: 32 rulings that recur across pages. Part 2: 70 page-specific rulings. Part 3: known gaps. Part 4: all 18 briefs. His answers come back as "12: b" style lines; record them in `RULINGS.md` (create it) before drafting anything.
- 18 topic folders, each with:
  - `<slug>-brief.md` — the one-page brief the page is built from (verified and corrected; ends with a verification-status line).
  - `<slug>-findings.md` — the full research record with URLs. Use it for the page body; the brief alone is too thin for 800–1,200 words.
  - `<slug>-data.json` — every datapoint with value, population, date, source, url, verified status. These become `data/surveys.json` (merge all), and the `party_positions` arrays become `data/issues.json`; `voting_pattern` arrays become `data/groups.json`.
  - `<slug>-verification.md` — the independent check: what was confirmed, what was not, what is still unverified. Anything marked NOT ON PAGE / UNVERIFIED that still appears in a brief is tagged "(unverified)" there.
- `data-vote-map/` — feasibility study for the locality choropleth plus working samples: `samples/localities-2022.sample.json` (1,215 localities, party votes sum to valid votes in every row), `samples/localities-prototype.topo.json` (~1 MB TopoJSON, 1,179 polygons + 35 points), `samples/party-letters-k21-k25.json` (ballot-letter → party per election), `data-vote-map-sources.json`. The pipeline is in `data-vote-map-brief.md`.

Topics: issue-haredi-draft, issue-courts, issue-war-hostages, issue-west-bank, issue-religion-state, issue-economy, issue-not-on-ballot, american-lens, group-secular, group-masorti, group-religious-zionist, group-haredi, group-russian-speakers, group-ethiopian, group-palestinian-citizens, group-druze, group-settlers, data-vote-map.

## Rules for turning this into pages (from 00-PLAN.md)
- Neutral reference voice. Daniel's signed intro lives on the home page and About only.
- Issue pages: four parts — stakes / what Israelis think (charts by group) / what parties say (table with sources) / how an American reader misreads it. 800–1,200 words, 2–3 charts.
- Group pages: size-growth-geography / voting pattern 2019–2022 from CEC localities / attitudes on the six issues / lived texture with sourced voices.
- Every number on a page shows date and source inline. Anything tagged "(unverified)" in a brief is NOT published until sourced — Part 1 ruling 26 may change this; follow the ruling.
- Terminology follows RULINGS.md. Where no ruling covers a case, use the source's own wording and log it in RULINGS.md under "decided by Claude, review later."
- Cross-page consistency: the same figure must read the same on every page (e.g. Pew Israeli Jews 2014 appears as 43% and 37% from two different Pew surveys — label each by survey). The `verification.md` files flag the known collisions.
- Do not fill gaps from memory. Part 3 of the packet lists what could not be verified; those stay out or stay tagged until a fresh research pass closes them.

## Stale-data watch
- Several war/Gaza/Iran facts were current as of August–September 2026 and are moving. The war-hostages brief marks them. Re-check before publishing.
- The CEC 2026 results file already exists as a test file at the 2022 address (see data-vote-map). Watch it on election night.

## Verification record
- 18 briefs checked by four independent Opus passes against the cited URLs (web search was unavailable; URLs were opened directly). CEC locality arithmetic was recomputed from the official CSVs for every town figure in every group brief and matched after corrections.
- Corrections applied 2026-10-05; each brief's last line says how many claims were checked and confirmed.

## Stop-and-ask
- Anything that changes a party's stated position.
- Any text in Daniel's voice.
- Publishing an unverified figure.
- Money beyond the approved daily job.
