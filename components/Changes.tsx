"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { changes, changeFilters, changeTopics, filterChanges, parseChangeReader, recordChangeVisit, toggleChangeBookmark } from "@/lib/changes";
import { longDate } from "@/lib/format";
import ChangesSourceLabels from "./ChangesSourceLabels";
import "./Changes.css";

const KEY="election-material-changes-v1", EVENT="election-changes-storage";
const subscribeLocation=(callback:()=>void)=>{window.addEventListener("popstate",callback);return ()=>window.removeEventListener("popstate",callback);};
const subscribeReader=(callback:()=>void)=>{window.addEventListener("storage",callback);window.addEventListener(EVENT,callback);return ()=>{window.removeEventListener("storage",callback);window.removeEventListener(EVENT,callback);};};
const getReader=()=>{try{return localStorage.getItem(KEY) ?? "";}catch{return "";}};
const blank=()=>"";
const writeReader=(value:unknown)=>{try{localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new Event(EVENT));return true;}catch{return false;}};

export default function Changes() {
  const query=useSyncExternalStore(subscribeLocation,()=>window.location.search,blank);
  const stored=useSyncExternalStore(subscribeReader,getReader,blank);
  const reader=parseChangeReader(stored), filters=changeFilters(new URLSearchParams(query));
  const didVisit=useRef(false);
  const [saveFailed,setSaveFailed]=useState(false);
  useEffect(()=>{if(didVisit.current)return;didVisit.current=true;writeReader(recordChangeVisit(parseChangeReader(getReader()),new Date().toISOString()));},[]);
  const setFilter=(key:string,value:string)=>{
    const u=new URL(window.location.href);if(value)u.searchParams.set(key,value);else u.searchParams.delete(key);
    window.history.replaceState(null,"",u);window.dispatchEvent(new Event("popstate"));
  };
  const shown=filterChanges(changes,filters,reader);
  const supersededBy=(id:string)=>changes.filter(e=>e.supersedes.includes(id));
  return <div className="changes-log">
    <div className="changes-filters"><label>Topic<select value={filters.topic} onChange={e=>setFilter("topic",e.target.value === "all" ? "" : e.target.value)}><option value="all">All topics</option>{changeTopics.map(t=><option key={t}>{t}</option>)}</select></label>
      <label>Date basis<select value={filters.basis} onChange={e=>setFilter("basis",e.target.value === "effective" ? "" : e.target.value)}><option value="effective">Development / correction date</option><option value="logged">When added to this log</option></select></label>
      <label>From<input type="date" value={filters.from} onChange={e=>setFilter("from",e.target.value)} /></label><label>Through<input type="date" value={filters.to} onChange={e=>setFilter("to",e.target.value)} /></label>
    </div>
    <div className="changes-options"><label><input type="checkbox" checked={filters.sinceLast} onChange={e=>setFilter("since",e.target.checked ? "last" : "")} /> Added since my previous visit</label><label><input type="checkbox" checked={filters.savedOnly} onChange={e=>setFilter("saved",e.target.checked ? "1" : "")} /> Saved entries only</label></div>
    <p className="changes-local">{reader.previousVisit ? <>Previous visit: {reader.previousVisit.replace("T"," ").replace(/\.\d+Z$/, " UTC")}. The last-visit filter uses when an entry was added, so newly logged historical events can appear.</> : "No previous visit recorded in this browser. The last-visit filter currently shows all matching entries."} Bookmarks and visit dates stay in this browser; no account is needed.</p>
    {saveFailed && <p role="status">This browser could not save the bookmark. The entry and its source links remain available.</p>}
    <p aria-live="polite">{shown.length} matching {shown.length === 1 ? "entry" : "entries"} of {changes.length}. <a href="/changes">Reset filters</a></p>
    {shown.map(e=><article key={e.id} id={e.id} className="change-entry"><header><div><p className="change-meta">{e.topic} · {e.kind} · <time dateTime={e.date}>{longDate(e.date)}</time></p><h2>{e.title}</h2></div><button type="button" aria-pressed={reader.bookmarks.includes(e.id)} onClick={()=>setSaveFailed(!writeReader(toggleChangeBookmark(parseChangeReader(getReader()),e.id)))}>{reader.bookmarks.includes(e.id) ? "Saved" : "Save"}</button></header>
      {supersededBy(e.id).length > 0 && <p className="change-superseded">Superseded by {supersededBy(e.id).map(next=><Link key={next.id} href={`/changes#${next.id}`}>{next.title}</Link>)}. Earlier wording is retained below.</p>}
      <dl className="change-states"><div><dt>Previously</dt><dd>{e.before}</dd></div><div><dt>Now / recorded change</dt><dd>{e.after}</dd></div></dl><p><strong>Why it matters.</strong> {e.why}</p><p className="change-limit">{e.limit}</p>
      <p className="change-tools">{e.tools.map((t,i)=><span key={t.href}>{i > 0 && " · "}<Link href={t.href}>{t.label}</Link></span>)}</p>
      <details><summary>Evidence, review and correction history</summary><ul>{e.sources.map(s=><li key={s.url}><a href={s.url}>{s.title}</a>{s.date ? `, ${longDate(s.date)}` : " (publication date not established)"}<ChangesSourceLabels url={s.url} /></li>)}</ul>
        <p>Logged {longDate(e.loggedAt.slice(0,10))}. Source review: {e.review.method}, {longDate(e.review.checked)}. {e.review.human ? `Human review: ${e.review.human}.` : "Independent human approval is not recorded."}</p>
        <ul>{e.history.map((r,i)=><li key={i}>{longDate(r.date)}: {r.note}{r.href && <> <Link href={r.href}>Related record</Link>.</>}</li>)}</ul>
      </details>
    </article>)}
    {shown.length === 0 && <p>No entries match these filters. This is a selected log, not a claim that nothing else happened.</p>}
  </div>;
}
