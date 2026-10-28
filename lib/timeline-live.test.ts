import { describe, expect, it } from "vitest";
import { applyLiveElection } from "./timeline-live";
import type { Timeline } from "./timeline";
import { beforeVoteNote } from "./i18n/reference";
import { LANGS } from "./i18n";

const src = { name: "x", date: "", url: "https://x.test" };
const data: Timeline = {
  checked: "2026-10-28",
  governments: [],
  events: [],
  elections: [
    { date: "2022-11-01", knesset: 25, first: { list: "Likud", seats: 32 }, second: { list: "Yesh Atid", seats: 24 }, outcome: "A coalition was formed.", source: src },
    { date: "2026-10-27", knesset: 26, status: "counting", outcome: "Count in progress.", source: src },
  ],
};

describe("a counting election row", () => {
  it("is filled from the live figures, and only that row", () => {
    const live = { first: { list: "Likud", seats: 27 }, second: { list: "Yashar", seats: 21 }, turnout: 66.1, asOf: "2026-10-28", source: { ...src, name: "count" } };
    const out = applyLiveElection(data, live);
    expect(out.elections[0]).toEqual(data.elections[0]);
    expect(out.elections[1]).toMatchObject({ status: "counting", first: live.first, second: live.second, turnout: 66.1, asOf: "2026-10-28" });
  });
  it("stays figure-free with no live count, so the file stores none", () => {
    expect(applyLiveElection(data, null)).toBe(data);
    expect(data.elections[1].first).toBeUndefined();
  });
});

describe("the written-before-the-vote note", () => {
  it("exists in every edition", () => {
    for (const lang of LANGS) {
      const n = beforeVoteNote(lang);
      expect(n.lead.length).toBeGreaterThan(5);
      expect(n.link.length).toBeGreaterThan(1);
    }
  });
});
