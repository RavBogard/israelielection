import { describe, expect, it } from "vitest";
import { nextCountSummary } from "./results-summary";
import type { CountSummary } from "@/app/api/count/route";
const data: CountSummary = { state: "open", freshness: "fresh", fetchedAt: "2026-10-28T00:00:00Z", attemptedAt: "2026-10-28T00:00:00Z", sourceUpdatedAt: null, valid: 100, localities: 1, turnout: 0.5, envelopes: false, blocs: [] };
describe("masthead fallback", () => {
  it("retains its count and capture time on error JSON and transport failure", () => {
    for (const failure of [null, { state: "error" } as CountSummary]) expect(nextCountSummary(data, failure, "later")).toEqual({ ...data, freshness: "stale", attemptedAt: "later" });
  });
  it("replaces stale with fresh, and never leaks a count before close", () => {
    expect(nextCountSummary({ ...data, freshness: "stale" }, data, "later")).toBe(data);
    expect(nextCountSummary(data, { state: "closed" }, "later")).toEqual({ state: "closed" });
  });
});
