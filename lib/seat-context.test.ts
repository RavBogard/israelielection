import { describe, expect, it } from "vitest";
import {
  acceptsSeatContext,
  changedSeats,
  coherentSeats,
  contextVoteDependence,
  contextRoleTotals,
  contextToPoll,
  pinnedSeatHref,
  unmappedLists,
} from "./seat-context";
import { LANGS } from "./i18n";
import { FORMATION } from "./i18n/formation-live";
import { LIFECYCLE } from "./i18n/election-lifecycle";
import type { SharedSeatContext } from "./election-lifecycle/types";
const context = (
  patch: Partial<SharedSeatContext> = {},
): SharedSeatContext => ({
  schemaVersion: 1,
  election: "2026-10-27",
  revision: "a",
  snapshotRevision: "a",
  sequence: 1,
  updatedAt: "2026-10-28T00:00:00Z",
  evidenceStage: "official",
  basis: "official_seats",
  seatStatus: "official",
  pointMethod: "published_official_allocation",
  pointSeats: { a: 50, b: 50, new: 20 },
  parties: [{ id: "new", label: "New list", profiled: false }],
  sourceRefs: [],
  publishedAt: null,
  observedAt: "2026-10-28T00:00:00Z",
  correctionOf: null,
  freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
  ...patch,
});
describe("shared seat consumers", () => {
  it("requires one integer allocation of all120 seats", () => {
    expect(coherentSeats(context())).toBe(true);
    for (const seats of [{ a: 119 }, { a: 120.1 }, { a: 121, b: -1 }] as Record<
      string,
      number
    >[])
      expect(() => contextToPoll(context({ pointSeats: seats }))).toThrow();
  });
  it("retains unprofiled lists without assigning a known bloc", () => {
    const c = context();
    expect(contextToPoll(c).results.new.seats).toBe(20);
    expect(unmappedLists(c, [{ id: "a" }, { id: "b" }])).toEqual([
      { id: "new", label: "New list", seats: 20 },
    ]);
  });
  it("counts every elected list and preserves outside support/abstention", () => {
    expect(
      contextRoleTotals(context(), new Set(["a"]), { new: "abstain" }),
    ).toMatchObject({ yes: 50, no: 50, abstain: 20, passes: false });
    expect(
      contextRoleTotals(context(), new Set(["a"]), {
        b: "abstain",
        new: "support",
      }),
    ).toMatchObject({ yes: 70, no: 0, abstain: 50, passes: true });
  });
  it("accepts corrections by sequence and refuses stale overwrites", () => {
    const c = context();
    expect(
      acceptsSeatContext(
        c,
        context({ sequence: 2, updatedAt: "2026-10-27T00:00:00Z" }),
      ),
    ).toBe(true);
    expect(acceptsSeatContext(c, context({ sequence: 0 }))).toBe(false);
    expect(acceptsSeatContext(c, context({ election: "2022" }))).toBe(false);
  });
  it("includes unprofiled support in pivotal-party arithmetic", () => {
    expect(
      contextVoteDependence(context(), new Set(["a"]), { new: "support" }),
    ).toEqual(["a", "new"]);
  });
  it("pins a shared tool link while preserving all role query parameters", () => {
    expect(
      pinnedSeatHref(
        "/coalition-builder?poll=current&with=a&support=new&abstain=b#vote",
        context(),
      ),
    ).toBe(
      "/coalition-builder?poll=current&with=a&support=new&abstain=b&context=a#vote",
    );
  });
  it("highlights new, removed and changed lists", () => {
    expect(
      changedSeats(context(), context({ pointSeats: { a: 60, b: 60 } })),
    ).toEqual([
      { id: "a", before: 50, after: 60, change: 10 },
      { id: "b", before: 50, after: 60, change: 10 },
      { id: "new", before: 20, after: 0, change: -20 },
    ]);
  });
  it("provides every status/basis string in all seven editions", () => {
    for (const lang of LANGS) {
      expect(Object.keys(LIFECYCLE[lang])).toEqual(Object.keys(LIFECYCLE.en));
      for (const value of [
        ...Object.values(LIFECYCLE[lang]),
        ...Object.values(FORMATION[lang]),
      ])
        expect(typeof value === "string" && value.length > 0).toBe(true);
    }
  });
});
