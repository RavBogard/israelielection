"use client";
import Link from "next/link";
import {useEffect,useMemo,useSyncExternalStore} from "react";
import {usePathname} from "next/navigation";
import {enPath,editionPath,type Lang} from "@/lib/i18n";
import {referenceText} from "@/lib/i18n/reference";
import publicReading from "@/lib/recommendations/catalog.json";
import {READING_KEY,emptyReading,readHistory,recordReading,suggestedReading,type ReadingState} from "@/lib/recommendations/history";
const known=publicReading.map(x=>x.id),event="reading-preferences";
const subscribe=(cb:()=>void)=>{window.addEventListener("storage",cb);window.addEventListener(event,cb);return()=>{window.removeEventListener("storage",cb);window.removeEventListener(event,cb)}};
const snapshot=()=>{try{return localStorage.getItem(READING_KEY)??""}catch{return ""}};
const serverSnapshot=()=>"";
function save(value:ReadingState){try{localStorage.setItem(READING_KEY,JSON.stringify(value));window.dispatchEvent(new Event(event))}catch{/* Suggestions remain unavailable when browser storage is disabled. */}}
export default function SuggestedReading({lang}:{lang:Lang}) {
 const path=usePathname(),raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot),state=useMemo(()=>readHistory(raw,known),[raw]),t=referenceText(lang),current=publicReading.find(x=>x.path===enPath(path))?.id??null;
 useEffect(()=>{if(state.enabled&&current)save(recordReading(readHistory(snapshot(),known),current,known));},[state.enabled,current]);
 useEffect(()=>{if(!raw)return;const clean=()=>{const current=snapshot(),next=readHistory(current,known);if(current!==JSON.stringify(next))save(next)};clean();const timer=setInterval(clean,60000);return()=>clearInterval(timer);},[raw]);
 const suggestions=suggestedReading(publicReading,state,current);
 return <aside className="election-record suggested-reading" aria-label={t.suggestions}><h2>{t.suggestions}</h2><p>{t.privacy}</p>{!state.enabled?<button type="button" onClick={()=>save({enabled:true,history:[]})}>{t.enable}</button>:<><p><button type="button" onClick={()=>save(emptyReading())}>{t.disable}</button>{" "}<button type="button" onClick={()=>save({enabled:true,history:[]})}>{t.reset}</button></p>{suggestions.length?<ul>{suggestions.map(s=><li key={s.id}><Link href={editionPath(s.path,lang)??s.path}><span lang="en" dir="ltr">{s.title}</span></Link><p>{t.why} {lang!=="en"&&t.sourceTitle}</p></li>)}</ul>:<p>{t.noSuggestions}</p>}</>}</aside>;
}
