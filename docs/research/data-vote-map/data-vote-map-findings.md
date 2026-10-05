# Vote map: data feasibility — full findings

Researched 2026-10-05. Everything marked "checked" was downloaded or opened from this session and its structure confirmed by script. Anything not checked is marked as such.

Bottom line: **feasible.** The Central Elections Committee (CEC) publishes clean per-locality CSVs for every election we need. The rows carry the same locality codes the Central Bureau of Statistics (CBS) uses. Two free boundary layers, used together, cover 99.5% of the votes that can be placed on a map. A working prototype was built in this session: 1,215 localities joined, a TopoJSON of about 1.0 MB (330 KB gzipped), and a 2022 data file of 412 KB (84 KB gzipped).

---

## 1. CEC results by locality, 2019a–2022

### Where the files are

Each election has its own results site, and each site links two CSVs on a matching `media` host:

| Election | Knesset | Results site | By locality | By polling station (kalpi) |
|---|---|---|---|---|
| Apr 9, 2019 | 21 | https://votes21.bechirot.gov.il/ | https://media21.bechirot.gov.il/files/expc.csv | https://media21.bechirot.gov.il/files/expb.csv |
| Sep 17, 2019 | 22 | https://votes22.bechirot.gov.il/ | https://media22.bechirot.gov.il/files/expc.csv | https://media22.bechirot.gov.il/files/expb.csv |
| Mar 2, 2020 | 23 | https://votes23.bechirot.gov.il/ | https://media23.bechirot.gov.il/files/expc.csv | https://media23.bechirot.gov.il/files/expb.csv |
| Mar 23, 2021 | 24 | https://votes24.bechirot.gov.il/ | https://media24.bechirot.gov.il/files/expc.csv | https://media24.bechirot.gov.il/files/expb.csv |
| Nov 1, 2022 | 25 | https://votes25.bechirot.gov.il/ | https://media25.bechirot.gov.il/files/expc.csv | https://media25.bechirot.gov.il/files/expb.csv |

All ten files were downloaded (HTTP 200). The links come from the "תוצאות לפי ישובים / לפי קלפיות" buttons on each results home page (checked on votes25). The same files are mirrored on the government data portal as dataset `votes-knesset`, "תוצאות בחירות - ועדת הבחירות המרכזית לכנסת", license "Other (Open)", which has elections 16–25 (https://data.gov.il/dataset/votes-knesset; API: https://data.gov.il/api/3/action/package_show?id=votes-knesset). The data.gov.il copy of the 2022 locality file is byte-identical to the CEC copy (154,331 bytes). The portal also serves the rows as JSON through its CKAN datastore API (checked: `https://data.gov.il/api/3/action/datastore_search?resource_id=b392b8ee-ba45-4ea0-bfed-f03a1a36e99c` returns 1,216 records with Hebrew field names).

### Format (checked)

- **Encoding:** 2019a–2021 files are Windows-1255 (Hebrew code page; `file` reports "ISO-8859"). The 2022 files are UTF-8 with a byte-order mark. A script has to set the encoding per election.
- **Header row:** Hebrew. Locality files (`expc`) have: `סמל ועדה` (regional elections committee number; missing in 2019a), `שם ישוב` (locality name), `סמל ישוב` (locality code), `בזב` (registered voters), `מצביעים` (votes cast), `פסולים` (invalid), `כשרים` (valid). After these, one column per party list, headed by its ballot letters (e.g. `מחל`, `פה`, `שס`). Polling-station files (`expb`) add `ברזל` (a ballot-box serial number), `קלפי` (box number, which can be a decimal like `3.1`), `ריכוז` and `שופט`.
- **Trailing comma:** 2020 and 2021 headers end with a comma, which creates an empty last column. Drop it.
- **Name spelling changes:** from 2020 on, the CEC strips punctuation from names ("אבו גווייעד שבט", where the 2019 file and CBS have "אבו ג'ווייעד (שבט)"; Tel Aviv appears as "תל אביב  יפו" with a double space). **Join on the code, never on the name.**

Size and row counts (checked):

| Election | expc rows | expc size | expb rows | expb size |
|---|---|---|---|---|
| 2019a | 1,214 | 151 KB | 10,765 | 1.35 MB |
| 2019b | 1,214 | 126 KB | 10,901 | 1.25 MB |
| 2020 | 1,214 | 120 KB | 11,179 | 1.24 MB |
| 2021 | 1,215 | 146 KB | 12,926 | 1.70 MB |
| 2022 | 1,216 | 154 KB | 12,545 | 1.75 MB |

### Integrity check (2022, checked)

Adding up the party columns of the 2022 locality file gives exactly the national totals printed on the CEC national page, both from `expc` and from `expb`: Likud 1,115,336; Yesh Atid 847,435; Religious Zionism 516,470; National Unity 432,482; Shas 392,964. Valid votes 4,764,742; votes cast 4,794,593; registered 6,788,804 (https://votes25.bechirot.gov.il/nationalresults). So the locality file is complete. It includes the special-envelope votes as one pseudo-locality row (see below).

### Locality or polling station?

Both. The locality file is all the map needs. Polling-station rows hold no address or neighborhood, only a box number, so they can't be mapped below the locality level without a separate address list (see "Stale or missing").

### The special-envelope row

Each locality file has one row named `מעטפות חיצוניות` ("outer envelopes"). It holds votes cast outside the voter's home polling station: soldiers, diplomats, hospital patients, prisoners, polling-station staff, and similar groups. These votes have no locality. Its code is **9999** (2019b–2022) and **99999** (2019a). Its share of valid votes has grown at every election:

| Election | Envelope valid votes | Share of all valid votes |
|---|---|---|
| 2019a | 238,822 | 5.54% |
| 2019b | 280,216 | 6.32% |
| 2020 | 327,702 | 7.14% |
| 2021 | 421,619 | 9.56% |
| 2022 | 458,714 | 9.63% |

(Computed from the expc files. The 2021 jump probably reflects COVID-era special polling stations, but that is not verified here.) **Nearly one vote in ten in 2022 cannot be placed on a map.** The map should say so, keep these votes in the national total, and not share them out across localities. The one existing open-source project that does this (below) handles them the same way.

### Locality codes and the join

The `סמל ישוב` column is the CBS locality code (for example Jerusalem 3000, Tel Aviv-Yafo 5000, Haifa 4000, Beersheba 9000). I joined the 2022 file to the CBS localities file for 2022 (`bycode2022.xlsx`) and to the 2023 file. **1,214 of 1,216 rows matched.** The two that didn't: the envelope row (9999), and Hebron (3400, 215 valid votes in 2022), which the CBS file leaves out but the Population Authority's locality list includes.

Code changes between elections are rare but real. Example: Daliyat al-Karmel (490) and Isfiya (534) are separate localities in the CEC files, but they were briefly merged in the 2008 CBS layer. CBS publishes a change log, `changes-1948-2024.xlsx` (path cited in another project's lockfile; not opened, because CBS blocks this environment).

### Party columns per election

The number of party columns varies with the number of lists that ran: 43 in 2019a, 32 in 2019b, 30 in 2020, 39 in 2021, 40 in 2022. Section 3 covers how the letters map to parties.

---

## 2. 2026: will it be published the same way, and how fast?

- **Same hosts look ready.** `https://media26.bechirot.gov.il/files/expc.csv` already returns a file (checked 2026-10-05: 2,152 bytes, Last-Modified 2025-07-29, UTF-8 with BOM). It has the 2022 column layout and what look like test rows (first row: "רמת רחל"). `expb.csv` returns 3,952 bytes. `votes26.bechirot.gov.il` returns 404 for now. This strongly suggests the 2026 files will appear at the same URLs in the same layout. It doesn't guarantee it: column letters will change to the 2026 lists.
- **Caching:** the media files are served through CloudFront with `cache-control: max-age=60`. A poll every one to five minutes on election night is reasonable.
- **2022 timing:** election Nov 1, 2022. With 86% of the vote counted overnight the right-wing bloc was projected at 65 seats (English Wikipedia, https://en.wikipedia.org/wiki/2022_Israeli_legislative_election). Walla reported the end of the count ("בתום ספירת הקולות", count over, Netanyahu bloc 64, Meretz out) in an article dated Nov 2, 2022, cited on Hebrew Wikipedia (article not opened). Official final results were released Nov 9 and presented to President Herzog (English Wikipedia). The final 2022 files on the CEC server carry Last-Modified **Nov 8, 2022**. The 2021 files carry **Mar 30, 2021**, a week after the Mar 23 vote.
- **Not verified:** whether `expc.csv` was updated live during the 2022 count or only posted once the count ended. The results site itself shows a running "votes entered" ("קולות שהוזנו") count, which implies live updates. The Wayback Machine, which would settle this, is blocked from this environment. The envelope votes are counted last (in 2022 they were roughly 10% of valid votes), so any election-night map will be missing them and will lean toward whatever envelope voters didn't vote for.
- **No public API found** beyond the CSVs and the data.gov.il datastore copy, which in past cycles was posted months later (the 2022 copy is dated 2024-09-25).
- **Official map exists:** the government's GovMap runs an election-results map at https://elections.govmap.gov.il/ (linked from Hebrew Wikipedia as "map with the election results"). It is a closed OpenLayers app fed from GovMap's GeoServer. It has no open license and isn't usable as a data source, but it is a reference for what the official reading looks like.

---

## 3. Party ballot letters (otiyot)

Each list has one to four Hebrew letters (e.g. `מחל` = Likud). These head the CSV columns. The mapping from letters to party name is on each election's national results page, table "שם הרשימה | אותיות הרשימה | מנדטים | ...". I scraped all five into `samples/party-letters-k21-k25.json`: 43, 32, 30, 39 and 40 lists, with Hebrew full name, letters, seats, percent and votes, all checked.

**Letters do not stay with parties across elections**, so a fixed letter-to-party table across years would be wrong:

| Letters | 2019a | 2019b | 2020 | 2021 | 2022 |
|---|---|---|---|---|---|
| מחל | Likud | Likud | Likud | Likud | Likud |
| פה | Blue and White | Blue and White | Blue and White | **Yesh Atid** | Yesh Atid |
| כן | (not used) | (not used) | minor list | **Blue and White (Gantz)** | **National Unity** |
| טב | URWP (Jewish Home + National Union + Otzma) | Yamina | Yamina | (not used) | (not used) |
| ט | (not used) | (not used) | (not used) | Religious Zionism (with Otzma, Noam) | Religious Zionism + Otzma |
| ב | (not used) | (not used) | (not used) | Yamina | Jewish Home (Shaked) |
| שס | Shas | Shas | Shas | Shas | Shas |
| ג | UTJ | UTJ | UTJ | UTJ | UTJ |
| ל | Yisrael Beiteinu | Yisrael Beiteinu | Yisrael Beiteinu | Yisrael Beiteinu | Yisrael Beiteinu |
| אמת | Labor | Labor–Gesher | Labor–Gesher–Meretz | Labor | Labor |
| מרצ | Meretz | Democratic Union | (not used) | Meretz | Meretz |
| ודעם | (not used) | Joint List | Joint List | Joint List (Hadash, Ta'al, Balad) | (not used) |
| ום | Hadash–Ta'al | (not used) | (not used) | (not used) | Hadash–Ta'al |
| דעם | Ra'am–Balad | (not used) | (not used) | (not used) | (not used) |
| עם | (not used) | (not used) | (not used) | Ra'am | Ra'am |
| ד | (not used) | (not used) | (not used) | (not used) | Balad |
| כף / נץ | (not used) | Otzma (כף) | Otzma (נץ) | (not used) | (not used) |
| ת | (not used) | (not used) | (not used) | New Hope | minor list |
| כ / נ / ז / נר | Kulanu / New Right / Zehut / Gesher | — | — | — | — |

Source: https://votes21…votes25.bechirot.gov.il/nationalresults (all opened). The site needs a hand-made `parties-<year>.json` per election mapping letters to an English name, a colour and a class party id. The 2026 letters will be on the CEC candidate-lists page once the lists are approved; I did not compile them.

---

## 4. Boundaries (GIS)

The core problem: Israel has about 1,200 voting localities, but municipal boundaries describe only about 255 municipalities. More than 900 kibbutzim, moshavim and community settlements sit inside regional councils. A municipal-level map would merge them into large rural blobs. We need **locality-level** polygons.

### A. Ministry of Transport "accidents by municipality" layer: checked, best for Israel inside the Green Line and the Golan

- data.gov.il dataset `accidents_municipal`, "תאונות דרכים לפי רשות מוניציפלית", license "Other (Open)". Shapefile ZIP of 16.0 MB, updated 2026-09-03 (`YEARMONTH` 202606): https://data.gov.il/dataset/7ac4505d-dfd8-4ebf-90e5-eefdefd292de/resource/42097396-d215-44eb-b979-509f29873865/download/accid_muni.zip
- Although the name says "municipal," it holds **1,174 polygons at locality level**: 922 are localities inside regional councils, plus 73 cities, 111 local councils and 65 areas with no municipal jurisdiction. Each has `CITYCODE` (the CBS locality code), `CITY`, `MUNICIPAL` (parent council) and `DISTRICT`. Projection: Israel TM Grid (EPSG:2039). Hebrew is UTF-8.
- It covers the whole territory with no gaps: regional-council open land appears as "שטח כללי" (general area) polygons with their own codes.
- **West Bank: not included as localities.** All of Judea and Samaria is a single polygon named "יהודה ושומרון" with **CITYCODE 9999**. That is the same number the CEC uses for envelope votes. A naive join would paint all envelope votes onto the West Bank. This is the most dangerous join trap found.
- Joined against 2022: 164 CEC localities have no polygon here (216,861 valid votes, 4.55%). Almost all are West Bank settlements (Modi'in Illit, Beitar Illit, Ma'ale Adumim, Giv'at Ze'ev, Ariel…) plus registered Bedouin tribes.
- Download note: data.gov.il blocks plain `curl` from this environment unless a browser user-agent is sent. The build script must send one.

### B. CBS statistical areas, 2008 census layer: checked, fills the West Bank

- data.gov.il dataset `statistical-area-2008`, "קובץ השכבה הארצית של האזורים הסטטיסטיים ממפקד 2008". 7-Zip archive of 3.3 MB (shapefile 11 MB, cp1255 Hebrew): https://data.gov.il/dataset/6b729165-dc9c-49b3-afc6-eceabd8fef70/resource/3b88cb58-62cd-43ea-9156-7b81ead557b1/download/50400-2008.7z
- 3,071 polygons; fields `SEMEL_YISH` (locality code), `STAT08`, `Shem_Yishu` (Hebrew name) and `Shem_Yis_1` (English, upper case). Dissolving by `SEMEL_YISH` gives 1,235 locality polygons.
- **Includes West Bank settlements** (checked for Ariel 3570, Ma'ale Adumim 3616, Beitar Illit 3780, Kiryat Arba 3611).
- Terms (from the dataset notes): use is under data.gov.il terms (https://data.gov.il/terms; that page returned 403 here, so the full terms were not read). The layer "is not a reference for reconstructing boundaries of localities" (quoted from the dataset description).
- Weakness: 2008 vintage. It lacks localities founded since then, and some codes have changed since.

### C. Using A and B together (prototype built in this session)

Rule: take the Ministry of Transport polygon wherever one exists; otherwise use the CBS 2008 polygon. Result: 1,370 features (1,173 from Transport, 197 from CBS 2008). Votes that still have no polygon:

| Election | Localities with no polygon | Valid votes with no polygon | Share |
|---|---|---|---|
| 2019a | 34 | 12,017 | 0.28% |
| 2019b | 34 | 17,912 | 0.40% |
| 2020 | 34 | 19,043 | 0.41% |
| 2021 | 33 | 15,418 | 0.35% |
| 2022 | 36 | 23,168 | 0.49% |

The gaps are mostly registered Bedouin tribes in the Negev (codes 939, 956–968, 1169, 1234). Their voters live largely in unrecognized villages that have no boundary. There are also a few newer localities (Sha'ar Shomron 3826, Ganei Modi'in 3823, Bruchin 3744, Rachelim 3822) and Hebron 3400. All but Hebron and the envelope row have a **point** in the CBS localities file, so they can be drawn as dots.

A known flaw of mixing the two: Transport polygons are jurisdiction areas that fill the map, while the CBS 2008 polygons for settlements come from the census layer. West Bank shapes will look different in style from the rest of the map. Using the CBS 2022 layer (D) instead would fix this.

Sizes (checked): merged GeoJSON 67 MB raw. After simplifying with mapshaper and quantizing to TopoJSON: **0.80 MB at 2% simplification, 1.04 MB at 5% (326 KB gzipped), 1.37 MB at 10%.** 5% looked like the right balance for a national view (not checked by eye in a browser).

### D. CBS statistical areas 2022 and localities 2024: probably the best single source, not verified

- Another project's build lockfile (below) records `statistical_areas_2022.gdb.zip` at 8,745,560 bytes and `Localities_2024.gdb.zip` at 76,307 bytes. Both are under `https://www.cbs.gov.il/he/publications/DocLib/2022/קטלוג/1. יישובים וחלוקות גאוגרפיות/`.
- CBS's own site refuses connections from this environment (connection reset). Its GIS page (https://www.cbs.gov.il/he/Pages/geo-layers.aspx), read through a fetch tool, listed only the 2011-based statistical-area layers (2017–2020 editions, catalog 50502). So the 2022 layer's existence, coverage of settlements and license are **verified: false**. Daniel or Code should try the download from a normal browser before choosing.
- If it opens and covers the West Bank, use D alone and drop C.

### E. OpenStreetMap: not suitable for this map

- OSM's Israel project page: `admin_level=8` = "Municipalites (cities), local councils, regional councils" (https://wiki.openstreetmap.org/wiki/WikiProject_Israel). That is municipality level, not locality level, and the page names no CBS-code tag. Live Overpass queries failed from here (406 and timeouts), so the count of OSM features was not verified. OSM's ODbL license also requires attribution and share-alike for derived databases. Not recommended.

### F. GeoJSON already on GitHub

- `idoivri/israel-municipalities-polygons`: "Israel municipalities' geojson polygones," one folder per municipality. The README states no source and no license (opened via fetch). Municipality level only. Not recommended.
- `mattip/population-map`: a static Leaflet map of 2023 CBS population that uses **points** from `bycode2023` coordinates (1,221 localities mapped). No polygons. Useful as a model for the ITM-to-latitude/longitude conversion (opened via fetch).

---

## 5. Existing projects that already did this

- **`IdanTravitsky/israel-votes`**: "Interactive map of Knesset election results per settlement, 1996-2022 – official CEC results on CBS boundaries" (JavaScript, updated 2026-07-15; https://github.com/IdanTravitsky/israel-votes, README and `data/sources.lock.json` opened via fetch). It uses CBS 2022 statistical-area unions plus 2024 reference points. Its electoral index holds 1,274 codes, of which the map covers 1,222. Envelope votes stay in national totals and are not shared out. Hebron (3400) has no geometry. Build: `python scripts/rebuild.py --snapshot` with checksum-locked sources. **This is the closest precedent and is worth reading before Code builds ours.** I did not read its LICENSE terms. Whether its code or data can be reused is open.
- **GovMap official map**: https://elections.govmap.gov.il/ (see section 2). Not reusable.
- **Haaretz / Times of Israel interactive maps**: not checked. The web-search quota for this session ran out before I could search for them. Mako/N12 ran a 2022 results page ("הזירה הפוליטית", https://makospecial.co.il/israel_politics), cited on Hebrew Wikipedia (not opened).

---

## 6. English locality names

- **CBS `bycode` file**, column `שם יישוב באנגלית` (English name), plus `תעתיק` (upper-case transliteration). On data.gov.il as dataset `localities-in-israel`, files for 2016–2023 (https://data.gov.il/dataset/d9b1e04c-426f-4e32-ba40-a1ad9d8748a7/resource/d47a54ff-87f0-44b3-b33a-f284c0c38e5a/download/bycode2023.xlsx, checked, 1,484 rows). Every 2022 CEC locality except Hebron and the envelope row has an English name here.
- CBS English names use a formal transliteration that will look odd to American readers: "Bene Beraq," "Petah Tiqwa," "Rishon LeZiyyon," "Be'er Sheva," "Ari'el," "Ma'ale Adummim," "Tel Aviv - Yafo." The site needs an override table for the 50–100 places readers will search for (Bnei Brak, Petah Tikva, Rishon LeZion, Beersheba, Ariel…).
- The same file has `קואורדינטות` (coordinates): 12 digits = 6 digits easting + 6 digits northing, in Israel TM Grid metres. Conversion checked with pyproj (EPSG:2039 to 4326): Tel Aviv 32.0764, 34.7893; Ariel 32.1043, 35.1875. It also has district, sub-district, municipal status, religion code and population, all useful for the "group" pages.
- **Population Authority list** (`citiesandsettelments`, updated daily): 1,316 rows with `שם_ישוב_לועזי` (foreign-script name). The first rows checked (Hebron, Qasr a-Sir) have that field empty, so it is weaker for English names. It is the one source found that includes Hebron (3400).

---

## 7. Recommended pipeline (Python; Node works the same way)

1. **Fetch.** Download `expc.csv` for each election from `media{21..25}.bechirot.gov.il/files/`. Save copies under `data/raw/` with a SHA-256 checksum. Decode with cp1255 for 21–24 and utf-8-sig for 25 (and almost certainly 26). Drop the empty trailing column.
2. **Party map.** For each election, keep a hand-checked `data/parties-<k>.json`: letters → `{name_en, name_he, party_id, color, seats}`. Start from `samples/party-letters-k21-k25.json`. Fail the build if a CSV column has no entry.
3. **Locality reference.** Load CBS `bycode2023.xlsx` (or 2024): code → Hebrew name, English name, district, ITM point converted to latitude/longitude. Apply an English-name override table. Add Hebron from the Population Authority list.
4. **Split out envelopes.** Pull out the row named `מעטפות חיצוניות` (code 9999 or 99999) into `national.envelopes`. Never join it to geometry.
5. **Check totals.** Party sums plus envelopes must equal the national page totals; fail the build otherwise.
6. **Write `data/localities-2022.json`**: an array of `{code, name_he, name_en, district, latlng, geom: "mot2026"|"cbs2008"|null, eligible, voted, invalid, valid, votes: {letters: n}}`, keeping only non-zero party counts. Prototype: 1,215 rows, **412 KB raw, 84 KB gzipped** (`samples/localities-2022.sample.json`). Per-election files of this shape for 2019a–2021 run at about the same size.
7. **Geometry.** Download the Transport shapefile (send a browser user-agent) and the CBS 2008 7z (or the CBS 2022 gdb if it can be fetched). Transport layer: drop the West Bank blob (CITYCODE 9999), keep `code`. CBS layer: dissolve by `SEMEL_YISH`. Add CBS features only for codes that Transport lacks. Then `mapshaper -simplify 5% keep-shapes -o format=topojson quantization=1e5`, giving **about 1.0 MB, about 330 KB gzipped**. Localities with no polygon are drawn as dots from `latlng`.
8. **Election night (2026).** The same script polls `media26.../expc.csv` every few minutes. Each fetch is compared to the last. The site shows "votes counted so far" (sum of valid votes divided by the expected total) and a note that envelope votes come last. The final file lands about a week later.

Rough total download for a reader: about 330 KB of map plus about 85 KB per election, gzipped.

---

## Source disagreements

- **Registered voters, 2019b:** the CEC national page shows 6,394,030. The sum of the 2019b locality file (used by an earlier class note) gives 6,391,218. That is 2,812 apart, which was not resolved. In the other four elections the file sums match the national page exactly (checked). Use the national page for headline totals and the file for locality shares.
- **Envelope code:** 99999 in 2019a and 9999 in 2019b–2022. The Transport boundary layer also uses 9999, for the whole West Bank. These are unrelated, and the build must not join them.
- **CBS 2022 layer:** the other project's lockfile lists it. The CBS GIS page as I could read it lists only 2011-based layers. Unresolved until someone downloads it.

## Stale or missing

- **Polling-station addresses:** the only open list found is data.gov.il `voting-polls` (`polling.xls`, last updated 2016-05-05), which is too old. Without current addresses, mixed cities can't be split into Jewish and Arab neighborhoods. Haifa's 2022 result, for example, is one number: 9.3% for the three Arab lists (Ra'am, Hadash–Ta'al, Balad), turnout 55.5%. Lod: 20.4%; Akko: 26.4%; Jerusalem: 1.9%, because most East Jerusalem Palestinians are residents, not citizens, and can't vote for the Knesset (the 1.9% is computed; the residency point is background knowledge, not sourced here).
- **2026 party letters**: not compiled.
- **Whether 2022's expc.csv was updated live on election night**: not verified (the Wayback Machine is blocked here).
- **Haaretz / ToI interactive maps**: not checked (search quota used up).
- **OSM feature counts**: not checked (Overpass unreachable).
- **CBS 2008 layer** is 18 years old; it is used only as a fallback.

## Framing choices for Daniel

1. **How the West Bank is drawn.** Settlement localities would sit as polygons inside an otherwise blank West Bank, with no Palestinian localities, since Palestinians there don't vote in Knesset elections. Either draw settlements like any other locality, or draw them with a visible Green Line and a note explaining who votes there.
2. **Envelope votes.** Either show them as a separate national-only bar labelled "special-envelope votes (soldiers, diplomats, hospitals…)", or leave them out of the map and mention them in a footnote.
3. **Joint lists and party lineage across years.** Examples: 2022's Religious Zionism–Otzma list; Blue and White becoming National Unity; Labor plus Meretz becoming the Democrats. Either keep each list as it ran that year, or assign lists to today's party ids for trend arrows.
4. **English names.** Either use official CBS spellings or common American spellings (with CBS as a tooltip).
5. **Colour by winner vs. by share of one party.** A winner map exaggerates large, empty rural councils. A share map is fairer but needs a party picker. Either make winner-by-locality the default or make share-by-party the default.
