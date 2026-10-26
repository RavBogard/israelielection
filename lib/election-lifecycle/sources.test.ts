import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), extract: vi.fn() }));
vi.mock("./acquisition", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./acquisition")>()),
  fetchPrimary: mocks.fetch,
}));
vi.mock("./extract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./extract")>()),
  extractEvents: mocks.extract,
}));
import { acquirePoliticalSources } from "./sources";
import { emptyLedger } from "./resolver";
import type { PoliticalEvent } from "./types";
afterEach(() => {
  vi.unstubAllEnvs();
  mocks.fetch.mockReset();
  mocks.extract.mockReset();
});

it("revalidates unique deadline-prioritized articles beyond the old three-item cap even when discovery fails", async () => {
  vi.stubEnv("ELECTION_FORMATION_ENABLED", "true");
  mocks.extract.mockResolvedValue([]);
  const ledger = emptyLedger(),
    now = "2026-11-04T12:00:00Z";
  for (let n = 0; n < 14; n++) {
    const url = `https://www.president.gov.il/statement-${n}/`,
      id = "president:" + Buffer.from(url).toString("base64url");
    const ref = {
      id,
      publisher: "President",
      title: "Statement",
      url,
      authority: "president" as const,
      publishedAt: "2026-11-04T09:00:00Z",
      observedAt: now,
      captureHash: "a".repeat(64),
    };
    const event: PoliticalEvent = {
      id: `event${n}`,
      revision: `rev${n}`,
      claimKey: `claim${n}`,
      type: "talks",
      election: "2026-10-27",
      effectiveAt: "2026-11-04T09:00:00Z",
      publishedAt: ref.publishedAt,
      observedAt: now,
      partyIds: [],
      person: null,
      decision: null,
      durationDays: null,
      status: "confirmed",
      sources: [ref],
      evidenceQuote: "Government formation talks are ongoing.",
      supersedes: null,
      templateKey: "talks",
    };
    ledger.events.push(event);
    ledger.health.push({
      sourceId: id,
      authority: "president",
      status: "healthy",
      checkedAt: now,
      lastSuccessfulAt:
        n === 13 ? "2026-11-03T06:00:00Z" : "2026-11-04T09:00:00Z",
      reason: null,
    });
  }
  ledger.events.push({ ...ledger.events[0], id: "duplicate-claim" });
  mocks.fetch.mockImplementation(async (url: string) => {
    if (!url.includes("statement-")) throw new Error("index unavailable");
    return `<script type="application/ld+json">${JSON.stringify({ "@type": "NewsArticle", headline: "Primary statement", articleBody: "Government formation talks are ongoing.", datePublished: "2026-11-04T09:00:00Z" })}</script>`;
  });
  const result = await acquirePoliticalSources(ledger, now);
  const calls = mocks.fetch.mock.calls
    .map((call) => call[0] as string)
    .filter((url) => url.includes("statement-"));
  expect(calls).toHaveLength(12);
  expect(new Set(calls).size).toBe(12);
  expect(calls[0]).toContain("statement-13/");
  expect(
    result.health.filter(
      (h) => h.sourceId.startsWith("president:") && h.status === "healthy",
    ),
  ).toHaveLength(12);
  expect(result.health.find((h) => h.sourceId === "president")?.status).toBe(
    "unavailable",
  );
  expect(result.extractionPending?.length).toBeGreaterThan(0);
});
it("caps model extraction, caches successful zero-event article bodies, and reserves discovery slots alongside known URLs", async () => {
  vi.stubEnv("ELECTION_FORMATION_ENABLED", "true");
  mocks.extract.mockResolvedValue([]);
  let widget = 0;
  mocks.fetch.mockImplementation(async (url: string) =>
    url.includes("statement-")
      ? `<script type="application/ld+json">${JSON.stringify({ "@type": "NewsArticle", headline: "Government statement", articleBody: "A dated primary statement remains exactly unchanged.", datePublished: "2026-11-04T10:00:00Z" })}</script><aside>widget ${widget++}</aside>`
      : '<a href="/statement-1">government</a><a href="/statement-2">government</a><a href="/statement-3">government</a>',
  );
  const ledger = emptyLedger(),
    first = await acquirePoliticalSources(ledger, "2026-11-04T12:00Z");
  expect(mocks.extract).toHaveBeenCalledTimes(3);
  expect(Object.keys(first.extractionCache)).toHaveLength(3);
  const firstIds = mocks.extract.mock.calls.map((c) => c[0].id);
  ledger.extractionCache = first.extractionCache;
  await acquirePoliticalSources(ledger, "2026-11-04T12:15Z");
  expect(mocks.extract).toHaveBeenCalledTimes(6);
  expect(
    mocks.extract.mock.calls.slice(3).every((c) => !firstIds.includes(c[0].id)),
  ).toBe(true);
});

it("reports provider billing distinctly without caching a failed extraction or publishing claims", async () => {
  vi.stubEnv("ELECTION_FORMATION_ENABLED", "true");
  const { PrimaryExtractionError } = await import("./extract");
  mocks.extract.mockRejectedValue(
    new PrimaryExtractionError("provider_billing", 402, "RESOURCE_EXHAUSTED"),
  );
  mocks.fetch.mockImplementation(async (url: string) =>
    url.includes("statement")
      ? `<article>Real primary statement about government formation.</article><meta property="article:published_time" content="2026-11-04T10:00:00Z">`
      : '<a href="/statement">government statement</a>',
  );
  const result = await acquirePoliticalSources(
    emptyLedger(),
    "2026-11-04T12:00Z",
  );
  expect(
    result.health.filter((h) => h.diagnostic?.code === "provider_billing"),
  ).toHaveLength(3);
  expect(result.events).toEqual([]);
  expect(Object.keys(result.extractionCache)).toHaveLength(0);
});
