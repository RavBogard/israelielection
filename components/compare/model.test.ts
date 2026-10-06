import { describe, expect, it } from "vitest";
import { matrixRows, type MatrixCell } from "./model";
import { tiles } from "../profile/model";
import { parties } from "@/lib/data";

describe("unstated flags", () => {
  const ids = parties.map((p) => p.id);
  const stanceCells = matrixRows(ids).flatMap((r) => Object.values(r.cells)).filter((c): c is Extract<MatrixCell, { kind: "stance" }> => c.kind === "stance");
  it("flags unstated and record cells apart from stated ones", () => {
    expect(stanceCells.some((c) => c.unstated)).toBe(true);
    expect(stanceCells.some((c) => !c.unstated && !c.record)).toBe(true);
    expect(stanceCells.every((c) => !(c.unstated && c.record))).toBe(true);
  });
  it("marks Likud's religion-and-state tile as unstated with qualified words", () => {
    const likud = parties.find((p) => p.id === "likud")!;
    const t = tiles(likud).find((x) => x.key === "relig")!;
    expect(t.basis).toBe("unstated");
    expect(t.text?.startsWith("Not said publicly: ")).toBe(true);
  });
});
