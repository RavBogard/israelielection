"use client";
import Link from "next/link";
import {useMemo,useRef,useState} from "react";
import {homeMosaicLayout,homeMosaicView,type HomeRaceModel} from "@/lib/home-race";
import {signedSeats,sparkPath,sparkRange,type BlocChange} from "@/lib/bloc-change";
import {shortDate} from "@/lib/format";
import {partyColor,PARTY_FALLBACK} from "@/lib/party-colors";
import type {BlocId} from "@/lib/types";
import "./seatgrid.css";
const seats=(n:number)=>n.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});
export default function HomeRace({model,change}:{model:HomeRaceModel;change?:BlocChange|null}){
 const range=change?sparkRange(change.points):0;
 const [selected,setSelected]=useState<BlocId|null>(null),buttons=useRef<Partial<Record<BlocId,HTMLButtonElement|null>>>({}),visual=useRef<HTMLDivElement>(null);
 const layout=useMemo(()=>homeMosaicLayout(model),[model]),view=homeMosaicView(layout,selected),active=model.rows.find(row=>row.id===selected);
 function choose(id:BlocId,fromGrid=false){const next=selected===id?null:id;setSelected(next);if(fromGrid)buttons.current[id]?.focus({preventScroll:true});if(next&&window.innerWidth<=1000)requestAnimationFrame(()=>{const element=visual.current;if(element&&(element.getBoundingClientRect().bottom>window.innerHeight||element.getBoundingClientRect().top<0))element.scrollIntoView({block:"nearest",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});});}
 function reset(){setSelected(null);if(selected)buttons.current[selected]?.focus();}
 const rects=(indices:number[],bloc:BlocId|null,color:string,label:string)=>indices.map(i=><rect key={i} data-cell={i} data-bloc={bloc??"unassigned"} className={bloc?"c":"e"} x={i%12*12+1} y={Math.floor(i/12)*12+1} width={10} height={10} fill={color} aria-hidden="true"><title>{`${label}; cell ${i+1}`}</title></rect>);
 return <div className="race-chart">
  <div className="race-selectors"><p id="race-instruction" className="race-instruction">Choose a bloc to see its parties.</p><ul>{model.rows.map(row=><li key={row.id}><button ref={el=>{buttons.current[row.id]=el;}} type="button" className="race-bloc-button" aria-expanded={selected===row.id} aria-controls="race-party-panel" onClick={()=>choose(row.id)}>
   <span className="race-row-label"><span className="race-group-name"><span className="sw" style={{background:`var(--b-${row.id})`}} aria-hidden="true"/>{row.label}</span><span className="race-value">{seats(row.seats)}<small>{row.incomplete?"known seats":"seats"}</small></span></span>
   {change&&<span className="race-change"><svg className="race-spark" viewBox="-2 -2 52 18" aria-hidden="true" focusable="false"><path d={sparkPath(change.points,row.id,48,14,range)} stroke={`var(--b-${row.id})`}/></svg>{signedSeats(change.delta[row.id])} since {shortDate(change.since)}</span>}
   <span className="race-row-caption">{(row.id==="net"||row.id==="opp")&&<span className="race-gap">{row.shortfall>0?`${seats(row.shortfall)} seats short of 61`:row.seats===61?"At the 61-seat absolute majority":`${seats(row.seats-61)} seats above 61`}{row.incomplete?" in the known subtotal":""}</span>}<span className="race-disclosure">{selected===row.id?"Hide parties":"Show parties"}<span className={`race-caret${selected===row.id?" open":""}`} aria-hidden="true"/></span></span>
  </button></li>)}</ul></div>
  <div className="race-visual" ref={visual}><svg viewBox="0 0 164 120" className="sg sg-hero home-mosaic" role="group" aria-label={`120-seat mosaic. ${selected?`${active!.label} parties revealed; other blocs remain solid.`:"Four bloc colors; activate a bloc to reveal its parties."}`} aria-describedby="race-instruction race-rounding" onKeyDown={e=>{if(e.key==="Escape"&&selected){e.preventDefault();reset();}}}>
   {view.map(group=>group.revealed?group.partyId?<a key={group.id} href={`/parties/${group.partyId}`} tabIndex={0} className="seat-party-link" aria-label={`Open ${group.label} profile: ${seats(group.seats)} seats`}>{rects(group.cells,group.bloc,partyColor(group.partyId),`${group.label}: ${seats(group.seats)} seats`)}</a>:<g key={group.id} role="img" aria-label={`${group.label}: ${seats(group.seats)} seats`}>{rects(group.cells,group.bloc,PARTY_FALLBACK,`${group.label}: ${seats(group.seats)} seats`)}</g>:<g key={group.id} className="mosaic-bloc-control" tabIndex={0} role="button" aria-label={`Show ${group.label} parties: ${seats(group.seats)} seats`} aria-controls="race-party-panel" onClick={()=>choose(group.bloc,true)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose(group.bloc,true);}}}>{rects(group.cells,group.bloc,`var(--b-${group.bloc})`,`${group.label}: ${seats(group.seats)} seats`)}</g>)}
   {rects(layout.empty,null,"var(--cell)","No modeled seat assigned")}<line className="rule" x1={0} x2={147} y1={60} y2={60} aria-hidden="true"/><text className="rl" x={149} y={62.4} dominantBaseline="middle" aria-hidden="true">61</text>
  </svg><p id="race-rounding" className="race-model-note">These political groupings do not establish coalition agreements. Cells round fractional seat estimates; the labels keep one decimal place. The 61 marker marks a seat count, not a coalition grouping.{layout.empty.length>0&&<> {layout.empty.length} neutral cells have no assigned seat estimate.</>}</p></div>
  <section id="race-party-panel" className="race-party-panel" hidden={!active} aria-labelledby="race-party-heading" onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();reset();}}}>
   {active&&<><header><h2 id="race-party-heading">{active.label}: parties</h2><button type="button" className="btn" onClick={reset}>Back to blocs</button></header><p className="race-selection-status" role="status">Only {active.label} is shown in party colors. The other blocs keep their colors and every cell stays in place.</p>
    <ul className="race-parties">{active.members.map(p=><li key={p.id}><Link href={`/parties/${p.id}`}><span className="sw" style={{background:partyColor(p.id)}} aria-hidden="true"/>{p.name}</Link><span className="race-party-seats">{p.seats===null?p.state==="combined"?"Not separated":"Not separately reported":<>{seats(p.seats)}{p.state==="below"&&<small>{model.isAverage?"Below or near threshold":"Below threshold so far"}</small>}</>}</span></li>)}</ul>
    {active.combined.map(c=><p key={c.parties.join(",")} className="race-combined">{c.names.join(" + ")}: {seats(c.seats)} seats reported together{c.withinGroup?"; counted once in this bloc.":"; crosses blocs and is not allocated to one bloc here."} No individual split is reported.</p>)}<p className="race-model-note">{model.isAverage?"The mosaic follows the normalized coalition average.":"The mosaic follows this site’s seat estimate from the count so far."} Unreported parties are not assigned invented seats.</p>
   </>}
  </section>
 </div>;
}
