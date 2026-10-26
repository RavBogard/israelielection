import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock("./store", () => ({ configuredStore: mock.store }));
import { getBaselineSnapshot, getLiveForecast } from "./server";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  mock.store.mockReset();
});
it("returns the committed baseline when disabled or unconfigured", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "false");
  mock.store.mockReturnValue(null);
  expect(await getLiveForecast()).toEqual(getBaselineSnapshot());
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  expect(await getLiveForecast()).toEqual(getBaselineSnapshot());
});
it("preserves last known good data and reports acquisition staleness independently of model age", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-27T21:00Z"));
  const current = getBaselineSnapshot();
  current.freshness.status = "current";
  mock.store.mockReturnValue({
    read: async () => current,
    health: async () => ({
      lastAttemptAt: "2026-10-27T20:59:30Z",
      lastSuccessfulAcquisitionAt: "2026-10-27T20:59:30Z",
      error: null,
    }),
  });
  expect((await getLiveForecast()).freshness.status).toBe("current");
  vi.setSystemTime(new Date("2026-10-27T21:06Z"));
  expect((await getLiveForecast()).freshness.status).toBe("stale");
});
it("rejects incompatible model snapshots and marks store failure fallback stale", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  mock.store.mockReturnValue({
    read: async () => ({ ...getBaselineSnapshot(), modelVersion: "wrong" }),
    health: async () => null,
  });
  expect(await getLiveForecast()).toEqual(getBaselineSnapshot());
  mock.store.mockReturnValue({
    read: async () => {
      throw new Error("offline");
    },
    health: async () => null,
  });
  expect((await getLiveForecast()).changeReason).toBe("acquisition_failed");
  expect((await getLiveForecast()).freshness.status).toBe("stale");
});
it("shows first-run acquisition failure health even before any live snapshot was published", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  const health = {
    lastAttemptAt: "2026-10-27T20:01:00Z",
    lastSuccessfulAcquisitionAt: null,
    error: "acquisition_or_model_failed",
  };
  mock.store.mockReturnValue({
    read: async () => null,
    health: async () => health,
  });
  const result = await getLiveForecast();
  expect(result.mode).toBe("prior");
  expect(result.revision).toBe(getBaselineSnapshot().revision);
  expect(result.freshness.status).toBe("stale");
  expect(result.freshness.lastAttemptAt).toBe(health.lastAttemptAt);
  expect(result.freshness.lastSuccessfulAcquisitionAt).toBeNull();
  expect(result.changeReason).toBe("acquisition_failed");
});

it("retains3hour acquisition freshness until nextdue grace, but an actual failure is stale immediately", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T08:59Z"));
  const current = getBaselineSnapshot();
  current.freshness.status = "current";
  const health = {
    lastAttemptAt: "2026-10-28T06:00Z",
    lastSuccessfulAcquisitionAt: "2026-10-28T06:00Z",
    error: null as string | null,
  };
  mock.store.mockReturnValue({
    read: async () => current,
    health: async () => health,
  });
  expect((await getLiveForecast()).freshness.status).toBe("current");
  vi.setSystemTime(new Date("2026-10-28T09:06Z"));
  expect((await getLiveForecast()).freshness.status).toBe("stale");
  vi.setSystemTime(new Date("2026-10-28T06:01Z"));
  health.error = "source failed";
  expect((await getLiveForecast()).freshness.status).toBe("stale");
});
