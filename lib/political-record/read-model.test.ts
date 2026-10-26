import { afterEach, expect, it, vi } from "vitest";
vi.mock("next/server", () => ({ connection: async () => {} }));
const mocks = vi.hoisted(() => ({ lifecycle: vi.fn(), repository: vi.fn() }));
vi.mock("../election-lifecycle/server", () => ({
  getElectionLifecycle: mocks.lifecycle,
}));
vi.mock("./postgres", () => ({ configuredPoliticalRecords: mocks.repository }));
import { getPoliticalPlatformReadModel } from "./read-model";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("retains lifecycle evidence when durable storage is unconfigured", async () => {
  mocks.lifecycle.mockResolvedValue({
    revision: "known",
    politics: { events: [], proposals: [] },
  });
  const result = await getPoliticalPlatformReadModel();
  expect(result.storage.state).toBe("unconfigured");
  expect(result.lifecycle?.revision).toBe("known");
  expect(result.policyState).toBe("reference_only");
  expect(mocks.repository).not.toHaveBeenCalled();
});
it("reports read/cleanup failure without erasing the separate lifecycle bridge", async () => {
  vi.stubEnv("POLITICAL_RECORD_READ_ENABLED", "true");
  mocks.lifecycle.mockResolvedValue({
    revision: "known",
    politics: { events: [], proposals: [] },
  });
  mocks.repository.mockReturnValue({
    latest: vi.fn().mockRejectedValue(new Error("store_down")),
    close: vi.fn().mockRejectedValue(new Error("cleanup_down")),
  });
  const result = await getPoliticalPlatformReadModel();
  expect(result.storage.state).toBe("unavailable");
  expect(result.lifecycle?.revision).toBe("known");
  expect(result.publications).toEqual([]);
});
