import { describe, expect, it } from "vitest";
import { parties, pledgeRules, pollsData } from "./data";
import { tally, warnings } from "./coalition";

const poll = (id: string) => pollsData.polls.find((p) => p.id === id)!;
const sel = (...ids: string[]) => new Set(ids);
const ruleIds = (...ids: string[]) => warnings(sel(...ids), parties, pledgeRules).map((w) => w.id);

describe("tally", () => {
  it("adds seats from the chosen poll", () => {
    const t = tally(sel("likud", "otzma", "shas", "utj", "rz", "poi"), parties, poll("maariv"));
    expect(t.total).toBe(51);
    expect(t.partial).toBe(false);
    expect(t.groupNote).toBe("");
  });

  it("counts a below-threshold party as zero and draws no segment for it", () => {
    const t = tally(sel("res", "likud"), parties, poll("c13"));
    expect(t.total).toBe(19);
    expect(t.segments.map((s) => s.name)).toEqual(["Likud"]);
  });

  it("uses Kan's combined Shas + UTJ figure only when both are chosen", () => {
    const both = tally(sel("shas", "utj", "likud"), parties, poll("kan"));
    expect(both.total).toBe(21 + 14);
    expect(both.partial).toBe(false);
    expect(both.groupNote).toMatch(/combined 14 seats/);

    const one = tally(sel("shas", "likud"), parties, poll("kan"));
    expect(one.total).toBe(21);
    expect(one.partial).toBe(true);
    expect(one.groupNote).toMatch(/did not report Shas separately/);
  });
});

describe("pledge rules (parity with the v2 if-statements)", () => {
  it("fires nothing for an empty or pledge-free coalition", () => {
    expect(ruleIds()).toEqual([]);
    expect(ruleIds("likud", "otzma", "rz")).toEqual([]);
  });

  it("parties with recorded pledges + Arab party (The Democrats made no such pledge)", () => {
    const w = warnings(sel("yashar", "dem", "jl"), parties, pledgeRules);
    expect(w.map((x) => x.id)).toEqual(["zionist-opp-no-arab-parties"]);
    expect(w[0].message).toBe(
      "Selected parties with recorded pledges to govern without Arab parties: Yashar!. This coalition includes Joint List."
    );
  });

  it("The Democrats alone with an Arab party: no pledge warning", () => {
    expect(warnings(sel("dem", "jl"), parties, pledgeRules).map((x) => x.id)).toEqual([]);
  });

  it("Eisenkot + Ra'am", () => {
    expect(ruleIds("yashar", "raam")).toEqual(["zionist-opp-no-arab-parties", "eisenkot-no-raam"]);
  });

  it("B'Yachad and Lieberman list Haredi parties before Arab parties", () => {
    const w = warnings(sel("byachad", "yb", "raam", "shas"), parties, pledgeRules);
    expect(w.find((x) => x.id === "byachad-zionist-only")!.message).toMatch(/includes Shas and Ra'am\.$/);
    expect(w.find((x) => x.id === "lieberman-no-arab-no-haredi")!.message).toMatch(/includes Shas and Ra'am\.$/);
  });

  it("Joint List + Likud, and the UTJ condition", () => {
    const w = warnings(sel("jl", "likud", "utj"), parties, pledgeRules);
    expect(w.map((x) => [x.id, x.kind])).toEqual([
      ["joint-list-no-netanyahu", "pledge"],
      ["utj-yeshiva-status-law", "condition"],
    ]);
  });
});

describe("the average as a poll", () => {
  it("averages each list over the polls where it passed, scaled to 120, without float drift", async () => {
    const { average, averageAsPoll } = await import("./polls");
    const four = pollsData.polls.filter((p) => ["maariv", "c13", "zman", "kan"].includes(p.id));
    const avg = averageAsPoll(four, parties.map((p) => p.id));
    // res is below in Channel 13 and 4–5 elsewhere: it averages over its 3 passing polls (4.3), not 13 / 4 = 3.25.
    expect(average("res", four)!.seats).toBeCloseTo(4.3, 1);
    const seats = Object.values(avg.results).map((r) => r.seats);
    const sum = seats.reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(120.5);
    expect(sum).toBeGreaterThan(115);
    for (const r of Object.values(avg.results)) if (!r.belowThreshold) expect(r.seats).toBeGreaterThanOrEqual(4);
    const ids = ["likud", "shas", "utj", "otzma", "rz", "poi"];
    const t = tally(new Set(ids), parties, avg);
    expect(t.total).toBe(Math.round(ids.reduce((a, id) => a + (avg.results[id]?.seats ?? 0), 0) * 10) / 10);
  });
});

describe("pledgeConflicts", () => {
  it("names the chosen parties each pledge rule points at, and skips conditions", async () => {
    const { pledgeConflicts } = await import("./coalition");
    const c = pledgeConflicts(new Set(["likud", "jl", "utj"]), parties, pledgeRules);
    expect(c.map((x) => x.warning.id)).toEqual(["joint-list-no-netanyahu"]);
    expect(c[0].ids.sort()).toEqual(["jl", "likud"]);
    const by = pledgeConflicts(new Set(["byachad", "shas", "yashar"]), parties, pledgeRules).find((x) => x.warning.id === "byachad-zionist-only")!;
    expect(by.ids.sort()).toEqual(["byachad", "shas"]);
  });
});
