import type { Metadata } from "next";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/results.css";
import ResultsFreshness from "@/components/ResultsFreshness";
import ResultsRefresh from "@/components/ResultsRefresh";
import ResultsChanges from "@/components/ResultsChanges";
import PollThresholdWatch from "@/components/results/ThresholdWatch";
import {partyColor,blocColorStrip} from "@/lib/party-colors";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY, KNESSET } from "@/lib/coalition";
import { averagePoll, blocs, exitPolls, mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { pollLabel, seatsIn } from "@/lib/polls";
import type { Count, PartyResult } from "@/lib/results";
import { pollWatch, thresholdSeats, thresholdWatch } from "@/lib/watch";
import { countedTurnout, results, rollCounted, versusAverage } from "@/lib/results";
import { fetchCount, resultsConfig as cfg } from "@/lib/results-live";
import PageHead from "@/components/PageHead";

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
                <td><span className="sw" style={{ background: partyColor(p.id) }} /><Link href={`/parties/${p.id}`}>{p.name}</Link></td>
                <td>{p.leader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fig-src" style={{ marginTop: 10 }}>Source: {cfg.lettersSource}</p>
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
          affect leftover-seat allocation. Provisional assumptions here (reported signed; official filing unverified): {cfg.agreements.map((a) => pairName(a.parties)).join("; ")}.
        </li>
        <li>{MAJORITY} seats is an absolute majority. Initial confidence requires more votes for than against, excluding abstentions; constructive no-confidence requires 61 MKs to support an alternative government. <a href="https://en.idi.org.il/articles/28888">IDI explanation</a>; <a href="https://main.knesset.gov.il/EN/activity/Documents/BasicLawsPDF/BasicLawTheGovernment.pdf">Basic Law: Government</a>.</li>
      </ol>
      <p className="fig-src">
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
            This page shows the committee&apos;s count as it comes in, refreshed every minute, and the <Link href="/coalition-builder">Coalition Builder</Link> adds it as a choice.
            Polls close, and Kan, Channel 12 and Channel 13 broadcast their exit polls at that moment (<a href="https://www.ynetnews.com/article/h1tyl0a4s">Ynet, Nov 1, 2022</a>). Exit polls are estimates: in 2022 the early exit polls gave Meretz 5 seats (<a href="https://www.jpost.com/israel-elections/article-721230">Jerusalem Post, Nov 1, 2022</a>), and the final count put it at 3.16%, below the threshold, with none (<a href="https://votes25.bechirot.gov.il/nationalresults">Central Elections Committee</a>).{" "}
            <Link href="/how-it-works/voting">How election night turns into a count</Link>
          </dd>
        </div>
        <div>
          <dt>
            The threshold, {cfg.threshold * 100}% of valid votes, about {thresholdSeats(cfg.threshold)} seats
          </dt>
          <dd>
            A list that misses it gets no seats; its votes are not transferred. Seats are allocated among lists that passed. In the current average these lists sit nearest
            the line:
            <ul className="rs-near">
              {near.map(({ party, seats }) => (
                <li key={party.id}>
                  <span className="sw" style={{ background: partyColor(party.id) }} />
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
                  <span className="sw" style={{ background: partyColor(p.id), marginRight: 8 }} />
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
      <p className="fig-src" style={{ marginTop: 10 }}>
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
        {cfg.threshold * 100}% of valid votes counted so far is {num(count.valid * cfg.threshold)} votes. A list below it gets no seats; its votes are not transferred. Seats are allocated among the
        lists that passed.
      </p>
      {rows.length ? (
        <ul className="rs-near">
          {rows.map((w) => {
            const p = byId(w.partyId)!;
            return (
              <li key={w.partyId}>
                <span className="sw" style={{ background: partyColor(p.id) }} />
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

const signed = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n < 0 ? `−${(-n).toFixed(1)}` : "0");
const tenths = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const DASH = "–";

/** The election-night board, drawn the same before polls close (hatched, awaiting the count) and during it, so nothing moves on the night. */
function Board({ count }: { count: Count | null }) {
  const r = count ? results(count, cfg) : null;
  const toLetter = Object.fromEntries(Object.entries(cfg.letters).map(([l, id]) => [id, l]));
  const order = ["net", "mid", "opp", "arab"];
  const blocSeats = [...blocs]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((b) => ({ ...b, seats: r ? r.lists.filter((l) => byId(l.partyId)?.bloc === b.id).reduce((s, l) => s + l.seats, 0) : null }));
  const others = r ? r.lists.filter((l) => !l.partyId) : [];
  const untrackedSeats = others.reduce((s, l) => s + l.seats, 0);
  const segments = r
    ? [
        ...blocSeats.flatMap((b) => r.lists.filter((l) => l.partyId && byId(l.partyId)?.bloc === b.id && l.seats > 0).map((l) => ({ id: l.partyId!, seats: l.seats, color: partyColor(l.partyId!), label: byId(l.partyId)!.name, href: `/parties?party=${l.partyId}` }))),
        ...(untrackedSeats ? [{ id: "other", seats: untrackedSeats, color: "var(--line-2)", label: "Other lists" }] : []),
      ]
    : [];
  const vs = versusAverage(Object.values(cfg.letters), averagePoll, r?.lists ?? null);
  const rows = r
    ? r.lists.filter((l) => l.partyId).map((l) => ({ l: l as PartyResult | null, v: vs.find((x) => x.partyId === l.partyId)! }))
    : [...vs].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1)).map((v) => ({ l: null as PartyResult | null, v }));
  const share = rollCounted(count, cfg.roll);
  const turnout = count ? countedTurnout(count) : null;
  const wait = (k: string) => <td key={k} className="num rs-wait"><span className="sr-only">Awaiting count</span><span aria-hidden="true">{DASH}</span></td>;
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <pattern id="rs-hatch" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2.5" height="2.5" className="rs-h-bg" />
            <line x1="0" y1="0" x2="0" y2="2.5" className="rs-h-ln" />
          </pattern>
        </defs>
      </svg>
      <section className={`rs-count${r ? "" : " rs-await"}`} aria-label="Seats by bloc">
        <SeatGrid segments={segments} labelRule title={r ? undefined : `Awaiting the count: ${KNESSET} seats; ${MAJORITY} is a majority`} />
        <div>
          <ul className="rs-legend">
            {blocSeats.map((b) => (
              <li key={b.id}><span className="sw" style={{ background: blocColorStrip(b.id) }} />{b.label} {b.seats === null ? <span className="rs-await-v">Awaiting count</span> : <b>{b.seats}</b>}</li>
            ))}
            {untrackedSeats > 0 && <li><span className="sw" style={{ background: "var(--line-2)" }} />Other lists <b>{untrackedSeats}</b></li>}
          </ul>
          <div className="rs-counted">
            <p className="rs-counted-h">{share !== null ? <>Voter roll in the localities counted <b>{(share * 100).toFixed(1)}%</b></> : "Share of the voter roll counted"}</p>
            <div className={`rs-counted-bar${share === null ? " none" : ""}`} role="img" aria-label={share !== null ? `${(share * 100).toFixed(1)}% of eligible voters are in localities counted so far` : "Not available yet"}>
              {share !== null && <i style={{ width: `${share * 100}%` }} />}
            </div>
            <p className="fig-note">
              {!count
                ? "Awaiting the count."
                : <>{num(count.valid)} valid votes from {count.localities} regular localities and any included double envelopes; turnout {turnout !== null ? pct(turnout) : "not available"} among counted regular localities.</>}
              {share === null && " The share appears once the committee publishes its total of eligible voters."}
            </p>
          </div>
          {r && <p className="note" style={{ marginTop: 14 }}><Link href="/coalition-builder?poll=results">Build a coalition from these results</Link></p>}
        </div>
      </section>

      <h2 className="sec-h">By list</h2>
      <div className="table-scroll">
        <table className="data-table list-table">
          <thead>
            <tr><th>List</th><th>Letters</th><th className="num">Votes</th><th className="num">Share</th><th className="num">Seats</th><th className="num">Final poll average</th><th className="num">Difference</th></tr>
          </thead>
          <tbody>
            {rows.map(({ l, v }) => {
              const p = byId(v.partyId)!;
              return (
                <tr key={v.partyId}>
                  <td><span className="sw" style={{ background: partyColor(p.id), marginRight: 8 }} /><Link href={`/parties/${p.id}`}>{p.name}</Link></td>
                  <td className="rs-heb" lang="he" dir="rtl">{toLetter[p.id]}</td>
                  {l ? <td className="num">{num(l.votes)}</td> : wait("v")}
                  {l ? <td className="num">{pct(l.pct)}</td> : wait("p")}
                  {l ? <td className={`num${l.seats ? "" : " below"}`}>{l.seats || "below threshold"}</td> : wait("s")}
                  <td className={`num${v.avg ? "" : " below"}`}>{v.avg === null ? DASH : v.avg ? tenths(v.avg) : "below threshold"}</td>
                  {v.diff === null ? wait("d") : <td className="num">{signed(v.diff)}</td>}
                </tr>
              );
            })}
            <tr>
              <td>Other lists{r ? ` (${others.length})` : ""}</td>
              <td />
              {r ? <td className="num">{num(others.reduce((s, l) => s + l.votes, 0))}</td> : wait("v")}
              {r ? <td className="num">{pct(others.reduce((s, l) => s + l.pct, 0))}</td> : wait("p")}
              {r ? <td className="num">{untrackedSeats || DASH}</td> : wait("s")}
              <td className="num">{DASH}</td>
              <td className="num">{DASH}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="fig-src" style={{ marginTop: 10 }}>
        {r ? <>Threshold: {num(r.alloc.thresholdVotes)} votes ({cfg.threshold * 100}% of valid votes counted so far). </> : <>Hatched cells await the count. </>}
        Final poll average: this site&apos;s average of the latest {mainPolls.length} polls, through {mediumDate(mainPolls[0].published)}; the difference is seats in the count minus that average. Source:{" "}
        <a href={cfg.source.url}>{cfg.source.label}</a>.
        {r && r.unknownLetters.length > 0 && untrackedSeats > 0 && " A list this site does not track is currently over the threshold."}
      </p>
    </>
  );
}

export default async function Page() {
  const live = await fetchCount(revalidate);
  const close = new Date(cfg.pollsClose);
  const refresh = <ResultsRefresh pollsClose={cfg.pollsClose} />;

  if (live.state !== "open") {
    return (
      <div className="ix rs">
        <div className="wrap">
          <PageHead title="Results" aside={refresh} standfirst={live.state === "closed"
            ? <>The count starts when polls close, {IL.format(close)} Israel time ({ET.format(close)}).</>
            : <>The committee&apos;s count could not be reached on this refresh ({IL.format(new Date(live.fetchedAt))} Israel time); the page tries again every minute.</>} />
          <Board count={null} />
          <PollThresholdWatch />
          <WhatToWatch />
          <ExitPolls lists={null} />
          <Letters />
          <Method />
        </div>
      </div>
    );
  }

  const { count } = live;
  const r = results(count, cfg);
  const captured = new Date(live.fetchedAt);
  return (
    <div className="ix rs">
      <div className="wrap">
        <PageHead title="Results" aside={refresh} standfirst={<>
            {live.freshness === "stale" ? "Saved count, update unavailable" : "The committee’s count so far"}, captured {IL.format(captured)} Israel time ({ET.format(captured)}); seats are this site&apos;s estimate.
          </>} />
        <Board count={count} />
        <ResultsFreshness live={live} />
        <ResultsChanges current={live.snapshot} previous={live.previous} config={cfg} names={Object.fromEntries(parties.map((p) => [p.id, p.name]))} />
        <ThresholdWatch count={count} />
        <ExitPolls lists={r.lists} />
        <Method />
      </div>
    </div>
  );
}
