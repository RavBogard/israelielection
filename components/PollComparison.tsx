"use client";
import {useLayoutEffect,useRef,useState} from "react";
import {partyColor,PARTY_COLOR_NOTE,strokeVars} from "@/lib/party-colors";
import "./party-stroke.css";
import type {TrendPanel} from "./PollTrends";
import {alignTrend,lineSegments,nearestDateIndex,seatTicks} from "@/lib/poll-chart";
import {mediumDate,shortDate} from "@/lib/format";
import {SEATS_LABEL,seatFigure} from "@/lib/polls";
import {useLang} from "@/lib/i18n/lang";
import POLLS from "@/lib/i18n/polls";
import {pollsterName,svgText} from "./polls/names";
const DAY=86400_000,MAX_PICKS=3;
const value=(n:number,below="below")=>n===0?below:seatFigure(n);
/** Pick-a-party: every list's polling average (scaled to 120, as printed site-wide) in grey, up to three picked lists in their own colour with their polls as dots. */
export default function PollComparison({panels,dates,from,to,yMax,hollowNames,title}:{panels:TrendPanel[];dates:string[];from:string;to:string;yMax:number;hollowNames:string[];title:string}){
 const lang=useLang(),he=lang==="he",T=POLLS[lang],t=T.comp,v=(n:number)=>value(n,T.common.below);
 const ref=useRef<HTMLDivElement>(null);const [w,setW]=useState(0);const [index,setIndex]=useState(dates.length-1);
 const series=panels.map((p)=>({...p,points:alignTrend(p.trend,dates),color:partyColor(p.id)}));
 const [picks,setPicks]=useState<string[]>(()=>[...series].sort((a,b)=>(b.trend.at(-1)?.avg??0)-(a.trend.at(-1)?.avg??0)).slice(0,MAX_PICKS).map((p)=>p.id));
 const [status,setStatus]=useState("");
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;const ro=new ResizeObserver(()=>setW(el.clientWidth));ro.observe(el);return()=>ro.disconnect();},[]);
 const wide=w>=640;const H=wide?420:340,PAD={l:34,r:wide?190:14,t:22,b:28};
 const t0=Date.parse(from),t1=Date.parse(to);const x=(date:string)=>PAD.l+(Date.parse(date)-t0)/Math.max(DAY,t1-t0)*(w-PAD.l-PAD.r);const y=(n:number)=>PAD.t+(1-n/yMax)*(H-PAD.t-PAD.b);
 const name=(id:string)=>series.find((p)=>p.id===id)?.name??id;
 function toggle(id:string){if(picks.includes(id)){setPicks(picks.filter((p)=>p!==id));setStatus(t.removed(name(id)));return;}const next=[...picks,id];const dropped=next.length>MAX_PICKS?next.shift():undefined;setPicks(next);setStatus(t.picked(name(id),dropped?name(dropped):undefined));}
 const picked=picks.map((id)=>series.find((p)=>p.id===id)!).filter(Boolean);const rest=series.filter((p)=>!picks.includes(p.id));
 const selectedDate=dates[Math.min(index,dates.length-1)];
 function inspect(clientX:number){const rect=ref.current?.getBoundingClientRect();if(rect)setIndex(nearestDateIndex(dates,t0+(clientX-rect.left-PAD.l)/Math.max(1,w-PAD.l-PAD.r)*(t1-t0)));}
 const path=(segment:{date:string;avg:number|null}[])=>segment.map((point,j)=>`${j?"L":"M"}${x(point.date).toFixed(1)},${y(point.avg!).toFixed(1)}`).join("");
 // End labels at each picked list's last average, pushed apart so they never overlap.
 const ends=picked.map((p)=>{const last=[...p.points].reverse().find((q)=>q.avg!==null);return {p,last,ly:last?y(last.avg!):0};}).filter((e)=>e.last).sort((a,b)=>a.ly-b.ly);
 for(let i=1;i<ends.length;i++)if(ends[i].ly-ends[i-1].ly<18)ends[i].ly=ends[i-1].ly+18;
 const reading=picked.length?picked.map((p)=>{const q=p.points[index];return `${p.name} ${q?.avg==null?t.noAverage:`${v(q.avg)}`}`;}).join(", "):t.noneReading;
 return <section className="pc" aria-labelledby="pc-title"><h2 id="pc-title" className="sec-h">{title}</h2>
 <fieldset className="pc-pick"><legend>{t.pick}</legend><div className="pc-pick-list">{series.map((p)=>{const on=picks.includes(p.id);const q=p.points[index];return <button type="button" key={p.id} aria-pressed={on} className={on?"on":undefined} onClick={()=>toggle(p.id)}><span className="sw" style={{background:on?p.color:"var(--line-2)"}} aria-hidden="true"/><span className="pc-pick-name">{p.name}</span><span className="pc-value">{q?.avg==null?"–":v(q.avg)}</span></button>;})}</div><p className="sr-only" role="status" aria-live="polite">{status}</p></fieldset>
 <div className="pc-plot" ref={ref}>{w>0&&<svg width={w} height={H} role="img" tabIndex={0} aria-label={t.aria(picked.map((p)=>p.name),yMax)} aria-describedby="pc-reading" onPointerMove={(e)=>inspect(e.clientX)} onPointerDown={(e)=>inspect(e.clientX)} onKeyDown={(e)=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setIndex((i)=>Math.max(0,Math.min(dates.length-1,i+(e.key==="ArrowRight"?1:-1))));}if(e.key==="Home"||e.key==="End"){e.preventDefault();setIndex(e.key==="Home"?0:dates.length-1);}}}>
 {seatTicks(0,yMax).map((n)=><g key={n}><line x1={PAD.l} x2={w-PAD.r} y1={y(n)} y2={y(n)} className="pt-grid"/><text x={PAD.l-8} y={y(n)} textAnchor="end" dominantBaseline="middle" className="pc-tick">{n}</text></g>)}<text x={PAD.l} y={12} {...svgText(he)} className="pc-tick">{he?T.now.seatsLabel:SEATS_LABEL}</text>
 <text x={PAD.l} y={H-8} className="pc-tick">{shortDate(from,lang)}</text><text x={w-PAD.r} y={H-8} className="pc-tick" textAnchor="end">{shortDate(to,lang)}</text>
 {selectedDate&&<line x1={x(selectedDate)} x2={x(selectedDate)} y1={PAD.t} y2={H-PAD.b} className="pt-cross"/>}
 {rest.map((p)=><g key={p.id}>{lineSegments(p.points).map((segment,i)=><path key={i} d={path(segment)} className="pc-grey"/>)}</g>)}
 {picked.map((p)=><g key={p.id} className="pstroke" style={strokeVars(p.id)}>{p.dots.map((d,i)=><circle key={i} cx={x(d.date)} cy={y(d.seats)} r={3} className={`pc-dot${d.ref?" hollow":""}`} style={{["--c" as string]:"var(--psx)"}}><title>{t.dot(p.name,pollsterName(d.pollster,lang),shortDate(d.date,lang),d.seats)}</title></circle>)}{lineSegments(p.points).map((segment,i)=><g key={i}><path d={path(segment)} fill="none" stroke="var(--psx)" strokeWidth={2.5} strokeLinejoin="round"/>{segment.length===1&&<circle cx={x(segment[0].date)} cy={y(segment[0].avg!)} r={3} fill="var(--psx)"/>}</g>)}{p.points[index]?.avg!=null&&<circle cx={x(selectedDate)} cy={y(p.points[index].avg!)} r={5} fill="var(--psx)" stroke="var(--sheet)" strokeWidth={1.5}/>}</g>)}
 {wide&&ends.map(({p,last,ly})=><text key={p.id} x={w-PAD.r+10} y={ly} dominantBaseline="middle" className="pc-label"><tspan className="pc-endv">{v(last!.avg!)}</tspan> {p.name}</text>)}
 </svg>}</div>
 <p id="pc-reading" className="pc-reading" role="status" aria-live="polite"><b>{mediumDate(selectedDate,lang)}</b>: {reading}.</p>
 <div className="fig-key pc-key"><span><svg width="22" height="12" aria-hidden="true"><line x1="1" x2="21" y1="6" y2="6" stroke="var(--ink-2)" strokeWidth="2.5"/></svg>{t.keyPicked}</span><span><svg width="22" height="12" aria-hidden="true"><line x1="1" x2="21" y1="6" y2="6" className="pc-grey"/></svg>{t.keyOther}</span><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--ink-2)"/></svg>{T.common.onePoll}</span><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="3.5" fill="none" stroke="var(--ink-2)" strokeWidth="1.5"/></svg>{T.common.or(hollowNames.map((n)=>pollsterName(n,lang)))}</span></div>
 <p className="fig-note">{he?t.note(panels.length,yMax):<>All {panels.length} separately tracked lists on the same 0–{yMax} seat scale; dots are single polls.</>}</p>
 <details className="pd-how"><summary>{T.common.howToRead}</summary><p className="fig-note">{he?t.how:<>Each line is a list&apos;s seats in the site&apos;s polling average as it stood on each publication date, scaled to 120 as everywhere else on the site; below means it was below or near the threshold that day and counts 0. Dots are single polls. A gap means no poll reported the list separately. No smoothing or uncertainty band is added. Point at or tap the chart, or use the left and right arrow keys, to read a date; the picker shows each list&apos;s value on that date, and – means no separate average.</>}</p></details>
 <p className="fig-src">{he?t.colorNote:PARTY_COLOR_NOTE}</p>
 <details className="pc-data"><summary>{t.numbers}</summary><div className="table-scroll" tabIndex={0} role="region" aria-label={t.tableAria}><table className="data-table"><caption>{he?t.caption:<>{SEATS_LABEL}, scaled to 120; below counts 0; – means no separate average.</>}</caption><thead><tr><th>{t.date}</th>{series.map((p)=><th key={p.id}>{p.name}</th>)}</tr></thead><tbody>{dates.map((date,i)=><tr key={date}><th scope="row">{he?mediumDate(date,lang):date}</th>{series.map((p)=><td key={p.id}>{p.points[i].avg===null?"–":v(p.points[i].avg!)}</td>)}</tr>)}</tbody></table></div></details>
 </section>;
}
