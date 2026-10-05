# israelielection.org — mission and plan (filed 2026-10-05)

## Mission
A public English-language reference site on the 2026 Israeli election (Oct 27, 2026) for Americans, American Jews in particular, and for rabbis and educators who want to teach it. Built from the CRC "Israel Votes" class materials. Every number dated and sourced; polls and news update themselves.

## Rulings (Daniel, 2026-10-05)
- Audience: general American readers AND educators/rabbinic colleagues. Two front doors: "Understand it" and "Teach it."
- Identity: Daniel's site, his byline. Not CRC-branded. About page states the method up front and carries his signed intro.
- "Learning, not advocacy" was the CLASS ruling, not the site's. Daniel struck it from the site plan 2026-10-05. Do not apply it to site copy.
- Hebrew: out, except party names and glossary terms.
- Jewish texts: occasional downloadable class sheets only, each approved by Daniel before publication. No separate Jewish-texts section; traditional Jewish texts are not a major focus of this site (Daniel, 2026-10-05).
- Trip material: out.
- Polls: auto-merge when validation passes. No human in the loop.
- Daily AI news briefing: goes live without review; every sentence links its source; Daniel gets the daily email and can kill or correct any item.
- Budget: API spend for the daily job approved; Gemini, not Anthropic (expect a few dollars a month; election week more).
- Dates: Daniel paces; no schedule in this plan. Additional teaching materials are added as they are ready, with no public release deadline (Daniel, 2026-10-05).

## Content inventory
Exists (port):
- Coalition Builder v2 (artifact 8v8woAv7nwVeRfupV1tTZv) — vanilla JS; refactor pledge warnings from if-statements to a rules array.
- Party Map v2 (artifact GLQ6ws4NgPn1iNzwKzudaR) — vanilla JS treemap; client-side render.
- Shared party profile data duplicated in both → one `data/parties.json`.
- System mechanics: threshold, wasted votes, Bader-Ofer (doc 07), seats 2022, who votes/turnout, government formation clock (Oct 6 deck).
- Four tribes (Rivlin 2015; doc 05).
- Party profiles for 14–16 lists with six issue axes: draft, courts, war, West Bank, religion-state, economy (docs 11a–11d).

New — reference layer:
- Issues pages and sociology pages: see the spec section below.
- American lens page: how American Jewish discourse maps and fails to map onto Israeli politics. One page.
- Timeline 1977–2026 (planned for Oct 13; scrubbable).
- Key dates and the post-election clock (results → president's consultations → mandate → 28+14 days → possible second mandate → Knesset's 21 days).
- How Israelis vote (paper slips behind a screen, no absentee except diplomats/soldiers/ships, Election Day a holiday, soldiers' double envelopes and why the final count shifts).
- Election night: what to watch, exit polls vs. real count, live results from the Central Elections Committee (bechirot.gov.il).
- Post-election: coalition scenarios, updated as the process moves.
- Glossary.
- Sources and method page.

New — teach-it layer:
- Session decks (PDF export), source sheets, teacher's guides, discussion questions, embeds of the interactives for other educators' use. License to state (CC BY-NC proposed; Daniel to confirm).
- Occasional Jewish-text class sheets, if Daniel chooses to include them, offered as downloads under Teaching resources. Each sheet requires his approval before publication; no `/teach/texts` route or promised series.

New — live layer:
- Polls page: all polls since dissolution, by pollster, with averages and trend; feeds the Coalition Builder and Party Map.
- News: aggregated headlines from ToI, Haaretz, JPost, Kan English, +972, JTA, Jewish Insider, Forward; refreshed every 15 minutes.
- Daily briefing: "what changed" in ~200 words, AI-written, sourced per sentence.

## Issues and sociology layer — spec (ruled 2026-10-05)
Issues (seven pages): Haredi draft; courts and the judicial overhaul; the war and the hostages; West Bank and annexation; religion and state; cost of living and the economy; and "what is not on the ballot" (a Palestinian state, the peace process — why not, and what is there instead).
Each issue page, 800–1,200 words plus 2–3 charts, in four parts: (1) what is at stake, plain language; (2) what Israelis actually think — survey data broken down by group, with charts; (3) what each party says, with source; (4) how an American reader is likely to misread this issue.

Sociology (nine pages, flat, no tribes hierarchy): Secular Ashkenazi / "Tel Aviv" Israel; Mizrahi-traditional (masorti) Israel; Religious Zionists; Haredim (Ashkenazi and Sephardi noted); Russian-speaking Israelis; Ethiopian-Israelis; Palestinian citizens of Israel (Muslim, Christian, Bedouin inside); Druze; Settlers (cross-cutting; 36/36/28 composition, dated).
Each group page carries: size, growth and geography (CBS); voting pattern 2019–2022 computed from CEC results by locality; attitudes on each of the six issues (IDI, INSS, INES cross-tabs); and lived texture — who they are, one or two voices from public interviews, sourced.
Terminology: "Palestinian citizens of Israel" first, "Arab Israelis" noted, and the naming dispute explained on the page.

Vote map: interactive choropleth of Israel by locality, 2022 results (and 2026 after Oct 27), party filter. Data prep script from CEC locality results + public GIS boundaries. Heaviest interactive on the site.

Data tier: free public sources plus academic datasets (INES microdata and similar). Every data point carries source, date, sample size where known, and a link a reader can follow. Nothing paywalled.

Voice: Educational, not advocacy. Explain what is shaping the election and what is largely absent from its debate, following rulings 114–118. Source factual claims and distinguish evidence from interpretation. Use precise language: “occupied West Bank”; no generic “the conflict” in the site’s own voice. State legal findings and charges fully and attribute them first, with Israel’s rejection in one sentence. Use “genocide” only in direct quotations from courts, UN bodies or rights groups, or in case names. Daniel’s signed introductions appear on the homepage and About.

American lens page: one page; why "pro-Israel" is not an Israeli category, why Israeli left/right don't line up with American ones, where US and Israeli fights rhyme and where they don't. Fact-checked like every other page.

Review flow: research → one-page brief per topic (findings, chart data, open questions, framing choices flagged) → Daniel rules on the briefs in one sitting → page drafts and JSON written → handoff to Code. One pass from Daniel.

Output format for Code: `data/issues.json`, `data/groups.json`, `data/surveys.json` (every datapoint: value, source, date, url, sample), `data/localities-2022.json` for the map; page copy as MDX in `content/issues/*.mdx`, `content/groups/*.mdx`, `content/american-lens.mdx`; research files under `docs/research/`.

Update cadence: issue polling refreshes when IDI/INSS publish (monthly); the daily job proposes; text changes go by PR for Daniel to merge.

## Dynamic updates — design
- Repo on GitHub; Vercel deploys on push. Data lives in `data/*.json` in the repo so every change is a commit with a diff.
- Polls job (daily, GitHub Action — ruled 2026-10-05; the job's output is a commit, so Actions, not Vercel cron): Claude reads the Wikipedia opinion-polling table for the 2026 election plus JPost/ToI roundups, writes `data/polls.json`. Validator: seats sum to 120; pollster on whitelist; fieldwork date present; no party moves more than 5 seats from its previous reading by the same pollster; parties below threshold flagged, not dropped. Pass → auto-commit → redeploy. Fail → open a PR and email Daniel.
- Party text changes (positions, pledges, leaders): the same job proposes; well-sourced changes merge automatically (Daniel, 2026-10-05: "hands off as possible"); a leader or status change reported by a single outlet goes to a PR.
- News: server-side RSS fetch with ISR revalidation (15 min). No AI.
- Briefing (daily): Claude writes from the day's headlines; each sentence carries a source link; posted automatically; emailed to Daniel. Kill switch: delete the day's file.
- Election night: a route polling the CEC results feed every few minutes (or Kan/ToI live numbers if the CEC feed is not machine-readable; verify before Oct 27). Coalition Builder gets a "real results" poll option.
- Post-election: coalition-process tracker updated by the daily job from news; text changes via PR.

## Proof
- Every number on the site shows its date and source inline.
- Validator is a machine gate on all poll data.
- Before any text page ships: an independent fact-check pass (Opus) against primary sources; anything that can't be verified is cut, not hedged; quotes checked against originals (open items in doc 09 carry over).
- Visual check of every page at phone and desktop width before launch.

## Authority
- Claude decides and logs: stack details, component structure, styling, copy edits that don't change meaning.
- Machine gates: poll validator, build, type-check, link-check.
- Daniel: anything that changes a party's stated position; any text in his voice; the About/method page; license; money beyond the approved daily job.

## Stack
Next.js (App Router, TypeScript) on Vercel; data as JSON in repo; Tailwind; no database at launch; Resend or similar for the daily email; Gemini API (model: Gemini Flash 3.8, Daniel's ruling 2026-10-05) for the jobs, key in env as GEMINI_API_KEY; GitHub Actions for the schedule.

## Lanes
- Cowork: research campaign for the issues/data and bloc-sociology pages; fact-check panels; copy; this plan.
- Code: repo setup, port, build, jobs, deploy.

## Open
- GitHub repo name and owner (Daniel). Proposed: `israelielection`.
- Domain purchase and Vercel project connection (Daniel).
- Gemini API key: in place as GEMINI_API_KEY in both GitHub secrets and Vercel env (2026-10-05).
- License for teach-it materials (CC BY-NC proposed).
- CEC live feed machine-readability (verify).
