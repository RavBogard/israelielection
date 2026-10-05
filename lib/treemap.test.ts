import { describe, expect, it } from "vitest";
import { squarify } from "./treemap";

describe("squarify", () => {
  it("fills the box and never returns NaN, even with zero-size items", () => {
    const rects = squarify([{ id: "a", v: 10 }, { id: "b", v: 5 }, { id: "c", v: 0 }], 0, 0, 300, 200);
    expect(rects.map((r) => r.id)).toEqual(["a", "b"]);
    for (const r of rects) for (const n of [r.x, r.y, r.w, r.h]) expect(Number.isFinite(n)).toBe(true);
    expect(rects.reduce((s, r) => s + r.w * r.h, 0)).toBeCloseTo(300 * 200);
  });
  it("returns nothing for an empty box", () => {
    expect(squarify([{ id: "a", v: 1 }], 0, 0, 100, -4)).toEqual([]);
  });
});
