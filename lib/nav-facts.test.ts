import { describe, expect, it } from "vitest";
import { clip, navFacts } from "./nav-facts";

describe("menu facts", () => {
  it("states dated, counted facts and drops a group with nothing to report", () => {
    expect(navFacts({ newestPoll: "2026-10-06", newestBriefing: "2026-10-05", netSeats: 49.6, localities: 1215, elections: ["2022-11-01", "1977-05-17", "1981-06-30"] })).toEqual({
      polls: "Newest poll Oct 6, briefing Oct 5",
      parties: "Netanyahu bloc 49.6 of 120, polling average",
      places: "1,215 localities in the 2022 count",
      how: "3 elections from 1977 to 2022",
    });
    expect(navFacts({ netSeats: 0, localities: 0, elections: [] })).toEqual({});
    expect(navFacts({ newestBriefing: "2026-10-05", netSeats: NaN, localities: 0, elections: ["2022-11-01"] })).toEqual({ polls: "Briefing Oct 5" });
  });
  it("clips captions at a word", () => {
    expect(clip("short", 10)).toBe("short");
    expect(clip("The High Court rejected a petition", 20)).toBe("The High Court…");
  });
});
