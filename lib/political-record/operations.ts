import {configuredPoliticalRecords} from "./postgres";
import {configuredCaptureArchive} from "./blob";
import {collectCbs} from "./cbs";
import {shadowLifecycle} from "./shadow";
import type {LifecycleLedger} from "../election-lifecycle/types";
/** Bounded shadow mirror; a failed mirror never changes the authoritative Redis publication. */
export async function mirrorPublishedLifecycle(ledger:LifecycleLedger){
 if(process.env.POLITICAL_RECORD_SHADOW_ENABLED!=="true")return {status:"disabled"};
 const repository=configuredPoliticalRecords(),archive=configuredCaptureArchive();
 if(!repository||!archive){await repository?.close();return {status:"unconfigured"};}
 try{
  const events=ledger.events.slice(-20),seatSnapshots=ledger.seatSnapshots.slice(-1);
  const refs=[...events.flatMap(e=>e.sources),...seatSnapshots.flatMap(s=>s.sourceRefs)];
  let bytes=0;
  const captures=ledger.captures.filter(c=>refs.some(r=>r.id===c.source.id&&r.captureHash===c.source.captureHash&&r.observedAt===c.source.observedAt)).filter(c=>{bytes+=Buffer.byteLength(c.body);return bytes<=2000000;}).slice(-10);
  const result=await shadowLifecycle(repository,{...ledger,events,seatSnapshots,captures},archive);
  return {status:result.ready?"compared":"mismatch",compared:result.compared};
 }catch{return {status:"unavailable"};}
 finally{try{await repository.close();}catch{/* Mirror cleanup cannot fail a live publication. */}}
}
export async function collectPlatformSources(){
 if(process.env.POLITICAL_PLATFORM_COLLECT_ENABLED!=="true")return {status:"disabled"};
 const repository=configuredPoliticalRecords();
 if(!repository)return {status:"unconfigured"};
 try{return await collectCbs(repository,configuredCaptureArchive());}
 catch{return {status:"source_unavailable",sourceId:"cbs:price:120010"};}
 finally{await repository.close();}
}
