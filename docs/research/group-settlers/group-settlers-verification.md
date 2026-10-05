# Verification — group-settlers

Checked 2026-10-04. All five CEC locality files re-downloaded; settlement totals recomputed (CBS locality codes 3400–3899) and the Haredi-city and suburb groups rebuilt from the names in the findings file. Registry PDF and EU (EEAS) report re-downloaded and searched; other URLs opened with WebFetch.

| Claim (brief) | Status | What the source says | URL |
|---|---|---|---|
| 541,085 Jews in WB settlements, 1 Jan 2026 | CONFIRMED | Registry-based report: 541,085; growth 2.2% in 2025, "double" Israel's 1.1% | https://jr.co.il/ys/West_Bank_Jewish_Population_Stats_Jan_2026.pdf |
| 5.3% of Israel | DERIVED | Our arithmetic (541,085 / ~10.2M). Yesha's own 2023 figure was 5.2%. | — |
| "Over 750,000" with East Jerusalem | CONFIRMED | EEAS 2025 report: "over 750,000 Israeli settlers (15% of the entire West Bank…)" | https://www.eeas.europa.eu/sites/default/files/2026/documents/2025%20Report%20on%20Israeli%20settlements%20in%20the%20occupied%20West%20Bank.pdf |
| Yesha 2023: 36 / 36 / 28 | CONFIRMED | ToI (Yesha report, 12 May 2023): "36% ultra-Orthodox, 36% religious zionist, 28% secular"; method not stated | https://www.timesofisrael.com/yesha-settler-umbrella-group-says-over-half-a-million-israelis-live-in-west-bank/ |
| IPF 2025: 33.5 / 25.4 / 28.8 / 12.2 | CONFIRMED | Shares of settler population living in Haredi (8), religious (57), mixed (16), secular (46) settlements — by **settlement type**, not by person; data year not stated | https://israelpolicyforum.org/2025/04/16/the-quiet-surge-in-west-bank-settlements/ |
| Registry 2026: 34.4% in Haredi towns | DERIVED (arithmetic checks) | 186,133 in the eight Haredi towns / 541,085 = 34.4%. Our sum, not a registry statement. | registry PDF |
| Growth 2.2% vs 1.1%; Ma'ale Adumim flat | CONFIRMED | Registry PDF; Ma'ale Adumim bloc +1.7% over five years | registry PDF |
| Outposts: 415 (243 farms); 92 founded in 2025, 79 in 2026 | CONFIRMED from the spreadsheet; CONFLICT with Peace Now's own report | Recounted the agent's downloaded Peace Now sheet: 415 rows, 243 farm types, 2025 = 92, 2026 = 79. But Peace Now's 2025 summary says **86 new outposts (60 farms)** in 2025, and EEAS says the previous record was 26 in 2023 (sheet: 32). The sheet's download URL is not recorded (the URL in the data file is the population page, which does not show these counts). | https://peacenow.org.il/en/summary-of-2025-in-settlements |
| "~5–15 a year before 2023" | MINOR | Sheet: 2019 17, 2020 11, 2021 14, 2022 5. Say "5–17." | Peace Now sheet |
| Population series 2000–2023 (191,125 … 503,732) | UNVERIFIED-SECONDHAND | Peace Now page says the data are in downloadable sheets; figures not visible in page text. Not re-downloaded. | https://peacenow.org.il/en/settlements-watch/settlements-data/population |
| ~300 involved, ~70 hardcore (IDF/Shin Bet) | CONFIRMED | ToI 9 Sept 2026: "Israeli security officials believe" ~300, ~70 hardcore | https://www.timesofisrael.com/as-settler-violence-surges-some-ask-whether-israel-cant-crack-down-or-simply-wont/ |
| OCHA attacks 1,189 → 1,420 → 1,828 (2023–25) | CONFIRMED | EEAS 2025 citing OCHA | EEAS PDF |
| 94% of files closed without indictment (Yesh Din) | CONFIRMED | 93.6%, 2005–2025, via ToI; 3% led to convictions | ToI (above) |
| Chart C 2022 by type: Haredi cities 1.4 / 7.8 / 90.2 / 0.2; suburbs 34.1 / 23.1 / 12.6 / 19.7 | CONFIRMED | Suburbs exact. Haredi cities rebuilt with 7 of the 8 towns (Metzad not found by name): 1.4 / 7.6 / 90.5 / 0.2 — consistent. | media25 expc.csv |
| Chart C ideological 19.3 / 57.3 / 4.0 / 8.3; all settlements 19.1 / 31.5 / 31.6 / 10.0; Israel 23.4 / 10.8 / 14.1 / 26.9 | CONFIRMED | All-settlement and Israel rows recomputed exactly; ideological row consistent with findings table (3.1+0.9, 4.1+4.2) | CEC |
| Voting-pattern table, all five elections (RZ-family, Likud, Shas+UTJ, turnout; settlements / Israel) | CONFIRMED | Every cell matches (e.g. Apr 2019 URWP 18.2 + New Right 10.7 + Zehut 4.9 = 33.8; 2021 RZ 21.7 + Yamina 13.5 = 35.2; 2022 RZ–Otzma 31.5 + JH 3.7 = 35.2) | media21–25 expc.csv |
| 12.2% of RZ–Otzma 2022 vote from settlements; 3.9% of voters | CONFIRMED | 62,880 of 516,470 votes; 266,958 of 6,788,804 eligible | media25 expc.csv |
| "down from 18–21% in 2019–21" | CONFIRMED (rounding) | 2021 RZ 17.9; Apr 2019 URWP 21.1 | CEC |
| Single towns (findings): Karnei Shomron 54% RZ–Otzma, Givat Ze'ev ~45% Haredi parties | CONFIRMED | 54.4; 45.3 | CEC |
| Washington Institute 6% / 22% | UNREACHABLE (not opened by the agent; no URL) | — | — |

## Must fix before the brief goes to Daniel
1. Outposts: say where 92 comes from (Peace Now database sheet, counted by founding year) and that Peace Now's own 2025 report says 86. Record the sheet's download URL.
2. "5.3% of Israel" and "34.4% Haredi" are our arithmetic — label them.
3. IPF figures are shares living in each settlement type, not shares of people by religiosity; chart B mixes the two kinds of estimate — say so in the chart note.
4. "~5–15 a year before 2023" → "5–17."

## Cannot verify from this session
- CBS population series 2000–2023 (Peace Now spreadsheet not re-opened).
- Washington Institute comparison figures.
- No settler-specific opinion survey exists (brief already says so).
