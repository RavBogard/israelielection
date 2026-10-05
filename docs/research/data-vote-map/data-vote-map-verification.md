# Verification — vote map data brief

Checked 2026-10-05. Every URL in `data-vote-map-sources.json` that is marked verified:true was re-downloaded with curl (browser user agent where needed) and its contents inspected. The sample files were re-checked against a fresh copy of the CEC 2022 file.

## Sources: do they resolve and match the described format?

| Source | Status | What was found |
|---|---|---|
| CEC `expc.csv`, media21–25 | CONFIRMED | All return 200; byte sizes match the JSON exactly (150,776 / 125,654 / 120,101 / 145,731 / 154,331). Encoding: cp1255 for 21–24, UTF-8 with BOM for 25. Rows 1,214 / 1,214 / 1,214 / 1,215 / 1,216. 2019a has no `סמל ועדה` column; envelope code 99999 (2019a) vs 9999 (later). Last-Modified: 2019-04-17, 2021-03-30, **2022-11-08** |
| CEC `expb.csv` (media25) | CONFIRMED | 200, 1,746,531 bytes |
| CEC national results page (votes25) | CONFIRMED | 200. The scraped party table (`party-letters-k21-k25.json`) matches the locality-file column sums **exactly for every list in all five elections** (184 lists). Spot-check: Likud 2022 = 1,115,336; Balad 2022 = 138,617 |
| media26 test file | CONFIRMED | 200, 2,152 bytes, Last-Modified 29 Jul 2025, `cache-control: max-age=60`, UTF-8 BOM, the same 47-column header as 2022, first row "רמת רחל", 16 data rows. votes26 returns 404 |
| data.gov.il `votes-knesset` | CONFIRMED | CKAN package licence "Other (Open)", 17 resources. datastore resource b392b8ee… returns 2022 records (first row matches the CEC file) |
| CBS `bycode2023.xlsx` | CONFIRMED | 200, XLSX, 1,484 localities; columns include code, Hebrew name, English transliteration (`תעתיק`, e.g. "SHAHAR"), district and 2023 population |
| Ministry of Transport `accid_muni.zip` | CONFIRMED | 200, 16.0 MB shapefile ZIP; **1,174 features**; Israel TM Grid (EPSG:2039); `CITYCODE` field; the whole West Bank is one feature, `CITYCODE 9999` "יהודה ושומרון"; `YEARMONTH 202606` |
| CBS 2008 statistical areas `50400-2008.7z` | CONFIRMED | 200, 3.3 MB 7z; shapefile with **3,071 features**, `SEMEL_YISH` locality code field, cp1255 |
| CBS 2022 `statistical_areas_2022.gdb.zip` | UNVERIFIED (as the JSON says) | CBS refuses connections from here |
| IdanTravitsky/israel-votes | UNREACHABLE here | The GitHub API is blocked for this session (repo not attached). License not checked |
| GovMap election map | CONFIRMED | 200 (closed app; reference only) |

## Claims in the brief

| Claim | Status | What the source / data actually shows |
|---|---|---|
| Party columns add up exactly to national totals | CONFIRMED | 0 mismatches in 184 lists across 5 elections. In every row of every file, the party sum equals the valid votes |
| 1,214 of 1,216 2022 rows join to CBS localities; exceptions Hebron and the envelope row | CONFIRMED | Only codes 3400 (Hebron) and 9999 are absent from bycode2023 |
| Envelope votes 9.6% in 2022 (458,714), up from 5.5% in Apr 2019; coverage table 5.54 / 6.32 / 7.14 / 9.56 / 9.63 | CONFIRMED | Recomputed from the CEC files: 238,822 / 280,216 / 327,702 / 421,619 / 458,714 |
| Only 0.49% of 2022 votes without a polygon | CONFIRMED | 36 localities with geom=null hold 0.49% of valid votes; 35 of them have a point |
| "Prototype joins 2022 results to boundaries for 1,215 localities" | MISMATCH (wording) | The sample has 1,215 localities, but only **1,179 have polygons** (1,051 Transport + 128 CBS 2008). The other 36 are points or unmapped. Say "1,215 localities, 1,179 with polygons" |
| Join trap: Transport codes the West Bank 9999 = CEC envelope code | CONFIRMED | Both seen directly |
| Ballot letters move (פה = B&W 2019–20, Yesh Atid 2021–22; כן = Gantz) | CONFIRMED | Party table and recomputation (Druze/Ethiopian checks used these mappings and reproduced published figures) |
| Map ~330 KB, ~85 KB per election (gzipped); localities 412 KB / 84 KB; TopoJSON 1.0 MB / 326 KB | CONFIRMED | 412,033 → 83,874 gzipped; 1,035,393 → 326,031 gzipped. TopoJSON object "merged" has 1,370 geometries |
| Haifa: 9.3% for the Arab lists | CONFIRMED | Hadash-Ta'al + Balad + Ra'am = 9.3% in 2022 |
| Final 2022 files posted Nov 8, a week after the vote | CONFIRMED | Last-Modified 8 Nov 2022 15:03 GMT. This is the last modification, so it does not by itself show whether the file updated during the count (the brief already flags this) |
| 2026 set up the same way; 60-second cache | CONFIRMED | See media26 above |
| Pipeline step 1: cp1255 for 2019a–2021, UTF-8 for 2022 | CONFIRMED | — |
| Pipeline step 4: envelope row 9999 / 99999 | CONFIRMED | — |

## Sample sanity check (`samples/localities-2022.sample.json`)
- 1,216 records. **Party votes sum to the stated valid-vote total in all 1,216** (not just a few). voted − invalid = valid in all.
- Every record matches the fresh CEC 2022 file exactly (valid votes and every party count): 0 differences.
- Spot rows: Abu Juway'ad 540 = 540; Abu Ghosh 2,769 = 2,769; Abu Sinan 5,382 = 5,382; Haifa 139,764 = 139,764; Rahat 23,024 = 23,024.

## Must fix before the brief goes to Daniel
1. "Joins 2022 results to boundaries for 1,215 localities" → "1,215 localities; 1,179 with polygons, 35 as points."

## Cannot verify from this session
- CBS 2022 statistical-areas geodatabase: whether it downloads, and its licence.
- The IdanTravitsky repo's licence and README (GitHub not attached).
- data.gov.il terms page for the CBS 2008 layer's licence.
- Whether the 2022 CSV updated live on election night.
