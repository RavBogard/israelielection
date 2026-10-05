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

  it("Zionist opposition + Arab party", () => {
    const w = warnings(sel("yashar", "dem", "jl"), parties, pledgeRules);
    expect(w.map((x) => x.id)).toEqual(["zionist-opp-no-arab-parties"]);
    expect(w[0].message).toBe(
      "The Zionist opposition (Yashar!, The Democrats) has pledged to govern without Arab parties, and this coalition includes Joint List."
    );
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
