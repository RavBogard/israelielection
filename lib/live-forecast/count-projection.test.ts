import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import countPrior from "../../data/count-prior.json";
import { BLOCS, countProjection, expectedFinalValid, frozenPriorShares, priorShares, rollGrowth2026 } from "./count-estimate";
import { blendWeight, OTHER, parseLocalities } from "./count-nowcast";
import results from "../../data/results.json";

// The CEC per-locality file as captured on election night 2026 at 01:54Z: 539 localities, 1,210,461 valid votes, no envelopes.
const raw = readFileSync(new URL("./fixtures/expc-2026-10-28T0154Z.csv", import.meta.url), "utf8");
const snapshot = { partySeats: Object.entries(countPrior.seats).map(([id, seats]) => ({ id, seats: { lo: seats - 2, median: seats, hi: seats + 2 } })) };
const blocSeats = (seats: Record<string, number>) => {
  const b: Record<string, number> = {};
  for (const [id, n] of Object.entries(seats)) b[BLOCS[id]] = (b[BLOCS[id]] ?? 0) + n;
  return b;
};

describe("count projection on the election-night file", () => {
  const r = countProjection({ raw, snapshot, draws: 200 })!;

  it("reads the counted-box roll from expc and projects the uncounted vote at tonight's turnout", () => {
    expect(r.mode).toBe("count");
    expect(r.coverage.eligible).toBeGreaterThan(0.2);
    expect(r.coverage.eligible).toBeLessThan(0.3);
    expect(r.coverage.votes).toBeGreaterThan(0.18);
    expect(r.coverage.votes).toBeLessThan(0.25);
    const total = Object.values(r.projected).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(5_500_000);
    expect(total).toBeLessThan(5_800_000);
    expect(expectedFinalValid()).toBeGreaterThan(5_600_000);
    expect(rollGrowth2026()).toBeGreaterThan(1.07);
    expect(r.turnoutRatio).toBeGreaterThan(1.1);
    expect(r.sectorTurnout!.arab).toBeGreaterThan(r.sectorTurnout!.jewish);
  });

  it("sizes the double envelopes from the expected vote and states the Reservists' lean", () => {
    expect(r.envelopes!.expected).toBeGreaterThan(540_000);
    expect(r.envelopes!.expected).toBeLessThan(700_000);
    expect(r.envelopes!.lean.res).toBeGreaterThan(1.3);
  });

  it("shrinks each list's swing by its own counted base", () => {
    expect(r.swingWeight!.likud).toBeGreaterThan(r.swingWeight!.raam);
    expect(r.swingWeight!.likud).toBeGreaterThan(r.swingWeight!.res);
  });

  it("gives 120 seats in a plausible band with bloc intervals and pass probabilities", () => {
    expect(Object.values(r.seats).reduce((a, b) => a + b, 0)).toBe(120);
    const b = blocSeats(r.seats);
    expect(b.net).toBeGreaterThanOrEqual(48);
    expect(b.net).toBeLessThanOrEqual(57);
    expect(b.opp).toBeGreaterThanOrEqual(46);
    expect(b.opp).toBeLessThanOrEqual(55);
    expect(b.arab).toBeGreaterThanOrEqual(15);
    expect(b.arab).toBeLessThanOrEqual(19);
    for (const id of ["net", "opp", "arab"]) {
      expect(r.blocIntervals![id].lo).toBeLessThanOrEqual(b[id]);
      expect(r.blocIntervals![id].hi).toBeGreaterThanOrEqual(b[id]);
      expect(r.blocIntervals![id].hi - r.blocIntervals![id].lo).toBeGreaterThan(0);
    }
    expect(r.passProbability!.likud).toBe(1);
    expect(r.passProbability!.res).toBeGreaterThan(0);
    expect(r.passProbability!.res).toBeLessThan(1);
    expect(r.passProbability!.noam).toBe(0);
  });

  it("is deterministic for a seed and only its intervals depend on the seed", () => {
    const a = countProjection({ raw, snapshot, draws: 100, seed: 7 })!, b = countProjection({ raw, snapshot, draws: 100, seed: 7 })!;
    expect(a).toEqual(b);
    const c = countProjection({ raw, snapshot, draws: 100, seed: 8 })!;
    expect(c.shares).toEqual(a.shares);
    expect(c.seats).toEqual(a.seats);
  });

  it("keeps the count projection fixed when only the exit-poll entries change", () => {
    const moved = { partySeats: snapshot.partySeats.map((p) => ({ ...p, seats: { ...p.seats, median: p.id === "likud" ? p.seats.median - 2 : p.id === "jl" ? p.seats.median + 2 : p.seats.median } })) };
    const m = countProjection({ raw, snapshot: moved, draws: 50 })!;
    expect(m.blend!.countShares).toEqual(r.blend!.countShares);
    expect(m.swing).toEqual(r.swing);
    expect(m.blend!.exitShares).not.toEqual(r.blend!.exitShares);
    expect(m.shares).not.toEqual(r.shares);
    expect(countProjection({ raw, snapshot: null, draws: 50 })!.shares).toEqual(r.blend!.countShares);
  });

  it("blends toward the count as coverage grows", () => {
    expect(blendWeight(0)).toBe(0);
    expect(blendWeight(0.2)).toBeCloseTo(0.556, 3);
    expect(blendWeight(0.6)).toBeCloseTo(0.882, 3);
    expect(blendWeight(1)).toBe(1);
    expect(r.blend!.weight).toBeCloseTo(blendWeight(r.coverage.votes), 6);
  });
});

describe("priors", () => {
  it("frozen prior sums to one and carries the stated sub-threshold shares", () => {
    const p = frozenPriorShares();
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(p.res).toBeCloseTo(0.029, 6);
    expect(p[OTHER]).toBeGreaterThan(0);
    expect(p.likud / p.yashar).toBeCloseTo(27 / 21, 6);
  });
  it("the live exit prior uses the same sub-threshold shares as the frozen prior", () => {
    expect(priorShares(snapshot).res).toBeCloseTo(frozenPriorShares().res, 6);
  });
  it("parses the counted-box roll of every expc row", () => {
    const o = parseLocalities(raw, results.letters);
    expect(o.localities.every((l) => (l.countedEligible ?? 0) > 0)).toBe(true);
    expect(o.localities.reduce((n, l) => n + l.valid, 0)).toBe(1_210_461);
  });
});
