import { describe, expect, it } from "vitest";
import { averagePoll, parties, pledgeRules } from "./data";
import { minimalWinning, pathsTo61, supportPaths, unitsOf } from "./paths-to-61";
import { pledgeConflicts, supportedPledgeConflicts } from "./coalition";
import type { Poll } from "./types";

const poll = (results: Poll["results"], combined: Poll["combined"] = []): Poll =>
  ({ ...averagePoll, id: "t", results, combined }) as Poll;

describe("unitsOf", () => {
  it("leaves out lists under the threshold or unreported, and keeps a combined group as one unit", () => {
    const p = poll({ likud: { seats: 30 }, bw: { seats: 0, belowThreshold: true }, res: { seats: 0 } }, [{ parties: ["shas", "utj"], seats: 14, note: "" }]);
    expect(unitsOf(p, parties)).toEqual([{ ids: ["likud"], seats: 30 }, { ids: ["shas", "utj"], seats: 14 }]);
  });
});

describe("minimalWinning", () => {
  const u = (id: string, seats: number) => ({ ids: [id], seats });
  it("keeps only combinations where every member is needed for 61", () => {
    const out = minimalWinning([u("a", 40), u("b", 30), u("c", 25), u("d", 6)]);
    const keys = out.map((x) => x.units.map((y) => y.ids[0]).join(""));
    expect(keys).toEqual(["ab", "ac", "bcd"]);
    expect(keys).not.toContain("abc");
  });
  it("orders by fewest lists, then most seats, then data order, the same every time", () => {
    const units = [u("a", 31), u("b", 30), u("c", 31), u("d", 30)];
    const once = minimalWinning(units).map((x) => x.units.map((y) => y.ids[0]).join(""));
    expect(once).toEqual(["ac", "ab", "ad", "bc", "cd"]);
    expect(minimalWinning(units).map((x) => x.units.map((y) => y.ids[0]).join(""))).toEqual(once);
  });
  it("rounds fractional averages so 60.99999 counts as 61", () => {
    expect(minimalWinning([u("a", 30.7), u("b", 30.3)]).length).toBe(1);
  });
});

describe("pathsTo61 on the polling average", () => {
  const paths = pathsTo61(averagePoll, parties, pledgeRules);
  it("never includes a list below the threshold", () => {
    const below = parties.filter((p) => { const r = averagePoll.results[p.id]; return !r || r.belowThreshold || r.seats === 0; }).map((p) => p.id);
    expect(paths.every((p) => p.ids.every((id) => !below.includes(id)))).toBe(true);
  });
  it("reaches 61 in every path and falls short without any one member", () => {
    for (const p of paths) {
      expect(p.seats).toBeGreaterThanOrEqual(61);
      for (const id of p.ids) expect(Math.round((p.seats - averagePoll.results[id].seats) * 10) / 10).toBeLessThan(61);
    }
  });
  it("counts pledge conflicts from the declarative rules only", () => {
    for (const p of paths.slice(0, 50)) expect(p.conflicts.map((c) => c.warning.id)).toEqual(pledgeConflicts(new Set(p.ids), parties, pledgeRules).map((c) => c.warning.id));
    const jl = paths.find((p) => p.ids.includes("jl") && p.ids.includes("likud"))!;
    expect(jl.conflicts.map((c) => c.warning.id)).toContain("joint-list-no-netanyahu");
    expect(jl.conflictIds).toEqual(expect.arrayContaining(["jl", "likud"]));
  });
  it("puts every path clear of recorded pledges first, then fewest lists, then most seats, in each group", () => {
    const firstHit = paths.findIndex((p) => p.conflicts.length);
    if (firstHit >= 0) expect(paths.slice(firstHit).every((p) => p.conflicts.length)).toBe(true);
    const size = (p: { ids: string[] }) => p.ids.length;
    for (const group of [paths.filter((p) => !p.conflicts.length), paths.filter((p) => p.conflicts.length)])
      for (let i = 1; i < group.length; i++) {
        const a = group[i - 1], b = group[i];
        expect(size(a) < size(b) || (size(a) === size(b) && a.seats >= b.seats)).toBe(true);
      }
  });
  it("orders a clear path ahead of a smaller one with a conflict", () => {
    const p = poll({ likud: { seats: 40 }, byachad: { seats: 25 }, yashar: { seats: 20 }, dem: { seats: 20 }, yb: { seats: 15 } });
    const keys = pathsTo61(p, parties, pledgeRules).map((x) => x.ids.join("+"));
    expect(keys[0]).toBe("yashar+byachad+dem");
    expect(keys.indexOf("likud+byachad")).toBeGreaterThan(keys.indexOf("yashar+byachad+dem"));
  });
  it("flags the opposition lists' recorded refusals of a Netanyahu-led cabinet", () => {
    const top = paths.find((p) => p.ids.join() === "likud,yashar,byachad,dem")!;
    expect(top.conflicts.map((c) => c.warning.id)).toEqual(expect.arrayContaining(["yashar-no-netanyahu", "byachad-no-netanyahu", "dem-no-likud-rz-otzma"]));
  });
  it("outside-support paths clear every pledge, outside support included, and keep the same seats for", () => {
    const helped = supportPaths(paths, parties, pledgeRules, averagePoll);
    for (const s of helped) {
      expect(supportedPledgeConflicts(new Set(s.cabinet), new Set(s.support), parties, pledgeRules)).toEqual([]);
      expect(Math.round((s.cabinetSeats + s.supportSeats) * 10) / 10).toBe(s.seats);
    }
    expect(helped.some((s) => s.cabinet.includes("likud") && s.support.includes("jl"))).toBe(false);
  });
});
