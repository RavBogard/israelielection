import { describe, expect, it } from "vitest";
import { VOTE_MAP_LINKS, voteMapLink } from "./votemap-links";
import { settlementRows } from "@/components/maps/SettlementsVote";
import { wbAreas } from "@/components/maps/geo";

describe("community vote-map links", () => {
  it("resolves every configured town and list to a vote-map URL", () => {
    for (const id of Object.keys(VOTE_MAP_LINKS)) {
      const link = voteMapLink(id)!;
      expect(link.href).toMatch(/^\/vote-map\?election=\d{4}&list=.+&locality=\d+$/);
      expect(link.text).toMatch(/^See .+ on the vote map: /);
    }
  });
  it("names the requested list and locality", () => {
    expect(voteMapLink("haredim.towns")!.href).toBe("/vote-map?election=2022&list=United+Torah+Judaism&locality=6100");
    expect(voteMapLink("nope")).toBeNull();
  });
});

describe("locator map data", () => {
  it("has all three Oslo areas and a Green Line", () => {
    for (const k of ["A", "B", "C"] as const) expect(wbAreas.areas[k].length).toBeGreaterThan(0);
    expect(wbAreas.greenLine.length).toBeGreaterThan(50);
  });
  it("finds the settlement localities of 2022 with a largest list", () => {
    const rows = settlementRows();
    expect(rows.length).toBe(124);
    expect(rows.filter((r) => r.leader).length).toBeGreaterThan(100);
  });
});
