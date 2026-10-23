# Round 2 research brief: towards forecast version 3

Written 2026-10-23 (Friday; the vote is Tuesday 2026-10-27; poll publication is banned from tonight until the
polls close). Read this whole file before doing anything. It binds every agent in the round.

## The goal

Improve the site's forecast of the 26th Knesset election, judged by how well it predicts the final result.
Version 2 (`scripts/forecast/model.mjs`, reasoning in `docs/research/polls-method/2026-10-23-forecast-algorithm.md`,
evidence in `docs/research/polls-method/round1/`) is the baseline. Version 3 replaces it as the site's default
forecast; version 2's figures stay on the record and are scored beside it, so the improvement is itself a tested claim.

## Decisions already taken (do not relitigate)

1. **Yardstick**: mean absolute seat error per list (`point` vs the official seat count), leave-future-out on the six
   elections under the 3.25% threshold (2015-03, 2019-04, 2019-09, 2020-03, 2021-03, 2022-11). Bloc error, wrong
   threshold calls and the majority Brier score are reported beside it and break ties.
2. **Gate**: a change ships only if the leave-future-out backtest improves on the yardstick, or with a documented
   override that states exactly why the backtest is not informative for it. Overrides go in the memo and the record.
3. **Scope**: a full rebuild is allowed. Nothing in version 2 is sacred, including the Monte Carlo structure.
4. **Data**: pollster-level history is to be built (full campaigns, not just the final 28 days; 2013 added).
5. **House effects**: estimate per firm/outlet from history and apply, shrunk toward zero.
6. **Turnout**: a sector turnout model (Arab, Haredi, general), each calibrated on past poll-to-result gaps.
7. **Threshold**: the final-week swing of sub-threshold lists fitted from history and sampled.
8. **Blackout**: freeze on the last polls but widen uncertainty by the historical size of blackout-period moves.
9. **Process**: 10 to 12 Opus agents; a red team reviews the design and the code before it ships.
10. **Blind design**: the model is designed on polls through 2026-10-22 (data/polls.json at commit 9796c34). The
    October 23 polls (Kan 11, Channel 12, Channel 13, Maariv, Israel Hayom) are a held-out validation set.
    **No agent fetches or looks at any 2026 poll published on or after October 23.** Do not search for them.
11. **Publication**: the methodology page summarises v3 and links every memo; both site editions ship together.
12. The final forecast is locked Monday 2026-10-26 at 9 PM Central. Everything must be done before then.

## Baseline numbers to beat (`node scripts/forecast/backtest/v2.mjs 10000`, leave-future-out, six elections)

| | Per-list error | Netanyahu-bloc error | Mean bloc error | Wrong threshold calls (of 71) | Modal outcome right | Majority Brier |
|---|---|---|---|---|---|---|
| Version 1 | 1.77 | 1.00 | 2.00 | 9 | 6/6 | 0.073 |
| Plain √n average | 1.53 | 1.20 | 1.65 | 5 | 5/6 | — |
| **Version 2** | **1.36** | 1.83 | **1.33** | **4** | 6/6 | 0.090 |

Per election (v2 list error): 2015 1.64, 2019-04 2.86, 2019-09 0.80, 2020 0.67, 2021 1.29, 2022 0.92. April 2019
is where the model is worst (New Right and Zehut both polled at 4-6 seats and failed; Kulanu, Gesher).

## The repo

- `scripts/forecast/model.mjs`: version 2 as a pure function `forecast({polls, config, parties, agreements, cal, opts})`.
  Read it first; it is 185 lines. `opts` switches every component (`DEFAULTS` at the top).
- `scripts/forecast/forecast.mjs`: the daily runner (writes data/forecast.json and data/forecast-history.json).
- `scripts/forecast/calibration.json`: the historical record the model reads (bloc misses, list priors, etc.).
- `scripts/forecast/backtest/README.md`: the backtest harness and the **data schema**. `data/<yyyy-mm>.json` holds
  every poll in the final 28 days of each election plus the official result, agreements and blocs. `v2.mjs` scores
  model.mjs leave-future-out and is the template for scoring any proposal: copy its `run`/`score` and add variants.
- `data/polls.json`: the 2026 polls (62 through Oct 22) and `config` (pollster list, the two Filber-firm outlets).
  `data/parties.json`: the 15 lists with blocs. `data/results.json`: the five surplus agreements.
- `docs/research/polls-method/round1/{A..F}.md`: round-one memos. Skim the Summary of each; they hold evidence you
  should build on, not repeat (B: list bias by class; C: threshold cases 2013-2022; D: pollster accuracy and
  house effects in 2026 and 2019-2022; E: 2026 context; F: statistical review of the simulation).
- New data built this round lands in `scripts/forecast/backtest/data-full/` (full-campaign polls, same schema, plus
  `2013-01.json`) and `scripts/forecast/round2/data/` (turnout and sector tables). If a file you want is not there
  yet, work with what exists and say so in the memo.

## Rules for every agent

- **Write one memo**: `docs/research/polls-method/round2/<letter>-<topic>.md`, in the style of round 1: a dated
  header naming the agent and scope, a numbered **Summary** first, then findings, then a **Recommendation** with
  concrete parameter values, the exact code change (a diff or a drop-in function), and the backtest table for it.
- **Every number reproducible**: name the command or script that produced it. Prototype code goes in
  `scripts/forecast/round2/<letter>/` (committed, small, Node ESM `.mjs`; Python allowed for data building). Scratch
  work goes in the scratchpad directory, not the repo.
- **Score every proposal** with the leave-future-out harness pattern of `v2.mjs` and report the five columns above
  against the version-2 row. A proposal that cannot be backtested must say so and argue its override.
- **Six elections is a tiny sample.** Say what in your result is likely noise. Prefer shrinkage, pooled estimates
  and rules whose sign held in both halves of the record over anything fitted to a single election. State the
  out-of-sample test you ran. Fitting on all six and reporting in-sample is not acceptable without saying so.
- **Do not change committed files** other than adding your memo, your `round2/<letter>/` scripts, and (data agents
  only) the data files you were asked to build. Do not touch model.mjs, calibration.json, data/polls.json or the
  site code: the synthesis step makes those changes.
- **Sources**: English and Hebrew Wikipedia, the Central Elections Committee (bechirot.gov.il / gov.il), the Israel
  Democracy Institute, the Knesset site, pollster publications, academic papers. Cite URLs. When fetching
  Wikipedia use a plain generic User-Agent string; never put any person's name or email in a request.
- **Stay blind**: no 2026 poll data from the web at all. The 2026 polls you may use are the 62 in `data/polls.json`.
- **Honesty over polish.** If your assigned direction does not hold up, say so clearly in the Summary; a clear
  negative result saves the synthesis from shipping it.
- Run `node scripts/forecast/backtest/v2.mjs 2000` once at the start to see the harness work (about 10 s).

## Assignments

| Agent | Topic | Depends on |
|---|---|---|
| D1 | Full-campaign poll datasets for 2013, 2015, 2019a, 2019b, 2020, 2021, 2022 (`data-full/`) | — |
| D2 | Sector turnout and poll-to-result gap tables: Arab, Haredi, general; undecided handling by pollster (`round2/data/`) | — |
| A | House effects per firm and outlet, shrunk; applied before pooling | D1 (start on 28-day data) |
| B | Sector turnout model: Arab, Haredi, general swing terms, calibrated | D2 (start on 28-day data) |
| C | Final-week swing of sub-threshold and borderline lists; strategic voting | — |
| D | Blackout: moves from last published polls to result; trend extrapolation vs widening | — |
| E | Full rebuild candidate: a state-space / Bayesian poll aggregation with house effects and a trend, in Node | D1 |
| F | Ensembles and stacking: v2, the state-space model, the plain average, leave-future-out weights | A, E (start with v2 and the average) |
| G | Uncertainty structure: correlation of list residuals, interval calibration, the lean's distribution | — |
| H | 2026 context not in the polls: new lists' histories, Haredi draft issue, turnout expectations, pollster methods this cycle | — |
| R | Red team: leakage, overfitting, bugs in the built version 3 | synthesis |
