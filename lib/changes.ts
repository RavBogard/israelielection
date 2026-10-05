import data from "@/data/material-changes.json";
export type MaterialChange = {
  id:string; title:string; date:string; loggedAt:string; topic:string; kind:string; before:string; after:string; why:string; limit:string;
  tools:{label:string;href:string}[]; sources:{title:string;url:string;date:string|null}[];
  review:{method:string;checked:string;human:string|null}; history:{date:string;note:string;href:string|null}[]; supersedes:string[];
};
export const changes = data.entries as MaterialChange[];
export const changeTopics = [...new Set(changes.map(e=>e.topic))];
export type ChangeFilters = {topic:string;from:string;to:string;sinceLast:boolean;savedOnly:boolean;basis:"effective"|"logged"};
export type ChangeReader = {bookmarks:string[];lastVisit:string|null;previousVisit:string|null};
const validDate = (v:string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
const timestamp = (v:unknown):string|null => typeof v==="string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null;
export function changeFilters(params:URLSearchParams):ChangeFilters {
  const from=params.get("from") ?? "",to=params.get("to") ?? "",topic=params.get("topic") ?? "all";
  return {topic:changeTopics.includes(topic) ? topic : "all",from:validDate(from) ? from : "",to:validDate(to) ? to : "",sinceLast:params.get("since")==="last",savedOnly:params.get("saved")==="1",basis:params.get("basis")==="logged" ? "logged" : "effective"};
}
export function parseChangeReader(raw:string):ChangeReader {
  try {
    const d=JSON.parse(raw);
    return {bookmarks:Array.isArray(d.bookmarks) ? [...new Set(d.bookmarks.filter((id:unknown):id is string=>typeof id==="string" && /^[a-z0-9-]{1,100}$/.test(id)))].slice(0,200) as string[] : [],lastVisit:timestamp(d.lastVisit),previousVisit:timestamp(d.previousVisit)};
  }catch{return {bookmarks:[],lastVisit:null,previousVisit:null};}
}
export function recordChangeVisit(reader:ChangeReader, now:string):ChangeReader {
  return {...reader,previousVisit:reader.lastVisit,lastVisit:now};
}
export function toggleChangeBookmark(reader:ChangeReader,id:string):ChangeReader {
  return {...reader,bookmarks:reader.bookmarks.includes(id) ? reader.bookmarks.filter(x=>x!==id) : [...reader.bookmarks,id]};
}
export function filterChanges(entries:MaterialChange[],filters:ChangeFilters,reader:ChangeReader):MaterialChange[] {
  return entries.filter(e=>{
    const date=filters.basis==="logged" ? e.loggedAt.slice(0,10) : e.date;
    return (filters.topic==="all" || e.topic===filters.topic) && (!filters.from || date>=filters.from) && (!filters.to || date<=filters.to) &&
      (!filters.savedOnly || reader.bookmarks.includes(e.id)) && (!filters.sinceLast || !reader.previousVisit || Date.parse(e.loggedAt)>Date.parse(reader.previousVisit));
  }).sort((a,b)=>(filters.basis==="logged" ? b.loggedAt.localeCompare(a.loggedAt) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));
}
