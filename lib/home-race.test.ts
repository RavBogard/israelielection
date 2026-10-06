import {describe,it,expect} from "vitest";
import {averagePoll,parties,blocs} from "./data";
import {homeRaceModel,majorityShortfall,homeMosaicLayout,homeMosaicView} from "./home-race";
import type {BlocId,Poll} from "./types";
const base=():Poll=>({...averagePoll,id:"fixture",results:Object.fromEntries(parties.map(p=>[p.id,{seats:0,belowThreshold:true}])),combined:[]});
const owners=(layout:ReturnType<typeof homeMosaicLayout>,selected:BlocId|null)=>homeMosaicView(layout,selected).flatMap(g=>g.cells.map(cell=>[cell,g.bloc] as const)).sort((a,b)=>a[0]-b[0]);
describe("homepage mosaic arithmetic and evidence",()=>{
 it("preserves fractional totals and exact shortfalls independently of rounded cells",()=>{
  const poll=base();poll.results.likud={seats:31};poll.results.shas={seats:23.5};poll.results.yashar={seats:48.9};
  const model=homeRaceModel(poll,parties,blocs);expect(model.rows.map(r=>r.id)).toEqual(["net","opp","mid","arab"]);expect(model.rows[0].seats).toBe(54.5);expect(model.rows[0].shortfall).toBe(6.5);expect(model.rows[1].shortfall).toBe(12.1);expect(majorityShortfall(61)).toBe(0);expect(majorityShortfall(75)).toBe(0);
 });
 it("keeps all120 cell owners and original bloc order identical through reveal, switch and reset",()=>{
  const layout=homeMosaicLayout(homeRaceModel(averagePoll,parties,blocs));expect(layout.blocks.map(b=>b.id)).toEqual(["net","mid","opp","arab"]);const initial=owners(layout,null);expect(initial).toHaveLength(120);expect(new Set(initial.map(([cell])=>cell)).size).toBe(120);
  for(const selected of ["net","opp","mid","arab",null] as const){expect(owners(layout,selected)).toEqual(initial);for(const group of homeMosaicView(layout,selected))expect(group.revealed).toBe(group.bloc===selected);}
 });
 it("apportions party cells only inside the fixed bloc budget without changing fractional estimates",()=>{
  const poll=base();poll.results.likud={seats:30};poll.results.shas={seats:24.4};poll.results.yashar={seats:48.3};poll.results.res={seats:7.1};poll.results.raam={seats:10.2};
  const layout=homeMosaicLayout(homeRaceModel(poll,parties,blocs)),net=layout.blocks[0];expect(net.cells).toHaveLength(55);expect(net.parts.reduce((n,p)=>n+p.cells.length,0)).toBe(55);expect(net.parts.find(p=>p.id==="shas")?.seats).toBe(24.4);expect(homeMosaicView(layout,"net").filter(g=>g.revealed).flatMap(g=>g.cells)).toEqual(net.cells);
 });
 it("leaves an empty poll unassigned rather than manufacturing party seats",()=>{
  const layout=homeMosaicLayout(homeRaceModel(base(),parties,blocs));expect(layout.empty).toHaveLength(120);expect(homeMosaicView(layout,"net")).toEqual([]);expect(layout.blocks.every(b=>b.parts.every(p=>p.cells.length===0))).toBe(true);
 });
 it("retains missing versus thresholdzero without calling the normalized model a raw incomplete subtotal",()=>{
  const poll=base();poll.results.likud={seats:54.5};delete poll.results.noam;const raw=homeRaceModel(poll,parties,blocs);expect(raw.rows[0].members.find(p=>p.id==="noam")).toMatchObject({seats:null,state:"missing"});expect(raw.rows[0].incomplete).toBe(true);expect(raw.rows[0].members.find(p=>p.id==="shas")).toMatchObject({seats:0,state:"below"});expect(homeRaceModel({...poll,id:"avg"},parties,blocs).rows[0].incomplete).toBe(false);
  const layout=homeMosaicLayout(raw);expect(layout.blocks[0].parts.some(p=>p.id==="noam")).toBe(false);expect(layout.blocks[0].parts.find(p=>p.id==="shas")?.cells).toEqual([]);
 });
 it("counts a within-group combined report once and never invents its individual split or a cross-group allocation",()=>{
  const poll=base();poll.results.likud={seats:30};delete poll.results.shas;delete poll.results.utj;poll.combined=[{parties:["shas","utj"],seats:14,note:"Reported together"}];const model=homeRaceModel(poll,parties,blocs);expect(model.rows[0].seats).toBe(44);expect(model.rows[0].incomplete).toBe(false);expect(model.rows[0].members.find(p=>p.id==="shas")).toMatchObject({seats:null,state:"combined"});
  const layout=homeMosaicLayout(model),combined=layout.blocks[0].parts.find(p=>p.partyId===null);expect(combined).toMatchObject({seats:14,partyId:null});expect(combined?.cells).toHaveLength(14);expect(layout.blocks[0].parts.some(p=>p.id==="shas"||p.id==="utj")).toBe(false);
  delete poll.results.raam;poll.combined=[{parties:["shas","raam"],seats:14,note:"Cross-group report"}];const crossed=homeRaceModel(poll,parties,blocs);expect(crossed.rows[0].seats).toBe(30);expect(crossed.rows[0].incomplete).toBe(true);expect(crossed.rows[3].incomplete).toBe(true);expect(homeMosaicLayout(crossed).blocks.flatMap(b=>b.parts).some(p=>p.id.startsWith("combined"))).toBe(false);
 });
});
describe("the Hebrew mosaic model",()=>{
 it("marks names by the language they are in and words the layout's own labels in Hebrew",()=>{
  const en=homeRaceModel(averagePoll,parties,blocs),he=homeRaceModel(averagePoll,parties,blocs,"he");
  expect(en.rows.every(r=>!("labelLang" in r)&&r.members.every(m=>!("nameLang" in m)))).toBe(true);
  expect(he.rows.every(r=>r.labelLang==="he"||(r.labelLang==="en"&&r.label===blocs.find(b=>b.id===r.id)!.label))).toBe(true);
  expect(he.rows.map(r=>r.seats)).toEqual(en.rows.map(r=>r.seats));
  const poll=base();poll.results.likud={seats:30};delete poll.results.shas;delete poll.results.utj;poll.combined=[{parties:["shas","utj"],seats:14,note:""}];
  const layout=homeMosaicLayout(homeRaceModel(poll,parties,blocs,"he"),"he");
  expect(layout.blocks[0].parts.find(p=>p.partyId===null)?.label).toMatch(/\(דיווח משותף; לא מופרד\)$/);
 });
});
