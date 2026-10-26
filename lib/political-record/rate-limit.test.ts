import { afterEach, expect, it, vi } from "vitest";
import { privateClientBucket, redisLimit } from "./rate-limit";
afterEach(() => vi.unstubAllEnvs());
it("uses ephemeral keyed client buckets only from the trusted deployment header", () => {
  const secret = "s".repeat(32),
    request = new Request("https://example.org", {
      headers: {
        "x-vercel-forwarded-for": "192.0.2.7",
        "x-forwarded-for": "198.51.100.3",
      },
    });
  const local = privateClientBucket(request, secret, 0);
  expect(local).toBe(
    privateClientBucket(new Request("https://example.org"), secret, 0),
  );
  vi.stubEnv("VERCEL", "1");
  const deployed = privateClientBucket(request, secret, 0);
  expect(deployed).not.toBe(local);
  expect(deployed).not.toContain("192.0.2");
  expect(privateClientBucket(request, secret, 86400000)).not.toBe(deployed);
  const spoof = new Request("https://example.org", {
    headers: { "x-forwarded-for": "192.0.2.7" },
  });
  expect(privateClientBucket(spoof, secret, 0)).toBe(local);
});
it("uses an atomic shared expiring Redis counter across requests", async () => {
  let n = 0;
  const command = vi.fn(async () => ++n);
  expect(
    (await redisLimit({ command } as never, "test", 1, 60, 0)).allowed,
  ).toBe(true);
  expect(
    (await redisLimit({ command } as never, "test", 1, 60, 1)).allowed,
  ).toBe(false);
  expect(command.mock.calls[0]).toEqual(command.mock.calls[1]);
  expect(JSON.stringify(command.mock.calls)).not.toMatch(/192\.|198\./);
});
