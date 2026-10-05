# Fact-check spec: reference pages (2026-10-05)

This is the independent check that 00-PLAN.md ("Proof") requires before any text page ships. It applies to drafts written under DRAFTING-SPEC.md, and you are not their author. Assume every claim is wrong until you have seen it confirmed.

## For each page you are given
1. Read the page (`content/.../<slug>.mdx`), its charts (`data/charts/<slug>.json`) and, for an issue page, its party table (`data/positions/<slug>.json`).
2. List every checkable claim:
   - every number and date;
   - every quote;
   - every party position;
   - every "first", "only", "most" or "since";
   - every causal claim;
   - every bill status, vote count or court ruling.
3. Check each claim. Confirm it against the cited source by opening the URL with WebFetch. A PDF or a blocked site may be confirmed against the research record (`docs/research/<topic>/*-data.json` with `verified: true` and its verification note, or `*-verification.md`); say which.
   - The number must match the source exactly, including what population it describes, the survey wording and the date.
   - A quote must be verbatim, and the speaker, outlet and date must be right.
   - A party position must be what that party said, not a characterization.
4. Check the rulings in `docs/research/RULINGS.md`, especially terminology, rulings 20, 23, 24, 26, 27 and 29, and the page-specific Part 2 items.
5. Check the voice. The page must be neutral, and no sentence may take a side in its own voice. Loaded words belong only inside attributed quotes. Misreadings must correct a misreading with facts, not argue a position.
6. Check the charts.
   - A chart must not mix surveys or questions as if they were one series.
   - Its labels must match the source's groups.
   - Its title must say what is measured.
   - Its `date` must be the fieldwork or publication date.

## What you do with what you find
- **Wrong and fixable from the source:** fix it in the file, keeping the drafter's wording otherwise.
- **Not confirmable:**
  - Cut the claim, or the part of the sentence that carries it, then repair the prose around it.
  - Never hedge it ("reportedly", "some say").
  - Never write "unverified".
- **Loaded voice:** neutralize the wording without changing what is claimed.
- Leave every other file alone, including other pages and `data/parties.json`.
- After editing, run `npx vitest run lib/articles.test.ts -t "<slug>"` and make sure the page still passes, including the length floor. If cutting takes a page below its floor, add confirmed material from the research files, not filler.

## Report (your final message), per page
- How many claims you checked, and how many you confirmed by opening the source versus from the research record.
- Every change you made: the old claim, the new text or the cut, and why.
- Anything that needs Daniel:
  - a party's stated position that conflicts with its profile;
  - text that reads as an editorial stand you could not neutralize without changing meaning.
