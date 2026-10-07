import { describe, expect, it } from "vitest";
import { matrixRows } from "@/components/compare/model";
import { parties } from "../data";
import { SHORT, SHORT_MAX } from "./compare-short";

describe("Compare short names", () => {
  const rows = matrixRows(parties.map((p) => p.id));
  const keys = rows.flatMap((r) => r.stances.map((s) => `${r.key}:${s.id}`));

  it("names every answer in the matrix, in both editions, and nothing else", () => {
    for (const lang of ["en", "he"] as const) {
      expect(Object.keys(SHORT[lang]).sort(), lang).toEqual([...keys].sort());
    }
  });

  it("keeps each name short and distinct within its row", () => {
    for (const lang of ["en", "he"] as const) {
      for (const r of rows) {
        const names = r.stances.map((s) => SHORT[lang][`${r.key}:${s.id}`]);
        for (const n of names) expect(n.length, `${lang} ${r.key}: ${n}`).toBeLessThanOrEqual(SHORT_MAX);
        expect(new Set(names).size, `${lang} ${r.key}`).toBe(names.length);
      }
    }
  });
});
