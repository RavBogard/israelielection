# Arabic and Persian editions

Added `/ar` and `/fa` with the same scope as Hebrew: home, polls, forecast, coalition builder,
comparison, party profiles and results. Longer guides and daily briefings link to English.

- Each edition has its own root layout, `lang`, RTL direction, font, metadata and hreflang/sitemap entries.
- The four-language native selector remembers the choice and preserves tool queries and anchors.
  Arabic/Persian browser preferences take precedence over the existing Israel-to-Hebrew default.
- Shared tools use per-language dictionaries and overlays without mutable current-language state.
  A missing or stale translation falls back to English with its language identified.
- Arabic/Persian copy is seeded by machine translation, with terminology corrections and additional
  authored Arabic copy. The footer discloses this. Native-speaker editorial review has not been claimed.
- Search recognizes party, leader and bloc names from all editions.

Primary files: `lib/i18n/{ar,fa}/`, `data/{ar,fa}/`, `app/{(ar),(fa)}/`,
`components/RtlLayout.tsx`, language routing/selector and the shared chart components.

Copy maintenance: change `scripts/i18n/{ar,fa}-overrides.json`, then run
`npx tsx scripts/i18n/generate-editions.mts ar --offline` (or `fa`). Existing static messages/data
seed the generator, so it does not require a machine-local cache. Without `--offline`, new strings
can be translated during explicit authoring; builds and visitors never call the translation service.
The existing scheduled Hebrew refresh remains Hebrew-only; changed Arabic/Persian fields fall back
until refreshed with the authoring script.

Deployment preparation found the checkout 54 commits behind origin/main. Integrated the final
polls, current party/results data and forecast v3, and added the forecast to the new editions.
Translations were regenerated against the updated source data; no newer polling data was replaced.

Verification before integration: 810 tests, type check, production build and browser checks.
After integration: 818 tests, type check and production build pass. Lint has no errors;
the remaining warnings are in existing research/skill files. The integrated Arabic home shows
the final polls and forecast controls correctly in the browser.
Browser checks at desktop and 375px: RTL layouts, no page overflow, chart drill-down links,
Arabic tab keyboard direction, Arabic/Persian coalition state preservation, and switching back to
English/Hebrew. No browser console errors.

Vercel preview deployed and confirmed Ready on 2026-10-25:
https://israelielection-jmmhyok18-ravbogards-projects.vercel.app
Deployment ID: `dpl_BxN6uSdivFpaw1Zi8erRsjKo96VE`; source commit: `a95640d`.
The deployment used a clean archive of committed source, excluding unrelated untracked local files.
The user authorized deployment to `main`; pushed through commit `3b172d6` on 2026-10-25.
Vercel's Git integration built production successfully: `dpl_7FDa2szVFhY9KmMAWfenhPcYAYuk`.
`vercel inspect www.israelielection.org` confirmed Ready and assigned to this deployment.
Live editions: https://www.israelielection.org/ar and https://www.israelielection.org/fa.
The runtime is unchanged from the verified preview. This deployment record is a documentation-only follow-up.

## German, French and Mandarin follow-up

Added `/de`, `/fr` and `/zh` (Simplified Chinese) with the same seven tools and English reference-page
fallbacks. All seven languages appear in the selector, footer, canonical/hreflang metadata and sitemap.
The new editions use LTR, locale dates/numbers, translated data overlays and search aliases. RTL detection
is independent of translation selection, including charts, seat mosaics, logo and tab keyboard direction.
Chinese uses installed system CJK fonts. Translations remain static, disclosed machine translations with
terminology corrections; native-speaker editorial review has not been claimed.

Maintain copy in `scripts/i18n/{de,fr,zh}-overrides.json`, then run the generator with that language and
`--offline`. Generator support includes all five machine-seeded editions; builds never translate remotely.

Verification: 840 tests passed (79 files), type check and production build passed, changed files lint clean.
Full lint: no errors, 144 existing research/skill warnings. A limited-worker run with a longer timeout was
used after the busy machine caused cold page-render tests to time out. After copy corrections, the 44
dictionary, routing, preference and canonical checks passed again.
Local production HTTP checks: all 21 new tool URLs return 200 with correct language, LTR, canonical,
eight alternate-language entries, seven selector choices and translated machine notices. Existing RTL
roots and all three preference redirects pass. Browser visual/interactive QA was unavailable: the
in-app browser repeatedly timed out attaching its webview; no other browser surface was available.

The user explicitly authorized pushing this release to `main` and deploying production.
Release destinations: https://www.israelielection.org/de, https://www.israelielection.org/fr,
https://www.israelielection.org/zh.
Pushed release `56abce2` to `main` on 2026-10-25. Production deployment
`dpl_HipYaK4v2RdJLZ6riJfXRQohhsqt` is Ready; inspecting `www.israelielection.org` confirmed
the live domain is assigned to it. This record is a documentation-only follow-up; no runtime changes remain.
