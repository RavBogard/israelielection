import { describe, expect, it } from "vitest";
import history2022 from "../../public/vote-map/2022.json";
import type { VoteMapElection } from "../votemap";
import { priorShares } from "./count-estimate";
import { countNowcast, OTHER, parseBoxes, parseLocalities, type CountObservation } from "./count-nowcast";

const h = history2022 as VoteMapElection;
// Replay 2022 against itself: each 2022 list is its own "party" with an identity profile.
const ids = h.lists.map((l) => l.letters);
const profileMap = Object.fromEntries(ids.map((l) => [l, [l]]));
const truthVotes = Object.fromEntries(h.lists.map((l) => [l.letters, l.votes]));
const truth = Object.fromEntries(ids.map((id) => [id, truthVotes[id] / h.national.valid]));
const otherTruth = 1 - Object.values(truth).reduce((a, b) => a + b, 0);
// An exit-style prior that is off by 2 points on the two largest lists.
const prior = { ...truth, [OTHER]: otherTruth, "מחל": truth["מחל"] + 0.02, "פה": truth["פה"] - 0.02 };
const agreements: [string, string][] = [];
const error = (shares: Record<string, number>) => ids.reduce((n, id) => n + Math.abs((shares[id] ?? 0) - truth[id]), 0);

/** Reveal whole 2022 localities in the given order until `share` of local valid votes is counted. */
function reveal(order: number[][], share: number, envelopes = false): CountObservation {
  const total = h.rows.reduce((n, r) => n + r[3], 0);
  const localities: CountObservation["localities"] = [];
  let counted = 0;
  for (const r of order) {
    if (counted >= share * total) break;
    const votes: Record<string, number> = Object.fromEntries(ids.map((id, k) => [id, r[4 + k]]));
    votes[OTHER] = r[3] - ids.reduce((n, _, k) => n + r[4 + k], 0);
    localities.push({ code: r[0], valid: r[3], votes });
    counted += r[3];
  }
  const env = Object.fromEntries(ids.map((id, k) => [id, h.envelopes.votes[k]]));
  return { localities, envelope: envelopes ? { valid: h.envelopes.valid, votes: { ...env, [OTHER]: h.envelopes.other } } : { valid: 0, votes: {} }, source: "expc" };
}
const run = (observation: CountObservation) =>
  countNowcast({ history: h, prior, observation, threshold: 0.0325, agreements, profileMap, draws: 50 });

describe("countNowcast on a 2022 replay", () => {
  const byLikud = [...h.rows].sort((a, b) => b[4] / b[3] - a[4] / a[3]); // most Likud first: worst-case order
  const smallFirst = [...h.rows].sort((a, b) => a[3] - b[3]);

  it("keeps the prior below the coverage floor", () => {
    const r = run(reveal(smallFirst, 0.01));
    expect(r.mode).toBe("prior");
    expect(Object.values(r.swing).every((s) => s === 1)).toBe(true);
  });

  it("beats both the prior and the raw partial tally when the most Likud places report first", () => {
    const obs = reveal(byLikud, 0.3);
    const r = run(obs);
    expect(r.mode).toBe("count");
    const tallyValid = obs.localities.reduce((n, o) => n + o.valid, 0);
    const tally = Object.fromEntries(ids.map((id) => [id, obs.localities.reduce((n, o) => n + (o.votes[id] ?? 0), 0) / tallyValid]));
    expect(error(r.shares)).toBeLessThan(error(prior));
    expect(error(r.shares)).toBeLessThan(error(tally) / 3);
  });

  it("corrects the prior's miss as small places report first", () => {
    const r = run(reveal(smallFirst, 0.4));
    expect(Math.abs(r.shares["מחל"] - truth["מחל"])).toBeLessThan(0.01);
    expect(Math.abs(r.shares["פה"] - truth["פה"])).toBeLessThan(0.01);
  });

  it("converges on the actual 2022 seats once everything is counted", () => {
    const r = run(reveal(smallFirst, 1.01, true));
    expect(r.coverage.votes).toBeCloseTo(1, 2);
    for (const l of h.lists) expect(Math.abs((r.seats[l.letters] ?? 0) - l.seats)).toBeLessThanOrEqual(1);
    expect(Object.values(r.seats).reduce((a, b) => a + b, 0)).toBe(120);
  });
});

describe("count file parsers", () => {
  const letters = { "מחל": "likud", "שס": "shas" };
  it("aggregates per-box rows, keeps envelopes apart and folds unmapped letters into other", () => {
    const csv = "סמל ועדה,ברזל,שם ישוב,סמל ישוב,קלפי,ריכוז,שופט,בזב,מצביעים,פסולים,כשרים,חיצוניות,קלפי אחרת,מחל,שס,זך,\n" +
      "1,1,א,70,1,1,1,600,400,2,398,0,0,300,90,8,\n1,1,א,70,2,1,1,500,300,0,300,0,0,200,100,0,\n9,9,מעטפות,9999,1,1,1,0,50,0,50,0,0,10,40,0,";
    const o = parseBoxes(csv, letters);
    expect(o.localities).toHaveLength(1);
    expect(o.localities[0]).toMatchObject({ code: 70, valid: 698, countedEligible: 1100, boxes: 2, votes: { likud: 500, shas: 190, other: 8 } });
    expect(o.envelope).toEqual({ valid: 50, votes: { likud: 10, shas: 40, other: 0 } });
  });
  it("rejects rows whose list votes do not sum to valid", () => {
    expect(() => parseLocalities("סמל ועדה,שם ישוב,סמל ישוב,בזב,מצביעים,פסולים,כשרים,מחל,שס,\n1,א,70,600,400,2,398,300,90,", letters)).toThrow("sum");
  });
});

describe("priorShares", () => {
  it("turns median seats into shares that sum to one and keep sub-threshold lists", () => {
    const s = priorShares({ partySeats: [{ id: "likud", seats: { lo: 20, median: 30, hi: 34 } }, { id: "yashar", seats: { lo: 20, median: 90, hi: 95 } }, { id: "poi", seats: { lo: 0, median: 0, hi: 4 } }] });
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(s.yashar / s.likud).toBeCloseTo(3, 6);
    expect(s.poi).toBeGreaterThan(0);
  });
});
