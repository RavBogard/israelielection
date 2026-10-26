import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/reference/generation", () => ({
  generateReferenceTranslation: generate,
  reviewReferenceTranslation: generate,
}));
import { POST } from "./route";
const destination = "https://preview.example/api/reference/worker",
  key = "test-only-signing-key";
function request(body: object, subject = destination, signed = true) {
  const raw = JSON.stringify(body),
    now = Math.floor(Date.now() / 1000),
    head = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    claims = Buffer.from(
      JSON.stringify({
        iss: "Upstash",
        sub: subject,
        nbf: now - 5,
        exp: now + 60,
        body: createHash("sha256").update(raw).digest("base64url"),
      }),
    ).toString("base64url"),
    sig = createHmac("sha256", key)
      .update(head + "." + claims)
      .digest("base64url");
  return new Request(destination, {
    method: "POST",
    headers: signed
      ? { "upstash-signature": head + "." + claims + "." + sig }
      : {},
    body: raw,
  });
}
beforeEach(() => {
  vi.stubEnv(
    "ELECTION_LIFECYCLE_WORKER_URL",
    "https://preview.example/api/election-lifecycle/worker",
  );
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", key);
  generate.mockResolvedValue({
    translation: { id: "guides:seats" },
    usage: [],
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("private bounded reference generator", () => {
  it("requires an exact destination-bound signature", async () => {
    expect(
      (
        await POST(
          request(
            { mode: "generate", id: "guides:seats", lang: "he" },
            destination,
            false,
          ),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await POST(
          request(
            { mode: "generate", id: "guides:seats", lang: "he" },
            "https://other.example/api/reference/worker",
          ),
        )
      ).status,
    ).toBe(401);
    expect(generate).not.toHaveBeenCalled();
  });
  it("accepts only registered source IDs/locales with no arbitrary prompts or URLs", async () => {
    for (const payload of [
      { mode: "generate", id: "../../private", lang: "he" },
      { mode: "generate", id: "guides:seats", lang: "xx" },
      { mode: "generate", id: "guides:seats", lang: "he", prompt: "arbitrary" },
    ])
      expect((await POST(request(payload))).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
  });
  it("returns validated output and token usage without public writes", async () => {
    const r = await POST(
      request({ mode: "generate", id: "guides:seats", lang: "he" }),
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect((await r.json()).writes).toBe(0);
    expect(generate).toHaveBeenCalledWith("guides:seats", "he");
  });
});
