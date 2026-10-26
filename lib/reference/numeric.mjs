/** Preserve quantities and precision; accept unambiguous localized digit/separator forms. */
export function numericTokens(value){
 const text=String(value).replace(/[٠-٩۰-۹０-９]/g,c=>{const n=c.charCodeAt(0);return String(n>=0xff10?n-0xff10:n>=0x06f0?n-0x06f0:n-0x0660)}).replace(/٫|．/g,".").replace(/٬|，/g,",").replace(/٪/g,"%");
 return (text.match(/[0-9]+(?:[.,\u00a0\u202f][0-9]+)*(?:st|nd|rd|th)?%?/gi)??[]).map(token=>{
  token=token.replace(/(?:st|nd|rd|th)(?=%|$)/i,"");
  // Only well-formed groups are thousands. Ambiguous decimal punctuation is not guessed.
  token=token.replace(/^[0-9]{1,3}(?:[,\u00a0\u202f][0-9]{3})+(?=\.|%|$)/,group=>group.replace(/[,\u00a0\u202f]/g,""));
  return token;
 }).sort();
}
