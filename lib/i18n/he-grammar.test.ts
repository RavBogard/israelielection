import { describe, expect, it } from "vitest";
import { list, plural, seatsHe } from "./he-grammar";

describe("Hebrew grammar", () => {
  const forms = { one: "סקר אחד", two: "שני סקרים", other: "סקרים" };
  it("chooses one, two (the dual) and other", () => {
    expect(plural(1, forms)).toBe("סקר אחד");
    expect(plural(2, forms)).toBe("שני סקרים");
    expect(plural(3, forms)).toBe("סקרים");
    expect(plural(0, forms)).toBe("סקרים");
    expect(plural(20, forms)).toBe("סקרים");
    expect(plural(4.5, forms)).toBe("סקרים");
  });
  it("falls back to other when no dual form is given", () => {
    expect(plural(2, { one: "א", other: "ב" })).toBe("ב");
  });
  it("counts seats with digits kept", () => {
    expect(seatsHe(1)).toBe("מנדט אחד");
    expect(seatsHe(2)).toBe("2 מנדטים");
    expect(seatsHe(61)).toBe("61 מנדטים");
    expect(seatsHe(4.1)).toBe("4.1 מנדטים");
  });
  it("joins lists with Hebrew conjunctions", () => {
    expect(list(["הליכוד", "ש״ס"])).toMatch(/^הליכוד ו-?ש״ס$/);
    expect(list(["א", "ב", "ג"])).toMatch(/^א, ב ו-?ג$/);
    expect(list(["א", "ב"], "or")).toBe("א או ב");
    expect(list(["א"])).toBe("א");
  });
});
