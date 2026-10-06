import { describe, expect, it } from "vitest";
import { longDate, mediumDate, shortDate } from "./format";

describe("date formatters", () => {
  it("keep the English output unchanged", () => {
    expect(shortDate("2026-10-02")).toBe("Oct 2");
    expect(mediumDate("2026-10-02")).toBe("Oct 2, 2026");
    expect(longDate("2026-10-02")).toBe("October 2, 2026");
    expect(shortDate("2026-01-31", "en")).toBe("Jan 31");
  });
  it("write Hebrew dates through he-IL: compact day first, prose with the long month (STYLE.md)", () => {
    expect(shortDate("2026-10-02", "he")).toBe("2.10");
    expect(mediumDate("2026-10-02", "he")).toBe("2.10.26");
    expect(longDate("2026-10-02", "he")).toBe("2 באוקטובר 2026");
    expect(longDate("2026-10-27", "he")).toBe("27 באוקטובר 2026");
    for (const f of [shortDate, mediumDate, longDate]) expect(f("2026-10-02", "he")).not.toContain("׳");
  });
  it("never shift the day with the time zone", () => {
    expect(longDate("2026-01-01", "he")).toBe("1 בינואר 2026");
    expect(longDate("2026-12-31", "he")).toBe("31 בדצמבר 2026");
  });
});
