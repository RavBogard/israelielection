import type { TrendPoint } from "./trend";
export type ChartPoint = {date:string;avg:number|null;n:number|null};
/** Missing average dates remain gaps; zero is a separately reported threshold failure, never a missing observation. */
export function alignTrend(trend:TrendPoint[],dates:string[]):ChartPoint[] { const known=new Map(trend.map((p)=>[p.date,p]));return dates.map((date)=>known.get(date) ?? {date,avg:null,n:null}); }
export function lineSegments(points:ChartPoint[]):ChartPoint[][] { const out:ChartPoint[][]=[];let run:ChartPoint[]=[];for(const point of points){if(point.avg===null){if(run.length)out.push(run);run=[];}else run.push(point);}if(run.length)out.push(run);return out; }
/** Minimum four-seat span, rounded bounds and breathing room contain every raw poll and average, including threshold zero. */
export function zoomSeatDomain(values:(number|null)[],minimumSpan=4):[number,number] {
 const known=values.filter((n):n is number=>n!==null&&Number.isFinite(n));if(!known.length)return [0,minimumSpan];
 const min=Math.min(...known),max=Math.max(...known);let low=Math.max(0,Math.floor(min-0.5)),high=Math.ceil(max+0.5);
 if(high-low<minimumSpan){const mid=(low+high)/2;low=Math.max(0,Math.floor(mid-minimumSpan/2));high=low+minimumSpan;}return [low,high];
}
export function seatTicks(low:number,high:number):number[] {const span=high-low;const step=span>20?10:span>10?5:span>6?2:1;const ticks=[low];for(let n=Math.ceil(low/step)*step;n<high;n+=step)if(n>low)ticks.push(n);ticks.push(high);return ticks;}
export function trendSummary(points:ChartPoint[]) {const known=points.filter((p)=>p.avg!==null);const first=known[0],last=known.at(-1);return {first,last,change:first&&last?last.avg!-first.avg!:null};}
export function nearestDateIndex(dates:string[],timestamp:number):number {let best=0;dates.forEach((date,i)=>{if(Math.abs(Date.parse(date)-timestamp)<Math.abs(Date.parse(dates[best])-timestamp))best=i;});return best;}
