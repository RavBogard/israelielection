import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  configured: vi.fn(),
  enqueue: vi.fn(async (_payload: Record<string, unknown>) => {
    void _payload;
  }),
}));
vi.mock("./coordinator", async (original) => ({
  ...(await original<typeof import("./coordinator")>()),
  configuredCycleStore: mock.configured,
  enqueueSignedPayload: mock.enqueue,
}));
import {
  rehearsalEnabled,
  rehearsalSelection,
  runRehearsal,
} from "./rehearsal";
import type { CycleStore } from "./coordinator";
afterEach(() => {
  vi.unstubAllEnvs();
  mock.configured.mockReset();
  mock.enqueue.mockClear();
});
it("requires both explicitflag+preview, boundedclock and safeid; never provides production clockoverride", () => {
  const payload = { rehearsalId: "release_1", testNow: "2026-10-28T06:00Z" };
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("ELECTION_CADENCE_REHEARSAL", "true");
  expect(rehearsalEnabled()).toBe(false);
  expect(() => rehearsalSelection(payload)).toThrow("rehearsal_unavailable");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("ELECTION_CADENCE_REHEARSAL", "");
  expect(rehearsalEnabled()).toBe(false);
  vi.stubEnv("ELECTION_CADENCE_REHEARSAL", "true");
  expect(rehearsalSelection(payload).prefix).toContain(":rehearsal:release_1:");
  expect(() =>
    rehearsalSelection({ ...payload, rehearsalId: "../production" }),
  ).toThrow();
  expect(() =>
    rehearsalSelection({ ...payload, testNow: "2027-01-01" }),
  ).toThrow();
});
it("isolates progress and chains real signed payload shape with no acquisition/publicwrites", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("ELECTION_CADENCE_REHEARSAL", "true");
  const values = new Map<string, string>();
  const store: CycleStore = {
    status: async (c, s) => values.get(c + s) ?? null,
    claim: async () => "claimed",
    attempts: async () => 1,
    finish: async (c, s, v) => {
      values.set(c + s, v);
    },
    release: async () => {},
  };
  mock.configured.mockReturnValue(store);
  const payload = { rehearsalId: "release1", testNow: "2026-10-28T06:00Z" };
  expect((await runRehearsal(payload)).publicWrites).toBe(0);
  expect(mock.configured.mock.calls[0][0]).toContain(":rehearsal:release1:");
  const authority = mock.enqueue.mock.calls[0][0] as Record<string, unknown>;
  expect(authority.mode).toBe("cycle_rehearsal");
  expect(authority.stage).toBe("authority");
  await runRehearsal(authority);
  const state = await runRehearsal({ ...payload, operation: "state" });
  expect("stages" in state && state.stages).toMatchObject({
    model: "done",
    count: "done",
    authority: "done",
  });
});
