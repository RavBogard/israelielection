import { readFile, writeFile } from "node:fs/promises";
import { Pool } from "pg";
import { PostgresPoliticalRecords } from "../../lib/political-record/postgres";
import { PrivateBlobArchive } from "../../lib/political-record/blob";
import { prepareStoredCbsRehearsal } from "../../lib/political-record/publication-rehearsal";
import {
  EMAIL_LOCALES,
  type EmailLocale,
} from "../../lib/political-record/email";
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        writes: 0,
        providerCalls: 0,
        sends: 0,
        requires:
          "--run --target=preview --locale=en; approved clean preview runtime credentials; recent actual signed CBS collection",
      }),
    );
    return;
  }
  if (
    process.env.VERCEL_ENV !== "preview" ||
    !process.argv.includes("--target=preview")
  )
    throw Error("preview_only");
  const locale =
    process.argv.find((arg) => arg.startsWith("--locale="))?.slice(9) ?? "en";
  if (!EMAIL_LOCALES.includes(locale as EmailLocale))
    throw Error("rehearsal_locale_invalid");
  const config = JSON.parse(
    await readFile(".vercel/platform-storage-rehearsal.private.json", "utf8"),
  ) as { role: string; databases: { runtime: string } };
  const value = process.env.POLITICAL_RECORD_DATABASE_URL,
    ownerValue = process.env.POLITICAL_RECORD_DATABASE_URL_UNPOOLED,
    token = process.env.POLITICAL_RECORD_BLOB_TOKEN;
  if (!value || !ownerValue || !token)
    throw Error("preview_runtime_unconfigured");
  const url = new URL(value),
    expected = new URL(ownerValue);
  if (
    !url.hostname.endsWith(".neon.tech") ||
    url.hostname !== expected.hostname ||
    decodeURIComponent(url.pathname.slice(1)) !== config.databases.runtime ||
    decodeURIComponent(url.username) !== config.role ||
    !/^platform_runtime_[a-f0-9]{12}$/.test(config.databases.runtime)
  )
    throw Error("clean_preview_runtime_required");
  const pool = new Pool({
    connectionString: value,
    max: 2,
    connectionTimeoutMillis: 15000,
    query_timeout: 15000,
  });
  const repository = new PostgresPoliticalRecords(pool);
  try {
    const row = (
      await pool.query(
        "SELECT current_database() db, current_user who, pg_has_role(current_user,'neon_superuser','MEMBER') elevated",
      )
    ).rows[0];
    if (
      row.db !== config.databases.runtime ||
      row.who !== config.role ||
      row.elevated
    )
      throw Error("restricted_clean_preview_required");
    if (process.argv.includes("--inspect")) {
      const publications = await repository.latest({
        kind: "publication",
        limit: 20,
      });
      const editions = await repository.latest({ kind: "edition", limit: 30 });
      const reviews = await repository.latest({
        kind: "publication_review",
        limit: 30,
      });
      const archive = new PrivateBlobArchive(token);
      const reviewEvidence = [];
      for (const record of reviews.records) {
        const id = record.payload.verificationCaptureId;
        if (typeof id !== "string") continue;
        const capture = await repository.getCapture(id);
        if (!capture) throw Error("independent_review_capture_missing");
        reviewEvidence.push({
          reviewRevisionId: record.revisionId,
          verification: JSON.parse(
            new TextDecoder().decode(await archive.read(capture)),
          ),
        });
      }
      const jobs = await repository.producerJobs(100, true);
      const failures = [];
      for (const job of jobs) {
        const ids = job.payload.failureCaptureIds;
        if (!Array.isArray(ids)) continue;
        for (const id of ids) {
          if (typeof id !== "string") continue;
          const capture = await repository.getCapture(id);
          if (!capture) throw Error("failure_capture_missing");
          failures.push({
            jobId: job.recordId,
            captureId: id,
            evidence: JSON.parse(
              new TextDecoder().decode(await archive.read(capture)),
            ),
          });
        }
      }
      const file = ".vercel/platform-primary-inspection.private.json";
      await writeFile(
        file,
        JSON.stringify(
          {
            publications,
            editions,
            reviews,
            reviewEvidence,
            jobs,
            failures,
          },
          null,
          2,
        ),
        { mode: 0o600 },
      );
      console.log(
        JSON.stringify({
          status: "inspected",
          publications: publications.records.length,
          editions: editions.records.length,
          approvedReviews: reviews.records.filter(
            (record) => record.payload.decision === "approve",
          ).length,
          reviewEvidenceCaptures: reviewEvidence.length,
          privateFile: file,
          providerCalls: 0,
          sends: 0,
        }),
      );
      return;
    }
    console.log(
      JSON.stringify(
        await prepareStoredCbsRehearsal(
          repository,
          new PrivateBlobArchive(token),
          locale as EmailLocale,
          new Date().toISOString(),
        ),
      ),
    );
  } finally {
    await repository.close();
  }
}
main().catch(() => {
  console.error(
    "actual_primary_rehearsal_unavailable; private configuration and source details withheld",
  );
  process.exitCode = 1;
});
