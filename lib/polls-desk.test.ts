import { describe, expect, it } from "vitest";
import { averageFinding, citeText, counterText, initialTab, leaderFinding, leanFinding, majorityCounts, moverFinding, raceFinding, spreadFinding, variantFinding } from "./polls-desk";
import { allPolls, averagePoll, mainPolls, parties, pollsData } from "./data";
import { houseEffects } from "./house-effects";
import { blocTotals } from "./polls";
import { blocTrend } from "./trend";
import type { HouseEffect } from "./house-effects";
import type { Party, Poll } from "./types";

const ps = [{ id: "a", name: "A", bloc: "net" }, { id: "b", name: "B", bloc: "opp" }, { id: "c", name: "C", bloc: "mid" }] as Party[];
const poll = (id: string, a: number, b: number, c = 120 - a - b): Poll => ({ id, pollster: id, firm: null, published: "2026-10-01", fieldwork: null, via: null, url: null, n: 500, margin: null, note: null, results: { a: { seats: a }, b: { seats: b }, c: { seats: c } }, combined: [] });
const pt = (date: string, net: number, opp: number) => ({ date, avg: { net, opp, mid: 0, arab: 0 } });
const he = (pollster: string, n: number, net: number) => ({ pollster, n, gap: { net, opp: -net }, polls: [] }) as HouseEffect;

describe("polls desk findings", () => {
  it("says whether either bloc reaches 61", () => {
    expect(averageFinding({ net: 54.6, opp: 48 })).toBe("Neither bloc reaches 61 in the average.");
    expect(averageFinding({ net: 61, opp: 50 })).toBe("The Netanyahu bloc reaches 61 in the average.");
    expect(averageFinding({ net: 40, opp: 62.3 })).toBe("The Anti-Netanyahu bloc reaches 61 in the average.");
  });
  it("counts the polls at 61 or more", () => {
    const c = majorityCounts([poll("1", 62, 40), poll("2", 55, 50), poll("3", 50, 62, 8)], ps);
    expect(c).toEqual({ net: 1, opp: 1, n: 3 });
    expect(counterText(c)).toBe("61 or more: Netanyahu bloc 1 of 3 polls, Anti-Netanyahu bloc 1 of 3");
  });
  it("names the race leader or counts lead changes, ignoring level dates", () => {
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-10", 54, 50)])).toBe("The Netanyahu bloc has led the average on every date since Sep 6");
    expect(raceFinding([pt("2026-09-06", 50, 55)])).toBe("The Anti-Netanyahu bloc has led the average on every date since Sep 6");
    expect(raceFinding([pt("2026-09-06", 55, 50), pt("2026-09-07", 50, 50), pt("2026-09-08", 49, 50), pt("2026-09-09", 52, 50)])).toBe("The lead has changed hands twice since Sep 6");
    expect(raceFinding([])).toBe("The bloc race");
  });
  it("leads outright only when strictly ahead", () => {
    const avg = poll("avg", 30, 25, 20);
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 30, 20, 20)], ps)).toBe("A leads in all 2 current polls");
    expect(leaderFinding(avg, [poll("1", 30, 25, 20), poll("2", 25, 25, 20)], ps)).toBe("A is largest in the average, ahead outright in 1 of 2 current polls");
  });
  it("reports the largest move only when it is a seat or more", () => {
    const t = (a: number, b: number) => [{ date: "2026-09-06", avg: a, n: 1 }, { date: "2026-10-05", avg: b, n: 1 }];
    expect(moverFinding(new Map([["a", t(20, 23.2)], ["b", t(10, 6)]]), { a: "A", b: "B" }, "2026-09-06")).toBe("The largest move: B, −4.0 seats since Sep 6");
    expect(moverFinding(new Map([["a", t(20, 20.5)]]), { a: "A" }, "2026-09-06")).toBe("No list has moved a full seat in the average since Sep 6");
  });
  it("names the pollster that leans furthest among those with enough polls", () => {
    expect(leanFinding([he("X", 5, 2.1), he("Y", 2, 6), he("Z", 4, -3.4)])).toBe("Z shows the Netanyahu bloc 3.4 seats below the average");
    expect(leanFinding([he("Y", 2, 6)])).toBe("How each pollster leans");
  });
  it("states the bloc spread and the alternative average", () => {
    expect(spreadFinding([poll("1", 62, 40), poll("2", 55, 50)], ps)).toBe("Across the 2 current polls the Netanyahu bloc runs 55 to 62, the Anti-Netanyahu bloc 40 to 50");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 52.1, opp: 49 }, ["P", "Q"])).toBe("Without P and Q the Netanyahu bloc has 52.1, 2.5 fewer");
    expect(variantFinding({ net: 54.6, opp: 48 }, { net: 54.6, opp: 49 }, ["P"])).toBe("Leaving out P does not move the Netanyahu bloc");
  });
  it("cites the average with its date", () => {
    expect(citeText({ net: 54.64, opp: 48 }, 7, "2026-10-05")).toBe("Israel Votes 2026, polling average of 7 current polls as of October 5, 2026: Netanyahu bloc 54.6, Anti-Netanyahu bloc 48.0 of 120 seats. https://www.israelielection.org/polls");
  });
  it("opens the tab a link names, else the tool its query belongs to", () => {
    expect(initialTab("", "")).toBe("parties");
    expect(initialTab("?tab=method", "#pollsters")).toBe("method");
    expect(initialTab("", "#every-poll")).toBe("every-poll");
    expect(initialTab("?pollster=Maariv", "#browser")).toBe("every-poll");
    expect(initialTab("?with=likud&window=7", "#sensitivity")).toBe("method");
    expect(initialTab("?tab=nope", "")).toBe("parties");
  });
  it("reads the real data without throwing and agrees with the counts it states", () => {
    const avg = blocTotals(averagePoll, parties), c = majorityCounts(mainPolls, parties);
    expect(averageFinding(avg)).toMatch(/61 in the average\.$/);
    expect(c.n).toBe(mainPolls.length);
    expect(raceFinding(blocTrend(allPolls, parties, pollsData.config))).toMatch(/since/);
    expect(leanFinding(houseEffects(allPolls, parties, pollsData.config)).length).toBeGreaterThan(10);
  });
});
