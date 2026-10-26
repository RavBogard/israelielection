import {createCipheriv,createDecipheriv,createHmac,randomBytes} from "node:crypto";
export const EMAIL_LOCALES=["en","he","ar","fa","de","fr","zh"] as const;
export type EmailLocale=typeof EMAIL_LOCALES[number];
export type EmailMessage={to:string;subject:string;text:string;unsubscribeUrl?:string};
export interface MailProvider{send(message:EmailMessage,idempotencyKey:string):Promise<{id:string}>}
export class PrivateCrypto{
 constructor(private key:Buffer,private secret:string){if(key.length!==32||secret.length<32)throw new Error("subscription_crypto_unconfigured");}
 hash(value:string){return createHmac("sha256",this.secret).update(value).digest("hex");}
 token(){return randomBytes(32).toString("base64url");}
 encrypt(value:unknown){const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",this.key,nonce);const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([nonce,cipher.getAuthTag(),body]).toString("base64url");}
 decrypt<T>(value:string):T{const bytes=Buffer.from(value,"base64url"),decipher=createDecipheriv("aes-256-gcm",this.key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());}
}
const COPY:Record<EmailLocale,{confirm:string;request:string;ignore:string;preferences:string;unsubscribe:string;correction:string}>={
 en:{confirm:"Confirm your election updates",request:"You requested updates. Confirm your email using this link:",ignore:"If you did not request this, ignore this email. No subscription is active.",preferences:"Email preferences",unsubscribe:"Unsubscribe",correction:"Correction"},
 he:{confirm:"אישור עדכוני הבחירות",request:"ביקשת לקבל עדכונים. יש לאשר את כתובת הדוא״ל בקישור:",ignore:"אם לא ביקשת זאת, אפשר להתעלם. המינוי אינו פעיל.",preferences:"העדפות דוא״ל",unsubscribe:"ביטול מינוי",correction:"תיקון"},
 ar:{confirm:"تأكيد تحديثات الانتخابات",request:"طلبت تلقي تحديثات. أكّد بريدك الإلكتروني عبر الرابط:",ignore:"إذا لم تطلب ذلك، تجاهل هذه الرسالة. الاشتراك غير مفعّل.",preferences:"تفضيلات البريد",unsubscribe:"إلغاء الاشتراك",correction:"تصحيح"},
 fa:{confirm:"تأیید به‌روزرسانی‌های انتخابات",request:"شما درخواست دریافت خبر کرده‌اید. ایمیل خود را با این پیوند تأیید کنید:",ignore:"اگر این درخواست شما نیست، این ایمیل را نادیده بگیرید. اشتراک فعال نیست.",preferences:"تنظیمات ایمیل",unsubscribe:"لغو اشتراک",correction:"اصلاحیه"},
 de:{confirm:"Wahl-Updates bestätigen",request:"Du hast Updates angefordert. Bestätige deine E-Mail-Adresse über diesen Link:",ignore:"Wenn du dies nicht angefordert hast, ignoriere diese E-Mail. Das Abonnement ist nicht aktiv.",preferences:"E-Mail-Einstellungen",unsubscribe:"Abbestellen",correction:"Korrektur"},
 fr:{confirm:"Confirmez vos nouvelles électorales",request:"Vous avez demandé des nouvelles. Confirmez votre adresse avec ce lien :",ignore:"Si vous n’avez pas fait cette demande, ignorez ce message. Aucun abonnement n’est actif.",preferences:"Préférences courriel",unsubscribe:"Se désabonner",correction:"Correction"},
 zh:{confirm:"确认选举更新订阅",request:"您申请接收更新。请通过此链接确认邮箱：",ignore:"如果您没有申请，请忽略此邮件。订阅尚未启用。",preferences:"邮件偏好设置",unsubscribe:"取消订阅",correction:"更正"},
};
export function confirmationEmail(locale:EmailLocale,link:string){const copy=COPY[locale];return {subject:copy.confirm,text:`${copy.request}\n${link}\n\n${copy.ignore}`};}
export function publicationEmail(locale:EmailLocale,subject:string,text:string,preferences:string,unsubscribe:string,correction=false){const copy=COPY[locale];return {subject:correction?`${copy.correction}: ${subject}`:subject,text:`${text}\n\n${copy.preferences}: ${preferences}\n${copy.unsubscribe}: ${unsubscribe}`,unsubscribeUrl:unsubscribe};}
export class ResendMailProvider implements MailProvider{
 constructor(private token:string,private from:string,private fetcher:typeof fetch=fetch){}
 async send(message:EmailMessage,idempotencyKey:string){
  const response=await this.fetcher("https://api.resend.com/emails",{method:"POST",redirect:"error",signal:AbortSignal.timeout(8000),headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},body:JSON.stringify({from:this.from,to:[message.to],subject:message.subject,text:message.text,...(message.unsubscribeUrl?{headers:{"List-Unsubscribe":`<${message.unsubscribeUrl}>`,"List-Unsubscribe-Post":"List-Unsubscribe=One-Click"}}:{})})});
  if(!response.ok)throw new Error(response.status===429?"email_rate_limited":response.status>=500?"email_provider_unavailable":"email_provider_rejected");
  const body=await response.json();if(typeof body.id!=="string")throw new Error("email_provider_invalid");return {id:body.id};
 }
}
