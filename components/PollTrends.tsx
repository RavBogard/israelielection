"use client";
import {useLayoutEffect,useRef,useState} from "react";
import {partyColor} from "@/lib/party-colors";
import {fmt,shortDate} from "@/lib/format";
import type {BlocId} from "@/lib/types";
import {alignTrend,lineSegments,nearestDateIndex,seatTicks,trendSummary,zoomSeatDomain} from "@/lib/poll-chart";
export type TrendPanel={id:string;name:string;short?:string;bloc:BlocId;trend:{date:string;avg:number;n:number}[];dots:{date:string;seats:number;pollster:string;ref:boolean;dateUncertain?:boolean}[]};
const H=176,PAD={l:34,r:12,t:14,b:26},DAY=86400_000;
const value=(n:number)=>fmt(Math.round(n*10)/10);
function Panel({p,dates,from,to,yMax,zoomed}:{p:TrendPanel;dates:string[];from:string;to:string;yMax:number;zoomed:boolean}){
 const ref=useRef<HTMLDivElement>(null);const [w,setW]=useState(0);const [inspection,setInspection]=useState(dates.length-1);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;const ro=new ResizeObserver(()=>setW(el.clientWidth));ro.observe(el);return()=>ro.disconnect();},[]);
 const points=alignTrend(p.trend,dates);const summary=trendSummary(points);const shown=points[Math.min(inspection,points.length-1)];
 const [low,high]=zoomed?zoomSeatDomain([...points.map((p)=>p.avg),...p.dots.map((d)=>d.seats)]):[0,yMax];
 const t0=Date.parse(from),t1=Date.parse(to);const x=(date:string)=>PAD.l+(Date.parse(date)-t0)/Math.max(DAY,t1-t0)*(w-PAD.l-PAD.r);const y=(n:number)=>PAD.t+(high-n)/(high-low)*(H-PAD.t-PAD.b);const color=partyColor(p.id);
 const inspect=(px:number)=>setInspection(nearestDateIndex(dates,t0+(px-PAD.l)/Math.max(1,w-PAD.l-PAD.r)*(t1-t0)));
 return <figure className="pt-panel"><figcaption><span className="pt-name"><span className="sw" style={{background:color}}/>{p.name}</span></figcaption>
 <p className="pt-context">{summary.first&&summary.last?<>Start <b>{value(summary.first.avg!)} </b>({shortDate(summary.first.date)}) to latest <b>{value(summary.last.avg!)}</b> ({shortDate(summary.last.date)}); change <b>{summary.change!>0?"+":""}{value(summary.change!)} seats</b>.</>:"No separate running average."}</p>
 <p className="pt-domain">{zoomed?`Zoomed for this party: ${low}–${high} seats${low>0?", axis does not start at zero":""}`:`Shared scale: 0–${yMax} seats`}</p>
 {p.dots.some(d=>d.dateUncertain)&&<p className="pt-date-note">Some individual figures have an unrecorded date and are plotted at the register entry’s publication date. Their dated tooltips identify that limit; this is not a confirmed fieldwork date.</p>}
 <div ref={ref} className="pt-plot">{w>0&&<svg width={w} height={H} role="img" aria-label={`${p.name}. ${zoomed?"Zoomed":"Shared"} scale ${low} to ${high} seats. Use left and right arrows for dated averages.`} tabIndex={points.length?0:-1} onPointerMove={(e)=>inspect(e.clientX-e.currentTarget.getBoundingClientRect().left)} onPointerDown={(e)=>inspect(e.clientX-e.currentTarget.getBoundingClientRect().left)} onKeyDown={(e)=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setInspection((i)=>Math.max(0,Math.min(points.length-1,i+(e.key==="ArrowRight"?1:-1))));}if(e.key==="Home"||e.key==="End"){e.preventDefault();setInspection(e.key==="Home"?0:points.length-1);}}}>
 {seatTicks(low,high).map((n)=><g key={n}><line x1={PAD.l} x2={w-PAD.r} y1={y(n)} y2={y(n)} className="pt-grid"/><text x={PAD.l-7} y={y(n)} className="pt-tick" textAnchor="end" dominantBaseline="middle">{n}</text></g>)}
 <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H-PAD.b} className="pt-cross"/>{low>0&&<path d={`M${PAD.l-3},${H-PAD.b-10}l6,-4m-6,9l6,-4`} stroke="var(--ink)" strokeWidth={1.5}/>}
 <text x={PAD.l} y={H-5} className="pt-tick">{shortDate(from)}</text><text x={w-PAD.r} y={H-5} className="pt-tick" textAnchor="end">{shortDate(to)}</text>
 {p.dots.map((d,i)=><circle key={i} cx={x(d.date)} cy={y(d.seats)} r={d.ref?3.5:4} fill={d.ref?"none":color} className={d.ref?"pt-dot-ref":"pt-dot"}><title>{`${d.pollster}, ${d.dateUncertain?`figure date not recorded (plotted at entry publication ${shortDate(d.date)})`:shortDate(d.date)}: ${d.seats} seats${d.seats===0?" (below threshold; not 3.25% of seats)":""}${d.ref?"; eligible for the default method, excluded only from the named alternative":""}`}</title></circle>)}
 {lineSegments(points).map((segment,i)=><g key={i}><path d={segment.map((point,j)=>`${j?"L":"M"}${x(point.date).toFixed(1)},${y(point.avg!).toFixed(1)}`).join("")} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>{segment.length===1&&<circle cx={x(segment[0].date)} cy={y(segment[0].avg!)} r={3} fill={color}/>}</g>)}
 {shown&&<><line x1={x(shown.date)} x2={x(shown.date)} y1={PAD.t} y2={H-PAD.b} className="pt-cross"/>{shown.avg!==null&&<circle cx={x(shown.date)} cy={y(shown.avg)} r={5} fill={color} className="pt-dot"/>}</>}
 </svg>}</div><p className="pt-read" role="status" aria-live="polite">{shown?<>{shortDate(shown.date)}: {shown.avg===null?"no separate average available":<><b>{value(shown.avg)}</b> seats, {shown.n} separately reporting polls</>}</>:"No readings"}</p></figure>;
}
export default function PollTrends({groups,dates,from,to,yMax,refLabel}:{groups:{bloc:BlocId;label:string;panels:TrendPanel[]}[];dates:string[];from:string;to:string;yMax:number;refLabel:string}){
 const [zoomed,setZoomed]=useState(true);
 return <div className="pt"><fieldset className="pt-scale"><legend>Individual chart scales</legend><label><input type="radio" name="trend-scale" checked={zoomed} onChange={()=>setZoomed(true)}/> Per-party zoom (different axes; compare change)</label><label><input type="radio" name="trend-scale" checked={!zoomed} onChange={()=>setZoomed(false)}/> Shared 0–{yMax} seats (compare size)</label></fieldset>
 <div className="pt-legend"><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--ink-2)"/></svg> Individual poll</span><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="3.5" className="pt-dot-ref"/></svg>{refLabel}</span><span><svg width="20" height="12" aria-hidden="true"><line x1="1" x2="19" y1="6" y2="6" stroke="var(--ink-2)" strokeWidth="2"/></svg> Passing-poll mean</span></div>
 {groups.map((g)=><section key={g.bloc} className="pt-group"><h3 className="lbl"><span className="sw" style={{background:`var(--b-${g.bloc})`}}/>{g.label}</h3><div className="pt-grid-wrap">{g.panels.map((p)=><Panel key={p.id} p={p} dates={dates} from={from} to={to} yMax={yMax} zoomed={zoomed}/>)}</div></section>)}</div>;
}
