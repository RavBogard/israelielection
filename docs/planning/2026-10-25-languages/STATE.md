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
