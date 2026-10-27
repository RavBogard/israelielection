import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PostgresPoliticalRecords, type SqlPool } from "./postgres";
import { makeCapture } from "./records";
import { collectCbs } from "./cbs";
import { contentHash, type CaptureArchive } from "./captures";
import { prepareStoredCbsRehearsal } from "./publication-rehearsal";
import { STORAGE_MIGRATIONS } from "./storage-rehearsal";
const now = "2026-10-27T00:00:00.000Z";
let db: PGlite, repository: PostgresPoliticalRecords;
const bytes = new Map<string, Uint8Array>();
const archive: CaptureArchive = {
  put: async (source, body, mediaType) => {
    const hash = contentHash(body);
    bytes.set(hash, body);
    return makeCapture({
      contentSha256: hash,
      sourceRevisionId: source.revisionId,
      storageKey: `private/${hash}`,
      mediaType,
      byteLength: body.length,
      observedAt: source.observedAt,
    });
  },
  read: async (ref) => {
    const value = bytes.get(ref.contentSha256);
    if (!value) throw Error("capture_unavailable");
    return value;
  },
};
beforeAll(async () => {
  db = new PGlite();
  for (const file of STORAGE_MIGRATIONS)
    await db.exec(await readFile(`db/${file}`, "utf8"));
  const pool: SqlPool = {
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
  repository = new PostgresPoliticalRecords(pool);
  const raw = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  await collectCbs(
    repository,
    archive,
    now,
    async () =>
      new Response(raw, { headers: { "content-type": "application/json" } }),
  );
}, 30000);
afterAll(async () => await db?.close());
it("prepares one exact captured observation/locale without a model call or initial all-locale alerts", async () => {
  const result = await prepareStoredCbsRehearsal(
    repository,
    archive,
    "en",
    now,
  );
  expect(result.status).toBe("prepared");
  expect(result.providerCalls).toBe(0);
  expect(result.sends).toBe(0);
  const jobs = await repository.producerJobs(25);
  expect(jobs).toHaveLength(1);
  expect(jobs[0].payload.locale).toBe("en");
  expect(
    (await repository.latest({ kind: "publication" })).records,
  ).toHaveLength(0);
});
it("repeated preparation preserves the job instead of resetting its attempts/revision", async () => {
  const first = (await repository.producerJobs(1))[0];
  expect(
    (await prepareStoredCbsRehearsal(repository, archive, "en", now)).status,
  ).toBe("already_prepared");
  expect((await repository.getLatest(first.recordId))?.revisionId).toBe(
    first.revisionId,
  );
});
it("refuses stale or unconfigured locale preparation", async () => {
  await expect(
    prepareStoredCbsRehearsal(
      repository,
      archive,
      "he",
      "2026-10-27T02:00:00.000Z",
    ),
  ).rejects.toThrow("recent_actual_cbs_capture_required");
  await expect(
    prepareStoredCbsRehearsal(repository, archive, "xx" as "en", now),
  ).rejects.toThrow("rehearsal_locale_invalid");
});
it("revalidates private raw bytes rather than trusting parser markers and public hashes", async () => {
  const bad: CaptureArchive = {
    ...archive,
    read: async () => Buffer.from('{"unsupported":"body"}'),
  };
  await expect(
    prepareStoredCbsRehearsal(repository, bad, "he", now),
  ).rejects.toThrow("actual_cbs_raw_observation_mismatch");
  expect(await repository.producerJobs(25)).toHaveLength(1);
});
