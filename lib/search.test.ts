import { describe, expect, it } from "vitest";
import { figureLine, normalizeSearch, searchEntries, type SearchEntry } from "./search";

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

describe("seat figures in search", () => {
  const withFigures: SearchEntry[] = [
    { href: "/parties/likud", title: "Likud", description: "Benjamin Netanyahu. Founded in 1973 as an alliance.", kind: "party", aliases: ["Bibi"], figure: figureLine("Likud", 22.06, "Oct 5") },
    { href: "/timeline#1973", title: "Likud founded", description: "Likud is founded; seats in 1973.", kind: "guide", aliases: [] },
    { href: "/polls", title: "Netanyahu bloc", description: "Likud, Shas", kind: "bloc", aliases: ["coalition"], figure: figureLine("Netanyahu bloc", 54.6, "Oct 5") },
    { href: "/glossary#seats", title: "Seats", description: "The 120 seats of the Knesset", kind: "glossary", aliases: [] },
  ];
  it("prints one decimal and the date", () => {
    expect(figureLine("Likud", 22.06, "Oct 5")).toBe("Likud: 22.1 seats, polling average, Oct 5");
    expect(figureLine("Ra'am", "below", "Oct 5")).toBe("Ra'am: below the threshold, polling average, Oct 5");
  });
  it("puts a party's figure first for its name, with or without asking for seats", () => {
    expect(searchEntries(withFigures, "likud seats")[0].entry.href).toBe("/parties/likud");
    expect(searchEntries(withFigures, "likud")[0].entry.href).toBe("/parties/likud");
    expect(searchEntries(withFigures, "how many seats likud")[0].entry.href).toBe("/parties/likud");
  });
  it("does the same for a bloc, and keeps plain word searches as they were", () => {
    expect(searchEntries(withFigures, "netanyahu bloc seats")[0].entry.title).toBe("Netanyahu bloc");
    expect(searchEntries(withFigures, "coalition")[0].entry.title).toBe("Netanyahu bloc");
    expect(searchEntries(withFigures, "seats")[0].entry.href).toBe("/glossary#seats");
    expect(searchEntries(withFigures, "", "party")).toHaveLength(2);
  });
});
