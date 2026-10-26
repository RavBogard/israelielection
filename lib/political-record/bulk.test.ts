import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("./public-api", () => ({ publicApi: mocks.api }));
import { bulkApi } from "./bulk";
afterEach(() => vi.clearAllMocks());
const page = {
  records: [
    {
      recordId: "event:one",
      revisionId: "a".repeat(64),
      status: "confirmed",
      payload: { withheld: true },
      provenance: { sourceIds: ["b".repeat(64)] },
    },
  ],
  asOfCursor: "12",
  nextCursor: "signed-next",
  electionId: "il-knesset-26",
  rights: { rawCaptures: false, sourceQuotes: false },
  storage: "postgres",
  historyReady: true,
};
it("exports only projected records with a fixed as-of cursor, rights and verified body checksum", async () => {
  mocks.api.mockImplementation(async () => Response.json(page));
  const url = "https://example.org/api/v2/bulk/events?view=history";
  const manifest = await (await bulkApi(new Request(url), "events")).json();
  expect(manifest).toMatchObject({
    asOfCursor: "12",
    scope: "archive_part",
    visibility: "historical_as_of_with_current_correction_labels",
    recordCount: 1,
  });
  expect(manifest.nextManifestUrl).toContain("cursor=signed-next");
  const response = await bulkApi(new Request(manifest.downloadUrl), "events"),
    text = await response.text();
  expect(response.headers.get("content-type")).toContain("ndjson");
  expect(text).not.toContain("captureIds");
  expect(text.split("\n").filter(Boolean)).toHaveLength(2);
});
it("never serves altered bytes under an earlier manifest checksum", async () => {
  mocks.api.mockImplementation(async () => Response.json(page));
  const manifest = await (
    await bulkApi(
      new Request("https://example.org/api/v2/bulk/events"),
      "events",
    )
  ).json();
  mocks.api.mockImplementation(async () =>
    Response.json({ ...page, records: [] }),
  );
  expect(
    (await bulkApi(new Request(manifest.downloadUrl), "events")).status,
  ).toBe(409);
});
it("retains capability/source failures instead of emitting an empty successful archive", async () => {
  mocks.api.mockResolvedValue(
    Response.json({ error: "unavailable" }, { status: 503 }),
  );
  expect(
    (
      await bulkApi(
        new Request("https://example.org/api/v2/bulk/events"),
        "events",
      )
    ).status,
  ).toBe(503);
});
