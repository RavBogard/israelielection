import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { campaignContext, emptyLedger } from "./resolver";
import type { LifecycleLedger } from "./types";

let value: LifecycleLedger | null = null;
let failed = false;
let configured = true;
let storeError: Error | null = null;
let pinnedError: Error | null = null;
const { connect } = vi.hoisted(() => ({ connect: vi.fn(async () => {}) }));
vi.mock("next/server", () => ({ connection: connect }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("./store", () => ({
  lifecycleStore: () =>
    configured
      ? {
          load: async () => {
            if (storeError) throw storeError;
            if (failed) throw new Error("offline");
            return value;
          },
          pinned: async (revision: string) => {
            if (pinnedError) throw pinnedError;
            return (
              value?.seatSnapshots.find((s) => s.revision === revision) ?? null
            );
          },
        }
      : null,
}));
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "true");
  value = null;
  failed = false;
  configured = true;
  storeError = pinnedError = null;
  connect.mockReset();
  connect.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

it("waits for a request before enabled reads including unconfigured state, while disabled previews stay static", async () => {
  const { getSharedSeatContext } = await import("./server");
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
  await getSharedSeatContext();
  expect(connect).not.toHaveBeenCalled();
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "true");
  configured = false;
  await getSharedSeatContext();
  expect(connect).toHaveBeenCalledOnce();
  const bailout = new Error("request boundary");
  connect.mockRejectedValueOnce(bailout);
  await expect(getSharedSeatContext()).rejects.toBe(bailout);
});

it("rethrows real Next dynamic control flow from current and pinned store reads but handles ordinary outages", async () => {
  const { getElectionLifecycle } = await import("./server");
  const frameworkError = Object.assign(new Error("no-store dynamic bailout"), {
    digest: "DYNAMIC_SERVER_USAGE",
  });
  storeError = frameworkError;
  await expect(getElectionLifecycle()).rejects.toBe(frameworkError);
  storeError = new Error("Redis outage");
  expect(await getElectionLifecycle()).toBeNull();
  storeError = null;
  pinnedError = frameworkError;
  await expect(getElectionLifecycle({ revision: "e".repeat(64) })).rejects.toBe(
    frameworkError,
  );
  pinnedError = new Error("Redis outage");
  expect(await getElectionLifecycle({ revision: "e".repeat(64) })).toBeNull();
});

it("offers a qualified campaign baseline when disabled, but enabled missing credentials and cold failure are unavailable", async () => {
  const { getSharedSeatContext } = await import("./server");
  configured = false;
  expect((await getSharedSeatContext()).state).toBe("unavailable");
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
  expect((await getSharedSeatContext()).state).toBe("ready");
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "true");
  configured = true;
  failed = true;
  expect((await getSharedSeatContext()).state).toBe("unavailable");
});

it("keeps known official seats on a warm outage and pins seats while explicitly retaining current politics", async () => {
  value = emptyLedger();
  const now = new Date().toISOString();
  // Test current post-election selection without changing the real application clock.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-05T12:00Z"));
  const official = {
    ...campaignContext(now),
    revision: "d".repeat(64),
    observedAt: "2026-11-04T10:00Z",
    basis: "official_seats" as const,
    seatStatus: "official" as const,
    evidenceStage: "official" as const,
    pointMethod: "published_official_allocation" as const,
  };
  value.seatSnapshots.push(official);
  const { getElectionLifecycle } = await import("./server");
  expect((await getElectionLifecycle())?.seatContext.basis).toBe(
    "official_seats",
  );
  const pinned = await getElectionLifecycle({ revision: official.revision });
  expect(pinned?.selection).toEqual({
    mode: "pinned",
    seatRevision: official.revision,
    politics: "current",
  });
  expect(await getElectionLifecycle({ revision: "e".repeat(64) })).toBeNull();
  failed = true;
  expect((await getElectionLifecycle())?.seatContext.basis).toBe(
    "official_seats",
  );
  vi.useRealTimers();
});
