# Site evaluation (2026-10-05, 22 days out)

Daniel asked for fresh eyes on the landing page and sweeps of the whole site for mission drift,
gaps and features. Four independent read-only reviews ran against main at 54279f6 (landing page,
drift, gaps, features), plus the content lane's own view. This is the synthesis. Nothing on the
site was changed; the decisions below are Daniel's.

## The mission the site is judged against
docs/00-PLAN.md (2026-10-05 morning) says neutral English-language reference for Americans and
educators. RULINGS.md Part 5 (114 to 118, later the same day) moves the centre: the site's message
is that this election is not about what Americans imagine; the Palestinian question's absence from
the Jewish-majority race is documented in the site's voice; err toward Palestinian dignity while
staying educational, not advocacy. The plan's "neutral reference voice" line is superseded and
should be amended so later editors stop measuring against it.

## 1. The landing page
Verdict (all five reviewers agree): the hero is right, the rest is a leftover. "Israel votes in 22
days" plus the 120-seat grid says what the site is, what day it is and where the race stands. But
the whole Coalition Builder sits under it (1,975 px at desktop; the site index starts three screens
down, about 4,500 px down on a phone). The Builder was the site when the site was one artifact. It
is now one of twelve tools and the home page was never re-cut.

Other findings:
- The nav lists Coalition Builder at `/`, so it has no address of its own; it cannot be linked
  from Teach, embedded, or shared as a tool.
- Nothing on the home page says what the blocs are, or what the election is not about. The hero
  frames the race as a horse race among Jewish-majority blocs, the opposite of the central message
  in ruling 114. One sentence reading the numbers and one line pointing at the American lens and
  who-votes would carry it.
- The daily briefing is invisible from home. It is the one thing that makes a return visit worth
  it, and the page is static apart from the countdown.
- No human voice. The plan calls for Daniel's signed intro on the home page and About; there is no
  About page.
- The 44-item Sources box belongs to the Builder, not the landing page.
- Phase logic already exists (hero and results flip to the live count), so election-night and
  post-election home pages are cheap.

Recommended landing page, in order:
1. Hero as now, plus one sentence reading the numbers and one line on what this election is not
   about (links: American lens, Who votes).
2. Today: the latest briefing's first three sentences with their outlet links. Already revalidates.
3. Start here: four cards for the first-time American reader: How it works, The parties, The
   issues, Who votes.
4. Try it: two cards, Coalition Builder (thumbnail, "Can you get to 61?") and Vote map. The
   Builder moves to `/coalition-builder`; `/#build` redirects.
5. A note from Daniel, about 120 words, signed, linking to About.
6. Teach: one band, "Decks, source sheets and discussion guides, CC BY-NC."
7. Also on this site, compact.

Election night: Today becomes "Tonight: what to watch" (exit polls 10 pm Israel, 3 pm ET, double
envelopes); the Builder card moves to second, "Build a coalition from the real results." After:
headline "Israel voted. Who can form a government?"; Today tracks the consultations and the
28+14-day clock. Long tail: "Israel's 2026 election, explained"; Teach moves up.

Alternative the reviewer rejected: keep the Builder on home but collapsed to its scoreboard. A
half-visible interactive is worse than a clear card, and the Builder gains more from its own URL.

## 2. Mission drift
Content drift is low: everything served is about the election, its system, voters, parties or
teaching it. No congregation branding, no trip material, no texts leaking into reference pages.
Hebrew is confined to ballot letters as the committee prints them (log as a ruling extension) and
the glossary. The drift is of two other kinds:
- Promise versus delivery. The footer and `/teach` advertise "source sheets, teacher's guides and
  discussion questions"; one deck exists. The deck's notes still carry class-calendar copy ("We
  finish on December 15 with Hebron"). Reword to "Session decks" until the sheets ship; strip the
  calendar from the public deck.
- Ruling-made redundancy. The Palestinian-question evidence (IDI Aug 31 to Sep 3, Pew, CHES, the
  Lapid and Netanyahu quotes, ICJ, ICC and UN inquiry) appears on four pages; the lens re-does
  both the party table (palestinian-state) and the legal record (who-votes). Keep the lens's
  thesis; cut its legal-record paragraph to a sentence linking who-votes; let palestinian-state
  own the table.

Smaller items: internal notes rendered to readers (`/results` prints "the committee's list page
was down when checked (Oct 5)"; `/parties` prints a corrections changelog); 19 numbers in
parties.json sourced to bare "IDI" with no date or URL; the Sources component tells readers quotes
"have not yet been checked against the originals", which contradicts the Proof rule (cut, do not
hedge); the `/polls` seat grid duplicates its own table (drop it); "far-right" used in page voice
on settlers and haredim (unruled). Tone is attributive throughout; advocacy vocabulary appears
only inside quotations; 117 and 118 are met. Several pages sit at their word ceilings (war, West
Bank, American lens, who-votes) and are accreting.

## 3. Gaps
Reference and live layers are ahead of plan. Every route returns 200 with substantive content;
skip link, focus styles, reduced motion, dark mode and chart data tables are in place. Missing:
- Identity and trust: About page with the signed intro and method; a Sources and method page
  (validator rules, the average, the Wikipedia rule, the Bing fallback, the Gemini briefing rules,
  the fact-check process); sitemap, robots, a custom 404.
- The weeks after Oct 27: no key-dates page, no government-formation tracker with real dates, no
  coalition scenarios; the forming-a-government guide says it "lists no calendar dates".
- Election night: `/results` before the count shows letters and method only; no "what to watch",
  no US times, no exit-poll caution.
- Teach: no source sheets, guides or discussion questions; no Jewish-texts section; no embeds; no
  print styles; nothing on Teach for who-votes, the hardest classroom conversation.
- Newcomer: no prose answer to "who is running" (the contenders for prime minister) or "what does
  it mean for the US" (Iran, Gaza, the administration, aid). Who-votes, the most clarifying page
  for Americans, is reachable only from How it works and a few cross-links; the glossary's
  Palestinian terms (Occupied, West Bank, Annexation, Area C) do not link it.
- Briefing has no per-day permalink and no RSS feed; the archive is a details element capped at 13.
- Still open from the content sweep: Palestinian voices on the war and who-votes pages, the dual
  legal system sentence, the Gaza toll and famine finding on the timeline, "Gazans" wording in
  parties.json, the deck checklist, and the "Zionist opposition" bloc label (ruling 112 tension),
  which sits on home, polls, results and the glossary.
- Known open sourcing items: the Israeli toll since Oct 7 cites Arutz Sheva only; the Sasson
  Report outpost definition is unsourced; the Zehut and Religious Zionism list relationship is
  unclear.

## 4. Features worth building (ranked by value per effort)
Two passes: the first against the plan, the second re-weighted for rulings 114 to 118. The
mission-weighted list first:
1. A "What this election is about" strip under the hero: IDI's top three vote considerations
   (security 39, cost of living 38, conscription 27), "a Palestinian state is a stated goal of 2 of
   15 lists" from the positions files, and the sourced count of people under Israeli rule with no
   Knesset vote (from who-votes). Small. It is the central message in data and the counterweight
   to the horse-race hero. Every figure attributed.
2. Party comparison on the six axes plus a seventh column, "A Palestinian state", with empty cells
   shown as "declined" or "no position found" (Likud's refusal is itself the finding). Medium.
3. Formation clock page with real dates, plus a "who is at the table" line stating which lists the
   president consulted and that no Palestinian in the West Bank or Gaza had a vote in the result
   being negotiated. Small to medium; needed from Oct 28.
4. Live locality results on the vote map on the night, with turnout in Palestinian-citizen
   localities against the national figure: the one night-of story the bloc grid cannot tell.
   Medium to large; depends on confirming the committee's CSV header before Oct 27.
5. Threshold what-if on the seats guide, led by representation lost rather than majorities gained.
6. Instead of a party-match quiz: a five-question "What do you expect?" check (expected against
   actual: top issues, who has a vote, how many lists want a state), answered from the lens charts.

The plan-weighted list, which holds for the mechanics:
1. Election-night package: a results strip in the masthead on every page when the count is open;
   threshold watch on `/results` (lists within half a point, seats if they pass or fail); exit
   polls as poll entries (bypass the five-seat validator for that kind) so the Builder offers
   "Channel 12 exit poll"; a full dress rehearsal with the committee's feed. Small; cannot slip.
2. Government-formation clock page with real dates, computed from the certification date, updated
   by the daily job by PR. Medium; needed from about Nov 4.
3. Embeddable widgets (`/embed/grid`, `/embed/average`, `/embed/builder`) with copy-embed code on
   Teach. Medium; teaching has started.
4. Party comparison on the six issue axes. Small to medium; the data is complete.
5. Shareable coalition card: the Satori grid as an image for `/?with=` links. Medium.
6. RSS feed and a methodology page. Small.
7. Glossary terms auto-linked on first use in articles. Small to medium.
8. A per-page "last checked / what changed" note.

Rejected: a party-match quiz (Americans do not vote; drifts to advocacy), an email list (holds
real people's data; point an RSS-to-email service at the feed), PDF generation (browsers print),
a Hebrew ballot-letter page (the letters table on `/results` exists; make it filterable).

Weighed against ruling 114: the polls apparatus (trend lines, house variants, Party Map, Builder)
is the heaviest part of the site and reinforces the horse-race frame; right to keep, but the part
to demote. A "Palestinians and this election" hub tying who-votes, palestinian-state, West Bank,
war and palestinian-citizens together would carry the central message directly.

## Decisions for Daniel
1. Move the Coalition Builder to its own page and re-cut the home page as above.
2. The one line on what this election is not about: his wording.
3. About page and the signed home-page note: his words.
4. Amend 00-PLAN voice to record rulings 114 to 118.
5. Teach: reword the promise now, or ship the sheets.
6. Build order: election-night package this week; government tracker next; embeds and comparison
   as time allows.
