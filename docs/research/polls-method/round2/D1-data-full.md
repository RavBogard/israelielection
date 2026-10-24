# D1. Full-campaign poll datasets, 2013–2022

Round 2 data memo, 2026-10-24. Agent D1. Scope: build `scripts/forecast/backtest/data-full/<key>.json` for
2013-01, 2015-03, 2019-04, 2019-09, 2020-03, 2021-03 and 2022-11, so house effects, trends and blackout moves can
be estimated (agents A, D, E). Data only: no model change is proposed, so there is no backtest table. Files added:
`scripts/forecast/backtest/build-data-full.py` (builder), `scripts/forecast/backtest/data-full/*.json` (7 files),
`scripts/forecast/round2/D1/verify.mjs` (checks and the count tables below), and this memo. No other file changed;
nothing committed. No 2026 poll data was fetched.

```
python3 -I scripts/forecast/backtest/build-data-full.py <wikitext-dir> --fetch   # downloads 14 pages, builds data-full/
node scripts/forecast/round2/D1/verify.mjs --table                               # checks 1-3 and the tables in §4
```

## Summary

1. **981 polls in seven elections**, every row of every polling table on English Wikipedia's polling page from the
   day after the previous election to the day before the vote: 2013 102, 2015 174, Apr 2019 232, Sep 2019 68,
   2020 80, 2021 169, 2022 156. 573 of them fall after the outgoing Knesset was dissolved (each file records the
   date in `dissolved`). Exit polls, scenario tables, student polls and prime-minister polls are excluded.
2. **The 28-day files are reproduced exactly.** All 199 polls in `data/<key>.json` appear in the full files with
   identical `results` and `combined`, and the full files contain no other poll in those 28 days. Lists, blocs,
   blocNote, agreements, sources and result objects are identical (JSON-equal) to the 28-day files' (they are read from
   build-data.py's `ELECTIONS`, not copied). The only field differences on those 199 polls are 29 firm spellings
   normalised ("Maagar Mohot" → "Maagar Mochot" 16, "Panels" → "Panels Politics" 9, "KANTAR" → "Kantar" 4).
   Every `pollster`, `id`, `published` and `filber` value is unchanged.
3. **2013 is added** (threshold 2%, `threshold: 0.02`). `makeAllocator` with its six surplus agreements reproduces
   all 14 official seat counts, as it does for the other six elections. The 2013 lists and blocs are my judgments,
   written out in the script and in `blocNote`. The Netanyahu bloc is Likud Yisrael Beiteinu, Jewish Home, Shas, UTJ
   and Otzma LeYisrael: 61 seats. Yesh Atid and Am Shalem are 'mid'.
4. **Lists change during a campaign, so the full files need ids the 28-day files did not.** A party polled before it
   merged, split, withdrew or was renamed gets an id of its own, documented in a new top-level `otherLists`
   ({name, bloc, into, note}; `into` names the final list it merged into). For example, `bw_ya` (Yesh Atid before
   Blue and White) has into `bw`. The 28-day files already had one such id (`zehut` in Sep 2019). Per-poll schema is
   unchanged. Consumers that sum shares over `lists` will ignore these ids; a trend or house-effect model should
   either restrict itself to polls after the final lists formed or map components with `into`. The date from which
   every poll uses final-list ids only is 28 Oct 2012, 24 Jan 2015, 21 Feb 2019, 1 Sep 2019, 16 Jan 2020, 4 Feb 2021
   and 16 Sep 2022.
5. **The material for house effects:** the outlets with long series in five or more elections are Channel 12/2
   (with News Company), Channel 13/10 (with Ten News), Kan 11/Channel 1, Maariv, Israel Hayom, Walla and 103fm.
   The firms with the most polls are Panels Politics 223, Midgam and its panels 214, Maagar Mochot 109, Smith 82,
   Direct Polls 66, Camil Fuchs 50 and Kantar 44. Filber's firms have 66 polls (2019-04 13, 2019-09 4, 2020 6,
   2021 18, 2022 25), the first on 30 Dec 2018. See §4 for the full tables.
6. **Caveats that matter for estimation** (§6):
   - Years are inferred for undated rows.
   - Early-campaign tables omit small parties, which are then not reported. A missing list means not reported,
     not zero.
   - Seat sums are off 120 in 87 polls, mostly 2013 and 2015, where pollsters or Wikipedia left cells blank.
   - Outlets' co-publications keep their own labels, and firm lineages (Teleseker → TNS → Kantar) are not merged.
   - Party compositions behind some same-named columns changed: Yamina 2020–21 and the Joint List before Ra'am's
     exit get separate ids; Yesh Atid (with Telem in 2020) does not.

## 1. What was built

One file per election in `scripts/forecast/backtest/data-full/`, in the schema of `scripts/forecast/backtest/README.md`
(the 28-day `data/<key>.json`). Every per-poll field is as there (`id, pollster, firm, fieldwork, published, via,
url, n, margin, note, filber, results, combined`); `n` and `margin` are null throughout because Wikipedia prints no
sample sizes; polls are newest first. Top-level additions:

| Field | Meaning |
|---|---|
| `about` | One paragraph: coverage, counts, provenance. |
| `previousElection`, `dissolved` | The window starts the day after `previousElection`. `dissolved` is the date the outgoing Knesset was dissolved (2012-10-15, 2014-12-08, 2018-12-26, 2019-05-30, 2019-12-12, 2020-12-23, 2022-06-30), so a consumer can cut the record to the campaign proper. |
| `otherLists` | `{id: {name, bloc, into, note}}` for every id used in polls that is not a final list (§3). |
| `wikitextSha256` | sha256 prefixes of the two wikitext snapshots the file was built from. |

`threshold` is 0.02 for 2013 and 0.0325 otherwise. Seats stay integers except one 2013 Geocartography poll
(10 Jan 2013), which printed 16.5 and 5.5 seats; those are kept as fractions.

**Method.** `build-data-full.py` imports build-data.py and reuses its parsing helpers, its `ELECTIONS` (list ids,
names, blocs, agreements, blocNote, result names) and its `ALIASES`. It differs from build-data.py in these ways:

- **Every polling table is read.** Wikipedia starts a new table whenever the lists change; there are 1 to 8 tables
  per campaign, 32 in all. Each table has its own hand-written column map in `TABLES`. Scenario tables, student polls
  and prime-minister polls are not read.
- **Rowspans are expanded.** A row whose date and pollster cells are both carried down from the row above is another
  scenario of the same poll. Those 19 rows (5 in Apr 2019, 14 in 2020) are dropped, and the kept first row gets a
  note. Two scenario rows printed inline in the 2015 table are also dropped: a Likud + Jewish Home joint list (20 Jan,
  Knesset Channel/NRG) and a Yesh Atid + Kulanu joint list (23 Dec, TRI/Nana 10). Both were found by their
  "scenario" footnote.
- **Years are inferred.** Most tables print "8 Jan" without a year. The year comes from year-divider rows where the
  table has them (2013, 2015, 2022). Otherwise it is the latest year that keeps the date on or before the row above,
  since tables run newest first. No row came out of order after this.
- **Labels are cleaned.** `{{nowrap}}`, `{{refn}}`, `{{efn}}` and `{{dead url}}` are stripped from the outlet and
  firm cells. Outlet and firm names are normalised as in §6.3.
- **Sources.** The 14 pages were fetched on 2026-10-23 with a generic User-Agent (`israelielection-backtest/1.0`)
  via `index.php?action=raw`. They are saved in the scratchpad, not the repo:
  `/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/D1/wiki/`.
  The twelve pages build-data.py read have the same sha256 prefixes as its README records, so Wikipedia had not
  changed them since round 1.

| Election | Polling page (sha256 prefix) | Article: result and agreements (sha256 prefix) |
|---|---|---|
| 2013-01-22 | [Opinion polling for the 2013 Israeli legislative election](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2013_Israeli_legislative_election) `a286a9b8bbd2689d` | [2013 Israeli legislative election](https://en.wikipedia.org/wiki/2013_Israeli_legislative_election) `d833fcd645a7e43b` |
| 2015-03-17 | …2015… `ab41f2559bd49029` | `5ae9c1b71ae7c278` |
| 2019-04-09 | …April 2019… `5ad4144f898569c2` | `df98ebdd11b8605f` |
| 2019-09-17 | …September 2019… `303e7d3cc02dca07` | `86a2cc64440b1085` |
| 2020-03-02 | …2020… `3994416bcbce56bd` | `0027f0f41feb9e54` |
| 2021-03-23 | …2021… `924535324e5db1ff` | `0bacaa6e5dc951d4` |
| 2022-11-01 | …2022… `392c1f1f73441d86` | `ec5dc9da6f2be8d6` |

**Tables read** (index among the page's tables; period):

| Election | Tables |
|---|---|
| 2013 | one table, Jan 2011 – 18 Jan 2013. The page has no polls from 2009–10. |
| 2015 | one table, 28 Nov 2013 – 13 Mar 2015. The page starts there. |
| Apr 2019 | four campaign tables: 21 Feb–5 Apr 2019, 8 Jan–20 Feb, 1–8 Jan and 14 Nov–30 Dec 2018. Plus the "20th Knesset" table, 30 Nov 2015 – 25 Oct 2018. |
| Sep 2019 | six tables, 26 May – 13 Sep 2019 |
| 2020 | five tables, 6 Oct 2019 – 28 Feb 2020 |
| 2021 | eight tables, 12 Mar 2020 – 19 Mar 2021 |
| 2022 | six tables, 5 Apr 2021 – 28 Oct 2022 |

## 2. Counts

| Election | Polls | Since dissolution | First poll | Outlets | Firms | Outlet×firm pairs | No firm printed | Filber | With a combined cell | Seats ≠ 120 |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|
| 2013-01 | 102 | 62 | 2011-01-17 | 27 | 12 | 40 | 10 | 0 | 45 | 43 |
| 2015-03 | 174 | 108 | 2013-11-28 | 30 | 12 | 45 | 21 | 0 | 24 | 20 |
| 2019-04 | 232 | 109 | 2015-11-30 | 37 | 17 | 64 | 13 | 13 | 0 | 17 |
| 2019-09 | 68 | 66 | 2019-05-26 | 13 | 12 | 20 | 0 | 4 | 0 | 1 |
| 2020-03 | 80 | 60 | 2019-10-06 | 12 | 8 | 20 | 0 | 6 | 7 | 1 |
| 2021-03 | 169 | 74 | 2020-03-12 | 18 | 9 | 22 | 0 | 18 | 10 | 1 |
| 2022-11 | 156 | 94 | 2021-04-05 | 16 | 7 | 18 | 0 | 25 | 0 | 4 |
| **All** | **981** | **573** | | | | | 44 | 66 | 86 | 87 |

Coverage is uneven before the dissolution. Wikipedia lists few polls from 2011, 2016 and 2017, and the 20th-Knesset
table (2015–18) prints only the parties of the time. For trend or house-effect work, the period after `dissolved` is
the dense part of every file.

## 3. Lists that changed during the campaign (`otherLists`)

**Rule.** A column gets the final list's id when it is that list under the same name and substantially the same
composition. A party that later merged into a final list gets an id `<final>_<party>` with `into: <final>`, for
example `zu_labor`, `bw_hosen` or `yamina_nr`. A party that split, withdrew or ran in no final list gets a plain id
with `into: null`, for example `zu` (Apr 2019), `jl4`, `telem` or `zs`. Two cases are handled specially:

- A cell spanning several columns whose parties all go `into` one final list is that list. For example, 2015
  cells spanning Labor and Hatnuah are `zu`.
- A cell spanning parties of different lists is a `combined` cell, as in the 28-day files. Examples are 2013's
  Ra'am–Ta'al + Hadash + Balad cell and 2015's Likud + Yisrael Beiteinu cells before July 2014.

Each file lists only the ids it uses, with names that say what they cover.

Judgment calls a consumer should know:

- **2013.** `likud` and `jh` are the merged lists. Polls before 25 Oct 2012 split Likud and Yisrael Beiteinu
  (`likud_likud`, `likud_yb`), and polls before the Jewish Home–National Union joint list split those two
  (`jh_jh`, `jh_nu`). 45 polls print the three Arab lists as one cell (`combined`).
- **2015.** Some pollsters lumped the three Arab parties into one cell before the Joint List formed (Jan 2015).
  Those cells resolve to `jl`, because all three components go into `jl`. So `jl` before 22 Jan 2015 means "the
  Arab parties together" (36 polls).
- **Apr 2019.** Several pre-merger columns are kept under their own ids: the pre-2019 Zionist Union (`zu`), the
  Joint List before its split (`jl`; without Ta'al in the Jan–Feb table where Ta'al has its own column), Yesh Atid
  (`bw_ya`), Israel Resilience (`bw_hosen`) and the Jewish Home before URWP (`urwp_jh`). `urwp_jh` includes Bennett
  and Shaked until 29 Dec 2018. The 2015–18 "Orly Levy" column is `gesher`.
- **2021.** Three same-named columns changed composition and get separate ids:
  - `bw2020`: Blue and White before the March 2020 split, at 33 seats, against the final `bw` at 8.
  - `jl4`: the Joint List with Ra'am, until 28 Jan 2021.
  - `yamina2020`: Yamina with Smotrich, until Jan 2021.

  "Yesh Atid–Telem" (Mar 2020 – Jan 2021) is kept as `ya`, because Telem polled at zero.
- **2022.**
  - `yamina` is Bennett's Yamina (to Jul 2022), and `zs` is Shaked's Yamina / Zionist Spirit (Jul–Sep 2022); neither
    is mapped into `jh`.
  - `jl` is the Hadash–Ta'al–Balad Joint List before Balad left on 15 Sep 2022.
  - `rz_rz` is the column Wikipedia labels "Religious Zionist" before the Otzma joint list of 26 Aug 2022.
    Its composition in 2021–22 is ambiguous: the 2021 joint slate broke into factions after that election.
- Before the final lists formed, `into` is only a guide. Summing components (Yesh Atid + Israel Resilience → Blue and
  White) gives a comparable number. It is not the same list, and new lists polled differently once they existed.

## 4. Polls per pollster per election (for house effects)

Each cell gives all polls in the file, then in parentheses the polls dated on or after the dissolution. ‡n marks an
outlet with n polls by Filber's firms (Direct Polls). Produced by `node scripts/forecast/round2/D1/verify.mjs --table`.

**By outlet** (`pollster`; one-per-pollster selection uses this):

| Pollster (outlet) | 2013-01 | 2015-03 | 2019-04 | 2019-09 | 2020-03 | 2021-03 | 2022-11 | All |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 103fm |  |  | 7 (6) | 7 (7) | 8 (5) | 32 (13) | 7 (2) | 61 |
| 103fm/Maariv |  |  |  | 4 (4) |  |  |  | 4 |
| Arutz Sheva ‡5 |  | 1 (1) |  | 1 (1) | 4 (4) | 2 (0) |  | 8 |
| Bchardei chadrim |  | 1 (0) |  |  |  |  |  | 1 |
| Bizportal |  | 1 (1) |  |  |  |  |  | 1 |
| Channel 1 | 1 (1) | 12 (9) | 5 (0) |  |  |  |  | 18 |
| Channel 10 | 6 (4) | 14 (10) | 9 (1) |  |  |  |  | 29 |
| Channel 12 |  |  | 15 (14) | 12 (12) | 14 (10) | 33 (16) | 28 (15) | 102 |
| Channel 13 ‡2 |  |  | 14 (13) | 11 (11) | 12 (8) | 26 (11) | 24 (14) | 87 |
| Channel 14 ‡21 |  |  |  |  |  |  | 25 (16) | 25 |
| Channel 2 | 8 (7) | 13 (10) | 8 (0) |  |  |  |  | 29 |
| Channel 20 ‡1 |  |  | 5 (2) |  | 1 (1) | 5 (4) |  | 11 |
| Channel 22 |  |  | 1 (0) |  |  |  |  | 1 |
| Dahaf | 2 (0) |  |  |  |  |  |  | 2 |
| Dialog | 1 (1) |  |  |  |  |  |  | 1 |
| Direct Polls ‡16 |  |  |  |  |  | 12 (3) | 4 (0) | 16 |
| Galei Israel |  | 2 (1) |  |  |  |  | 8 (2) | 10 |
| Galei Tzahal |  | 2 (2) | 3 (2) |  |  |  | 2 (2) | 7 |
| Geocartography | 3 (1) | 8 (6) | 9 (0) |  |  |  |  | 20 |
| Globes | 10 (3) | 13 (5) | 1 (0) |  |  |  |  | 24 |
| Haaretz | 13 (6) | 9 (5) | 4 (3) |  |  |  |  | 26 |
| HOT |  |  |  | 1 (1) |  |  |  | 1 |
| i24 News |  |  |  |  |  | 1 (0) |  | 1 |
| Ice ‡1 |  |  |  |  |  | 1 (0) |  | 1 |
| Israel Hayom ‡2 | 4 (3) | 2 (1) | 17 (12) | 8 (8) | 10 (7) | 9 (5) | 8 (3) | 58 |
| Jerusalem Net |  |  |  |  |  |  | 1 (1) | 1 |
| Jerusalem Post | 4 (3) | 1 (1) | 6 (3) |  |  | 3 (1) | 1 (0) | 15 |
| Jerusalem Post & Globes | 1 (1) |  |  |  |  |  |  | 1 |
| Kan 11 ‡6 |  |  | 14 (13) | 7 (7) | 9 (8) | 10 (6) | 16 (13) | 56 |
| Kan Radio |  |  |  |  | 1 (0) |  |  | 1 |
| Kikar HaShabbat |  |  |  |  |  |  | 1 (0) | 1 |
| Knesset Channel | 7 (6) | 40 (13) | 1 (0) | 2 (2) |  | 1 (0) |  | 51 |
| Kol Bramah Radio |  | 2 (2) | 1 (0) |  |  |  |  | 3 |
| Kol Chai |  |  | 1 (0) |  |  |  |  | 1 |
| Labor (party) |  |  | 1 (1) |  |  |  |  | 1 |
| Maagar Mochot | 5 (1) |  | 3 (0) |  |  |  |  | 8 |
| Maariv | 9 (5) | 11 (10) | 19 (8) | 5 (4) | 8 (7) | 28 (13) | 22 (19) | 102 |
| Maariv & The Jerusalem Post |  |  |  |  | 1 (1) |  |  | 1 |
| Maariv-Jerusalem Post |  | 3 (2) |  |  |  |  |  | 3 |
| Mako | 2 (2) |  |  |  |  | 1 (1) |  | 3 |
| Mako & Channel 2 | 1 (1) |  |  |  |  |  |  | 1 |
| Mako/Knesset Channel |  |  |  |  |  |  | 7 (7) | 7 |
| Makor Rishon ‡10 |  |  | 9 (6) | 3 (2) | 4 (4) | 1 (0) |  | 17 |
| Miskar |  |  | 4 (4) |  |  |  |  | 4 |
| Nana 10 |  | 1 (1) |  |  |  |  |  | 1 |
| New Wave | 1 (0) |  |  |  |  |  |  | 1 |
| News Company |  |  | 15 (1) |  |  |  |  | 15 |
| News1 & Reshet Bet | 1 (1) |  |  |  |  |  |  | 1 |
| NRG |  | 6 (3) |  |  |  |  |  | 6 |
| Panels Politics | 2 (1) | 3 (2) | 5 (0) |  |  |  |  | 10 |
| Reshet Bet ‡1 | 5 (5) | 8 (8) | 5 (1) | 1 (1) |  |  |  | 19 |
| Reshet Moreshet |  |  | 1 (0) |  |  |  |  | 1 |
| Saloona |  |  | 1 (1) |  |  |  |  | 1 |
| Smith |  | 2 (0) |  |  |  | 2 (0) | 1 (0) | 5 |
| Srugim ‡1 |  |  | 1 (1) |  |  | 1 (0) | 1 (0) | 3 |
| Teleseker | 2 (0) | 1 (1) |  |  |  |  |  | 3 |
| Ten News |  |  | 13 (0) |  |  |  |  | 13 |
| Times of Israel | 1 (1) | 2 (1) | 1 (1) |  |  |  |  | 4 |
| TNS | 1 (0) |  |  |  |  |  |  | 1 |
| Walla | 3 (3) | 13 (10) | 25 (10) | 6 (6) | 8 (5) | 1 (1) |  | 56 |
| Walla-Maariv |  | 1 (1) |  |  |  |  |  | 1 |
| Yedioth Ahronoth | 7 (5) | 2 (2) | 7 (5) |  |  |  |  | 16 |
| Yisrael Beiteinu (party) |  |  | 1 (1) |  |  |  |  | 1 |
| Yisrael Post & Sof Hashavua | 1 (1) |  |  |  |  |  |  | 1 |
| Ynet | 1 (0) |  |  |  |  |  |  | 1 |
| **All** | 102 (62) | 174 (108) | 232 (109) | 68 (66) | 80 (60) | 169 (74) | 156 (94) | 981 |


**By firm** (`firm`; spelling variants merged, lineages not; (none) = no firm printed):

| Firm | 2013-01 | 2015-03 | 2019-04 | 2019-09 | 2020-03 | 2021-03 | 2022-11 | All |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| (none) | 10 (6) | 21 (19) | 13 (1) |  |  |  |  | 44 |
| 202 Strategies |  | 1 (1) |  |  |  |  |  | 1 |
| Camil Fuchs |  |  |  |  |  | 26 (11) | 24 (14) | 50 |
| Dahaf | 12 (8) | 1 (0) |  |  |  |  |  | 13 |
| Dialog | 18 (10) | 11 (6) | 5 (3) | 1 (1) |  |  |  | 35 |
| Direct Polls |  |  | 13 (13) | 4 (3) | 6 (6) | 18 (3) | 25 (16) | 66 |
| Geocartography | 5 (3) | 9 (7) | 19 (0) |  |  | 2 (0) |  | 35 |
| Kantar |  |  |  | 8 (8) | 10 (8) | 10 (6) | 16 (13) | 44 |
| Maagar Mochot | 12 (7) | 9 (3) | 26 (19) | 10 (10) | 14 (8) | 23 (9) | 15 (4) | 109 |
| Midgam | 3 (3) | 16 (11) | 34 (14) | 16 (16) | 22 (16) | 7 (0) | 30 (17) | 128 |
| Midgam/iPanel |  |  | 10 (7) | 2 (2) |  | 26 (16) |  | 38 |
| Miskar |  |  | 5 (5) |  |  |  |  | 5 |
| New Wave | 5 (3) | 1 (0) |  |  |  |  |  | 6 |
| Number 10 Strategies |  |  | 1 (1) |  |  |  |  | 1 |
| Panel Project HaMidgam |  |  | 9 (5) | 8 (8) | 10 (7) |  |  | 27 |
| Panel Project HaMidgam/Statnet |  |  | 19 (7) | 1 (1) | 1 (0) |  |  | 21 |
| Panels Politics | 13 (11) | 60 (29) | 46 (18) | 5 (4) | 12 (11) | 51 (27) | 36 (28) | 223 |
| Sarid | 3 (2) | 1 (1) | 2 (1) |  |  |  |  | 6 |
| Shvakim Panorama |  |  | 1 (1) | 1 (1) |  |  |  | 2 |
| Smith | 11 (5) | 21 (11) | 18 (7) | 11 (11) | 5 (4) | 6 (2) | 10 (2) | 82 |
| Statnet |  |  | 1 (0) | 1 (1) |  |  |  | 2 |
| Teleseker | 4 (1) | 21 (19) | 2 (1) |  |  |  |  | 27 |
| TNS | 3 (0) |  | 8 (6) |  |  |  |  | 11 |
| TNS-Teleseker | 3 (3) |  |  |  |  |  |  | 3 |
| TRI |  | 2 (1) |  |  |  |  |  | 2 |


## 5. Verification

`node scripts/forecast/round2/D1/verify.mjs` ends "All checks passed." Its findings:

1. **28-day polls.** All 199 polls in the six `data/<key>.json` files are in the full files with identical
   `results` and `combined`: 2015 43/43, Apr 2019 37/37, Sep 2019 28/28, 2020 29/29, 2021 30/30 and 2022 32/32.
   - The full files have exactly the same number of polls in each 28-day window. No poll is gained or lost there,
     even though the full build expands rowspans, drops scenario rows and infers years.
   - `id`, `pollster`, `published`, `fieldwork`, `filber`, `note` and `n` are unchanged on all 199.
   - `firm` differs on 29, all spelling: "Maagar Mohot" → "Maagar Mochot" (16), "Panels" → "Panels Politics" (9),
     "KANTAR" → "Kantar" (4).
   - `lists`, `blocs`, `blocNote`, `agreements`, `result`, `sources`, `threshold` and `election` equal the 28-day
     files' in all six elections.
2. **Counts** per election, pollster and firm: §2 and §4.
3. **Seats from votes.** `makeAllocator(ids, agreements, threshold)` from `scripts/forecast/backtest/model.mjs`,
   given each list's result share, reproduces every official seat count in all seven elections. That covers 2013
   at the 2% threshold: Likud Yisrael Beiteinu 31, Yesh Atid 19, Labor 15, Jewish Home 12, Shas 11, UTJ 7,
   Hatnuah 6, Meretz 6, Ra'am–Ta'al 4, Hadash 4, Balad 3, Kadima 2; Otzma LeYisrael and Am Shalem 0.
   - In 2013 the six agreements move no seat; without them the allocation is the same. In the other elections they
     move one seat each: 2015 Joint List/Kulanu, Apr 2019 Likud/UTJ, 2021 Likud/Meretz, 2022 Likud/Labor.
   - 2013 valid votes (3,792,742) equal the Central Elections Committee's total.
4. **Ids.** Every id used in a poll is in `lists` or `otherLists`. Poll ids are unique, and polls are sorted newest
   first.
5. **Spot checks against the wikitext.** I compared rows by hand with the raw cells. All matched:
   - 2013, Oct 2012: merged and unmerged Likud; the three Arab lists in one cell.
   - 2015, 20 Jan 2015: the inline scenario row, now dropped.
   - Sep 2019, 30 May 2019 (Maariv/Panels): pre-merger columns.
   - 2020, 2 Jan 2020 (Kan/Kantar): one cell spanning URWP's three columns.
   - 2021, 2 Feb 2021 (Walla/Panels): the Joint List, Ta'al and Ra'am in one cell, `combined` 10.
   - 2022, 24 Aug 2022 (Channel 14/Direct Polls): Religious Zionism and Otzma in one cell → `rz` 10, sum 119 as
     printed.
6. **Harness unaffected.** `node scripts/forecast/backtest/v2.mjs 2000` still runs in about 10 s. Version 2's
   per-list error is 1.36, and the per-election values are the brief's (1.64 2.86 0.80 0.67 1.29 0.92). Nothing
   the harness reads was changed.

## 6. Caveats

**6.1 Dates.**
- `published` is the last date in Wikipedia's date cell, as in the 28-day files. `fieldwork` is the cell as
  printed, with the year Wikipedia left out still left out.
- Years for undated rows are inferred (§1).
- One trap is fixed: the Apr 2019 table's own "16 Apr" election-results row had sent every later undated row back a
  year. The inference now starts two weeks after the vote and ignores rows dated after it. The check is that no
  row is out of order.
- Event rows give the dissolution dates used for `dissolved`. 2013 uses 15 Oct 2012, the day the Knesset passed
  the dissolution law; the polling table itself has no event row for it.

**6.2 Missing versus zero.**
- Blank cells and `N/A` are "not reported": the list is absent from `results`. `0`, `–` and `(x%)` mean below the
  threshold, as in the 28-day files.
- Two consequences:
  - Early-campaign tables omit small parties, and 2013 pollsters often left Otzma LeYisrael, Am Shalem or Kadima
    blank. A missing list is unknown, not zero, which is why seats sum to under 120 in many 2013 polls.
  - Wikipedia's `–` also appears for a party in a column before the party was launched (for example some `zehut`
    and `likud_gesher` cells). The data cannot tell that apart from a below-threshold reading.
- Folding a lone below-threshold component into its final list (`load.mjs`, `mapInto`) therefore says the final
  list was below the threshold. That can be false (Otzma alone in 2014 → "Yachad below").
- A below-threshold cell spanning several lists has no slot in the schema, because `combined` holds seats only. Such
  cells are dropped, as build-data.py does: 5 cells, all in 2020, for example Kan's 2 Jan 2020 "(3%)" across National
  Union, Jewish Home and Otzma.

**6.3 Outlet and firm names.**
- `pollster` is the outlet, as before. Name changes:
  - build-data.py's `ALIASES` are applied unchanged.
  - `POLLSTER_NORM` merges further spelling variants only, for example "Walla! News"/"Walla News" → Walla,
    "Yediot"/"Yedioth Ahronot" → Yedioth Ahronoth, "JPost"/"The Jerusalem Post" → Jerusalem Post and
    "Arutz 7" → Arutz Sheva.
  - "Radio 103FM & Maariv" → Maariv, following build-data.py's own "103fm & Maariv" → Maariv.
  - A firm publishing alone is named as its firm, for example "Panels" → Panels Politics.
- **Co-publications keep their own labels**, as build-data.py intends. 2019-09's 28-day file calls Smith's joint
  103fm and Maariv series "103fm/Maariv" (4 polls), separately from 103fm and from Maariv, and that name is kept so
  the 28-day polls are unchanged. Other such labels: "Maariv-Jerusalem Post" (2015), "Maariv & The Jerusalem Post"
  (2020), "Walla-Maariv" (2015), "Mako/Knesset Channel" (2022), and four 2013 joint labels. A house-effect model may
  want to merge them by firm.
- **Lineages are not merged.** Each of these is one newsroom or firm under successive names; merging them is a
  modelling choice left to agent A:
  - Channel 2 → News Company (Nov 2017 – early 2019; Channel 2 News after the split) → Channel 12.
  - Channel 10 → Ten News → Channel 13.
  - Channel 1 → Kan 11 (2017).
  - Reshet Bet (Israel Radio) and "Kan Radio" (one 2020 poll).
  - Channel 20 → Channel 14 (renamed 2021).
  - Firms: Teleseker → TNS-Teleseker → TNS → Kantar.
  - Midgam, "Midgam/iPanel" and "Panel Project HaMidgam" (with Statnet, for Channels 10 and 13).
- **One outlet, several firms.**
  - Channel 13 used Panel Project HaMidgam, then Camil Fuchs (2021–22), plus one Direct Polls poll each in Sep 2019
    and 2020. Those two are `filber: true` under pollster "Channel 13".
  - Israel Hayom used Maagar Mochot (and Direct Polls twice, in 2020 and 2021). Channel 14 used Direct Polls and
    Maagar Mochot. Channel 12 used Midgam and sometimes Panels Politics (4 polls in Apr 2019, 1 in 2020). Two
    Channel 12 polls share 31 Mar 2019, and the second has id suffix "b".
  - **Estimate house effects by firm where an outlet switched firms.** The pollster name alone mixes methods.
- **Firm/outlet splits in one-column labels.** 2013 prints "Outlet/Firm"; 2015 and April 2019 mostly print
  "Firm/Outlet", but 2015 sometimes reverses it ("Channel 2/Dahaf", "Haaretz/Dialog").
  - The outlet slot uses build-data.py's `split_label` unchanged, so the 28-day pollsters stay as they were.
  - The order is swapped when the outlet slot holds a known firm, and the firm keeps only its firm parts
    ("Maagar Mochot/i24 News" → Maagar Mochot).
  - 44 polls print an outlet with no firm (2013 10, 2015 21, Apr 2019 13), so their `firm` is null.
  - `LABEL_FIX` corrects five labels by hand. One of them, 2 Dec 2016 "Midgam/iPanel", printed no outlet; Channel 2
    is taken from the cited article's title.
- **Two party-commissioned polls** (Labor, Feb 2018; Yisrael Beiteinu, Jan 2018) are kept and labelled
  "Labor (party)" and "Yisrael Beiteinu (party)". `load.mjs` drops them by default.

**6.4 Seat sums.** 87 polls do not sum to 120 and carry a note:
- 2013: 43, mostly blank small lists.
- 2015: 20.
- Apr 2019: 17. These include Miskar's polls, which Wikipedia footnotes as "before redistribution of surplus votes"
  (87–110 seats).
- Sep 2019, 2020 and 2021: 1 each.
- 2022: 4.

These are as printed. The forecast's share conversion (seats/120) will understate lists in them; normalise if you
use them.

**6.5 Not in the data.**
- Sample sizes, undecided shares and exact fieldwork spans: Wikipedia prints none.
- Polls Wikipedia does not list. Hebrew Wikipedia and the CEC's poll filings list more and were not used.
- Polls in Wikipedia's separate scenario tables.

Coverage before the dissolution is thin and uneven: 2016–17 has a few polls a month, 2011 a handful.

**6.6 Judgments that could reasonably go the other way.**
- 2013 blocs: Yesh Atid 'mid' rather than 'opp'. The 'net' total is unchanged either way.
- The composition-based ids in §3, especially `rz_rz` in 2021–22 and keeping Yesh Atid–Telem as `ya`.
- Treating 2015 lumped Arab cells as `jl` before the Joint List existed.
- Keeping the first of several rowspanned scenario rows rather than none.

## Recommendation (for the consumers: A, D, E)

Data only; no model parameter is proposed, so there is no backtest row.

1. **House effects (A).** Use `scripts/forecast/round2/D1/load.mjs`:
   `loadFull(key, { since: "dissolved", mapInto: true, finalOnly: true })` gives polls that report the final lists
   only: 62, 108, 63, 20, 43, 44 and 49 polls from 2013 to 2022. Measure each poll against the contemporaneous field
   (other pollsters within ±7 days), not against the result. That separates the house effect from the campaign
   trend and the final miss.
   - Key the effect by `firm`, falling back to `pollster` when `firm` is null.
   - Shrink toward zero by the counts in §4. Most firms have under 20 post-dissolution polls in any one election.
   - Without `finalOnly`, the 2019-09 sample rises from 20 to 66 polls, because Zehut stays in the polls until its
     29 Aug withdrawal. Folding or dropping `zehut` recovers them.
2. **Blackout and final-week moves (D).** Every file ends with the last pre-ban poll of each outlet. The newest poll
   in every file is dated the Friday before the vote, when the publication ban starts. Moves from the last polls to `result` can be computed per list and
   per firm directly.
3. **Trend model (E).** Use `mapInto: true` and the full window. Treat pre-merger sums as noisier observations of the
   final list, and do not start a list's trend before its own launch.
4. **2013** has a 2% threshold and is outside the six-election yardstick (brief, decision 1). Use it only as training
   history for house effects and swing, never as a scored election.

## Files

- `scripts/forecast/backtest/build-data-full.py`: builder; all judgments (table column maps, `OTHER`, 2013 lists,
  blocs and agreements, name normalisation, `LABEL_FIX`) are written out in it.
- `scripts/forecast/backtest/data-full/{2013-01,2015-03,2019-04,2019-09,2020-03,2021-03,2022-11}.json`: the data.
- `scripts/forecast/round2/D1/verify.mjs`: checks 1–4 and the §4 tables.
- `scripts/forecast/round2/D1/load.mjs`: loader with `since`, `mapInto`, `finalOnly`, `dropParty`.
- Scratchpad, not committed: wikitext in `/tmp/claude-0/-home-user-israelielection/1c47de2c-4301-5626-a66e-0e6b41aef474/scratchpad/D1/wiki/`
  and the build log `…/scratchpad/D1/build.log`, which lists every row skipped and why.
