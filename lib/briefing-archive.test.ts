import { afterEach, describe, it, expect, vi } from "vitest";
const archive = vi.hoisted(() => ({ put: vi.fn(), read: vi.fn() }));
vi.mock("./political-record/blob", () => ({
  configuredCaptureArchive: () =>
    process.env.TEST_ARCHIVE === "yes" ? archive : null,
}));
import { archiveBriefingEvidence } from "./briefing-archive";
const bundle = {
  date: "2026-10-26",
  model: "test",
  articles: [],
  claims: [],
  review: [],
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("private briefing archive gate", () => {
  it("permits no-write dry runs but refuses publication without private storage", async () => {
    expect(await archiveBriefingEvidence(bundle, true)).toEqual({
      state: "in_memory_only",
      privateStored: false,
    });
    await expect(archiveBriefingEvidence(bundle, false)).rejects.toThrow(
      "private_capture_unconfigured",
    );
    expect(archive.put).not.toHaveBeenCalled();
  });
  it("reads back immutable bytes and returns only a public hash receipt", async () => {
    vi.stubEnv("TEST_ARCHIVE", "yes");
    archive.put.mockResolvedValue({});
    archive.read.mockResolvedValue(
      new TextEncoder().encode(JSON.stringify(bundle)),
    );
    const result = await archiveBriefingEvidence(bundle, false);
    expect(result.privateStored).toBe(true);
    expect(result).not.toHaveProperty("storageKey");
    expect(result).not.toHaveProperty("articles");
  });
});
