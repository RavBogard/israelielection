import { describe, expect, it } from "vitest";
import { averagePoll, blocs, mainPolls, parties } from "./data";
import { citeText, findingSentence, israelDate, noNewLabel, pollSlip, sincePolls } from "./home-since";
import type { Poll } from "./types";

const poll = (id: string, pollster: string, published: string, seats: Record<string, number>, extra: Partial<Poll> = {}): Poll => ({
  id, pollster, firm: null, fieldwork: null, published, via: null, url: null, n: null, margin: null, note: null,
  results: Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, { seats: v }])), combined: [], ...extra,
});
// likud and shas are net, yashar is opp, raam is arab.
const short = (id: string, pollster: string, date = "2026-10-01") => poll(id, pollster, date, { likud: 30, shas: 24, yashar: 52, raam: 14 });
const over = (id: string, pollster: string, date = "2026-10-01") => poll(id, pollster, date, { likud: 40, shas: 24, yashar: 44, raam: 12 });

describe("since yesterday", () => {
  it("reads the Israeli calendar, not UTC", () => {
    expect(israelDate(Date.parse("2026-10-05T22:30:00Z"))).toBe("2026-10-06");
    expect(israelDate(Date.parse("2026-10-05T20:00:00Z"))).toBe("2026-10-05");
  });
  it("takes today's and yesterday's polls, newest first, and falls back to the newest one", () => {
    const ps = [short("a", "A", "2026-10-04"), short("b", "B", "2026-10-05"), short("c", "C", "2026-10-06"), { ...short("x", "Kan 11", "2026-10-06"), kind: "exit" as const }];
    expect(sincePolls(ps, "2026-10-06")).toMatchObject({ fresh: true, polls: [{ id: "c" }, { id: "b" }] });
    const stale = sincePolls(ps, "2026-10-09");
    expect(stale.fresh).toBe(false);
    expect(stale.polls.map((p) => p.id)).toEqual(["c"]);
    expect(noNewLabel(stale.polls[0])).toBe("No new polls since Oct 6");
  });
  it("draws a slip with bloc totals in seat order and marks a bloc at 61 or more", () => {
    const s = pollSlip(over("o", "Channel 14"), parties, blocs);
    expect(s.blocs.map((b) => [b.id, b.seats])).toEqual([["net", 64], ["mid", 0], ["opp", 44], ["arab", 12]]);
    expect(s.majority).toEqual(["net"]);
    expect(pollSlip(short("s", "Maariv"), parties, blocs).majority).toEqual([]);
  });
});

describe("finding sentence", () => {
  it("names the only poll over 61", () => {
    const ps = [...["A", "B", "C", "D", "E", "F"].map((n) => short(n, n)), over("g", "Channel 14")];
    expect(findingSentence(ps, parties, blocs)).toBe("The Netanyahu bloc is short of 61 in 6 of 7 current polls; only Channel 14 has it at 61 or more.");
  });
  it("names several, and handles none and all", () => {
    expect(findingSentence([short("a", "A"), over("b", "Channel 14"), over("c", "i24NEWS")], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in 1 of 3 current polls; Channel 14 and i24NEWS have it at 61 or more.");
    expect(findingSentence([short("a", "A"), short("b", "B")], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in both current polls.");
    expect(findingSentence([over("a", "A")], parties, blocs)).toBe("The Netanyahu bloc has 61 or more in the one current poll.");
    expect(findingSentence([], parties, blocs)).toBeNull();
  });
  it("sets aside a poll whose cross-bloc combined seats could carry the bloc over 61", () => {
    const crossed = poll("x", "Zman", "2026-10-01", { likud: 40, yashar: 50 }, { combined: [{ parties: ["shas", "raam"], seats: 30, note: "" }] });
    expect(findingSentence([short("a", "A"), crossed], parties, blocs)).toBe("The Netanyahu bloc is short of 61 in the one current poll. Zman reports lists from different blocs together and is left out.");
  });
  it("matches the live data's own count", () => {
    const s = findingSentence(mainPolls, parties, blocs)!;
    expect(s).toContain(`current poll`);
    expect(s).toMatch(/^The Netanyahu bloc /);
  });
});

describe("cite", () => {
  it("states the average, its date, the figure and the poll count", () => {
    expect(citeText({ ...averagePoll, published: "2026-10-05" }, 7, "Netanyahu bloc", 54.63)).toBe("Israel Votes 2026 polling average, October 5, 2026: Netanyahu bloc 54.6 of 120 seats (7 polls). israelielection.org/polls");
  });
});

describe("the Hebrew finding (STYLE.md agreement: blocs masculine, pollsters through the outlet)", () => {
  const he = [{ id: "net" as const, label: "גוש נתניהו" }, { id: "opp" as const, label: "גוש האופוזיציה" }, { id: "mid" as const, label: "מחוץ לגושים" }, { id: "arab" as const, label: "המפלגות הערביות" }];
  const f = (ps: Poll[], id: "net" | "arab" = "net") => findingSentence(ps, parties, he, id, "he");
  it("names the only poll at 61 or more", () => {
    const ps = [...["A", "B", "C", "D", "E", "F"].map((n) => short(n, n)), over("g", "Z")];
    expect(f(ps)).toBe("גוש נתניהו נשאר מתחת ל-61 ב-6 מתוך 7 הסקרים העדכניים; 61 ומעלה רק בסקר Z.");
  });
  it("names several, with the Hebrew conjunction", () => {
    expect(f([short("a", "A"), over("b", "X"), over("c", "Y")])).toMatch(/^גוש נתניהו נשאר מתחת ל-61 באחד מתוך 3 הסקרים העדכניים; 61 ומעלה בסקרים של X ו-?Y\.$/);
    expect(f([short("a", "A"), short("b", "B"), over("c", "X"), over("d", "Y")])).toMatch(/^גוש נתניהו נשאר מתחת ל-61 בשניים מתוך 4 הסקרים/);
    expect(f([short("a", "A"), over("b", "X")])).toBe("גוש נתניהו נשאר מתחת ל-61 באחד משני הסקרים העדכניים; 61 ומעלה רק בסקר X.");
  });
  it("handles none, all, one and two polls without '1 סקרים'", () => {
    expect(f([short("a", "A"), short("b", "B")])).toBe("גוש נתניהו נשאר מתחת ל-61 בשני הסקרים העדכניים.");
    expect(f([short("a", "A"), short("b", "B"), short("c", "C")])).toBe("גוש נתניהו נשאר מתחת ל-61 בכל 3 הסקרים העדכניים.");
    expect(f([over("a", "A")])).toBe("גוש נתניהו מגיע ל-61 ומעלה בסקר העדכני היחיד.");
    expect(f([])).toBeNull();
  });
  it("takes the feminine plural for the Arab lists", () => {
    expect(f([short("a", "A")], "arab")).toBe("המפלגות הערביות נשארות מתחת ל-61 בסקר העדכני היחיד.");
  });
  it("sets aside cross-bloc polls, one or several, and says when none can be compared", () => {
    const crossed = (id: string, name: string) => poll(id, name, "2026-10-01", { likud: 40, yashar: 50 }, { combined: [{ parties: ["shas", "raam"], seats: 30, note: "" }] });
    expect(f([short("a", "A"), crossed("x", "Zman")])).toBe("גוש נתניהו נשאר מתחת ל-61 בסקר העדכני היחיד. סקר Zman לא נכלל, כי הוא מדווח יחד על רשימות מגושים שונים.");
    expect(f([short("a", "A"), crossed("x", "P"), crossed("y", "Q")])).toMatch(/\. סקרי P ו-?Q לא נכללו, כי הם מדווחים יחד על רשימות מגושים שונים\.$/);
    expect(f([crossed("x", "P")])).toBe("באף סקר עדכני אי אפשר לחשב את גוש נתניהו בנפרד מול רף ה-61.");
  });
  it("cites, labels the no-news line and the slip in Hebrew", () => {
    expect(citeText({ ...averagePoll, published: "2026-10-05" }, 7, "גוש נתניהו", 54.63, undefined, "he")).toBe("ממוצע הסקרים של פתק 2026, 5 באוקטובר 2026: גוש נתניהו 54.6 מתוך 120 מנדטים (7 סקרים). israelielection.org/he/polls");
    expect(citeText({ ...averagePoll, published: "2026-10-05" }, 1, "גוש נתניהו", 54.63, undefined, "he")).toContain("(סקר אחד)");
    expect(citeText({ ...averagePoll, published: "2026-10-05" }, 2, "גוש נתניהו", 54.63, undefined, "he")).toContain("(שני סקרים)");
    expect(noNewLabel(short("c", "C", "2026-10-06"), "he")).toBe("אין סקרים חדשים מאז 6.10");
    expect(noNewLabel(undefined, "he")).toBe("עדיין אין סקרים");
    expect(noNewLabel(undefined)).toBe("No polls yet");
    expect(pollSlip(short("s", "Maariv"), parties, he, "he").blocs.map((b) => b.label)).toEqual(["גוש נתניהו", "מחוץ לגושים", "גוש האופוזיציה", "המפלגות הערביות"]);
  });
});
