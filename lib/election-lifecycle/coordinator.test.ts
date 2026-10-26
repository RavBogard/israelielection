import { expect, it, vi } from "vitest";
import {
  pauseNightSchedule,
  runCycle,
  enqueueSignedPayload,
  type CycleStage,
  type CycleStore,
  type CycleDependencies,
} from "./coordinator";
function memory() {
  const values = new Map<string, string>(),
    attempts = new Map<string, number>();
  const store: CycleStore = {
    status: async (c, s) => values.get(c + s) ?? null,
    claim: async () => "claimed",
    attempts: async (c, s) => {
      const k = c + s,
        n = (attempts.get(k) ?? 0) + 1;
      attempts.set(k, n);
      return n;
    },
    finish: async (c, s, v) => {
      values.set(c + s, v);
    },
    release: async () => {},
  };
  return store;
}
const now = "2026-10-28T06:01:00Z";
function dependencies() {
  return {
    count: vi.fn(async () => {}),
    model: vi.fn(async () => {}),
    authority: vi.fn(async () => {}),
    enqueue: vi.fn(async (_c: string, _s: CycleStage) => {
      void _c;
      void _s;
    }),
  } satisfies CycleDependencies;
}
it("chains model before authority; queue failure resumes without reacquiring successful count/model; duplicates do no work", async () => {
  const store = memory(),
    deps = dependencies();
  deps.enqueue.mockRejectedValueOnce(new Error("queue unavailable"));
  await expect(runCycle(store, {}, now, deps)).rejects.toThrow("queue");
  expect((await runCycle(store, {}, now, deps)).status).toBe("duplicate");
  expect(deps.count).toHaveBeenCalledOnce();
  expect(deps.model).toHaveBeenCalledOnce();
  expect(deps.authority).not.toHaveBeenCalled();
  expect(
    (await runCycle(store, { stage: "authority" }, now, deps)).status,
  ).toBe("completed");
  await runCycle(store, { stage: "authority" }, now, deps);
  expect(deps.authority).toHaveBeenCalledOnce();
});
it("bounds failed model retries and permits independent authoritative publication while reusing count", async () => {
  const store = memory(),
    deps = dependencies();
  deps.model.mockRejectedValue(new Error("feed failed"));
  for (let i = 0; i < 2; i++)
    await expect(runCycle(store, {}, now, deps)).rejects.toThrow("feed");
  expect((await runCycle(store, {}, now, deps)).status).toBe("completed");
  expect(deps.count).toHaveBeenCalledOnce();
  expect(deps.model).toHaveBeenCalledTimes(3);
  expect(deps.enqueue).toHaveBeenCalledOnce();
  await runCycle(store, { stage: "authority" }, now, deps);
  expect(deps.authority).toHaveBeenCalledOnce();
});
it("rejects delayed/future/unordered cycles before upstream and does no automatic work beforeclose", async () => {
  const store = memory(),
    deps = dependencies();
  expect((await runCycle(store, {}, "2026-10-27T19:59Z", deps)).status).toBe(
    "before_close",
  );
  expect(
    (
      await runCycle(
        store,
        { cycleAt: "2026-10-28T05:45Z" },
        "2026-10-28T06:10Z",
        deps,
      )
    ).status,
  ).toBe("superseded");
  await expect(
    runCycle(store, { cycleAt: "2026-10-28T09:00Z" }, now, deps),
  ).rejects.toThrow("invalid_cycle");
  await expect(
    runCycle(store, { stage: "authority" }, now, deps),
  ).rejects.toThrow("model_stage_pending");
  expect(deps.count).not.toHaveBeenCalled();
  expect(deps.model).not.toHaveBeenCalled();
  expect(deps.authority).not.toHaveBeenCalled();
});

it("pauses only the intensive schedule at the boundary, never the continuing3hour schedule", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("QSTASH_TOKEN", "test-token");
  const fetch = vi.fn(async (_url: string) => {
    void _url;
    return new Response("{}");
  });
  vi.stubGlobal("fetch", fetch);
  expect((await pauseNightSchedule("2026-10-28T05:59Z")).status).toBe(
    "before_pause_time",
  );
  expect(fetch).not.toHaveBeenCalled();
  await pauseNightSchedule("2026-10-28T06:00Z");
  expect(fetch.mock.calls[0][0]).toContain(
    "lifecycle-preview-night-2026/pause",
  );
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("forwards private deploymentprotection bypass only inpreview signed chains, never production or messagebody", async () => {
  vi.stubEnv("QSTASH_TOKEN", "test-token");
  vi.stubEnv(
    "ELECTION_LIFECYCLE_WORKER_URL",
    "https://example.org/api/election-lifecycle/worker",
  );
  vi.stubEnv("ELECTION_PREVIEW_PROTECTION_BYPASS", "private-preview-test");
  vi.stubEnv("VERCEL_ENV", "preview");
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => {
    void _url;
    void _init;
    return new Response("{}");
  });
  vi.stubGlobal("fetch", fetch);
  try {
    await enqueueSignedPayload({ mode: "cycle_rehearsal" });
    const first = fetch.mock.calls[0][1];
    expect(
      (first.headers as Record<string, string>)[
        "Upstash-Forward-x-vercel-protection-bypass"
      ],
    ).toBe("private-preview-test");
    expect(first.body).not.toContain("private-preview-test");
    vi.stubEnv("VERCEL_ENV", "production");
    await enqueueSignedPayload({ mode: "cycle" });
    expect(
      (fetch.mock.calls[1][1].headers as Record<string, string>)[
        "Upstash-Forward-x-vercel-protection-bypass"
      ],
    ).toBeUndefined();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});
