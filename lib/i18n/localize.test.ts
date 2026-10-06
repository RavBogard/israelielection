import { describe, expect, it } from "vitest";
import { fieldAt, heField, localize, localizeText, localizer, overlayProblems, srcHash, type HeOverlay } from "./localize";

// Fixtures only: the real overlays live in data/he/** (written by the data lane).
const parties = [
  { id: "likud", who: "The ruling party.", issues: [{ text: "Judicial overhaul" }] },
  { id: "shas", who: "Sephardi Haredi party." },
];
const overlay: HeOverlay = {
  likud: { who: heField("The ruling party.", "מפלגת השלטון."), "issues.0.text": heField("Judicial overhaul", "המהפכה המשפטית") },
  shas: { who: heField("A Sephardi party.", "מפלגה ספרדית.") }, // written against older English
};

describe("srcHash", () => {
  it("is 8 hex characters, stable and sensitive to any change", () => {
    expect(srcHash("The ruling party.")).toMatch(/^[0-9a-f]{8}$/);
    expect(srcHash("The ruling party.")).toBe(srcHash("The ruling party."));
    expect(srcHash("The ruling party.")).not.toBe(srcHash("The ruling party"));
    expect(srcHash("")).toBe("811c9dc5");
  });
});

describe("localize", () => {
  it("shows current Hebrew in the Hebrew edition", () => {
    expect(localize(parties[0], "who", overlay, "he")).toEqual({ text: "מפלגת השלטון.", lang: "he" });
    expect(localize(parties[0], "issues.0.text", overlay, "he")).toEqual({ text: "המהפכה המשפטית", lang: "he" });
  });
  it("always shows English in the English edition", () => {
    expect(localize(parties[0], "who", overlay, "en")).toEqual({ text: "The ruling party.", lang: "en" });
  });
  it("falls back to English when the Hebrew is stale, missing or empty", () => {
    expect(localize(parties[1], "who", overlay, "he")).toEqual({ text: "Sephardi Haredi party.", lang: "en" });
    expect(localize({ id: "yesh-atid", who: "Centrist." } as { id: string }, "who", overlay, "he")).toEqual({ text: "Centrist.", lang: "en" });
    expect(localize(parties[0], "who", undefined, "he")).toEqual({ text: "The ruling party.", lang: "en" });
    expect(localizeText("X", { text: "", src: srcHash("X") }, "he")).toEqual({ text: "X", lang: "en" });
  });
  it("binds to one overlay", () => {
    const t = localizer(overlay, "he");
    expect(t(parties[0], "who").lang).toBe("he");
  });
  it("reads dotted field paths", () => {
    expect(fieldAt(parties[0], "issues.0.text")).toBe("Judicial overhaul");
    expect(fieldAt(parties[0], "issues.3.text")).toBeUndefined();
    expect(fieldAt(parties[0], "issues")).toBeUndefined();
  });
});

describe("overlayProblems (the stale-hash check)", () => {
  it("passes a current overlay", () => {
    expect(overlayProblems(parties, { likud: overlay.likud })).toEqual([]);
  });
  it("flags Hebrew written against English that has since changed", () => {
    expect(overlayProblems(parties, overlay)).toEqual([{ id: "shas", field: "who", problem: "stale" }]);
  });
  it("flags items and fields that no longer exist", () => {
    const o: HeOverlay = { gone: { who: heField("x", "y") }, likud: { motto: heField("x", "y") } };
    expect(overlayProblems(parties, o)).toEqual([
      { id: "gone", field: "who", problem: "orphan" },
      { id: "likud", field: "motto", problem: "orphan" },
    ]);
  });
  it("checks machine translations the same way", () => {
    expect(heField("a", "ב", true)).toEqual({ text: "ב", src: srcHash("a"), machine: true });
    expect(overlayProblems([{ id: "x", f: "b" } as { id: string }], { x: { f: heField("a", "ב", true) } })).toEqual([{ id: "x", field: "f", problem: "stale" }]);
  });
});
