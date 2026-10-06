"use client";
import { useState } from "react";
import Link from "next/link";
import { filterHistories, histories, historyFamilies, HISTORY_KINDS, historySources } from "@/lib/party-history";
import "./PartyHistory.css";

/** Hebrew runs inside an English name, marked so screen readers switch voice and the text runs right to left. */
const HEB = /([֐-׿][֐-׿\s"'׳״-]*[֐-׿])/;
function withHebrew(text: string) {
  return text.split(HEB).map((part, i) => (i % 2 ? <span key={i} lang="he" dir="rtl">{part}</span> : part));
}

export default function PartyHistory() {
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const shown = filterHistories(family, query);
  return <div className="party-history">
    <div className="history-controls"><label>Political branch<select value={family} onChange={e=>setFamily(e.target.value)}><option value="all">All branches</option>{historyFamilies.map(f=><option key={f}>{f}</option>)}</select></label><label>Find current or earlier names<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Yamina, Meretz or Tkuma" /></label></div>
    <p aria-live="polite">Showing {shown.length} of {histories.length} current profiled lists. Checked October 5, 2026; undated party histories are marked below.</p>
    <nav aria-label="Jump to a party history" className="history-jumps">{shown.map(h=><a key={h.id} href={`#${h.id}`}>{h.name}</a>)}</nav>
    {shown.map(h=><section key={h.id} id={h.id} className="history-branch"><header><h2>{h.name}</h2><p>{h.family}. <Link href={`/parties/${h.id}`}>Current profile</Link>, <Link href={`/ballot#${h.id}`}>ballot entry</Link>.</p></header>
      <ol className="history-flow">{h.events.map((e,i)=><li key={`${e.date}-${i}`}>
        <div className="history-date">{e.date}<span>{HISTORY_KINDS[e.kind]}</span></div>
        <div className={`history-relation history-${e.kind}`}>
          {e.inputs.length > 0 && <div className="history-parents">{e.inputs.map(input=><span key={input}>{withHebrew(input)}</span>)}</div>}
          <strong className="history-output">{withHebrew(e.output)}{e.letters && <span className="history-letters"><span className="history-vh">, ballot letters </span><span lang="he" dir="rtl">{e.letters}</span></span>}</strong>
          <p>{e.text}</p>
          <p className="fig-src history-source">{e.sources.map((id,i)=><span key={id}>{i > 0 && "; "}<a href={historySources[id].url}>{historySources[id].name}</a>{historySources[id].date ? `, ${historySources[id].date}` : " (publication date not given)"}</span>)}</p>
        </div>
      </li>)}</ol>
      {h.related.length > 0 && <p className="history-related">Follow a connected branch: {h.related.map((id,i)=><span key={id}>{i > 0 && ", "}<a href={`#${id}`} onClick={()=>{setFamily("all");setQuery("");}}>{histories.find(h=>h.id===id)?.name}</a></span>)}</p>}
    </section>)}
    {shown.length === 0 && <p>No matching branch. Try another name or choose all branches.</p>}
  </div>;
}
