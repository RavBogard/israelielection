/** Party Map accepts canonical query links and older party hash links, never arbitrary IDs. */
export function readPartyMapSelection(query:URLSearchParams,hash:string,valid:string[]):string|null {
 let legacy="";try{legacy=decodeURIComponent(hash.replace(/^#/,""));}catch{}
 const requested=query.has("party")?query.get("party"):legacy;return requested&&valid.includes(requested)?requested:null;
}
export function partyMapSelectionHref(query:URLSearchParams,hash:string,party:string|null,valid:string[]):string {
 const q=new URLSearchParams(query);if(party&&valid.includes(party))q.set("party",party);else q.delete("party");
 let legacy="";try{legacy=decodeURIComponent(hash.replace(/^#/,""));}catch{}
 const retained=valid.includes(legacy)?"":hash;return `/parties${q.size?`?${q}`:""}${retained}`;
}
