import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import Link from "next/link";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { BuilderGlyph, PartyMapGlyph, PollsGlyph, VoteMapGlyph } from "@/components/HomeGlyphs";
import HomeRace from "@/components/HomeRace";
import {homeRaceModel} from "@/lib/home-race";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, exitPolls, mainPolls, parties, pollsData } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { blocRank, isExit, pollLabel, seatFigure } from "@/lib/polls";
import { citeText, findingSentence, israelDate, noNewLabel, pollSlip, sincePolls, type Slip } from "@/lib/home-since";
import CiteButton from "@/components/CiteButton";
import SeatBar from "@/components/SeatBar";
import { blocChange, blocSeries, newestPoll } from "@/lib/bloc-change";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsNow, resultsConfig } from "@/lib/results-live";
import { headline, homeHero, night, type Night } from "@/lib/results-phase";
import ExitPollBars from "@/components/results/ExitPollBars";
import { DESCRIPTION } from "@/lib/site";
import type { Poll } from "@/lib/types";

// Every minute: on election night the hero shows the count as it comes in. Before then the page
// has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026" },
  description: DESCRIPTION,
  alternates: alternates("/"),
};

const briefings = briefingsJson as Briefing[];

/** After close and before the count is past early: the channels' exit polls, never the pre-election average. */
function ExitHero({ n }: { n: Night }) {
  return <section className="hero hero-exit" aria-labelledby="hero-h"><div className="text"><h1 id="hero-h">{headline(n.phase, 0)}</h1><p className="standfirst">The channels&apos; exit polls in Knesset seats by bloc. They are estimates; the committee&apos;s count replaces them. {MAJORITY} of {KNESSET} seats is an absolute majority.</p></div>
  <div className="race-meta"><p className="race-basis">Exit polls</p>{n.phase === "early" && n.counted && <p className="race-newest">Early count: localities holding {(n.counted.share * 100).toFixed(1)}% of the voter roll are in. <Link href="/results">Follow the count</Link></p>}</div>
  <ExitPollBars config={resultsConfig} heading={null} className="home-exit" />
  <p className="race-context"><Link href="/results">Results, exit polls by list and the count method</Link>.</p>
 </section>;
}

/** Current modeled seats, with election-night freshness preserved. */
function Race({poll,live,days,phase}:{poll:Poll;live:boolean;days:number;phase:Night["phase"]}){
 const pollsters=mainPolls.map(p=>p.pollster).join(", "),newest=live?null:newestPoll(allPolls),change=live?null:blocChange(blocSeries(pollsData.polls,parties,pollsData.config));
 const model=homeRaceModel(poll,parties,blocs),net=model.rows.find(r=>r.id==="net")!,cite=live||phase!=="before"?null:citeText(poll,mainPolls.length,net.label,net.seats);
 return <section className="hero" aria-labelledby="hero-h"><div className="text"><h1 id="hero-h">{headline(phase,days)}</h1><p className="standfirst">{live?"The count so far, translated into estimated Knesset seats.":"Where the race stands, translated into modeled Knesset seats."} {MAJORITY} of {KNESSET} seats is an absolute majority.</p></div><div className="race-meta"><p className="race-basis">{live?poll.resultState?.freshness==="stale"?"Saved count, stale":"Count so far":`Normalized coalition average, ${mainPolls.length} current polls`}</p>{newest&&<p className="race-newest">Newest poll: <Link href="/polls#browser">{pollLabel(newest)}, {mediumDate(newest.published)}</Link></p>}{cite&&<p className="race-cite"><CiteButton text={cite}/></p>}</div>
 <HomeRace model={model} change={change}/>
 <p className="race-source fig-src">{live?<>{poll.resultState?.freshness==="stale"&&<b>Saved count (stale). </b>}Central Elections Committee; seats are this site’s estimate from votes counted so far. Captured {poll.resultState?.capturedAt??poll.published}. Source updated {poll.resultState?.sourceUpdatedAt??"at an unrecorded time"}. <Link href="/results">Full results and count method</Link>.</>:<>One latest eligible poll per publisher ({pollsters}), through {mediumDate(mainPolls[0].published)}. Square-root sample-size weighting, normalized coalition values; seats can be fractional.{change&&<> Change is against the average as it stood on {mediumDate(change.since)}, the last poll date at least a week before the newest.</>} <Link href="/polls#method">Average method</Link>.</>}</p>
 <p className="race-context">Explore the <Link href="/parties">Party Map</Link> or try an arrangement in the <Link href="/coalition-builder">Coalition Builder</Link>.</p>
 </section>;
}

/** Since yesterday: the newest polls as slips with one finding from the current polls, then the briefing's first two sentences. */
function Since({ now }: { now: number }) {
  const today = israelDate(now), { polls, fresh } = sincePolls(allPolls, today);
  const finding = findingSentence(mainPolls, parties, blocs), b = briefings[0];
  const briefDate = b ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${b.date}T12:00:00Z`)) : "";
  return (
    <section className="since" aria-labelledby="since-h">
      <h2 id="since-h">Since yesterday</h2>
      <div className="since-polls">
        {!fresh && <p className="since-none">{noNewLabel(polls[0])}. The newest:</p>}
        <ul className="since-slips">{polls.map((p) => <PollSlip key={p.id} slip={pollSlip(p, parties, blocs)} />)}</ul>
        {finding && <p className="since-finding">{finding} <Link href="/polls">Every poll and the average</Link></p>}
      </div>
      {b && b.sentences.length > 0 && (
        <div className="since-brief">
          <h3>{b.date === today ? "Today’s briefing" : `Briefing, ${briefDate}`}</h3>
          <ul>{b.sentences.slice(0, 2).map((s, i) => <li key={i}>{s.text} <span className="srcs">{s.sources.map((src, k) => <a key={k} href={src.url} title={src.title}>{src.outlet}</a>)}</span></li>)}</ul>
          <Link href="/news" className="more">Full briefing</Link>
        </div>
      )}
    </section>
  );
}

const slipLabel = (label: string) => label.replace(/\s*\(.*\)$/, "");
/** A single poll reports whole seats; keep a decimal only where a poll itself has one. */
const pollSeats = (s: number) => (Number.isInteger(s) ? String(s) : seatFigure(s));
function PollSlip({ slip }: { slip: Slip }) {
  // The bar runs in seat order (slip.blocs); the list under it runs in the site's bloc order.
  const listed = [...slip.blocs].sort((a, b) => blocRank(a.id) - blocRank(b.id));
  const label = `${slip.label}, ${mediumDate(slip.date)}: ${listed.map((b) => `${slipLabel(b.label)} ${pollSeats(b.seats)}`).join(", ")}`;
  return (
    <li className="since-slip">
      <p className="ss-head"><b>{slip.label}</b> <span>{shortDate(slip.date)}</span></p>
      <SeatBar segments={slip.blocs.map((b) => ({ key: b.id, seats: b.seats, color: `var(--b-${b.id})` }))} label={label} />
      <ul className="ss-blocs">{listed.map((b) => <li key={b.id} className={b.majority ? "maj" : undefined}><span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />{slipLabel(b.label)}<b>{pollSeats(b.seats)}</b></li>)}</ul>
      {slip.majority.length > 0 && <p className="ss-maj">{listed.filter((b) => b.majority).map((b) => slipLabel(b.label)).join(" and ")} at {MAJORITY} or more</p>}
      {slip.url && <a className="ss-src" href={slip.url}>Source</a>}
    </li>
  );
}

export default async function Page() {
  const now = resultsNow();
  const live = await fetchCount(revalidate, { now });
  const n = night(live, resultsConfig, now), hero = homeHero(n.phase);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : null;
  const days = daysUntil(ELECTION_DAY);
  // After close the thumbnails follow the count, else the newest exit poll; the average only before close.
  const poll = results ?? (hero === "exit" ? exitPolls[0] : undefined) ?? averagePoll;
  const trendPolls = allPolls.filter((p) => !isExit(p));
  return (
    <div className="home">
      <div className="wrap">
        {hero === "exit" ? <ExitHero n={n} /> : <Race poll={poll} live={!!results} days={days} phase={n.phase} />}

        {n.phase === "before" && <Since now={now} />}

        <p className="start">
          New here? <Link href="/start">Take a short guided route</Link>, or go straight to <Link href="/how-it-works">how it works</Link>,{" "}
          <Link href="/parties">the parties</Link> and <Link href="/how-it-works/who-votes">who votes</Link>.
        </p>

        <section className="tools" aria-labelledby="tools-h">
          <h2 id="tools-h">Try it</h2>
          <ul>
            <li>
              <Link href="/coalition-builder">
                <BuilderGlyph parties={parties} poll={poll} />
                <span className="t">Coalition Builder</span>
                <span className="p">{results ? "Build a coalition from the real results. Can you get to 61?" : "Pick parties from any poll. Can you get to 61?"}</span>
              </Link>
            </li>
            <li>
              <Link href="/parties">
                <PartyMapGlyph parties={parties} poll={poll} />
                <span className="t">Party Map</span>
                <span className="p">Every list sized by its poll average, with a sourced profile of each.</span>
              </Link>
            </li>
            <li>
              <Link href="/polls">
                <PollsGlyph polls={trendPolls} parties={parties} config={pollsData.config} />
                <span className="t">Polls</span>
                <span className="p">Every seat poll of the campaign, the current average, and how each party has moved.</span>
              </Link>
            </li>
            <li>
              <Link href="/vote-map">
                <VoteMapGlyph />
                <span className="t">Vote map</span>
                <span className="p">How every town voted in the five elections from 2019 to 2022, list by list.</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
