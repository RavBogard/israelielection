"use client";

import { useState } from "react";
import Link from "next/link";
import { ballotLists, filterBallot, orderSlips, type SlipOrder } from "@/lib/ballot";
import { averagePoll } from "@/lib/data";
import { partyColor, partyInk } from "@/lib/party-colors";
import data from "@/data/ballot-directory.json";
import "./BallotDirectory.css";

const seatsOf = (id: string | null) => (id ? averagePoll.results[id]?.seats ?? 0 : 0);

/**
 * The ballot tray first: all 38 published slips as one wall, the lists that win seats in the
 * polling average in their own colour with their seats, every other slip plain, so the reader
 * sees how many lists run and how few the polls count. Then the searchable directory.
 */
export default function BallotDirectory() {
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<"all" | "profiled" | "other">("all");
  const [order, setOrder] = useState<SlipOrder>("roster");
  const shown = filterBallot(ballotLists, query, coverage);
  const polled = ballotLists.filter((l) => seatsOf(l.profile) > 0).length;
  return (
    <section className="ballot-directory">
      <figure className="bd-tray">
        <figcaption className="bd-head">
          <span className="bd-h">
            The {ballotLists.length} slips on the roster; <b>{polled}</b> win seats in the polling average
          </span>
          <div className="seg bd-order" role="group" aria-label="Order the slips">
            {([["roster", "Roster order"], ["polled", "Polled first"]] as const).map(([k, t]) => (
              <button key={k} type="button" aria-pressed={order === k} onClick={() => setOrder(k)}>{t}</button>
            ))}
          </div>
        </figcaption>
        <ol className="bd-wall">
          {orderSlips(ballotLists, (l) => seatsOf(l.profile), order).map((l) => {
            const s = seatsOf(l.profile);
            const c = l.profile ? partyColor(l.profile) : null;
            return (
              <li key={l.id}>
                <a href={`#${l.id}`} className={`bd-slip${s > 0 ? " polled" : ""}`} style={s > 0 && c ? { ["--c" as string]: c, ["--ci" as string]: partyInk(l.profile!) } : undefined} title={`${l.name}${s > 0 ? `: ${Math.round(s * 10) / 10} seats in the average` : ""}`}>
                  <span className="bd-letters" lang="he" dir="rtl">{l.letters}</span>
                  <span className="bd-name">{l.name}</span>
                  {s > 0 && <span className="bd-seats">{Math.round(s * 10) / 10}</span>}
                </a>
              </li>
            );
          })}
        </ol>
        <p className="fig-src bd-src">
          Coloured slips are the lists that pass the threshold in the polling average, with their seats; plain slips poll below it or are not polled. {order === "roster" ? "Order as in the published roster." : "Polled lists first, by seats; the rest in roster order."} {data.caveat}
        </p>
      </figure>

      <div className="ballot-controls">
        <label>Find a list, leader or ballot letters<input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="English, Hebrew or letters" /></label>
        <label>Site coverage<select value={coverage} onChange={(e) => setCoverage(e.target.value as typeof coverage)}><option value="all">Every published list</option><option value="profiled">Lists with detailed profiles</option><option value="other">Other lists</option></select></label>
      </div>
      <p className="bd-count" aria-live="polite">
        Showing {shown.length} of {ballotLists.length}. Every entry is the published submitted roster, not the final approved list. English names are translations or transliterations; the original official name is kept.
      </p>
      <ol className="ballot-grid">
        {shown.map((l) => (
          <li key={l.id} id={l.id}>
            <span className="ballot-letters" lang="he" dir="rtl" aria-label={`Ballot letters ${l.letters}`}>{l.letters}</span>
            <div>
              <h2>{l.name}</h2>
              <p className="bd-he" lang="he" dir="rtl">{l.hebrew}</p>
              <p>{l.leader ? `Leadership named in official list title: ${l.leader}.` : "No current leader named in the published table title."}</p>
              <p className="bd-links">
                <a href={l.source}>Official candidate record (Hebrew)</a>
                {l.profile && <> <Link href={`/parties/${l.profile}`}>Profile</Link> <Link href={`/party-history#${l.profile}`}>History</Link></>}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p>No matching list. Try an English name, Hebrew name, leader or ballot letters.</p>}
      <div className="bd-foot">
        <p>Directory inclusion says nothing about polling strength. Tekuma (ק) is a separate 2026 roster entry from Religious Zionism–Zehut (ט); a similar name does not establish organizational continuity. This directory records lists rather than assigning unsourced platforms to minor parties.</p>
        <p>
          Official guide updated October 4; checked October 5, 2026. The election timetable schedules publication of approved candidate lists for October 18. Sources:{" "}
          <a href={data.source}>CEC roster (Hebrew)</a>, <a href={data.approvedSlips}>CEC approved ballot slips (PDF)</a>, <a href="https://www.gov.il/en/pages/time--table-26">official timetable</a>.
          See also the <Link href="/parties">Party Map</Link>, the <Link href="/party-history">party family tree</Link> and <Link href="/how-it-works/voting">how to vote</Link>.
        </p>
      </div>
    </section>
  );
}
