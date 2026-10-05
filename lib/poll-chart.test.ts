import {describe,it,expect} from "vitest";
import {alignTrend,lineSegments,zoomSeatDomain,seatTicks,trendSummary,nearestDateIndex} from "./poll-chart";
import {averageTrend} from "./trend";
import {allPolls,pollsData} from "./data";
describe("honest polling chart coordinates",()=>{
 it("keeps omitted dates as gaps without connecting, interpolating or replacing them with zero",()=>{const trend=[{date:"2026-09-01",avg:7,n:2},{date:"2026-09-03",avg:0,n:2},{date:"2026-09-04",avg:5,n:2}];const aligned=alignTrend(trend,["2026-09-01","2026-09-02","2026-09-03","2026-09-04"]);expect(aligned[1].avg).toBeNull();expect(lineSegments(aligned).map((r)=>r.map((p)=>p.avg))).toEqual([[7],[0,5]]);expect(trendSummary(aligned).change).toBe(-2);});
 it("keeps a flat series flat and uses a minimum four-seat zoom without cropping zero or outlying polls",()=>{const domain=zoomSeatDomain([12,12,12]);expect(domain[1]-domain[0]).toBeGreaterThanOrEqual(4);expect(trendSummary(alignTrend([{date:"a",avg:12,n:1},{date:"b",avg:12,n:1}],["a","b"])).change).toBe(0);expect(zoomSeatDomain([0,4.2,6])).toEqual([0,7]);expect(zoomSeatDomain([5,6,22])[1]).toBeGreaterThan(22);expect(seatTicks(...domain)).toContain(domain[0]);});
 it("does not change any calculated running-average value",()=>{const original=averageTrend("likud",allPolls,pollsData.config);const dates=[...new Set(allPolls.map((p)=>p.published))].sort();expect(alignTrend(original,dates).filter((p)=>p.avg!==null)).toEqual(original);expect(nearestDateIndex(["2026-09-01","2026-09-05"],Date.parse("2026-09-04"))).toBe(1);});
});
