import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  repository: vi.fn(),
  connection: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("./postgres", () => ({ configuredPoliticalRecords: mocks.repository }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("disabled registry retains the qualified legacy baseline without a database read", async () => {
  const { activeWorkspaceId } = await import("./workspace-server");
  expect(await activeWorkspaceId()).toBe("il-knesset-26");
  expect(mocks.repository).not.toHaveBeenCalled();
});
it("enabled cold unconfigured store is unavailable and never invents a current election", async () => {
  vi.stubEnv("POLITICAL_ELECTION_REGISTRY_ENABLED", "true");
  mocks.repository.mockReturnValue(null);
  const { activeWorkspaceId, getWorkspaceRegistry } =
    await import("./workspace-server");
  expect((await getWorkspaceRegistry()).state).toBe("unavailable");
  expect(await activeWorkspaceId()).toBeNull();
  expect(mocks.connection).toHaveBeenCalled();
});
it("framework request-time errors propagate before store error handling", async () => {
  vi.stubEnv("POLITICAL_ELECTION_REGISTRY_ENABLED", "true");
  mocks.connection.mockRejectedValueOnce(new Error("framework-bailout"));
  const { getWorkspaceRegistry } = await import("./workspace-server");
  await expect(getWorkspaceRegistry()).rejects.toThrow("framework-bailout");
});
