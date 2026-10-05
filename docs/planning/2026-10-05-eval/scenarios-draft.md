# Teach scenario cards: draft 1 (2026-10-05)

Daniel: "make sure the teach scenario cards aren't stupid… those things tend to be dumb."

## What makes these dumb, and the rules against it
Coalition-scenario exercises fail in familiar ways: fantasy line-ups nobody proposes ("what if
Likud and the Joint List…"), "which would you choose?" questions (Americans don't vote here, and
it turns the class into advocacy), quiz questions with one right answer, prose that hard-codes seat
counts that are wrong a week later, and a moral the card announces instead of letting the numbers
show.

1. Every line-up is one Israeli politics has actually produced: formed before, proposed, polled
   as a bloc, or pledged against. No hypotheticals about who could vote.
2. The numbers make the point. The prose never states a seat total; the card computes it live
   from the poll average and links the Builder with the line-up loaded.
3. One sourced fact the class needs (lead, at most 70 words), one thing to do in the Builder
   (notice, at most 30), one question (at most 50).
4. Questions are analytic: why, what does it tell you, what would follow. No "which would you
   pick", no "how does this make you feel", no single right answer.
5. The set as a whole lets ruling 114 (the election is not about what Americans imagine) emerge
   from the arithmetic and the pledges. At most one card says it outright.
6. House terms: Liberman, Haredi, Jewish-majority lists, occupied; no "far-right" (unruled); no
   "genocide" outside quotation; no generic "the conflict".

## The four cards

### 1. Netanyahu's bloc and its two draft laws
with: likud, otzma, shas, utj, rz, poi
Lead: The six lists that make up Netanyahu's bloc in the polls have two conditions on the same
issue, pointing opposite ways. UTJ will not enter any government that does not first regulate
the status of Torah learners, "whoever leads it" (Matzav, Sep 28, 2026). People of Israel "will
not join a government that does not pass, before it is formed, a law that puts an end to draft
evasion" (JPost, Sep 2, 2026).
Notice: See whether the bloc reaches 61 in the average, then switch polls. How many of its seats
come from the two lists with conditions?
Question: If the bloc needs both lists, whose draft law passes, and what happens to the other?
What does it tell you that the condition most likely to decide the next government concerns
military service rather than the West Bank or Gaza?

### 2. The opposition without the Arab parties
with: yashar, byachad, dem, yb, res
Lead: Eisenkot's Yashar!, Bennett's B'Yachad and Liberman's Yisrael Beiteinu have pledged to
govern without Arab parties (Haaretz, Oct 1, 2026). Bennett and Liberman also rule out the
Haredi parties. This line-up adds The Democrats and Reservists–Economic, a list whose bloc is
disputed.
Notice: Count how far short of 61 this is. Then compare the gap with the seats of Joint List and
Ra'am.
Question: Why do opposition leaders think ruling out the Arab-led lists helps them win? What does
the pledge mean for the citizens whose votes elect those seats?

### 3. The 2021 precedent
with: yashar, byachad, dem, yb, res, raam
Lead: In June 2021 Mansour Abbas brought Ra'am into the Bennett–Lapid coalition, the first Arab
party to formally join an Israeli government; the coalition pledged about NIS 53 billion for Arab
communities (Times of Israel, Jun 3, 2021). Ra'am says it is open to any coalition, including one
led by Likud. Bennett now calls his campaign a break from that government, and Eisenkot says Abbas
"won't be part of my next government" (Times of Israel, Sep 26, 2026).
Notice: Add Ra'am and read the pledge warnings the Builder raises. Does the line-up reach 61 even
with Ra'am?
Question: Ra'am's 2021 deal was about budgets for Arab towns, not Palestinian statehood. Was it a
model of partnership, or a measure of its limits? Why are leaders who sat with Ra'am in 2021
ruling it out now?

### 4. A majority on paper
with: likud, yashar, byachad, yb
Lead: Likud with the three largest Jewish-majority opposition lists, and without the Haredi
parties or Netanyahu's partners on the right. Liberman rules out sitting with Netanyahu (JPost,
Oct 3, 2026). Rule-outs have bent before: in May 2020 Benny Gantz, who had campaigned to replace
Netanyahu, formed a rotation government with him (Times of Israel, May 17, 2020).
Notice: Check whether this reaches 61 in the average and in the poll least favourable to it.
Question: Suppose the leaders found a way. This government could agree on drafting Haredi men.
What would it argue about? Would the West Bank or Gaza be on its agenda, and in what terms?

## Draft 2 (after the Fable critique, 2026-10-05): to finish
Adopt the critique's revisions (full text in the session's critique output, summarised here):
- Card 1 kept: the notice adds "in which poll does People of Israel clear the threshold"; the question
  ends "Both conditions concern military service. What does that tell you about what this election is
  fought over, and what it is not?" (no West Bank/Gaza named).
- Cards 2+3 merged: "The opposition and the Arab-led lists" (yashar, byachad, dem, yb, res). Three
  models: none (2026 pledges, Haaretz Oct 1), outside support (Rabin 1992, IDI, timeline.json),
  partnership (Ra'am 2021, Times of Israel Jun 3, 2021). Fix: the Democrats did not make the pledge.
  Drop Ra'am's "open to any coalition" (undated in parties.json).
- Card 4 → 3, "A majority on paper": name the lists (Democrats out-poll YB); add Eisenkot "I do not
  rule out any Zionist party" (JPost, Sep 24, 2026); the question drops West Bank/Gaza: "what would it
  fight about, and what would it leave alone? If the numbers work and the leaders refuse, what is this
  election deciding?"
- New card 4, "Under the line" (threshold: 3.25%, 154,855 votes in 2022; Meretz and Balad fell short;
  People of Israel and Reservists–Economic near the line). Needs a per-list "clears the threshold in k
  of n polls" display instead of the seat line (add `show: "threshold"` to Scenario). Confirm "nearly
  tied in votes" against IDI/CEC bloc vote totals.
Then: fill source URLs, run an independent fact-check, write data/teach-scenarios.json, place
<Scenarios /> on /teach (tell israelielection-9b for styling), and show Daniel before merging.
Code ready but uncommitted: lib/scenarios.ts, lib/scenarios.test.ts (fails until the JSON exists),
components/Scenarios.tsx.
