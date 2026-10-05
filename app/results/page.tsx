import type { Metadata } from "next";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/results.css";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY, KNESSET } from "@/lib/coalition";
import { averagePoll, blocs, exitPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { pollLabel, seatsIn } from "@/lib/polls";
import type { Count, PartyResult } from "@/lib/results";
import { pollWatch, thresholdSeats, thresholdWatch } from "@/lib/watch";
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

/** Before the count: when it starts, what the exit polls are worth, and which lists sit near the threshold. */
function WhatToWatch() {
  const close = new Date(cfg.pollsClose);
  const near = pollWatch(averagePoll, parties, cfg.threshold);
  return (
    <section className="rs-watch" aria-labelledby="watch-h">
      <h2 id="watch-h" className="sec-h">
        What to watch
      </h2>
      <dl>
        <div>
          <dt>
            {IL.format(close)} Israel time, {ET.format(close)}
          </dt>
          <dd>
            Polls close, and Kan, Channel 12 and Channel 13 broadcast their exit polls at that moment. Exit polls are estimates: in 2022 the early exit
            polls gave Meretz 5 seats, and the final count put it below the threshold with none.{" "}
            <Link href="/how-it-works/voting">How election night turns into a count</Link>
          </dd>
        </div>
        <div>
          <dt>
            The threshold, {cfg.threshold * 100}% of valid votes, about {thresholdSeats(cfg.threshold)} seats
          </dt>
          <dd>
            A list that misses it gets nothing, and its votes are shared out among the lists that passed. In the current average these lists sit nearest
            the line:
            <ul className="rs-near">
              {near.map(({ party, seats }) => (
                <li key={party.id}>
                  <span className="sw" style={{ background: `var(--b-${party.bloc})` }} />
                  <Link href={`/parties/${party.id}`}>{party.name}</Link>
                  <span className="v">{seats ? `${Math.round(seats * 10) / 10} seats` : "below the threshold in every poll"}</span>
                </li>
              ))}
            </ul>
            Each one that crosses or fails moves about {thresholdSeats(cfg.threshold)} seats between the blocs.
          </dd>
        </div>
        <div>
          <dt>The count keeps moving after the night</dt>
          <dd>
            Nearly one vote in ten is cast in a double envelope, away from the voter&apos;s own polling station, and those are counted after the regular
            ballots. The committee publishes the official allocation with the final results. <Link href="/how-it-works/voting">Why the count shifts</Link>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** The channels' exit polls beside the count, once they air; before that, one line saying they will appear. */
function ExitPolls({ lists }: { lists: PartyResult[] | null }) {
  if (!exitPolls.length)
    return lists ? null : (
      <p className="note rs-exit-note">
        The three channels&apos; exit polls will be added here when they air, and the Coalition Builder will offer them as a choice.
      </p>
    );
  const rows = parties.filter((p) => exitPolls.some((e) => (seatsIn(e, p.id) ?? 0) > 0) || (lists?.find((l) => l.partyId === p.id)?.seats ?? 0) > 0);
  return (
    <section className="rs-exit" aria-labelledby="exit-h">
      <h2 id="exit-h" className="sec-h">
        Exit polls{lists ? " and the count" : ""}
      </h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>List</th>
              {exitPolls.map((e) => (
                <th key={e.id} className="num">
                  {pollLabel(e)}
                </th>
              ))}
              {lists && <th className="num">Count so far</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="sw" style={{ background: `var(--b-${p.bloc})`, marginRight: 8 }} />
                  <Link href={`/parties/${p.id}`}>{p.name}</Link>
                </td>
                {exitPolls.map((e) => {
                  const v = seatsIn(e, p.id);
                  return (
                    <td key={e.id} className={`num${v ? "" : " below"}`}>
                      {v || "below threshold"}
                    </td>
                  );
                })}
                {lists && <td className="num">{lists.find((l) => l.partyId === p.id)?.seats || "below threshold"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="src" style={{ marginTop: 10 }}>
        Exit polls as broadcast at {IL.format(new Date(cfg.pollsClose))} Israel time: {exitPolls.map((e) => `${pollLabel(e)}, ${mediumDate(e.published)}`).join("; ")}. They
        are estimates; the count is the committee&apos;s.
      </p>
    </section>
  );
}

/** During the count: the lists within half a point of the threshold, and what crossing is worth. */
function ThresholdWatch({ count }: { count: Count }) {
  const rows = thresholdWatch(count, cfg);
  return (
    <section className="rs-watch" aria-labelledby="tw-h">
      <h2 id="tw-h" className="sec-h">
        The threshold
      </h2>
      <p className="note">
        {cfg.threshold * 100}% of valid votes counted so far is {num(count.valid * cfg.threshold)} votes. A list below it gets no seats; its votes are shared out among the
        lists that passed.
      </p>
      {rows.length ? (
        <ul className="rs-near">
          {rows.map((w) => {
            const p = byId(w.partyId)!;
            return (
              <li key={w.partyId}>
                <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
                <Link href={`/parties/${p.id}`}>{p.name}</Link>
                <span className="v">
                  {pct(w.pct)}, {num(Math.abs(w.margin))} votes {w.passing ? "above" : "below"} the line;{" "}
                  {w.passing ? `holds ${w.seatsAtThreshold} seats` : `would take about ${w.seatsAtThreshold} seats if it crosses`}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="note">No list is within half a point of the threshold in the votes counted so far.</p>
      )}
    </section>
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
                  This page will show the count as it comes in, refreshed every minute, and the <Link href="/coalition-builder">Coalition Builder</Link> will add the
                  results as a choice.
                </>
              ) : (
                <>The committee&apos;s count could not be reached on this refresh ({IL.format(new Date(live.fetchedAt))} Israel time). The page tries again every minute.</>
              )}
            </p>
          </header>
          <WhatToWatch />
          <ExitPolls lists={null} />
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

        <ThresholdWatch count={count} />
        <ExitPolls lists={r.lists} />

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
