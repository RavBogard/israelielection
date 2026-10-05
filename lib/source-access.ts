export type SourceAccess = { language?: "English" | "Hebrew"; access?: "Subscription may be required"; evidence?: string };
/** Small maintained allowlist: unknown hosts/paths make no claim about language or access. Checked Oct 5, 2026. */
export function sourceAccess(raw: string): SourceAccess {
  let u: URL; try {u=new URL(raw);}catch{return {};}
  const host=u.hostname.replace(/^www\./,"");
  if(!/^https?:$/.test(u.protocol))return {};
  if(host==="gov.il" && /^\/(he|en)\/pages\//.test(u.pathname))return {language:u.pathname.startsWith("/he/") ? "Hebrew" : "English"};
  if(host==="haaretz.com" && u.pathname.includes("/ty-article/"))return {language:"English",...(u.pathname.includes("/.premium/") ? {access:"Subscription may be required" as const,evidence:"https://www.pr.com/press-release/413200"} : {})};
  if(host==="jpost.com" && u.pathname.includes("/article-"))return {language:"English",...(u.pathname.startsWith("/premium/") ? {access:"Subscription may be required" as const,evidence:"https://payments.jpost.com/jpmagazine/product/24"} : {})};
  if(host==="ynetnews.com" && /^\/article\//.test(u.pathname))return {language:"English"};
  if(host==="ynet.co.il" && /^\/(news|articles|yedioth)\//.test(u.pathname))return {language:"Hebrew"};
  if(host==="en.idi.org.il" && /^\/(articles|israeli-elections-and-parties)\//.test(u.pathname))return {language:"English"};
  if(host==="idi.org.il" && /^\/(articles|policy)\//.test(u.pathname))return {language:"Hebrew"};
  if(host==="walla.co.il" && /^\/news\//.test(u.pathname))return {language:"Hebrew"};
  if(["timesofisrael.com","972mag.com","jta.org","jewishinsider.com","forward.com"].includes(host))return {language:"English"};
  return {};
}
export function sourceAccessLabels(raw:string):string[] { const s=sourceAccess(raw);return [s.language,s.access].filter((x):x is NonNullable<typeof x>=>!!x); }
