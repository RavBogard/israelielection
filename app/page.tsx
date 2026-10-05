import type { Metadata } from "next";
import Link from "next/link";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import SeatGrid from "@/components/SeatGrid";
import briefingsJson from "@/data/briefings/_index.json";
import lensCharts from "@/data/charts/american-lens.json";
import note from "@/data/home-note.json";
import type { Briefing } from "@/lib/briefing";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import { DESCRIPTION, NAV_GROUPS, TEACH } from "@/lib/site";
import type { BlocId, Poll } from "@/lib/types";

// Every minute: on election night the hero shows the count as it comes in. Before then the page
// has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026" },
  description: DESCRIPTION,
};

/** One line on each section, for the index at the foot of the page. */
const BLURB: Record<string, string> = {
  "/coalition-builder": "Pick parties and see whether they reach 61, with the pledges in the way.",
  "/parties": "Every list sized by its poll average, with a sourced profile of each.",
  "/compare": "Two to four parties side by side on seven questions, including a Palestinian state.",
  "/polls": "Every seat poll of the campaign, the current average, and how each party has moved.",
  "/news": "A daily briefing, every sentence sourced, and the latest headlines.",
  "/results": "The committee's count on election night, as seats by party and bloc.",
  "/how-it-works": "How votes become seats, how a government is formed, and how Israelis cast their ballots.",
  "/how-it-works/who-votes": "Who can vote for the Knesset, who can't, and the legal findings about the gap.",
  "/issues": "Seven questions that decide how Israelis vote, and how Americans misread them.",
  "/communities": "Nine groups of Israeli voters: how many, where, how they vote, what they think.",
  "/vote-map": "How every town voted in the five elections from 2019 to 2022, list by list.",
  "/american-lens": "Why \"pro-Israel\" is not an Israeli category.",
  "/timeline": "From 1977 to this campaign, the turns that made today's map.",
  "/glossary": "The terms the coverage assumes you know, each with its source.",
  "/teach": "Decks, source sheets and discussion guides for educators.",
};

/** The first-time reader's path, in reading order. */
const START = [
  { href: "/how-it-works", label: "How it works", text: "120 seats, a 3.25% threshold, and why 61 is the only number that matters." },
  { href: "/parties", label: "The parties", text: "Fifteen lists in four blocs, each with its leader, its voters and its record." },
  { href: "/issues", label: "The issues", text: "Security, the cost of living, conscription: what Israelis say will decide their vote." },
  { href: "/how-it-works/who-votes", label: "Who votes", text: "Who has a Knesset vote, who lives under Israeli rule without one, and what the courts have found." },
];

/** Blocs in the order they fill the grid: Netanyahu's bloc first, the unaligned list, then the opposition and the Arab-led lists. */
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

const briefings = briefingsJson as Briefing[];
const considerations = lensCharts["vote-considerations"];

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

/** What this election is about, in the voters' own ranking, and what it is not about. */
function About() {
  const top = considerations.rows.slice(0, 3);
  return (
    <section className="about" aria-labelledby="about-h">
      <h2 id="about-h">What this election is about</h2>
      <div className="row">
        <ol className="considerations">
          {top.map((r) => (
            <li key={r.label}>
              <span className="n">{r.value}%</span>
              <span className="l">{r.label}</span>
            </li>
          ))}
        </ol>
        <div className="not">
          <p>
            Asked what will decide their vote, Jewish Israelis named security, the cost of living and conscription. The Palestinian question was not
            offered as an answer. For most Jewish Israeli voters, Palestinian rights and statehood are not at the center of this election.{" "}
            <Link href="/american-lens">Read why</Link>—and <Link href="/how-it-works/who-votes">who has no vote in it</Link>.
          </p>
          <p className="src">
            <a href={considerations.url}>{considerations.source}</a>, {considerations.date}, {considerations.sample}; first and second choices
            combined.
          </p>
        </div>
      </div>
    </section>
  );
}

/** The latest briefing's first sentences, with their sources. */
function Today() {
  const b = briefings[0];
  if (!b) return null;
  const date = new Date(`${b.date}T12:00:00Z`);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(date);
  return (
    <section className="today" aria-labelledby="today-h">
      <h2 id="today-h">
        Today <span className="d">{label}</span>
      </h2>
      <ul>
        {b.sentences.slice(0, 3).map((s, i) => (
          <li key={i}>
            {s.text}{" "}
            <span className="srcs">
              {s.sources.map((src, k) => (
                <a key={k} href={src.url} title={src.title}>
                  {src.outlet}
                </a>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="more">
        <Link href="/news">Full briefing and the latest headlines</Link>
      </p>
    </section>
  );
}

export default async function Page() {
  const live = await fetchCount(revalidate);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt) : null;
  const days = daysUntil(ELECTION_DAY);
  const poll = results ?? averagePoll;
  const totals = blocTotals(poll, parties);
  const thumb = GRID_ORDER.map((id) => ({ id, seats: totals[id], color: `var(--b-${id})`, label: blocs.find((b) => b.id === id)!.label }));
  const shown = new Set([...START.map((s) => s.href), "/coalition-builder", "/vote-map", TEACH.href]);
  const groups = NAV_GROUPS.map((g) => ({ label: g.label, items: [...g.items, ...(g.more ?? [])].filter((n) => !shown.has(n.href)) })).filter(
    (g) => g.items.length
  );
  return (
    <div className="home">
      <div className="wrap">
        <Race poll={poll} live={!!results} days={days} />

        <About />

        <Today />

        <section className="start" aria-labelledby="start-h">
          <h2 id="start-h">Start here</h2>
          <ol>
            {START.map((s) => (
              <li key={s.href}>
                <Link href={s.href}>{s.label}</Link>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="try" aria-labelledby="try-h">
          <h2 id="try-h">Try it</h2>
          <div className="tools">
            <Link href="/coalition-builder" className="tool">
              <SeatGrid segments={thumb} variant="meter" title="The current average as 120 seats" />
              <span className="t">Coalition Builder</span>
              <span className="p">{results ? "Build a coalition from the real results. Can you get to 61?" : "Pick parties from any poll. Can you get to 61?"}</span>
            </Link>
            <Link href="/vote-map" className="tool">
              <span className="t">Vote map</span>
              <span className="p">How every town voted in the five elections from 2019 to 2022, list by list.</span>
            </Link>
          </div>
        </section>

        {note.text && (
          <section className="note-from" aria-labelledby="note-h">
            <h2 id="note-h">A note from Daniel</h2>
            <p>{note.text}</p>
            <p className="sig">
              {note.signed}
              {note.date && <>, {mediumDate(note.date)}</>}
            </p>
          </section>
        )}

        <Link href={TEACH.href} className="teach-band">
          <span className="t">Teaching this election?</span>
          <span className="p">Session decks and class materials for educators and rabbinic colleagues, free to use under CC BY-NC.</span>
        </Link>

        <nav className="also" aria-labelledby="also-h">
          <h2 id="also-h">Also on this site</h2>
          <div className="groups">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="lbl">{g.label}</p>
                <ul>
                  {g.items.map((n) => (
                    <li key={n.href}>
                      <Link href={n.href}>{n.label}</Link>
                      <span>{BLURB[n.href]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
