import { describe, expect, it } from "vitest";
import { histories, historySources, HISTORY_KINDS, filterHistories } from "./party-history";
import { parties } from "./data";
describe("organizational histories", () => {
  it("covers each profiled list with sourced chronological events and valid related links", () => {
    expect(histories.map(h=>h.id).sort()).toEqual(parties.map(p=>p.id).sort());
    for (const h of histories) {
      let year = 0;
      for (const e of h.events) { expect(Number(e.date.slice(0,4))).toBeGreaterThanOrEqual(year); year=Number(e.date.slice(0,4)); expect(HISTORY_KINDS[e.kind]).toBeTruthy(); expect(e.sources.length).toBeGreaterThan(0); for(const s of e.sources) expect(historySources[s]?.url).toMatch(/^https:/); }
      for (const id of h.related) expect(histories.some(x=>x.id===id)).toBe(true);
    }
  });
  it("distinguishes mergers from shared ballots and leader movement", () => {
    expect(histories.find(h=>h.id==="dem")?.events.find(e=>e.date==="2024")?.kind).toBe("partial");
    expect(histories.find(h=>h.id==="utj")?.events.find(e=>e.date==="1992")?.kind).toBe("alliance");
    expect(histories.find(h=>h.id==="byachad")?.events.find(e=>e.date==="2021")?.kind).toBe("leader");
    expect(histories.find(h=>h.id==="likud")?.events.find(e=>e.date==="1988")?.kind).toBe("merger");
  });
  it("searches predecessor names while respecting branches", () => {
    expect(filterHistories("all","meretz").map(h=>h.id)).toContain("dem");
    expect(filterHistories("Haredi parties","Meretz")).toEqual([]);
    expect(filterHistories("all","Yamina").map(h=>h.id)).toContain("byachad");
  });
});
