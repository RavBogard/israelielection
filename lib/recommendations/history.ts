export const READING_KEY="israel-votes-reading-v1",RETENTION_MS=30*24*60*60*1000;
export type ReadingState={enabled:boolean;history:{id:string;at:number}[]};
export const emptyReading=():ReadingState=>({enabled:false,history:[]});
export function readHistory(raw:string|null,known:readonly string[],now=Date.now()):ReadingState {
 try{const value=JSON.parse(raw??"null");if(value?.enabled!==true)return emptyReading();return {enabled:true,history:(Array.isArray(value.history)?value.history:[]).filter((x:{id:string;at:number})=>known.includes(x?.id)&&Number.isFinite(x.at)&&x.at<=now&&now-x.at<RETENTION_MS).slice(-100)}}catch{return emptyReading()}
}
export function recordReading(state:ReadingState,id:string,known:readonly string[],now=Date.now()):ReadingState {
 if(!state.enabled||!known.includes(id))return state;
 return {enabled:true,history:[...state.history.filter(x=>x.id!==id&&now-x.at<RETENTION_MS),{id,at:now}].slice(-100)};
}
export function suggestedReading<T extends {id:string;topic:string}>(catalog:readonly T[],state:ReadingState,current:string|null):T[] {
 if(!state.enabled||!state.history.length)return [];
 const visited=new Set(state.history.map(h=>h.id)),topics=state.history.flatMap(h=>{const item=catalog.find(c=>c.id===h.id);return item?[item.topic]:[]});
 return catalog.filter(c=>c.id!==current&&!visited.has(c.id)&&topics.includes(c.topic)).sort((a,b)=>topics.filter(t=>t===b.topic).length-topics.filter(t=>t===a.topic).length||a.id.localeCompare(b.id)).slice(0,3);
}
