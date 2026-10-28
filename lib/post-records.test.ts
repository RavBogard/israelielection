import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { SharedSeatContext } from "./election-lifecycle/types";
import { allPolls, parties, pollsData } from "./data";
import { LANGS } from "./i18n";
import { fill } from "./i18n/post-count";
import { POST_RECORDS } from "./i18n/post-records";
import { communityBlock, COMMUNITY_TOWNS } from "./communities-2026";
import { votesOf } from "./list-status";
import { communityCount } from "./community-count";
import { candidateMark, finalPolls, pollsterAccuracy, rangeText, seatRange, surplusStatus } from "./post-records";

const SEATS: Record<string, number> = { likud: 28, otzma: 7, shas: 9, utj: 7, rz: 2, yashar: 16, byachad: 13, dem: 10, yb: 10, jl: 9, raam: 9 };
const ctx = (over: Partial<SharedSeatContext> = {}) => ({ basis: "partial_count", seatStatus: "estimated", pointSeats: SEATS, observedAt: "2026-10-28T10:00:00Z", publishedAt: null, snapshotRevision: "r1", sourceRefs: [], ...over }) as unknown as SharedSeatContext;

describe("final polls", () => {
  it("takes each pollster's last campaign poll, never an exit poll, and keeps the set-apart pollsters out of the main set", () => {
    const { main, apart } = finalPolls(allPolls, pollsData.config);
    const names = [...main, ...apart].map((p) => p.pollster);
    expect(new Set(names).size).toBe(names.length);
    expect([...main, ...apart].some((p) => p.kind === "exit")).toBe(false);
    for (const p of apart) expect(pollsData.config.withoutVariant.pollsters).toContain(p.pollster);
    for (const p of main) expect(pollsData.config.withoutVariant.pollsters).not.toContain(p.pollster);
    for (const p of [...main, ...apart]) {
      const later = allPolls.filter((q) => q.kind !== "exit" && q.pollster === p.pollster && q.published > p.published);
      expect(later).toHaveLength(0);
    }
  });
  it("gives the lowest and highest seats, counting a list below the threshold as 0", () => {
    const { main } = finalPolls(allPolls, pollsData.config);
    const r = seatRange("likud", main)!;
    expect(r.lo).toBeLessThanOrEqual(r.hi);
    expect(r.n).toBeGreaterThan(0);
    expect(rangeText({ lo: 5, hi: 5 }, "-")).toBe("5");
    expect(rangeText({ lo: 5, hi: 9 }, "-")).toBe("5-9");
    expect(seatRange("no-such-list", main)).toBeNull();
  });
});

describe("candidate marks", () => {
  it("marks a numbered slot on track only inside the projected seats, and never for a list with none", () => {
    expect(candidateMark("9", 28, "estimated")).toBe("onTrack");
    expect(candidateMark("29", 28, "estimated")).toBeNull();
    expect(candidateMark("2", 0, "estimated")).toBeNull();
    expect(candidateMark("2", 0, "provisional")).toBeNull();
    expect(candidateMark("—", 28, "estimated")).toBeNull();
  });
  it("says elected or not elected once the result is official", () => {
    expect(candidateMark("9", 9, "official")).toBe("elected");
    expect(candidateMark("10", 9, "official")).toBe("notElected");
  });
});

describe("surplus pairs", () => {
  it("reports whether both lists of the pair are on course to pass, and its partner", () => {
    const s = surplusStatus("jl", parties, ctx())!;
    expect(s.partnerId).toBe("raam");
    expect(s.both).toBe(true);
    expect(surplusStatus("jl", parties, ctx({ pointSeats: { ...SEATS, raam: 0 } }))!.both).toBe(false);
    expect(surplusStatus("jl", parties, ctx({ seatStatus: "official" }))!.official).toBe(true);
    expect(surplusStatus("poi", parties, ctx())).toBeNull();
  });
});

describe("pollster accuracy", () => {
  it("compares each final poll with the count: mean list error and bloc error, set-apart pollsters last", () => {
    const rows = pollsterAccuracy(allPolls, parties, ctx(), pollsData.config);
    expect(rows.length).toBeGreaterThan(3);
    for (const r of rows) {
      expect(r.mae).toBeGreaterThanOrEqual(0);
      expect(r.lists).toBeGreaterThan(0);
    }
    const firstApart = rows.findIndex((r) => r.apart);
    if (firstApart >= 0) expect(rows.slice(firstApart).every((r) => r.apart)).toBe(true);
    const main = rows.filter((r) => !r.apart);
    expect([...main].sort((a, b) => a.mae - b.mae).map((r) => r.pollster)).toEqual(main.map((r) => r.pollster));
  });
  it("is zero for a poll that matches the count exactly", () => {
    const exact = { id: "x", pollster: "Exact", firm: null, fieldwork: null, published: "2026-10-26", via: null, url: null, n: null, margin: null, note: null, combined: [], results: Object.fromEntries(Object.entries(SEATS).map(([id, seats]) => [id, { seats }])) };
    const [row] = pollsterAccuracy([exact as never], parties, ctx(), pollsData.config);
    expect(row.mae).toBe(0);
    expect(row.bloc).toEqual({ net: 0, opp: 0 });
  });
});

describe("votes by ballot letters", () => {
  it("reads the live count's votes, then the official figure once published", () => {
    const shares = { byParty: {}, byLetters: { A: 0.1 }, votesByLetters: { A: 123456 } };
    expect(votesOf({ letters: "A" }, shares, ctx())).toBe(123456);
    expect(votesOf({ letters: "B" }, shares, ctx())).toBeNull();
    expect(votesOf({ letters: "A" }, null, ctx())).toBeNull();
    expect(votesOf({ letters: "A" }, shares, ctx({ seatStatus: "official", officialVotes: { valid: 1000, byParty: { A: 77 } } }))).toBe(77);
  });
});

describe("communities' 2026 block", () => {
  const def = COMMUNITY_TOWNS.haredim;
  const lists = [
    { id: "utj", letters: "g", name: "UTJ" },
    { id: "shas", letters: "s", name: "Shas" },
    { id: "likud", letters: "m", name: "Likud" },
    { id: "cec-aa", letters: "p", name: "p" },
  ];
  const row = (code: number, valid: number, votes: Record<string, number>) => ({ code, eligible: valid * 2, voted: valid, valid, votes });
  it("combines the counted towns and says which one is not counted yet", () => {
    const snap = { lists, rows: [row(6100, 100, { utj: 60, shas: 30, likud: 4, "cec-aa": 1 }), row(3797, 100, { utj: 80, shas: 15, likud: 1, "cec-aa": 0 })] };
    const b = communityBlock(snap, def);
    expect(b.counted).toBe(2);
    expect(b.towns).toHaveLength(5);
    const utj = b.rows.find((r) => r.id === "utj")!;
    expect(utj.share).toBeCloseTo(0.7);
    expect(utj.perTown).toEqual([0.6, 0.8, null, null, null]);
    expect(b.rows[0].id).toBe("utj");
  });
  it("has no figures, rather than invented ones, when no town is in the file", () => {
    const b = communityBlock({ lists, rows: [] }, def);
    expect(b.counted).toBe(0);
    expect(b.rows.every((r) => r.share === 0 && r.perTown.every((v) => v === null))).toBe(true);
  });
  it("uses only towns that exist on the vote map", () => {
    const places = JSON.parse(readFileSync("public/vote-map/places.json", "utf8")) as Record<string, [string]>;
    for (const [slug, d] of Object.entries(COMMUNITY_TOWNS)) for (const t of d.towns) expect(places[String(t.code)], `${slug}: ${t.name}`).toBeTruthy();
  });
});

describe("post-records words", () => {
  it("has every string, with the same slots, in all seven editions", () => {
    const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const key of Object.keys(POST_RECORDS.en) as (keyof typeof POST_RECORDS.en)[]) {
      for (const lang of LANGS) {
        expect(POST_RECORDS[lang][key], `${lang}.${key}`).toBeTruthy();
        expect(slots(POST_RECORDS[lang][key]), `${lang}.${key}`).toBe(slots(POST_RECORDS.en[key]));
      }
    }
  });
  it("labels the provisional figures as provisional and never says failed", () => {
    for (const lang of LANGS) {
      expect(POST_RECORDS[lang].accTitle).not.toBe(POST_RECORDS[lang].accTitleOfficial);
      expect(fill(POST_RECORDS[lang].votesSoFar, { v: "1", p: "2%" })).not.toBe(fill(POST_RECORDS[lang].votesOfficial, { v: "1", p: "2%" }));
    }
    expect(POST_RECORDS.en.belowSoFarTag).not.toMatch(/fail/i);
  });
});

describe("community count from the stored count record", () => {
  const raw = readFileSync("lib/fixtures/cec-2022-expc.csv", "utf8");
  const record = { raw, current: { capturedAt: "2026-10-28T10:00:00.000Z", sourceUpdatedAt: "2026-10-28T09:41:00.000Z" } } as never;
  it("reads the saved CEC file for a community's towns, with its own file time and the share of the roll counted", () => {
    const r = communityCount("haredim", record);
    expect(r.state).toBe("ready");
    if (r.state !== "ready") return;
    expect(r.fileTime).toBe("2026-10-28T09:41:00.000Z");
    expect(r.block.towns.map((t) => t.name)).toContain("Bnei Brak");
    expect(r.block.counted).toBe(r.block.towns.length);
    expect(r.block.valid).toBeGreaterThan(100000);
    expect(r.countedShare).toBeGreaterThan(0.99);
    expect(r.block.rows.length).toBeGreaterThan(0);
  });
  it("says it is unavailable, rather than faking figures, with no stored count or an unknown community", () => {
    expect(communityCount("haredim", null)).toEqual({ state: "unavailable", reason: "no_count" });
    expect(communityCount("haredim", { raw: null, current: null } as never)).toEqual({ state: "unavailable", reason: "no_count" });
    expect(communityCount("nobody", record)).toEqual({ state: "unavailable", reason: "unknown_community" });
    expect(communityCount("haredim", { raw: "not,a,csv\n1,2", current: (record as { current: unknown }).current } as never).state).toBe("unavailable");
  });
});
