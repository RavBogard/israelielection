import { describe, expect, it } from "vitest";
import { parties } from "./data";
import { stanceMap } from "./cohesion";
import { comparisonIssues } from "./positions";
import { governing, governingSummary, rowText, unstatedFrom } from "./coalition-governing";

const map = stanceMap(comparisonIssues(), parties.map((p) => p.id));
const firstKey = "draft-left-yeshiva";

describe("governing", () => {
  it("leads with the questions every party answered, not with missing evidence", () => {
    const g = governing(map, {}, ["likud", "shas", "utj", "otzma"]);
    expect(g.total).toBe(Object.keys(map).length);
    expect(g.comparable).toBe(g.agree + g.differ);
    expect(governingSummary(g)).toMatch(/^(On the \d+ of \d+ questions with answers from every party, they|None of the)/);
    expect(governingSummary(g)).not.toMatch(/incomplete/);
  });

  it("puts a question with fewer than two answers in the thin group", () => {
    const g = governing(map, {}, ["likud", "otzma"]);
    for (const r of g.rows) if (r.reach === "thin") expect(r.answers.length).toBeLessThan(2);
  });

  it("counts a position not said publicly as an answer, marked so", () => {
    const stance = map[firstKey].stances[0].id;
    const unstated = unstatedFrom([{ key: firstKey, unstated: { likud: { stance, text: "Basis.", source: "Src", date: "Oct 1, 2026" }, otzma: { stance: "not-an-option", text: "", source: "" } } }], map);
    expect(Object.keys(unstated[firstKey])).toEqual(["likud"]);
    const without = governing(map, {}, ["likud", "shas"]).rows.find((r) => r.key === firstKey)!;
    const withU = governing(map, unstated, ["likud", "shas"]).rows.find((r) => r.key === firstKey)!;
    expect(without.missing).toContain("likud");
    expect(withU.missing).not.toContain("likud");
    expect(withU.answers.find((a) => a.id === "likud")?.unstated?.text).toBe("Basis.");
    expect(withU.reach).toBe("every");
  });

  it("words the summary for agreement and difference", () => {
    expect(governingSummary({ rows: [], total: 15, comparable: 2, agree: 0, differ: 2 })).toBe("On the 2 of 15 questions with answers from every party, they differ on all 2.");
    expect(governingSummary({ rows: [], total: 15, comparable: 2, agree: 1, differ: 1 })).toBe("On the 2 of 15 questions with answers from every party, they agree on 1 and differ on 1.");
    expect(governingSummary({ rows: [], total: 15, comparable: 0, agree: 0, differ: 0 })).toBe("None of the 15 questions has an answer from every one of these parties.");
  });

  it("names who did not answer on a partly answered row", () => {
    const g = governing(map, {}, ["shas", "utj", "likud"]);
    const r = g.rows.find((x) => x.reach === "some")!;
    expect(rowText(r, (id) => id.toUpperCase(), 3)).toMatch(/No answer: LIKUD/);
  });
});
