import {createHmac,timingSafeEqual} from "node:crypto";
import parties from "../../data/parties.json";
import {getElectionLifecycle} from "../election-lifecycle/server";
import {currentElection,ELECTIONS,electionById} from "./registry";
import {configuredPoliticalRecords} from "./postgres";
import {sharedLimit} from "./rate-limit";
import {recordHash} from "./hash";
export type ApiCollection="elections"|"entities"|"events"|"publications";
type Cursor={collection:ApiCollection;electionId:string;view:"history"|"latest";asOf:string;after:string;basis:"postgres"|"bridge";limit:number};
export const API_RIGHTS={structuredData:"attribution_and_source_terms_required",thirdPartyContent:"rights_reserved_no_raw_capture_export",rawCaptures:false,sourceQuotes:false};
export function encodeCursor(cursor:Cursor,secret:string){
 const body=Buffer.from(JSON.stringify(cursor)).toString("base64url");
 return body+"."+createHmac("sha256",secret).update(body).digest("base64url");
}
export function decodeCursor(value:string,secret:string):Cursor{
 if(value.length>3000)throw new Error("invalid_cursor");
 const [body,signature,...extra]=value.split(".");
 const expected=createHmac("sha256",secret).update(body??"").digest();
 const supplied=Buffer.from(signature??"","base64url");
 if(extra.length||supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new Error("invalid_cursor");
 const cursor=JSON.parse(Buffer.from(body,"base64url").toString()) as Cursor;
 if(!["elections","entities","events","publications"].includes(cursor.collection)||!["history","latest"].includes(cursor.view)||!["postgres","bridge"].includes(cursor.basis)||typeof cursor.asOf!=="string"||typeof cursor.after!=="string"||!Number.isInteger(cursor.limit)||cursor.limit<1||cursor.limit>100)throw new Error("invalid_cursor");
 return cursor;
}
/** Public export allowlist by omission: raw evidence and private storage metadata never leave here. */
export function publicRecord(value:unknown):unknown{
 if(Array.isArray(value))return value.map(publicRecord);
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).filter(([key])=>!["evidenceQuote","captureIds","captures","body","storageKey","importAudit"].includes(key)).map(([key,item])=>[key,publicRecord(item)]));
 return value;
}
export async function publicApi(request:Request,collection:string){
 if(process.env.PUBLIC_V2_API_ENABLED!=="true"||!["elections","entities","events","publications"].includes(collection))return Response.json({error:"not_found"},{status:404});
 const headers={"Cache-Control":"no-store","Access-Control-Allow-Origin":"*","X-Content-Type-Options":"nosniff"};
 try{
  const budget=await sharedLimit("public-api",600,60);
  if(!budget.allowed)return Response.json({error:"rate_limited"},{status:429,headers:{...headers,"Retry-After":String(budget.retryAfter)}});
  const secret=process.env.PUBLIC_API_CURSOR_SECRET;
  if(!secret||secret.length<32)return Response.json({error:"api_unconfigured"},{status:503,headers});
  const url=new URL(request.url),electionId=url.searchParams.get("election")??currentElection().id,view=url.searchParams.get("view")??"latest";
  if(!electionById(electionId)||!["history","latest"].includes(view))return Response.json({error:"invalid_selection"},{status:400,headers});
  const limit=Math.max(1,Math.min(100,Number(url.searchParams.get("limit")??50)));
  if(!Number.isInteger(limit))return Response.json({error:"invalid_limit"},{status:400,headers});
  const encoded=url.searchParams.get("cursor"),cursor=encoded?decodeCursor(encoded,secret):null;
  if(cursor&&(cursor.collection!==collection||cursor.electionId!==electionId||cursor.view!==view||cursor.limit!==limit))throw new Error("invalid_cursor");
  const repository=process.env.POLITICAL_RECORD_PUBLIC_READ_ENABLED==="true"&&["events","publications"].includes(collection)?configuredPoliticalRecords():null;
  if(repository){
   try{
    if(cursor&&cursor.basis!=="postgres")return Response.json({error:"snapshot_changed"},{status:409,headers});
    const page=await repository.page({kind:collection==="events"?"event":"publication",electionId,view:view as Cursor["view"],after:cursor?.after??"0",asOf:cursor?.asOf,limit});
    const next:Cursor={collection:collection as ApiCollection,electionId,view:view as Cursor["view"],asOf:page.asOf,after:page.after,basis:"postgres",limit};
    return Response.json({schemaVersion:2,electionId,storage:"postgres",historyReady:true,asOfCursor:page.asOf,nextCursor:page.more?encodeCursor(next,secret):null,records:publicRecord(page.records),rights:API_RIGHTS},{headers});
   }finally{await repository.close();}
  }
  if(collection==="publications")return Response.json({schemaVersion:2,electionId,storage:"unconfigured",historyReady:false,records:[],rights:API_RIGHTS,error:"durable_publications_unavailable"},{status:503,headers});
  const lifecycle=collection==="events"?await getElectionLifecycle():null;
  if(collection==="events"&&!lifecycle)return Response.json({error:"current_evidence_unavailable"},{status:503,headers});
  if(collection==="events"&&view==="history")return Response.json({error:"durable_history_unavailable"},{status:503,headers});
  const records=collection==="elections"?ELECTIONS:collection==="entities"?parties.parties.map(party=>({id:`party:${party.id}`,partyId:party.id,name:party.name,short:party.short,recordType:"party_reference",electionId})):lifecycle!.politics.events;
  const asOf=recordHash(records);
  if(cursor&&(cursor.basis!=="bridge"||cursor.asOf!==asOf))return Response.json({error:"snapshot_changed"},{status:409,headers});
  const after=Number(cursor?.after??0);
  if(!Number.isSafeInteger(after)||after<0)throw new Error("invalid_cursor");
  const next:Cursor={collection:collection as ApiCollection,electionId,view:view as Cursor["view"],asOf,after:String(after+limit),basis:"bridge",limit};
  return Response.json({schemaVersion:2,electionId,storage:collection==="events"?"redis_current_only":"reference_registry",historyReady:false,asOfCursor:asOf,nextCursor:after+limit<records.length?encodeCursor(next,secret):null,records:publicRecord(records.slice(after,after+limit)),rights:API_RIGHTS},{headers});
 }catch(error){return Response.json({error:error instanceof Error&&error.message==="invalid_cursor"?"invalid_cursor":"api_unavailable"},{status:error instanceof Error&&error.message==="invalid_cursor"?400:503,headers});}
}
