import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { head } from "@vercel/blob";
import {
  STORAGE_MIGRATIONS,
  rehearsalIdentifier,
  runtimeGrants,
  exportCore,
  restoreCore,
  exportReceipt,
} from "../../lib/political-record/storage-rehearsal";
import { PostgresPoliticalRecords } from "../../lib/political-record/postgres";
import { PrivateBlobArchive } from "../../lib/political-record/blob";
import { contentHash } from "../../lib/political-record/captures";
import {
  makeRecord,
  makeSource,
  publicationIntent,
} from "../../lib/political-record/records";
import { storeReviewedPublicationEdition } from "../../lib/political-record/publications";
import { recordHash } from "../../lib/political-record/hash";
import { collectCbs } from "../../lib/political-record/cbs";
import {
  registerLivePublicationInputs,
  runPublicationStage,
} from "../../lib/political-record/producer";

const configFile = ".vercel/platform-storage-rehearsal.private.json";
const receiptFile = ".vercel/platform-storage-rehearsal.receipt.json";
const runtimeFile = ".vercel/platform-runtime.private.env";
type Config = {
  id: string;
  role: string;
  password: string;
  databases: { qa: string; restore: string; runtime: string };
};
let stage = "configuration";
const checks: Record<string, unknown> = {};
const pools: Pool[] = [];
function check(value: unknown, code: string): asserts value {
  if (!value) throw Error(code);
}
function pool(url: string) {
  const value = new Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
    query_timeout: 20000,
  });
  pools.push(value);
  return value;
}
async function denied(value: Pool, sql: string, expected: string[]) {
  try {
    await value.query(sql);
    return false;
  } catch (error) {
    return expected.includes(String((error as { code?: string }).code));
  }
}
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        writes: 0,
        requires:
          "--run --target=preview with explicitly approved preview-only Neon/private Blob credentials",
      }),
    );
    return;
  }
  check(
    process.argv.includes("--target=preview") &&
      process.env.VERCEL_ENV === "preview",
    "preview_only",
  );
  const adminUrl =
    process.env.POLITICAL_RECORD_DATABASE_URL_UNPOOLED ??
    process.env.POLITICAL_RECORD_DATABASE_URL;
  const token = process.env.POLITICAL_RECORD_BLOB_TOKEN;
  check(adminUrl && token, "preview_credentials_unconfigured");
  const base = new URL(adminUrl);
  check(
    base.hostname.endsWith(".neon.tech") &&
      ["postgres:", "postgresql:"].includes(base.protocol),
    "preview_neon_host_required",
  );
  await mkdir(".vercel", { recursive: true });
  let config: Config;
  try {
    config = JSON.parse(await readFile(configFile, "utf8")) as Config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const id = randomBytes(6).toString("hex");
    config = {
      id,
      role: `platform_app_${id}`,
      password: randomBytes(32).toString("base64url"),
      databases: {
        qa: `platform_qa_${id}`,
        restore: `platform_restore_${id}`,
        runtime: `platform_runtime_${id}`,
      },
    };
    await writeFile(configFile, JSON.stringify(config), {
      mode: 0o600,
      flag: "wx",
    });
  }
  check(
    /^[a-f0-9]{12}$/.test(config.id) &&
      /^[a-zA-Z0-9_-]{40,60}$/.test(config.password),
    "rehearsal_config_invalid",
  );
  const role = rehearsalIdentifier(config.role),
    admin = pool(adminUrl);
  stage = "isolated_resources";
  if (
    !(
      await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [
        config.role,
      ])
    ).rowCount
  )
    await admin.query(
      `CREATE ROLE ${role} LOGIN PASSWORD '${config.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
    );
  const urls = (database: string, restricted = false) => {
    const url = new URL(base);
    url.pathname = "/" + database;
    if (restricted) {
      url.username = config.role;
      url.password = config.password;
    }
    return url.toString();
  };
  const migrations = await Promise.all(
    STORAGE_MIGRATIONS.map(async (name) => ({
      name,
      sql: await readFile(`db/${name}`, "utf8"),
    })),
  );
  const existingQa = (
    await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [
      config.databases.qa,
    ])
  ).rowCount;
  if (existingQa && process.argv.includes("--resume-restore")) {
    const previous = JSON.parse(await readFile(receiptFile, "utf8"));
    check(
      previous.stage === "logical_export_restore" &&
        previous.status === "failed",
      "restore_resume_receipt_invalid",
    );
    Object.assign(checks, previous.checks);
    const backup = JSON.parse(
      await readFile(".vercel/platform-storage-export.private.json", "utf8"),
    );
    check(
      recordHash(backup) ===
        recordHash(await exportCore(pool(urls(config.databases.qa)))),
      "resume_source_changed",
    );
    await finishRestore(config, urls, new PrivateBlobArchive(token), backup);
    return;
  }
  check(!existingQa, "rehearsal_already_created_preserved_use_receipt");
  for (const database of Object.values(config.databases)) {
    const quoted = rehearsalIdentifier(database);
    check(
      !(
        await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [
          database,
        ])
      ).rowCount,
      "rehearsal_target_already_exists",
    );
    await admin.query(`CREATE DATABASE ${quoted}`);
    const owner = pool(urls(database));
    for (const migration of migrations) await owner.query(migration.sql);
    await owner.query(runtimeGrants(database, config.role));
  }
  checks.migrations = migrations.map((value) => ({
    name: value.name,
    hash: recordHash(value.sql),
  }));
  const qaOwner = pool(urls(config.databases.qa)),
    qaApp = pool(urls(config.databases.qa, true));
  const privileges = (
    await qaApp.query(
      "SELECT rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls,pg_has_role(current_user,'neon_superuser','MEMBER') member FROM pg_roles WHERE rolname=current_user",
    )
  ).rows[0];
  check(
    Object.values(privileges).every((value) => value === false),
    "restricted_role_elevated",
  );
  checks.restrictedRole = {
    nonOwner:
      (
        await qaApp.query(
          "SELECT pg_get_userbyid(datdba)<>current_user ok FROM pg_database WHERE datname=current_database()",
        )
      ).rows[0].ok === true,
    privilegesDenied: true,
  };
  check(
    (checks.restrictedRole as { nonOwner: boolean }).nonOwner,
    "runtime_role_is_owner",
  );
  stage = "private_blob";
  const archive = new PrivateBlobArchive(token);
  const now = new Date().toISOString(),
    body = Buffer.from(
      `PRIVATE SYNTHETIC STORAGE REHEARSAL ${config.id}; no public political facts or subscriber data.`,
    );
  const source = makeSource({
    sourceId: `rehearsal:${config.id}`,
    publisher: "Storage rehearsal fixture",
    title: "Synthetic fixture only",
    captureHash: contentHash(body),
    url: `https://example.invalid/rehearsal/${config.id}`,
    authority: "rehearsal_fixture",
    observedAt: now,
    publishedAt: null,
  });
  const capture = await archive.put(source, body, "text/plain");
  check(
    contentHash(await archive.read(capture)) === capture.contentSha256,
    "private_readback_failed",
  );
  const metadata = await head(capture.storageKey, { token });
  const anonymous = await fetch(metadata.url, {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  check(
    [401, 403, 404].includes(anonymous.status),
    "private_blob_public_accessible",
  );
  let corruptRejected = false;
  try {
    await archive.read({ ...capture, contentSha256: "0".repeat(64) });
  } catch {
    corruptRejected = true;
  }
  check(corruptRejected, "corrupt_capture_accepted");
  checks.blob = {
    privateWriteRead: true,
    anonymousStatus: anonymous.status,
    corruptRejected,
    contentHash: capture.contentSha256,
  };
  stage = "runtime_permissions";
  const repo = new PostgresPoliticalRecords(qaApp);
  const fact = makeRecord({
    recordId: `fixture:${config.id}`,
    kind: "claim",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "reported",
    evidenceClass: "attributed_analysis",
    previousRevisionId: null,
    payload: { fixture: true },
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: [capture.captureId],
    },
  });
  await repo.append({
    records: [fact],
    sources: [source],
    captures: [capture],
    outbox: [],
  });
  for (const sql of [
    "UPDATE political_record.record_revisions SET payload='{}'::jsonb",
    "DELETE FROM political_record.source_revisions",
    "TRUNCATE political_record.record_revisions CASCADE",
    "ALTER TABLE political_record.record_revisions DISABLE TRIGGER ALL",
    "CREATE TABLE political_record.forbidden(id int)",
    "CREATE SCHEMA forbidden",
    "SET session_replication_role='replica'",
  ])
    check(await denied(qaApp, sql, ["42501"]), "runtime_mutation_not_denied");
  check(
    await denied(
      qaOwner,
      "UPDATE political_record.record_revisions SET payload='{}'::jsonb",
      ["P0001"],
    ),
    "append_only_trigger_not_enforced",
  );
  checks.mutationDenials = { restricted: 7, ownerAppendOnlyTrigger: true };
  stage = "atomic_rollback";
  const rollbackFact = makeRecord({
    ...fact,
    recordId: `rollback:${config.id}`,
    previousRevisionId: null,
  });
  const missing = makeRecord({
    ...fact,
    recordId: `missing-outbox-target:${config.id}`,
    kind: "publication",
  });
  let rolledBack = false;
  try {
    await repo.append({
      records: [rollbackFact],
      sources: [],
      captures: [],
      outbox: [publicationIntent(missing, "publication_committed")],
    });
  } catch (error) {
    rolledBack = (error as { code?: string }).code === "23503";
  }
  check(
    rolledBack && !(await repo.getRevision(rollbackFact.revisionId)),
    "transaction_rollback_failed",
  );
  checks.atomicRollback = true;
  stage = "concurrent_cas";
  const race = await Promise.all(
    Array.from({ length: 6 }, (_, actor) =>
      repo.compareAndAppend(
        {
          records: [
            makeRecord({
              ...fact,
              recordId: `cas:${config.id}`,
              payload: { fixture: true, actor },
            }),
          ],
          sources: [],
          captures: [],
          outbox: [],
        },
        { recordId: `cas:${config.id}`, revisionId: null },
      ),
    ),
  );
  check(
    race.filter((result) => !result.conflict).length === 1 &&
      race.filter((result) => result.conflict).length === 5,
    "concurrent_cas_failed",
  );
  checks.concurrentCas = { writers: 6, winners: 1, conflicts: 5 };
  stage = "fixture_publication";
  await registerLivePublicationInputs(repo, "cbs", [], now);
  const fixture = await readFile(
    "lib/political-record/fixtures/cbs-price-120010.json",
    "utf8",
  );
  const acquired = await collectCbs(
    repo,
    archive,
    now,
    async () =>
      new Response(fixture, {
        headers: { "content-type": "application/json" },
      }),
  );
  await registerLivePublicationInputs(repo, "cbs", acquired.revisionIds, now);
  const modelCalls: string[] = [];
  const fixtureModel = async (mode: "draft" | "review") => {
    modelCalls.push(mode);
    return mode === "draft"
      ? {
          subject: "Synthetic private rehearsal",
          text: "CBS recorded an index observation. This is a storage rehearsal fixture.",
        }
      : {
          supported: true,
          complete: true,
          attributionPreserved: true,
          noAddedInference: true,
        };
  };
  check(
    (await runPublicationStage(repo, archive, now, fixtureModel)).status ===
      "review",
    "producer_draft_checkpoint_failed",
  );
  check(
    (await runPublicationStage(repo, archive, now, fixtureModel)).status ===
      "done",
    "producer_review_checkpoint_failed",
  );
  check(modelCalls.join(",") === "draft,review", "unexpected_model_stage");
  const indicator = (await repo.getRevision(acquired.revisionIds[0]))!;
  const publication = makeRecord({
    recordId: `rehearsal-publication:${config.id}`,
    kind: "publication",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "primary_confirmed",
    previousRevisionId: null,
    payload: {
      category: "fact_change",
      titleKey: "synthetic_private_rehearsal",
      recordRevisionIds: [indicator.revisionId],
      data: { topics: ["policies"], delivery: "major_event" },
    },
    provenance: indicator.provenance,
  });
  const batch = {
    records: [publication],
    sources: [],
    captures: [],
    outbox: [publicationIntent(publication, "publication_committed")],
  };
  const repeated = await Promise.all(
    Array.from({ length: 6 }, () => repo.append(batch)),
  );
  check(
    repeated.reduce((n, result) => n + result.records, 0) === 1 &&
      repeated.reduce((n, result) => n + result.outbox, 0) === 1,
    "concurrent_outbox_idempotence_failed",
  );
  const content = {
    subject: "Synthetic private edition",
    text: "Storage rehearsal only. Not a public political publication.",
  };
  const review = {
    decision: "approve" as const,
    publicationRevisionId: publication.revisionId,
    locale: "en" as const,
    contentHash: recordHash(content),
    factRevisionIds: [indicator.revisionId],
    generationRunId: `fixture-draft:${config.id}`,
    reviewRunId: `fixture-review:${config.id}`,
    provider: "synthetic_fixture_no_provider_call",
    model: "fixture",
  };
  const editions = await Promise.all(
    Array.from({ length: 4 }, () =>
      storeReviewedPublicationEdition(
        repo,
        publication.revisionId,
        "en",
        content,
        review,
        archive,
        now,
      ),
    ),
  );
  check(
    new Set(editions.map((edition) => edition.revisionId)).size === 1,
    "concurrent_edition_idempotence_failed",
  );
  checks.concurrentPublication = {
    appenders: 6,
    recordInserted: 1,
    outboxInserted: 1,
    editionWriters: 4,
    uniqueEdition: 1,
    providerCalls: 0,
    sends: 0,
  };
  stage = "logical_export_restore";
  const backup = await exportCore(qaOwner);
  await writeFile(
    ".vercel/platform-storage-export.private.json",
    JSON.stringify(backup),
    { mode: 0o600 },
  );
  await finishRestore(config, urls, archive, backup);
}
async function finishRestore(
  config: Config,
  urls: (database: string, restricted?: boolean) => string,
  archive: PrivateBlobArchive,
  backup: import("../../lib/political-record/storage-rehearsal").LogicalExport,
) {
  stage = "logical_export_restore";
  const restoreOwner = pool(urls(config.databases.restore));
  const restoreRepository = new PostgresPoliticalRecords(
    pool(urls(config.databases.restore, true)),
  );
  const runtimeApp = pool(urls(config.databases.runtime, true));
  await restoreCore(restoreOwner, backup);
  const restored = await exportCore(restoreOwner);
  check(
    recordHash(backup) === recordHash(restored),
    "logical_restore_equality_failed",
  );
  for (const table of restored.tables)
    if (table.name === "private_captures")
      for (const row of table.rows) {
        const ref = await restoreRepository.getCapture(String(row.capture_id));
        check(ref, "restored_capture_missing");
        check(
          contentHash(await archive.read(ref)) === ref.contentSha256,
          "restored_capture_readback_failed",
        );
      }
  checks.restore = {
    equal: true,
    source: exportReceipt(backup),
    target: exportReceipt(restored),
    privateCapturesReadBack: restored.tables.find(
      (t) => t.name === "private_captures",
    )!.rows.length,
    providerPitrVerified: false,
  };
  const clean = await exportCore(runtimeApp);
  check(
    clean.tables.every((table) => table.rows.length === 0),
    "runtime_database_not_clean",
  );
  const runtimeUrl = urls(config.databases.runtime, true);
  await writeFile(
    runtimeFile,
    `POLITICAL_RECORD_DATABASE_URL=${JSON.stringify(runtimeUrl)}\n`,
    { mode: 0o600 },
  );
  const receipt = {
    schemaVersion: 1,
    status: "passed",
    scope: "isolated_preview_only",
    runId: config.id,
    checkedAt: new Date().toISOString(),
    databases: config.databases,
    checks,
    runtimeFacts: 0,
    productionWrites: 0,
    providerCalls: 0,
    emailSends: 0,
    flagsChanged: false,
    schedulesChanged: false,
    privateRuntimeFile: runtimeFile,
  };
  await writeFile(receiptFile, JSON.stringify(receipt, null, 2), {
    mode: 0o600,
  });
  console.log(
    JSON.stringify({
      status: "passed",
      receiptFile,
      runtimeFile,
      checks: Object.keys(checks),
      productionWrites: 0,
      providerCalls: 0,
      emailSends: 0,
    }),
  );
}
main()
  .catch(async (error) => {
    const sqlState = /^[A-Z0-9]{5}$/.test(
      String((error as { code?: string }).code),
    )
      ? (error as { code: string }).code
      : undefined;
    const category =
      error instanceof Error && /^[a-z_]{1,80}$/.test(error.message)
        ? error.message
        : "rehearsal_stage_failed";
    const receipt = {
      status: "failed",
      stage,
      category,
      sqlState,
      checks,
      productionWrites: 0,
      providerCalls: 0,
      emailSends: 0,
    };
    let failureFile = receiptFile;
    try {
      if (JSON.parse(await readFile(receiptFile, "utf8")).status === "passed")
        failureFile =
          ".vercel/platform-storage-rehearsal.last-attempt.receipt.json";
    } catch {
      /* No earlier successful receipt. */
    }
    await writeFile(failureFile, JSON.stringify(receipt, null, 2), {
      mode: 0o600,
    }).catch(() => {});
    console.error(JSON.stringify(receipt));
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled(pools.map((value) => value.end()));
  });
