import { expect, it, vi } from "vitest";
import sample from "./fixtures/cbs-price-120010.json";
import { collectCbs, parseCbs, CBS_URL } from "./cbs";
import type { PoliticalRecordRepository, RecordBatch } from "./types";
it("accepts the recorded real CBS response and preserves observation date, units and base", () => {
  const records = parseCbs(sample, "2026-10-26T12:00:00Z");
  expect(records).toHaveLength(2);
  expect(records[0]).toMatchObject({
    seriesId: 120010,
    period: "2026-09",
    monthlyPercent: -0.5,
    annualPercent: 1.6,
    baseDescription: "Average 2024",
    indexValue: 105.3,
    releaseDate: null,
  });
  expect(() =>
    parseCbs(
      { ...sample, month: [{ ...sample.month[0], code: 120011 }] },
      "2026-10-26",
    ),
  ).toThrow("cbs_series_invalid");
  expect(() => parseCbs(sample, "2026-08-01")).toThrow("cbs_period_invalid");
  expect(() =>
    parseCbs(
      { ...sample, paging: { next_url: "https://example.org/" } },
      "2026-10-26",
    ),
  ).toThrow("cbs_schema_invalid");
});
it("stores stable observation revisions without reacquiring from a reader or duplicating unchanged facts", async () => {
  const records = new Map();
  const batches: RecordBatch[] = [];
  const repository = {
    getLatest: async (id: string) => records.get(id) ?? null,
    append: async (batch: RecordBatch) => {
      batches.push(batch);
      batch.records.forEach((record) => records.set(record.recordId, record));
      return { records: batch.records.length, captures: 0, outbox: 0 };
    },
  } as unknown as PoliticalRecordRepository;
  const fetcher = vi.fn().mockResolvedValue(Response.json(sample));
  const first = await collectCbs(
    repository,
    null,
    "2026-10-26T12:00:00Z",
    fetcher,
  );
  expect(first.revisions).toBe(2);
  expect(fetcher.mock.calls[0][0]).toBe(CBS_URL);
  expect(fetcher.mock.calls[0][1].headers["User-Agent"]).toContain(
    "IsraeliElection",
  );
  fetcher.mockResolvedValue(Response.json(sample));
  expect(
    (await collectCbs(repository, null, "2026-10-26T15:00:00Z", fetcher))
      .revisions,
  ).toBe(0);
  expect(batches[0].records[0].provenance.missingCapture).toBe(true);
  fetcher.mockResolvedValue(
    new Response("<html>maintenance</html>", {
      headers: { "Content-Type": "text/html" },
    }),
  );
  await expect(
    collectCbs(repository, null, "2026-10-26T18:00:00Z", fetcher),
  ).rejects.toThrow("cbs_source_unavailable");
  expect(records.size).toBe(2);
});
