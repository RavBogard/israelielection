# Party match: "Which Israeli party matches you?"

Design approved by Daniel, 2026-10-08. The route is `/match`, in English only.

## Purpose and audience

This is a fun, educational tool for Americans following the election. Few Israeli voters will use it.
The reader answers a short fixed questionnaire. The page shows which of the 15 lists sit closest to
them, and why, and explains what an Israeli voter with those matches would weigh tactically. The
explanation stops there.

### Rulings this rests on
- **Explain, don't recommend** (Daniel, 2026-10-08). The page never says "vote X", "your strongest
  vote is X", or anything imperative about a ballot. Strategic facts are stated about lists and
  blocs, and the reader draws the conclusion.
- **Supersedes** `docs/planning/2026-10-05-eval/EVAL.md:142`, which rejected a party-match quiz
  ("Americans do not vote; drifts to advocacy"). Daniel asked for the quiz on 2026-10-08 with an
  American audience in mind. The no-recommendation rule answers the advocacy concern.
- `PRODUCT.md:30`: educational, not advocacy, and no endorsement of a party.
- Graphic first: the results graphic leads. The head is the title plus one sentence, and the
  explainers sit below the graphic or in disclosures.
- Design identity: lists appear as ballot slips, the 120-seat grid with the 61st seat marked is the
  identity device, stance shades use the Compare ramp (`components/compare/ramp.ts`), and there are
  no all-caps labels, no arrows on links and no middle-dot meta strings.

## Questions (`data/quiz.json`)

No new party data. Every question points at a row that `matrixRows()` builds
(`components/compare/model.ts`), so each party's answer, its place on the scale, and its
record or unstated basis come from the same source Compare uses.

- **Core round: 7 questions,** one per issue axis: draft, courts, war (October 7 inquiry), wb,
  pstate, relig, econ.
- **Deeper round (optional): the 8 narrower questions** from `comparison-questions.json`. These are
  draft-left-yeshiva, draft-exemptions, courts-appointments, courts-override, courts-reasonableness,
  relig-marriage, relig-shabbat and relig-conversion.
- **Each quiz entry holds:**
  - `row`: the matrix row key.
  - `prompt`: a plain-English statement for an American reader.
  - `context`: one sentence on why it matters in Israel.
  - `options`: one per stance id, reworded in the first person. Every stance on the row needs one
    option, and the data test checks this.
- **Every question also offers:**
  - "Skip": it counts toward nothing.
  - Importance: *A little*, weight 0.5; *Matters* (the default), weight 1; *Deal-breaker*, weight 2.

## Matching (`lib/match.ts`, pure, Vitest)

- **Agreement on one question:**
  - On a scale row: `1 − |u − p|`, where `u` and `p` are the reader's and the list's places (0 to 1)
    from the matrix row.
  - On a row that is not a scale (econ): 1 for the same priority, otherwise 0.
- **Data the list counts on:**
  - A list's cell counts only when it is `kind: "stance"`. Declined, unsorted and blank cells drop
    out of that list's average and are never scored as disagreement.
  - Record-based and unstated cells count, and each carries its label in the breakdown.
- **Match:** Σ weight·agreement ÷ Σ weight, over the questions both sides answered.
- **Coverage:** the number of questions both answered ÷ the number of questions the reader answered.
  A list with coverage under 0.5 is listed apart under "Too little on record to place", without a
  percentage.
- **Deal-breaker flag:** set on a list whose agreement is below 0.5 on any deal-breaker question.
  The flagged list is shown with the flag, never hidden.
- **Ties** sort by coverage, then by the order in `parties.json`.
- **Minimum:** the reader answers at least 4 core questions before results show.

## State and sharing

- Answers are encoded in the URL query: `?a=` holds compact stance indexes and importance per
  question. A result is shareable as a link.
- Nothing is stored and there is no server call. The page is a server component that passes the
  quiz data and matrix rows to one client component.

## Screens

1. **Quiz:** one question at a time.
   - A progress strip of 7 marks.
   - The options are drawn as stance chips in their ramp shades, ordered along the scale, so the
     reader can see they are choosing a place in a debate.
   - Importance sits under the options.
   - Back and Skip.
   - After the 7th question: "See your matches", or "Go deeper (8 more)".
2. **Results:**
   - **Graphic first:** the 15 lists ranked as ballot slips with a match bar, a percentage and
     coverage ("on 6 of 7").
   - **Per-list breakdown:** opening a slip shows each question as two marks on that question's scale
     (yours and theirs), the list's own words and a source link, with a link to the party profile.
   - **Bloc summary:** where the reader's top five sit across the four blocs.
3. **If you were voting in Israel** (below the results):
   - **Per top-three list:**
     - its poll average from `listSeats()`;
     - its threshold state: passing, near the threshold, or below it;
     - its bloc, and that bloc's seats against 61 (`blocSeats`);
     - its surplus partner (`surplusLine`);
     - recorded pledges that touch it (`pledge-rules.json`).
     All of this is stated as fact about the list.
   - **Fixed explainer:** the 3.25% threshold (about 4 seats), wasted votes, why voters move to a
     bloc's biggest list, and surplus-vote agreements. It links to `/how-it-works` and to the
     Coalition Builder with the top matches preselected, if the Builder takes a query string.
     Otherwise it links plainly.
4. **Method disclosure:** how the score works, what the blank cells mean, and a statement that this
   is not a recommendation.

## Navigation

The route goes in the menu group that matches it (Explore), in its `more` slot if the masthead
is full. It needs a page title and an Open Graph image, reusing the site default.

## Testing

- `lib/match.test.ts`:
  - exact match = 100%;
  - opposite ends = 0%;
  - a skipped question has no effect;
  - a declined cell is excluded and not penalised;
  - the coverage cut-off;
  - deal-breaker flags;
  - econ is not a scale;
  - the URL encoding round-trips.
- **Data test:** every quiz option maps onto an existing stance on its row, and every stance has an
  option.
- **Browser check:** the quiz and results at 390px and 1366px, light and dark.

## Out of scope

- A Hebrew edition.
- AI in the quiz.
- A share image for each result.
- Any storage of answers.
