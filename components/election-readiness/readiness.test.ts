import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { LANGS } from "@/lib/i18n";
import { NAV_GROUPS } from "@/lib/site";
import { readiness } from "@/lib/i18n/election-readiness";
import { ballotSeat, phaseNavGroups, readinessPhase } from "./model";
import UnprofiledLists from "./UnprofiledLists";

const context: SharedSeatContext = { schemaVersion: 1, election: "2026-10-27", revision: "a", snapshotRevision: "a", sequence: 1, updatedAt: "2026-10-28T00:00:00Z", evidenceStage: "official", basis: "official_seats", seatStatus: "official", pointMethod: "published_official_allocation", pointSeats: { likud: 60, newcomer: 60 }, parties: [{ id: "newcomer", label: "New list", profiled: false }], sourceRefs: [], publishedAt: null, observedAt: "2026-10-28T00:00:00Z", correctionOf: null, freshness: { status: "complete", checkedAt: null, lastAttemptAt: null }, reasonCodes: [] };

describe("current election readiness", () => {
  it("distinguishes estimates, counts, and official seats independently of close time", () => {
    expect(readinessPhase(null)).toBe("campaign");
    expect(readinessPhase(null, true)).toBe("exit");
    expect(readinessPhase({ ...context, evidenceStage: "counting", seatStatus: "provisional" })).toBe("counting");
    expect(readinessPhase(context)).toBe("official");
  });
  it("matches an unprofiled roster ID without guessing names, and distinguishes unknown from zero", () => {
    expect(ballotSeat(context, { id: "newcomer", profile: null })).toBe(60);
    expect(ballotSeat(context, { id: "other", profile: null })).toBeNull();
    expect(ballotSeat({ ...context, pointSeats: { newcomer: 0 } }, { id: "newcomer", profile: null })).toBe(0);
    expect(ballotSeat(context, { id: "unrelated", profile: "likud" })).toBe(60);
  });
  for (const lang of LANGS) it(`keeps ${lang} navigation destinations and unknown evidence explicit`, () => {
    const before = NAV_GROUPS.flatMap(g => g.items.map(n => n.href)).sort();
    for (const phase of ["campaign", "exit", "counting", "official"] as const) {
      const groups = phaseNavGroups(NAV_GROUPS, phase, lang);
      expect(groups.flatMap(g => g.items.map(n => n.href)).sort()).toEqual(before);
      if (phase !== "campaign") expect(groups[0].items[0].href).toBe(phase === "official" ? "/government" : "/results");
    }
    const html = renderToStaticMarkup(createElement(UnprofiledLists,{initial:context,knownIds:["likud"],lang}));
    expect(html).toContain("New list");
    expect(html).toContain("60");
    expect(html).toContain(readiness(lang).unknownPositions);
    expect(html).not.toContain("/parties/newcomer");
  });
});
