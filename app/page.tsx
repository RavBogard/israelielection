import type { Metadata } from "next";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/home.css";
import { ELECTION_DAY } from "@/components/Banner";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import { PollSources, ProfileSources } from "@/components/Sources";
import { KNESSET, MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import { DESCRIPTION } from "@/lib/site";
import type { BlocId, Poll } from "@/lib/types";

// Every minute: on election night the builder adds the count as it comes in. Before then
// the page has nothing to fetch, so regenerating it is cheap.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Israel Votes 2026: Build a Coalition" },
  description: "Pick a poll, add parties, and see whether they reach 61 of the Knesset's 120 seats, with each party's recorded coalition pledges.",
};

/** The sections of the site, with the description each page already carries. */
const SECTIONS = [
  { href: "#build", title: "Coalition Builder", text: "Pick a poll, add parties, and see whether they reach 61 of the Knesset's 120 seats, with each party's recorded coalition pledges." },
  { href: "/parties", title: "Party Map", text: "Israel's 2026 parties sized by their average poll standing, grouped by bloc, with a sourced profile of each." },
  { href: "/polls", title: "Polls", text: "Every Knesset seat poll of the 2026 campaign we track, the current average, and how each party has moved." },
  { href: "/news", title: "News", text: "A daily briefing on what changed in Israel's 2026 election, every sentence sourced, plus the latest headlines from English-language outlets." },
  { href: "/results", title: "Results", text: "Election-night results for Israel's 2026 Knesset election from the Central Elections Committee's count, with seats by party and bloc." },
  { href: "/teach", title: "Teach it", text: "Class materials on Israel's 2026 election for educators and rabbinic colleagues: decks, source sheets, discussion guides." },
];

/** Blocs in the order they sit on the strip: Netanyahu's bloc from the left, the unaligned list between, the opposition and Arab-led lists from the right. */
const STRIP_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

function daysUntil(iso: string) {
  return Math.ceil((Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86_400_000);
}

function Headline({ days }: { days: number }) {
  if (days > 1) return <>Israel votes in <span className="n">{days}</span> days.</>;
  if (days === 1) return <>Israel votes tomorrow.</>;
  if (days === 0) return <>Israel votes today.</>;
  return <>Israel voted on October 27.</>;
}

/** The 120 seats by bloc from the current average, or from the count once it is open. */
function Race({ poll, live }: { poll: Poll; live: boolean }) {
  const totals = blocTotals(poll, parties);
  const ordered = STRIP_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => ({ ...b, seats: totals[b.id] }));
  const placed = ordered.reduce((s, b) => s + b.seats, 0);
  const rest = Math.max(0, KNESSET - placed);
  const pollsters = mainPolls.map((p) => p.pollster).join(", ");
  return (
    <section className="race" aria-labelledby="race-h">
      <div className="head">
        <h2 id="race-h">{live ? "The count so far" : "Where the race stands"}</h2>
        <span className="when">{live ? "Central Elections Committee" : `Polls to ${mediumDate(mainPolls[0].published)}`}</span>
      </div>
      <div className="stripwrap" role="img" aria-label={`${ordered.map((b) => `${b.label} ${fmt(b.seats)}`).join(", ")}; ${MAJORITY} of ${KNESSET} is a majority`}>
        <div className="strip">
          {ordered.filter((b) => b.seats > 0).map((b) => (
            <span key={b.id} className={b.seats < 6 ? "small" : undefined} style={{ flexGrow: b.seats, background: `var(--b-${b.id})`, color: `var(--b-${b.id}-ink)` }}>
              {fmt(Math.round(b.seats))}
            </span>
          ))}
          {rest > 0.5 && <span className={`other${rest < 6 ? " small" : ""}`} style={{ flexGrow: rest }}>{fmt(Math.round(rest))}</span>}
        </div>
        <i className="m61" style={{ left: `${(MAJORITY / KNESSET) * 100}%` }} aria-hidden="true" />
      </div>
      <ul className="legend">
        {ordered.map((b) => (
          <li key={b.id}>
            <span className="sw" style={{ background: `var(--b-${b.id})` }} />
            {b.label}
            <b>{fmt(Math.round(b.seats * 10) / 10)}</b>
          </li>
        ))}
      </ul>
      <ul className="facts" aria-label="Key numbers">
        <li><b>{KNESSET}</b><span>Knesset seats</span></li>
        <li><b>{MAJORITY}</b><span>for a majority</span></li>
        <li><b>{resultsConfig.threshold * 100}%</b><span>electoral threshold</span></li>
        <li><b>{allPolls.length}</b><span>polls tracked</span></li>
      </ul>
      <p className="foot">
        {live ? (
          <>
            Seats are this site&apos;s estimate from the votes counted so far. <Link href="/results">Full results →</Link>
          </>
        ) : (
          <>
            Average of the latest {mainPolls.length} polls, one per pollster ({pollsters}); seats can be fractional. <Link href="/polls">All polls →</Link>
          </>
        )}
      </p>
    </section>
  );
}

export default async function Page() {
  const live = await fetchCount(revalidate);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt) : null;
  const days = daysUntil(ELECTION_DAY);
  return (
    <div className="ix home">
      <div className="wrap">
        <header className="hero">
          <div>
            <p className="eyebrow">Knesset election · Tuesday, October 27, 2026</p>
            <h1>
              <Headline days={days} />
            </h1>
            <p className="dek">{DESCRIPTION}</p>
            <p className="cta">
              <a className="primary" href="#build">
                Build a coalition <span aria-hidden="true">↓</span>
              </a>
              <Link className="secondary" href="/parties">
                See the Party Map →
              </Link>
            </p>
          </div>
          <Race poll={results ?? averagePoll} live={!!results} />
        </header>

        <nav className="index" aria-labelledby="index-h">
          <p className="eyebrow" id="index-h">On this site</p>
          <ol>
            {SECTIONS.map((s, i) => (
              <li key={s.href}>
                {s.href.startsWith("#") ? (
                  <a href={s.href}>
                    <span className="no">{String(i + 1).padStart(2, "0")}</span>
                    <span className="t">{s.title}</span>
                    <span className="d">{s.text}</span>
                  </a>
                ) : (
                  <Link href={s.href}>
                    <span className="no">{String(i + 1).padStart(2, "0")}</span>
                    <span className="t">{s.title}</span>
                    <span className="d">{s.text}</span>
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <section id="build" className="build" aria-label="Coalition Builder">
          <CoalitionBuilder results={results} embedded />
        </section>

        <footer className="pagefoot">
          <h2>Sources</h2>
          <ol>
            <PollSources />
            <li>
              <b>Blue and White</b> below threshold in all polls; Gantz will drop out in the last week if not crossing: Times of Israel,
              Sep 20, 2026.
            </li>
            <li>
              <b>Pledges.</b> Zionist opposition to govern without Arab parties: Haaretz, Oct 1, 2026 (headline). B&apos;Yachad &ldquo;only
              rely on Zionist parties&rdquo;: Times of Israel, Apr 26, 2026; no Arab or Haredi parties: Times of Israel, May 27, 2026. Joint
              List won&apos;t join Netanyahu: Times of Israel, Aug 19, 2026. Eisenkot on Ra&apos;am (&ldquo;he won&apos;t be part of my next
              government&rdquo;): Times of Israel, Sep 26, 2026. Lieberman, &ldquo;not for the Arab parties and not for the haredi
              parties&rdquo;: Jerusalem Post, Sep 21, 2025, repeated Oct 3, 2026. UTJ condition (Yaakov Asher): Matzav, Sep 28, 2026.
            </li>
            <li>
              <b>Surplus-vote agreements.</b> Yashar–Democrats and B&apos;Yachad–Yisrael Beiteinu signed Sep 10, 2026 (Times of Israel).
              Likud–Religious Zionism agreed Sep 8 (Israel Hayom), reported unsigned Sep 15 (Channel 14); final status not found. Joint
              List–Ra&apos;am: Ynet, Sep 11, and Jerusalem Post, Sep 13, 2026. Shas–UTJ &ldquo;expected&rdquo;: Jerusalem Post, Sep 10,
              2026; signing not found. Otzma, People of Israel and Reservists: no partner found (an IPF listing of Reservists with Yisrael
              Beiteinu is unconfirmed, since Yisrael Beiteinu signed with B&apos;Yachad).
            </li>
            <li>
              <b>Lists.</b> UTJ order (Asher 1, Goldknopf 2, Porush 4): Davar and Israel Hayom, Sep 8, 2026. Ra&apos;am no. 2 Yoav
              Segalovitz: Jerusalem Post and Times of Israel, Aug 31, 2026. B&apos;Yachad (Yesh Atid runs inside the list, Lapid no. 2):
              Times of Israel, Sep 6, 2026; deal signed Apr 25–26, 2026 (Jerusalem Post).
            </li>
            <li>
              <b>Disqualification and court ruling:</b> Central Elections Committee vote Sep 23, 2026 (Times of Israel); Supreme Court
              ruling Oct 2, 2026, hearing Oct 1 (Jerusalem Post; Al Jazeera, Oct 2, 2026).
            </li>
            <li>
              <b>Bloc labels and leaders:</b> Israel Policy Forum 120 Project, updated Sep 24, 2026; Jerusalem Post Sep 7, 2026; Times of
              Israel Aug 19 and Sep 6, 2026. Reservists–Economic&apos;s bloc is disputed (IsraelEd: would join Netanyahu; IPF: &ldquo;third
              bloc&rdquo;; ToI: non-aligned), so it is shown between the blocs.
            </li>
            <ProfileSources />
            <li>
              <b>61-seat majority:</b> Israel Democracy Institute, Apr 15, 2026.
            </li>
            <li>
              <b>Electoral threshold:</b> {resultsConfig.thresholdSource}
            </li>
          </ol>
        </footer>
      </div>
    </div>
  );
}
