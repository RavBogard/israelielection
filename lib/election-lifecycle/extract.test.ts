import { afterEach, expect, it, vi } from "vitest";
import { extractEvents } from "./extract";
import type { SourceRef } from "./types";
const source: SourceRef = {
  id: "primary",
  publisher: "Primary",
  title: "Statement",
  url: "https://beytenu.org.il/statement",
  authority: "party",
  publishedAt: "2026-10-18",
  observedAt: "2026-10-26T18:00Z",
  captureHash: "a".repeat(64),
  partyIds: ["yb"],
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("uses provider JSON Schema field for nullable unions and accepts successful zero-event extraction", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-private-key");
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: '{"events":[]}' }] } }],
      }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  expect(
    await extractEvents(source, "A real primary statement.", source.observedAt),
  ).toEqual([]);
  const request = JSON.parse(fetch.mock.calls[0][1].body);
  expect(request.generationConfig.responseSchema).toBeUndefined();
  expect(
    request.generationConfig.responseJsonSchema.properties.events.items
      .properties.person.type,
  ).toEqual(["string", "null"]);
});
it("distinguishes real provider status categories without exposing provider body or credentials", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-private-key");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            status: "INVALID_ARGUMENT",
            message: "Unknown name responseJsonSchema; private details omitted",
          },
        }),
        { status: 400 },
      ),
    ),
  );
  await expect(
    extractEvents(source, "Primary statement", source.observedAt),
  ).rejects.toMatchObject({
    category: "provider_schema",
    httpStatus: 400,
    providerStatus: "INVALID_ARGUMENT",
  });
});
it("does not call an unconfigured extractor a successful zero-event capture", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");
  await expect(
    extractEvents(source, "Primary statement", source.observedAt),
  ).rejects.toMatchObject({ category: "provider_unconfigured" });
});

it("classifies actual402RESOURCE_EXHAUSTED as external billing rather than parser/schema failure", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-private-key");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              status: "RESOURCE_EXHAUSTED",
              message: "provider billing required",
            },
          }),
          { status: 402 },
        ),
      ),
  );
  await expect(
    extractEvents(source, "Primary statement", source.observedAt),
  ).rejects.toMatchObject({
    category: "provider_billing",
    httpStatus: 402,
    providerStatus: "RESOURCE_EXHAUSTED",
  });
});
