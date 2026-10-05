import { describe, expect, it } from "vitest";
import type { Count, ResultsConfig } from "./results";
import { pollWatch, thresholdSeats, thresholdWatch } from "./watch";
import type { Party, Poll } from "./types";

const config: ResultsConfig = {
  updated: "2026-10-05",
  election: "2026-10-27",
  pollsClose: "2026-10-27T22:00:00+02:00",
  source: { url: "https://example.test/expc.csv", label: "test", note: "" },
  threshold: 0.0325,
  thresholdSource: "",
  letters: { a: "big", b: "mid", c: "edge", d: "under" },
  lettersSource: "",
  agreements: [],
  agreementsNote: "",
};

// 100,000 valid votes: threshold 3,250. "edge" sits just over it, "under" just below.
const count: Count = { eligible: 150000, voted: 101000, invalid: 1000, valid: 100000, localities: 10, votes: { a: 60000, b: 33600, c: 3300, d: 3100 } };

describe("thresholdWatch", () => {
  it("lists only the lists within the band, nearest first", () => {
    const w = thresholdWatch(count, config);
    expect(w.map((x) => x.partyId)).toEqual(["edge", "under"]);
  });
  it("marks passing and the margin in votes", () => {
    const [edge, under] = thresholdWatch(count, config);
    expect(edge.passing).toBe(true);
    expect(edge.margin).toBe(50);
    expect(under.passing).toBe(false);
    expect(under.margin).toBe(-150);
  });
  it("estimates what crossing would be worth", () => {
    const [, under] = thresholdWatch(count, config);
    expect(under.seatsAtThreshold).toBeGreaterThanOrEqual(3);
    expect(under.seatsAtThreshold).toBeLessThanOrEqual(5);
  });
  it("is empty before any valid votes", () => {
    expect(thresholdWatch({ ...count, valid: 0, votes: {} }, config)).toEqual([]);
  });
});

describe("pollWatch", () => {
  const party = (id: string, coalitionCard: Party["coalitionCard"] = "active") => ({ id, name: id, coalitionCard }) as Party;
  const poll = { id: "avg", results: { big: { seats: 30 }, near: { seats: 4.4 }, safe: { seats: 7 } } } as unknown as Poll;
  it("keeps parties polling near the threshold and those out of the Knesset", () => {
    const w = pollWatch(poll, [party("big"), party("near"), party("safe"), party("out", "out"), party("hidden", "hidden")], 0.0325);
    expect(w.map((x) => x.party.id)).toEqual(["out", "near"]);
  });
  it("puts the threshold at about four seats", () => {
    expect(thresholdSeats(0.0325)).toBe(4);
  });
});
