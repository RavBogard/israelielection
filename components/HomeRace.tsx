import Link from "next/link";
import {homeRaceModel} from "@/lib/home-race";
import {MAJORITY} from "@/lib/coalition";
import {partyColor} from "@/lib/party-colors";
import type {BlocId,Party,Poll} from "@/lib/types";
const seats=(n:number)=>n.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});
/** Semantic disclosures expose party evidence; bars duplicate labeled text only. */
export default function HomeRace({poll,parties,blocs}:{poll:Poll;parties:Party[];blocs:{id:BlocId;label:string}[]}){
 const model=homeRaceModel(poll,parties,blocs),marker=MAJORITY/model.max*100;
 return <div className="race-chart" aria-labelledby="race-chart-h"><h2 id="race-chart-h">Seats by political group</h2><p className="race-scale-note">Shared 0–{model.max} seat scale for all four bars</p><div className="race-axis" aria-hidden="true"><span>0</span><span className="race-axis-majority" style={{left:`${marker}%`}}>61 majority</span><span>{model.max}</span></div>
 {model.rows.map(row=><details key={row.id} className="race-group"><summary>
  <span className="race-row-label"><span className="race-group-name">{row.label}</span><span className="race-value">{seats(row.seats)}<small>{row.incomplete?"known seats":"seats"}</small></span></span>
  <span className="race-track" aria-hidden="true"><span className="race-bar" style={{width:`${row.seats/model.max*100}%`}}/><span className="race-target" style={{left:`${marker}%`}}/></span>
  <span className="race-row-caption">{(row.id==="net"||row.id==="opp")&&<span className="race-gap">{row.shortfall>0?`${seats(row.shortfall)} seats short of 61`:row.seats===MAJORITY?"At the 61-seat absolute majority":`${seats(row.seats-MAJORITY)} seats above 61`}{row.incomplete?" in the known subtotal":""}</span>}<span className="race-disclosure"><span className="race-show">Show parties</span><span className="race-hide">Hide parties</span><span aria-hidden="true" className="race-caret"/></span></span>
 </summary><ul className="race-parties">{row.members.map(p=><li key={p.id}><Link href={`/parties?party=${p.id}`}><span className="sw" style={{background:partyColor(p.id)}} aria-hidden="true"/>{p.name}</Link><span className="race-party-seats">{p.seats===null?p.state==="combined"?"Not separated":"Not separately reported":<>{seats(p.seats)}{p.state==="below"&&<small>{model.isAverage?"Below or near threshold":"Below threshold so far"}</small>}</>}</span></li>)}</ul>
 {row.combined.map(c=><p key={c.parties.join(",")} className="race-combined">{c.names.join(" + ")}: {seats(c.seats)} seats reported together{c.withinGroup?"; counted once in this group.":"; crosses groups and is not allocated to an individual group here."} No individual split is reported.</p>)}
 </details>)}
 <p className="race-model-note">{model.isAverage?"The chart follows the normalized coalition average.":"The chart shows this site’s seat estimate from votes counted so far."} Unreported parties are not assigned invented seats.</p>
 </div>;
}
