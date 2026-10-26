import {get,put,BlobPreconditionFailedError} from "@vercel/blob";
import {contentHash,type CaptureArchive} from "./captures";
import {makeCapture} from "./records";
import type {PrivateCaptureRef,SourceRecord} from "./types";
type BlobClient={get:typeof get;put:typeof put};
/** Private, content-addressed immutable captures; raw bytes never enter public projections. */
export class PrivateBlobArchive implements CaptureArchive{
 constructor(private token:string,private client:BlobClient={get,put}){}
 private key(value:string){if(!/^private\/[a-f0-9]{64}$/.test(value))throw new Error("capture_key_invalid");return value;}
 async read(ref:PrivateCaptureRef){
  const result=await this.client.get(this.key(ref.storageKey),{access:"private",token:this.token,useCache:false});
  if(!result||result.statusCode!==200)throw new Error("capture_unavailable");
  const body=new Uint8Array(await new Response(result.stream).arrayBuffer());
  if(body.length!==ref.byteLength||contentHash(body)!==ref.contentSha256)throw new Error("capture_content_conflict");
  return body;
 }
 async put(source:SourceRecord,body:Uint8Array,mediaType:string){
  const hash=contentHash(body),storageKey=this.key(`private/${hash}`);
  if(!body.length||source.captureHash!==hash)throw new Error("source_capture_hash_mismatch");
  const ref=makeCapture({contentSha256:hash,sourceRevisionId:source.revisionId,storageKey,mediaType,byteLength:body.length,observedAt:source.observedAt});
  try{await this.client.put(storageKey,Buffer.from(body),{access:"private",token:this.token,addRandomSuffix:false,allowOverwrite:false,contentType:mediaType});}
  catch(error){
   // A conflict may mean another worker stored the same bytes; verify through authenticated read.
   if(!(error instanceof BlobPreconditionFailedError)&&!/already exists/i.test(error instanceof Error?error.message:""))throw error;
  }
  await this.read(ref);
  return ref;
 }
}
export function configuredCaptureArchive(){return process.env.POLITICAL_RECORD_BLOB_TOKEN?new PrivateBlobArchive(process.env.POLITICAL_RECORD_BLOB_TOKEN):null;}
