"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {type ReactNode,useEffect,useRef,useState} from "react";
import {NAV_GROUPS,NAV_UTILITIES} from "@/lib/site";
import {activeNavGroup,currentNavPage} from "@/lib/navigation";
import "./site-nav.css";

export default function SiteNav({extra}:{extra?:ReactNode}){
 const path=usePathname(),navRef=useRef<HTMLElement>(null),menuRef=useRef<HTMLButtonElement>(null),triggerRefs=useRef<Record<string,HTMLButtonElement|null>>({});
 const [mobileOpen,setMobileOpen]=useState(false),[expanded,setExpanded]=useState<string|null>(null);
 const active=activeNavGroup(NAV_GROUPS,path);
 const close=()=>{setExpanded(null);setMobileOpen(false);};
 // eslint-disable-next-line react-hooks/set-state-in-effect -- route navigation dismisses open disclosures
 useEffect(()=>{setExpanded(null);setMobileOpen(false);},[path]);
 useEffect(()=>{
  const nav=navRef.current;if(!nav)return;
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)){setExpanded(null);setMobileOpen(false);}};
  const historyClose=()=>{setExpanded(null);setMobileOpen(false);};
  const media=matchMedia("(max-width: 899px)");
  const resize=()=>{const focused=document.activeElement;const inside=nav.contains(focused);setExpanded(null);setMobileOpen(false);if(inside){if(media.matches)menuRef.current?.focus();else triggerRefs.current[NAV_GROUPS[0].id]?.focus();}};
  document.addEventListener("pointerdown",outside);window.addEventListener("popstate",historyClose);window.addEventListener("hashchange",historyClose);media.addEventListener("change",resize);
  return()=>{document.removeEventListener("pointerdown",outside);window.removeEventListener("popstate",historyClose);window.removeEventListener("hashchange",historyClose);media.removeEventListener("change",resize);};
 },[]);
 return <nav ref={navRef} className="site-nav" aria-label="Primary navigation" onBlur={(e)=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node)){setExpanded(null);setMobileOpen(false);}}} onKeyDown={(e)=>{if(e.key!=="Escape")return;if(expanded){e.preventDefault();setExpanded(null);triggerRefs.current[expanded]?.focus();}else if(mobileOpen){e.preventDefault();setMobileOpen(false);menuRef.current?.focus();}}}>
  <button ref={menuRef} type="button" className="nav-mobile-toggle" aria-label={mobileOpen?"Close menu":"Open menu"} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={()=>{setMobileOpen(v=>!v);setExpanded(null);}}>{mobileOpen?"Close":"Menu"}</button>
  <ul className="nav-utilities">{NAV_UTILITIES.map(n=><li key={n.href}><Link href={n.href} aria-current={currentNavPage(n.href,path)?"page":undefined} onClick={(e)=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0)close();}}>{n.label}</Link></li>)}</ul>
  <div id="primary-navigation" className={`nav-main${mobileOpen?" mobile-open":""}`}>
   <ul className="nav-groups">{NAV_GROUPS.map(g=><li key={g.id} className={`nav-group${active===g.id?" section-active":""}`}>
    <button ref={el=>{triggerRefs.current[g.id]=el;}} type="button" className="nav-trigger" aria-expanded={expanded===g.id} aria-controls={`nav-panel-${g.id}`} onClick={()=>setExpanded(old=>old===g.id?null:g.id)}><span className="nav-label">{g.label}<span className="nav-caret" aria-hidden="true"/></span><span className="nav-preview">{g.preview}</span></button>
    <div id={`nav-panel-${g.id}`} className={`nav-panel${g.id==="about"?" compact":""}`} hidden={expanded!==g.id}>
     <p className="nav-panel-label">{g.label}</p><ul>{g.items.map(n=><li key={n.href}><Link href={n.href} aria-current={currentNavPage(n.href,path)?"page":undefined} onClick={(e)=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0)close();}}><span>{n.label}</span><small>{n.description}</small></Link></li>)}</ul>
    </div>
   </li>)}</ul>
   {extra&&<div className="nav-mobile-extra">{extra}</div>}
  </div>
 </nav>;
}
