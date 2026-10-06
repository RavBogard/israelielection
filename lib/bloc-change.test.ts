import { describe, expect, it } from "vitest";
import { averagePoll, blocs, parties, pollsData } from "./data";
import { blocChange, blocSeries, newestPoll, signedSeats, sparkPath, sparkRange, type BlocPoint } from "./bloc-change";
import { homeRaceModel } from "./home-race";
import type { Poll } from "./types";

const pt = (date: string, net: number, opp = 0): BlocPoint => ({ date, seats: { net, opp, mid: 0, arab: 0 } });

describe("bloc change since a real poll date", () => {
  it("ends on exactly the figures the home race shows", () => {
    const series = blocSeries(pollsData.polls, parties, pollsData.config), last = series.at(-1)!;
    for (const row of homeRaceModel(averagePoll, parties, blocs).rows) expect(last.seats[row.id]).toBe(row.seats);
    expect(last.date).toBe(averagePoll.published);
  });
  it("compares with the last poll date on or before seven days earlier", () => {
    const c = blocChange([pt("2026-09-20", 50), pt("2026-09-28", 52, 3), pt("2026-09-30", 53), pt("2026-10-05", 52.8, 4.1)])!;
    expect(c.since).toBe("2026-09-28");
    expect(c.points.map((p) => p.date)).toEqual(["2026-09-28", "2026-09-30", "2026-10-05"]);
    expect(c.delta.net).toBe(0.8);
    expect(c.delta.opp).toBe(1.1);
    expect(c.delta.mid).toBe(0);
  });
  it("says nothing when the series is shorter than the window", () => {
    expect(blocChange([pt("2026-10-01", 50), pt("2026-10-05", 52)])).toBeNull();
    expect(blocChange([])).toBeNull();
  });
  it("signs with a true minus and names no change", () => {
    expect(signedSeats(0.8)).toBe("+0.8");
    expect(signedSeats(-1.2)).toBe("−1.2");
    expect(signedSeats(0)).toBe("No change");
  });
  it("skips exit polls for the newest poll", () => {
    const a = { id: "a", pollster: "A", published: "2026-10-05", kind: undefined } as unknown as Poll;
    const exit = { id: "x", pollster: "X", published: "2026-10-27", kind: "exit" } as unknown as Poll;
    expect(newestPoll([a, exit])?.id).toBe("a");
    expect(newestPoll([])).toBeNull();
  });
  it("draws a shared-scale sparkline across the window", () => {
    const pts = [pt("2026-09-28", 52, 40), pt("2026-10-05", 54, 40)];
    expect(sparkRange(pts)).toBe(2);
    expect(sparkPath(pts, "net", 50, 10, 2)).toBe("M0.0,10.0L50.0,0.0");
    expect(sparkPath(pts, "opp", 50, 10, 2)).toBe("M0.0,5.0L50.0,5.0");
    expect(sparkPath(pts.slice(0, 1), "net", 50, 10, 2)).toBe("");
  });
});
