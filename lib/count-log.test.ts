import { describe, expect, it } from "vitest";
import { blocSeats, countLogFrom } from "./count-log";
import type { SharedSeatContext } from "./election-lifecycle/types";

const snap = (over: Partial<SharedSeatContext>) =>
  ({
    basis: "partial_count",
    observedAt: "2026-10-28T10:00:00Z",
    countSourceUpdatedAt: "2026-10-28T09:00:00Z",
    pointSeats: { a: 40, b: 30, c: 10, d: 5 },
    parties: [
      { id: "a", label: "A", profiled: true, bloc: "net" },
      { id: "b", label: "B", profiled: true, bloc: "opp" },
      { id: "c", label: "C", profiled: true, bloc: "arab" },
      { id: "d", label: "D", profiled: true },
    ],
    ...over,
  }) as SharedSeatContext;

describe("count log", () => {
  it("adds up seats by bloc and leaves lists with no bloc out", () => {
    expect(blocSeats(snap({}))).toEqual({ net: 40, opp: 30, mid: 0, arab: 10 });
  });
  it("lists one row per committee file, newest first, keeping the latest projection of each file", () => {
    const rows = countLogFrom([
      snap({ countSourceUpdatedAt: "2026-10-28T08:00:00Z", countCoverage: 0.5 }),
      snap({ countSourceUpdatedAt: "2026-10-28T12:00:00Z", countCoverage: 0.86, observedAt: "2026-10-28T12:05:00Z" }),
      snap({ countSourceUpdatedAt: "2026-10-28T12:00:00Z", countCoverage: 0.86, observedAt: "2026-10-28T12:30:00Z", pointSeats: { a: 41, b: 30, c: 10, d: 5 } }),
      snap({ basis: "official_seats", countSourceUpdatedAt: "2026-10-28T13:00:00Z" }),
    ]);
    expect(rows.map((r) => r.fileAt)).toEqual(["2026-10-28T12:00:00Z", "2026-10-28T08:00:00Z"]);
    expect(rows[0].blocs.net).toBe(41);
    expect(rows[1].counted).toBe(0.5);
  });
});
