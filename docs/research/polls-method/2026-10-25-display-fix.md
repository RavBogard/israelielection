# Forecast display correction — 25 October 2026

The final party calls add to 52 seats for the Zionist opposition. The homepage previously replaced that sum with the simulated bloc median, 51; the forecast chart and table also led with the median.

The homepage now uses the same party totals as its mosaic and majority shortfalls. The forecast chart and primary table column sum the party predictions, giving 53 Netanyahu-aligned, 52 Zionist opposition and 15 Arab seats: 120 in total. The separate column is explicitly labelled “Simulated bloc median.” The daily record displays saved party totals, falling back to the original totals for older runs that predate separate bloc medians.

Updated the explanations in all seven editions and the translation overrides used during regeneration. The simulation, party predictions, probabilities, historical JSON and final-lock flag are unchanged. Bloc medians remain a secondary diagnostic under version 3's recorded scoring rule.

Files: `components/pages/{HomePage,ForecastPage}.tsx`, `lib/forecast.ts`, the seven editions' forecast/home dictionaries and five translation override files. Regression coverage in `components/pages/ForecastPage.test.ts` renders all seven forecast pages and the English homepage, checking totals, the separate median, chart labels, the daily record and the homepage majority gap.

Verification: 848 tests passed across 80 files; type check and production build passed. Full lint has no errors and 144 existing warnings; the changed components and shared source dictionaries pass focused lint. Publication uses the existing Vercel Git integration on `main`.
