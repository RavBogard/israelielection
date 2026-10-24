# Forecast backtest

Out-of-sample test of `scripts/forecast/forecast.mjs` on the six elections held under the 3.25% threshold
(Mar 2015, Apr 2019, Sep 2019, Mar 2020, Mar 2021, Nov 2022), scored by the pre-registered rule in
`docs/research/polls-method/2026-10-23-forecast-algorithm.md`. Findings: `docs/research/polls-method/round1/A-backtest.md`.

```
node scripts/forecast/backtest/backtest.mjs                 # baseline table, ~3 s
node scripts/forecast/backtest/backtest.mjs --grid          # plus the parameter grid, ~35 s
node scripts/forecast/backtest/backtest.mjs --opts '{"seatsToShares":"plusHalf"}'   # score a proposal
node scripts/forecast/backtest/backtest.mjs --2026 '{"seatsToShares":"plusHalf"}'   # today's 2026 forecast under it
node scripts/forecast/backtest/backtest.mjs --check2026     # model.mjs == forecast.mjs on data/polls.json
node scripts/forecast/backtest/backtest.mjs --json          # machine-readable baseline
```

## Files

| File | What it is |
|---|---|
| `model.mjs` | `forecast(polls, opts)`: forecast.mjs as a function. Under `DEFAULTS` it reproduces forecast.mjs exactly (`--check2026` runs forecast.mjs live in its no-write sensitivity mode and compares every printed figure at 50,000 runs, same seed). Also `siteAverage()` (lib/polls.ts's average), `makeAllocator()` (Bader-Ofer with agreements), `leanFrom()`. |
| `backtest.mjs` | Harness: leave-future-out lean, scoring, tables, grid. Importable: `runBacktest(opts)`, `runAverage(includeFilber)`, `score()`, `summarise()`, `setup2026()`. |
| `build-data.py` | Builds `data/*.json` from English Wikipedia wikitext (python3, run once; `--fetch` downloads). All judgments (list ids, blocs, aliases, agreements) are written out in it by hand. |
| `data/<yyyy-mm>.json` | One file per election. |

## Options (`opts` of `forecast` / `runBacktest`)

model.mjs `DEFAULTS` (forecast.mjs's behaviour): `windowDays` 14, `windowFrom` "newest" | "election", `includeFilber`
false, `pollsters` (whitelist), `belowDefault` 0.02, `seatsToShares` "forecast" | "plusHalf", `nDefault` 600, `weight`
(fn), `pollsterWeights` ({pollster: ×}), `aggregate` "mean" | "median" | "kn", `lean`, `blocSd`, `listSd`, `consolidateSd`
1.5, `consolidateBlocs`, `listNoise` "independent" | "withinBloc" | "netNeutral", `threshold`, `agreements`, `runs`,
`seed`, `point` "central" | "median", `passCall` "sim" | "point".

Harness-only: `leanRule` "recency" (forecast.mjs, half-life 2) | "mean" | "last" | "zero" | number; `leanHalfLife`;
`leanSource` "data" (field misses recomputed from this data under the same options) | "calibration"
(scripts/forecast/calibration.json); `blocSdRule` "forecast" (max(3, 2 × weighted residual)) | number; `listSdScale`.
The lean and residual for an election use only the elections before it; 2015 gets lean 0, blocSd 3.

## Data schema (`data/<yyyy-mm>.json`)

```jsonc
{
  "election": "2022-11-01", "key": "2022-11", "knesset": 120, "threshold": 0.0325, "retrieved": "2026-10-23",
  "sources": { "polls": "<Wikipedia polling page>", "result": "<article>#Results", "agreements": "<article>#Surplus-vote_agreements" },
  "lists":  { "likud": "Likud", ... },            // every list the final polls report separately
  "blocs":  { "likud": "net", "ya": "opp", "raam": "arab", "jh": "mid", ... },
  "blocNote": "how the blocs were drawn",
  "result": { "validVotes": 4764742, "lists": { "likud": { "votes": 1115336, "pct": 23.408, "seats": 32, "passed": true }, ... } },
  "agreements": [["labor", "meretz"], ["likud", "rz"], ...],
  "polls": [ // every poll dated within 28 days before the vote, newest first; same shape as data/polls.json
    { "id": "channel-13-2022-10-28", "pollster": "Channel 13", "firm": "Camil Fuchs", "fieldwork": "28 Oct 22",
      "published": "2022-10-28", "via": "Wikipedia", "url": "<polling page>", "n": null, "margin": null, "note": null,
      "filber": false,                              // Direct Polls / Shlomo Filber firms (excluded by forecast.mjs)
      "results": { "likud": { "seats": 30 }, "jh": { "seats": 0, "belowThreshold": true, "pct": "2.0%" }, ... },
      "combined": [] }                              // a cell spanning lists that are not one list: { parties, seats }
  ]
}
```

- `pollster` is the outlet (as in data/polls.json); `firm` the polling company. Spelling variants of one outlet are
  merged (HaHadashot 12 / Keshet → Channel 12; Israel Hayom & i24 News → Israel Hayom; Walla! → Walla; Israel Radio →
  Reshet Bet; same-firm co-publications into the main outlet). Different firms for one outlet stay one pollster, so the
  one-per-pollster rule keeps the latest.
- `published` is the last date in Wikipedia's date cell (usually the end of fieldwork or the publication day).
- Seats: a number is seats; `(N%)` in a cell is a list below the threshold with its printed share; `0` or `–` for a
  list on the ballot is below the threshold with no share printed; `N/A` (list not running) is omitted. Cells like
  `4 (3.9%)` keep both. Exit polls (dated on election day) are excluded.
- `n` is null throughout: Wikipedia's Israeli tables do not print sample sizes.
- `result.pct` is votes / the sum of all lists' votes in the article's `{{Election results}}` template (valid votes).
  `makeAllocator` with `agreements` reproduces every official seat count exactly in all six elections.

## Sources (English Wikipedia, raw wikitext read 2026-10-23)

| Election | Polls | Result and surplus agreements |
|---|---|---|
| 2015-03-17 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_2015_Israeli_legislative_election | https://en.wikipedia.org/wiki/2015_Israeli_legislative_election |
| 2019-04-09 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election | https://en.wikipedia.org/wiki/April_2019_Israeli_legislative_election |
| 2019-09-17 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election | https://en.wikipedia.org/wiki/September_2019_Israeli_legislative_election |
| 2020-03-02 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election | https://en.wikipedia.org/wiki/2020_Israeli_legislative_election |
| 2021-03-23 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election | https://en.wikipedia.org/wiki/2021_Israeli_legislative_election |
| 2022-11-01 | https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election | https://en.wikipedia.org/wiki/2022_Israeli_legislative_election |

The wikitext snapshots were not committed (2 MB); their sha256 prefixes, for checking a re-fetch:
polling pages 2015 `ab41f2559bd49029`, 2019-04 `5ad4144f898569c2`, 2019-09 `303e7d3cc02dca07`, 2020 `3994416bcbce56bd`,
2021 `924535324e5db1ff`, 2022 `392c1f1f73441d86`; articles 2015 `5ae9c1b71ae7c278`, 2019-04 `df98ebdd11b8605f`,
2019-09 `86a2cc64440b1085`, 2020 `0027f0f41feb9e54`, 2021 `0bacaa6e5dc951d4`, 2022 `ec5dc9da6f2be8d6`.
Wikipedia pages change; a re-fetch may differ.

## Blocs

Drawn as `scripts/forecast/calibration.json` counts the Netanyahu bloc ('net'), so the field misses this data yields
match calibration.json within 0.5 seats (2015 56.9 vs 56.4, Apr 2019 64.6 vs 64.7, Sep 2019 55.7 vs 55.6, 2020 57.3 vs
57.3, 2021 49.9 vs 50.3, 2022 60.0 vs 60.3). Arab lists are 'arab'. Lists in neither camp are 'mid': Kulanu 2015,
Yisrael Beiteinu Sep 2019 and 2020, Yamina 2021, Jewish Home 2022, and Otzma Yehudit Sep 2019 and 2020 (right-wing, but
outside the bloc as Wikipedia's 'Gov.' column and calibration.json count it; it failed both times). Each file's
`blocNote` says what was decided.

## Version 2

`node scripts/forecast/backtest/v2.mjs [runs]` scores `scripts/forecast/model.mjs` (the model as it runs daily since
version 2, 2026-10-24) on the same six elections, leave-future-out, against version 1's rules and with each component
switched off. The 2026 prior classes are mapped to each election's lists by hand in `CLASSES` inside the script.

## Version 3

`node scripts/forecast/backtest/v3.mjs [runs] [seeds] [data|data-full] [--filber=poll|outlet]` scores
`scripts/forecast/model.mjs` (version 3 since 2026-10-24) against version 2 (`opts.v2`) over several seeds, with the
calibration columns of round 2 (P(pass) Brier, randomised-PIT coverage, CRPS). `--filber=poll` (the default) drops a
Filber-firm poll without dropping its outlet's other polls; `--filber=outlet` is the version-2 harness's rule.
`data-full/` holds whole campaigns 2013–2022 (`build-data-full.py`; round2/D1-data-full.md). `v2.mjs` passes
`v2: true` and still scores version 2. The round-2 prototype harnesses under `scripts/forecast/round2/` import
`model.mjs` without that switch and were run against it as committed at `56fee38` (version 2); run them today and
they score version 3's defaults with the 2026 sector term applied to the past (round2/R-red-team.md, finding 4).
