import {MAJORITY} from "./coalition";
import {AVERAGE_ID,blocTotals} from "./polls";
import type {BlocId,Party,Poll} from "./types";
export const HOME_RACE_ORDER:BlocId[]=["net","opp","mid","arab"];
export const seatTenths=(value:number)=>Math.round(value*10)/10;
export const majorityShortfall=(seats:number)=>Math.max(0,seatTenths(MAJORITY-seatTenths(seats)));
export const raceScaleMax=(totals:number[])=>Math.max(70,Math.ceil(Math.max(0,...totals)/10)*10);
export function homeRaceModel(poll:Poll,parties:Party[],blocs:{id:BlocId;label:string}[]){
 const totals=blocTotals(poll,parties),isAverage=poll.id===AVERAGE_ID;
 const rows=HOME_RACE_ORDER.map(id=>{
  const members=parties.filter(p=>p.bloc===id).map(p=>{
   const result=poll.results[p.id],combined=poll.combined.find(c=>c.parties.includes(p.id));
   return {id:p.id,name:p.name,seats:result?result.seats:null,state:result?result.belowThreshold?"below" as const:"reported" as const:combined?"combined" as const:"missing" as const};
  });
  const combined=poll.combined.filter(c=>c.parties.some(pid=>parties.find(p=>p.id===pid)?.bloc===id)).map(c=>({...c,names:c.parties.map(pid=>parties.find(p=>p.id===pid)?.name??pid),withinGroup:c.parties.every(pid=>parties.find(p=>p.id===pid)?.bloc===id)}));
  const incomplete=!isAverage&&(members.some(p=>p.state==="missing")||combined.some(c=>!c.withinGroup));
  const seats=seatTenths(totals[id]);return {id,label:blocs.find(b=>b.id===id)!.label,seats,shortfall:majorityShortfall(seats),incomplete,members,combined};
 });
 return {rows,max:raceScaleMax(rows.map(r=>r.seats)),isAverage};
}
