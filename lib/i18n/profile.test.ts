import { describe, expect, it } from "vitest";
import { blocNote, tiles } from "@/components/profile/model";
import { parties } from "@/lib/data";
import { seatFigure } from "@/lib/polls";
import profileText from "./profile";

const g = (o: Partial<{ avg: number | null; below: boolean; blocSeats: number; blocRank: number; blocSize: number }>) => ({ avg: 20, below: false, blocSeats: 50, blocRank: 1, blocSize: 5, ...o });

describe("blocNote", () => {
  it("is unchanged in English", () => {
    expect(blocNote(g({}), "net", seatFigure)).toBe("11.0 short of 61; this list is the largest of 5 in the bloc");
    expect(blocNote(g({ blocSeats: 62, blocRank: 2 }), "opp", seatFigure)).toBe("a majority; this list is second of 5 in the bloc");
    expect(blocNote(g({ avg: null }), "net", seatFigure)).toBe("11.0 short of 61; this list is not counted in the bloc total");
    expect(blocNote(g({ blocRank: 3, blocSize: 2 }), "arab", seatFigure)).toBe("a possible partner, not a governing bloc on its own; this list is third of 2");
    expect(blocNote(g({ blocSize: 1 }), "mid", seatFigure)).toBe("a possible partner, not a governing bloc on its own");
  });
  it("writes each Hebrew branch", () => {
    expect(blocNote(g({}), "net", seatFigure, "he")).toBe("לגוש חסרים 11.0 מנדטים ל-61; זו הרשימה הגדולה ביותר מבין 5 בגוש");
    expect(blocNote(g({ blocSeats: 60 }), "net", seatFigure, "he")).toBe("לגוש חסרים מנדט אחד ל-61; זו הרשימה הגדולה ביותר מבין 5 בגוש");
    expect(blocNote(g({ blocSeats: 62, blocRank: 2 }), "opp", seatFigure, "he")).toBe("לגוש יש רוב; זו הרשימה השנייה בגודלה מבין 5 בגוש");
    expect(blocNote(g({ below: true }), "arab", seatFigure, "he")).toBe("הרשימה לא נספרת בסך המנדטים של הגוש");
    expect(blocNote(g({ blocRank: 8, blocSize: 9 }), "mid", seatFigure, "he")).toBe("שותפה אפשרית, לא גוש שמתמודד על הרכבת ממשלה; זו הרשימה ה-8 בגודלה מבין 9");
  });
});

describe("Hebrew profile lines", () => {
  const H = profileText.he;
  it("counts polls and pollsters with one, the dual and digits", () => {
    expect(H.spark.reported(1, 1, "1.9.26", "5.10.26")).toMatch(/^סקר אחד של מכון אחד, מ-1\.9\.26 עד 5\.10\.26\./);
    expect(H.spark.reported(2, 2, "a", "b")).toMatch(/^שני סקרים של שני מכונים,/);
    expect(H.spark.reported(35, 9, "a", "b")).toMatch(/^35 סקרים של 9 מכונים,/);
    expect(H.glance.range(19, 23, 7)).toBe("מנורמל ל-120; בין 19 ל-23 ב-7 סקרים");
    expect(H.glance.range(19, 19, 1)).toBe("מנורמל ל-120; בין 19 ל-19 בסקר אחד");
    expect(H.spark.aria("הליכוד", 2, "a", "b", "21 מנדטים", "22.1")).toBe("הליכוד: המנדטים בשני סקרים, מ-a עד b; בסקר האחרון 21 מנדטים; 22.1 מנדטים בממוצע הסקרים. הנתונים מופיעים גם בטבלה.");
    expect(H.spark.seats(1)).toBe("מנדט אחד");
    expect(H.glance.wherePasses("3.4")).toBe("3.4 מנדטים בסקרים שבהם היא עוברת");
    expect(H.spark.othersJoined(2)).toBe("שני מכונים אחרים, מחוברים בקו");
  });
});

describe("tiles", () => {
  const likud = parties.find((p) => p.id === "likud")!;
  it("adds Hebrew text only in Hebrew", () => {
    expect(tiles(likud).every((t) => t.loc === undefined)).toBe(true);
    const he = tiles(likud, "he");
    expect(he.map((t) => t.label)).toEqual(Object.values(profileText.he.tiles.labels));
    expect(he.find((t) => t.key === "relig")!.loc?.text?.text.startsWith("Not said publicly")).toBe(false);
  });
});
