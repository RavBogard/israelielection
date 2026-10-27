import { it, expect } from "vitest";
import { electionChromeYear } from "./election-chrome";
it("does not brand a future or unavailable election as2026 and preserves explicit26 archives", () => {
  expect(electionChromeYear("/he", null, true)).toBeNull();
  expect(electionChromeYear("/", "il-knesset-27", false)).toBeNull();
  expect(electionChromeYear("/", "2027-03-01", false)).toBe("2027");
  expect(
    electionChromeYear("/he/elections/il-knesset-26", "2027-03-01", false),
  ).toBe("2026");
  expect(
    electionChromeYear("/elections/il-knesset-27", "2026-10-27", false),
  ).toBeNull();
});
