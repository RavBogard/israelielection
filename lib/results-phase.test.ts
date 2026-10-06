import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseExpc, type Count } from "./results";
import { fetchCount, resultsConfig as cfg } from "./results-live";
import { averageLabel, countedShare, EARLY_SHARE, exitRows, headline, homeHero, night, PHASES, phases, PRIOR_ROLL, priorRollLabel, sections } from "./results-phase";
import type { Poll } from "./types";

const close = Date.parse(cfg.pollsClose);
const H = 3_600_000;
const count = (eligible: number): Count => ({ eligible, voted: 100, invalid: 2, valid: 98, votes: { a: 60, b: 38 }, localities: 3 });
const open = (eligible: number, extra: object = {}) => ({ state: "open" as const, count: count(eligible), freshness: "fresh" as const, ...extra });

describe("election-night phases", () => {
  it("pins the 2022 roll to the committee's 2022 file", () => {
    const c = parseExpc(readFileSync("lib/fixtures/cec-2022-expc.csv", "utf8"));
    expect([c.eligible, c.localities]).toEqual([PRIOR_ROLL.eligible, PRIOR_ROLL.localities]);
    expect(night({ state: "open", count: c, freshness: "fresh", fixture: true }, cfg, close + H)).toMatchObject({ phase: "count", status: "test" });
  });
  it("is before until 22:00, then exit polls while no count is usable", () => {
    expect(night({ state: "closed" }, cfg, close - 1)).toEqual({ phase: "before", status: "closed", counted: null });
    expect(night({ state: "error", fetchedAt: "", reason: "unusable" }, cfg, close + 10 * 60_000)).toMatchObject({ phase: "exit", status: "waiting" });
  });
  it("waits until 02:00 for the first figures; a real failure still says so", () => {
    expect(night({ state: "error", fetchedAt: "", reason: "unusable" }, cfg, close + 4 * H - 1).status).toBe("waiting");
    expect(night({ state: "error", fetchedAt: "", reason: "unusable" }, cfg, close + 4 * H).status).toBe("error");
    expect(night({ state: "error", fetchedAt: "", reason: "unreachable" }, cfg, close + 60_000).status).toBe("error");
    expect(night({ state: "error", fetchedAt: "" }, cfg, close + 60_000).status).toBe("error");
  });
  it("calls a count early under a tenth of the roll, against 2022 until the 2026 roll is out", () => {
    const edge = PRIOR_ROLL.eligible * EARLY_SHARE;
    expect(night(open(edge - 1), cfg, close + H)).toMatchObject({ phase: "early", status: "fresh", counted: { basis: "prior" } });
    expect(night(open(edge), cfg, close + H).phase).toBe("count");
    expect(night(open(edge, { freshness: "stale" }), cfg, close + H).status).toBe("stale");
    const withRoll = { ...cfg, roll: { eligible: 7_000_000, source: "" } };
    expect(night(open(edge), withRoll, close + H)).toMatchObject({ phase: "early", counted: { basis: "roll" } });
    expect(countedShare(count(PRIOR_ROLL.eligible * 2))!.share).toBe(1);
    expect(countedShare(null)).toBeNull();
  });
  it("leads with exit polls until the count is past early, then the board", () => {
    expect(sections("before")[0]).toBe("board");
    expect(sections("before")).not.toContain("exit");
    expect(sections("exit").slice(0, 2)).toEqual(["exit", "board"]);
    expect(sections("early").slice(0, 2)).toEqual(["exit", "board"]);
    expect(sections("count")[0]).toBe("board");
    expect(sections("count").indexOf("exit")).toBeGreaterThan(sections("count").indexOf("threshold"));
  });
  it("never shows the pre-election average on home after close", () => {
    expect([homeHero("before"), homeHero("exit"), homeHero("early"), homeHero("count")]).toEqual(["average", "exit", "exit", "count"]);
    expect(headline("before", 0)).toBe("Israel votes today.");
    expect(headline("before", 5)).toBe("Israel votes in 5 days.");
    expect(headline("exit", 0)).toBe("Polls have closed.");
    expect(headline("early", 0)).toBe("Israel voted.");
    expect(headline("count", -3)).toBe("Israel voted.");
  });
  it("dates the average until election eve", () => {
    expect(averageLabel(cfg, "2026-10-05", Date.parse("2026-10-06T12:00:00+03:00"))).toBe("Polling average, Oct 5");
    expect(averageLabel(cfg, "2026-10-23", Date.parse("2026-10-25T23:59:00+02:00"))).toBe("Polling average, Oct 23");
    expect(averageLabel(cfg, "2026-10-23", Date.parse("2026-10-26T00:00:00+02:00"))).toBe("Final poll average");
  });
  it("keeps one row per channel, its latest exit poll or none yet", () => {
    const poll = (pollster: string, broadcastAt?: string, kind = "exit") => ({ id: `${pollster}${broadcastAt}`, pollster, published: "2026-10-27", broadcastAt, kind, results: {}, combined: [] }) as unknown as Poll;
    expect(exitRows([]).map((r) => [r.pollster, r.poll])).toEqual([["Kan 11", null], ["Channel 12", null], ["Channel 13", null]]);
    const rows = exitRows([poll("Channel 12", "2026-10-27T22:00:00+02:00"), poll("Channel 12", "2026-10-27T23:30:00+02:00"), poll("Channel 14"), poll("Kan 11", undefined, "campaign")]);
    expect(rows.map((r) => r.pollster)).toEqual(["Kan 11", "Channel 12", "Channel 13", "Channel 14"]);
    expect(rows[0].poll).toBeNull();
    expect(rows[1].poll!.broadcastAt).toBe("2026-10-27T23:30:00+02:00");
  });
});

describe("why the count is missing", () => {
  const at = close + 30 * 60_000;
  const mock = (r: Response): typeof fetch => async () => r;
  it("tells a file with no usable figures from an unreachable committee", async () => {
    for (const r of [new Response("not,a,count"), new Response("", { status: 404 })]) expect(await fetchCount(60, { now: at, store: {}, fetcher: mock(r) })).toMatchObject({ state: "error", reason: "unusable" });
    expect(await fetchCount(60, { now: at, store: {}, fetcher: mock(new Response("", { status: 503 })) })).toMatchObject({ state: "error", reason: "unreachable" });
    expect(await fetchCount(60, { now: at, store: {}, fetcher: async () => { throw new Error("offline"); } })).toMatchObject({ state: "error", reason: "unreachable" });
  });
});

describe("Hebrew phrasings", () => {
  it("heads the home in Hebrew, with the dual for two days", () => {
    expect(headline("before", 5, "he")).toBe("עוד 5 ימים לבחירות.");
    expect(headline("before", 2, "he")).toBe("עוד יומיים לבחירות.");
    expect(headline("before", 1, "he")).toBe("הבחירות מחר.");
    expect(headline("before", 0, "he")).toBe("הבחירות היום.");
    expect(headline("exit", 0, "he")).toBe("הקלפיות נסגרו.");
    expect(headline("early", 0, "he")).toBe("ישראל הצביעה.");
    expect(headline("count", -3, "he")).toBe("ישראל הצביעה.");
    expect(headline("before", 5, "en")).toBe("Israel votes in 5 days.");
  });
  it("labels the average in Hebrew, dated day first", () => {
    expect(averageLabel(cfg, "2026-10-05", Date.parse("2026-10-06T12:00:00+03:00"), "he")).toBe("ממוצע הסקרים, 5.10");
    expect(averageLabel(cfg, "2026-10-23", Date.parse("2026-10-26T00:00:00+02:00"), "he")).toBe("ממוצע הסקרים הסופי");
  });
  it("keeps the phases' ids and order, and the roll label", () => {
    expect(phases("he").map((p) => p.id)).toEqual(PHASES.map((p) => p.id));
    expect(phases()).toBe(PHASES);
    expect(phases("he").map((p) => p.label)).toEqual(["מדגמי הערוצים 22:00", "תוצאות אמת ראשונות", "ספירת הקולות"]);
    expect(priorRollLabel()).toBe("the 2022 roll");
    expect(priorRollLabel("he")).toBe("פנקס הבוחרים של 2022");
  });
});
