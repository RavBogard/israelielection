import type { Metadata } from "next";
import Link from "next/link";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { BuilderGlyph, PartyMapGlyph, PollsGlyph, VoteMapGlyph } from "@/components/HomeGlyphs";
import SeatGrid from "@/components/SeatGrid";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, mainPolls, parties, pollsData } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";
import { blocTotals, isExit } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import { DESCRIPTION, TEACH } from "@/lib/site";
import type { BlocId, Poll } from "@/lib/types";

// Every minute: on election night the hero shows the count as it comes in. Before then the page
// has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026" },
  description: DESCRIPTION,
};

/** Blocs in the order they fill the grid: Netanyahu's bloc first, the unaligned list, then the opposition and the Arab-led lists. */
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

const briefings = briefingsJson as Briefing[];

function Headline({ days, live }: { days: number; live: boolean }) {
  if (live) return <>Israel voted.</>;
  if (days > 1) return <>Israel votes in {days} days.</>;
  if (days === 1) return <>Israel votes tomorrow.</>;
  if (days === 0) return <>Israel votes today.</>;
  return <>Israel voted on October 27.</>;
}

/** One sentence reading the bloc numbers against 61. */
function reading(totals: Record<BlocId, number>, label: Record<BlocId, string>, live: boolean) {
  const part = (id: BlocId) => {
    const n = Math.round(totals[id]);
    const short = MAJORITY - n;
    if (short <= 0) return `${label[id]} ${live ? "has" : "polls at"} a majority of ${n}`;
    return `${label[id]} ${live ? "is" : "polls"} ${short} ${short === 1 ? "seat" : "seats"} short of a majority`;
  };
  return `The ${part("net")}; the ${label.opp} ${live ? "is" : "polls"} ${Math.max(0, MAJORITY - Math.round(totals.opp))} short.`;
}

/** The 120 seats by bloc from the current average, or from the count once it is open. */
function Race({ poll, live, days }: { poll: Poll; live: boolean; days: number }) {
  const totals = blocTotals(poll, parties);
  const label = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;
  const ordered = GRID_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => ({ ...b, seats: totals[b.id] }));
  const segments = ordered.map((b) => ({ id: b.id, seats: b.seats, color: `var(--b-${b.id})`, label: b.label }));
  const pollsters = mainPolls.map((p) => p.pollster).join(", ");
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="text">
        <h1 id="hero-h">
          <Headline days={days} live={live} />
        </h1>
        <p className="standfirst">
          {live ? (
            <>The count so far, as the 120 seats of the Knesset. A government needs {MAJORITY}.</>
          ) : (
            <>
              Where the race stands: the average of the latest {mainPolls.length} polls as the {KNESSET} seats of the Knesset. A government needs{" "}
              {MAJORITY}.
            </>
          )}
        </p>
        <dl className="blocs">
          {ordered.map((b) => (
            <div key={b.id}>
              <dt>
                <span className="sw" style={{ background: `var(--b-${b.id})` }} />
                {b.label}
              </dt>
              <dd>{fmt(Math.round(b.seats * 10) / 10)}</dd>
            </div>
          ))}
        </dl>
        <p className="read">{reading(totals, label, live)}</p>
        <p className="src">
          {live ? (
            <>
              Central Elections Committee; seats are this site&apos;s estimate from the votes counted so far. <Link href="/results">Full results</Link>
            </>
          ) : (
            <>
              One poll per pollster ({pollsters}), to {mediumDate(mainPolls[0].published)}; seats can be fractional. <Link href="/polls">All polls</Link>
            </>
          )}
        </p>
      </div>
      <div className="grid">
        <SeatGrid segments={segments} animate labelRule />
      </div>
    </section>
  );
}

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
        Today <span className="d">{label}</span>
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
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt) : null;
  const days = daysUntil(ELECTION_DAY);
  const poll = results ?? averagePoll;
  const trendPolls = allPolls.filter((p) => !isExit(p));
  return (
    <div className="home">
      <div className="wrap">
        <Race poll={poll} live={!!results} days={days} />

        <p className="start">
          New here? Start with <Link href="/how-it-works">how it works</Link>, then <Link href="/parties">the parties</Link>,{" "}
          <Link href="/issues">the issues</Link> and <Link href="/how-it-works/who-votes">who votes</Link>.
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

        <nav className="standing" aria-label="Teaching and about">
          <Link href={TEACH.href}>
            <span className="t">Teaching this election?</span>
            <span className="p">Session decks and classroom interactives for educators and rabbinic colleagues, free to use under CC BY-NC.</span>
          </Link>
          <Link href="/about">
            <span className="t">About and method</span>
            <span className="p">Why this site exists, where its information comes from, and how to correct it.</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
