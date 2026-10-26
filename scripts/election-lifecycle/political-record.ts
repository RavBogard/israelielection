/** Explicit internal rehearsal CLI; never runs from application requests or schedules. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { configuredPoliticalRecords } from "../../lib/political-record/postgres";
import { lifecycleBatch } from "../../lib/political-record/backfill";
import { shadowLifecycle } from "../../lib/political-record/shadow";
import { LocalCaptureArchive } from "../../lib/political-record/captures";
import type { LifecycleLedger } from "../../lib/election-lifecycle/types";

async function main() {
  const command = process.argv[2],
    apply = process.argv.includes("--apply");
  if (!["schema", "backfill", "compare"].includes(command))
    throw new Error(
      "usage: schema|backfill|compare [--ledger=private-file] [--archive=private-directory] [--apply --target=development|preview]",
    );
  const value = (name: string) =>
    process.argv
      .find((arg) => arg.startsWith(`--${name}=`))
      ?.split("=")
      .slice(1)
      .join("=");
  const target = value("target");
  if (
    apply &&
    (!["development", "preview"].includes(target ?? "") ||
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production")
  )
    throw new Error("production_apply_forbidden");
  if (command === "schema") {
    const sql = (
      await Promise.all(
        [
          "001-political-record.sql",
          "002-subscriptions.sql",
          "003-platform-workspaces.sql",
          "004-distribution.sql",
        ].map((file) => readFile(path.resolve("db", file), "utf8")),
      )
    ).join("\n");
    if (!apply) {
      console.log(
        JSON.stringify({
          status: "dry_run",
          migrations: ["001-political-record", "002-subscriptions"],
          bytes: Buffer.byteLength(sql),
        }),
      );
      return;
    }
    if (!process.env.POLITICAL_RECORD_DATABASE_URL)
      throw new Error("database_unconfigured");
    const pool = new Pool({
      connectionString: process.env.POLITICAL_RECORD_DATABASE_URL,
      max: 1,
    });
    try {
      await pool.query(sql);
      console.log(JSON.stringify({ status: "schema_applied", target }));
    } finally {
      await pool.end();
    }
    return;
  }
  const filename = value("ledger");
  if (!filename) throw new Error("private_ledger_file_required");
  const ledger = JSON.parse(
    await readFile(path.resolve(filename), "utf8"),
  ) as LifecycleLedger;
  const archiveDirectory = value("archive");
  // Dry run must not create archive files.
  const archive =
    apply && archiveDirectory
      ? new LocalCaptureArchive(archiveDirectory)
      : undefined;
  if (!apply) {
    const batch = await lifecycleBatch(ledger);
    console.log(
      JSON.stringify({
        status: "dry_run",
        records: batch.records.length,
        sources: batch.sources.length,
        captures: batch.captures.length,
        missingCaptureRecords: batch.records.filter(
          (r) => r.provenance.missingCapture,
        ).length,
      }),
    );
    return;
  }
  const repository = configuredPoliticalRecords();
  if (!repository) throw new Error("database_unconfigured");
  try {
    const result =
      command === "compare"
        ? await shadowLifecycle(repository, ledger, archive)
        : await repository.append(await lifecycleBatch(ledger, archive));
    console.log(JSON.stringify({ status: "complete", target, result }));
  } finally {
    await repository.close();
  }
}
main().catch(() => {
  console.error(
    "political_record_operation_failed; inspect configuration/input locally; no connection details emitted",
  );
  process.exitCode = 1;
});
