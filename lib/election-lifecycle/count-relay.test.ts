import fs from "node:fs";
import { describe, expect, it } from "vitest";
import baseline from "../../data/live-forecast.json";
import { checkRelayCapture, partialCsv, relayFetcher } from "./count-relay";
import { relayStillCurrent, type CountRecord } from "./count-store";
import { countSnapshot } from "./bridge";
import { campaignContext, selectSeats } from "./resolver";
import { acquireCount } from "../results-live";
import type { LiveForecastSnapshot } from "../live-forecast/types";
import type { CountEstimate } from "../live-forecast/count-estimate";

const csv2022 = fs.readFileSync("lib/fixtures/cec-2022-expc.csv", "utf8");
const header = csv2022.split(/\r?\n/)[0] + "\n";
const night = Date.parse("2026-10-27T21:30:00Z");

describe("relay capture validation", () => {
  it("refuses writes before 20:00Z on election day", () => {
    expect(checkRelayCapture({ status: 200, body: csv2022, now: Date.parse("2026-10-27T19:59:00Z") })).toEqual({ ok: false, reason: "before_close" });
  });
  it("refuses a WAF challenge, a missing file and a header-only file", () => {
    expect(checkRelayCapture({ status: 202, body: "", now: night }).ok).toBe(false);
    expect(checkRelayCapture({ status: 200, body: "", now: night, wafAction: "challenge" })).toMatchObject({ reason: "waf_challenge" });
    expect(checkRelayCapture({ status: 404, body: "<html>", now: night })).toMatchObject({ reason: "not_published" });
    expect(checkRelayCapture({ status: 200, body: header, now: night })).toMatchObject({ reason: "header_only" });
  });
  it("refuses rows whose totals do not add up", () => {
    const lines = csv2022.trim().split(/\r?\n/);
    const bad = lines[1].split(",");
    bad[6] = String(Number(bad[6]) + 1);
    expect(checkRelayCapture({ status: 200, body: [lines[0], bad.join(",")].join("\n"), now: night })).toMatchObject({ reason: "invalid" });
  });
  it("accepts a valid partial file, and the relay fetcher passes acquireCount's own validation", async () => {
    const part = partialCsv(csv2022, 0.1);
    const check = checkRelayCapture({ status: 200, body: part, now: night });
    expect(check.ok).toBe(true);
    const live = await acquireCount(0, { now: night, store: {}, fetcher: relayFetcher(part, null) });
    expect(live.state).toBe("open");
    if (live.state === "open" && check.ok) expect(live.snapshot.hash).toBe(check.hash);
  });
});

const record = (lastSuccessfulAt: string | null, error: CountRecord["health"]["error"] = null) =>
  ({ current: { hash: "x" }, previous: null, raw: "x", health: { lastAttemptAt: lastSuccessfulAt ?? "", lastSuccessfulAt, error } }) as unknown as CountRecord;
describe("server acquisition beside the relay", () => {
  it("a challenged server fetch does not mark a current relay capture failed, only an overdue one", () => {
    expect(relayStillCurrent(record("2026-10-27T21:20:00Z"), "2026-10-27T21:30:00Z")).toBe(true);
    expect(relayStillCurrent(record("2026-10-27T20:10:00Z"), "2026-10-27T21:30:00Z")).toBe(false);
    expect(relayStillCurrent(record("2026-10-27T21:20:00Z", "unusable"), "2026-10-27T21:30:00Z")).toBe(false);
    expect(relayStillCurrent(null, "2026-10-27T21:30:00Z")).toBe(false);
  });
});

describe("count threshold switch", () => {
  const now = "2026-10-27T23:00:00Z";
  const seats = campaignContext(now).pointSeats;
  const estimate = (mode: "prior" | "count"): CountEstimate => ({
    mode,
    coverage: { votes: mode === "count" ? 0.3 : 0.02, eligible: null, localitiesReporting: 10, boxesCounted: null, envelopesCounted: 0 },
    turnoutRatio: 1,
    swing: {},
    shares: {},
    seats,
    intervals: Object.fromEntries(Object.keys(seats).map((id) => [id, { lo: seats[id] - 1, hi: seats[id] + 1 }])),
    capturedAt: "2026-10-27T22:55:00Z",
    source: "expc",
    method: "",
  });
  const live = (e: CountEstimate | null) =>
    ({ ...(structuredClone(baseline) as LiveForecastSnapshot), generatedAt: "2026-10-27T22:56:00Z", countEstimate: e }) as LiveForecastSnapshot;
  const exit = {
    ...campaignContext(now),
    basis: "named_exit" as const,
    pointMethod: "published_named_exit" as const,
    publishedAt: "2026-10-27T22:58:00Z",
    observedAt: "2026-10-27T22:58:00Z",
  };
  it("below the nowcast's coverage threshold no count context is emitted and the exit keeps the grid", () => {
    expect(countSnapshot(live(estimate("prior")), now, true)).toBeNull();
    expect(countSnapshot(live(null), now, true)).toBeNull();
    expect(selectSeats([exit], now).basis).toBe("named_exit");
  });
  it("past it the count-informed projection becomes the seat context, even beside a newer exit", () => {
    const count = countSnapshot(live(estimate("count")), now, true)!;
    expect(count).toMatchObject({ basis: "partial_count", pointMethod: "partial_count_allocation", evidenceStage: "counting", seatStatus: "estimated" });
    expect(Object.values(count.pointSeats).reduce((a, b) => a + b, 0)).toBe(120);
    expect(selectSeats([count, exit], now).revision).toBe(count.revision);
  });
});
