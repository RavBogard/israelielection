import { describe, expect, it } from "vitest";
import { blocs, mainPolls, parties, partiesData, pledgeRules, pollsData } from "./data";
import { average, blocTotals, pollTotal } from "./polls";
import type { Condition } from "./types";

const ids = new Set(parties.map((p) => p.id));

describe("data/parties.json", () => {
  it("has unique ids and known blocs", () => {
    expect(ids.size).toBe(parties.length);
    const blocIds = new Set(blocs.map((b) => b.id));
    for (const p of parties) expect(blocIds.has(p.bloc), p.id).toBe(true);
  });

  it("gives every issue axis a slot (null = no 2026 position found)", () => {
    const keys = partiesData.issues.map((i) => i.key).sort();
    for (const p of parties) if (p.issues) expect(Object.keys(p.issues).sort(), p.id).toEqual(keys);
  });
});

describe("data/polls.json", () => {
  it("references only known parties", () => {
    for (const poll of pollsData.polls) {
      for (const id of Object.keys(poll.results)) expect(ids.has(id), `${poll.id}:${id}`).toBe(true);
      for (const c of poll.combined) for (const id of c.parties) expect(ids.has(id)).toBe(true);
    }
  });

  it("accounts for all 120 seats in every current poll", () => {
    for (const poll of mainPolls) expect(pollTotal(poll), poll.id).toBe(120);
  });

  it("matches the bloc counts the v2 artifacts showed", () => {
    const t = (id: string) => blocTotals(pollsData.polls.find((p) => p.id === id)!, parties);
    expect(t("maariv")).toMatchObject({ net: 51, opp: 53, arab: 12 });
    expect(t("c13")).toMatchObject({ net: 54, opp: 52, arab: 14 });
    expect(t("zman")).toMatchObject({ net: 53, opp: 49, arab: 13, mid: 5 });
    expect(t("kan")).toMatchObject({ net: 52, opp: 52 });
  });

  it("averages Shas over the three polls that reported it", () => {
    expect(average("shas", pollsData.polls.filter((p) => ["maariv", "c13", "zman", "kan"].includes(p.id)))).toEqual({ avg: 23 / 3, n: 3 });
  });
});

describe("data/pledge-rules.json", () => {
  const walk = (c: Condition): string[] =>
    "party" in c ? [c.party] : "tag" in c ? [] : ("all" in c ? c.all : c.any).flatMap(walk);
  it("references only known parties", () => {
    for (const r of pledgeRules) for (const id of walk(r.when)) expect(ids.has(id), r.id).toBe(true);
  });
});
