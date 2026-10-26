import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("./count-store", () => ({ readCountRecord: mock.read }));
import { fetchCount, resultsConfig } from "../results-live";
import { makeSnapshot } from "../results-snapshot";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  mock.read.mockReset();
});
it("serves stored count through due+5minutes without fetching upstream; failure retains corrected totals", async () => {
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
  const fetch = vi.fn(() => {
    throw new Error("publicsourcefetch forbidden");
  });
  vi.stubGlobal("fetch", fetch);
  const snapshot = makeSnapshot(
    {
      eligible: 200,
      voted: 100,
      invalid: 2,
      valid: 98,
      votes: { a: 60, b: 38 },
      localities: 1,
    },
    resultsConfig,
    "2026-10-28T06:00:00Z",
    null,
  );
  const record = {
    current: snapshot,
    previous: null,
    raw: "private CSV",
    health: {
      lastAttemptAt: snapshot.capturedAt,
      lastSuccessfulAt: snapshot.capturedAt,
      error: null,
    },
  };
  mock.read.mockResolvedValue(record);
  expect(
    (await fetchCount(0, { now: Date.parse("2026-10-28T08:59Z") })).state,
  ).toBe("open");
  const stale = await fetchCount(0, { now: Date.parse("2026-10-28T09:06Z") });
  expect(stale.state === "open" && stale.freshness).toBe("stale");
  mock.read.mockResolvedValue({
    ...record,
    health: { ...record.health, error: "unreachable" },
  });
  const failed = await fetchCount(0, { now: Date.parse("2026-10-28T06:01Z") });
  expect(failed.state === "open" && failed.freshness).toBe("stale");
  expect(JSON.stringify(failed)).not.toContain("private CSV");
  expect(fetch).not.toHaveBeenCalled();
});
