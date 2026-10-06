# Hebrew tools edition: plan (2026-10-06)

Scope: Hebrew /he, /he/polls, /he/coalition-builder, /he/compare, /he/parties/[id], /he/results. Everything else stays English; Hebrew pages link to the English guides.

## 1. Routing
- Two root layouts via route groups. `git mv` every English route (all of app/ except api/, globals.css, sitemap.ts, robots.ts, icons, opengraph-image.tsx) into `app/(en)/`; URLs unchanged. Add `app/(he)/he/layout.tsx` with `<html lang="he" dir="rtl">`, Hebrew masthead and footer, Hebrew font, GA tag.
- `app/global-not-found.tsx` + `experimental.globalNotFound` (experimental: rehearse a 404 on preview; fallback is per-group not-found plus catch-all).
- Rejected: app/[lang] + proxy (churn on every English page); nested app/he under the English root (wrong html lang/dir); next/root-params.
- `lib/i18n/index.ts`: `type Lang`, `HE_PATHS`, `hePath()`, `enPath()`. Server components take `lang`; client components call `useLang()` (context default "en"; only the (he) layout provides). In-scope page bodies move to `components/pages/<Name>Page.tsx({lang})`.
- hreflang: `alternates(path)` in lib/canonical.ts adds `languages: {en, he, "x-default": en}` for HE_PATHS; Hebrew pages use `heAlternates`. Sitemap gets /he entries with alternates. RSS English only. OG: Hebrew titles, `locale: he_IL`, English card image (satori bidi unreliable). Search: Hebrew masthead links to English /search; add Hebrew party and leader names to data/search-aliases.json. Embeds stay English.

## 2. Strings
- About 910 strings / 4,700 English words, mostly inline JSX (chrome ~365 words, home ~460, polls ~1,450, builder ~860, compare ~500, profile ~560, results ~500).
- No library. `lib/i18n/{chrome,home,polls,builder,compare,profile,results}.ts`, each `const en = {...}; const he: typeof en = {...}; export default {en, he}` (types enforce parity and template signatures). Client components import modules directly.
- Gate: save built HTML of the 7 English in-scope routes before wave 2; after extraction the diff must be empty (ignoring timestamps and hashes).

## 3. Generated sentences
- Hebrew templates for: home-since (findingSentence, citeText, noNewLabel), polls-desk (8 findings, BLOC_NAME, times, DESK_TABS), results-phase (headline, averageLabel, PHASES, PRIOR_ROLL.label), coalition-governing, coalition-arrangement ROLE_LABELS, nav-facts meter, positions (QUALIFIER, evidenceLabel; move hard-coded evidence strings to data), polls (pollLabel, averageAsPoll note), lib/coalition pledge placeholders. paths-to-61 has labels only.
- Pattern: generators take a phrasebook defaulting to English, e.g. `findingSentence(polls, parties, blocs, id, P = FINDING.en)`.
- `lib/i18n/he-grammar.ts`: `plural(n, {one, two, other})` on Intl.PluralRules("he") (dual), `seatsHe(n)` ("מנדט אחד" / "N מנדטים"), `list()` on Intl.ListFormat("he"); dates via Intl.DateTimeFormat("he-IL") through a `lang` param on lib/format.ts.
- Gender: bloc subjects are masculine (גוש); for party/pollster subjects use nominal or colon forms; add `genderHe` to the overlay only where a verb is unavoidable. Digits stay; signed figures in `<bdi dir="ltr">`.

## 4. Data
- Separate overlay `data/he/**` mirroring only translated fields, keyed by id or index; each field stores `src` (8-char hash of the English it came from). `lib/i18n/localize.ts` merges. A vitest test fails on a stale hash; at runtime a stale or missing field falls back to English in `<span lang="en" dir="ltr">`.
- Words in scope ~12,600: parties.json ~4,600 (who 930, issues 1,300, bios 690, voters 510, pledges 410, quote 240, names 280, surplus 180), positions ~4,700, comparison-questions ~1,500, pledge-rules ~610, coalition-scenarios ~350, gaza-security ~310, outgoing-government ~290, poll-sources ~130, results ~75, voter-base ~65, blocs/issues ~20, pollster names.
- Quotes: `{text, original: true|false, sourceHe?}`; prefer original Hebrew (Ynet Hebrew survey, Knesset records, party posts). A translation is never presented as the speaker's own Hebrew.
- Results night: CEC file has Hebrew list names, keyed by ballot letters.

## 5. RTL
- Rule: sequences and magnitudes start at the inline start (right in Hebrew); time axes and numerals stay left to right (Ynet, Globes, BoI, CBS practice). Daniel confirms on preview.
- SeatBar: mirrors via flex, but the inline `left: w(majority)` tick must become `insetInlineStart`.
- Seat grid SVGs (HomeRace mosaic, SeatGrid): `rtl` prop, fill from top-right (`x = (11 - i%12)*12`), 61 label to the left edge.
- PathsTo61 bars, Compare grid, poll slips: free from logical CSS (check sticky first column).
- BlocRace, PollTrends, SeatSparkline: axes unchanged; translate labels; SVG text direction and anchors; arrow keys stay "right = later".

## 6. Fonts
- IBM Plex Sans Hebrew (400/500/600/700), loaded only in the (he) layout as `--font-he`; `:root:lang(he)` stack `var(--font-sans), var(--font-he), sans-serif`. Frank Ruhl Libre already has Hebrew. Alternative: Assistant.

## 7. Jobs
- briefing.mts / lib/briefing.ts: second Gemini call translates the checked English sentences into `textHe`; gate on equal sentence count, same digits per sentence, party names in overlay Hebrew; else `textHe` null and the Hebrew home shows English marked lang="en". Test in lib/briefing.test.ts.
- party-proposals.mts: machine-translate changed fields into the overlay with `machine: true` so the stale test does not block auto-merge; Daniel reviews in batches.
- update-polls.mts: new pollster without a Hebrew name falls back to English.

## 8. Waves
- 0: logical-CSS sweep (app/globals.css, components/**/*.css).
- 1 (serial, ~1 day): git mv into app/(en); (he) layout; global-not-found; next.config; lib/i18n/{index,he-grammar,localize}; canonical; sitemap; format; pollLabel; SeatBar; LangSwitch; shared PageHead, SourcesBox, Sources, CiteButton; lib/navigation.test.ts paths; English HTML baseline.
- 2 (parallel, disjoint): 2A home and chrome; 2B polls; 2C builder; 2D compare and profiles; 2E results. Each: English HTML diff empty, /he route builds, tests per Hebrew sentence branch.
- 3 (parallel, owns data/he/**): 3a parties plus original quotes; 3b positions, comparison questions, gaza; 3c pledge rules, scenarios, government, pollsters, blocs, results labels.
- 4: jobs and search aliases.
- 5: RTL pass on a preview (phone, desktop, dark, 320px), election-night rehearsal on /he/results, PRODUCT.md and DESIGN.md.
- About 6 working days to a full preview; ~14,000 Hebrew words for Daniel to review (read UI, stance labels and quotes in full, about 5,000; spot-check prose).

## 9. Open decisions for Daniel
1. Hebrew bloc names ("גוש נתניהו"; anti-Netanyahu as "הגוש המתנגד לנתניהו", "גוש השינוי" or "האופוזיציה") and the Hebrew site name ("ישראל בוחרת 2026"?).
2. How translated quotes are marked ("(תרגום)"), or originals only.
3. Daily machine-translated briefing on the Hebrew home: publish unreviewed, with a label?
4. Stale Hebrew data: English inline or hide.
5. English share image on Hebrew pages for v1.
6. Hebrew menu: six Hebrew pages plus an English link, or also English-only pages marked "(באנגלית)".
7. Reviewer: Daniel alone or a native-speaker second reader.
8. Confirm the RTL chart rule on the preview.
