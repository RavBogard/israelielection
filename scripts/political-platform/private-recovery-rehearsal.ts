import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { get, put, head, BlobPreconditionFailedError } from "@vercel/blob";
import { PrivateCrypto } from "../../lib/political-record/email";
import { PrivateBlobArchive } from "../../lib/political-record/blob";
import {
  PostgresPoliticalRecords,
  type SqlPool,
} from "../../lib/political-record/postgres";
import { recordHash } from "../../lib/political-record/hash";
import { contentHash } from "../../lib/political-record/captures";
import {
  exportCore,
  rehearsalIdentifier,
} from "../../lib/political-record/storage-rehearsal";
import {
  exportSubscriptions,
  restoreSubscriptions,
  recoveryPrefix,
  readRecoveredCapture,
  type RecoveryManifest,
  type PrivateBackup,
} from "../../lib/political-record/private-recovery";
import {
  seedRecoverySubscribers,
  verifyRecoveredSubscribers,
} from "../../lib/political-record/recovery-subscribers";

const receiptFile = ".vercel/platform-private-recovery.receipt.json";
const stateFile = ".vercel/platform-private-recovery.state.private.json";
const backupFile = ".vercel/platform-private-recovery.backup.private.json";
const pools: Pool[] = [];
let stage = "configuration";
function check(value: unknown, code: string): asserts value {
  if (!value) throw Error(code);
}
async function save(file: string, value: unknown) {
  await writeFile(file, JSON.stringify(value, null, 2), { mode: 0o600 });
}
async function maybeRead(file: string) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        writes: 0,
        requests: 0,
        requires:
          "--run --target=preview, approved existing QA/restore databases and private Blob; never runtime",
      }),
    );
    return;
  }
  check(
    process.argv.includes("--target=preview") &&
      process.env.VERCEL_ENV === "preview",
    "preview_only",
  );
  const previous = await maybeRead(receiptFile);
  if (previous?.status === "passed") {
    console.log(
      JSON.stringify({
        status: "preserved_passed_receipt",
        receipt: receiptFile,
        writes: 0,
      }),
    );
    return;
  }
  const config = await maybeRead(
    ".vercel/platform-storage-rehearsal.private.json",
  );
  check(config && /^[a-f0-9]{12}$/.test(config.id), "storage_config_required");
  check(
    config.databases.qa === `platform_qa_${config.id}` &&
      config.databases.restore === `platform_restore_${config.id}` &&
      config.databases.runtime === `platform_runtime_${config.id}`,
    "isolated_database_binding_invalid",
  );
  const owner = process.env.POLITICAL_RECORD_DATABASE_URL_UNPOOLED,
    token = process.env.POLITICAL_RECORD_BLOB_TOKEN;
  check(owner && token, "preview_credentials_required");
  const base = new URL(owner);
  check(
    base.hostname.endsWith(".neon.tech") &&
      ["postgres:", "postgresql:"].includes(base.protocol),
    "preview_neon_required",
  );
  const restricted = (
    await readFile(".vercel/platform-runtime.private.env", "utf8")
  ).match(/POLITICAL_RECORD_DATABASE_URL=(.*)/)?.[1];
  check(restricted, "runtime_host_binding_required");
  const runtime = new URL(JSON.parse(restricted));
  check(
    runtime.hostname.replace("-pooler.", ".") ===
      base.hostname.replace("-pooler.", ".") &&
      runtime.pathname === `/${config.databases.runtime}` &&
      decodeURIComponent(runtime.username) === config.role &&
      base.username !== runtime.username,
    "approved_project_binding_invalid",
  );
  const connect = (name: string) => {
    rehearsalIdentifier(name);
    check(
      [config.databases.qa, config.databases.restore].includes(name),
      "runtime_forbidden",
    );
    const url = new URL(base);
    url.pathname = "/" + name;
    const pool = new Pool({
      connectionString: url.href,
      max: 3,
      connectionTimeoutMillis: 15000,
      statement_timeout: 15000,
    });
    pools.push(pool);
    return pool;
  };
  const qa = connect(config.databases.qa),
    target = connect(config.databases.restore);
  for (const [pool, name] of [
    [qa, config.databases.qa],
    [target, config.databases.restore],
  ] as const)
    check(
      (await pool.query("SELECT current_database() db")).rows[0].db === name,
      "database_identity_mismatch",
    );
  const coreBefore = await exportCore(qa),
    targetCore = await exportCore(target);
  check(
    recordHash(coreBefore) === recordHash(targetCore),
    "existing_core_restore_mismatch",
  );
  let state = await maybeRead(stateFile),
    backup: PrivateBackup;
  stage = "synthetic_private_seed";
  const publicationRow = (
    await qa.query(
      "SELECT revision_id,observed_at FROM political_record.record_revisions WHERE record_id=$1",
      [`rehearsal-publication:${config.id}`],
    )
  ).rows[0];
  check(publicationRow, "existing_fixture_publication_required");
  if (state && !state.fixture) {
    check(
      process.argv.includes("--resume-seed") &&
        state.id === config.id &&
        (!state.cohort || state.cohort === "synthetic-retry"),
      "partial_seed_preserved_requires_explicit_resume",
    );
    const partial = await exportSubscriptions(qa);
    check(
      [4, 8].includes(partial.data.tables[0].rows.length) &&
        partial.data.tables[0].rows.every(
          (row) =>
            row.consent_version === "synthetic-recovery-v1" &&
            row.consent_state === "confirmed",
        ),
      "partial_seed_unexpected",
    );
    await save(
      `.vercel/platform-private-recovery.partial-seed-${Date.now()}.private.json`,
      {
        state,
        partial,
      },
    );
    // Preserve the original cohort and all its receipts; use a distinct fixture cohort at the publication's simulated time.
    state = {
      ...state,
      cohort: "synthetic-retry",
      now: new Date(publicationRow.observed_at).toISOString(),
    };
    await save(stateFile, state);
  }
  if (state?.fixture) {
    check(
      process.argv.includes("--resume") && state.id === config.id,
      "resume_requires_complete_private_fixture",
    );
    backup = await maybeRead(backupFile);
    check(
      backup &&
        recordHash(await exportSubscriptions(qa)) === recordHash(backup),
      "resume_source_changed",
    );
  } else {
    if (!state) {
      check(
        (await exportSubscriptions(qa)).data.tables.every(
          (table) => !table.rows.length,
        ) &&
          (await exportSubscriptions(target)).data.tables.every(
            (table) => !table.rows.length,
          ),
        "private_targets_not_empty",
      );
      state = {
        id: config.id,
        key: randomBytes(32).toString("base64"),
        secret: randomBytes(48).toString("base64"),
        now: new Date(publicationRow.observed_at).toISOString(),
      };
      await save(stateFile, state);
    }
    state.fixture = await seedRecoverySubscribers(
      qa,
      new PrivateCrypto(Buffer.from(state.key, "base64"), state.secret),
      publicationRow.revision_id,
      state.now,
      state.cohort,
    );
    await save(stateFile, state);
    backup = await exportSubscriptions(qa);
    await save(backupFile, backup);
  }
  const crypto = new PrivateCrypto(
    Buffer.from(state.key, "base64"),
    state.secret,
  );
  const prefix = recoveryPrefix(config.id),
    manifest: RecoveryManifest = { version: 1, prefix, objects: [] };
  const read = async (key: string) => {
    check(key.startsWith(prefix + "/"), "recovery_prefix_required");
    const result = await get(key, {
      access: "private",
      token,
      useCache: false,
    });
    check(result?.statusCode === 200, "recovery_object_unavailable");
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  };
  const store = async (key: string, body: Uint8Array, mediaType: string) => {
    try {
      await put(key, Buffer.from(body), {
        access: "private",
        token,
        allowOverwrite: false,
        addRandomSuffix: false,
        contentType: mediaType,
      });
    } catch (error) {
      if (
        !(error instanceof BlobPreconditionFailedError) &&
        !/already exists/i.test(error instanceof Error ? error.message : "")
      )
        throw error;
    }
    check(
      contentHash(await read(key)) === contentHash(body),
      "recovery_object_content_mismatch",
    );
    const metadata = await head(key, { token });
    const publicResponse = await fetch(metadata.url, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    await publicResponse.body?.cancel();
    check(publicResponse.status === 403, "recovery_object_publicly_accessible");
  };
  stage = "independent_private_objects";
  const repository = new PostgresPoliticalRecords(qa as unknown as SqlPool),
    archive = new PrivateBlobArchive(token);
  for (const row of coreBefore.tables.find(
    (table) => table.name === "private_captures",
  )!.rows) {
    const ref = await repository.getCapture(String(row.capture_id));
    check(ref, "capture_missing");
    const bytes = await archive.read(ref),
      key = `${prefix}/${ref.contentSha256}`;
    await store(key, bytes, ref.mediaType);
    manifest.objects.push({
      captureId: ref.captureId,
      hash: ref.contentSha256,
      bytes: ref.byteLength,
      key,
    });
  }
  const manifestHash = recordHash(manifest);
  await save(
    ".vercel/platform-private-recovery.objects.private.json",
    manifest,
  );
  const backupKey = `${prefix}/subscriptions-${backup.sha256}.json`;
  await store(
    backupKey,
    Buffer.from(JSON.stringify(backup)),
    "application/json",
  );
  const recoveredBackup = JSON.parse(
    new TextDecoder().decode(await read(backupKey)),
  ) as PrivateBackup;
  check(
    recordHash(recoveredBackup) === recordHash(backup),
    "recovered_backup_mismatch",
  );
  stage = "private_database_restore";
  await restoreSubscriptions(target, recoveredBackup);
  check(
    recordHash(await exportSubscriptions(target)) === recordHash(backup),
    "private_restore_equality_failed",
  );
  for (const row of coreBefore.tables.find(
    (table) => table.name === "private_captures",
  )!.rows) {
    const ref = (await repository.getCapture(String(row.capture_id)))!;
    await readRecoveredCapture(ref, manifest, manifestHash, read);
  }
  const first = (await repository.getCapture(manifest.objects[0].captureId))!;
  let corruptRejected = false;
  try {
    await readRecoveredCapture(first, manifest, manifestHash, async () =>
      Buffer.from("intentional corrupt fixture"),
    );
  } catch (error) {
    corruptRejected =
      error instanceof Error && error.message === "recovery_capture_corrupt";
  }
  check(corruptRejected, "corrupt_recovery_accepted");
  stage = "restored_delivery_guards";
  const replay = await verifyRecoveredSubscribers(
    target,
    crypto,
    state.fixture,
    state.now,
  );
  check(
    recordHash(await exportCore(qa)) === recordHash(coreBefore) &&
      recordHash(await exportCore(target)) === recordHash(targetCore),
    "core_records_changed",
  );
  const receipt = {
    status: "passed",
    checkedAt: new Date().toISOString(),
    syntheticSubscribers: backup.data.tables[0].rows.length,
    privateTables: backup.data.tables.map((table) => ({
      name: table.name,
      rows: table.rows.length,
      hash: recordHash(table),
    })),
    exactPrivateEqualityBeforeReplay: true,
    privateBackupObjectAuthenticated: true,
    objectsCopied: manifest.objects.length,
    recoveredWithoutOriginalKeys: true,
    anonymousObjectAccessDenied: true,
    corruptHashRejected: corruptRejected,
    replay,
    syntheticFakeSends: state.fixture.fakeSends,
    realSends: 0,
    providerCalls: 0,
    runtimeConnections: 0,
    productionWrites: 0,
    flagsChanged: false,
    schedulesChanged: false,
    providerPitr: false,
    independentAccountBackup: false,
    keyMaterialDisasterRecovery: false,
  };
  await save(receiptFile, receipt);
  console.log(JSON.stringify(receipt));
}
main()
  .catch(async (error) => {
    const code =
      error instanceof Error && /^[a-z_]+$/.test(error.message)
        ? error.message
        : "private_recovery_failed";
    const receipt = {
      status: "failed",
      stage,
      code,
      realSends: 0,
      runtimeConnections: 0,
      productionWrites: 0,
    };
    await save(
      ".vercel/platform-private-recovery.last-attempt.receipt.json",
      receipt,
    );
    console.error(JSON.stringify(receipt));
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled(pools.map((pool) => pool.end()));
  });
