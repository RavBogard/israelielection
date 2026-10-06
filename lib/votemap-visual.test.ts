import {describe,it,expect} from "vitest";
import {historicalElections} from "./votemap-data";
import {partyColor} from "./party-colors";
import {readFileSync} from "node:fs";
import {voteMix,localLeader,listColor,CONTINUES,OTHER_COLOR,markerRadius,voteMarkers,visibleVoteMarkers,wedgePath,VM_RAMP,RAMP_STEPS,rampLab,oklab,deltaE} from "./votemap-visual";
const election={...historicalElections[4],lists:historicalElections[4].lists.slice(0,2)};
describe("truthful geographic vote views",()=>{
  it("retains named values and the combined remainder; unavailable data is not zero",()=>{const mix=voteMix(election,[1,100,100,100,40,35])!;expect(mix.map(s=>s.votes)).toEqual([40,35,25]);expect(mix.reduce((n,s)=>n+s.share,0)).toBe(1);expect(voteMix(election,undefined)).toBeNull();expect(voteMix(election,[1,0,0,0,0,0])).toBeNull();expect(voteMix(election,[1,100,100,100,90,20])).toBeNull();});
  it("distinguishes plurality, named tie and an Other total that conceals the leader",()=>{expect(localLeader(voteMix(election,[1,100,100,100,40,35])).status).toBe("named");expect(localLeader(voteMix(election,[1,100,100,100,45,45])).status).toBe("tie");expect(localLeader(voteMix(election,[1,100,100,100,30,25])).status).toBe("unresolved");expect(localLeader(voteMix(election,[1,100,100,100,40,20])).status).toBe("unresolved");expect(localLeader(null).status).toBe("missing");});
  it("uses area rather than radius for valid-vote counts",()=>{const small=markerRadius(100,400,1),large=markerRadius(400,400,1);expect(large**2/small**2).toBe(4);expect(markerRadius(100,400,.5)).toBe(small*.5);expect(wedgePath(0,1,2).match(/ A /g)).toHaveLength(2);expect(wedgePath(0,0,2)).toBe("");});
  it("keeps colors stable for exact names and distinct inside every original election",()=>{for(const e of historicalElections){expect(new Set(e.lists.map(l=>listColor(l.name))).size).toBe(e.lists.length);expect(e.lists.every(l=>listColor(l.name)!==OTHER_COLOR)).toBe(true);const row=e.rows.find(r=>r[3]>0)!;expect(voteMix(e,row)!.reduce((n,s)=>n+s.votes,0)).toBe(row[3]);}});
  it("reconciles every valid locality across all five elections without negative Other",()=>{for(const e of historicalElections)for(const row of e.rows){const mix=voteMix(e,row);if(row[3]===0){expect(mix).toBeNull();continue;}expect(mix).not.toBeNull();expect(mix!.reduce((n,s)=>n+s.votes,0)).toBe(row[3]);expect(mix!.at(-1)!.votes).toBeGreaterThanOrEqual(0);expect(mix!.slice(0,-1).map(s=>s.votes)).toEqual(row.slice(4));}});
  it("excludes missing coordinates without silently inventing centroids",()=>{const e={...election,rows:[[1,100,100,100,40,35],[2,100,100,100,40,35]]};const result=voteMarkers(e,{1:["A",32,35],2:["B",0,0]});expect(result.markers).toHaveLength(1);expect(result.missingCoordinates).toBe(1);});
  it("declutters in-place, counts omitted markers and retains a selected overlapping town",()=>{const mix=voteMix(election,[1,100,100,100,40,35])!;const points=[{code:1,x:50,y:50,valid:400,mix},{code:2,x:51,y:50,valid:100,mix},{code:3,x:150,y:50,valid:100,mix}];const view={x:0,y:0,w:100,h:100};const out=visibleVoteMarkers(points,view,1,400,2);expect(out.available).toBe(2);expect(out.shown.map(p=>p.code)).toEqual([2]);expect(out.shown[0].x).toBe(51);expect(visibleVoteMarkers(points,{...view,w:200},.01,400,null).shown).toHaveLength(3);});
  it("gives lists that continue into 2026 their party color, only for names in the files",()=>{const names=new Set(historicalElections.flatMap(e=>e.lists.map(l=>l.name)));for(const [name,id] of Object.entries(CONTINUES)){expect(names.has(name)).toBe(true);expect(listColor(name)).toBe(partyColor(id));}expect(listColor("Yesh Atid")).not.toBe(partyColor("byachad"));});
  it("keeps neighbouring share steps, and the low step against outside land, distinguishable in both themes",()=>{
    const hues=new Set([...historicalElections.flatMap(e=>e.lists.map(l=>listColor(l.name))),...["likud","otzma","rz","noam","poi","shas","utj","byachad","yashar","dem","yb","bw","res","jl","raam"].map(partyColor)]);
    for(const [theme,min,land] of [["light",.025,.05],["dark",.05,.12]] as const)for(const h of hues){const r=rampLab(h,theme);
      for(let i=1;i<r.length;i++)expect(deltaE(r[i],r[i-1]),`${theme} ${h} step ${i}`).toBeGreaterThanOrEqual(min);
      expect(deltaE(r[0],oklab(VM_RAMP[theme].land)),`${theme} ${h} land`).toBeGreaterThanOrEqual(land);}
    expect(oklab(VM_RAMP.dark.low)[0]-oklab(VM_RAMP.dark.land)[0]).toBeGreaterThan(.1);
    const css=readFileSync("components/votemap.css","utf8");
    for(const t of Object.values(VM_RAMP)){expect(css).toContain(`--vm-low: ${t.low}`);expect(css).toContain(`--vm-land: ${t.land}`);}
    expect(css).toContain(`var(--vm-hue) ${VM_RAMP.dark.topHue}%, #ffffff`);
    for(const p of RAMP_STEPS.slice(0,-1))expect(css).toContain(`var(--vm-top) ${p}%, var(--vm-low)`);
  });
});
