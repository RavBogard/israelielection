import { afterEach, describe, expect, it, vi } from "vitest";
const source = vi.hoisted(() => ({
  id: "guides:test",
  file: "trusted.mdx",
  revision: "revision",
  blocks: [
    {
      id: "block-1",
      kind: "text",
      text: "61 seats",
      names: [],
      negated: false,
    },
  ],
}));
vi.mock("./catalog", () => ({ generationDocuments: [source] }));
vi.mock("node:fs", () => ({ readFileSync: () => "source" }));
vi.mock("./source.mjs", () => ({ sourceRevision: () => "revision" }));
import {
  generateReferenceTranslation,
  reviewReferenceTranslation,
} from "./generation";
const response = (value: unknown) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
      usageMetadata: { totalTokenCount: 12 },
    }),
  );
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("bounded reference generation", () => {
  it("repairs one mechanical mismatch before an independent review", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ blocks: [{ id: "block-1", text: "99 sièges" }] }),
      )
      .mockResolvedValueOnce(
        response({ blocks: [{ id: "block-1", text: "61 sièges" }] }),
      )
      .mockResolvedValueOnce(
        response({
          verdict: "supported",
          blocks: [
            {
              id: "block-1",
              supported: true,
              complete: true,
              negationPreserved: true,
              namesPreserved: true,
              reasonCode: "none",
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const result = await generateReferenceTranslation("guides:test", "fr");
    expect(result.translation.blocks[0].text).toBe("61 sièges");
    expect(result.usage).toHaveLength(3);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const prompts = fetcher.mock.calls.map(
      (call) => JSON.parse(call[1].body).contents[0].parts[0].text,
    );
    expect(prompts[0]).toContain("expectedNumbers");
    expect(prompts[0]).toContain("ungrouped ASCII integer digits");
    expect(prompts[1]).toContain("154,855 becomes 154855");
    expect(prompts[1]).toContain("actualNumbers");
    expect(prompts[2]).toContain("Independently verify");
  });
  it("rejects a second failed repair and retains a private unvalidated candidate", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");
    const fetcher = vi
      .fn()
      .mockImplementation(async () =>
        response({ blocks: [{ id: "block-1", text: "99 sièges" }] }),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateReferenceTranslation("guides:test", "fr"),
    ).rejects.toMatchObject({
      message: "rendered_invariants_changed",
      candidate: { status: "unvalidated" },
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("does not start another provider call after the shared deadline", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-only");
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValue(261000);
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        response({ blocks: [{ id: "block-1", text: "61 sièges" }] }),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generateReferenceTranslation("guides:test", "fr"),
    ).rejects.toThrow("provider_deadline");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

it("reviews a narrowly corrected full candidate without regenerating or repairing it", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-only");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      response({
        verdict: "supported",
        blocks: [
          {
            id: "block-1",
            supported: true,
            complete: true,
            negationPreserved: true,
            namesPreserved: true,
            reasonCode: "none",
          },
        ],
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  const result = await reviewReferenceTranslation("guides:test", "fr", {
    sourceRevision: "revision",
    blocks: [{ id: "block-1", text: "61 sièges" }],
  });
  expect(result.translation.review.verdict).toBe("supported");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(
    JSON.parse(fetcher.mock.calls[0][1].body).contents[0].parts[0].text,
  ).toContain("Independently verify");
  await expect(
    reviewReferenceTranslation("guides:test", "fr", {
      sourceRevision: "old",
      blocks: [{ id: "block-1", text: "61 sièges" }],
    }),
  ).rejects.toThrow("source_revision_changed");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
