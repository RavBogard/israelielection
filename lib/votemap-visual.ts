import { project, type Places, type VoteMapElection } from "./votemap";
import { partyColor } from "./party-colors";
export type MapMode = "single" | "mix" | "leader";
export const mapMode = (raw: string | null): MapMode => raw === "mix" || raw === "leader" ? raw : "single";
export const MODE_LABELS = {single:"One list's share",mix:"Vote mix",leader:"Leading list"};
export const OTHER_COLOR = "#9299a0";
/** Historical list names that run on, under the same party, in 2026: these take the 2026 list's colour. Only clear continuations; mergers and renamed alliances keep a historical colour. */
export const CONTINUES: Record<string,string> = {
  "Likud":"likud", "Shas":"shas", "United Torah Judaism":"utj", "Yisrael Beiteinu":"yb", "Ra'am (United Arab List)":"raam",
  "Hadash–Ta'al":"jl", "Otzma Yehudit":"otzma", "Religious Zionism":"rz",
};
// Other editorial colors identify exact historical list names, never current blocs or inferred party continuity.
const COLORS: Record<string,string> = {
  "Likud":"#2166ac", "Yesh Atid":"#f4a340", "Religious Zionism–Otzma Yehudit":"#8c510a", "National Unity":"#63b5cf",
  "Shas":"#7b3294", "United Torah Judaism":"#c2a5cf", "Yisrael Beiteinu":"#d73027", "Ra'am (United Arab List)":"#2c933e",
  "Hadash–Ta'al":"#a6d96a", "Labor":"#a65d45", "Meretz":"#1b9e77", "Balad":"#ff6f00", "Jewish Home":"#e879ae",
  "Blue and White":"#63b5cf", "Democratic Union":"#1b9e77", "Gesher":"#b47a44", "Joint List (Hadash, Ra'am, Ta'al, Balad)":"#2c933e",
  "Joint List (Hadash, Ta'al, Balad)":"#a6d96a", "Kulanu":"#72b7b2", "Labor–Gesher":"#a65d45", "Labor–Gesher–Meretz":"#a65d45",
  "New Hope":"#8c88c9", "New Right":"#e879ae", "Otzma Yehudit":"#b79b3b", "Ra'am–Balad":"#ff6f00",
  "Religious Zionism":"#8c510a", "Union of Right-Wing Parties":"#8c510a", "Yamina":"#e879ae", "Zehut":"#c1a83d",
};
export function listColor(name:string):string {return CONTINUES[name] ? partyColor(CONTINUES[name]) : COLORS[name] ?? OTHER_COLOR;}
/** Seven ramp steps from the low end to the list's own colour (CSS color-mix percentages of the list colour). */
export const RAMP_STEPS = [6, 20, 36, 52, 68, 84, 100];
export type VoteSlice = {name:string;votes:number;share:number;color:string;other:boolean};
export function voteMix(election:VoteMapElection,row:number[] | undefined):VoteSlice[] | null {
  if(!row || !Number.isSafeInteger(row[3]) || row[3]<=0)return null;
  const values=election.lists.map((_,i)=>row[4+i]);
  if(values.some(v=>!Number.isSafeInteger(v) || v<0))return null;
  const remainder=row[3]-values.reduce((n,v)=>n+v,0); if(remainder<0)return null;
  return [...election.lists.map((l,i)=>({name:l.name,votes:values[i],share:values[i]/row[3],color:listColor(l.name),other:false})),{name:"Other lists (combined)",votes:remainder,share:remainder/row[3],color:OTHER_COLOR,other:true}];
}
export function localLeader(mix:VoteSlice[] | null):{status:"missing"|"unresolved"|"tie"|"named";names:string[];share:number|null;color:string} {
  const unknown={names:[],share:null,color:OTHER_COLOR}; if(!mix)return {...unknown,status:"missing"};
  const named=mix.filter(s=>!s.other),max=Math.max(...named.map(s=>s.votes));
  if(!max || (mix.find(s=>s.other)?.votes ?? 0)>=max)return {...unknown,status:"unresolved"};
  const leaders=named.filter(s=>s.votes===max);
  return {status:leaders.length>1 ? "tie" : "named",names:leaders.map(s=>s.name),share:leaders[0].share,color:leaders.length>1 ? OTHER_COLOR : leaders[0].color};
}
export function wedgePath(start:number,end:number,r:number):string {
  if(end<=start)return "";
  if(end-start>=1-1e-12)return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r} Z`;
  const point=(f:number)=>[r*Math.sin(f*Math.PI*2),-r*Math.cos(f*Math.PI*2)];
  const a=point(start),b=point(end);
  return `M 0 0 L ${a[0]} ${a[1]} A ${r} ${r} 0 ${end-start>.5 ? 1 : 0} 1 ${b[0]} ${b[1]} Z`;
}
export type VoteMarker = {code:number;x:number;y:number;valid:number;mix:VoteSlice[]};
export function voteMarkers(election:VoteMapElection,places:Places):{markers:VoteMarker[];missingCoordinates:number} {
  const markers:VoteMarker[]=[];let missingCoordinates=0;
  for(const row of election.rows){const mix=voteMix(election,row);if(!mix)continue;const p=places[row[0]];
    if(!p || !p[1] || !p[2] || !Number.isFinite(p[1]) || !Number.isFinite(p[2])){missingCoordinates++;continue;}
    const [x,y]=project([p[2],p[1]]);markers.push({code:row[0],x,y,valid:row[3],mix});
  }return {markers,missingCoordinates};
}
export const markerRadius = (valid:number,maxValid:number,unit:number) => 26*unit*Math.sqrt(valid/maxValid);
export function visibleVoteMarkers(markers:VoteMarker[],view:{x:number;y:number;w:number;h:number},unit:number,maxValid:number,selected:number|null,limit=80) {
  const candidates=markers.filter(p=>p.x>=view.x && p.x<=view.x+view.w && p.y>=view.y && p.y<=view.y+view.h).sort((a,b)=>(b.code===selected ? 1 : 0)-(a.code===selected ? 1 : 0) || b.valid-a.valid);
  const shown:VoteMarker[]=[];
  for(const p of candidates){if(shown.length>=limit)break;const r=markerRadius(p.valid,maxValid,unit);
    if(shown.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=r+markerRadius(q.valid,maxValid,unit)+unit*2))shown.push(p);
  }return {shown,available:candidates.length};
}
