import {describe,it,expect} from "vitest";
import {averagePoll,parties,blocs} from "./data";
import {homeRaceModel,majorityShortfall,raceScaleMax} from "./home-race";
import type {Poll} from "./types";
const base=():Poll=>({...averagePoll,id:"fixture",results:Object.fromEntries(parties.map(p=>[p.id,{seats:0,belowThreshold:true}])),combined:[]});
describe("homepage race arithmetic and evidence",()=>{
 it("uses independent fractional group totals and the exact shortfall to61",()=>{
  const poll=base();poll.results.likud={seats:31};poll.results.shas={seats:23.5};poll.results.yashar={seats:44.9};
  const model=homeRaceModel(poll,parties,blocs);expect(model.rows.map(r=>r.id)).toEqual(["net","opp","mid","arab"]);expect(model.rows[0].seats).toBe(54.5);expect(model.rows[0].shortfall).toBe(6.5);expect(model.rows[1].shortfall).toBe(16.1);expect(model.max).toBe(70);expect(majorityShortfall(61)).toBe(0);expect(majorityShortfall(75)).toBe(0);
 });
 it("shares a zero-based domain with room for61 and expands for a larger group",()=>{expect(raceScaleMax([54.5,44.9,4.5,16.1])).toBe(70);expect(raceScaleMax([111,9,0,0])).toBe(120);expect(raceScaleMax([0,0,0,0])).toBe(70);});
 it("retains missing versus modeled thresholdzero without treating the normalized model as a raw incomplete subtotal",()=>{
  const poll=base();delete poll.results.noam;const raw=homeRaceModel(poll,parties,blocs);expect(raw.rows[0].members.find(p=>p.id==="noam")).toMatchObject({seats:null,state:"missing"});expect(raw.rows[0].incomplete).toBe(true);expect(raw.rows[0].members.find(p=>p.id==="shas")).toMatchObject({seats:0,state:"below"});expect(homeRaceModel({...poll,id:"avg"},parties,blocs).rows[0].incomplete).toBe(false);
 });
 it("counts a within-group combined report once and never invents its individual split",()=>{
  const poll=base();poll.results.likud={seats:30};delete poll.results.shas;delete poll.results.utj;poll.combined=[{parties:["shas","utj"],seats:14,note:"Reported together"}];const model=homeRaceModel(poll,parties,blocs);expect(model.rows[0].seats).toBe(44);expect(model.rows[0].incomplete).toBe(false);expect(model.rows[0].members.find(p=>p.id==="shas")).toMatchObject({seats:null,state:"combined"});expect(model.rows[0].combined[0]).toMatchObject({seats:14,withinGroup:true});
  delete poll.results.raam;poll.combined=[{parties:["shas","raam"],seats:14,note:"Cross-group report"}];const crossed=homeRaceModel(poll,parties,blocs);expect(crossed.rows[0].seats).toBe(30);expect(crossed.rows[0].incomplete).toBe(true);expect(crossed.rows[3].incomplete).toBe(true);expect(crossed.rows[0].combined[0].withinGroup).toBe(false);
 });
});
