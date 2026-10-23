import { describe, expect, it } from "vitest";
import { forecast, forecastPoll } from "./forecast";
import { blocTotals, pollTotal } from "./polls";
import { parties, pollsData } from "./data";

describe("data/forecast.json", () => {
  it("is a 120-seat allocation over the profiled lists", () => {
    expect(pollTotal(forecastPoll)).toBe(120);
    for (const id of Object.keys(forecast.lists)) expect(parties.some((p) => p.id === id)).toBe(true);
    const t = blocTotals(forecastPoll, parties);
    for (const b of ["net", "opp", "mid", "arab"] as const) expect(t[b]).toBe(forecast.blocs[b].point);
  });
  it("states probabilities that add up and ranges that hold the point", () => {
    expect(forecast.majority.net + forecast.majority.oppZionist + forecast.majority.neither).toBe(100);
    for (const [, b] of Object.entries(forecast.blocs)) { expect(b.lo).toBeLessThanOrEqual(b.point); expect(b.hi).toBeGreaterThanOrEqual(b.point); }
    for (const [, l] of Object.entries(forecast.lists)) { expect(l.passes).toBeGreaterThanOrEqual(0); expect(l.passes).toBeLessThanOrEqual(100); expect(l.lo).toBeLessThanOrEqual(l.hi); }
  });
  it("was run on polls the site knows, without the firms the lean stands for", () => {
    for (const p of forecast.inputs.field) {
      expect(pollsData.polls.some((q) => q.id === p.id)).toBe(true);
      expect(pollsData.config.withoutVariant.pollsters).not.toContain(p.pollster);
    }
    expect(forecast.parameters.fieldOnly).toBe(true);
    expect(forecast.generated <= forecast.election).toBe(true);
  });
  it("is the last entry of the record", async () => {
    const history = (await import("@/data/forecast-history.json")).default as { runs: { generated: string; blocs: Record<string, number>; final: boolean }[] };
    const last = history.runs.at(-1)!;
    expect(last.generated).toBe(forecast.generated);
    expect(last.blocs.net).toBe(forecast.blocs.net.point);
    expect(history.runs.filter((r) => r.final).length).toBeLessThanOrEqual(1);
  });
});
