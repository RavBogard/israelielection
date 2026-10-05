# israelielection.org — mission and plan (filed 2026-10-05)

## Mission
A public English-language reference site on the 2026 Israeli election (Oct 27, 2026) for Americans, American Jews in particular, and for rabbis and educators who want to teach it. Built from the CRC "Israel Votes" class materials. Learning, not advocacy; every number dated and sourced; polls and news update themselves.

## Rulings (Daniel, 2026-10-05)
- Audience: general American readers AND educators/rabbinic colleagues. Two front doors: "Understand it" and "Teach it."
- Identity: Daniel's site, his byline. Not CRC-branded. About page states the learning-not-advocacy posture and the method up front.
- Hebrew: out, except party names and glossary terms.
- Jewish texts: in, as their own section (class source sheets), not mixed into reference pages.
- Trip material: out.
- Polls: auto-merge when validation passes. No human in the loop.
- Daily AI news briefing: goes live without review; every sentence links its source; Daniel gets the daily email and can kill or correct any item.
- Budget: API spend for the daily job approved; Gemini, not Anthropic (expect a few dollars a month; election week more).
- Dates: Daniel paces; no schedule in this plan.

## Content inventory
Exists (port):
- Coalition Builder v2 (artifact 8v8woAv7nwVeRfupV1tTZv) — vanilla JS; refactor pledge warnings from if-statements to a rules array.
- Party Map v2 (artifact GLQ6ws4NgPn1iNzwKzudaR) — vanilla JS treemap; client-side render.
- Shared party profile data duplicated in both → one `data/parties.json`.
- System mechanics: threshold, wasted votes, Bader-Ofer (doc 07), seats 2022, who votes/turnout, government formation clock (Oct 6 deck).
- Four tribes (Rivlin 2015; doc 05).
- Party profiles for 14–16 lists with six issue axes: draft, courts, war, West Bank, religion-state, economy (docs 11a–11d).

New — reference layer:
- Issues page: the six axes in plain language, what each party says, and what Israelis actually think (IDI Israeli Voice Index, INSS, Pew, Viterbi Center, Channel 12/13 issue polls). Real data, dated.
- Bloc sociology: the four tribes with demographic, geographic and voting data, not just description.
- Timeline 1977–2026 (planned for Oct 13; scrubbable).
- Key dates and the post-election clock (results → president's consultations → mandate → 28+14 days → possible second mandate → Knesset's 21 days).
- How Israelis vote (paper slips behind a screen, no absentee except diplomats/soldiers/ships, Election Day a holiday, soldiers' double envelopes and why the final count shifts).
- Election night: what to watch, exit polls vs. real count, live results from the Central Elections Committee (bechirot.gov.il).
- Post-election: coalition scenarios, updated as the process moves.
- Glossary.
- Sources and method page.

New — teach-it layer:
- Session decks (PDF export), source sheets, teacher's guides, discussion questions, embeds of the interactives for other educators' use. License to state (CC BY-NC proposed; Daniel to confirm).
- Torah for the election: the class texts (Berakhot 58a, the Hebron/YK/power sheets as integrated), each approved by Daniel before posting.

New — live layer:
- Polls page: all polls since dissolution, by pollster, with averages and trend; feeds the Coalition Builder and Party Map.
- News: aggregated headlines from ToI, Haaretz, JPost, Kan English, +972, JTA, Jewish Insider, Forward; refreshed every 15 minutes.
- Daily briefing: "what changed" in ~200 words, AI-written, sourced per sentence.

## Dynamic updates — design
- Repo on GitHub; Vercel deploys on push. Data lives in `data/*.json` in the repo so every change is a commit with a diff.
- Polls job (daily, GitHub Action — ruled 2026-10-05; the job's output is a commit, so Actions, not Vercel cron): Gemini reads the Wikipedia opinion-polling table for the 2026 election plus JPost/ToI roundups, writes `data/polls.json`. Validator: seats sum to 120; pollster on whitelist; fieldwork date present; no party moves more than 5 seats from its previous reading by the same pollster; parties below threshold flagged, not dropped. Pass → auto-commit → redeploy. Fail → open a PR and email Daniel.
- Party text changes (positions, pledges, leaders): the same job proposes; always a PR; Daniel merges.
- News: server-side RSS fetch with ISR revalidation (15 min). No AI.
- Briefing (daily): Gemini writes from the day's headlines; each sentence carries a source link; posted automatically; emailed to Daniel. Kill switch: delete the day's file.
- Election night: a route polling the CEC results feed every few minutes (or Kan/ToI live numbers if the CEC feed is not machine-readable; verify before Oct 27). Coalition Builder gets a "real results" poll option.
- Post-election: coalition-process tracker updated by the daily job from news; text changes via PR.

## Proof
- Every number on the site shows its date and source inline.
- Validator is a machine gate on all poll data.
- Before any text page ships: an independent fact-check pass (Opus) against primary sources; quotes checked against originals (open items in doc 09 carry over).
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
