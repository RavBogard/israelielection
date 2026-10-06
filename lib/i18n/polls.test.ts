import { describe, expect, it } from "vitest";
import POLLS, { dayMonthHe, HE_FIND, HE_METHOD, ltr } from "./polls";

const he = POLLS.he, en = POLLS.en;

/** Every key in `a` exists in `b` with the same kind (string, function, object). */
function sameShape(a: object, b: object, path = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(a)) {
    const w = (b as Record<string, unknown>)[k];
    if (typeof v !== typeof w) out.push(`${path}${k}`);
    else if (v && typeof v === "object") out.push(...sameShape(v, w as object, `${path}${k}.`));
  }
  return out;
}

describe("polls desk strings", () => {
  it("carry the same keys in both editions", () => {
    expect(sameShape(en, he)).toEqual([]);
    expect(sameShape(he, en)).toEqual([]);
  });
  it("write no bare English into the Hebrew strings", () => {
    const strings: string[] = [];
    const walk = (o: object) => { for (const v of Object.values(o)) { if (typeof v === "string") strings.push(v); else if (v && typeof v === "object") walk(v); } };
    walk(he);
    // Latin letters only in names and the fictional lists A to E.
    for (const s of strings) expect(s.replace(/i24NEWS|NEXT DATA|[A-E]\b|A\+B/g, "")).not.toMatch(/[a-z]{3,}/i);
  });
  it("use the long month without the year, and isolate signed figures", () => {
    expect(dayMonthHe("2026-09-06")).toBe("6 בספטמבר");
    expect(ltr("−1.2")).toBe("⁦−1.2⁩");
    expect(he.trends.shared(30)).toBe("סולם משותף: ⁦0–30⁩ מנדטים");
  });
  it("agree with the number: one, two, many", () => {
    expect(he.race.readingTail(1)).toBe("סקר עדכני אחד.");
    expect(he.race.readingTail(2)).toBe("שני סקרים עדכניים.");
    expect(he.race.readingTail(9)).toBe("9 סקרים עדכניים.");
    expect(he.trends.readingTail(1)).toBe(", סקר אחד מדד את הרשימה בנפרד");
    expect(he.trends.readingTail(2)).toBe(", שני סקרים מדדו את הרשימה בנפרד");
    expect(he.trends.readingTail(5)).toBe(", 5 סקרים מדדו את הרשימה בנפרד");
    expect(he.now.altCaption(1)).toBe("סקר אחד; ");
    expect(he.now.altCaption(7)).toBe("7 סקרים; ");
    expect(he.now.dot("P", "2.10.26", false, 1)).toBe("P, 2.10.26: מנדט אחד");
    expect(he.now.dot("P", "2.10.26", false, 5)).toBe("P, 2.10.26: 5 מנדטים");
    expect(he.now.dot("P", "2.10.26", true, 0)).toBe("P, 2.10.26: מתחת לאחוז החסימה");
    expect(he.comp.note(2, 30)).toBe("שתי הרשימות שנמדדות בנפרד, על אותו סולם של ⁦0–30⁩ מנדטים; הנקודות הן סקרים בודדים.");
    expect(he.comp.note(14, 30)).toContain("כל 14 הרשימות שנמדדות");
    expect(he.sens.incomplete(1)).toBe("סקר אחד חלקי לא נכלל בספירה.");
    expect(he.sens.incomplete(2)).toBe("שני סקרים חלקיים לא נכללים בספירה.");
    expect(he.sens.incomplete(4)).toBe("4 סקרים חלקיים לא נכללים בספירה.");
    expect(he.sens.anchor("5.10.26", 1, 14)).toBe("סוף חלון הזמן: 5.10.26. סקר אחד מ-14 הימים שעד התאריך הזה. אלה לא בהכרח מכוני סקרים שונים או מדגמים בלתי תלויים.");
    expect(he.sens.anchor(null, 0, 7)).toContain("אין סקר");
    expect(HE_METHOD.window(14, "5.10.26", 2, "א ו-ב")).toBe("בממוצע נכנס הסקר האחרון של כל גוף מ-14 הימים שעד 5.10.26 (שני סקרים: א ו-ב). ");
  });
  it("word the bloc strips, majorities and zero cases", () => {
    expect(he.now.stripRead(0, 9, 48, 55)).toBe("מתחת ל-61 בכל 9 הסקרים, בין 48 ל-55");
    expect(he.now.stripRead(3, 9, 55, 62)).toBe("61 ומעלה ב-3 מתוך 9 הסקרים, בין 55 ל-62");
    expect(he.now.stripRead(0, 9, 50, 50)).toBe("מתחת ל-61 בכל 9 הסקרים, 50 בכולם");
    expect(he.race.reading("גוש נתניהו", "54.6", 50, 58)).toBe("גוש נתניהו 54.6 (בסקרים העדכניים: בין 50 ל-58)");
    expect(he.race.reading("גוש נתניהו", "54.6", 54, 54)).toBe("גוש נתניהו 54.6 (בסקרים העדכניים: 54)");
    expect(he.sens.majority(0, 9) + he.sens.majorityTail(0)).toBe("באף אחד מ-9 הסקרים המלאים הרשימות האלה אינן מגיעות יחד ל-61 מנדטים.");
    expect(he.sens.majority(9, 9) + he.sens.majorityTail(9)).toBe("בכל 9 הסקרים המלאים הרשימות האלה מגיעות יחד ל-61 מנדטים.");
    expect(he.sens.majority(4, 9)).toBe("ב-4 מתוך 9 הסקרים המלאים");
    expect(he.sens.fictionRead(true, 62)).toBe("E עוברת את אחוז החסימה (3.25%). A+B מקבלות 62 מתוך 120 מנדטים, ויש להן רוב.");
    expect(he.sens.fictionRead(false, 58)).toContain("לא עוברת");
    expect(he.sens.passes(3, 9, true)).toBe("3 / 9, עוברת בפחות ממחצית");
    expect(he.comp.picked("הליכוד", "ש\"ס")).toBe("הליכוד: נוספה לגרף; ש\"ס הוסרה, אפשר עד שלוש.");
    expect(he.comp.aria([], 30)).toContain("בלי רשימה מודגשת");
    expect(he.browser.idAria("חדשות 12", true, "2.10.26")).toBe("מדגם חדשות 12, 2.10.26: שיטה ומקור");
    expect(he.trends.dot("P", "2.10", false, 0, true)).toBe("P, 2.10: מתחת לאחוז החסימה (אפס מנדטים); נכלל בממוצע, ולא נכלל רק בממוצע החלופי");
    expect(he.trends.zoomed(10, 20)).toBe("מוגדל לרשימה הזאת: ⁦10–20⁩ מנדטים, הציר לא מתחיל באפס");
    expect(HE_FIND.inPolls(0, 9)).toBe("באף סקר");
    expect(HE_METHOD.variantLabel(["חדשות 14", "i24NEWS"])).toBe("בלי חדשות 14 ו-i24NEWS");
  });
});
