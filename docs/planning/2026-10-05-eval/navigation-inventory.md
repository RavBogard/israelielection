# Navigation inventory and recommended information architecture

Read-only inventory, October 5, 2026. Source files: `lib/site.ts`, `components/SiteNav.tsx`, `app/layout.tsx`, `app/sitemap.ts`, public route files, `lib/articles.ts`, `app/search/page.tsx`, teaching data. No application changes or unrelated audit. Baseline gates are root's 522 tests, lint, production build and typecheck.

## Current visitor destinations

There are **23 destination pages including the homepage**. Every non-home destination is in the footer, so these are discoverability gaps rather than truly orphaned major pages. The header's three groups render only `items`, not `more`: 11 links plus Teaching. Search also has a masthead utility link; Start here and Search appear in the mobile menu.

| Destination | What visitors actually find | Current header / useful contextual entry |
|---|---|---|
| `/` | Race snapshot, party seat cells, four tools and first briefing sentence | Logo; party cells now open their Party Map panel |
| `/start` | Three guided routes with learning checks | Mobile menu; homepage introduction |
| `/parties` | Poll-sized Party Map; 15 sourced profiles and selected-party panel | Explore; homepage graphic and tool |
| `/ballot` | All 38 published submitted lists, English/Hebrew names, letters, official records; explicitly not final certification | Footer; Party Map and profiles |
| `/party-history` | Organizational family tree and chronology for profiled lists | Footer; Party Map/profiles, ballot, historical vote map |
| `/compare` | Side-by-side narrower policy questions, attributed evidence and coverage limits | Explore |
| `/coalition-builder` | Hypothetical cabinet/support/abstention arrangements, seat basis and confidence arithmetic | Explore; homepage, teaching |
| `/polls` | Poll register, averages/method, historical trend and selected-poll comparisons | Follow; homepage |
| `/news` | Daily briefing/archive, sourced grouped headlines | Follow; homepage briefing |
| `/changes` | Before/after material changes, sources, effective/logged dates, local bookmarks | Footer; explicit News link |
| `/results` | Pre-election preparation, then validated fresh/saved count and provisional seat estimates | Follow; conditional result strip |
| `/government` | Outgoing government context and next-government formation clock/status | Follow; formation guide/builder context |
| `/how-it-works` | Hub for four system guides | Understand; homepage |
| `/issues` | Hub for seven issue explainers | Understand; teaching |
| `/communities` | Hub for nine overlapping voter-community explainers | Understand |
| `/vote-map` | Locality vote mix/plurality/single-list maps and five-election town histories, 2019–2022 | Footer; homepage tool, system hub, family tree |
| `/timeline` | Political/election chronology, 1977–2026 | Footer; family tree |
| `/glossary` | 69 sourced terms, Hebrew/alternative spellings, search | Footer; site-search fallback and indexed terms |
| `/american-lens` | Essay on American political categories and their limits in Israel | Understand; Issues hub |
| `/teach` | Session deck, learner/facilitator packets, scenarios, classroom uses and embed snippets | Direct Teaching link; homepage/footer |
| `/about` | Purpose, sources/method, automation/responsibility and privacy | Footer; homepage and correction register |
| `/corrections` | Media email, evidence-based correction preparation and correction history | Footer; article correction links; Changes |
| `/search` | Local corpus of parties/leaders, articles, glossary and selected resource descriptions | Masthead utility, mobile menu, footer |

## Detail and distribution families: contextual access, not top navigation

- `/parties/[id]`: 15 profile pages, alongside `/parties?party=<id>` panel links. Both represent the same party resource; do not advertise two competing directories.
- `/how-it-works/[slug]`: `seats`, `forming-a-government`, `voting`, `who-votes`. The latter includes the voting-rights visual; the seats article contains the threshold/seat exercise. A menu can spotlight “Who can vote?” without listing every article in the masthead.
- `/issues/[slug]`: seven explainers—Haredi draft, courts, war/hostages, West Bank, religion/state, economy, Palestinian statehood.
- `/communities/[slug]`: nine explainers—secular, Masorti, religious Zionist, Haredi, Russian-speaking, Ethiopian Israeli, Palestinian citizen, Druze and settler communities.
- `/news/[date]`: dated briefing archive details; currently one briefing record. `/news/feed.xml` is RSS, correctly declared through layout metadata's alternate link, but has no visible subscription link in News.
- `/teach/packets/[id]/[role]`: two packet subjects (`system`, `coalitions`), learner/facilitator roles: four accessible HTML documents plus linked PDFs. Session PPTX/PDF and covers are download assets, not independent navigation destinations. Existing useful anchors: `/teach#packets`, `/teach#scenarios`.
- `/export/[kind]`: query-specific sourced issue, coalition and locality print/CSV views. Preserve contextual links and return state; not useful as an unparameterized global destination.
- `/embed/grid`, `/embed/average`, `/embed/builder`: distribution frames reached through Teaching's snippets, not standalone exploration pages.
- `/api/count`, `/api/results-snapshot`, `/api/card`, `/api/export`: machine/image/download endpoints; never main navigation.

## Actual gaps and misleading overlaps

1. `more` resources are omitted from both the desktop group lists and the mobile group lists. This hides some of the site's strongest distinctive resources: historical vote map, party family tree, full ballot directory, glossary and Changes. A footer link does not establish awareness near the top of a page. `lib/site.ts` says these are also on a home index, but the sparse current homepage has no comprehensive index.
2. The footer's Understand column holds 14 destinations while Explore has three and Follow four. Changes belongs with following the election; ballot/history belong with parties; About/contact are utilities. The imbalance reflects implementation history rather than visitor goals.
3. “Government” can imply a cabinet directory; its actual function includes formation status and rules. “Government formation” or “Government & formation,” with a short descriptor, is clearer. Keep the static **formation guide** under system learning and the **tracker** under updates.
4. “Compare” does not identify its subject. Prefer “Compare party positions.” It is evidence comparison, not a voting recommendation or a personality quiz.
5. “Party Map” and “Vote map” can sound interchangeable. Describe the first as a poll-sized party map/profiles, and label the second **Historical vote map**. “Timeline” needs **Election history** or “Political timeline” and its 1977–2026 range; it is not today's news chronology.
6. “The submitted ballot lists” is accurate but awkward as navigation. **Ballot directory**, with a descriptor explaining published submitted status, keeps the phase caveat without a long menu label. Party Map profiles cover 15 lists; this directory covers all 38 currently published entries.
7. Search is complementary, not a substitute for browsing. Its current explicit resource list omits `/results`, `/government` and the three article index hubs. It indexes their related articles unevenly, which can fail a visitor seeking the named tracker/hub. Dated news/teaching detail coverage is also not an exhaustive content search; do not imply otherwise.
8. The XML sitemap covers the NAV destinations, profile/article/packet details, but currently omits `/` and dated briefing pages. They remain linked in the UI; this is sitemap coverage, not an orphan-page claim. Embeds/exports/API omission is appropriate.

## Recommended grouping from visitor goals

Root's proposed five explicit browse groups fit the inventory. Use short descriptions in their disclosure panels and the same complete inventory on desktop and mobile. Keep **Start here**, **All resources** and **Search** as visible utilities. Logo returns home. All resources would be a new human-readable directory, not the existing XML sitemap; its route is an implementation decision, not an existing inventory entry.

| Group | Visitor question | Destinations |
|---|---|---|
| **Parties & coalitions** | Who is running, what do they say, and who could govern? | Party Map & profiles; Compare party positions; Coalition Builder; Ballot directory; Party family tree |
| **Polls & updates** | Where does the race stand and what changed? | Polls; News & briefings; What changed; Results; Government & formation |
| **Election explained** | How does the system work, and what context am I missing? | How elections work; Issues; Voter communities; Historical vote map; Election history; Glossary; The American lens |
| **Teaching resources** | What can I use with a class or discussion group? | Teaching overview; Learner/facilitator packets; Coalition scenarios; session downloads and embed snippets within the overview |
| **About & contact** | Who made this, how is it checked, and how can I get in touch? | About & method; Media inquiries & corrections |

This is 17 resource links across the first three groups, with Teaching plus utilities covering the other destination pages. Every major resource gets a named, predictable entry point; detail pages remain in their hubs. Do not flatten all articles/downloads into a long mega-list. A few descriptive lines resolve ambiguity better than introducing more top-level categories. The footer should mirror the same model rather than retain a hidden “more” taxonomy.

Primary ownership recommendation: one shared navigation registry provides header/footer and resource-search/sitemap inputs where appropriate; keep contextual duplicate links when they help a visitor. A resource can be cross-linked without belonging to two equally authoritative menu groups. Preserve statuses (submitted ballot, pre-election results, selected rather than exhaustive Changes) in descriptors, rather than labeling everything “live.”

## Six-task expert walkthrough of the proposed IA

This is a source-informed expert walkthrough, **not a user study**. It predicts possible routes and confusion; it does not establish measured findability or completion rates.

| Visitor task | Expected route | Assessment / small requirement |
|---|---|---|
| First-time learner | Visible **Start here** → choose a guided route; alternatively Election explained → How elections work | Strong direct entry. Describe Start here as a short guided introduction rather than an article hub. All resources supplies a complete browsing fallback. |
| Compare parties | **Parties & coalitions** → Compare party positions; Party Map for profiles | Strong match to task language. Descriptor must distinguish side-by-side sourced policy evidence from poll-size comparison, and Compare from the long Issues explainers. |
| Geographic voting | **Election explained** → **Historical vote map** → election/mode/town | Reachable, but this is the weakest group-title prediction: “explained” may suggest only articles. The visible menu item's descriptor should say “Town vote mix and local leaders, 2019–2022”; do not bury it under a second “More” expansion. All resources and existing homepage map link are useful alternate paths. |
| Teacher packets | **Teaching resources** → **Learner & facilitator packets** (`/teach#packets`) | Strong audience/task match. Direct anchor avoids confusing packets with the session slide deck. Preserve accessible HTML alongside PDF and make both learner/facilitator roles explicit. |
| Follow formation | **Polls & updates** → **Government & formation** (`/government`) | Plausible, but “Polls” dominates the group label. A panel description such as “The race, results and next government” helps. Descriptor “Outgoing government and next-government tracker” separates this from the system's formation guide. Do not promise live status before the relevant events/data exist. |
| Media inquiry / correction | **About & contact** → **Media inquiries & corrections** | Strong expectation match. Page's media and correction sections are already distinct; optional direct `#media`/`#report` shortcuts can serve those separate tasks without creating new pages. Preserve method/verification access under About. |

Recommendation: proceed with root's five-group model. The substantive improvement is giving every resource an explicit header entry, plain subject labels and complete mobile parity. The two uncertain predictions—geography under Election explained and formation under Polls & updates—are manageable through visible item names/descriptions and All resources, rather than adding a sixth top-level category. Validate those two tasks especially in root's keyboard/mobile review.

## Independent implementation source review

Reviewed the new shared manifest, navigation helper/component/CSS, layout/footer, resource directory, search and sitemap after implementation. No structural blocker found. The manifest now covers all **24 visitor destinations including Home and new All resources**; header/footer/directory share the same five-group catalog, and the four Teaching section links point to real `packets`, `sessions`, `scenarios`, `embeds` anchors. Detail/export/embed/API routes stay contextual. Resource directory includes the four learner/facilitator HTML packet links, whose pages supply the promised PDFs.

Exact current-page semantics avoid falsely calling parent/anchor links the current page; ancestor paths still highlight their group. Native disclosure buttons, `hidden` panels, Tab-order links, Escape/trigger-focus return, outside dismissal, route/hash/history closure and breakpoint focus recovery are coherent in source. Desktop and mobile use the same inventory. This is a source review, not a claim that browser interaction tests or a user study were performed by this worker; root owns rendered keyboard/mobile QA.

Search now derives canonical resource descriptions from the catalog and adds packet details, covering Results/Government/index-hub omissions. Sitemap now includes `/` and dated briefings and excludes section fragments. RSS metadata alternate remains intact.

Sent product three small copy-fidelity candidates, with no app edits: use “recorded positions” instead of “answers” for Compare; distinguish PDF slides from editable PowerPoint with speaker notes (the teaching data attaches notes explicitly to PPTX); use ballot “publication status” rather than “approval status” for the submitted/nonfinal roster. Group/item descriptions otherwise accurately distinguish historical geography, tracker vs guide, editorial Changes and method/contact. No broader audit or redundant tests run during this bounded read-only review.
