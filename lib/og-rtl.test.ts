import { describe, expect, it } from "vitest";
import { visualOrder } from "./og-rtl";

describe("visualOrder", () => {
  it("reverses Hebrew and keeps numbers and Latin left to right", () => {
    expect(visualOrder("עוד 21 ימים.")).toBe(".םימי 21 דוע");
    expect(visualOrder("גוש נתניהו 52.4")).toBe("52.4 והינתנ שוג");
    expect(visualOrder("ב-27 באוקטובר")).toBe("רבוטקואב 27-ב");
    expect(visualOrder("israelielection.org/he")).toBe("israelielection.org/he");
  });
  it("mirrors brackets", () => {
    expect(visualOrder("ספירה (שמורה)")).toBe("(הרומש) הריפס");
  });
});

