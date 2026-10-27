import type {ProposalDecision} from "@/lib/election-lifecycle/types";
export function proposalLedger(seats:Record<string,number>,decisions:ProposalDecision[]) {
 const totals={cabinet:0,support:0,abstain:0,oppose:0,undecided:0};
 for(const [id,n] of Object.entries(seats)) {const claims=decisions.filter(d=>d.partyId===id&&d.sourceEventIds.length>0);const unique=new Set(claims.map(d=>d.decision));const role=unique.size===1?claims[0].decision:"undecided";totals[role]+=n;}
 return totals;
}
