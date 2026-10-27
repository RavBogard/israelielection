import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderedChecks } from "../../lib/political-record/render-monitor";
import {
  safeCheck,
  type MonitorReport,
  type MonitorCheck,
} from "../../lib/political-record/monitor-types";
import { recordMonitorReport } from "../../lib/political-record/monitor-operations";
import { groupedWarnings } from "../../lib/political-record/monitor-sources";
import { publicStoredSourceChecks } from "../../lib/political-record/monitor-public-sources";
import { publicationProducerChecks } from "../../lib/political-record/monitor-producer";
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        requires: "--run; existing sanitized browser/region reports",
      }),
    );
    return;
  }
  const now = new Date().toISOString();
  let browser: unknown = null;
  try {
    browser = JSON.parse(
      await readFile(".vercel/platform-monitor-browser/result.json", "utf8"),
    );
  } catch {
    /* Unknown is not pass. */
  }
  const checks: MonitorCheck[] = renderedChecks(browser, now);
  if (process.env.PLATFORM_MONITOR_SOURCE_STATUS_ENABLED === "true")
    checks.push(
      ...(await publicStoredSourceChecks(now)),
      ...(await publicationProducerChecks(now)),
    );
  try {
    const regions = JSON.parse(
      await readFile(".vercel/platform-monitor-regions.json", "utf8"),
    ) as MonitorReport;
    if (
      Date.parse(now) - Date.parse(regions.checkedAt) <= 15 * 60000 &&
      Date.parse(regions.checkedAt) <= Date.parse(now)
    )
      checks.push(...regions.checks.map(safeCheck));
  } catch {
    /* Region checks can be deliberately omitted in a preview-only manual run. */
  }
  const runId = `ci:${process.env.GITHUB_RUN_ID ?? now.replaceAll(":", "-")}:${process.env.GITHUB_RUN_ATTEMPT ?? "local"}`,
    report: MonitorReport = {
      schemaVersion: 1,
      runId,
      checkedAt: now,
      checks,
      recovery: {
        policy: "bounded_read_only_retry",
        maxAttempts: 3,
        destructiveActions: false,
        messagesSent: false,
      },
    };
  const persistence = await recordMonitorReport(report),
    output = { ...report, groups: groupedWarnings(checks), persistence };
  const filename = process.argv
    .find((arg) => arg.startsWith("--out="))
    ?.slice(6);
  if (filename) {
    await mkdir(path.dirname(path.resolve(filename)), { recursive: true });
    await writeFile(filename, JSON.stringify(output, null, 2));
  }
  console.log(
    JSON.stringify({
      status: "summarized",
      checks: checks.map(({ id, state, reasonCode, attempts }) => ({
        id,
        state,
        reasonCode,
        attempts,
      })),
      persistence,
    }),
  );
  if (
    process.env.PLATFORM_MONITOR_SOURCE_STATUS_ENABLED === "true" &&
    checks.some(
      (check) =>
        (check.scope === "source" ||
          check.id === "platform:publication_producer" ||
          check.id === "sources:public_stored_status") &&
        ["unavailable", "stale", "disputed"].includes(check.state),
    )
  )
    process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "monitor_summary_unavailable; no raw browser/source/provider details emitted",
  );
  process.exitCode = 1;
});
