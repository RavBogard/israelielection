import { describe, expect, it } from "vitest";
import parties from "../data/parties.json";
import { isOutgoingSet, outgoingGovernment as g, outgoingHref } from "./outgoing-government";

const ids = new Set(parties.parties.map((p) => p.id));
const sources = [...g.events.map((e) => e.source), ...g.status.sources, g.noam.source];

describe("outgoing government data", () => {
  it("links only polled parties", () => {
    for (const id of g.with) {
      expect(ids.has(id), id).toBe(true);
      expect(parties.parties.find((p) => p.id === id)!.coalitionCard, id).toBe("active");
    }
  });
  it("events run in date order and start at the 2022 count", () => {
    const dates = g.events.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
    expect(g.events[0].seatsAfter).toBe(g.seats2022);
    for (const e of g.events) expect(e.seatsAfter === null || (e.seatsAfter > 0 && e.seatsAfter <= 120), e.date).toBe(true);
  });
  it("every source is dated https and not Wikipedia", () => {
    for (const s of sources) {
      expect(s.date, s.url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const u = new URL(s.url);
      expect(u.protocol).toBe("https:");
      expect(u.hostname).not.toMatch(/wikipedia\.org$/);
    }
  });
  it("uses the house terms", () => {
    const prose = [g.status.text, g.noam.text, ...g.events.map((e) => e.text)].join(" ");
    expect(prose).not.toMatch(/Lieberman|far-right|the conflict|Judea and Samaria|caretaker/i);
    expect(prose).toContain("transitional government");
  });
});

describe("helpers", () => {
  it("builds the Builder link and matches the exact set", () => {
    expect(outgoingHref()).toBe("/coalition-builder?with=likud,otzma,rz,shas,utj&poll=avg");
    expect(isOutgoingSet(["utj", "shas", "rz", "otzma", "likud"])).toBe(true);
    expect(isOutgoingSet(["likud", "otzma", "rz", "shas"])).toBe(false);
    expect(isOutgoingSet(["likud", "otzma", "rz", "shas", "utj", "poi"])).toBe(false);
  });
});
