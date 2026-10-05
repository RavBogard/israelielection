import { describe, expect, it } from "vitest";
import { partiesData, parties } from "./data";
import type { NewsItem } from "./news";
import { applyProposals, checkProposals, needsReview, proposalKey } from "./proposals";

const items: NewsItem[] = [
  { outlet: "Times of Israel", title: "Gantz pulls Blue and White out of the race, endorses Eisenkot's Yashar", url: "https://www.timesofisrael.com/a", published: "2026-10-20T08:00:00.000Z", summary: "Blue and White leader says he will not split the vote" },
  { outlet: "Haaretz", title: "Shas and UTJ sign surplus-vote agreement", url: "https://www.haaretz.com/b", published: "2026-10-12T19:03:43.000Z", summary: "The two Haredi parties finalize the deal" },
  { outlet: "Jerusalem Post", title: "Gas prices to drop in November", url: "https://www.jpost.com/c", published: "2026-10-12T16:46:00.000Z", summary: "" },
];

describe("party proposals", () => {
  it("keeps grounded proposals and cites them in the register's style", () => {
    const { kept, dropped } = checkProposals({ proposals: [
      { party: "bw", field: "status", text: "Withdrew from the race Oct 20; endorsed Yashar!", sources: [1], why: "Gantz pulled out." },
      { party: "shas", field: "surplusPartner", text: "UTJ (signed Oct 12).", sources: [2], why: "Agreement signed." },
    ] }, items, parties);
    expect(dropped).toEqual([]);
    expect(kept.map((k) => k.source)).toEqual(["Times of Israel, Oct 20, 2026", "Haaretz, Oct 12, 2026"]);
  });

  it("drops proposals whose headline doesn't name the party, or that cite nothing real", () => {
    const { kept, dropped } = checkProposals({ proposals: [
      { party: "likud", field: "status", text: "Prices will drop in November", sources: [3], why: "" },
      { party: "bw", field: "status", text: "Withdrew from the race", sources: [9], why: "" },
      { party: "nope", field: "status", text: "x", sources: [1], why: "" },
      { party: "bw", field: "status", text: "See [link](https://x.y)", sources: [1], why: "" },
    ] }, items, parties);
    expect(kept).toEqual([]);
    expect(dropped.map((d) => d.reason)).toEqual(["cited headlines don't name Likud", "cites no valid headline", "unknown party nope", "empty, markup or link"]);
  });

  it("applies to a copy of the register and leaves the original alone", () => {
    const { kept } = checkProposals({ proposals: [
      { party: "shas", field: "surplusPartner", text: "UTJ (signed Oct 12).", sources: [2], why: "" },
    ] }, items, parties);
    const before = JSON.stringify(partiesData);
    const next = applyProposals(partiesData, kept, "2026-10-12");
    expect(JSON.stringify(partiesData)).toBe(before);
    const shas = next.parties.find((p) => p.id === "shas")!;
    expect(shas.surplusPartner).toEqual({ text: "UTJ (signed Oct 12).", source: "Haaretz, Oct 12, 2026" });
    expect(shas.surplusLine).toBe("Surplus: UTJ (signed Oct 12)");
    expect(proposalKey(kept[0])).toBe("shas|surplusPartner|utj signed oct 12");
  });

  it("sends a one-outlet leader or status change to review, merges the rest", () => {
    const { kept } = checkProposals({ proposals: [
      { party: "bw", field: "status", text: "Withdrew from the race Oct 20; endorsed Yashar!", sources: [1], why: "" },
      { party: "shas", field: "surplusPartner", text: "UTJ (signed Oct 12).", sources: [2], why: "" },
    ] }, items, parties);
    expect(kept.map(needsReview)).toEqual([true, false]);
    const twoOutlets = { ...kept[0], items: [kept[0].items[0], { ...kept[0].items[0], outlet: "Haaretz" }] };
    expect(needsReview(twoOutlets)).toBe(false);
  });
});
