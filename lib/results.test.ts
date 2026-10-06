import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parties } from "./data";
import { allocate, parseExpc, results, resultsOpen, rollCounted, versusAverage } from "./results";
import { resultsConfig as config } from "./results-live";

// The committee's 2022 file (media25.bechirot.gov.il/files/expc.csv), final count.
const count2022 = parseExpc(readFileSync("lib/fixtures/cec-2022-expc.csv", "utf8"));

describe("CEC results", () => {
  it("parses the 2022 file to the official national totals", () => {
    expect(count2022.valid).toBe(4764742);
    expect(count2022.votes["מחל"]).toBe(1115336);
    expect(count2022.votes["פה"]).toBe(847435);
  });

  it("reproduces the 2022 Knesset", () => {
    // 2022 agreements: Likud–RZP, National Unity–Yesh Atid, Shas–UTJ, Labor–Meretz (Wikipedia).
    const agreements: [string, string][] = [["מחל", "ט"], ["כן", "פה"], ["שס", "ג"], ["אמת", "מרצ"]];
    const { seats } = allocate(count2022.votes, count2022.valid, 0.0325, agreements);
    expect(seats).toEqual({ "מחל": 32, "פה": 24, "ט": 14, "כן": 12, "שס": 11, "ג": 7, "ל": 6, "עם": 5, "ום": 5, "אמת": 4 });
  });

  it("drops an agreement when one side misses the threshold", () => {
    const a = allocate(count2022.votes, count2022.valid, 0.0325, [["אמת", "מרצ"]]);
    expect(a.agreements).toEqual([]);
    expect(a.passing).not.toContain("מרצ");
  });

  it("an agreement still fills exactly 120 seats", () => {
    const votes = { a: 51, b: 26, c: 23 };
    expect(allocate(votes, 100, 0, []).seats).toEqual({ a: 62, b: 31, c: 27 });
    const s = allocate(votes, 100, 0, [["b", "c"]]).seats;
    expect(s.a + s.b + s.c).toBe(120);
  });

  it("maps every 2026 ballot letter to a known party, once", () => {
    const ids = Object.values(config.letters);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(parties.map((p) => p.id)).toContain(id);
    for (const a of config.agreements) for (const id of a.parties) expect(ids).toContain(id);
  });

  it("keeps the test file hidden until polls close", () => {
    expect(resultsOpen(config, Date.parse("2026-10-27T21:59:00+02:00"))).toBe(false);
    expect(resultsOpen(config, Date.parse("2026-10-27T22:00:00+02:00"))).toBe(true);
  });

  it("labels lists the site doesn't track by their letters", () => {
    const r = results(count2022, config);
    expect(r.lists.reduce((s, l) => s + l.seats, 0)).toBe(120);
    expect(r.unknownLetters.length).toBeGreaterThan(0);
  });
});

describe("count beside the polling average", () => {
  const avg = { id: "average", results: { likud: { seats: 24.6 }, raam: { seats: 0, belowThreshold: true } } } as unknown as import("./types").Poll;
  it("subtracts the average from the count's seats and waits before the count", () => {
    const lists = [{ partyId: "likud", letters: "מחל", votes: 10, pct: 0.2, seats: 27 }];
    expect(versusAverage(["likud", "raam", "noam"], avg, lists)).toEqual([
      { partyId: "likud", seats: 27, avg: 24.6, diff: 2.4 },
      { partyId: "raam", seats: 0, avg: 0, diff: 0 },
      { partyId: "noam", seats: 0, avg: null, diff: null },
    ]);
    expect(versusAverage(["likud"], avg, null)).toEqual([{ partyId: "likud", seats: null, avg: 24.6, diff: null }]);
  });
  it("shares the roll counted only once the roll is published", () => {
    expect(rollCounted(count2022, undefined)).toBeNull();
    expect(rollCounted(null, { eligible: 1 })).toBeNull();
    expect(rollCounted(count2022, { eligible: 6788804 })).toBeCloseTo(count2022.eligible / 6788804);
    expect(rollCounted(count2022, { eligible: 1 })).toBe(1);
  });
});
