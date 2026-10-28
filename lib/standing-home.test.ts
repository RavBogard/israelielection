import { describe, expect, it } from "vitest";
import { nextElectionDue, swornGovernment } from "./standing-home";
import { governingSnapshot, formingSnapshot } from "./fixtures/standing-home";

describe("swornGovernment", () => {
  it("reads the sworn-in government only from a confirmed Knesset record of it", () => {
    const g = swornGovernment(governingSnapshot())!;
    expect(g.person).toBe("Fixture Person");
    expect(g.coalition.sort()).toEqual(["dem", "likud", "otzma", "rz", "shas", "utj", "yb"].sort());
    expect(g.coalitionSeats).toBe(68);
    expect(g.swornAt).toBe("2026-12-15T15:00:00Z");
  });
  it("stays off while forming, with no snapshot, or before the seats are official", () => {
    expect(swornGovernment(formingSnapshot())).toBeNull();
    expect(swornGovernment(null)).toBeNull();
    const s = governingSnapshot();
    s.seatContext.seatStatus = "provisional";
    expect(swornGovernment(s)).toBeNull();
  });
  it("falls back to the cabinet lists of the same person's proposal when the event names none", () => {
    const s = governingSnapshot();
    s.politics.events[0].partyIds = [];
    s.politics.proposals = [{ id: "p", person: "Fixture Person", decisions: [{ partyId: "likud", decision: "cabinet", sourceEventIds: [] }, { partyId: "shas", decision: "support", sourceEventIds: [] }] }];
    expect(swornGovernment(s)!.coalition).toEqual(["likud"]);
  });
});

describe("nextElectionDue", () => {
  it("is the third Tuesday of Heshvan in the year a four-year term ends", () => {
    expect(nextElectionDue("2026-10-27")).toBe("2030-11-12");
    // The 25th Knesset, elected 1 November 2022, was due to be replaced on 27 October 2026.
    expect(nextElectionDue("2022-11-01")).toBe("2026-10-27");
  });
});
