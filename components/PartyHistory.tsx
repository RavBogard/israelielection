"use client";
import { useState } from "react";
import Link from "next/link";
import { filterHistories, histories, historyFamilies, HISTORY_KINDS, historySources } from "@/lib/party-history";
import data from "@/data/party-history.json";
import "./PartyHistory.css";

export default function PartyHistory() {
  const [family, setFamily] = useState("all");
  const [query, setQuery] = useState("");
  const shown = filterHistories(family, query);
  return <div className="party-history">
    <div className="history-key"><p><strong>Read the relationship as well as the arrow.</strong> An electoral alliance puts separate parties on one ballot. A party merger joins their organizations. A Knesset faction is their parliamentary grouping after an election. A leader can move without moving a whole party.</p><p>{data.scope}</p><p>Historical vote shares belong to the lists that actually ran. Blue and White in 2019, for example, included parties absent from Gantz&apos;s 2026 list; comparing the name alone would compare different electorates. Explore the <Link href="/vote-map">historical vote map</Link> and <Link href="/timeline">election timeline</Link>.</p></div>
    <div className="history-controls"><label>Political branch<select value={family} onChange={e=>setFamily(e.target.value)}><option value="all">All branches</option>{historyFamilies.map(f=><option key={f}>{f}</option>)}</select></label><label>Find current or earlier names<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Yamina, Meretz or Tkuma" /></label></div>
    <p aria-live="polite">Showing {shown.length} of {histories.length} current profiled lists. Checked October 5, 2026; undated party histories are marked below.</p>
    <nav aria-label="Jump to a party history" className="history-jumps">{shown.map(h=><a key={h.id} href={`#${h.id}`}>{h.name}</a>)}</nav>
    {shown.map(h=><section key={h.id} id={h.id} className="history-branch"><header><h2>{h.name}</h2><p>{h.family} · <Link href={`/parties/${h.id}`}>Current profile</Link> · <Link href={`/ballot#${h.id}`}>Ballot entry</Link></p></header>
      <ol className="history-flow">{h.events.map((e,i)=><li key={`${e.date}-${i}`}>
        <div className="history-date">{e.date}<span>{HISTORY_KINDS[e.kind]}</span></div>
        <div className={`history-relation history-${e.kind}`}>
          {e.inputs.length > 0 && <div className="history-parents">{e.inputs.map(input=><span key={input}>{input}</span>)}</div>}
          {e.inputs.length > 0 && <span className="history-arrow" aria-hidden="true">↓</span>}
          <strong className="history-output">{e.output}</strong>
          <p>{e.text}</p>
          <p className="history-source">{e.sources.map((id,i)=><span key={id}>{i > 0 && " · "}<a href={historySources[id].url}>{historySources[id].name}</a>{historySources[id].date ? `, ${historySources[id].date}` : " (publication date not given)"}</span>)}</p>
        </div>
      </li>)}</ol>
      {h.related.length > 0 && <p className="history-related">Follow a connected branch: {h.related.map((id,i)=><span key={id}>{i > 0 && " · "}<a href={`#${id}`} onClick={()=>{setFamily("all");setQuery("");}}>{histories.find(h=>h.id===id)?.name}</a></span>)}</p>}
    </section>)}
    {shown.length === 0 && <p>No matching branch. Try another name or choose all branches.</p>}
  </div>;
}
