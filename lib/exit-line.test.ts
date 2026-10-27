import { describe, expect, it } from "vitest";
import { exitBlocLine, rangeText } from "./exit-line";
import { exitPolls, parties, pollsData } from "./data";
import type { Poll } from "./types";

const excluded = pollsData.config.withoutVariant.pollsters;
const row = (pollster: string, at: string, seats: Record<string, number>): Poll => ({ id: `${pollster}-${at}`, pollster, firm: null, fieldwork: "", published: "2026-10-27", via: "", url: "", n: null, margin: null, note: "", results: Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, { seats: v }])), combined: [], kind: "exit", broadcastAt: at } as Poll);

describe("exitBlocLine", () => {
  it("ranges across the three channels' latest versions and drops Channel 14", () => {
    const polls = [row("Channel 12", "2026-10-27T22:00:00+02:00", { likud: 30 }), row("Channel 12", "2026-10-27T23:00:00+02:00", { likud: 32 }), row("Kan 11", "2026-10-27T22:00:00+02:00", { likud: 28 }), row("Channel 14", "2026-10-27T22:00:00+02:00", { likud: 60 })];
    const line = exitBlocLine(polls, parties, excluded)!;
    const net = line.ranges.find((r) => r.bloc === "net")!;
    expect([net.min, net.max]).toEqual([28, 32]);
    expect(line.sources.map((s) => s.pollster)).not.toContain("Channel 14");
    expect(rangeText(net)).toBe("28–32");
  });
  it("is null without exit polls and uses the repo's rows", () => {
    expect(exitBlocLine([], parties, excluded)).toBeNull();
    expect(exitBlocLine(exitPolls, parties, excluded)?.ranges.length).toBeGreaterThanOrEqual(3);
  });
});
