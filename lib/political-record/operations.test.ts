import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  repository: vi.fn(),
  archive: vi.fn(),
  collect: vi.fn(),
}));
vi.mock("./postgres", () => ({ configuredPoliticalRecords: mocks.repository }));
vi.mock("./blob", () => ({ configuredCaptureArchive: mocks.archive }));
vi.mock("./cbs", () => ({ collectCbs: mocks.collect }));
import { mirrorPublishedLifecycle, collectPlatformSources } from "./operations";
import { emptyLedger } from "../election-lifecycle/resolver";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("never lets missing configuration or cleanup break a Redis publication", async () => {
  vi.stubEnv("POLITICAL_RECORD_SHADOW_ENABLED", "true");
  const close = vi.fn().mockRejectedValue(new Error("cleanup failure"));
  mocks.repository.mockReturnValue({ close });
  mocks.archive.mockReturnValue(null);
  expect(await mirrorPublishedLifecycle(emptyLedger())).toEqual({
    status: "unconfigured",
  });
  mocks.repository.mockImplementation(() => {
    throw new Error("configuration failure");
  });
  expect(await mirrorPublishedLifecycle(emptyLedger())).toEqual({
    status: "unavailable",
  });
});
it("preserves a valid acquisition result when closing its separate database pool fails", async () => {
  vi.stubEnv("POLITICAL_PLATFORM_COLLECT_ENABLED", "true");
  mocks.repository.mockReturnValue({
    close: vi.fn().mockRejectedValue(new Error("cleanup")),
  });
  mocks.collect.mockResolvedValue({ status: "stored", revisions: 2 });
  expect(await collectPlatformSources()).toEqual({
    status: "stored",
    revisions: 2,
  });
});
