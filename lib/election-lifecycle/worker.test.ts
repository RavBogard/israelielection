import { afterEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ official: 0, political: 0 }));
vi.mock("./sources", () => ({
  acquireOfficial: async () => {
    calls.official++;
    return {
      snapshot: null,
      capture: null,
      health: {
        sourceId: "cec-official",
        authority: "cec",
        status: "unavailable",
        checkedAt: "2026-11-04T12:00Z",
        lastSuccessfulAt: null,
        reason: "source_unavailable",
      },
    };
  },
  acquirePoliticalSources: async (
    ledger: import("./types").LifecycleLedger,
  ) => {
    calls.political++;
    return {
      events: ledger.events,
      health: [],
      captures: [],
      extractionCache: {},
    };
  },
}));
vi.mock("./bridge", async (original) => ({
  ...(await original<typeof import("./bridge")>()),
  acquireLiveBridge: async () => ({ snapshots: [], health: [] }),
}));
import { runLifecycleWorker } from "./worker";
import type { LifecycleLedger } from "./types";
import type { LifecycleStore } from "./store";
afterEach(() => vi.unstubAllEnvs());
it("continues official/formation acquisition and daily briefing after election minute-worker shutdown, with idempotent retries", async () => {
  vi.stubEnv("ELECTION_FORMATION_ENABLED", "true");
  let ledger: LifecycleLedger | null = null,
    locks = 0;
  const receipts = new Set<string>();
  const store: LifecycleStore = {
    load: async () => ledger,
    pinned: async () => null,
    geography: async () => null,
    lock: async () => {
      locks++;
      return true;
    },
    unlock: async () => {},
    delivered: async (id) => receipts.has(id),
    publish: async (_t, l, id) => {
      ledger = l;
      receipts.add(id);
      return true;
    },
  };
  expect(
    (await runLifecycleWorker(store, "one", "election", "2026-11-04T12:00Z"))
      .status,
  ).toBe("outside_election_window");
  expect(locks).toBe(0);
  expect(
    (await runLifecycleWorker(store, "two", "formation", "2026-11-04T12:00Z"))
      .status,
  ).toBe("published");
  expect(
    (await runLifecycleWorker(store, "two", "formation", "2026-11-04T12:00Z"))
      .status,
  ).toBe("duplicate");
  const before = { ...calls };
  await runLifecycleWorker(store, "three", "briefing", "2026-11-04T12:00Z");
  expect(calls).toEqual(before);
  expect((ledger as unknown as LifecycleLedger).briefings).toHaveLength(1);
});
