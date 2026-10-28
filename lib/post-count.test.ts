import { describe, expect, it } from "vitest";
import { glance, readings } from "@/components/profile/model";
import { listStatusText } from "@/components/list-status/ListStatusChip";
import type { SharedSeatContext } from "./election-lifecycle/types";
import { parties, pledgeRules } from "./data";
import { LANGS } from "./i18n";
import { POST_COUNT, RULE_SHORT, seatBasisPhrase } from "./i18n/post-count";
import { listSeats } from "./list-seats";
import { listStatus, shareOf } from "./list-status";
import { redLines } from "./red-lines";

const SEATS: Record<string, number> = { likud: 28, otzma: 7, shas: 9, utj: 7, rz: 2, yashar: 16, byachad: 13, dem: 10, yb: 10, jl: 9, raam: 9 };
const ctx = (over: Partial<SharedSeatContext> = {}) => ({ basis: "partial_count", seatStatus: "estimated", pointSeats: SEATS, observedAt: "2026-10-28T10:00:00Z", publishedAt: null, snapshotRevision: "r1", sourceRefs: [], ...over }) as unknown as SharedSeatContext;
const seatsOf = (id: string) => SEATS[id] ?? 0;

describe("the profile keeps the projection and the poll average apart", () => {
  it("never puts the count into the poll-average series", () => {
    const p = parties.find((x) => x.id === "likud")!;
    const g = glance(p, readings(p), ctx());
    expect(g.projection).toBe(28);
    expect(g.avg).toBe(listSeats("likud").seats);
    expect(g.avg).not.toBe(28);
    expect(glance(p, readings(p), null).projection).toBeNull();
  });
});

describe("status chip for lists below the threshold", () => {
  const FORBIDDEN = /failed|\bout\b|eliminated/i;
  it("says Entered for a list with seats", () => {
    for (const lang of LANGS) expect(listStatusText(5, "estimated", 0.06, lang)).toBe(POST_COUNT[lang].entered);
  });
  it("shows the live share and never says failed before the result is official", () => {
    for (const lang of LANGS) {
      const t = listStatusText(0, "provisional", 0.0164, lang);
      expect(t).toMatch(/1[.,]6/);
      expect(t).not.toMatch(FORBIDDEN);
      expect(t).not.toBe(listStatusText(0, "official", 0.0164, lang));
    }
    expect(listStatusText(0, "estimated", 0.0164, "en")).toBe("Below 3.25% in the count so far (1.6%)");
  });
  it("switches to the plain threshold wording once seatStatus is official", () => {
    expect(listStatusText(0, "official", 0.0164, "en")).toBe("Below the threshold (1.6%)");
    expect(listStatus(0, "official", null)).toEqual({ kind: "below", official: true, pct: null });
    expect(listStatus(0, "estimated", null)).toEqual({ kind: "below", official: false, pct: null });
  });
  it("reads the official share once published, otherwise the live count's", () => {
    const shares = { byParty: { poi: 0.016 }, byLetters: { A: 0.02 } };
    expect(shareOf({ party: "poi" }, shares, ctx())).toBe(0.016);
    expect(shareOf({ letters: "A" }, shares, ctx())).toBe(0.02);
    expect(shareOf({ party: "poi" }, null, ctx())).toBeNull();
    const official = ctx({ seatStatus: "official", officialVotes: { valid: 1000, byParty: { poi: 15 } } });
    expect(shareOf({ party: "poi" }, shares, official)).toBe(0.015);
  });
});

describe("seat captions follow the basis", () => {
  it("says count projection, then seats won, and the poll average only without a context", () => {
    expect(seatBasisPhrase(ctx(), "en")).toBe("seats in the count projection");
    expect(seatBasisPhrase(ctx({ seatStatus: "official", basis: "official_seats" }), "en")).toBe("seats won");
    expect(seatBasisPhrase(null, "en")).toBe("seats in the polling average");
    for (const lang of LANGS) expect(seatBasisPhrase(ctx(), lang)).toBe(POST_COUNT[lang].seatsInProjection);
  });
});

describe("red lines in play", () => {
  const out = redLines(seatsOf, parties, pledgeRules);
  const combo = (...blocs: string[]) => out.combos.find((c) => c.blocs.join("+") === blocs.join("+"));
  it("shows what each bloc needs for 61", () => {
    expect(out.needs.find((n) => n.bloc === "net")).toMatchObject({ seats: 53, gap: 8 });
    expect(out.needs.find((n) => n.bloc === "opp")).toMatchObject({ seats: 49, gap: 12 });
    expect(out.needs.find((n) => n.bloc === "mid")).toBeUndefined();
  });
  it("lists only the smallest combinations that reach 61", () => {
    expect(out.combos.map((c) => c.blocs.join("+")).sort()).toEqual(["net+arab", "net+opp", "opp+arab"].sort());
    expect(combo("opp", "arab")).toMatchObject({ total: 67 });
  });
  it("names the rule ids that stand in the way of each combination", () => {
    const ids = combo("opp", "arab")!.blockedBy;
    for (const id of ["eisenkot-no-raam", "byachad-zionist-only", "lieberman-no-arab-no-haredi"]) expect(ids).toContain(id);
    expect(ids).not.toContain("zionist-opp-no-arab-parties");
    expect(ids).not.toContain("joint-list-no-netanyahu");
    expect(combo("net", "arab")!.blockedBy).toEqual(expect.arrayContaining(["joint-list-no-netanyahu", "rz-no-arab-parties", "otzma-no-raam"]));
    expect(combo("net", "opp")!.blockedBy).toEqual(expect.arrayContaining(["yashar-no-netanyahu", "yb-no-netanyahu", "otzma-no-eisenkot"]));
  });
  it("follows the seats: a bloc that clears 61 alone is listed alone and a party with no seats blocks nothing", () => {
    const big = redLines((id) => ({ likud: 40, shas: 21, jl: 5 })[id] ?? 0, parties, pledgeRules);
    expect(big.combos.map((c) => c.blocs.join("+"))).toEqual(["net"]);
    expect(big.combos[0].blockedBy).toEqual([]);
    const noEisenkot = redLines((id) => (id === "yashar" ? 0 : seatsOf(id)), parties, pledgeRules);
    expect(noEisenkot.combos.find((c) => c.blocs.join("+") === "opp+arab")?.blockedBy ?? []).not.toContain("eisenkot-no-raam");
  });
  it("has a short label in every edition for every pledge it can list", () => {
    for (const r of pledgeRules.filter((x) => x.kind === "pledge" && x.id !== "zionist-opp-no-arab-parties")) for (const lang of LANGS) expect(RULE_SHORT[r.id]?.[lang], `${r.id} ${lang}`).toBeTruthy();
    for (const lang of LANGS) for (const v of Object.values(POST_COUNT[lang])) expect(v.length).toBeGreaterThan(0);
  });
});

describe("the red-lines panel renders from the rules", () => {
  it("lists each blocking rule id and the caveat in every edition", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: RedLines } = await import("@/components/coalition/RedLines");
    const poll = { id: "current", results: Object.fromEntries(Object.entries(SEATS).map(([id, seats]) => [id, { seats }])) } as unknown as import("./types").Poll;
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(createElement(RedLines, { poll, lang, fig: String }));
      for (const id of ["eisenkot-no-raam", "byachad-zionist-only", "lieberman-no-arab-no-haredi"]) expect(html).toContain(`data-rule="${id}"`);
      expect(html).toContain(POST_COUNT[lang].redCaveat.replace(/'/g, "&#x27;"));
      expect(html).toContain('data-combo="opp+arab"');
    }
  });
});
