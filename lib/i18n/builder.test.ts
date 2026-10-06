import { describe, expect, it } from "vitest";
import builder from "./builder";
import { list } from "./he-grammar";
import { governingSummary, rowText, type GovRow } from "../coalition-governing";
import { compareHref, dependenceText, localizeStanceMap, type StanceMap } from "../cohesion";
import { tally, warningsWithSupport } from "../coalition";
import { allPolls, parties, pledgeRules } from "../data";

const he = builder.he;
const en = builder.en;

describe("the builder phrasebook", () => {
  it("carries the same keys in both editions", () => {
    expect(Object.keys(he).sort()).toEqual(Object.keys(en).sort());
    expect(he.sources.length).toBe(en.sources.length);
    expect(Object.keys(he.axes).sort()).toEqual(Object.keys(en.axes).sort());
  });

  it("counts with the dual and never says 1 or 2 with a plural noun", () => {
    expect(he.pathsWays(1)).toBe("דרך אחת");
    expect(he.pathsWays(2)).toBe("שתי דרכים");
    expect(he.pathsWays(700)).toBe("700 דרכים");
    expect(he.statusConflicts(0)).toBe("אין פסילות.");
    expect(he.statusConflicts(1)).toBe("פסילה אחת.");
    expect(he.statusConflicts(2)).toBe("שתי פסילות.");
    expect(he.statusConflicts(3)).toBe("3 פסילות.");
    expect(he.pathConflicts(1, ["ישר!"])).toBe("פסילה אחת: ישר!");
    expect(he.pathConflicts(3, ["ישר!", "ביחד"])).toBe(`3 פסילות: ${list(["ישר!", "ביחד"])}`);
    expect(he.withConflict(1)).toBe("דרך אחת נתקלת בפסילה");
    expect(he.withConflict(2)).toBe("שתי דרכים נתקלות בפסילה");
    expect(he.withConflict(5)).toBe("5 דרכים נתקלות בפסילה");
    expect(he.rowDifferent(2)).toBe("שתי תשובות שונות.");
    expect(he.rowDifferent(3)).toBe("3 תשובות שונות.");
  });

  it("words the cabinet row: a majority, one seat short, many short, a floor", () => {
    expect(he.cabMajority("64", false)).toBe("64: רוב גם בלי תמיכה מבחוץ");
    expect(he.cabShort("60", false, "1", 61)).toBe("60: חסר מנדט אחד ל-61");
    expect(he.cabShort("50.4", false, "10.6", 61)).toBe("50.4: חסרים 10.6 מנדטים ל-61");
    expect(he.cabShort("46", true, "15", 61)).toBe("לפחות 46: חסרים 15 מנדטים ל-61");
    expect(he.tipSeats("1", "x")).toBe("מנדט אחד (x)");
    expect(he.tipSeats("22.1", "x")).toBe("22.1 מנדטים (x)");
  });

  it("words the vote and the status line", () => {
    expect(he.voteLine("63", "57", null)).toBe("בעד 63, נגד 57");
    expect(he.voteLine("60", "50", "10")).toBe("בעד 60, נגד 50, נמנעים 10");
    expect(he.statusVote("passes", "63")).toBe("הצבעת האמון: עוברת, 63 בעד");
    expect(he.statusVote("fails", "50")).toBe("הצבעת האמון: לא עוברת, 50 בעד");
    expect(en.statusVote("passes", "63")).toBe("First vote passes, 63 for");
    expect(he.saidToggle("ש\"ס", true)).toBe("ש\"ס הוסרה.");
    expect(he.saidToggle("ש\"ס", false)).toBe("ש\"ס נוספה.");
    expect(he.saidPath(["א"], [])).toBe("נטענו: א.");
    expect(he.saidPath(["א", "ב"], ["ג"])).toBe(`נטענו: ${list(["א", "ב"])}, בתמיכה מבחוץ של ג.`);
  });

  it("words Paths to 61 with and without Likud", () => {
    expect(he.pathsHead(61)).toBe("איך מגיעים ל-61");
    expect(he.noneClear(true)).toBe("אין כאן דרך עם הליכוד שלא נתקלת באף פסילה.");
    expect(he.noPath(false, 61, true)).toBe("אין כאן דרך בלי הליכוד שמגיעה ל-61 בלי פסילות.");
    expect(he.noPath(true, 61, false)).toBe("אין כאן דרך עם הליכוד שמגיעה ל-61.");
  });
});

describe("the governing summary in Hebrew", () => {
  const g = (comparable: number, agree: number, differ: number) => ({ rows: [], total: 15, comparable, agree, differ });
  it("covers none, one, all agree, all differ and a mix", () => {
    expect(governingSummary(g(0, 0, 0), he)).toBe("על אף אחת מ-15 השאלות אין תשובה מכל המפלגות האלה.");
    expect(governingSummary(g(1, 1, 0), he)).toBe("על שאלה אחת מתוך 15 יש תשובה מכל המפלגות, והן מסכימות עליה.");
    expect(governingSummary(g(1, 0, 1), he)).toBe("על שאלה אחת מתוך 15 יש תשובה מכל המפלגות, והן חלוקות בה.");
    expect(governingSummary(g(4, 4, 0), he)).toBe("על 4 מתוך 15 השאלות יש תשובה מכל המפלגות: הן מסכימות בכולן.");
    expect(governingSummary(g(4, 0, 4), he)).toBe("על 4 מתוך 15 השאלות יש תשובה מכל המפלגות: הן חלוקות בכולן.");
    expect(governingSummary(g(4, 1, 3), he)).toBe("על 4 מתוך 15 השאלות יש תשובה מכל המפלגות: הן מסכימות באחת וחלוקות ב-3.");
    expect(governingSummary(g(4, 2, 2), he)).toBe("על 4 מתוך 15 השאלות יש תשובה מכל המפלגות: הן מסכימות בשתיים וחלוקות בשתיים.");
  });

  it("reads a row: same answer, different answers, partial", () => {
    const stance = { id: "a", label: "בעד גיוס" };
    const base = { key: "k", groups: [{ stance, answers: [] }], missing: [], same: true } as unknown as GovRow;
    const nameOf = (id: string) => ({ x: "הליכוד", y: "ש\"ס" })[id] ?? id;
    expect(rowText({ ...base, reach: "every", answers: [] }, nameOf, 2, he)).toBe("שתיהן באותה תשובה: בעד גיוס.");
    expect(rowText({ ...base, reach: "every", answers: [] }, nameOf, 3, he)).toBe("כל ה-3 באותה תשובה: בעד גיוס.");
    expect(rowText({ ...base, reach: "every", same: false, groups: [base.groups[0], base.groups[0]], answers: [] }, nameOf, 3, he)).toBe("שתי תשובות שונות.");
    expect(rowText({ ...base, reach: "some", answers: [{ id: "a", stance: "a" }, { id: "b", stance: "a" }], missing: ["x"] }, nameOf, 3, he)).toBe("ענו 2 מתוך 3, כולן באותה תשובה: בעד גיוס. לא ענו: הליכוד.");
    expect(rowText({ ...base, reach: "some", same: false, answers: [{ id: "a", stance: "a" }, { id: "b", stance: "b" }], missing: ["x", "y"] }, nameOf, 4, he)).toBe(`ענו 2 מתוך 4, בתשובות שונות. לא ענו: ${list(["הליכוד", "ש\"ס"])}.`);
  });
});

describe("dependence and links in Hebrew", () => {
  const nameOf = (id: string) => ({ a: "הליכוד", b: "ש\"ס", c: "ביחד" })[id] ?? id;
  it("words each dependence branch", () => {
    expect(dependenceText({ majority: false, needed: [], spare: [] }, nameOf, he)).toBeNull();
    expect(dependenceText({ majority: true, needed: ["a", "b"], spare: [] }, nameOf, he)).toBe("רוב שתלוי בשתי המפלגות שבו: בלי כל אחת מהן הוא יורד מתחת ל-61.");
    expect(dependenceText({ majority: true, needed: ["a", "b", "c"], spare: [] }, nameOf, he)).toBe("רוב שתלוי בכל 3 המפלגות שבו: בלי כל אחת מהן הוא יורד מתחת ל-61.");
    expect(dependenceText({ majority: true, needed: [], spare: ["a"] }, nameOf, he)).toBe("נשאר עם 61 גם בלי כל אחת מהמפלגות האלה.");
    expect(dependenceText({ majority: true, needed: ["c"], spare: ["a", "b"] }, nameOf, he)).toBe(`נשאר עם 61 גם בלי ${list(["הליכוד", "ש\"ס"], "or")}, אבל זקוק לכל אחת מהאחרות.`);
  });
  it("links Compare in the edition", () => {
    expect(compareHref(["likud", "shas"])).toBe("/compare?p=likud,shas");
    expect(compareHref(["likud", "shas"], "he")).toBe("/he/compare?p=likud,shas");
  });
});

describe("Hebrew data through the coalition generators", () => {
  it("fills a Hebrew pledge message with Hebrew names, and an English fallback with English names", () => {
    const rule = pledgeRules.find((r) => r.id === "dem-no-haredi")!;
    const he1 = warningsWithSupport(new Set(["dem", "shas"]), new Set(), parties, [rule], {
      message: () => ({ text: "גולן: החרדים בחוץ. בקואליציה הזו: {and:haredi}.", lang: "he" }), name: (p) => (p.id === "shas" ? "ש\"ס" : p.name), and: (n) => list(n),
    });
    expect(he1).toEqual([{ id: rule.id, kind: rule.kind, message: "גולן: החרדים בחוץ. בקואליציה הזו: ש\"ס.", source: rule.source, lang: "he" }]);
    const en1 = warningsWithSupport(new Set(["dem", "shas"]), new Set(), parties, [rule], {
      message: (r) => ({ text: r.message, lang: "en" }), name: () => "שם", and: (n) => list(n),
    });
    expect(en1[0].message).toMatch(/This coalition includes Shas\.$/);
    expect(en1[0].lang).toBe("en");
    // Without a WarningText the English is unchanged and carries no lang.
    expect(warningsWithSupport(new Set(["dem", "shas"]), new Set(), parties, [rule])[0]).not.toHaveProperty("lang");
  });

  it("words a poll's combined group in Hebrew", () => {
    const kan = allPolls.find((p) => p.combined.length)!;
    const [a, b] = kan.combined[0].parties;
    const name = (p: { id: string }) => `[${p.id}]`;
    const both = tally(new Set([a, b]), parties, kan, { P: he, name, pollster: "כאן חדשות" });
    expect(both.groupNote).toBe(`סקר כאן חדשות לא הפריד בין ${list([`[${a}]`, `[${b}]`])}. כששתיהן בקואליציה, נספרים ${kan.combined[0].seats} המנדטים המשותפים שלהן.`);
    const one = tally(new Set([a]), parties, kan, { P: he, name, pollster: "כאן חדשות" });
    expect(one.groupNote).toBe(`סקר כאן חדשות לא דיווח בנפרד על [${a}], ולכן הסכום לא כולל את המנדטים שלה. הוסיפו את ${list([`[${a}]`, `[${b}]`])} כדי לספור את ${kan.combined[0].seats} המנדטים המשותפים שלהן.`);
  });

  it("localizes a stance map's labels and records their language", () => {
    const map: StanceMap = { k: { question: null, label: "Draft", stances: [{ id: "a", label: "Yes" }, { id: "b", label: "No" }], byParty: {} } };
    const out = localizeStanceMap(map, (_k, field, english) => (field === "stances.1.label" ? { text: english, lang: "en" } : { text: `ע:${english}`, lang: "he" }));
    expect(out.k.label).toBe("ע:Draft");
    expect(out.k.labelLang).toBe("he");
    expect(out.k.stances).toEqual([{ id: "a", label: "ע:Yes", lang: "he" }, { id: "b", label: "No", lang: "en" }]);
    expect(map.k.stances[0].label).toBe("Yes");
  });
});
