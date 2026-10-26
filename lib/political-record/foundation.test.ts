import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import {
  makeRecord,
  makeSource,
  makeCapture,
  publicationIntent,
  validateBatch,
} from "./records";
import { capabilityGate } from "./gates";
import { explicitProposal, formationIdentity } from "./identity";
import { currentElection, electionById, electionScope } from "./registry";
import { LocalCaptureArchive, contentHash } from "./captures";
import { lifecycleBatch } from "./backfill";
import { emptyLedger } from "../election-lifecycle/resolver";
import { shadowLifecycle } from "./shadow";
import type { RecordBatch, PoliticalRecord } from "./types";

const now = "2026-10-28T06:00:00Z";
const record = () =>
  makeRecord({
    recordId: "publication:one",
    kind: "publication",
    electionId: currentElection().id,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "legacy_import",
    previousRevisionId: null,
    payload: { title: "Test revision" },
    provenance: { sourceIds: [], captureIds: [], missingCapture: true },
  });
const batch = (): RecordBatch => ({
  records: [record()],
  sources: [],
  captures: [],
  outbox: [publicationIntent(record(), "publication_committed")],
});

describe("real local PostgreSQL foundation (not production restore verification)", () => {
  let db: PGlite, repo: PostgresPoliticalRecords;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      await readFile(path.resolve("db/001-political-record.sql"), "utf8"),
    );
    const pool: SqlPool = {
      connect: async () => ({
        query: async (text, values) => {
          // PGlite is single-session; PostgreSQL advisory locks are a production concurrency primitive.
          if (text.startsWith("SELECT pg_advisory_xact_lock"))
            return { rows: [], rowCount: 1 };
          const result = await db.query<Record<string, unknown>>(text, values);
          return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
        },
        release() {},
      }),
      end: async () => {},
    };
    repo = new PostgresPoliticalRecords(pool);
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("atomically appends publication and recipient-free intent, then deduplicates", async () => {
    expect(await repo.append(batch())).toEqual({
      records: 1,
      captures: 0,
      outbox: 1,
    });
    expect(await repo.append(batch())).toEqual({
      records: 0,
      captures: 0,
      outbox: 0,
    });
    expect((await repo.getRevision(record().revisionId))?.payload).toEqual(
      record().payload,
    );
    expect((await repo.changes())[0].record.revisionId).toBe(
      record().revisionId,
    );
  });
  it("uses insertion cursor even when new content hashes sort before previous content", async () => {
    const cursor = (await repo.changes()).at(-1)!.cursor;
    let next: PoliticalRecord = record();
    for (let n = 0; n < 100; n++) {
      next = makeRecord({
        ...record(),
        recordId: `later:${n}`,
        payload: { n },
      });
      if (next.revisionId < record().revisionId) break;
    }
    await repo.append({
      records: [next],
      sources: [],
      captures: [],
      outbox: [],
    });
    expect(
      (await repo.changes(cursor)).map((x) => x.record.revisionId),
    ).toEqual([next.revisionId]);
    await expect(repo.changes("-1")).rejects.toThrow("invalid_cursor");
  });
  it("rejects UPDATE/DELETE and rolls back all facts when outbox reference fails", async () => {
    await expect(
      db.query(
        "DELETE FROM political_record.record_revisions WHERE revision_id=$1",
        [record().revisionId],
      ),
    ).rejects.toThrow("append-only");
    await expect(
      db.query(
        "UPDATE political_record.record_revisions SET payload='{}' WHERE revision_id=$1",
        [record().revisionId],
      ),
    ).rejects.toThrow("append-only");
    const next = makeRecord({
      ...record(),
      recordId: "rollback",
      payload: { rollback: true },
    });
    const invalidIntent = publicationIntent(
      makeRecord({
        ...record(),
        recordId: "missing",
        payload: { missing: true },
      }),
      "publication_committed",
    );
    await expect(
      repo.append({
        records: [next],
        sources: [],
        captures: [],
        outbox: [invalidIntent],
      }),
    ).rejects.toThrow();
    expect(await repo.getRevision(next.revisionId)).toBeNull();
  });
  it("rejects altered immutable source/capture metadata before transaction", () => {
    const source = makeSource({
      sourceId: "cec",
      publisher: "CEC",
      title: "Fixture",
      captureHash: "a".repeat(64),
      url: "https://votes26.bechirot.gov.il/",
      authority: "cec",
      observedAt: now,
      publishedAt: null,
    });
    const capture = makeCapture({
      contentSha256: "a".repeat(64),
      sourceRevisionId: source.revisionId,
      storageKey: `private/${"a".repeat(64)}`,
      mediaType: "text/html",
      byteLength: 1,
      observedAt: now,
    });
    expect(() =>
      validateBatch({
        ...batch(),
        sources: [{ ...source, url: "https://example.org/" }],
      }),
    ).toThrow("source_integrity");
    expect(() =>
      validateBatch({
        ...batch(),
        captures: [{ ...capture, storageKey: "private/other" }],
      }),
    ).toThrow("capture_integrity");
  });
  it("selects the latest correction by insertion order even when source time moves backwards", async () => {
    const original = makeRecord({
      ...record(),
      recordId: "correctable",
      payload: { version: 1 },
    });
    const corrected = makeRecord({
      ...original,
      previousRevisionId: original.revisionId,
      observedAt: "2026-10-27T20:00:00Z",
      status: "withdrawn",
      payload: { version: 2 },
    });
    await repo.append({
      records: [original],
      sources: [],
      captures: [],
      outbox: [],
    });
    await repo.append({
      records: [corrected],
      sources: [],
      captures: [],
      outbox: [],
    });
    const current = await repo.latest({ limit: 200 });
    expect(
      current.records
        .filter((r) => r.recordId === "correctable")
        .map((r) => r.revisionId),
    ).toEqual([corrected.revisionId]);
    expect(
      current.records.find((r) => r.recordId === "correctable")?.status,
    ).toBe("withdrawn");
    expect((await repo.latest({ limit: 1 })).truncated).toBe(true);
    expect(BigInt(current.asOfCursor)).toBeGreaterThan(BigInt(0));
  });
  it("pins public history pages to a high-water mark while later facts append", async () => {
    const first = await repo.page({
      kind: "publication",
      after: "0",
      limit: 1,
      view: "history",
    });
    const next = makeRecord({
      ...record(),
      recordId: "after-export-watermark",
      payload: { later: true },
    });
    await repo.append({
      records: [next],
      sources: [],
      captures: [],
      outbox: [],
    });
    const continuation = await repo.page({
      kind: "publication",
      after: first.after,
      asOf: first.asOf,
      limit: 100,
      view: "history",
    });
    expect(continuation.asOf).toBe(first.asOf);
    expect(
      continuation.records.some(
        (record) => record.revisionId === next.revisionId,
      ),
    ).toBe(false);
    const latest = await repo.page({
      kind: "publication",
      after: "0",
      limit: 100,
      view: "latest",
    });
    expect(
      latest.records.find((record) => record.recordId === "correctable")
        ?.status,
    ).toBe("withdrawn");
    expect(
      latest.records.filter((record) => record.recordId === "correctable"),
    ).toHaveLength(1);
  });
  it("imports and compares a legacy snapshot without inventing absent captures", async () => {
    const ledger = emptyLedger();
    const { campaignContext } = await import("../election-lifecycle/resolver");
    ledger.seatSnapshots = [campaignContext(now)];
    const result = await shadowLifecycle(repo, ledger);
    expect(result.ready).toBe(true);
    expect(result.privateArchive).toBe("unconfigured");
    expect((await shadowLifecycle(repo, ledger)).inserted.records).toBe(0);
  });
});
it("keeps stable election/proposal identity separate from corroborating evidence revisions", () => {
  expect(electionById("il-knesset-26")?.seats).toBe(120);
  expect(electionScope("il-knesset-27")).not.toBe(
    electionScope("il-knesset-26"),
  );
  const input = {
    electionId: currentElection().id,
    nomineePersonId: "person:test",
    mandateAttemptId: null,
    sourceEventIds: ["event:a"],
    evidenceBasis: "explicit_proposal" as const,
    identityAnchor: { kind: "initiating_event" as const, value: "event:a" },
  };
  expect(explicitProposal(input).id).toBe(
    explicitProposal({ ...input, sourceEventIds: ["event:b", "event:a"] }).id,
  );
  expect(
    formationIdentity({
      type: "party_position",
      election: "2026-10-27",
      person: "Named person",
      effectiveAt: now,
      mandateKind: null,
      sources: [],
      status: "confirmed",
    }).mandateAttemptId,
  ).toBeNull();
  expect(capabilityGate("workspace", []).blockers).toContain("archive_routing");
  expect(capabilityGate("count_informed_odds", []).ready).toBe(false);
});
it("privately stores immutable bytes and rejects traversal/corruption", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "political-capture-"));
  try {
    const archive = new LocalCaptureArchive(dir);
    const source = makeSource({
      sourceId: "test",
      publisher: "test",
      title: "Fixture",
      captureHash: contentHash(Buffer.from("public fixture only")),
      url: "https://example.org/public",
      authority: "party",
      observedAt: now,
      publishedAt: null,
    });
    const ref = await archive.put(
      source,
      Buffer.from("public fixture only"),
      "text/html",
    );
    expect(Buffer.from(await archive.read(ref)).toString()).toBe(
      "public fixture only",
    );
    expect(
      (
        await archive.put(
          source,
          Buffer.from("public fixture only"),
          "text/html",
        )
      ).captureId,
    ).toBe(ref.captureId);
    await expect(
      archive.read({ ...ref, storageKey: "private/../secret" }),
    ).rejects.toThrow("capture_key_invalid");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
it("binds old snapshot provenance only to its exact captured source revision", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "political-backfill-"));
  try {
    const ledger = emptyLedger();
    const { campaignContext } = await import("../election-lifecycle/resolver");
    const snapshot = campaignContext(now);
    const oldBody = "old public body",
      newBody = "corrected public body";
    const old = {
      ...snapshot.sourceRefs[0],
      id: "same-source",
      url: "https://example.org/article",
      captureHash: contentHash(Buffer.from(oldBody)),
      observedAt: "2026-10-28T06:00:00Z",
    };
    const newer = {
      ...old,
      captureHash: contentHash(Buffer.from(newBody)),
      observedAt: "2026-10-28T09:00:00Z",
    };
    ledger.captures = [
      { source: old, body: oldBody },
      { source: newer, body: newBody },
    ];
    ledger.seatSnapshots = [
      { ...snapshot, sourceRefs: [old] },
      {
        ...snapshot,
        revision: "b".repeat(64),
        sourceRefs: [newer],
        observedAt: newer.observedAt,
      },
    ];
    const result = await lifecycleBatch(ledger, new LocalCaptureArchive(dir));
    expect(result.records[0].provenance.captureIds).toHaveLength(1);
    expect(result.records[0].provenance.captureIds).not.toEqual(
      result.records[1].provenance.captureIds,
    );
    const capture = result.captures.find(
      (c) => c.captureId === result.records[0].provenance.captureIds[0],
    );
    expect(capture?.contentSha256).toBe(old.captureHash);
    ledger.seatSnapshots[0].election = "2027-01-01";
    await expect(lifecycleBatch(ledger)).rejects.toThrow(
      "legacy_election_scope_mismatch",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
