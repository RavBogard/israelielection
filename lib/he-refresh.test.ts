import { describe, expect, it } from "vitest";
import { heField, overlayProblems, srcHash } from "./i18n/localize";
import { applyRefresh, refreshTargets } from "./he-refresh";

const overlay = { shas: { leader: heField("Aryeh Deri", "אריה דרעי"), status: heField("Running.", "רצה."), "pledges.0.text": heField("Old pledge.", "הבטחה ישנה.") } };
const parties = [{ id: "shas", leader: "Aryeh Deri", status: "Running with 2 lists.", pledges: [{ text: "Old pledge." }, { text: "A new pledge." }] }];

describe("refreshTargets", () => {
  it("finds Hebrew whose English changed and new pledges without Hebrew", () => {
    expect(refreshTargets(parties, overlay)).toEqual([
      { id: "shas", field: "status", english: "Running with 2 lists.", previous: "רצה." },
      { id: "shas", field: "pledges.1.text", english: "A new pledge." },
    ]);
  });
});

describe("applyRefresh", () => {
  const targets = refreshTargets(parties, overlay);

  it("writes checked lines as machine Hebrew and leaves no stale field", () => {
    const r = applyRefresh(overlay, targets, { items: [{ n: 1, text: "רצה ב-2 רשימות." }, { n: 2, text: "הבטחה חדשה." }] });
    expect(r.overlay.shas.status).toEqual({ text: "רצה ב-2 רשימות.", src: srcHash("Running with 2 lists."), machine: true });
    expect(r.written).toHaveLength(2);
    expect(overlayProblems(parties, r.overlay)).toEqual([]);
  });

  it("drops a line that fails (wrong number, missing) so the page falls back to English", () => {
    const r = applyRefresh(overlay, targets, { items: [{ n: 1, text: "רצה ב-3 רשימות." }] });
    expect(r.overlay.shas.status).toBeUndefined();
    expect(r.overlay.shas["pledges.1.text"]).toBeUndefined();
    expect(r.dropped.map((d) => d.reason)).toEqual(["numbers differ", "empty"]);
    expect(overlayProblems(parties, r.overlay)).toEqual([]);
  });
});
