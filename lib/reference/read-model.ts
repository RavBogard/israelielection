import { cache } from "react";
import { getPoliticalPlatformReadModel } from "@/lib/political-record/read-model";
import { type ElectionDefinition } from "@/lib/political-record/registry";
import type { ElectionLifecycleSnapshot } from "@/lib/election-lifecycle/types";
/** Selection is identity-based; a current snapshot must never fill a different edition. */
export function editionEvidence(elections:readonly ElectionDefinition[],id:string,lifecycle:ElectionLifecycleSnapshot|null) {
 const election=elections.find(e=>e.id===id);if(!election)return {state:"unknown" as const,election:null,lifecycle:null};
 return {state:"known" as const,election,lifecycle:lifecycle&&(lifecycle.election===election.id||lifecycle.election===election.electionDay)?lifecycle:null};
}
export const referenceReadModel=cache(getPoliticalPlatformReadModel);
