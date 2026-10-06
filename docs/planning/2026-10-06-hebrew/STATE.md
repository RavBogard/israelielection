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
