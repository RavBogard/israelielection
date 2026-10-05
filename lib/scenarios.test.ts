import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Party, Poll } from "./types";
import { builderHref, clears, readClears, readNumbers, scenarioNumbers, type ScenariosFile } from "./scenarios";
import { parties } from "./data";

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const unquoted = (s: string) => s.replace(/"[^"]*"|“[^”]*”/g, "");

describe("scenario numbers", () => {
  const ps = [{ id: "a", name: "A", bloc: "net" }, { id: "b", name: "B", bloc: "net" }] as Party[];
  const poll = (id: string, a: number, b: number) => ({ id, combined: [], results: { a: { seats: a }, b: { seats: b } } }) as unknown as Poll;
  it("reads the average, the range and how many polls reach 61", () => {
    const n = scenarioNumbers(["a", "b"], ps, poll("avg", 30.4, 25.2), [poll("x", 30, 25), poll("y", 33, 30), poll("z", 28, 24)]);
    expect(n).toEqual({ average: 56, low: 52, high: 63, reaching: 1, polls: 3 });
    expect(readNumbers(n)).toBe("56 seats in the poll average, 5 short of 61; 52 to 63 across the latest 3 polls, 1 reaching 61.");
    expect(readNumbers({ average: 62, low: 61, high: 64, reaching: 3, polls: 3 })).toBe(
      "62 seats in the poll average, a majority; 61 to 64 across the latest 3 polls, all reaching 61."
    );
  });
  it("counts the polls where a list clears the threshold", () => {
    const polls = [poll("x", 4, 0), { id: "y", results: { a: { seats: 0, belowThreshold: true } } } as unknown as Poll, poll("z", 5, 0)];
    expect(clears("a", polls)).toBe(2);
    expect(clears("b", polls)).toBe(0);
    expect(readClears(2, 3)).toBe("clears the threshold in 2 of the latest 3 polls");
    expect(readClears(0, 3)).toBe("below the threshold in all of the latest 3 polls");
  });
  it("links the Builder with the line-up and the average", () => {
    expect(builderHref(["likud", "shas"])).toBe("/coalition-builder?with=likud,shas&poll=avg");
  });
});

const file = "data/teach-scenarios.json";
describe.runIf(existsSync(file))("scenario data", () => {
  const d = (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { checked: "", scenarios: [] }) as ScenariosFile;
  it("is dated and every line-up names real lists", () => {
    expect(d.checked).toMatch(/^\d{4}-\d\d-\d\d$/);
    expect(new Set(d.scenarios.map((s) => s.id)).size).toBe(d.scenarios.length);
    for (const s of d.scenarios) for (const id of s.with) expect(parties.some((p) => p.id === id), `${s.id}: ${id}`).toBe(true);
  });
  it("keeps to the card rules: short, sourced, no seat totals in the prose, house terms", () => {
    for (const s of d.scenarios) {
      expect(s.title.length, s.id).toBeLessThanOrEqual(60);
      expect(words(s.lead), `${s.id} lead`).toBeLessThanOrEqual(70);
      expect(words(s.notice), `${s.id} notice`).toBeLessThanOrEqual(30);
      expect(words(s.question), `${s.id} question`).toBeLessThanOrEqual(50);
      expect(s.sources.length).toBeGreaterThan(0);
      for (const x of s.sources) {
        expect(x.url).toMatch(/^https:\/\//);
        expect(x.url).not.toMatch(/wikipedia\.org/);
        expect(x.date.length).toBeGreaterThan(3);
      }
      const prose = `${s.title} ${s.lead} ${s.notice} ${s.question}`;
      // Seat totals change with the polls; the card computes them.
      expect(prose, s.id).not.toMatch(/\b\d+(\.\d+)? seats\b/);
      expect(prose).not.toMatch(/Lieberman|far-right|\bthe conflict\b|Judea and Samaria/i);
      expect(unquoted(prose)).not.toMatch(/genocide/i);
      expect(unquoted(prose)).not.toMatch(/\b(I|we|our|my)\b/);
    }
  });
});
