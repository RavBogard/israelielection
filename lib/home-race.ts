import {allocate} from "../components/SeatGrid";
import {PARTY_COLOR_FAMILIES} from "./party-colors";
import {MAJORITY} from "./coalition";
import {AVERAGE_ID,blocTotals} from "./polls";
import type {BlocId,Party,Poll} from "./types";
export const HOME_RACE_ORDER:BlocId[]=["net","opp","mid","arab"];
export const seatTenths=(value:number)=>Math.round(value*10)/10;
export const majorityShortfall=(seats:number)=>Math.max(0,seatTenths(MAJORITY-seatTenths(seats)));
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
 return {rows,isAverage};
}

export type HomeRaceModel=ReturnType<typeof homeRaceModel>;
export const HOME_MOSAIC_ORDER:BlocId[]=["net","mid","opp","arab"];
/** Allocate bloc boundaries once; partition only each bloc's fixed whole-cell budget. */
export function homeMosaicLayout(model:HomeRaceModel){
 const rows=HOME_MOSAIC_ORDER.map(id=>model.rows.find(row=>row.id===id)!);
 const counts=allocate(rows.map(row=>({id:row.id,seats:row.seats,label:row.label,color:""})));
 const order=PARTY_COLOR_FAMILIES.flatMap(f=>f.ids);let next=0;
 const blocks=rows.map((row,i)=>{
  const cells=Array.from({length:counts[i]},()=>next++);
  const parts=[...row.members.filter(p=>p.seats!==null).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).map(p=>({id:p.id,partyId:p.id as string|null,label:p.name,seats:p.seats!})),...row.combined.filter(c=>c.withinGroup).map(c=>({id:`combined-${c.parties.join("-")}`,partyId:null,label:`${c.names.join(" + ")} (combined; not separated)`,seats:c.seats}))];
  const sum=parts.reduce((n,p)=>n+p.seats,0);
  // This apportions rounded cells inside this bloc, never 120 seats to one bloc.
  // Original fractional seat estimates remain untouched for labels and arithmetic.
  const partCounts=sum>0?allocate(parts.map(p=>({...p,color:"",seats:p.seats/sum*cells.length})),cells.length):parts.map(()=>0);
  let offset=0;const partition=parts.map((p,j)=>{const own=cells.slice(offset,offset+partCounts[j]);offset+=partCounts[j];return {...p,cells:own};});
  if(offset<cells.length)partition.push({id:`unknown-${row.id}`,partyId:null,label:"Not separately allocated",seats:0,cells:cells.slice(offset)});
  return {id:row.id,label:row.label,seats:row.seats,cells,parts:partition};
 });
 return {blocks,empty:Array.from({length:120-next},(_,i)=>next+i)};
}
/** Revealing is a presentation change only: every index keeps the same bloc owner. */
export function homeMosaicView(layout:ReturnType<typeof homeMosaicLayout>,selected:BlocId|null){return layout.blocks.flatMap(block=>selected===block.id?block.parts.filter(p=>p.cells.length).map(p=>({...p,bloc:block.id,revealed:true})):block.cells.length?[{id:block.id,partyId:null,label:block.label,seats:block.seats,cells:block.cells,bloc:block.id,revealed:false}]:[]);}
