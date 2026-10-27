import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkPublicRegions } from "../../lib/political-record/globalping";
import { recordMonitorReport } from "../../lib/political-record/monitor-operations";
import type { MonitorReport } from "../../lib/political-record/monitor-types";
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        requires:
          "--run; fixed public URL only; no private headers or messages",
      }),
    );
    return;
  }
  const now = new Date().toISOString(),
    checks = await checkPublicRegions(now),
    report: MonitorReport = {
      schemaVersion: 1,
      runId: `public:${now.replaceAll(":", "-")}`,
      checkedAt: now,
      checks,
      recovery: {
        policy: "bounded_read_only_retry",
        maxAttempts: 3,
        destructiveActions: false,
        messagesSent: false,
      },
    };
  const persistence =
    process.env.PLATFORM_MONITOR_STORE_ENABLED === "true"
      ? await recordMonitorReport(report)
      : { status: "disabled" };
  const file = process.argv
    .find((argument) => argument.startsWith("--out="))
    ?.slice(6);
  if (file) {
    await mkdir(path.dirname(path.resolve(file)), { recursive: true });
    await writeFile(file, JSON.stringify({ ...report, persistence }, null, 2));
  }
  console.log(JSON.stringify({ status: "checked", checks, persistence }));
  if (
    checks.some(
      (check) =>
        !["healthy_new", "healthy_no_new", "settled"].includes(check.state),
    )
  )
    process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "monitor_unavailable; no raw network/source/provider details emitted",
  );
  process.exitCode = 1;
});
