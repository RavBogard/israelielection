"use client";

import { useState } from "react";
import Link from "next/link";
import { ballotLists, filterBallot } from "@/lib/ballot";
import data from "@/data/ballot-directory.json";
import "./BallotDirectory.css";

export default function BallotDirectory() {
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<"all" | "profiled" | "other">("all");
  const shown = filterBallot(ballotLists, query, coverage);
  return <section className="ballot-directory">
    <div className="ballot-coverage">
      <strong>{ballotLists.length} of {ballotLists.length} published roster entries</strong>
      <p>{data.caveat}</p>
      <p>Official guide updated October 4; checked October 5, 2026. The election timetable schedules publication of approved candidate lists for October 18.</p>
      <p><a href={data.source}>CEC roster (Hebrew)</a> · <a href={data.approvedSlips}>CEC approved ballot slips (PDF)</a> · <a href="https://www.gov.il/en/pages/time--table-26">Official timetable</a></p>
    </div>
    <div className="ballot-controls">
      <label>Find a list, leader or ballot letters<input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="English, Hebrew or letters" /></label>
      <label>Site coverage<select value={coverage} onChange={e => setCoverage(e.target.value as typeof coverage)}><option value="all">Every published list</option><option value="profiled">Lists with detailed profiles</option><option value="other">Other lists</option></select></label>
    </div>
    <p aria-live="polite">Showing {shown.length} of {ballotLists.length}. English names below are translations or transliterations; the original official name is retained.</p>
    <ol className="ballot-grid">{shown.map(l => <li key={l.id} id={l.id}>
      <span className="ballot-letters" lang="he" dir="rtl" aria-label={`Ballot letters ${l.letters}`}>{l.letters}</span>
      <div><h2>{l.name}</h2><p lang="he" dir="rtl">{l.hebrew}</p>
        <p className="ballot-status">Published submitted roster · Not final</p>
        <p>{l.leader ? `Leadership named in official list title: ${l.leader}.` : "No current leader named in the published table title."}</p>
        <p><a href={l.source}>Official candidate record (Hebrew)</a>{l.profile && <> · <Link href={`/parties/${l.profile}`}>Profile</Link> · <Link href={`/party-history#${l.profile}`}>History</Link></>}</p>
      </div>
    </li>)}</ol>
    {shown.length === 0 && <p>No matching list. Try an English name, Hebrew name, leader or ballot letters.</p>}
    <p className="ballot-footnote">Directory inclusion says nothing about polling strength. Tekuma (ק) is a separate 2026 roster entry from Religious Zionism–Zehut (ט); a similar name does not establish organizational continuity. This directory records lists rather than assigning unsourced platforms to minor parties.</p>
  </section>;
}
