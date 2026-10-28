import { describe, expect, it } from "vitest";
import { fileAge } from "./LiveCount";

describe("count file age", () => {
  const now = Date.parse("2026-10-28T18:23:00Z");
  it("counts minutes under an hour, hours under two days, then days", () => {
    expect(fileAge(now - 20 * 60_000, now, "en")).toMatch(/20 min/);
    expect(fileAge(now - 4 * 3_600_000, now, "en")).toMatch(/4 hr/);
    expect(fileAge(now - 72 * 3_600_000, now, "en")).toMatch(/3 days/);
  });
  it("never reports a negative age", () => {
    expect(fileAge(now + 60_000, now, "en")).toMatch(/0 min/);
  });
});
