import { describe, it, expect } from "vitest";
import { numericTokens } from "./numeric.mjs";
describe("source numeric invariants", () => {
  it("includes English ordinals rather than losing their quantities", () => {
    expect(numericTokens("a 32nd seat; 1st, 2nd, 3rd and 120th")).toEqual(
      numericTokens("a 32 seat; 1, 2, 3 and 120"),
    );
  });
  it("normalizes Arabic/Persian/fullwidth digits and unambiguous separators", () => {
    expect(numericTokens("۳٫۲۵٪ and ١٬٢٠٠ and １２０")).toEqual(
      numericTokens("3.25% and 1,200 and 120"),
    );
    expect(numericTokens("1\u202f200")).toEqual(numericTokens("1,200"));
  });
  it("accepts German and French decimals, spaced percent signs, and preserves thousands", () => {
    expect(numericTokens("3,25 %", "de")).toEqual(numericTokens("3.25%"));
    expect(numericTokens("3.25\u00a0%", "fr")).toEqual(numericTokens("3.25%"));
    expect(numericTokens("1.234", "de")).toEqual(numericTokens("1,234"));
    expect(numericTokens("-3 and 2026-10-27")).toEqual(
      ["-3", "10", "2026", "27"].sort(),
    );
  });
  it("does not conceal a changed amount, omit duplicate numbers, or guess ambiguous punctuation", () => {
    expect(numericTokens("61 61")).not.toEqual(numericTokens("61"));
    expect(numericTokens("99")).not.toEqual(numericTokens("61"));
    expect(numericTokens("1,234", "de")).not.toEqual(
      numericTokens("1,234", "en"),
    );
  });
});

it("normalizes written Gregorian months only in explicit date context", () => {
  for (const text of [
    "in March 2014",
    "im März 2014",
    "en mars 2014",
    "במרץ 2014",
    "في مارس 2014",
    "مارس 2014",
    "2014年3月",
  ]) {

    expect(numericTokens(text)).toEqual(["2014", "3"]);
  }
  expect(numericTokens("May provide 61 seats")).toEqual(["61"]);
  expect(numericTokens("March 2014 99")).not.toEqual(
    numericTokens("March 2014"),
  );
});
test("a French first of the month reads as the same date", () => {
  expect(numericTokens("le 1er novembre", "fr")).toEqual(numericTokens("Nov 1"));
  expect(numericTokens("1er tour", "fr")).toEqual(["1"]);
});
