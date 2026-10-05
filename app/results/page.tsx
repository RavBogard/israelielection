import type { Metadata } from "next";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/results.css";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY, KNESSET } from "@/lib/coalition";
import { blocs, parties } from "@/lib/data";
import { results } from "@/lib/results";
import { fetchCount, resultsConfig as cfg } from "@/lib/results-live";

export const metadata: Metadata = {
  title: "Results",
  description: "Election-night results for Israel's 2026 Knesset election from the Central Elections Committee's count, with seats by party and bloc.",
};

// Every minute on election night; before then the page only says when the count starts.
export const revalidate = 60;

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const num = (x: number) => Math.round(x).toLocaleString("en-US");
const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
const byId = (id: string | null) => parties.find((p) => p.id === id);
const pairName = (ids: string[]) => ids.map((id) => byId(id)?.name ?? id).join(" and ");

function Letters() {
  const rows = Object.entries(cfg.letters)
    .map(([letters, id]) => ({ letters, p: byId(id)! }))
    .sort((a, b) => blocs.findIndex((x) => x.id === a.p.bloc) - blocs.findIndex((x) => x.id === b.p.bloc));
  return (
    <>
      <h2 className="sec-h">The ballot letters</h2>
      <p className="note">
        Voters pick a paper slip printed with a list&apos;s letters. The committee&apos;s count reports votes by those letters. These are the letters of
        the {rows.length} lists this site tracks, out of 38 on the ballot.
      </p>
      <div className="table-scroll">
        <table className="data-table letters-table">
          <thead>
            <tr><th>Letters</th><th>List</th><th>Leader</th></tr>
          </thead>
          <tbody>
            {rows.map(({ letters, p }) => (
              <tr key={letters}>
                <td className="rs-heb" lang="he" dir="rtl">{letters}</td>
                <td><span className="sw" style={{ background: `var(--b-${p.bloc})` }} /><Link href={`/parties/${p.id}`}>{p.name}</Link></td>
                <td>{p.leader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="src" style={{ marginTop: 10 }}>Source: {cfg.lettersSource}</p>
    </>
  );
}

function Method() {
  return (
    <>
      <h2 className="sec-h">How votes become seats</h2>
      <ol className="note rs-steps">
        <li>Lists with fewer than {cfg.threshold * 100}% of valid votes get no seats. Their votes are not transferred.</li>
        <li>The {KNESSET} seats are shared among the remaining lists in proportion to their votes, by the Bader-Ofer method.</li>
        <li>
          Two lists that signed a surplus-vote agreement compete for leftover seats as if they were one list, then split what they win. This can
          move one seat. Agreements used here: {cfg.agreements.map((a) => `${pairName(a.parties)}${a.status === "signed" ? "" : " (reported)"}`).join("; ")}.
        </li>
        <li>A government needs the confidence of {MAJORITY} members.</li>
      </ol>
      <p className="src">
        {cfg.thresholdSource} Agreements: {cfg.agreements.map((a) => `${pairName(a.parties)}, ${a.source}`).join("; ")}. {cfg.agreementsNote}
      </p>
    </>
  );
}

export default async function Page() {
  const live = await fetchCount(revalidate);
  const close = new Date(cfg.pollsClose);

  if (live.state !== "open") {
    return (
      <div className="ix rs">
        <div className="wrap">
          <header className="page-head">
            <h1>Results</h1>
            <p className="standfirst">
              {live.state === "closed" ? (
                <>
                  The Central Elections Committee starts publishing its count when polls close at {IL.format(close)} Israel time ({ET.format(close)}).
                  This page will show the count as it comes in, refreshed every minute, and the <Link href="/">Coalition Builder</Link> will add the
                  results as a choice.
                </>
              ) : (
                <>The committee&apos;s count could not be reached on this refresh ({IL.format(new Date(live.fetchedAt))} Israel time). The page tries again every minute.</>
              )}
            </p>
          </header>
          <Letters />
          <Method />
        </div>
      </div>
    );
  }

  const { count, fetchedAt } = live;
  const r = results(count, cfg);
  const order = ["net", "mid", "opp", "arab"];
  const blocSeats = [...blocs]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((b) => ({ ...b, seats: r.lists.filter((l) => byId(l.partyId)?.bloc === b.id).reduce((s, l) => s + l.seats, 0) }));
  const untrackedSeats = r.lists.filter((l) => !l.partyId).reduce((s, l) => s + l.seats, 0);
  const others = r.lists.filter((l) => !l.partyId);
  const segments = [
    ...blocSeats.map((b) => ({ id: b.id, seats: b.seats, color: `var(--b-${b.id})`, label: b.label })),
    ...(untrackedSeats ? [{ id: "other", seats: untrackedSeats, color: "var(--line-2)", label: "Other lists" }] : []),
  ];

  return (
    <div className="ix rs">
      <div className="wrap">
        <header className="page-head">
          <h1>Results</h1>
          <p className="standfirst">
            The committee&apos;s count so far: {num(count.valid)} valid votes from {count.localities} localities, turnout{" "}
            {count.eligible ? pct(count.voted / count.eligible) : "n/a"} where counted.
          </p>
          <p className="note">
            Seats are this site&apos;s estimate from those votes; the committee publishes the official allocation with the final results. Last fetched{" "}
            {IL.format(new Date(fetchedAt))} Israel time.
          </p>
        </header>

        <section className="rs-count" aria-label="Seats by bloc">
          <SeatGrid segments={segments} labelRule />
          <div>
            <ul className="rs-legend">
              {blocSeats.map((b) => (
                <li key={b.id}><span className="sw" style={{ background: `var(--b-${b.id})` }} />{b.label} <b>{b.seats}</b></li>
              ))}
              {untrackedSeats > 0 && <li><span className="sw" style={{ background: "var(--line-2)" }} />Other lists <b>{untrackedSeats}</b></li>}
            </ul>
            <p className="note" style={{ marginTop: 14 }}>
              <Link href="/?poll=results">Build a coalition from these results</Link>
            </p>
          </div>
        </section>

        <h2 className="sec-h">By list</h2>
        <div className="table-scroll">
          <table className="data-table list-table">
            <thead>
              <tr><th>List</th><th>Letters</th><th className="num">Votes</th><th className="num">Share</th><th className="num">Seats</th></tr>
            </thead>
            <tbody>
              {r.lists.filter((l) => l.partyId).map((l) => {
                const p = byId(l.partyId)!;
                return (
                  <tr key={l.letters}>
                    <td><span className="sw" style={{ background: `var(--b-${p.bloc})`, marginRight: 8 }} /><Link href={`/parties/${p.id}`}>{p.name}</Link></td>
                    <td className="rs-heb" lang="he" dir="rtl">{l.letters}</td>
                    <td className="num">{num(l.votes)}</td>
                    <td className="num">{pct(l.pct)}</td>
                    <td className={`num${l.seats ? "" : " below"}`}>{l.seats || "below threshold"}</td>
                  </tr>
                );
              })}
              <tr>
                <td>Other lists ({others.length})</td>
                <td />
                <td className="num">{num(others.reduce((s, l) => s + l.votes, 0))}</td>
                <td className="num">{pct(others.reduce((s, l) => s + l.pct, 0))}</td>
                <td className="num">{untrackedSeats || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="src" style={{ marginTop: 10 }}>
          Threshold: {num(r.alloc.thresholdVotes)} votes ({cfg.threshold * 100}% of valid votes counted so far). Source:{" "}
          <a href={cfg.source.url}>{cfg.source.label}</a>.
          {r.unknownLetters.length > 0 && untrackedSeats > 0 && " A list this site does not track is currently over the threshold."}
        </p>

        <Method />
      </div>
    </div>
  );
}
