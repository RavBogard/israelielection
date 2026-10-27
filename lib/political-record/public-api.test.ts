import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  lifecycle: vi.fn(),
  repository: vi.fn(),
}));
vi.mock("./rate-limit", () => ({ requestLimit: mocks.limit }));
vi.mock("../election-lifecycle/server", () => ({
  getElectionLifecycle: mocks.lifecycle,
}));
vi.mock("./postgres", () => ({ configuredPoliticalRecords: mocks.repository }));
import {
  publicApi,
  encodeCursor,
  decodeCursor,
  publicRecord,
} from "./public-api";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function enabled() {
  vi.stubEnv("PUBLIC_V2_API_ENABLED", "true");
  vi.stubEnv("PUBLIC_API_CURSOR_SECRET", "test-cursor-secret".repeat(3));
  mocks.limit.mockResolvedValue({ allowed: true });
}
it("returns gated/unavailable states without acquisition and paginates explicit reference data", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect(
    (
      await publicApi(
        new Request("https://example.org/api/v2/entities"),
        "entities",
      )
    ).status,
  ).toBe(404);
  enabled();
  const first = await (
    await publicApi(
      new Request("https://example.org/api/v2/entities?limit=1"),
      "entities",
    )
  ).json();
  expect(first.storage).toBe("reference_registry");
  expect(first.historyReady).toBe(false);
  expect(first.rights.rawCaptures).toBe(false);
  const next = await (
    await publicApi(
      new Request(
        `https://example.org/api/v2/entities?limit=1&cursor=${encodeURIComponent(first.nextCursor)}`,
      ),
      "entities",
    )
  ).json();
  expect(next.records[0].id).not.toBe(first.records[0].id);
  expect(
    (
      await publicApi(
        new Request(
          `https://example.org/api/v2/entities?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`,
        ),
        "entities",
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await publicApi(
        new Request("https://example.org/api/v2/publications"),
        "publications",
      )
    ).status,
  ).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
});
it("withholds noncurrent live event payloads while keeping labeled history and correction status", async () => {
  enabled();
  vi.stubEnv("POLITICAL_RECORD_PUBLIC_READ_ENABLED", "true");
  mocks.lifecycle.mockResolvedValue({ politics: { events: [] } });
  const record = {
    revisionId: "a".repeat(64),
    recordId: "event:one",
    kind: "event",
    status: "confirmed",
    payload: {
      event: {
        id: "event-one",
        revision: "old-event-revision",
        sources: [
          {
            id: "primary",
            url: "https://example.org/statement",
            authority: "party",
            captureHash: "a".repeat(64),
          },
        ],
        decision: "support",
        evidenceQuote: "Raw source quotation",
      },
    },
    provenance: { captureIds: ["private"], sourceIds: ["primary"] },
  };
  mocks.repository.mockReturnValue({
    page: vi.fn().mockResolvedValue({
      asOf: "7",
      after: "7",
      more: false,
      records: [record],
    }),
    close: vi.fn(),
  });
  const current = await (
    await publicApi(new Request("https://example.org/api/v2/events"), "events")
  ).json();
  expect(current.records[0].payload).toEqual({ withheld: true });
  expect(current.records[0].currentState).toBe(false);
  mocks.lifecycle.mockResolvedValue({
    politics: {
      events: [{ ...record.payload.event, revision: "new-event-revision" }],
    },
  });
  const mismatched = await (
    await publicApi(new Request("https://example.org/api/v2/events"), "events")
  ).json();
  expect(mismatched.records[0].payload).toEqual({ withheld: true });
  mocks.lifecycle.mockResolvedValue({
    politics: {
      events: [
        {
          ...record.payload.event,
          sources: [
            { ...record.payload.event.sources[0], captureHash: "b".repeat(64) },
          ],
        },
      ],
    },
  });
  const rebound = await (
    await publicApi(new Request("https://example.org/api/v2/events"), "events")
  ).json();
  expect(rebound.records[0].currentState).toBe(false);
  const history = await (
    await publicApi(
      new Request("https://example.org/api/v2/events?view=history"),
      "events",
    )
  ).json();
  expect(history.projection).toBe("historical_records");
  expect(history.records[0].payload.event.decision).toBe("support");
  expect(JSON.stringify(history)).not.toContain("Raw source quotation");
  expect(history.records[0].provenance.captureIds).toBeUndefined();
});
it("fails closed on shared limits and rejects tampered cursors", async () => {
  enabled();
  mocks.limit.mockResolvedValue({ allowed: false, retryAfter: 23 });
  const response = await publicApi(
    new Request("https://example.org/api/v2/elections"),
    "elections",
  );
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("23");
  const secret = "s".repeat(32),
    cursor = {
      collection: "events" as const,
      electionId: "il-knesset-26",
      view: "history" as const,
      asOf: "3",
      after: "1",
      basis: "postgres" as const,
      limit: 50,
    };
  const token = encodeCursor(cursor, secret);
  expect(decodeCursor(token, secret)).toEqual(cursor);
  expect(() => decodeCursor(token + "x", secret)).toThrow("invalid_cursor");
  expect(
    publicRecord({
      payload: {
        storageKey: "private/object",
        body: "raw",
        evidenceQuote: "quote",
        safe: 4,
      },
    }),
  ).toEqual({});
});
it("excludes unforeseen private fields through an explicit per-kind projection", () => {
  const projected = publicRecord({
    kind: "event",
    recordId: "event:fixture",
    privateOperatorEmail: "private@example.org",
    payload: {
      rawNewField: "private raw capture",
      event: {
        id: "one",
        revision: "r",
        decision: "support",
        email: "private@example.org",
        sources: [
          {
            id: "primary",
            url: "https://example.org/source",
            internalCookie: "private",
          },
        ],
      },
    },
  });
  expect(JSON.stringify(projected)).not.toMatch(
    /private@example|internalCookie|rawNewField|private raw/,
  );
  expect(JSON.stringify(projected)).toContain("https://example.org/source");
});
