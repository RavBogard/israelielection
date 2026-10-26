import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), extract: vi.fn() }));
vi.mock("./acquisition", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./acquisition")>()),
  fetchPrimary: mocks.fetch,
}));
vi.mock("./extract", () => ({ extractEvents: mocks.extract }));
import { acquirePoliticalSources } from "./sources";
import { emptyLedger } from "./resolver";
afterEach(() => {
  vi.unstubAllEnvs();
  mocks.fetch.mockReset();
  mocks.extract.mockReset();
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
