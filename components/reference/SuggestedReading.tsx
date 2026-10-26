"use client";
import Link from "next/link";
import {useEffect,useSyncExternalStore,useState} from "react";
import {usePathname} from "next/navigation";
import {enPath,editionPath,isRtl,type Lang} from "@/lib/i18n";
import {referenceText} from "@/lib/i18n/reference";
import publicReading from "@/lib/recommendations/catalog.json";
import {READING_KEY,emptyReading,readHistory,recordReading,suggestedReading,type ReadingState} from "@/lib/recommendations/history";
const known=publicReading.map(x=>x.id),event="reading-preferences";
const subscribe=(cb:()=>void)=>{window.addEventListener("storage",cb);window.addEventListener(event,cb);return()=>{window.removeEventListener("storage",cb);window.removeEventListener(event,cb)}};
const snapshot=()=>{try{return localStorage.getItem(READING_KEY)??""}catch{return ""}};
const serverSnapshot=()=>"";
function save(value:ReadingState){try{localStorage.setItem(READING_KEY,JSON.stringify(value));window.dispatchEvent(new Event(event))}catch{return false}return true;}
export default function SuggestedReading({lang,titles={}}:{lang:Lang;titles?:Record<string,string>}) {
 const path=usePathname(),raw=useSyncExternalStore(subscribe,snapshot,serverSnapshot),state=readHistory(raw,known),t=referenceText(lang),current=publicReading.find(x=>x.path===enPath(path).replace(/^\/policies\//,"/issues/"))?.id??null;
 const [storageFailed,setStorageFailed]=useState(false);
 const update=(next:ReadingState)=>setStorageFailed(!save(next));
 useEffect(()=>{if(state.enabled&&current)save(recordReading(readHistory(snapshot(),known),current,known));},[state.enabled,current]);
 useEffect(()=>{if(!raw)return;const clean=()=>{const current=snapshot(),next=readHistory(current,known);if(current!==JSON.stringify(next))save(next)};clean();const timer=setInterval(clean,60000);return()=>clearInterval(timer);},[raw]);
 const suggestions=suggestedReading(publicReading,state,current);
 return <aside className="election-record suggested-reading" aria-label={t.suggestions}><h2>{t.suggestions}</h2>{storageFailed&&<p role="alert">{({en:"Browser storage is unavailable. Reading suggestions remain off.",he:"אחסון הדפדפן אינו זמין. הצעות הקריאה נשארות כבויות.",ar:"تخزين المتصفح غير متاح. تبقى اقتراحات القراءة متوقفة.",fa:"ذخیره‌سازی مرورگر در دسترس نیست؛ پیشنهادها خاموش می‌مانند.",de:"Browserspeicher nicht verfügbar. Lesevorschläge bleiben aus.",fr:"Stockage du navigateur indisponible. Les suggestions restent désactivées.",zh:"浏览器存储不可用，阅读推荐保持关闭。"})[lang]}</p>}<p>{t.privacy}</p>{!state.enabled?<button type="button" onClick={()=>update({enabled:true,history:[]})}>{t.enable}</button>:<><p><button type="button" onClick={()=>update(emptyReading())}>{t.disable}</button>{" "}<button type="button" onClick={()=>update({enabled:true,history:[]})}>{t.reset}</button></p>{suggestions.length?<ul>{suggestions.map(s=><li key={s.id}><Link href={editionPath(s.path,lang)??s.path}><span lang={titles[s.id]?lang:"en"} dir={titles[s.id]&&isRtl(lang)?"rtl":"ltr"}>{titles[s.id]??s.title}</span></Link><p>{t.why} {lang!=="en"&&!titles[s.id]&&t.sourceTitle}</p></li>)}</ul>:<p>{t.noSuggestions}</p>}</>}</aside>;
}
