import { describe, expect, it } from "vitest";
import { mainPolls, pollsData, variantPolls } from "./data";
import { average, averageAsPoll, currentPolls, pollWeights, withoutVariantPolls } from "./polls";
import type { Poll, PollsConfig } from "./types";

/** A synthetic poll: `seats` maps list id to seats, 0 meaning below the threshold. */
function poll(id: string, pollster: string, n: number | null, seats: Record<string, number>, published = "2026-10-01"): Poll {
  const results: Poll["results"] = {};
  for (const [k, v] of Object.entries(seats)) results[k] = v === 0 ? { seats: 0, belowThreshold: true } : { seats: v };
  return { id, pollster, firm: null, fieldwork: null, published, via: null, url: null, n, margin: null, note: null, results, combined: [] };
}

const config: PollsConfig = {
  ...pollsData.config,
  withoutVariant: { label: "Without Filber", note: "", pollsters: ["Channel 14", "i24NEWS"] },
};

describe("average (ruling 110)", () => {
  it("averages a list over the polls where it passed only", () => {
    const ps = [poll("a", "A", 400, { x: 4 }), poll("b", "B", 400, { x: 6 }), poll("c", "C", 400, { x: 0 })];
    const a = average("x", ps)!;
    expect(a.avg).toBe(5);
    expect(a.seats).toBe(5);
  });

  it("reports k of n: passing polls out of the polls that reported the list", () => {
    const ps = [poll("a", "A", 400, { x: 4 }), poll("b", "B", 400, { x: 0 }), poll("c", "C", 400, { x: 5 }), poll("d", "D", 400, { y: 10 })];
    expect(average("x", ps)).toMatchObject({ k: 2, n: 3 });
    expect(average("z", ps)).toBeNull();
  });

  it("marks a list passing in fewer than half its polls as near the threshold and counts it 0", () => {
    const ps = [poll("a", "A", 400, { x: 4 }), poll("b", "B", 400, { x: 0 }), poll("c", "C", 400, { x: 0 })];
    const a = average("x", ps)!;
    expect(a).toMatchObject({ k: 1, n: 3, nearThreshold: true, seats: 0 });
    expect(a.avg).toBe(4);
    expect(averageAsPoll(ps, ["x"]).results.x).toEqual({ seats: 0, belowThreshold: true });
    // Exactly half is not "fewer than half".
    const half = average("x", [poll("a", "A", 400, { x: 4 }), poll("b", "B", 400, { x: 0 })])!;
    expect(half).toMatchObject({ k: 1, n: 2, nearThreshold: false, seats: 4 });
  });

  it("never yields a passing seat count below 4 in the average poll", () => {
    const avg = averageAsPoll(mainPolls, Object.keys(Object.assign({}, ...mainPolls.map((p) => p.results))));
    for (const r of Object.values(avg.results)) if (!r.belowThreshold) expect(r.seats).toBeGreaterThanOrEqual(4);
  });
});

describe("weights (ruling 111)", () => {
  it("weights by √n, and a poll with unknown n by the median known n of the set", () => {
    const ps = [poll("a", "A", 100, { x: 10 }), poll("b", "B", 900, { x: 20 }), poll("c", "C", 400, { x: 4 }), poll("d", "D", null, { x: 6 })];
    const w = pollWeights(ps);
    expect(w.get(ps[0])).toBe(10);
    expect(w.get(ps[1])).toBe(30);
    expect(w.get(ps[3])).toBe(20); // median of 100, 400, 900 = 400
    expect(average("x", ps)!.avg).toBeCloseTo((10 * 10 + 30 * 20 + 20 * 4 + 20 * 6) / (10 + 30 + 20 + 20), 12);
  });

  it("weighs every poll equally when no sample size is known", () => {
    const ps = [poll("a", "A", null, { x: 4 }), poll("b", "B", null, { x: 8 })];
    expect(average("x", ps)!.avg).toBe(6);
  });
});

describe("which polls are averaged (ruling 111)", () => {
  const ps = [
    poll("c14", "Channel 14", 600, { likud: 32 }),
    poll("i24", "i24NEWS", 500, { likud: 26 }),
    poll("c12", "Channel 12", 500, { likud: 20 }),
    poll("kan", "Kan 11", null, { likud: 21 }),
  ];

  it("includes Channel 14 in the main average", () => {
    expect(currentPolls(ps, config).map((p) => p.pollster)).toContain("Channel 14");
    expect(mainPolls.some((p) => p.pollster === "Channel 14")).toBe(true);
  });

  it("drops Filber's firms from the variant only", () => {
    const v = withoutVariantPolls(currentPolls(ps, config), config);
    expect(v.map((p) => p.pollster)).toEqual(["Channel 12", "Kan 11"]);
    // Kan's unknown n takes the median known n of the variant set (500), so the two weigh the same.
    expect(average("likud", v)!.avg).toBe(20.5);
    expect(variantPolls.some((p) => ["Channel 14", "i24NEWS"].includes(p.pollster))).toBe(false);
  });

  it("names the Filber firms by the pollster strings used in data/polls.json", () => {
    const names = new Set(pollsData.polls.map((p) => p.pollster));
    for (const f of pollsData.config.withoutVariant.pollsters) expect(names.has(f), f).toBe(true);
  });
});
