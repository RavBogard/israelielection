import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import type {SqlPool,SqlSession} from "./postgres";
import {recordHash} from "./hash";
import {PrivateCrypto,ResendMailProvider,confirmationEmail,publicationEmail,EMAIL_LOCALES,type EmailLocale,type MailProvider} from "./email";
export const SUBSCRIPTION_TOPICS=["digest","results","formation","policies"] as const;
type Preference={locale:EmailLocale;topics:string[];consentVersion:string};
type DeliveryPayload={subject:string;text:string;unsubscribeUrl?:string;tokenHash?:string};
export function validatePreferences(locale:unknown,topics:unknown):{locale:EmailLocale;topics:string[]}{
 if(typeof locale!=="string"||!EMAIL_LOCALES.includes(locale as EmailLocale)||!Array.isArray(topics)||!topics.length||topics.length>4||topics.some(topic=>typeof topic!=="string"||!SUBSCRIPTION_TOPICS.includes(topic as typeof SUBSCRIPTION_TOPICS[number]))||new Set(topics).size!==topics.length)throw new Error("invalid_preferences");
 return {locale:locale as EmailLocale,topics:topics.toSorted()};
}
export class SubscriptionService{
 constructor(private pool:SqlPool,private crypto:PrivateCrypto,private mail:MailProvider,private origin:string,private consentVersion:string){
  const url=new URL(origin);if(url.protocol!=="https:"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)throw new Error("subscription_origin_invalid");
 }
 async close(){await this.pool.end();}
 private async tx<T>(operation:(client:SqlSession)=>Promise<T>){const client=await this.pool.connect();try{await client.query("BEGIN");const result=await operation(client);await client.query("COMMIT");return result;}catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}}
 private link(action:string,token:string){return `${this.origin.replace(/\/$/,"")}/subscriptions/${action}?token=${encodeURIComponent(token)}`;}
 private async token(client:SqlSession,id:string,purpose:string,payload:unknown,now:string,expiresAt:string|null){
  const raw=this.crypto.token(),hash=this.crypto.hash(`${purpose}:${raw}`);
  await client.query("INSERT INTO political_private.subscription_tokens(token_hash,subscriber_id,purpose,payload_ciphertext,expires_at,created_at) VALUES($1,$2,$3,$4,$5,$6)",[hash,id,purpose,this.crypto.encrypt(payload),expiresAt,now]);
  return {raw,hash};
 }
 private async findToken(client:SqlSession,raw:string,purpose:string,now:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(raw))throw new Error("invalid_token");
  const result=await client.query("SELECT * FROM political_private.subscription_tokens WHERE token_hash=$1 AND purpose=$2 AND consumed_at IS NULL AND (expires_at IS NULL OR expires_at>$3) FOR UPDATE",[this.crypto.hash(`${purpose}:${raw}`),purpose,now]);
  if(!result.rows[0])throw new Error("invalid_token");return result.rows[0];
 }
 async subscribe(email:unknown,locale:unknown,topics:unknown,consent:unknown,now=new Date().toISOString()){
  const preferences=validatePreferences(locale,topics);
  if(consent!==true||typeof email!=="string"||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email))throw new Error("invalid_subscription");
  const normalized=email.trim().toLowerCase(),emailHash=this.crypto.hash(`email:${normalized}`);
  return this.tx(async client=>{
   // Serialize requests for the same address without storing/logging it as a lock key.
   await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[emailHash]);
   let subscriber=(await client.query("SELECT * FROM political_private.subscribers WHERE email_hash=$1 FOR UPDATE",[emailHash])).rows[0];
   if(subscriber&&(subscriber.consent_state==="confirmed"||Date.parse(now)-Date.parse(String(subscriber.requested_at))<900000))return {status:"accepted"};
   if(subscriber?.suppression_reason==="bounce"||subscriber?.suppression_reason==="complaint")return {status:"accepted"};
   const id=subscriber?String(subscriber.id):randomUUID();
   if(!subscriber){
    await client.query("INSERT INTO political_private.subscribers(id,email_hash,email_ciphertext,locale,topics,consent_state,consent_version,requested_at) VALUES($1,$2,$3,$4,$5,'pending',$6,$7)",[id,emailHash,this.crypto.encrypt(normalized),preferences.locale,JSON.stringify(preferences.topics),this.consentVersion,now]);
    subscriber={id};
   }else await client.query("UPDATE political_private.subscribers SET requested_at=$2 WHERE id=$1",[id,now]);
   const token=await this.token(client,id,"confirm",{...preferences,consentVersion:this.consentVersion},now,new Date(Date.parse(now)+86400000).toISOString());
   const copy=confirmationEmail(preferences.locale,this.link("confirm",token.raw));
   const payload:DeliveryPayload={...copy,tokenHash:token.hash};
   await client.query("INSERT INTO political_private.deliveries(id,subscriber_id,kind,status,payload_ciphertext,created_at,next_attempt_at,retry_until) VALUES($1,$2,'confirm','queued',$3,$4,$4,$5) ON CONFLICT DO NOTHING",[recordHash({confirm:token.hash}),id,this.crypto.encrypt(payload),now,new Date(Date.parse(now)+23*3600000).toISOString()]);
   return {status:"accepted"};
  });
 }
 async confirm(raw:string,now=new Date().toISOString()){
  return this.tx(async client=>{
   const token=await this.findToken(client,raw,"confirm",now),id=String(token.subscriber_id);
   const subscriber=(await client.query("SELECT * FROM political_private.subscribers WHERE id=$1 FOR UPDATE",[id])).rows[0];
   if(["bounce","complaint"].includes(String(subscriber.suppression_reason)))throw new Error("invalid_token");
   const preferences=this.crypto.decrypt<Preference>(String(token.payload_ciphertext));
   validatePreferences(preferences.locale,preferences.topics);
   await client.query("UPDATE political_private.subscribers SET consent_state='confirmed',locale=$2,topics=$3,consent_version=$4,confirmed_at=$5,suppressed_at=NULL,suppression_reason=NULL WHERE id=$1",[id,preferences.locale,JSON.stringify(preferences.topics),preferences.consentVersion,now]);
   await client.query("UPDATE political_private.subscription_tokens SET consumed_at=$2 WHERE subscriber_id=$1 AND consumed_at IS NULL",[id,now]);
   const manage=await this.token(client,id,"preferences",{},now,new Date(Date.parse(now)+90*86400000).toISOString());
   const unsubscribe=await this.token(client,id,"unsubscribe",{},now,null);
   return {status:"confirmed",preferencesToken:manage.raw,unsubscribeToken:unsubscribe.raw,locale:preferences.locale,topics:preferences.topics};
  });
 }
 async preferences(raw:string,update?:{locale:unknown;topics:unknown},now=new Date().toISOString()){
  return this.tx(async client=>{
   const token=await this.findToken(client,raw,"preferences",now);
   const row=(await client.query("SELECT * FROM political_private.subscribers WHERE id=$1 FOR UPDATE",[token.subscriber_id])).rows[0];
   if(row.consent_state!=="confirmed")throw new Error("invalid_token");
   if(update){const preferences=validatePreferences(update.locale,update.topics);await client.query("UPDATE political_private.subscribers SET locale=$2,topics=$3 WHERE id=$1",[row.id,preferences.locale,JSON.stringify(preferences.topics)]);return {status:"updated",...preferences};}
   return {status:"ready",locale:row.locale,topics:row.topics};
  });
 }
 private async suppress(client:SqlSession,id:unknown,reason:string,now:string){
  await client.query("UPDATE political_private.subscribers SET consent_state='suppressed',suppressed_at=$2,suppression_reason=$3 WHERE id=$1",[id,now,reason]);
  await client.query("UPDATE political_private.deliveries SET status='suppressed',failure_code='subscriber_suppressed' WHERE subscriber_id=$1 AND status IN ('queued','sending')",[id]);
  // Unsubscribe remains idempotent; other scoped tokens cannot undo suppression.
  await client.query("UPDATE political_private.subscription_tokens SET consumed_at=$2 WHERE subscriber_id=$1 AND purpose!='unsubscribe' AND consumed_at IS NULL",[id,now]);
 }
 async unsubscribe(raw:string,now=new Date().toISOString()){
  return this.tx(async client=>{const token=await this.findToken(client,raw,"unsubscribe",now);await this.suppress(client,token.subscriber_id,"unsubscribe",now);return {status:"unsubscribed"};});
 }
 private async currentPublication(client:SqlSession,revision:string){
  const result=await client.query("SELECT * FROM political_record.record_revisions WHERE revision_id=$1 AND kind='publication'",[revision]);
  const publication=result.rows[0];if(!publication||publication.assertion_status!=="confirmed")return null;
  const latest=(await client.query("SELECT revision_id,assertion_status FROM political_record.record_revisions WHERE record_id=$1 ORDER BY insertion_cursor DESC LIMIT 1",[publication.record_id])).rows[0];
  if(latest?.revision_id!==revision||latest.assertion_status!=="confirmed")return null;
  const payload=publication.payload as {recordRevisionIds?:unknown;data?:Record<string,unknown>};
  if(!Array.isArray(payload.recordRevisionIds)||!payload.recordRevisionIds.length||payload.recordRevisionIds.some(id=>typeof id!=="string"||!/^[a-f0-9]{64}$/.test(id)))return null;
  for(const id of payload.recordRevisionIds){
   const fact=(await client.query("SELECT * FROM political_record.record_revisions WHERE revision_id=$1",[id])).rows[0];
   if(!fact||fact.assertion_status!=="confirmed"||fact.evidence_class!=="primary_confirmed")return null;
   const current=(await client.query("SELECT revision_id FROM political_record.record_revisions WHERE record_id=$1 ORDER BY insertion_cursor DESC LIMIT 1",[fact.record_id])).rows[0];
   if(current?.revision_id!==id)return null;
  }
  return publication;
 }
 /** Called from the private outbox worker; only qualified exact-revision editions may be queued. */
 async queuePublication(revision:string,now=new Date().toISOString()){
  return this.tx(async client=>{
   const publication=await this.currentPublication(client,revision);if(!publication)return {status:"suppressed",queued:0};
   const payload=publication.payload as {data?:{topics?:unknown;delivery?:unknown;correctsRevisionId?:unknown}};
   const topics=Array.isArray(payload.data?.topics)?payload.data.topics.filter((topic):topic is string=>typeof topic==="string"&&SUBSCRIPTION_TOPICS.includes(topic as typeof SUBSCRIPTION_TOPICS[number])):[];
   if(!topics.length)return {status:"unqualified_topics",queued:0};
   let queued=0;
   const subscribers=(await client.query("SELECT * FROM political_private.subscribers WHERE consent_state='confirmed' ORDER BY id LIMIT 100")).rows;
   for(const subscriber of subscribers){
    const selected=subscriber.topics as string[];
    if(!selected.some(topic=>topics.includes(topic))||selected.includes("digest")&&!selected.some(topic=>topic!=="digest"&&topics.includes(topic))&&payload.data?.delivery!=="digest")continue;
    const editions=(await client.query("SELECT DISTINCT ON(record_id) * FROM political_record.record_revisions WHERE kind='edition' ORDER BY record_id,insertion_cursor DESC")).rows;
    const edition=editions.find(row=>{const p=row.payload as Record<string,unknown>;return row.assertion_status==="confirmed"&&p.publicationRevisionId===revision&&p.translatedFromRevisionId===revision&&p.locale===subscriber.locale&&p.state==="ready";});
    const content=(edition?.payload as {content?:{subject?:unknown;text?:unknown}}|undefined)?.content;
    if(!content||typeof content.subject!=="string"||!content.subject||content.subject.length>200||typeof content.text!=="string"||!content.text||content.text.length>30000)continue;
    const kind=typeof payload.data?.correctsRevisionId==="string"?"correction":"publication";
    const id=recordHash({subscriberId:subscriber.id,revision,kind});
    if((await client.query("SELECT id FROM political_private.deliveries WHERE id=$1",[id])).rows.length)continue;
    const preferences=await this.token(client,String(subscriber.id),"preferences",{},now,new Date(Date.parse(now)+90*86400000).toISOString());
    const unsubscribe=await this.token(client,String(subscriber.id),"unsubscribe",{},now,null);
    const copy=publicationEmail(subscriber.locale as EmailLocale,content.subject,content.text,this.link("preferences",preferences.raw),this.link("unsubscribe",unsubscribe.raw),kind==="correction");
    const result=await client.query("INSERT INTO political_private.deliveries(id,subscriber_id,publication_revision_id,kind,status,payload_ciphertext,created_at,next_attempt_at,retry_until) VALUES($1,$2,$3,$4,'queued',$5,$6,$6,$7) ON CONFLICT DO NOTHING RETURNING id",[id,subscriber.id,revision,kind,this.crypto.encrypt(copy),now,new Date(Date.parse(now)+23*3600000).toISOString()]);
    queued+=result.rowCount??0;
   }
   return {status:"queued",queued};
  });
 }
 async processOutbox(now=new Date().toISOString()){
  const client=await this.pool.connect();
  try{
   const intents=(await client.query("SELECT aggregate_revision_id FROM political_record.outbox_intents WHERE topic IN ('publication_committed','record_corrected') ORDER BY created_at DESC LIMIT 10")).rows;
   let queued=0;for(const intent of intents)queued+=(await this.queuePublication(String(intent.aggregate_revision_id),now)).queued;
   return {status:"processed",queued};
  }finally{client.release();}
 }
 async deliver(now=new Date().toISOString(),limit=5){
  const summary={sent:0,suppressed:0,failed:0};
  for(let n=0;n<Math.min(5,limit);n++){
   const result=await this.tx(async client=>{
    const delivery=(await client.query("SELECT * FROM political_private.deliveries WHERE (status='queued' OR status='sending' AND lease_until<$1) AND next_attempt_at<=$1 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[now])).rows[0];
    if(!delivery)return "empty";
    const subscriber=(await client.query("SELECT * FROM political_private.subscribers WHERE id=$1 FOR UPDATE",[delivery.subscriber_id])).rows[0];
    if(Date.parse(now)>Date.parse(String(delivery.retry_until))){await client.query("UPDATE political_private.deliveries SET status='ambiguous',failure_code='idempotency_window_expired' WHERE id=$1",[delivery.id]);return "failed";}
    const payload=this.crypto.decrypt<DeliveryPayload>(String(delivery.payload_ciphertext));
    const confirmToken=delivery.kind==="confirm"?(await client.query("SELECT token_hash FROM political_private.subscription_tokens WHERE token_hash=$1 AND purpose='confirm' AND consumed_at IS NULL AND expires_at>$2",[payload.tokenHash,now])).rows[0]:null;
    const blocked=delivery.kind==="confirm"?!confirmToken||["bounce","complaint"].includes(String(subscriber.suppression_reason)):subscriber.consent_state!=="confirmed"||!(await this.currentPublication(client,String(delivery.publication_revision_id)));
    if(blocked){await client.query("UPDATE political_private.deliveries SET status='suppressed',failure_code='consent_or_revision_changed' WHERE id=$1",[delivery.id]);return "suppressed";}
    await client.query("UPDATE political_private.deliveries SET status='sending',attempts=attempts+1,lease_until=$2 WHERE id=$1",[delivery.id,new Date(Date.parse(now)+60000).toISOString()]);
    try{
     const message={to:this.crypto.decrypt<string>(String(subscriber.email_ciphertext)),subject:payload.subject,text:payload.text,unsubscribeUrl:payload.unsubscribeUrl?.replace("/subscriptions/unsubscribe?","/api/subscriptions/unsubscribe?")};
     const sent=await this.mail.send(message,String(delivery.id));
     await client.query("UPDATE political_private.deliveries SET status='sent',provider_id=$2,lease_until=NULL,failure_code=NULL WHERE id=$1",[delivery.id,sent.id]);return "sent";
    }catch{
     await client.query("UPDATE political_private.deliveries SET status=$2,lease_until=NULL,failure_code='provider_unavailable',next_attempt_at=$3 WHERE id=$1",[delivery.id,Number(delivery.attempts)>=4?"failed":"queued",new Date(Date.parse(now)+300000).toISOString()]);return "failed";
    }
   });
   if(result==="empty")break;summary[result]++;
  }
  return summary;
 }
 async webhook(id:string,type:string,providerId:string,now=new Date().toISOString()){
  return this.tx(async client=>{
   const receipt=await client.query("INSERT INTO political_private.webhook_receipts(id,event_type,received_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",[id,type,now]);
   if(!receipt.rowCount)return {status:"duplicate"};
   if(["email.bounced","email.complained"].includes(type)){
    const delivery=(await client.query("SELECT subscriber_id FROM political_private.deliveries WHERE provider_id=$1",[providerId])).rows[0];
    if(delivery)await this.suppress(client,delivery.subscriber_id,type==="email.bounced"?"bounce":"complaint",now);
   }
   return {status:"accepted"};
  });
 }
}
export function configuredSubscriptions(){
 if(process.env.SUBSCRIPTIONS_ENABLED!=="true"||process.env.SUBSCRIPTION_DELIVERY_ENABLED!=="true")return null;
 const {POLITICAL_RECORD_DATABASE_URL, SUBSCRIPTION_ENCRYPTION_KEY,SUBSCRIPTION_TOKEN_SECRET,SUBSCRIPTION_SITE_ORIGIN,SUBSCRIPTION_CONSENT_VERSION,RESEND_API_KEY,RESEND_FROM,RESEND_DOMAIN_VERIFIED,RESEND_WEBHOOK_SECRET}=process.env;
 if(!POLITICAL_RECORD_DATABASE_URL||!SUBSCRIPTION_ENCRYPTION_KEY||!SUBSCRIPTION_TOKEN_SECRET||!SUBSCRIPTION_SITE_ORIGIN||!SUBSCRIPTION_CONSENT_VERSION||!RESEND_API_KEY||!RESEND_FROM||RESEND_DOMAIN_VERIFIED!=="true"||!RESEND_WEBHOOK_SECRET)return null;
 return new SubscriptionService(new Pool({connectionString:POLITICAL_RECORD_DATABASE_URL,max:2,connectionTimeoutMillis:1500,statement_timeout:10000}),new PrivateCrypto(Buffer.from(SUBSCRIPTION_ENCRYPTION_KEY,"base64"),SUBSCRIPTION_TOKEN_SECRET),new ResendMailProvider(RESEND_API_KEY,RESEND_FROM),SUBSCRIPTION_SITE_ORIGIN,SUBSCRIPTION_CONSENT_VERSION);
}
