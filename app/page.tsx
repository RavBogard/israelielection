import type { Metadata } from "next";
import Link from "next/link";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { BuilderGlyph, PartyMapGlyph, PollsGlyph, VoteMapGlyph } from "@/components/HomeGlyphs";
import HomeRace from "@/components/HomeRace";
import {homeRaceModel} from "@/lib/home-race";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, mainPolls, parties, pollsData } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { isExit } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import { DESCRIPTION } from "@/lib/site";
import type { Poll } from "@/lib/types";

// Every minute: on election night the hero shows the count as it comes in. Before then the page
// has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026" },
  description: DESCRIPTION,
};

const briefings = briefingsJson as Briefing[];

function Headline({ days, live }: { days: number; live: boolean }) {
  if (live) return <>Israel voted.</>;
  if (days > 1) return <>Israel votes in {days} days.</>;
  if (days === 1) return <>Israel votes tomorrow.</>;
  if (days === 0) return <>Israel votes today.</>;
  return <>Israel voted on October 27.</>;
}

/** Current modeled seats, with election-night freshness preserved. */
function Race({poll,live,days}:{poll:Poll;live:boolean;days:number}){
 const pollsters=mainPolls.map(p=>p.pollster).join(", ");
 return <section className="hero" aria-labelledby="hero-h"><div className="text"><h1 id="hero-h"><Headline days={days} live={live}/></h1><p className="standfirst">{live?"The count so far, translated into estimated Knesset seats.":"Where the race stands, translated into modeled Knesset seats."} {MAJORITY} of {KNESSET} seats is an absolute majority.</p><p className="race-basis">{live?poll.resultState?.freshness==="stale"?"Saved count, stale":"Count so far":`Normalized coalition average, ${mainPolls.length} current polls`}</p></div>
 <HomeRace model={homeRaceModel(poll,parties,blocs)}/>
 <p className="race-source src">{live?<>{poll.resultState?.freshness==="stale"&&<b>Saved count (stale). </b>}Central Elections Committee; seats are this site’s estimate from votes counted so far. Captured {poll.resultState?.capturedAt??poll.published}. Source updated {poll.resultState?.sourceUpdatedAt??"at an unrecorded time"}. <Link href="/results">Full results and count method</Link>.</>:<>One latest eligible poll per publisher ({pollsters}), through {mediumDate(mainPolls[0].published)}. Square-root sample-size weighting, normalized coalition values; seats can be fractional. <Link href="/polls#method">Average method</Link>.</>}</p>
 <p className="race-context">These political groupings do not establish coalition agreements. Explore the <Link href="/parties">Party Map</Link> or try an arrangement in the <Link href="/coalition-builder">Coalition Builder</Link>.</p>
 </section>;
}

/** Today's date in Israel, as YYYY-MM-DD, so a briefing from an earlier day is not called today's. */
const israelToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

/** The latest briefing's first sentence, with its sources, as one line. */
function Today() {
  const b = briefings[0];
  const s = b?.sentences[0];
  if (!b || !s) return null;
  const date = new Date(`${b.date}T12:00:00Z`);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(date);
  return (
    <section className="today" aria-labelledby="today-h">
      <h2 id="today-h">
        {b.date === israelToday() ? "Today" : "Latest briefing"} <span className="d">{label}</span>
      </h2>
      <p>
        {s.text}{" "}
        <span className="srcs">
          {s.sources.map((src, k) => (
            <a key={k} href={src.url} title={src.title}>
              {src.outlet}
            </a>
          ))}
        </span>
      </p>
      <Link href="/news" className="more">
        Full briefing and the latest headlines
      </Link>
    </section>
  );
}

export default async function Page() {
  const live = await fetchCount(revalidate);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : null;
  const days = daysUntil(ELECTION_DAY);
  const poll = results ?? averagePoll;
  const trendPolls = allPolls.filter((p) => !isExit(p));
  return (
    <div className="home">
      <div className="wrap">
        <Race poll={poll} live={!!results} days={days} />

        <p className="start">
          New here? <Link href="/start">Take a short guided route</Link>, or go straight to <Link href="/how-it-works">how it works</Link>,{" "}
          <Link href="/parties">the parties</Link> and <Link href="/how-it-works/who-votes">who votes</Link>.
        </p>

        <Today />

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

        <nav className="standing" aria-label="About">
          <Link href="/about">
            <span className="t">About and method</span>
            <span className="p">Why this site exists, where its information comes from, and how to correct it.</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
