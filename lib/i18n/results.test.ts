import { describe, expect, it } from "vitest";
import resultsText from "./results";
import { lettersOf } from "../letters";
import cfg from "@/data/results.json";

const he = resultsText.he;
const en = resultsText.en;

describe("results page words: Hebrew branches", () => {
  it("threshold rows: passing holds seats, failing says what crossing is worth, with the dual and the singular", () => {
    expect(he.thresholdCount.row("3.41%", "4,210", true, 4)).toBe("3.41%, 4,210 קולות מעל הקו; כרגע 4 מנדטים");
    expect(he.thresholdCount.row("3.12%", "1,800", false, 4)).toBe("3.12%, 1,800 קולות מתחת לקו; אם תעבור, כ-4 מנדטים");
    expect(he.thresholdCount.row("x", "y", true, 1)).toContain("כרגע מנדט אחד");
    expect(he.thresholdCount.row("x", "y", true, 2)).toContain("כרגע שני מנדטים");
    expect(he.thresholdCount.row("x", "y", false, 1)).toContain("אם תעבור, כמנדט אחד");
    expect(he.thresholdCount.row("x", "y", false, 2)).toContain("אם תעבור, כשני מנדטים");
  });
  it("never writes '1 מנדטים'", () => {
    for (const n of [1, 2, 3, 4.2]) {
      expect(he.watch.nearSeats(n, String(n))).not.toMatch(/^1 מנדטים|^2 מנדטים/);
      expect(he.pollThreshold.seats(n)).not.toMatch(/^1 מנדטים|^2 מנדטים/);
    }
    expect(he.watch.nearSeats(4.2, "4.2")).toBe("4.2 מנדטים");
    expect(he.watch.thresholdDt("3.25", 4)).toBe("אחוז החסימה: 3.25% מהקולות הכשרים, כ-4 מנדטים");
    expect(he.watch.thresholdAfter(4)).toBe("כל רשימה שעוברת או נופלת מזיזה כ-4 מנדטים בין הגושים.");
  });
  it("the poll average line: before and after election eve", () => {
    expect(he.watch.thresholdDd(true)).toContain("ממוצע הסקרים האחרון לפני הבחירות");
    expect(he.watch.thresholdDd(false)).toContain("ממוצע הסקרים העדכני");
  });
  it("double envelopes: included, absent, unknown", () => {
    expect(he.freshness.envelopes("312,000", true)).toBe("נכללו 312,000 קולות כשרים, וייתכן שעוד לא כולן נספרו.");
    expect(he.freshness.envelopes(null, false)).toBe("עדיין אינן בקובץ.");
    expect(he.freshness.envelopes(null, null)).toBe("אין מידע.");
    expect(he.freshness.sourceTime("27.10, 23:40")).toBe(" חותמת הזמן של קובץ הוועדה: 27.10, 23:40.");
    expect(he.freshness.sourceTime(null)).toBe(" קובץ הוועדה אינו מציין שעת עדכון מאומתת.");
  });
  it("standfirsts for every state of the night", () => {
    expect(he.standfirst.closed("יום שלישי, 27 באוקטובר, 22:00", "")).toBe("ספירת הקולות מתחילה עם סגירת הקלפיות, ביום שלישי, 27 באוקטובר, 22:00.");
    expect(he.standfirst.open(he.standfirst.early, "27.10, 22:41", "")).toBe("תוצאות אמת ראשונות של ועדת הבחירות המרכזית, נכון ל-27.10, 22:41. חלוקת המנדטים היא הערכה של האתר, לא החלוקה הרשמית.");
    for (const k of ["waiting", "unusable", "unreachable"] as const) expect(he.standfirst[k]("22:05")).toContain("22:05");
  });
  it("the board: early and full, the prior roll, untracked lists", () => {
    expect(he.board.gridTitle(true, 61)).toBe("תוצאות ראשונות: המנדטים לפי גוש; 61 מנדטים הם רוב");
    expect(he.board.gridTitle(false, 61)).toBe("המנדטים לפי גוש; 61 מנדטים הם רוב");
    expect(he.board.aria(true)).not.toBe(he.board.aria(false));
    expect(he.board.others(null)).toBe("רשימות אחרות");
    expect(he.board.others(23)).toBe("רשימות אחרות (23)");
    expect(he.board.tally("4,000,000", "1,100", null)).toContain("אחוז ההצבעה ביישובים שנספרו: לא ידוע.");
    expect(he.board.tally("4,000,000", "1,100", "70.1%")).toContain("מ-1,100 יישובים");
    expect(he.board.prior("פנקס הבוחרים של 2022", "6,788,804")).toContain("מול פנקס הבוחרים של 2022 (6,788,804");
    expect(he.exitTable.h(true)).toBe("המדגמים לפי רשימה, לצד ספירת הקולות");
    expect(he.exitTable.h(false)).toBe("המדגמים לפי רשימה");
    expect(he.pollThreshold.caption(true)).not.toBe(he.pollThreshold.caption(false));
  });
  it("the count as a poll: its note in Hebrew, one and two localities in words", () => {
    expect(he.asPollNote(1100, "130,000")).toBe("הקולות שנספרו עד כה ב-1100 יישובים; המנדטים לפי הערכת האתר (אחוז החסימה: 130,000 קולות).");
    expect(he.asPollNote(1, "10")).toContain("ביישוב אחד");
    expect(he.asPollNote(2, "10")).toContain("בשני יישובים");
  });
  it("a surplus pair joins with ו", () => {
    expect(he.method.pair("ישר!", "הדמוקרטים")).toBe("ישר! והדמוקרטים");
  });
  it("has a Hebrew short name for every tracked list's ballot letters, and every bloc", () => {
    for (const id of Object.values(cfg.letters)) expect(he.lists[lettersOf[id]], id).toBeTruthy();
    expect(Object.keys(he.blocs).sort()).toEqual(["arab", "mid", "net", "opp"]);
  });
  it("keeps the English sentences the page always printed", () => {
    expect(en.thresholdCount.row("3.41%", "4,210", true, 4)).toBe("3.41%, 4,210 votes above the line; holds 4 seats");
    expect(en.thresholdCount.row("3.12%", "1,800", false, 4)).toBe("3.12%, 1,800 votes below the line; would take about 4 seats if it crosses");
    expect(en.freshness.envelopes("1,000", true)).toBe("1,000 valid votes included; may still be incomplete.");
    expect(en.lists).toEqual({});
  });
});
