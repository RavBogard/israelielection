import {verifyQStash} from "@/lib/live-forecast/auth";
import {referenceDocuments} from "@/lib/reference/catalog";
import {generateReferenceTranslation} from "@/lib/reference/generation";
import {ReferenceValidationError} from "@/lib/reference/translations";
export const runtime="nodejs";
export const maxDuration=300;
const headers={"Cache-Control":"no-store"};
export async function POST(request:Request){
 let raw="";const reader=request.body?.getReader();if(!reader)return Response.json({error:"invalid_request"},{status:400,headers});
 const decoder=new TextDecoder();let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return Response.json({error:"request_too_large"},{status:413,headers})}raw+=decoder.decode(value,{stream:true})}raw+=decoder.decode();
 const base=process.env.ELECTION_LIFECYCLE_WORKER_URL;let destination:string|null=null;try{if(base&&new URL(base).protocol==="https:")destination=new URL("/api/reference/worker",base).href}catch{}
 const keys=[process.env.QSTASH_CURRENT_SIGNING_KEY,process.env.QSTASH_NEXT_SIGNING_KEY].filter((s):s is string=>!!s);
 if(!destination||!verifyQStash(request.headers.get("upstash-signature"),raw,destination,keys))return Response.json({error:"unauthorized"},{status:401,headers});
 let body;try{body=JSON.parse(raw)}catch{return Response.json({error:"invalid_request"},{status:400,headers})}
 if(body?.mode!=="generate"||!referenceDocuments.some(d=>d.id===body.id)||!["he","ar","fa","de","fr","zh"].includes(body.lang)||Object.keys(body).some(k=>!["mode","id","lang"].includes(k)))return Response.json({error:"invalid_request"},{status:400,headers});
 try{return Response.json({state:"validated",...await generateReferenceTranslation(body.id,body.lang),writes:0},{headers})}catch(error){const message=error instanceof Error?error.message:"translation_failed",code=/^[a-z0-9_]{1,80}$/.test(message)?message:"translation_failed";return Response.json({state:"rejected",code,...(error instanceof ReferenceValidationError?{diagnostic:error.diagnostic,usage:error.usage??[]}:{}),writes:0},{status:422,headers})}
}
