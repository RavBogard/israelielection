import { describe, expect, it } from "vitest";
import { AXES, type PositionRow } from "./compare";
import { cohesion, dependence, dependenceText, readIssue, readingText, stanceMap, standingOf, type Issue, type IssueFile, type StanceMap } from "./cohesion";
import { averagePoll, parties } from "./data";

const stances = [
  { id: "exempt", label: "Keep exemptions for yeshiva students" },
  { id: "quotas", label: "Draft quotas with sanctions" },
  { id: "all", label: "Draft everyone, or national service" },
];

const file = (rows: PositionRow[], withStances = true): IssueFile => ({ issue: "x", title: "x", rows, ...(withStances ? { stances, question: "Should yeshiva students be drafted?" } : {}) });

const nameOf = (id: string) => ({ a: "Alef", b: "Bet", c: "Gimel", d: "Dalet" })[id] ?? id;

describe("standingOf", () => {
  it("reads a stance id, a refusal, silence and rows not yet sorted", () => {
    expect(standingOf({ party: "a", text: "yes", stance: "quotas" }, stances)).toEqual({ kind: "stance", stance: "quotas" });
    expect(standingOf({ party: "a", status: "declined" }, stances)).toEqual({ kind: "declined" });
    expect(standingOf({ party: "a", declined: true, text: "refused" }, stances)).toEqual({ kind: "declined" });
    expect(standingOf({ party: "a", status: "none" }, stances)).toEqual({ kind: "none" });
    expect(standingOf(undefined, stances)).toEqual({ kind: "none" });
    expect(standingOf({ party: "a", text: "yes" }, undefined)).toEqual({ kind: "unsorted" });
    expect(standingOf({ party: "a", text: "yes", stance: "not-an-id" }, stances)).toEqual({ kind: "unsorted" });
  });
});

function mapFor(rows: PositionRow[], withStances = true): StanceMap {
  const issues: Issue[] = AXES.map((a) => ({ key: a.key, label: a.label, file: file(a.key === "draft" ? rows : [], a.key === "draft" && withStances) }));
  return stanceMap(issues, ["a", "b", "c", "d"]);
}

describe("readIssue and readingText", () => {
  it("agree: one stance among those who have one, the quiet ones named", () => {
    const m = mapFor([
      { party: "a", text: "q", stance: "quotas" },
      { party: "b", text: "q", stance: "quotas" },
      { party: "c", status: "declined" },
    ]);
    const r = readIssue("draft", m, ["a", "b", "c"]);
    expect(r.verdict).toBe("agree");
    expect(r.groups).toEqual([{ stance: stances[1], parties: ["a", "b"] }]);
    expect(r.declined).toEqual(["c"]);
    expect(readingText(r, nameOf)).toBe("Agree: draft quotas with sanctions; Gimel has no recorded position.");
  });

  it("split: groups in stance order, counted in words", () => {
    const m = mapFor([
      { party: "a", text: "q", stance: "all" },
      { party: "b", text: "q", stance: "exempt" },
      { party: "c", text: "q", stance: "quotas" },
    ]);
    const r = readIssue("draft", m, ["a", "b", "c", "d"]);
    expect(r.verdict).toBe("split");
    expect(r.groups.map((g) => g.stance.id)).toEqual(["exempt", "quotas", "all"]);
    expect(r.none).toEqual(["d"]);
    expect(readingText(r, nameOf)).toBe("Split three ways; Dalet has no recorded position.");
  });

  it("silent when nobody has a stance; unsorted when the file has no stances yet", () => {
    expect(readIssue("courts", mapFor([]), ["a", "b"]).verdict).toBe("silent");
    const r = readIssue("draft", mapFor([{ party: "a", text: "q" }], false), ["a", "b"]);
    expect(r.verdict).toBe("unsorted");
    expect(readingText(r, nameOf)).toBe("Positions recorded, not yet sorted into stances.");
  });

  it("a party missing from the map counts as silent", () => {
    const m = mapFor([{ party: "a", text: "q", stance: "all" }]);
    expect(readIssue("draft", m, ["a", "zz"]).none).toEqual(["zz"]);
  });
});

describe("cohesion", () => {
  it("counts agree, split and silent issues", () => {
    const m = mapFor([
      { party: "a", text: "q", stance: "all" },
      { party: "b", text: "q", stance: "all" },
    ]);
    const c = cohesion(AXES, m, ["a", "b"]);
    expect(c.issues).toHaveLength(7);
    expect(c.agree).toBe(1);
    expect(c.split).toBe(0);
    expect(c.silent).toBe(6);
  });
});

describe("dependence", () => {
  const net = parties.filter((p) => p.bloc === "net" && p.coalitionCard === "active").map((p) => p.id);
  it("is empty under 61", () => {
    const d = dependence(new Set(["likud"]), parties, averagePoll);
    expect(d).toEqual({ needed: [], spare: [], majority: false });
    expect(dependenceText(d, nameOf)).toBeNull();
  });

  it("splits a majority into the parties it needs and the ones it could lose", () => {
    const sel = new Set([...net, "res", "yb"]);
    const d = dependence(sel, parties, averagePoll);
    expect(d.majority).toBe(true);
    expect([...d.needed, ...d.spare].sort()).toEqual([...sel].sort());
    for (const id of d.spare) {
      const rest = new Set(sel);
      rest.delete(id);
      expect(dependence(rest, parties, averagePoll).majority).toBe(true);
    }
  });

  it("phrases the reading", () => {
    expect(dependenceText({ majority: true, needed: ["a", "b"], spare: [] }, nameOf)).toBe("A majority that needs every one of its two parties: lose any one and it falls under 61.");
    expect(dependenceText({ majority: true, needed: ["a"], spare: ["b"] }, nameOf)).toBe("Holds 61 without Bet; needs each of the others.");
    expect(dependenceText({ majority: true, needed: ["a"], spare: ["b", "c", "d"] }, nameOf)).toBe("Holds 61 without Bet, Gimel or Dalet; needs each of the others.");
    expect(dependenceText({ majority: true, needed: [], spare: ["a", "b"] }, nameOf)).toBe("Holds 61 without any one of these parties.");
  });
});
