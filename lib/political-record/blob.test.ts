import { expect, it, vi } from "vitest";
import { PrivateBlobArchive } from "./blob";
import { contentHash } from "./captures";
import { makeSource } from "./records";
it("writes only private immutable Blob paths and validates authenticated bytes", async () => {
  const body = Buffer.from("public source fixture"),
    hash = contentHash(body);
  const source = makeSource({
    sourceId: "fixture",
    publisher: "Fixture",
    title: "Fixture",
    captureHash: hash,
    url: "https://example.org/public",
    authority: "party",
    observedAt: "2026-10-26T12:00:00Z",
    publishedAt: null,
  });
  const client = {
    put: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockImplementation(async () => ({
      statusCode: 200,
      stream: new Response(body).body,
    })),
  };
  const archive = new PrivateBlobArchive("private-test-token", client as never);
  const ref = await archive.put(source, body, "text/html");
  expect(client.put.mock.calls[0][0]).toBe(`private/${hash}`);
  expect(client.put.mock.calls[0][2]).toMatchObject({
    access: "private",
    allowOverwrite: false,
    addRandomSuffix: false,
  });
  expect(client.get.mock.calls[0][1]).toMatchObject({
    access: "private",
    useCache: false,
  });
  client.get.mockResolvedValue({
    statusCode: 200,
    stream: new Response("changed").body,
  });
  await expect(archive.read(ref)).rejects.toThrow("capture_content_conflict");
});
