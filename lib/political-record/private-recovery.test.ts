import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import type { Pool } from "pg";
import {
  STORAGE_MIGRATIONS,
  exportCore,
  restoreCore,
} from "./storage-rehearsal";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { makeRecord, makeCapture } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import { collectCbs } from "./cbs";
import { storeReviewedPublicationEdition } from "./publications";
import { PrivateCrypto } from "./email";
import {
  exportSubscriptions,
  restoreSubscriptions,
  readRecoveredCapture,
  recoveryPrefix,
} from "./private-recovery";
import {
  seedRecoverySubscribers,
  verifyRecoveredSubscribers,
} from "./recovery-subscribers";
function adapter(db: PGlite) {
  return {
    query: async (sql: string, values?: unknown[]) => {
      const c = await adapter(db).connect();
      try {
        return await c.query(sql, values);
      } finally {
        c.release();
      }
    },
    connect: async () => ({
      query: async (sql: string, values?: unknown[]) => {
        if (sql.includes("pg_advisory_xact_lock"))
          return { rows: [], rowCount: 1 };
        const result = await db.query(sql, values);
        return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
      },
      release() {},
    }),
    end: async () => {},
  } as unknown as Pool;
}
it("restores synthetic consent, encrypted preferences, suppressions, tokens and delivery deduplication on a real PostgreSQL engine", async () => {
  const original = new PGlite(),
    target = new PGlite(),
    pool = adapter(original),
    restored = adapter(target),
    now = "2026-10-27T01:00:00.000Z";
  try {
    for (const migration of STORAGE_MIGRATIONS) {
      const sql = await readFile(`db/${migration}`, "utf8");
      await original.exec(sql);
      await target.exec(sql);
    }
    const repo = new PostgresPoliticalRecords(pool as unknown as SqlPool);
    const bodies = new Map<string, Uint8Array>();
    const archive: CaptureArchive = {
      put: async (source, body, mediaType) => {
        bodies.set(contentHash(body), body);
        return makeCapture({
          sourceRevisionId: source.revisionId,
          contentSha256: contentHash(body),
          storageKey: `private/${contentHash(body)}`,
          byteLength: body.length,
          mediaType,
          observedAt: now,
        });
      },
      read: async (ref) => bodies.get(ref.contentSha256)!,
    };
    const raw = await readFile(
      "lib/political-record/fixtures/cbs-price-120010.json",
      "utf8",
    );
    const collected = await collectCbs(
      repo,
      archive,
      now,
      async () =>
        new Response(raw, { headers: { "content-type": "application/json" } }),
    );
    const fact = (await repo.getRevision(collected.revisionIds[0]))!;
    const pub = makeRecord({
      ...fact,
      recordId: "synthetic-recovery-publication",
      kind: "publication",
      payload: {
        recordRevisionIds: [fact.revisionId],
        category: "fact_change",
        titleKey: "synthetic",
        data: { topics: ["policies"], delivery: "major_event" },
      },
    });
    await repo.append({
      records: [pub],
      sources: [],
      captures: [],
      outbox: [],
    });
    const content = {
      subject: "Synthetic recovery test",
      text: "Synthetic fixture only; no political assertion.",
    };
    await storeReviewedPublicationEdition(
      repo,
      pub.revisionId,
      "en",
      content,
      {
        decision: "approve",
        publicationRevisionId: pub.revisionId,
        locale: "en",
        contentHash: recordHash(content),
        factRevisionIds: [fact.revisionId],
        generationRunId: "fixture-draft",
        reviewRunId: "fixture-review",
        provider: "fixture",
        model: "fixture",
      },
      archive,
      now,
    );
    const crypto = new PrivateCrypto(
      Buffer.alloc(32, 4),
      "synthetic-recovery-secret-".repeat(3),
    );
    const fixture = await seedRecoverySubscribers(
      pool,
      crypto,
      pub.revisionId,
      now,
    );
    expect(fixture.fakeSends).toBe(8);
    const backup = await exportSubscriptions(pool);
    expect(backup.data.tables.map((row) => row.rows.length)).toEqual([
      5, 21, 12, 7, 2,
    ]);
    expect(JSON.stringify(backup)).not.toContain(
      "synthetic-0@recovery.invalid",
    );
    expect(JSON.stringify(backup)).not.toContain(fixture.unsubscribeToken);
    await restoreCore(restored, await exportCore(pool));
    const tampered = structuredClone(backup);
    tampered.data.tables[0].rows[0].locale = "de";
    await expect(restoreSubscriptions(restored, tampered)).rejects.toThrow(
      "private_backup_invalid",
    );
    // FK failure rolls the whole restore back, including already inserted subscribers.
    const badFK = structuredClone(backup);
    badFK.data.tables[1].rows[0].subscriber_id =
      "00000000-0000-4000-8000-000000000000";
    badFK.sha256 = recordHash(badFK.data);
    await expect(restoreSubscriptions(restored, badFK)).rejects.toThrow();
    expect(
      (await target.query("SELECT * FROM political_private.subscribers")).rows,
    ).toHaveLength(0);
    await restoreSubscriptions(restored, backup);
    expect(await exportSubscriptions(restored)).toEqual(backup);
    await expect(restoreSubscriptions(restored, backup)).rejects.toThrow(
      "private_restore_target_not_empty",
    );
    await expect(
      verifyRecoveredSubscribers(
        restored,
        new PrivateCrypto(
          Buffer.alloc(32, 9),
          "synthetic-wrong-key-".repeat(3),
        ),
        fixture,
        now,
      ),
    ).rejects.toThrow();
    const result = await verifyRecoveredSubscribers(
      restored,
      crypto,
      fixture,
      now,
    );
    expect(result).toMatchObject({
      duplicateSends: 0,
      correctionsSuppressed: 3,
      unsubscribeIdempotent: true,
      consumedPreferencesDenied: true,
      webhookDeduplicated: true,
    });
    expect(result.states).toHaveLength(5);
  } finally {
    await original.close();
    await target.close();
  }
}, 30000);
it("recovered objects use only copied keys and fail closed on hash/manifest/binding corruption", async () => {
  const body = Buffer.from("synthetic private bytes"),
    hash = contentHash(body),
    prefix = recoveryPrefix("012345abcdef");
  const ref = makeCapture({
    sourceRevisionId: "a".repeat(64),
    contentSha256: hash,
    storageKey: `private/${hash}`,
    byteLength: body.length,
    mediaType: "text/plain",
    observedAt: "2026-10-27T00:00:00Z",
  });
  const manifest = {
    version: 1 as const,
    prefix,
    objects: [
      {
        captureId: ref.captureId,
        hash,
        bytes: body.length,
        key: `${prefix}/${hash}`,
      },
    ],
  };
  const reads: string[] = [];
  const get = async (key: string) => {
    reads.push(key);
    return body;
  };
  expect(
    await readRecoveredCapture(ref, manifest, recordHash(manifest), get),
  ).toEqual(body);
  expect(reads).toEqual([`${prefix}/${hash}`]);
  await expect(
    readRecoveredCapture(ref, manifest, recordHash(manifest), async () =>
      Buffer.from("corrupt"),
    ),
  ).rejects.toThrow("recovery_capture_corrupt");
  await expect(
    readRecoveredCapture(
      ref,
      { ...manifest, prefix: "private" },
      recordHash(manifest),
      get,
    ),
  ).rejects.toThrow("recovery_manifest_invalid");
  await expect(
    readRecoveredCapture(
      { ...ref, byteLength: 1 },
      manifest,
      recordHash(manifest),
      get,
    ),
  ).rejects.toThrow("recovery_capture_binding_invalid");
  expect(() => recoveryPrefix("../../private")).toThrow();
});
