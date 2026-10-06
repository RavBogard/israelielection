import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { IssueReading } from "@/lib/cohesion";
import { evidenceLabel, comparisonIssues } from "@/lib/positions";
import { matrixRows, matrixText } from "@/components/compare/model";
import { parties } from "@/lib/data";
import compareText, { EVIDENCE_KINDS_HE, heDateText, inDate, readingHe } from "./compare";

const st = (id: string) => ({ id, label: id });
const reading = (r: Partial<IssueReading>): IssueReading => ({ key: "k", groups: [], declined: [], none: [], unsorted: [], verdict: "silent", known: 0, selected: 4, ...r });
const name = (id: string) => ({ a: "הליכוד", b: "ש\"ס" })[id] ?? id;
const stance = (id: string) => ({ x: "בעד", y: "נגד" })[id] ?? id;

describe("readingHe", () => {
  it("agree", () => expect(readingHe(reading({ verdict: "agree", groups: [{ stance: st("x"), parties: ["a", "b"] }], known: 2, selected: 2 }), name, stance)).toBe("עמדה משותפת: בעד (2 מתוך 2 תשובות)."));
  it("partial, one answer, with the missing count", () =>
    expect(readingHe(reading({ verdict: "partial", groups: [{ stance: st("x"), parties: ["a"] }], none: ["b", "c"], known: 1, selected: 3 }), name, stance)).toBe("רק תשובה מתועדת אחת (הליכוד); ל-2 מתוך 3 אין תשובה לשאלה הזו."));
  it("partial, aligned", () => expect(readingHe(reading({ verdict: "partial", groups: [{ stance: st("x"), parties: ["a", "b"] }], declined: ["c"], known: 2, selected: 3 }), name, stance)).toBe("העמדות המתועדות זהות; ל-1 מתוך 3 אין תשובה לשאלה הזו."));
  it("split: the dual, then digits", () => {
    const two = [{ stance: st("x"), parties: ["a"] }, { stance: st("y"), parties: ["b"] }];
    expect(readingHe(reading({ verdict: "split", groups: two, known: 2, selected: 2 }), name, stance)).toBe("עמדות שונות: שתי תשובות.");
    expect(readingHe(reading({ verdict: "split", groups: [...two, { stance: st("z"), parties: ["c"] }], known: 3, selected: 3 }), name, stance)).toBe("עמדות שונות: 3 תשובות.");
  });
  it("unsorted and silent", () => {
    expect(readingHe(reading({ verdict: "unsorted" }), name, stance)).toContain("סדרי עדיפויות");
    expect(readingHe(reading({ verdict: "silent" }), name, stance)).toBe("אין די מידע: אין תשובות מתועדות לשאלה הזו.");
  });
});

describe("heDateText", () => {
  it("reads the data's date forms", () => {
    expect(heDateText("Mar 27, 2025")).toEqual({ text: "27 במרץ 2025", lang: "he" });
    expect(heDateText("Sept 30, 2026").text).toBe("30 בספטמבר 2026");
    expect(heDateText("Sept 2026").text).toBe("ספטמבר 2026");
    expect(heDateText("2026")).toEqual({ text: "2026", lang: "he" });
    expect(heDateText("Undated; checked Oct 5, 2026").text).toBe("ללא תאריך; נבדק ב-5 באוקטובר 2026");
    expect(heDateText("Accessed Oct 2026").text).toBe("נצפה באוקטובר 2026");
    expect(heDateText("2023; reported Sep 22, 2026").text).toBe("2023; דווח ב-22 בספטמבר 2026");
  });
  it("keeps what it cannot read whole in English", () => expect(heDateText("Spring, per aides")).toEqual({ text: "Spring, per aides", lang: "en" }));
  it("hyphenates ב only before a digit", () => expect([inDate("5 באוקטובר"), inDate("אוקטובר 2026")]).toEqual(["ב-5 באוקטובר", "באוקטובר 2026"]));
});

describe("evidenceLabel", () => {
  it("is unchanged in English", () => {
    expect(evidenceLabel(undefined)).toBe("No recorded answer in these sources");
    expect(evidenceLabel({ party: "x", date: "Mar 27, 2025", basis: "record", stance: "a" })).toBe("Record evidence: Source published Mar 27, 2025");
    expect(evidenceLabel({ party: "x", date: "Accessed Oct 5, 2026" })).toBe("evidence date unavailable (Accessed Oct 5, 2026)");
    expect(evidenceLabel({ party: "x", evidence: { kind: "Legislative record", date: null, checkedAt: "2026-10-05" } })).toBe("Legislative record, date unavailable; checked 2026-10-05");
  });
  it("writes each Hebrew branch", () => {
    expect(evidenceLabel(undefined, "he")).toBe("אין תשובה מתועדת במקורות האלה");
    expect(evidenceLabel({ party: "x", date: "Mar 27, 2025", basis: "record", stance: "a" }, "he")).toBe("לפי הרקורד: המקור פורסם ב-27 במרץ 2025");
    expect(evidenceLabel({ party: "x", date: "Sept 2026" }, "he")).toBe("המקור פורסם בספטמבר 2026");
    expect(evidenceLabel({ party: "x", date: "Accessed Oct 5, 2026" }, "he")).toBe("תאריך הראיה לא ידוע (נצפה ב-5 באוקטובר 2026)");
    expect(evidenceLabel({ party: "x" }, "he")).toBe("תאריך הראיה לא ידוע");
    expect(evidenceLabel({ party: "x", evidence: { kind: "Legislative record", date: "Mar 27, 2025", checkedAt: "2026-10-05" } }, "he")).toBe("תיעוד חקיקה, 27 במרץ 2025; נבדק ב-5 באוקטובר 2026");
    expect(evidenceLabel({ party: "x", evidence: { kind: "Undated party plan", date: null, checkedAt: "2026-10-05" } }, "he")).toBe("תוכנית מפלגתית ללא תאריך, ללא תאריך; נבדק ב-5 באוקטובר 2026");
  });
  it("has Hebrew for every evidence kind the comparison shows", () => {
    const kinds = new Set<string>();
    for (const i of comparisonIssues()) for (const r of i.file.rows) if (r.evidence) kinds.add(r.evidence.kind);
    const dir = join(__dirname, "..", "..", "data", "positions");
    for (const f of readdirSync(dir)) for (const r of JSON.parse(readFileSync(join(dir, f), "utf8")).rows) if (r.evidence) kinds.add(r.evidence.kind);
    expect([...kinds].filter((k) => !EVIDENCE_KINDS_HE[k])).toEqual([]);
  });
});

describe("matrixText", () => {
  const ids = parties.map((p) => p.id);
  const rows = matrixRows(ids);
  const he = matrixText(rows, "he");
  it("covers every row, with the issues' own Hebrew labels", () => {
    expect(Object.keys(he)).toEqual(rows.map((r) => r.key));
    expect(he.draft.label).toEqual({ text: compareText.he.axes.draft, lang: "he" });
  });
  it("gives every stance and every recorded row a text, Hebrew or marked English", () => {
    for (const r of rows) {
      for (const s of r.stances) expect(["he", "en"]).toContain(he[r.key].stances[s.id].lang);
      for (const row of r.issue.file.rows) if (row.text?.trim()) expect(he[r.key].said[row.party]?.text).toBeTruthy();
    }
  });
  it("falls back to the English field when no Hebrew is current", () => {
    for (const r of rows) for (const s of r.stances) {
      const t = he[r.key].stances[s.id];
      if (t.lang === "en") expect(t.text).toBe(s.label);
    }
  });
});
