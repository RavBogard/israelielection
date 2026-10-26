import {describe,it,expect} from "vitest";
import {proposalLedger} from "./ledger";
describe("target-specific confirmed proposal ledger",()=>{
 it("counts every seat including unprofiled lists, with conflicts and missing evidence undecided",()=>{expect(proposalLedger({a:40,b:30,new:50},[{partyId:"a",decision:"support",sourceEventIds:["a"]},{partyId:"b",decision:"support",sourceEventIds:["b"]},{partyId:"b",decision:"oppose",sourceEventIds:["c"]}])).toEqual({cabinet:0,support:40,abstain:0,oppose:0,undecided:80});});
 it("does not borrow another proposal's positions or count unsourced claims",()=>{expect(proposalLedger({a:120},[{partyId:"a",decision:"support",sourceEventIds:[]}]).undecided).toBe(120);expect(proposalLedger({a:120},[]).support).toBe(0);});
});
