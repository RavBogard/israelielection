import { expect, it } from "vitest";
import { geographicReplay, historicalProfiles, parseLocalitySnapshot } from "./geography";
import type { VoteMapElection } from "../votemap";
const history: VoteMapElection={id:"synthetic",label:"synthetic",date:"2022-11-01",knesset:25,source:{results:"",csv:"",sha256:"",fetched:""},lists:[{letters:"מחל",name:"A",votes:100,seats:60},{letters:"שס",name:"B",votes:100,seats:60}],national:{eligible:300,voted:200,valid:200,other:0},envelopes:{valid:20,votes:[10,10],other:0},rows:[[1,150,100,100,90,10],[2,150,100,100,10,90]]};
it("retains corrected rows including decreases and separates envelope pseudo-localities",()=>{
 const csv="סמל ישוב,בזב,מצביעים,פסולים,כשרים,מחל,שס\n1,150,90,0,90,80,10\n9999,0,10,0,10,2,8";
 const rows=parseLocalitySnapshot(csv,{"מחל":"likud","שס":"shas"});expect(rows[0].valid).toBe(90);expect(rows[1].envelope).toBe(true);
 expect(()=>parseLocalitySnapshot(csv.replace("80,10","81,10"),{"מחל":"likud","שס":"shas"})).toThrow("inconsistent");
});
it("reconciles national priors while retaining geographic contrasts",()=>{
 const rows=historicalProfiles(history,{likud:.7,shas:.3});
 expect(rows.reduce((n,r)=>n+r.scores.likud*r.expectedValid,0)/200).toBeCloseTo(.7,5);expect(rows[0].scores.likud).toBeGreaterThan(rows[1].scores.likud);
});
it("requires explicit partial-locality semantics, preserves120 seats and blocks publication on synthetic replay",()=>{
 const args={history,counts:[{code:1,eligible:150,voted:30,valid:30,votes:{likud:27,shas:3},envelope:false}],priorDraws:[{likud:.5,shas:.5},{likud:.55,shas:.45}],blocs:{likud:"net",shas:"net"},agreements:[]};
 expect(()=>geographicReplay(args)).toThrow("coverage semantics");
 const result=geographicReplay({...args,coverage:{1:{countedStations:1,totalStations:3}}});expect(result.publicationEligible).toBe(false);expect(result.draws.every((d)=>Object.values(d).reduce((a,b)=>a+b,0)===120)).toBe(true);
 expect(geographicReplay({...args,coverage:{1:{countedStations:1,totalStations:3}}})).toEqual(result);
});
