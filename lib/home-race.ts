import {allocate} from "../components/SeatGrid";
import {PARTY_COLOR_FAMILIES} from "./party-colors";
import {MAJORITY} from "./coalition";
import {AVERAGE_ID,BLOC_ORDER,BLOC_SEAT_ORDER,blocTotals,VARIANT_ID} from "./polls";
import {FORECAST_ID} from "./forecast";
import {RESULTS_ID} from "./results";
import type {BlocId,Party,Poll} from "./types";
import type {Lang} from "./i18n";
import home from "./i18n/home";
import {blocText,partyText} from "./i18n/overlay-text";
import type {SharedSeatContext} from "./election-lifecycle/types";
export const HOME_RACE_ORDER=BLOC_ORDER;
export const seatTenths=(value:number)=>Math.round(value*10)/10;
export const majorityShortfall=(seats:number)=>Math.max(0,seatTenths(MAJORITY-seatTenths(seats)));
/** `lang` "he" takes party and bloc names from the Hebrew overlay; then `nameLang`/`labelLang` say which language each name is actually in (absent in English, so the English page's data is unchanged). */
export function homeRaceModel(poll:Poll,parties:Party[],blocs:{id:BlocId;label:string}[],lang:Lang="en"){
 /** What the seats are: an average (one decimal), the forecast's central allocation (whole seats), the count, or one published poll. */
 const kind:"average"|"forecast"|"count"|"poll"=poll.id===AVERAGE_ID||poll.id===VARIANT_ID?"average":poll.id===FORECAST_ID?"forecast":poll.id===RESULTS_ID?"count":"poll";
 const totals=blocTotals(poll,parties),isAverage=kind==="average";
 const pname=(p:Party)=>lang!=="en"?partyText(p,"name",lang):{text:p.name,lang:"en" as Lang};
 const nameOf=(pid:string)=>{const p=parties.find(x=>x.id===pid);return p?pname(p).text:pid;};
 const rows=HOME_RACE_ORDER.map(id=>{
  const members=parties.filter(p=>p.bloc===id).map(p=>{
   const result=poll.results[p.id],combined=poll.combined.find(c=>c.parties.includes(p.id));
   const n=pname(p);
   return {id:p.id,name:n.text,...(lang!=="en"?{nameLang:n.lang}:{}) as {nameLang?:Lang},seats:result?result.seats:null,state:result?result.belowThreshold?"below" as const:"reported" as const:combined?"combined" as const:"missing" as const};
  });
  const combined=poll.combined.filter(c=>c.parties.some(pid=>parties.find(p=>p.id===pid)?.bloc===id)).map(c=>({...c,names:c.parties.map(nameOf),withinGroup:c.parties.every(pid=>parties.find(p=>p.id===pid)?.bloc===id)}));
  // A count is a known subtotal while lists are missing; a published poll simply does not report a list it leaves out.
  const incomplete=kind==="count"?members.some(p=>p.state==="missing")||combined.some(c=>!c.withinGroup):kind==="poll"&&combined.some(c=>!c.withinGroup);
  const bloc=blocs.find(b=>b.id===id)!,label=lang!=="en"?blocText(bloc,lang):{text:bloc.label,lang:"en" as Lang};
  const seats=seatTenths(totals[id]);return {id,label:label.text,...(lang!=="en"?{labelLang:label.lang}:{}) as {labelLang?:Lang},seats,labelSeats:undefined as number|undefined,shortfall:majorityShortfall(seats),incomplete,members,combined};
 });
 return {rows,isAverage,kind};
}

export type HomeBlocId = BlocId | "other";
type RaceRow = ReturnType<typeof homeRaceModel>["rows"][number];
export type HomeRaceModel = Omit<ReturnType<typeof homeRaceModel>, "rows"> & {
  rows: (Omit<RaceRow, "id"> & { id: HomeBlocId })[];
};
/** Update only the coherent current point; campaign comparison models remain untouched. */
export function contextRaceModel(
  template: HomeRaceModel,
  context: Pick<SharedSeatContext,"pointSeats"|"parties"|"seatStatus">,
  unknownLabel: string,
): HomeRaceModel {
  const known = new Set(
    template.rows
      .filter((row) => row.id !== "other")
      .flatMap((row) => row.members.map((p) => p.id)),
  );
  const rows: HomeRaceModel["rows"] = template.rows
    .filter((row) => row.id !== "other")
    .map((row) => {
      // Lists the context does not carry (withdrawn, or never modelled) leave the point rather than show as 0.
      const members = row.members.filter((p) => p.id in context.pointSeats).map((p) => ({
          ...p,
          seats: context.pointSeats[p.id] ?? 0,
          state: "reported" as const,
        })),
        seats = members.reduce((n, p) => n + p.seats, 0);
      return {
        ...row,
        members,
        seats,
        labelSeats: undefined,
        shortfall: majorityShortfall(seats),
        incomplete: false,
        combined: [],
      };
    });
  const members = Object.entries(context.pointSeats)
    .filter(([id, seats]) => seats > 0 && !known.has(id))
    .map(([id, seats]) => ({
      id,
      name: context.parties.find((p) => p.id === id)?.label ?? id,
      seats,
      state: "reported" as const,
    }));
  if (members.length)
    rows.push({
      id: "other",
      label: unknownLabel,
      seats: members.reduce((n, p) => n + p.seats, 0),
      labelSeats: undefined,
      shortfall: 0,
      incomplete: false,
      members,
      combined: [],
    });
  return {
    rows,
    isAverage: false,
    kind: context.seatStatus === "official" ? "count" : "forecast",
  };
}
export const HOME_MOSAIC_ORDER=BLOC_SEAT_ORDER;
/** Allocate bloc boundaries once; partition only each bloc's fixed whole-cell budget. */
export function homeMosaicLayout(model:HomeRaceModel,lang:Lang="en"){
 const t=home[lang].race;
 const rows=[...HOME_MOSAIC_ORDER,"other" as const].flatMap(id=>{const row=model.rows.find(row=>row.id===id);return row?[row]:[];});
 const counts=allocate(rows.map(row=>({id:row.id,seats:row.seats,label:row.label,color:""})));
 const order=PARTY_COLOR_FAMILIES.flatMap(f=>f.ids);let next=0;
 const blocks=rows.map((row,i)=>{
  const cells=Array.from({length:counts[i]},()=>next++);
  const parts=[...row.members.filter(p=>p.seats!==null).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).map(p=>({id:p.id,partyId:p.id as string|null,label:p.name,seats:p.seats!})),...row.combined.filter(c=>c.withinGroup).map(c=>({id:`combined-${c.parties.join("-")}`,partyId:null,label:t.combinedLabel(c.names.join(" + ")),seats:c.seats}))];
  const sum=parts.reduce((n,p)=>n+p.seats,0);
  // This apportions rounded cells inside this bloc, never 120 seats to one bloc.
  // Original fractional seat estimates remain untouched for labels and arithmetic.
  const partCounts=sum>0?allocate(parts.map(p=>({...p,color:"",seats:p.seats/sum*cells.length})),cells.length):parts.map(()=>0);
  let offset=0;const partition=parts.map((p,j)=>{const own=cells.slice(offset,offset+partCounts[j]);offset+=partCounts[j];return {...p,cells:own};});
  if(offset<cells.length)partition.push({id:`unknown-${row.id}`,partyId:null,label:t.unallocated,seats:0,cells:cells.slice(offset)});
  return {id:row.id,label:row.label,seats:row.seats,cells,parts:partition};
 });
 return {blocks,empty:Array.from({length:120-next},(_,i)=>next+i)};
}
/** Revealing is a presentation change only: every index keeps the same bloc owner. */
export function homeMosaicView(layout:ReturnType<typeof homeMosaicLayout>,selected:HomeBlocId|null){return layout.blocks.flatMap(block=>selected===block.id?block.parts.filter(p=>p.cells.length).map(p=>({...p,bloc:block.id,revealed:true})):block.cells.length?[{id:block.id,partyId:null,label:block.label,seats:block.seats,cells:block.cells,bloc:block.id,revealed:false}]:[]);}
