import { describe, expect, it } from "vitest";
import { fetchCount, resultsConfig } from "./results-live";
import { makeSnapshot } from "./results-snapshot";
const now = Date.parse("2026-10-28T01:00:00Z");
const csv = "סמל ישוב,בזב,מצביעים,פסולים,כשרים,a,b\n1,200,100,2,98,60,38";
const count = { eligible: 200, voted: 100, invalid: 2, valid: 98, votes: { a: 60, b: 38 }, localities: 1 };
const snapshot = makeSnapshot(count, resultsConfig, new Date(now - 60_000).toISOString(), null);
const mock = (response: Response): typeof fetch => async () => response;
describe("fresh count and cold-start fallback", () => {
  it("never requests or publishes a placeholder before close", async () => {
    let called = false;
    expect(await fetchCount(60, { now: Date.parse(resultsConfig.pollsClose) - 1, store: { current: snapshot }, fetcher: async () => { called = true; return new Response(csv); } })).toEqual({ state: "closed" }); expect(called).toBe(false);
  });
  it("labels actual no-store acquisition and unknown source timestamp", async () => {
    let cache: RequestCache | undefined;
    const live = await fetchCount(60, { now, fetcher: async (_url, init) => { cache = init?.cache; return new Response(csv); }, store: {} });
    expect(cache).toBe("no-store"); expect(live.state).toBe("open");
    if (live.state === "open") { expect(live.freshness).toBe("fresh"); expect(live.sourceUpdatedAt).toBeNull(); expect(live.fetchedAt).toBe(new Date(now).toISOString()); }
  });
  it("keeps source timestamp separate from acquisition", async () => {
    const live = await fetchCount(60, { now, store: {}, fetcher: mock(new Response(csv, { headers: { "last-modified": "Wed, 28 Oct 2026 00:45:00 GMT" } })) });
    if (live.state !== "open") throw new Error("Missing count"); expect(live.sourceUpdatedAt).toBe("2026-10-28T00:45:00.000Z"); expect(live.sourceUpdatedAt).not.toBe(live.fetchedAt);
  });
  it("restores the durable snapshot on HTTP, parse and transport failure with original capture time", async () => {
    for (const fetcher of [mock(new Response("Unavailable", { status: 503 })), mock(new Response("bad,csv")), async () => { throw new Error("offline"); }]) {
      const live = await fetchCount(60, { now, store: { current: snapshot, previous: null }, fetcher });
      if (live.state !== "open") throw new Error("Lost saved count");
      expect(live.freshness).toBe("stale"); expect(live.fetchedAt).toBe(snapshot.capturedAt); expect(live.attemptedAt).toBe(new Date(now).toISOString());
    }
  });
  it("uses an honest unavailable state when no current-election fallback survives", async () => {
    const live = await fetchCount(60, { now, store: { current: { ...snapshot, election: "2022" } }, fetcher: mock(new Response("", { status: 503 })) });
    expect(live.state).toBe("error");
  });
});
