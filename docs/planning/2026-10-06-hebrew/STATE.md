# Hebrew tools edition (2026-10-06)

Daniel: "i want version 1. lets do it" — Hebrew versions of home, polls, Coalition Builder, Compare, party profiles and results before Oct 27; guides stay English.

## Waves
- [ ] Groundwork: CSS logical properties (no visual change in English)
- [ ] Plan: routing, dictionary, generated sentences, data overlays, RTL chart rule, font, jobs
- [ ] Build: routing and dictionary; pages; data translation; original Hebrew quotes
- [ ] Daniel's Hebrew review
- [ ] Launch

## Decisions
- GATE: started groundwork before the audience and reviewer answers — proceeded because logical CSS changes nothing visible and every option needs it.
- Daniel, 2026-10-06: footer Google Analytics line cut; disclosure stays on /about.
- Daniel, 2026-10-06: "lets use israeli language for all of this, and not be translating things. Lets actually write everything new for the hebrew version---it needs to fulfil the same role, but be israeli language and israeli cultural language." So: Hebrew copy is written fresh in Israeli political-media Hebrew (the terms Kan, Ynet, Haaretz and IDI use), doing the same job as each English element, not mirroring its sentences. Bloc names and labels follow neutral Israeli media usage. Overlay hashes still track which English item each Hebrew text answers to.
- Daniel: quotes with no original Hebrew found are shown marked (תרגום).
- Daniel: daily briefing on the Hebrew home publishes automatically with a small "תורגם אוטומטית" label after the checks pass; falls back to English if they fail. (Briefing is the one machine-translated exception.)
- Daniel: he reviews all Hebrew himself.
- Daniel, 2026-10-06: Hebrew site name "פתק 2026"; blocs גוש נתניהו / גוש האופוזיציה (with מחוץ לגושים and המפלגות הערביות). Style guide: STYLE.md.
- [x] Groundwork done: logical CSS (1dc92d3); wave 1 routing and plumbing built (route groups, /he root, global 404, i18n libs).
- GATE: HE_PUBLIC switch (lib/i18n/index.ts) off — no hreflang on English pages, no /he sitemap entries, /he noindex — proceeded because the Hebrew pages are unwritten and unreviewed; flip it at launch.
- Note: og:image now lives in app/(en) (route-group URL suffix); the old /opengraph-image URL 404s, social sites refetch.
- Overlay contract (OVERLAYS.md, lib/i18n/overlays.ts) and Hebrew poll labels committed (dc55eb7).
- Wave 2 and 3 running in parallel: pages he-home (home, chrome, shared components, results-phase), he-polls, he-builder, he-compare (compare and profiles), he-results; data he-parties, he-positions, he-builder-data. Each owns disjoint files; English HTML diffed before and after.
- [x] Build: pages and data written (commit "Hebrew edition: /he home, polls ..."). Integration: bloc labels set to Daniel's names (גוש האופוזיציה, המפלגות הערביות) in data/he/parties.json; seat-bar segment gaps made logical; overlay staleness test added (lib/i18n/overlays.test.ts); 760 tests pass; production build passes with all /he routes.
- Held push: Hebrew overlays (~110 KB) were reaching English pages' client bundles; fix in progress (overlays to client components only on Hebrew pages).
- For Daniel's review: lib/i18n/{chrome,home,polls,builder,compare,profile,results}.ts (UI copy); data/he/** (data, logs in docs/research/2026-10-06-hebrew/). Quotes: parties 7 original / 6 (תרגום); positions 36 (תרגום) of 253 fields; pledges 2 original / 10 (תרגום). Open: unverified firm spellings (פרויקט מדגם, אסקריה, קנטאר); mirrored logo mark; Results link hidden until polls close as in English; ThresholdWhatIf not on the Hebrew builder (not on English builder either).
- [x] Bundle fix (b32050c): overlay data only in Hebrew pages' client chunks; English /about, /polls carry UI dictionaries only (~25 KB Hebrew strings in a shared chunk; follow-up if wanted).
- [x] Election-night rehearsal on /he/results and /he (RESULTS_NOW 22:30, 2022 fixture): count phase, bloc strip, mirrored grid and list table correct. Found and fixed in both editions: home source line printed the raw ISO capture time; counted seats showed "63.0" (d05cb02).
- Pushed; /he live but unannounced and noindex. Next: Daniel's review, then HE_PUBLIC on.
- Daniel, 2026-10-06: "strip that hebrew stuff out" (UI Hebrew in English bundles), "you can go live with the hebrew site", serve Hebrew by default to readers in Israel and browsers set to Hebrew, and an easy switch "ala switching from dark to light".
- [x] UI Hebrew moved to lib/i18n/he/*.ts, loaded through lib/i18n/he-text.ts by HebrewProvider and overlays.ts only; English dictionaries keep a `he` getter so call sites are unchanged.
- [x] Masthead language toggle (components/LangSwitch.tsx): EN | עב cells on desktop, one cell naming the other edition on phones; sets a `lang` cookie for a year and carries query and fragment. On an English-only page the Hebrew cell opens /he.
- [x] proxy.ts: 307 from the six English pages with a Hebrew edition to /he when x-vercel-ip-country is IL or the browser's first language is Hebrew; the cookie always wins; clicks within the site, router fetches, crawlers and link previews are never redirected.
- GATE: HE_PUBLIC on (hreflang, sitemap, indexing) — proceeded because Daniel said to go live when ready; his line-by-line review of the Hebrew copy is still open and edits can land any time.
- GATE: default rule uses the browser's first language, not any Hebrew in the list — proceeded because Daniel said "hebrew set as their browser's default language".
