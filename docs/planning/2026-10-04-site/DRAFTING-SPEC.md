# Drafting spec: issue and community pages (2026-10-05)

Every drafting agent follows this file. The order of authority is: `docs/research/RULINGS.md`, then `docs/00-PLAN.md` (Issues and sociology layer, Voice, Proof), then this spec.

## Inputs, per page
- `docs/research/<topic>/<topic>-brief.md`: what the page is built from.
- `<topic>-findings.md`: the full record with URLs. Use it for the body.
- `<topic>-data.json`: every datapoint, with source, URL, date and `verified`. Only datapoints with `verified: true` may appear (ruling 26).
- `<topic>-verification.md`: what was confirmed, what was not, and the known collisions between figures.
- `docs/research/REVIEW-PACKET.md` Part 3: the known gaps. Gaps stay out; do not fill them from memory.
- `docs/research/RULINGS.md`: the terminology and framing rulings. Part 2 lists the page-specific ones by topic.

## Outputs, per page (only these files; do not touch anything else)
- `content/issues/<slug>.mdx`, `content/communities/<slug>.mdx`, or `content/american-lens.mdx`.
- `data/charts/<slug>.json`: `{ "<id>": Chart }`, with the shape in `lib/articles.ts`. The MDX references charts as `<Chart id="<slug>.<id>" />`.
- Issue pages only: `data/positions/<slug>.json`, a Positions object (see `lib/articles.ts`), referenced as `<Positions issue="<slug>" />`.

Do not edit `data/parties.json` or any other shared file. If a sourced party position conflicts with that party's profile in `data/parties.json`, leave the profile alone and report the conflict in your final message.

## MDX format
Start with the meta block as JSON, exactly in this shape:

```
export const meta = {
  "title": "Courts and the judicial overhaul",
  "dek": "One sentence, 40–220 characters, saying what the page explains.",
  "checked": "2026-10-05"
};
```

Then the body: Markdown `##` sections, plus these components, which need no imports:
- `<Chart id="courts.trust-jews" />`: a chart from `data/charts/<slug>.json`. Use `kind: "bars"` (one number per row; `unit: "%"`) for a comparison across groups or years. Use `kind: "table"` with `columns` and per-row `cells` when there are several columns.
  - One measure per chart.
  - Never two scales on one chart.
  - Don't put different surveys side by side as if they were one series. Give each its own chart, or use per-row `source`/`url`/`date` and say so in `note`.
  - Use `question` for the survey wording.
- `<Positions issue="courts" />`: the party table.
- `<Quote who="..." role="..." source="..." url="https://..." date="...">verbatim words</Quote>`: charged quotes go here verbatim, with speaker, source and date (ruling 29).
- `<Note title="...">...</Note>`: a boxed aside, for example a definition, or the Golan Druze box (ruling 10).
- Links: `[text](https://...)`. Internal links go to `/issues/<slug>`, `/communities/<slug>`, `/american-lens` or `/parties/<id>`.

## Page shapes (from 00-PLAN.md)
**Issue pages** (800–1,200 words of prose, plus 2–3 charts):
- Four `##` sections, in this order:
  1. What is at stake (plain language).
  2. What Israelis think, broken down by group, with charts.
  3. What the parties say: a sentence or two, then `<Positions issue="<slug>" />`.
  4. "Misreadings" (exactly that heading, ruling 31): how an American reader is likely to misread this issue.
- `## ` headings for sections 1–3 can be worded for the page. Keep them plain, e.g. "What is at stake", "What Israelis think", "What the parties say".

**Community pages** (500–1,600 words):
- Sections, in this order:
  1. Size, growth and geography (CBS by default, ruling 23).
  2. How their towns have voted, 2019–2022, from CEC locality results. Caption it "how these towns voted", never "how the group voted" (ruling 27). Show each list as it ran that year, with a note on name changes (ruling 28).
  3. What they think on the six issues: draft, courts, war and hostages, West Bank, religion and state, economy.
  4. Who they are: lived texture, with one or two sourced voices.
- If no 2026 data exists for the group, say so (ruling 25).

**American lens** (`content/american-lens.mdx`, 800–1,800 words): see 00-PLAN.md, "American lens page". Use sections that fit the material; neutral voice (ruling 63).

## Voice and proof
- Neutral reference voice, third person. Never "I", "we" or "our" as the site's opinion. "Our classification" is allowed only where ruling 98 requires it. Never Daniel's voice.
- Every number in the prose shows its source and date inline, e.g. "52% said it was not correct to advance the bill now ([IDI, March 2026](https://...))". The same applies inside charts (the source line is automatic) and positions.
- Anything not verified is cut, not hedged. Do not write "reportedly", and do not write "unverified" anywhere. If a datapoint has `verified: false`, or the brief tags it "(unverified)", leave it out.
- No figures, quotes or facts from memory. Everything must trace to a URL in the research files. If a fact the page needs is missing, write around it, or state the gap plainly ("No 2026 survey breaks this down by group").
- Use the research's corrected figures. Where `verification.md` flags a collision (e.g. Pew 43% vs 37%), label each figure with its survey.
- Use the house spellings (ruling 32) and terminology (rulings 1–25). Examples:
  - "Haredi/Haredim", with "ultra-Orthodox" once at first use.
  - "West Bank", never "Judea and Samaria" outside quotes.
  - "occupied" as the default.
  - "annexation".
  - "Palestinian citizens of Israel".
  - Pew's own wording ("think Israel and a Palestinian state can coexist peacefully"); never "support two states".
  - "judicial overhaul".
  - "yeshiva students who did not report".
  - "Liberman".
- Party ids for Positions: likud, otzma, shas, utj, rz (Religious Zionism–Zehut), poi (People of Israel), noam, yashar, byachad (B'Yachad), dem (The Democrats), yb (Yisrael Beiteinu), bw (Blue and White), res (Reservists–Economic), jl (Joint List), raam.
  - A party with no sourced position on the issue gets no row.
  - The Positions `note` names the parties with no published position found, e.g. "No published position found for Noam or Ra'am (checked October 2026)."
- Party rows must be what the party says, in its own words where possible. Do not characterize them.
- Stale-data watch: war, Gaza and Iran facts and bill statuses move. Date them ("as of September 2026"). Don't write anything as current that the research dates earlier without saying when.

## Checks before you finish
- Run `npx vitest run lib/articles.test.ts -t "<slug>"`. It checks length, sections, links, terminology, unverified items, and chart and positions data.
  - Fix everything it flags in your files. Other pages' failures are not yours.
  - Do not run `next build` or `next dev`; other agents share this tree.
- Final message: the files written, the word count, the charts, anything left out for lack of verification, and any party-profile conflict found.

## How it works pages (added 2026-10-05)
- **Files:** `content/guides/<slug>.mdx`, served at `/how-it-works/<slug>`. Charts go in `data/charts/<slug>.json`. There is no Positions table.
- **Shape:** 600–1,400 words of prose and at least three `##` sections. Use charts or tables where numbers line up; for example, a worked seat-allocation table.
- **The last section is "Misreadings":** what an American reader is likely to get wrong, corrected with facts.
- **Inputs:**
  - `docs/class-02-research-system-tribes-map.md` §A (mechanics);
  - `docs/class-07-bader-ofer.md`;
  - `data/results.json` (2026 threshold, ballot letters, surplus agreements and their status);
  - `docs/research/data-vote-map/*.md` (envelope votes, CEC files);
  - `public/vote-map/*.json`, if you need computed figures.
  These memos cite Wikipedia in places. The page may not (see lib/articles.test.ts), so confirm each such fact at a primary or reputable source (IDI, the Knesset, CEC, Times of Israel, JPost, Ynet), or cut it.
- **Fresh research is allowed** (WebSearch/WebFetch). Every new fact needs a URL you opened, and the date.
- **Internal links:** `/how-it-works/<slug>`, `/vote-map`, `/results`, `/polls`, `/parties/<id>`, `/issues/<slug>`, `/communities/<slug>`, and `/#build` for the Coalition Builder. `/#build` is not in the test's route list, so link `/` instead.
