import { describe, expect, it } from "vitest";
import type { CountSummary } from "@/app/api/count/route";
import { averageMeter, clip, firstExit, navFacts, nightMeter } from "./nav-facts";
import type { Party, Poll } from "./types";

const seats = { net: 54.64, opp: 48.8, mid: 4.1, arab: 12.5 };
const open = (phase: "early" | "count", freshness: "fresh" | "stale" = "fresh") => ({ state: "open", phase, freshness, fetchedAt: "", attemptedAt: "", sourceUpdatedAt: null, valid: 1, localities: 1, turnout: null, envelopes: null, blocs: [{ id: "net", label: "", seats: 58 }, { id: "opp", label: "", seats: 50 }, { id: "mid", label: "", seats: 2 }, { id: "arab", label: "", seats: 10 }] }) as CountSummary;

describe("menu facts", () => {
  it("keeps only the facts that change: the newest poll and briefing dates", () => {
    expect(navFacts({ newestPoll: "2026-10-06", newestBriefing: "2026-10-05" })).toEqual({ polls: "Poll Oct 6, briefing Oct 5" });
    expect(navFacts({})).toEqual({});
    expect(navFacts({ newestBriefing: "2026-10-05" })).toEqual({ polls: "Briefing Oct 5" });
  });
  it("clips captions at a word", () => {
    expect(clip("short", 10)).toBe("short");
    expect(clip("The High Court rejected a petition", 20)).toBe("The High Court…");
  });
});

describe("masthead seat meter", () => {
  it("reads the average, dated, until polls close", () => {
    expect(averageMeter(seats, "2026-10-05")).toMatchObject({ href: "/polls", value: "54.6", text: "Netanyahu bloc, average Oct 5" });
    expect(nightMeter(false, open("count"), null)).toBeNull();
  });
  it("follows the night in the strip's words: closed, exit poll, early count, count, stale", () => {
    const exit = { pollster: "Kan 11", seats: { net: 59, opp: 49, mid: 2, arab: 10 } };
    expect(nightMeter(true, null, null)).toMatchObject({ href: "/results", value: null, text: "Polls have closed", seats: null });
    expect(nightMeter(true, { state: "error", phase: "exit" }, exit)).toMatchObject({ value: "59", text: "Netanyahu bloc, Kan 11 exit poll" });
    expect(nightMeter(true, open("early"), exit)).toMatchObject({ value: "58", text: "Netanyahu bloc, early count", hatch: true });
    expect(nightMeter(true, open("count"), exit)).toMatchObject({ value: "58", text: "Netanyahu bloc, count so far", hatch: false });
    expect(nightMeter(true, open("count", "stale"), exit)?.text).toBe("Netanyahu bloc, saved count (stale)");
  });
  it("takes the first channel with an exit poll", () => {
    const ps = [{ id: "a", bloc: "net" }, { id: "b", bloc: "opp" }] as Party[];
    const exit = (pollster: string, a: number): Poll => ({ id: pollster, pollster, kind: "exit", firm: null, fieldwork: null, published: "2026-10-27", via: null, url: null, n: null, margin: null, note: null, results: { a: { seats: a }, b: { seats: 120 - a } }, combined: [] });
    expect(firstExit([], ps)).toBeNull();
    expect(firstExit([exit("Channel 13", 60), exit("Channel 12", 58)], ps)).toEqual({ pollster: "Channel 12", seats: { net: 58, opp: 62, mid: 0, arab: 0 } });
  });
});
