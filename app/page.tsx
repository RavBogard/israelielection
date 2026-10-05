import type { Metadata } from "next";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/home.css";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import SeatGrid from "@/components/SeatGrid";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import { DESCRIPTION, NAV_GROUPS, TEACH } from "@/lib/site";
import type { BlocId, Poll } from "@/lib/types";

// Every minute: on election night the builder adds the count as it comes in. Before then
// the page has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026" },
  description: DESCRIPTION,
};

/** One line on each section, for the index at the foot of the page. */
const BLURB: Record<string, string> = {
  "/parties": "Every list sized by its poll average, with a sourced profile of each.",
  "/polls": "Every seat poll of the campaign, the current average, and how each party has moved.",
  "/news": "A daily briefing, every sentence sourced, and the latest headlines.",
  "/results": "The committee's count on election night, as seats by party and bloc.",
  "/how-it-works": "How votes become seats, how a government is formed, and how Israelis cast their ballots.",
  "/issues": "Seven questions that decide how Israelis vote, and how Americans misread them.",
  "/communities": "Nine groups of Israeli voters: how many, where, how they vote, what they think.",
  "/vote-map": "How every town voted in the five elections from 2019 to 2022, list by list.",
  "/american-lens": "Why \"pro-Israel\" is not an Israeli category.",
  "/teach": "Decks, source sheets and discussion guides for educators.",
};

/** Blocs in the order they fill the grid: Netanyahu's bloc first, the unaligned list, then the opposition and the Arab-led lists. */
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

function Headline({ days }: { days: number }) {
  if (days > 1) return <>Israel votes in {days} days.</>;
  if (days === 1) return <>Israel votes tomorrow.</>;
  if (days === 0) return <>Israel votes today.</>;
  return <>Israel voted on October 27.</>;
}

/** The 120 seats by bloc from the current average, or from the count once it is open. */
function Race({ poll, live, days }: { poll: Poll; live: boolean; days: number }) {
  const totals = blocTotals(poll, parties);
  const ordered = GRID_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => ({ ...b, seats: totals[b.id] }));
  const segments = ordered.map((b) => ({ id: b.id, seats: b.seats, color: `var(--b-${b.id})`, label: b.label }));
  const pollsters = mainPolls.map((p) => p.pollster).join(", ");
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="text">
        <h1 id="hero-h">
          <Headline days={days} />
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

export default async function Page() {
  const live = await fetchCount(revalidate);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt) : null;
  const days = daysUntil(ELECTION_DAY);
  const groups = [...NAV_GROUPS.map((g) => ({ label: g.label, items: [...g.items, ...(g.more ?? [])].filter((n) => n.href !== "/") })), { label: TEACH.label, items: [TEACH] }];
  return (
    <div className="ix home">
      <div className="wrap">
        <Race poll={results ?? averagePoll} live={!!results} days={days} />

        <section id="build" className="build" aria-label="Coalition Builder">
          <CoalitionBuilder results={results} embedded />
        </section>

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

        <SourcesBox count={allPolls.length + 10}>
          <PollSources />
          <li>
            <b>Blue and White</b> below threshold in all polls; Gantz will drop out in the last week if not crossing: Times of Israel, Sep 20,
            2026.
          </li>
          <li>
            <b>Pledges.</b> Zionist opposition to govern without Arab parties: Haaretz, Oct 1, 2026 (headline). B&apos;Yachad &ldquo;only rely on
            Zionist parties&rdquo;: Times of Israel, Apr 26, 2026; no Arab or Haredi parties: Times of Israel, May 27, 2026. Joint List won&apos;t
            join Netanyahu: Times of Israel, Aug 19, 2026. Eisenkot on Ra&apos;am (&ldquo;he won&apos;t be part of my next government&rdquo;):
            Times of Israel, Sep 26, 2026. Liberman, &ldquo;not for the Arab parties and not for the haredi parties&rdquo;: Jerusalem Post, Sep
            21, 2025, repeated Oct 3, 2026. UTJ condition (Yaakov Asher): Matzav, Sep 28, 2026.
          </li>
          <li>
            <b>Surplus-vote agreements.</b> Yashar–Democrats and B&apos;Yachad–Yisrael Beiteinu signed Sep 10, 2026 (Times of Israel).
            Likud–Religious Zionism agreed Sep 8 (Israel Hayom), reported unsigned Sep 15 (Channel 14); final status not found. Joint List–Ra&apos;am:
            Ynet, Sep 11, and Jerusalem Post, Sep 13, 2026. Shas–UTJ &ldquo;expected&rdquo;: Jerusalem Post, Sep 10, 2026; signing not found. Otzma,
            People of Israel and Reservists: no partner found (an IPF listing of Reservists with Yisrael Beiteinu is unconfirmed, since Yisrael
            Beiteinu signed with B&apos;Yachad).
          </li>
          <li>
            <b>Lists.</b> UTJ order (Asher 1, Goldknopf 2, Porush 4): Davar and Israel Hayom, Sep 8, 2026. Ra&apos;am no. 2 Yoav Segalovitz:
            Jerusalem Post and Times of Israel, Aug 31, 2026. B&apos;Yachad (Yesh Atid runs inside the list, Lapid no. 2): Times of Israel, Sep 6,
            2026; deal signed Apr 25–26, 2026 (Jerusalem Post).
          </li>
          <li>
            <b>Disqualification and court ruling:</b> Central Elections Committee vote Sep 23, 2026 (Times of Israel); Supreme Court ruling Oct 2,
            2026, hearing Oct 1 (Jerusalem Post; Al Jazeera, Oct 2, 2026).
          </li>
          <li>
            <b>Bloc labels and leaders:</b> Israel Policy Forum 120 Project, updated Sep 24, 2026; Jerusalem Post Sep 7, 2026; Times of Israel Aug
            19 and Sep 6, 2026. Reservists–Economic&apos;s bloc is disputed (IsraelEd: would join Netanyahu; IPF: &ldquo;third bloc&rdquo;; ToI:
            non-aligned), so it is shown between the blocs.
          </li>
          <li>
            <b>Ballot letters:</b> {resultsConfig.lettersSource}
          </li>
          <ProfileSources />
          <li>
            <b>61-seat majority:</b> Israel Democracy Institute, Apr 15, 2026.
          </li>
          <li>
            <b>Electoral threshold:</b> {resultsConfig.thresholdSource}
          </li>
        </SourcesBox>
      </div>
    </div>
  );
}
