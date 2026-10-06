import { describe, expect, it } from "vitest";
import { averageFinding, citeText, counterText, initialTab, leaderFinding, leanFinding, majorityCounts, moverFinding, raceFinding, spreadFinding, variantFinding } from "./polls-desk";
import { allPolls, averagePoll, mainPolls, parties, pollsData } from "./data";
import { houseEffects } from "./house-effects";
import { blocTotals } from "./polls";
import { blocTrend } from "./trend";
import type { HouseEffect } from "./house-effects";
import type { Party, Poll } from "./types";
import { pollsterText } from "./i18n/overlays";

const ps = [{ id: "a", name: "A", bloc: "net" }, { id: "b", name: "B", bloc: "opp" }, { id: "c", name: "C", bloc: "mid" }] as Party[];
const poll = (id: string, a: number, b: number, c = 120 - a - b): Poll => ({ id, pollster: id, firm: null, published: "2026-10-01", fieldwork: null, via: null, url: null, n: 500, margin: null, note: null, results: { a: { seats: a }, b: { seats: b }, c: { seats: c } }, combined: [] });
const pt = (date: string, net: number, opp: number) => ({ date, avg: { net, opp, mid: 0, arab: 0 } });
const he = (pollster: string, n: number, net: number) => ({ pollster, n, gap: { net, opp: -net }, polls: [] }) as HouseEffect;

describe("polls desk findings", () => {
  it("says whether either bloc reaches 61", () => {
    expect(averageFinding({ net: 54.6, opp: 48 })).toBe("Neither bloc reaches 61 in the average.");
    expect(averageFinding({ net: 61, opp: 50 })).toBe("The Netanyahu bloc reaches 61 in the average.");
    expect(averageFinding({ net: 40, opp: 62.3 })).toBe("The Anti-Netanyahu bloc reaches 61 in the average.");
  });
  it("counts the polls at 61 or more", () => {
    const c = majorityCounts([poll("1", 62, 40), poll("2", 55, 50), poll("3", 50, 62, 8)], ps);
    expect(c).toEqual({ net: 1, opp: 1, n: 3 });
    expect(counterText(c)).toBe("61 or more: Netanyahu bloc 1 of 3 polls, Anti-Netanyahu bloc 1 of 3");
  });
  it("names the race leader or counts lead changes, ignoring level dates", () => {
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-10", 54, 50)])).toBe("The Netanyahu bloc has led the average on every date since Sep 6");
    expect(raceFinding([pt("2026-09-06", 50, 55)])).toBe("The Anti-Netanyahu bloc has led the average on every date since Sep 6");
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-07", 50, 50), pt("2026-09-08", 49, 50), pt("2026-09-09", 52, 50)])).toBe("The lead has changed hands twice since Sep 6");
    expect(raceFinding([])).toBe("The bloc race");
  });
  it("leads outright only when strictly ahead", () => {
    const avg = poll("avg", 30, 25, 20);
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 30, 20, 20)], ps)).toBe("A leads in all 2 current polls");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 25, 25, 20)], ps)).toBe("A is largest in the average, ahead outright in 1 of 2 current polls");
  });
  it("reports the largest move only when it is a seat or more", () => {
    const t = (a: number, b: number) => [{ date: "2026-09-06", avg: a, n: 1 }, { date: "2026-10-05", avg: b, n: 1 }];
    expect(moverFinding(new Map([["a", t(20, 23.2)], ["b", t(10, 6)]]), { a: "A", b: "B" }, "2026-09-06")).toBe("The largest move: B, −4.0 seats since Sep 6");
    expect(moverFinding(new Map([["a", t(20, 20.5)]]), { a: "A" }, "2026-09-06")).toBe("No list has moved a full seat in the average since Sep 6");
  });
  it("names the pollster that leans furthest among those with enough polls", () => {
    expect(leanFinding([he("X", 5, 2.1), he("Y", 2, 6), he("Z", 4, -3.4)])).toBe("Z shows the Netanyahu bloc 3.4 seats below the average");
    expect(leanFinding([he("Y", 2, 6)])).toBe("How each pollster leans");
  });
  it("states the bloc spread and the alternative average", () => {
    expect(spreadFinding([poll("1", 62, 40), poll("2", 55, 50)], ps)).toBe("Across the 2 current polls the Netanyahu bloc runs 55 to 62, the Anti-Netanyahu bloc 40 to 50");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 52.1, opp: 49 }, ["P", "Q"])).toBe("Without P and Q the Netanyahu bloc has 52.1, 2.5 fewer");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 54.6, opp: 49 }, ["P"])).toBe("Leaving out P does not move the Netanyahu bloc");
  });
  it("cites the average with its date", () => {
    expect(citeText({ net: 54.64, opp: 48 }, 7, "2026-10-05")).toBe("Israel Votes 2026, polling average of 7 current polls as of October 5, 2026: Netanyahu bloc 54.6, Anti-Netanyahu bloc 48.0 of 120 seats. https://www.israelielection.org/polls");
  });
  it("opens the tab a link names, else the tool its query belongs to", () => {
    expect(initialTab("", "")).toBe("parties");
    expect(initialTab("?tab=method", "#pollsters")).toBe("method");
    expect(initialTab("", "#every-poll")).toBe("every-poll");
    expect(initialTab("?pollster=Maariv", "#browser")).toBe("every-poll");
    expect(initialTab("?with=likud&window=7", "#sensitivity")).toBe("method");
    expect(initialTab("?tab=nope", "")).toBe("parties");
  });
  it("reads the real data without throwing and agrees with the counts it states", () => {
    const avg = blocTotals(averagePoll, parties), c = majorityCounts(mainPolls, parties);
    expect(averageFinding(avg)).toMatch(/61 in the average\.$/);
    expect(c.n).toBe(mainPolls.length);
    expect(raceFinding(blocTrend(allPolls, parties, pollsData.config))).toMatch(/since/);
    expect(leanFinding(houseEffects(allPolls, parties, pollsData.config)).length).toBeGreaterThan(10);
  });
});

describe("polls desk findings in Hebrew", () => {
  it("states the average and the counter with the dual and zero", () => {
    expect(averageFinding({ net: 54.6, opp: 48 }, "he")).toBe("אף גוש אינו מגיע ל-61 בממוצע הסקרים.");
    expect(averageFinding({ net: 61, opp: 50 }, "he")).toBe("גוש נתניהו מגיע ל-61 בממוצע הסקרים.");
    expect(averageFinding({ net: 40, opp: 62.3 }, "he")).toBe("גוש האופוזיציה מגיע ל-61 בממוצע הסקרים.");
    expect(averageFinding({ net: 61, opp: 61 }, "he")).toBe("שני הגושים מגיעים ל-61 בממוצע, יותר ממה ש-120 המנדטים מאפשרים.");
    expect(counterText({ net: 1, opp: 0, n: 3 }, "he")).toBe("61 מנדטים ומעלה: גוש נתניהו ב-1 מתוך 3 הסקרים, גוש האופוזיציה באף סקר");
    expect(counterText({ net: 3, opp: 0, n: 3 }, "he")).toBe("61 מנדטים ומעלה: גוש נתניהו בכל 3 הסקרים, גוש האופוזיציה באף סקר");
    expect(counterText({ net: 1, opp: 1, n: 1 }, "he")).toBe("61 מנדטים ומעלה: גוש נתניהו בסקר היחיד, גוש האופוזיציה בסקר היחיד");
  });
  it("names the race leader or counts lead changes, with the long month and the dual", () => {
    expect(raceFinding([pt("2026-09-06", 55, 50)], "he")).toBe("גוש נתניהו מוביל בממוצע ברציפות מאז 6 בספטמבר");
    expect(raceFinding([pt("2026-09-06", 50, 55)], "he")).toBe("גוש האופוזיציה מוביל בממוצע ברציפות מאז 6 בספטמבר");
    expect(raceFinding([pt("2026-09-06", 50, 50)], "he")).toBe("שוויון בין הגושים מאז 6 בספטמבר");
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-08", 49, 50), pt("2026-09-09", 52, 50)], "he")).toBe("ההובלה בממוצע התחלפה פעמיים מאז 6 בספטמבר");
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-08", 49, 50)], "he")).toBe("ההובלה בממוצע התחלפה פעם אחת מאז 6 בספטמבר");
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-07", 49, 50), pt("2026-09-08", 52, 50), pt("2026-09-09", 49, 50)], "he")).toBe("ההובלה בממוצע התחלפה 3 פעמים מאז 6 בספטמבר");
    expect(raceFinding([], "he")).toBe("תמונת הגושים");
  });
  it("names the largest list and where it leads alone", () => {
    const avg = poll("avg", 30, 25, 20);
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 30, 20, 20)], ps, "he")).toBe("A מובילה בשני הסקרים העדכניים");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 30, 20, 20), poll("3", 30, 20, 20)], ps, "he")).toBe("A מובילה בכל 3 הסקרים העדכניים");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20)], ps, "he")).toBe("A מובילה בסקר העדכני היחיד");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 25, 25, 20)], ps, "he")).toBe("A היא המפלגה הגדולה בממוצע, ומובילה לבדה בסקר אחד מתוך 2");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 25, 25, 20), poll("3", 30, 20, 20)], ps, "he")).toBe("A היא המפלגה הגדולה בממוצע, ומובילה לבדה ב-2 מתוך 3 הסקרים העדכניים");
    expect(leaderFinding(avg, [poll("1", 25, 25, 20)], ps, "he")).toBe("A היא המפלגה הגדולה בממוצע, אך אינה מובילה לבדה באף סקר עדכני");
    expect(leaderFinding(poll("avg", 0, 0, 0), [], ps, "he")).toBe("כל רשימה בכל סקר עדכני");
  });
  it("words the largest move as a rise or fall", () => {
    const t = (a: number, b: number) => [{ date: "2026-09-06", avg: a, n: 1 }, { date: "2026-10-05", avg: b, n: 1 }];
    expect(moverFinding(new Map([["a", t(20, 23.2)], ["b", t(10, 6)]]), { a: "A", b: "B" }, "2026-09-06", "he")).toBe("התזוזה הגדולה בממוצע: B, ירידה של 4.0 מנדטים מאז 6 בספטמבר");
    expect(moverFinding(new Map([["a", t(20, 23.2)]]), { a: "A" }, "2026-09-06", "he")).toBe("התזוזה הגדולה בממוצע: A, עלייה של 3.2 מנדטים מאז 6 בספטמבר");
    expect(moverFinding(new Map([["a", t(20, 20.5)]]), { a: "A" }, "2026-09-06", "he")).toBe("אף רשימה לא זזה במנדט שלם בממוצע מאז 6 בספטמבר");
  });
  it("credits the outlet in the lean, the spread and the alternative", () => {
    const c14 = pollsterText("Channel 14", "he").text;
    expect(leanFinding([he("X", 5, 2.1), he("Channel 14", 4, 3.4)], 3, "he")).toBe(`בסקרי ${c14} גוש נתניהו גבוה ב-3.4 מנדטים מהממוצע`);
    expect(leanFinding([he("Z", 4, -3.4)], 3, "he")).toBe("בסקרי Z גוש נתניהו נמוך ב-3.4 מנדטים מהממוצע");
    expect(leanFinding([he("Y", 2, 6)], 3, "he")).toBe("הטיית הסוקרים");
    expect(spreadFinding([poll("1", 62, 40), poll("2", 55, 50)], ps, "he")).toBe("ב-2 הסקרים העדכניים: גוש נתניהו בין 55 ל-62, גוש האופוזיציה בין 40 ל-50");
    expect(spreadFinding([poll("1", 62, 40)], ps, "he")).toBe("בסקר העדכני היחיד: גוש נתניהו 62, גוש האופוזיציה 40");
    expect(spreadFinding([], ps, "he")).toBe("כל גוש בכל סקר עדכני");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 52.1, opp: 49 }, ["P", "Q"], "he")).toBe("בלי סקרי P ו-Q גוש נתניהו יורד ל-52.1, ירידה של 2.5 מנדטים");
    expect(variantFinding({ net: 52.1, opp: 48 }, { net: 54.6, opp: 49 }, ["P"], "he")).toBe("בלי סקרי P גוש נתניהו עולה ל-54.6, עלייה של 2.5 מנדטים");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 54.6, opp: 49 }, ["P"], "he")).toBe("בלי סקרי P גוש נתניהו נשאר ללא שינוי");
  });
  it("cites the average in Hebrew with the Hebrew address", () => {
    expect(citeText({ net: 54.64, opp: 48 }, 7, "2026-10-05", undefined, "he")).toBe("פתק 2026, ממוצע 7 הסקרים העדכניים, נכון ל-5 באוקטובר 2026: גוש נתניהו 54.6, גוש האופוזיציה 48.0 מתוך 120 מנדטים. https://www.israelielection.org/he/polls");
    expect(citeText({ net: 54.64, opp: 48 }, 1, "2026-10-05", undefined, "he")).toContain("ממוצע הסקר העדכני היחיד, נכון");
  });
  it("keeps the English untouched when no language is given", () => {
    expect(citeText({ net: 54.64, opp: 48 }, 7, "2026-10-05")).toMatch(/^Israel Votes 2026, .*\/polls$/);
  });
  it("reads the real data in Hebrew without English bloc names", () => {
    const avg = blocTotals(averagePoll, parties);
    for (const s of [averageFinding(avg, "he"), counterText(majorityCounts(mainPolls, parties), "he"), raceFinding(blocTrend(allPolls, parties, pollsData.config), "he"), spreadFinding(mainPolls, parties, "he")]) expect(s).not.toMatch(/bloc|Netanyahu/);
  });
});
