import { describe, expect, it } from "vitest";
import quiz from "@/data/quiz.json";
import { matrixRows, type MatrixCell } from "@/components/compare/model";
import { parties } from "./data";
import { agreement, decodeAnswers, encodeAnswers, rankParties, scoreParty, type MatchRow } from "./match";

const st = (stance: string, position: number | null): MatrixCell => ({ kind: "stance", stance, n: 1, position, record: false, unstated: false });
const scale: MatchRow = {
  key: "s", scale: true,
  stances: [{ id: "a", position: 0 }, { id: "b", position: 0.5 }, { id: "c", position: 1 }],
  cells: { x: st("a", 0), y: st("c", 1), z: { kind: "declined" }, w: st("b", 0.5) },
};
const econ: MatchRow = { key: "e", scale: false, stances: [{ id: "m", position: null }, { id: "n", position: null }], cells: { x: st("m", null), y: st("n", null), z: st("m", null), w: { kind: "none" } } };

describe("agreement", () => {
  it("is 1 for the same answer and 0 for the opposite end", () => {
    expect(agreement(scale, "a", scale.cells.x)).toBe(1);
    expect(agreement(scale, "a", scale.cells.y)).toBe(0);
    expect(agreement(scale, "a", scale.cells.w)).toBe(0.5);
  });
  it("cannot compare a declined or missing answer", () => {
    expect(agreement(scale, "a", scale.cells.z)).toBeNull();
    expect(agreement(scale, "a", undefined)).toBeNull();
  });
  it("treats priorities that can coexist as same-or-not", () => {
    expect(agreement(econ, "m", econ.cells.x)).toBe(1);
    expect(agreement(econ, "m", econ.cells.y)).toBe(0);
  });
});

describe("scoreParty and rankParties", () => {
  const rows = [scale, econ];
  it("ignores skipped questions", () => {
    const s = scoreParty("x", rows, { s: { stance: "a", importance: 1 }, e: null });
    expect(s.match).toBe(1);
    expect(s.asked).toBe(1);
  });
  it("drops a declined answer from the average rather than counting it against the list", () => {
    const s = scoreParty("z", rows, { s: { stance: "c", importance: 1 }, e: { stance: "m", importance: 1 } });
    expect(s.match).toBe(1);
    expect(s.both).toBe(1);
    expect(s.coverage).toBe(0.5);
  });
  it("weights by importance and flags deal-breaker clashes", () => {
    const s = scoreParty("y", rows, { s: { stance: "a", importance: 2 }, e: { stance: "n", importance: 0 } });
    expect(s.match).toBeCloseTo((2 * 0 + 0.5 * 1) / 2.5);
    expect(s.clashes).toEqual(["s"]);
  });
  it("ranks by match and sets apart lists with too little on record", () => {
    const thinRow: MatchRow = { ...scale, key: "t", cells: { x: st("a", 0), y: st("a", 0), z: { kind: "none" }, w: { kind: "none" } } };
    const { ranked, thin } = rankParties(["x", "y", "z", "w"], [scale, econ, thinRow], { s: { stance: "a", importance: 1 }, e: { stance: "m", importance: 1 }, t: { stance: "a", importance: 1 } });
    expect(ranked.map((r) => r.id)).toEqual(["x", "y"]);
    expect(thin.map((r) => r.id)).toEqual(["z", "w"]);
  });
});

describe("URL answers", () => {
  const order = [{ key: "s", options: ["a", "b", "c"] }, { key: "e", options: ["m", "n"] }, { key: "t", options: ["a"] }];
  it("round-trips and trims trailing blanks", () => {
    const a = { s: { stance: "c", importance: 2 as const }, e: null };
    const code = encodeAnswers(order, a);
    expect(code).toBe("22");
    expect(decodeAnswers(order, code)).toEqual({ s: { stance: "c", importance: 2 } });
  });
  it("ignores junk", () => {
    expect(decodeAnswers(order, "9x--05")).toEqual({});
    expect(decodeAnswers(order, "9x--01")).toEqual({ t: { stance: "a", importance: 1 } });
  });
});

describe("data/quiz.json against the Compare matrix", () => {
  const rows = matrixRows(parties.map((p) => p.id));
  for (const q of [...quiz.core, ...quiz.deeper]) {
    it(`${q.row}: every option is a stance on its row`, () => {
      const row = rows.find((r) => r.key === q.row);
      expect(row, q.row).toBeTruthy();
      const ids = row!.stances.map((s) => s.id);
      for (const o of Object.keys(q.options)) expect(ids).toContain(o);
      expect(Object.keys(q.options).length).toBeGreaterThanOrEqual(2);
    });
  }
  it("covers the seven issues in its core round", () => {
    expect(quiz.core.map((q) => q.row).sort()).toEqual(["courts", "draft", "econ", "pstate", "relig", "war", "wb"]);
  });
});
