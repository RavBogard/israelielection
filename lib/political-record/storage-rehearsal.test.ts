import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import type { Pool } from "pg";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import {
  makeRecord,
  makeSource,
  makeCapture,
  publicationIntent,
} from "./records";
import { recordHash } from "./hash";
import {
  STORAGE_MIGRATIONS,
  runtimeGrants,
  rehearsalIdentifier,
  exportCore,
  restoreCore,
  exportReceipt,
} from "./storage-rehearsal";
const now = "2026-10-27T00:00:00Z";
let original: PGlite, restored: PGlite;
function adapter(db: PGlite): SqlPool {
  return {
    connect: async () => ({
      query: async (sql, values) => {
        if (sql.includes("pg_advisory_xact_lock"))
          return { rows: [], rowCount: 1 };
        const result = await db.query<Record<string, unknown>>(sql, values);
        return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
      },
      release() {},
    }),
    end: async () => {},
  };
}
const pg = (db: PGlite) => adapter(db) as unknown as Pick<Pool, "connect">;
beforeAll(async () => {
  original = new PGlite();
  restored = new PGlite();
  for (const file of STORAGE_MIGRATIONS) {
    const sql = await readFile(`db/${file}`, "utf8");
    await original.exec(sql);
    await restored.exec(sql);
  }
  const source = makeSource({
    sourceId: "synthetic-storage-test",
    publisher: "Fixture",
    title: "Not public facts",
    url: "https://example.invalid/fixture",
    authority: "fixture",
    captureHash: "a".repeat(64),
    observedAt: now,
    publishedAt: null,
  });
  const capture = makeCapture({
    sourceRevisionId: source.revisionId,
    contentSha256: source.captureHash,
    storageKey: `private/${source.captureHash}`,
    mediaType: "text/plain",
    byteLength: 10,
    observedAt: now,
  });
  const publication = makeRecord({
    recordId: "fixture-publication",
    kind: "publication",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "unknown",
    evidenceClass: "legacy_import",
    previousRevisionId: null,
    payload: { fixture: true },
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: [capture.captureId],
    },
  });
  await new PostgresPoliticalRecords(adapter(original)).append({
    records: [publication],
    sources: [source],
    captures: [capture],
    outbox: [publicationIntent(publication, "publication_committed")],
  });
}, 30000);
afterAll(async () => {
  await original?.close();
  await restored?.close();
});
it("only quotes generated rehearsal namespace identifiers", () => {
  expect(rehearsalIdentifier("platform_qa_012345abcdef")).toBe(
    '"platform_qa_012345abcdef"',
  );
  for (const bad of [
    "production",
    "platform_qa_012345abcdef;DROP DATABASE other",
    "platform_qa_../../secrets",
    "public",
    "platform_app_short",
  ])
    expect(() => rehearsalIdentifier(bad)).toThrow(
      "rehearsal_identifier_invalid",
    );
});
it("runtime grants omit ownership, fact updates/deletion, truncate and schema creation", () => {
  const sql = runtimeGrants(
    "platform_runtime_012345abcdef",
    "platform_app_012345abcdef",
  );
  expect(sql).toContain(
    "GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA political_record",
  );
  expect(sql).toContain(
    "REVOKE UPDATE ON political_private.operation_incident_events",
  );
  expect(sql).not.toMatch(/GRANT.*(?:DELETE|TRUNCATE|CREATE|OWNER)/);
});
it("restores exact records, SHA256 capture columns, source metadata, cursors and outbox using migrations", async () => {
  const backup = await exportCore(pg(original));
  expect(
    backup.tables.find((table) => table.name === "private_captures")?.columns,
  ).toContain("content_sha256");
  await restoreCore(pg(restored), backup);
  const roundtrip = await exportCore(pg(restored));
  expect(recordHash(roundtrip)).toBe(recordHash(backup));
  expect(exportReceipt(roundtrip).tables.map((table) => table.rows)).toEqual([
    1, 1, 1, 1,
  ]);
  const seq = await restored.query<{ next: number }>(
    "SELECT nextval(pg_get_serial_sequence('political_record.record_revisions','insertion_cursor'))::int next",
  );
  expect(seq.rows[0].next).toBe(2);
});
it("refuses a nonempty restore target without overwriting any prior row", async () => {
  const before = await exportCore(pg(restored));
  await expect(
    restoreCore(pg(restored), await exportCore(pg(original))),
  ).rejects.toThrow("restore_target_not_empty");
  expect(recordHash(await exportCore(pg(restored)))).toBe(recordHash(before));
});
it("rejects tampered table/column identities and rolls back before any destructive SQL", async () => {
  const backup = await exportCore(pg(original));
  const wrongTable = structuredClone(backup);
  wrongTable.tables[0].name =
    "subscribers" as (typeof wrongTable.tables)[0]["name"];
  await expect(restoreCore(pg(restored), wrongTable)).rejects.toThrow(
    "restore_format_invalid",
  );
  const wrongColumn = structuredClone(backup);
  wrongColumn.tables[0].columns.push('source_id";DROP TABLE subscribers;--');
  await expect(restoreCore(pg(restored), wrongColumn)).rejects.toThrow(
    "restore_column_invalid",
  );
});
