import { describe, expect, it } from "vitest";
import { normalizeSearch, searchEntries, type SearchEntry } from "./search";

const entries: SearchEntry[] = [
  { href: "/parties/yb", title: "Yisrael Beiteinu", description: "Avigdor Liberman", kind: "party", aliases: ["Lieberman", "ישראל ביתנו"] },
  { href: "/parties/dem", title: "The Democrats", description: "Yair Golan", kind: "party", aliases: ["Meretz", "Labor"] },
  { href: "/glossary#threshold", title: "Threshold", description: "Minimum vote share", kind: "glossary", aliases: [] },
];
describe("site search", () => {
  it("finds a leader, historical connection and Hebrew alias at their canonical entry", () => {
    expect(searchEntries(entries, "Lieberman")[0].entry.href).toBe("/parties/yb");
    expect(searchEntries(entries, "Meretz")[0].matchedAlias).toBe("Meretz");
    expect(searchEntries(entries, "ישראל ביתנו")[0].entry.href).toBe("/parties/yb");
  });
  it("normalizes transliteration punctuation and diacritics and filters categories", () => {
    expect(normalizeSearch(" Ra’ám! ")).toBe("raam");
    expect(searchEntries(entries, "missing")).toEqual([]);
    expect(searchEntries(entries, "", "glossary")).toHaveLength(1);
    expect(searchEntries(entries, "Avigdor Liberman")).toHaveLength(1);
  });
});
