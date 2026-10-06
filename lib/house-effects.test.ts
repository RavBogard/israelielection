import { describe, expect, it } from "vitest";
import { houseEffects } from "./house-effects";
import { blocTrend, scaledTrends } from "./trend";
import { allPolls, averagePoll, parties, pollsData } from "./data";
import { blocTotals } from "./polls";
import type { Party, Poll, PollsConfig } from "./types";

const ps = [{ id: "a", bloc: "net" }, { id: "b", bloc: "opp" }] as Party[];
const cfg = { ...pollsData.config, currentWindowDays: 14 } as PollsConfig;
const poll = (id: string, pollster: string, published: string, a: number, extra: Partial<Poll> = {}): Poll => ({ id, pollster, firm: null, published, fieldwork: null, via: null, url: null, n: 400, margin: null, note: null, results: { a: { seats: a }, b: { seats: 120 - a } }, combined: [], ...extra });

describe("bloc trend", () => {
  it("gives the scaled average and the range of current polls on each date", () => {
    const t = blocTrend([poll("1", "X", "2026-09-01", 60), poll("2", "Y", "2026-09-01", 50), poll("3", "X", "2026-09-05", 64)], ps, cfg);
    expect(t.map((p) => p.date)).toEqual(["2026-09-01", "2026-09-05"]);
    expect(t[0].avg.net).toBe(55);
    expect([t[1].lo.net, t[1].hi.net, t[1].n]).toEqual([50, 64, 2]);
  });
  it("leaves exit polls out", () => {
    expect(blocTrend([poll("1", "X", "2026-09-01", 60), poll("e", "X", "2026-09-02", 40, { kind: "exit" })], ps, cfg)).toHaveLength(1);
  });
});

describe("house effects", () => {
  it("averages each poll's gap from the site average on its date", () => {
    const h = houseEffects([poll("1", "X", "2026-09-01", 60), poll("2", "Y", "2026-09-01", 50), poll("3", "X", "2026-09-05", 64)], ps, cfg);
    const x = h.find((r) => r.pollster === "X")!;
    // Sep 1: average 55, X +5. Sep 5: X 64 and Y 50 average 57, X +7.
    expect(x.n).toBe(2);
    expect(x.gap.net).toBe(6);
    expect(x.gap.opp).toBe(-6);
    expect(h[0].pollster).toBe("X");
    expect(h.find((r) => r.pollster === "Y")!.gap.net).toBe(-5);
  });
  it("covers every campaign pollster in the real data and each gap traces to a poll", () => {
    const h = houseEffects(allPolls, parties, pollsData.config);
    expect(h.reduce((n, r) => n + r.n, 0)).toBe(allPolls.filter((p) => p.kind !== "exit").length);
    const trend = new Map(blocTrend(allPolls, parties, pollsData.config).map((t) => [t.date, t.avg]));
    for (const r of h) for (const { poll: p, gap } of r.polls) expect(gap.net).toBeCloseTo(blocTotals(p, parties).net - trend.get(p.published)!.net, 6);
  });
});

describe("scaled trends", () => {
  it("ends on the site average every page prints, below as 0", () => {
    const ids = parties.map((p) => p.id);
    const t = scaledTrends(allPolls, ids, pollsData.config);
    for (const id of ids) {
      const r = averagePoll.results[id];
      const last = t.get(id)!.at(-1);
      if (!r) continue;
      expect(last?.avg).toBe(r.belowThreshold ? 0 : r.seats);
    }
  });
  it("leaves exit polls out and has a point per campaign date", () => {
    const t = scaledTrends([poll("1", "X", "2026-09-01", 60), poll("e", "X", "2026-09-02", 40, { kind: "exit" })], ["a", "b"], cfg);
    expect(t.get("a")).toEqual([{ date: "2026-09-01", avg: 60, n: 1 }]);
  });
});
