import { describe, expect, it } from "vitest";
import { averageAsPoll } from "./polls";
import { parties, pollsData } from "./data";
import { effectiveWeights, selectedPollTotal, sensitivityAverages, sensitivityPool, syntheticThresholdSeats,readSyntheticShare,writeSensitivityView } from "./sensitivity";
import type { Poll } from "./types";
const poll = (results: Poll["results"], combined: Poll["combined"] = []): Poll => ({ id: "test", pollster: "Test", firm: null, published: "2026-10-01", fieldwork: null, via: null, url: null, n: null, margin: null, note: null, results, combined });
describe("poll sensitivity", () => {
  it("counts a complete combined group once and marks missing/partial selections incomplete", () => {
    const p = poll({ a: { seats: 50 } }, [{ parties: ["b", "c"], seats: 20, note: "combined" }]);
    expect(selectedPollTotal(p, ["a", "b", "c", "b"]).total).toBe(70);
    expect(selectedPollTotal(p, ["a", "b"]).complete).toBe(false);
    expect(selectedPollTotal(p, ["unknown"]).missing).toEqual(["unknown"]);
    expect(selectedPollTotal(p, []).complete).toBe(false);
  });
  it("preserves the site's default normalized average exactly", () => {
    const pool = sensitivityPool(pollsData.polls, pollsData.config, pollsData.config.currentWindowDays, []).polls;
    const ids = parties.map((p) => p.id);
    const current = averageAsPoll(pool, ids);
    for (const row of sensitivityAverages(pool, ids, "sqrt").rows) if (row.average) expect(row.normalized).toBe(current.results[row.id].seats);
  });
  it("does not move the window anchor when excluding a publisher, and excludes exit polls", () => {
    const newer = { ...poll({ a: { seats: 60 } }), id: "new", published: "2026-10-05", pollster: "New" };
    const old = { ...poll({ a: { seats: 61 } }), pollster: "Old", published: "2026-09-26" };
    const cfg = { ...pollsData.config, pollsters: ["New", "Old"] };
    const pool = sensitivityPool([newer, old, { ...newer, kind: "exit", published: "2026-10-27" }], cfg, 7, ["New"]);
    expect(pool.anchor).toBe("2026-10-05"); expect(pool.polls).toHaveLength(0);
  });
  it("shows missing-sample imputation and permits a transparent equal-weight alternative", () => {
    const a = { ...poll({ x: { seats: 10 } }), n: 100 };
    const b = { ...poll({ x: { seats: 20 } }), n: 900 };
    const c = poll({ x: { seats: 0, belowThreshold: true } });
    expect(effectiveWeights([a, b, c], "sqrt")[2]).toMatchObject({ usedN: 500, imputed: true });
    expect(sensitivityAverages([a, b], ["x"], "equal").rows[0].average?.avg).toBe(15);
    expect(sensitivityAverages([a, b], ["x"], "sqrt").rows[0].average?.avg).toBe(17.5);
  });
  it("uses explicit hypothetical shares that sum to the valid-vote denominator", () => {
    const low = syntheticThresholdSeats(3.2); const high = syntheticThresholdSeats(3.3);
    expect(Object.values(low.votes).reduce((a, b) => a + b, 0)).toBe(100000);
    expect(low.passed).toBe(false); expect(high.passed).toBe(true);
    expect(low.coalition).toBeGreaterThanOrEqual(61); expect(high.coalition).toBeLessThan(61);
  });
});

it("shares and restores the fictional threshold input independently of real poll assumptions",()=>{
 const settings={selected:["likud","shas"],days:7,weighting:"equal" as const,excluded:["Direct Polls"],fiction:3.3};const shared=writeSensitivityView(new URLSearchParams("from=2026-10-01"),settings);
 expect(shared.get("synthetic")).toBe("3.3");expect(shared.get("from")).toBe("2026-10-01");expect(shared.get("with")).toBe("likud,shas");expect(shared.get("weight")).toBe("equal");
 const restored=readSyntheticShare(shared.get("synthetic"));expect(restored).toBe(settings.fiction);expect(syntheticThresholdSeats(restored).coalition).toBe(syntheticThresholdSeats(settings.fiction).coalition);expect(syntheticThresholdSeats(restored).passed).toBe(true);
 const defaults=writeSensitivityView(shared,{...settings,fiction:3.2,excluded:[]});expect(defaults.has("exclude")).toBe(false);expect(readSyntheticShare(defaults.get("synthetic"))).toBe(3.2);
 for(const input of [null,"0","","NaN","Infinity","2.4","4.6"]){expect(readSyntheticShare(input)).toBe(3.2);}expect(readSyntheticShare("2.5")).toBe(2.5);expect(readSyntheticShare("4.5")).toBe(4.5);expect(readSyntheticShare("3.26")).toBe(3.3);
});
