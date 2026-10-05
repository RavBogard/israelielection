import { describe, expect, it } from "vitest";
import { ballotLists, filterBallot } from "./ballot";
import data from "@/data/ballot-directory.json";
import { parties } from "./data";

describe("published ballot roster", () => {
  it("retains all 38 unique official rows with original names and record links", () => {
    expect(ballotLists).toHaveLength(38);
    expect(new Set(ballotLists.map(l=>l.id)).size).toBe(38);
    expect(new Set(ballotLists.map(l=>l.letters)).size).toBe(38);
    for (const l of ballotLists) { expect(l.hebrew).toMatch(/[א-ת]/); expect(l.source).toMatch(/^https:\/\/www.gov.il\/he\/pages\//); }
    expect(data.status).toContain("not final");
  });
  it("maps every profiled list exactly once without inventing leaders for unnamed table rows", () => {
    expect(ballotLists.filter(l=>l.profile).map(l=>l.profile).sort()).toEqual(parties.map(p=>p.id).sort());
    expect(ballotLists.find(l=>l.id === "shas")?.leader).toBeNull();
  });
  it("finds English, Hebrew, letters and leadership, respecting coverage", () => {
    expect(filterBallot(ballotLists,"  SHARREN ")[0].id).toBe("israel-first");
    expect(filterBallot(ballotLists,"נקי")[0].id).toBe("electoral-repair");
    expect(filterBallot(ballotLists,"הפיראטים")[0].id).toBe("pirates");
    expect(filterBallot(ballotLists,"","other")).toHaveLength(23);
    expect(filterBallot(ballotLists,"Likud","other")).toEqual([]);
  });
  it("keeps similarly named separate roster entries distinct", () => {
    expect(ballotLists.find(l=>l.id === "tekuma")?.letters).toBe("ק");
    expect(ballotLists.find(l=>l.id === "rz")?.letters).toBe("ט");
  });
});
