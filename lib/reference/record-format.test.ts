import { it, expect } from "vitest";
import { LANGS } from "@/lib/i18n";
import { recordDate } from "./record-format";
it("localizes display dates with explicit offset and retains unknown values", () => {
  for (const lang of LANGS) {
    const text = recordDate("2026-10-26T12:34:00Z", lang);
    expect(text).toContain("14:34");
    expect(text).not.toContain("T12:34:00Z");
    expect(recordDate("2026-10-26", lang)).toContain("2026");
  }
  expect(recordDate("unknown", "en")).toBe("unknown");
  expect(recordDate("2026-10-26T12:34:00Z", "en")).toContain("GMT+2");
});
