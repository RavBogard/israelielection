"use client";
import Link from "next/link";
import {useMemo,useRef,useState,type ReactNode} from "react";
import {homeMosaicLayout,homeMosaicView,type HomeRaceModel} from "@/lib/home-race";
import {signedSeats,sparkPath,sparkRange,type BlocChange} from "@/lib/bloc-change";
import {shortDate} from "@/lib/format";
import {partyColor,PARTY_FALLBACK} from "@/lib/party-colors";
import {seatFigure} from "@/lib/polls";
import {useLang} from "@/lib/i18n/lang";
import type {Lang} from "@/lib/i18n";
import home from "@/lib/i18n/home";
import type {BlocId} from "@/lib/types";
import "./seatgrid.css";
/** A name the Hebrew overlay has not reached yet, marked as English. */
const nm=(text:string,lang?:Lang):ReactNode=>lang==="en"?<span lang="en" dir="ltr">{text}</span>:text;
/**
 * The home hero's chart: the bloc list and the 120-seat mosaic. `rtl` (default: the Hebrew edition) fills the
 * mosaic from the top right with "61" left of the rule; SVG ignores dir, so the cells are placed mirrored here.
 */
/** `heading`: what the numbers are ("Average of 7 polls, to Oct 5"), set as the bloc list's header. */
export default function HomeRace({model,change,rtl,heading}:{model:HomeRaceModel;change?:BlocChange|null;rtl?:boolean;heading?:ReactNode}){
 // The count gives whole seats; only the polling average keeps a decimal.
 const seats=(n:number)=>model.isAverage||!Number.isInteger(n)?seatFigure(n):String(n);
 const lang=useLang(),t=home[lang].race,he=lang==="he",flip=rtl??he;
 const range=change?sparkRange(change.points):0;
 const [selected,setSelected]=useState<BlocId|null>(null),buttons=useRef<Partial<Record<BlocId,HTMLButtonElement|null>>>({}),visual=useRef<HTMLDivElement>(null);
 const layout=useMemo(()=>homeMosaicLayout(model,lang),[model,lang]),view=homeMosaicView(layout,selected),active=model.rows.find(row=>row.id===selected);
 const profile=(id:string)=>he?`/he/parties/${id}`:`/parties/${id}`;
 function choose(id:BlocId,fromGrid=false){const next=selected===id?null:id;setSelected(next);if(fromGrid)buttons.current[id]?.focus({preventScroll:true});if(next&&window.innerWidth<=1000)requestAnimationFrame(()=>{const element=visual.current;if(element&&(element.getBoundingClientRect().bottom>window.innerHeight||element.getBoundingClientRect().top<0))element.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});});}
 function reset(){setSelected(null);if(selected)buttons.current[selected]?.focus();}
 // Hebrew: cells from the right, the grid moved right by the label's 20 units.
 const cx=(i:number)=>flip?20+(11-i%12)*12+1:i%12*12+1;
 const rects=(indices:number[],bloc:BlocId|null,color:string,label:string)=>indices.map(i=><rect key={i} data-cell={i} data-bloc={bloc??"unassigned"} className={bloc?"c":"e"} x={cx(i)} y={Math.floor(i/12)*12+1} width={10} height={10} fill={color} aria-hidden="true"><title>{t.cell(label,i+1)}</title></rect>);
 const delta=(d:number)=>he?d===0?t.noChange:<bdi dir="ltr">{signedSeats(d)}</bdi>:signedSeats(d);
 return <div className="race-chart">
  <div className="race-selectors">{heading&&<p className="race-list-head">{heading}</p>}<p id="race-instruction" className="sr-only">{t.instruction}</p><ul>{model.rows.map(row=><li key={row.id}><button ref={el=>{buttons.current[row.id]=el;}} type="button" className="race-bloc-button" aria-expanded={selected===row.id} aria-controls="race-party-panel" onClick={()=>choose(row.id)}>
   <span className="race-row-label"><span className="race-group-name"><span className="sw" style={{background:`var(--b-${row.id})`}} aria-hidden="true"/>{nm(row.label,row.labelLang)}</span><span className="race-value">{seats(row.seats)}<small>{row.incomplete?t.knownSeats:t.seats}</small></span></span>
   {change&&<span className="race-change"><svg className="race-spark" viewBox="-2 -2 52 18" aria-hidden="true" focusable="false"><path d={sparkPath(change.points,row.id,48,14,range)} stroke={`var(--b-${row.id})`}/></svg>{delta(change.delta[row.id])}{t.since}{shortDate(change.since,lang)}</span>}
   <span className="race-row-caption">{(row.id==="net"||row.id==="opp")&&<span className="race-gap">{row.shortfall>0?t.short(seats(row.shortfall)):row.seats===61?t.at:t.above(seats(row.seats-61))}{row.incomplete?t.known:""}</span>}<span className="race-disclosure">{selected===row.id?t.hide:t.show}<span className={`race-caret${selected===row.id?" open":""}`} aria-hidden="true"/></span></span>
  </button></li>)}</ul></div>
  <div className="race-visual" ref={visual}><svg viewBox="0 0 164 120" className="sg sg-hero home-mosaic" role="group" aria-label={t.mosaic(selected?active!.label:null)} aria-describedby="race-instruction race-rounding" onKeyDown={e=>{if(e.key==="Escape"&&selected){e.preventDefault();reset();}}}>
   {view.map(group=>group.revealed?group.partyId?<a key={group.id} href={profile(group.partyId)} tabIndex={0} className="seat-party-link" aria-label={t.open(group.label,seats(group.seats))}>{rects(group.cells,group.bloc,partyColor(group.partyId),t.group(group.label,seats(group.seats)))}</a>:<g key={group.id} role="img" aria-label={t.group(group.label,seats(group.seats))}>{rects(group.cells,group.bloc,PARTY_FALLBACK,t.group(group.label,seats(group.seats)))}</g>:<g key={group.id} className="mosaic-bloc-control" tabIndex={0} role="button" aria-label={t.reveal(group.label,seats(group.seats))} aria-controls="race-party-panel" onClick={()=>choose(group.bloc,true)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(group.bloc,true);}}}>{rects(group.cells,group.bloc,`var(--b-${group.bloc})`,t.group(group.label,seats(group.seats)))}</g>)}
   {rects(layout.empty,null,"var(--cell)",t.unassigned)}{flip?<><line className="rule" x1={17} x2={164} y1={60} y2={60} aria-hidden="true"/><text className="rl" x={15} y={62.4} dominantBaseline="middle" textAnchor="end" direction="ltr" aria-hidden="true">61</text></>:<><line className="rule" x1={0} x2={147} y1={60} y2={60} aria-hidden="true"/><text className="rl" x={149} y={62.4} dominantBaseline="middle" aria-hidden="true">61</text></>}
  </svg><p id="race-rounding" className="race-model-note">{t.note}{layout.empty.length>0&&<>{t.empty(layout.empty.length)}</>}</p></div>
  <section id="race-party-panel" className="race-party-panel" hidden={!active} aria-labelledby="race-party-heading" onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();reset();}}}>
   {active&&<><header><h2 id="race-party-heading">{t.panel(active.label)}</h2><button type="button" className="btn" onClick={reset}>{t.back}</button></header><p className="race-selection-status" role="status">{t.status(active.label)}</p>
    <ul className="race-parties">{active.members.map(p=><li key={p.id}><Link href={profile(p.id)}><span className="sw" style={{background:partyColor(p.id)}} aria-hidden="true"/>{nm(p.name,p.nameLang)}</Link><span className="race-party-seats">{p.seats===null?p.state==="combined"?t.notSeparated:t.notReported:p.state==="below"?<>{t.below}<small>{model.isAverage?t.belowAvg:t.belowCount}</small></>:seats(p.seats)}</span></li>)}</ul>
    {active.combined.map(c=><p key={c.parties.join(",")} className="race-combined">{t.combined(c.names.join(" + "),seats(c.seats))}{c.withinGroup?t.within:t.across}{t.noSplit}</p>)}<p className="race-model-note">{model.isAverage?t.followsAvg:t.followsCount}{t.noInvented}</p>
   </>}
  </section>
 </div>;
}
