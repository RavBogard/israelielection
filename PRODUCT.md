# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: American readers, American Jews in particular**, trying to understand Israel's October 27, 2026 election on its own terms. They arrive through news, a share card, or a search during the campaign; they come back for the polls, the daily briefing and the Coalition Builder as the vote nears.
- **Rabbis and educators** were a primary audience until 2026-10-06, when Daniel dropped Teaching resources ("it's really not the point of this page anymore"). Outside pages may still embed the interactives, so embeds keep working; nobody is designed for as a teacher.
- **Journalists and Jewish institutions** who treat the site as a sourced reference. Outreach to press is underway (docs/outreach/2026-10-05/); no coverage has been confirmed yet.
- The reader is not assumed to know Hebrew, Israeli party names, or how a parliamentary system forms a government. Site language is English only; Hebrew appears only for party names, ballot letters and glossary terms.

One front door: understand it. The site is "the 538 of the Israeli election": visual, infographic, data-driven, graphic first on every page (Daniel, 2026-10-05 and 2026-10-06; the earlier "Teach it" door was dropped).

## Product Purpose

An English-language public reference on the 2026 Israeli election: the parties, the polls, the system, and how a government gets built. Every number dated and sourced. Built from Rabbi Daniel Bogard's "Israel Votes" class materials and published under his byline as his own project, independent of his congregation.

Success (Daniel, 2026-10-05, revised 2026-10-06): American readers return during the campaign; press and institutions cite it.

Horizon (Daniel, 2026-10-05): the site is a **standing reference for future Israeli elections**. The 2026 election is the first edition, and the product is built to carry the next one. Work that hard-codes 2026 as the only election should be treated as debt.

## Positioning

- **Every number carries its date, source and a link a reader can follow.** Polls are merged by a deterministic validator; the daily briefing links a source on every sentence. The method is published on /about, and the terminology rulings are kept in the open (docs/research/RULINGS.md).
- **Israeli terms, not American ones.** The site explains why "pro-Israel" is not an Israeli category, why Israeli left and right do not map onto American ones, and what is largely absent from the election's debate (the /american-lens page and the home hero line, ruling 114).
- **Educational, not advocacy.** It does not endorse a party. The earlier "learning, not advocacy" wording was the class ruling and was struck from the site plan; voice rules 114–118 replace it. Source perspectives are named rather than labelled (IDI as nonpartisan; Peace Now as advocacy for a two-state agreement).
- **Reusable by design.** Interactives are embeddable and data exports carry their sources.

## Operating Context

- **Election:** October 27, 2026; polls close 22:00 Israel time. Threshold 3.25% of valid votes; seats allocated by Bader-Ofer; 61 of 120 seats forms a government. The site teaches the post-election clock (president's consultations, mandate, 28+14 days, possible second mandate, the Knesset's 21 days).
- **Phases the site must serve:** campaign (now), election night (results route polling the Central Elections Committee feed), government formation (tracker on /government), and the long tail as a dated record and a base for the next election.
- **Live layer, no human in the loop:** a GitHub Action imports polls twice daily and auto-commits what passes validation; failures go to one rolling review PR. A daily Gemini job writes the briefing and publishes it unreviewed; Daniel receives it by email and can correct or kill any item by deleting the day's file. Results snapshots run every fifteen minutes through election week.
- **Content pipeline:** research briefs → Daniel rules in one sitting → MDX and JSON → code. Text that changes meaning goes by PR; well-sourced party-data changes merge automatically. Questions only Daniel can answer go to docs/planning/<date>-eval/HANDOFF.md; his answers come back in DECISIONS.md.
- **Embeds:** the seat grid, the poll average and the Coalition Builder can be embedded. The teaching page, packets and decks were removed on 2026-10-06; /teach redirects home.
- **Corrections:** public GitHub issues and the /corrections page (account-free draft). No published email address.

## Capabilities and Constraints

- **Capabilities (built):** home with countdown and the 120-seat race summary; party profiles with six issue axes for 15 lists; Party Map; position compare with evidence gaps shown; Coalition Builder with pledge-conflict warnings driven by declarative rules; party family tree; ballot-list directory; polls with trend, averaging assumptions and an alternative average; daily briefing with RSS; results and government-formation trackers; sourced changes log; four how-it-works guides; seven issue pages; nine community pages; locality vote map for 2019–2022; timeline 1977–2026; glossary with pronunciations; American lens; embeds; sourced CSV exports; share cards; search; About with method and privacy.
- **Data lives as JSON in the repo** (data/*.json) so every change is a reviewable commit. No database. Vote-map data is precomputed from CEC locality files and public boundaries.
- **Stack (existing):** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, MDX; Vercel deploys on push to main; GitHub Actions for jobs; Gemini Flash 3.8 for the briefing (Daniel's ruling: Gemini, not Anthropic). Node 22+.
- **Averaging rules (published):** latest poll per publisher within 14 days of the newest; weights by square root of sample size; lists passing the threshold in fewer than half the polls are excluded from default coalition totals; totals above 120 scaled down; Channel 14 included in the main average, excluded in the alternative.
- **Terminology is ruled, not improvised.** House language includes "Haredi", "occupied West Bank", "Palestinian citizens of Israel" (with "Arab Israelis" noted and the dispute explained), "Liberman", "hostages", "Anti-Netanyahu bloc (Jewish-majority parties)", and "far-right" only for Otzma Yehudit and the Religious Zionist Party with IDI cited. "Genocide" only inside quotations or case names. Full list: docs/research/RULINGS.md.
- **Out of scope by ruling:** a Hebrew edition; a Jewish-texts section or route (occasional downloadable class sheets only, each approved by Daniel); trip material; any claim of analytics anonymity or a consent control (neither verified).
- **Analytics:** Google Analytics loads in production only, disclosed in the footer and on /about.
- **Open decisions (recorded, not invented):** none outstanding from the 2026-10-05 handoff. Future-election structure (how a second election is housed on the same site) is not yet designed.

## Brand Commitments

- **Name: "Israel Votes 2026"** (Daniel, 2026-10-05). israelielection.org is the address, not the name. Titles, share text and the wordmark keep the name.
- **Byline:** "A project of Rabbi Daniel Bogard." Not CRC-branded; the About page states independence from his congregation. His signed note appears on the home page and About; text in his voice is his to approve.
- **Tool disclosure is part of the brand:** About names Gemini Flash 3.8 for the briefing and Claude Code (Fable 5.1 and Opus 5.5) for development. Do not revert to a generic "AI".
- **Voice:** educational, precise, sourced; evidence distinguished from interpretation; legal findings stated fully and attributed first, with Israel's rejection in one sentence.
- **License:** original text is CC BY-NC 4.0 with credit to Rabbi Daniel Bogard and a link to israelielection.org. The license covers the site's original text only, not the whole repository; third-party material keeps its own rights.
- **Existing assets:** app/icon.svg, app/favicon.ico, app/apple-icon.png, components/Logo.tsx, a dynamic share image at app/opengraph-image.tsx and api/card, and public/teach/session-1-cover.png.

## Evidence on Hand

- 15 party profiles with sourced positions, pledges, quotes and bios (data/parties.json).
- 34 polls from 9 pollsters since 6 September 2026 (data/polls.json), growing twice daily.
- Locality results for the five elections of 2019–2022 with boundaries (public/vote-map/).
- 7 issue pages and 9 community pages with survey data by group (data/surveys.json, content/issues, content/groups), backed by research files in docs/research/.
- Timeline, glossary, charts (data/charts/), ballot directory, voting-rights data.
- One Session 1 class deck (31 pages, PPTX and PDF) and two packets (system, coalitions); teaching scenarios in data/teach-scenarios.json.
- Daily briefings from 2026-10-05 onward (data/briefings/).
- Daniel's approved signed note (data/home-note.json) and About copy (content/about.mdx).
- **Absent, do not fabricate:** testimonials, usage or adoption numbers, confirmed press coverage, institutional endorsements, teacher guides or source sheets beyond the two packets, a Hebrew edition.

## Product Principles

1. **A number without a date and a source is not on the site.** Sourcing is the product, not a footnote; unverifiable claims are cut, not hedged.
2. **Explain Israel in Israeli terms, and say where American categories mislead.** Name what shapes the vote and what is absent from it.
3. **Machines run the live layer; Daniel owns meaning.** Automate polls, briefing and results fully; route position changes, his voice, the method page, license and spend to him.
4. **The graphic leads.** Every page opens with its infographic; explanatory text goes in captions, folds or below, never between the title and the figure (Daniel, 2026-10-06).
5. **Built to outlast one election.** 2026 is the first edition of a standing reference, so structure, data and copy should not assume it is the last.

## Accessibility & Inclusion

No formal standard is set. Present commitments: skip link and labelled landmarks, accessible HTML versions of teaching packets, keyboard-inspectable charts and accessible data tables on polls, party colours checked at 4.5:1 contrast in the foreground, Hebrew spans marked with `lang="he" dir="rtl"`, dark mode via system preference, and no horizontal overflow at 320px. Known gaps from the 2026-10-05 audit: reduced-motion guards are partial, and dark-mode contrast on the vote map and the builder meter is weak. Readers include adult learners and classroom projection, so legibility at distance and on phones matters.
