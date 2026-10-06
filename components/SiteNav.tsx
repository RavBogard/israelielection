"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {type MouseEvent,useCallback,useEffect,useRef,useState,useSyncExternalStore} from "react";
import {NAV_BAR,NAV_GROUPS,NAV_UTILITIES,type NavGroup,type NavItem,navLabel} from "@/lib/site";
import type {ExitMeter,Meter} from "@/lib/nav-facts";
import SiteNavMeter from "./SiteNavMeter";
import LangSwitch from "./LangSwitch";
import {useLang} from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";
import {activeNavGroup,currentNavPage,visibleNavItems} from "@/lib/navigation";
import "./site-nav.css";

/** True once polls close; re-renders at the moment they do. The server's answer is used for hydration. */
function usePollsClosed(pollsClose:string,atRender:boolean){
 const at=Date.parse(pollsClose);
 const subscribe=useCallback((cb:()=>void)=>{const wait=at-Date.now();if(!(wait>0)||wait>2_147_000_000)return()=>{};const t=setTimeout(cb,wait+500);return()=>clearTimeout(t);},[at]);
 return useSyncExternalStore(subscribe,()=>Date.now()>=at,()=>atRender);
}

/**
 * The masthead bar: the seat meter, four group menus, the bar's utilities (Search, About) and the language toggle. The other
 * utilities sit at the foot of every open panel; the phone menu lists the groups, then every utility.
 */
/** A menu label: marked when still in English, with "(באנגלית)" after a Hebrew menu's link to an English-only page. English menus render the bare label. */
function Label({n,text,lang}:{n:NavItem;text:string;lang:"en"|"he"}){
 const words=n.lang&&n.lang!==lang?<span lang={n.lang} dir={n.lang==="he"?"rtl":"ltr"}>{text}</span>:text;
 return lang==="he"&&n.hrefLang==="en"?<>{words} {chrome.he.inEnglish}</>:<>{words}</>;
}

export default function SiteNav({facts={},pollsClose,closedAtRender=false,meter,groups=NAV_GROUPS,utilities=NAV_UTILITIES,bar=NAV_BAR,home="/"}:{facts?:Record<string,string>;pollsClose:string;closedAtRender?:boolean;meter:{average:Meter;exit:ExitMeter|null};groups?:readonly NavGroup[];utilities?:readonly NavItem[];bar?:readonly string[];home?:string}){
 const lang=useLang(),t=chrome[lang];
 const path=usePathname(),navRef=useRef<HTMLElement>(null),menuRef=useRef<HTMLButtonElement>(null),triggerRefs=useRef<Record<string,HTMLButtonElement|null>>({});
 const [mobileOpen,setMobileOpen]=useState(false),[expanded,setExpanded]=useState<string|null>(null);
 const closed=usePollsClosed(pollsClose,closedAtRender);
 const active=activeNavGroup(groups,path);
 const close=()=>{setExpanded(null);setMobileOpen(false);};
 const follow=(e:MouseEvent)=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0)close();};
 // eslint-disable-next-line react-hooks/set-state-in-effect -- route navigation dismisses open disclosures
 useEffect(()=>{setExpanded(null);setMobileOpen(false);},[path]);
 useEffect(()=>{
  const nav=navRef.current;if(!nav)return;
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)){setExpanded(null);setMobileOpen(false);}};
  const historyClose=()=>{setExpanded(null);setMobileOpen(false);};
  const media=matchMedia("(max-width: 899px)");
  const resize=()=>{const focused=document.activeElement;const inside=nav.contains(focused);setExpanded(null);setMobileOpen(false);if(inside){if(media.matches)menuRef.current?.focus();else triggerRefs.current[groups[0].id]?.focus();}};
  document.addEventListener("pointerdown",outside);window.addEventListener("popstate",historyClose);window.addEventListener("hashchange",historyClose);media.addEventListener("change",resize);
  return()=>{document.removeEventListener("pointerdown",outside);window.removeEventListener("popstate",historyClose);window.removeEventListener("hashchange",historyClose);media.removeEventListener("change",resize);};
 // eslint-disable-next-line react-hooks/exhaustive-deps -- the groups are fixed for the page's edition
 },[]);
 const link=(n:NavItem)=><Link href={n.href} hrefLang={n.hrefLang} aria-current={currentNavPage(n.href,path)?"page":undefined} onClick={follow}><Label n={n} text={navLabel(n)} lang={lang}/></Link>;
 const more=utilities.filter(n=>!bar.includes(n.href));
 return <nav ref={navRef} className="site-nav" aria-label={t.navLabel} data-home={path===home?"":undefined} data-closed={closed?"":undefined} onBlur={(e)=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node)){setExpanded(null);setMobileOpen(false);}}} onKeyDown={(e)=>{if(e.key!=="Escape")return;if(expanded){e.preventDefault();setExpanded(null);triggerRefs.current[expanded]?.focus();}else if(mobileOpen){e.preventDefault();setMobileOpen(false);menuRef.current?.focus();}}}>
  <SiteNavMeter average={meter.average} exit={meter.exit} closed={closed} pollsClose={pollsClose}/>
  <button ref={menuRef} type="button" className="nav-mobile-toggle" aria-label={mobileOpen?t.closeMenu:t.openMenu} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={()=>{setMobileOpen(v=>!v);setExpanded(mobileOpen?null:active);}}>{mobileOpen?t.close:t.menu}</button>
  <LangSwitch/>
  <div id="primary-navigation" className={`nav-menu${mobileOpen?" mobile-open":""}`}>
   <div className="nav-main">
    <ul className="nav-groups">{groups.map(g=><li key={g.id} className={`nav-group${active===g.id?" section-active":""}`}>
     <button ref={el=>{triggerRefs.current[g.id]=el;}} type="button" className="nav-trigger" aria-expanded={expanded===g.id} aria-controls={`nav-panel-${g.id}`} onClick={()=>setExpanded(old=>old===g.id?null:g.id)}><span className="nav-label">{g.label}<span className="nav-caret" aria-hidden="true"/></span>{facts[g.id]&&<span className="nav-preview">{facts[g.id]}</span>}</button>
     <div id={`nav-panel-${g.id}`} className={`nav-panel${g.items.length<4?" compact":""}`} hidden={expanded!==g.id}>
      <p className="nav-panel-label">{g.label}</p><ul>{visibleNavItems(g.items,closed,path).map(n=><li key={n.href}><Link href={n.href} hrefLang={n.hrefLang} aria-current={currentNavPage(n.href,path)?"page":undefined} onClick={follow}><span><Label n={n} text={n.label} lang={lang}/></span>{n.description&&<small>{n.description}</small>}</Link></li>)}</ul>
      <ul className="nav-panel-more" aria-label={t.more}>{more.map(n=><li key={n.href}>{link(n)}</li>)}</ul>
     </div>
    </li>)}</ul>
   </div>
   <ul className="nav-utilities">{utilities.map(n=><li key={n.href} className={bar.includes(n.href)?undefined:"nav-util-more"}>{link(n)}</li>)}</ul>
  </div>
 </nav>;
}
