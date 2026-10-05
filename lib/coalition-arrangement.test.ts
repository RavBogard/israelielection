import { describe, expect, it } from "vitest";
import { arrangement, arrangementWarnings, initialVoteDependence, restoreRoles, writeRoles } from "./coalition-arrangement";
import type { Party, Poll, PledgeRule } from "./types";

const parties = ["a", "b", "c"].map((id) => ({ id, name: id, tags: [], bloc: "opp" })) as unknown as Party[];
const poll = (seats: number[]): Poll => ({ id: "sample", pollster: "Fixture", results: Object.fromEntries(seats.map((seats, i) => [parties[i].id, { seats }])), combined: [] }) as unknown as Poll;

describe("initial confidence", () => {
  it("passes 60–59 with an abstention, but a tied vote fails", () => {
    expect(arrangement(new Set(["a"]), { c: "abstain" }, parties, poll([60, 59, 1])).outcome).toBe("passes");
    expect(arrangement(new Set(["a"]), {}, parties, poll([60, 59, 1])).outcome).toBe("fails");
  });
  it("counts outside support in the vote without counting it as cabinet seats", () => {
    const result = arrangement(new Set(["a"]), { c: "support" }, parties, poll([55, 59, 6]));
    expect(result.cabinet).toBe(55);
    expect(result.yes).toBe(61);
    expect(result.outcome).toBe("passes");
    expect(initialVoteDependence(new Set(["a"]), { c: "support" }, parties, poll([55, 59, 6]))).toEqual(["a", "c"]);
  });
  it("withholds a verdict for split combined groups or unaccounted seats", () => {
    const combined = { ...poll([55]), combined: [{ parties: ["b", "c"], seats: 65, note: "Together" }] };
    expect(arrangement(new Set(["a"]), { b: "support" }, parties, combined).outcome).toBe("incomplete");
    expect(arrangement(new Set(["a"]), {}, parties, poll([55, 54, 0])).outcome).toBe("incomplete");
  });
  it("labels fractional scenarios as illustrative and never creates a government from no cabinet", () => {
    expect(arrangement(new Set(["a"]), {}, parties, poll([60.5, 58.5, 1])).approximate).toBe(true);
    expect(arrangement(new Set(), { a: "support" }, parties, poll([70, 49, 1])).outcome).toBe("empty");
    expect(arrangement(new Set(["c"]), { a: "support" }, parties, poll([70, 50, 0])).outcome).toBe("empty");
  });
});

describe("shareable roles", () => {
  it("keeps legacy cabinet links and resolves duplicate/unknown role assignments", () => {
    const result = restoreRoles(new URLSearchParams("with=a,a&support=a,b,unknown&abstain=b,c"), ["a", "b", "c"]);
    expect([...result.cabinet]).toEqual(["a"]);
    expect(result.overrides).toEqual({ b: "support", c: "abstain" });
    const q = writeRoles(new URLSearchParams("poll=sample&extra=kept"), result.cabinet, result.overrides, ["a", "b", "c"]);
    expect(q.get("with")).toBe("a");
    expect(q.get("support")).toBe("b");
    expect(q.get("abstain")).toBe("c");
    expect(q.get("extra")).toBe("kept");
    expect(restoreRoles(q, ["a", "b", "c"])).toEqual(result);
  });
  it("does not turn a cabinet refusal into a refusal to abstain or support", () => {
    const rules = [{ id: "cabinet", kind: "pledge", when: { all: [{ party: "a" }, { party: "b" }] }, message: "Cannot join", source: "Fixture" }] as PledgeRule[];
    expect(arrangementWarnings(new Set(["a"]), { b: "support" }, parties, rules)).toEqual([]);
    expect(arrangementWarnings(new Set(["a", "b"]), {}, parties, rules)).toHaveLength(1);
  });
});
