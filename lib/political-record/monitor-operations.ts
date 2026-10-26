import { activeWorkspaceId } from "./workspace-server";
import { currentElection } from "./registry";
import { lifecycleStore } from "../election-lifecycle/store";
import { sourceAvailabilityChecks, groupedWarnings } from "./monitor-sources";
import { boundedReadRetry, type MonitorReport } from "./monitor-types";
import { configuredIncidentStore } from "./incidents";
export async function recordMonitorReport(report: MonitorReport) {
  let store: ReturnType<typeof configuredIncidentStore> = null;
  try {
    store = configuredIncidentStore();
    if (!store) return { status: "unconfigured" };
    return await store.record(report);
  } catch {
    return { status: "unavailable" };
  } finally {
    try {
      await store?.close();
    } catch {
      /* Preserve the actual recording result. */
    }
  }
}
export async function storedSourceMonitor() {
  const now = new Date().toISOString(),
    store = lifecycleStore();
  const read = store
    ? await boundedReadRetry(
        () => store.load(),
        (value) => value !== null,
      )
    : { value: null, attempts: 0, recovered: false };
  const activeId = await activeWorkspaceId();
  const checks = sourceAvailabilityChecks(
    read.value ?? null,
    now,
    process.env.ELECTION_FORMATION_ENABLED === "true" &&
      activeId === currentElection().id,
  ).map((check) => ({ ...check, attempts: read.attempts }));
  const report: MonitorReport = {
    schemaVersion: 1,
    runId: `sources:${now.slice(0, 16).replaceAll(":", "-")}`,
    checkedAt: now,
    checks,
    recovery: {
      policy: "bounded_read_only_retry",
      maxAttempts: 3,
      destructiveActions: false,
      messagesSent: false,
    },
  };
  return {
    ...report,
    groups: groupedWarnings(checks),
    persistence: await recordMonitorReport(report),
  };
}
export async function privateMonitorStatus() {
  let store: ReturnType<typeof configuredIncidentStore> = null;
  try {
    store = configuredIncidentStore();
    return store
      ? await store.status()
      : { status: "unconfigured", incidents: [], checks: [] };
  } catch {
    return { status: "unavailable", incidents: [], checks: [] };
  } finally {
    try {
      await store?.close();
    } catch {
      /* Status contains no private errors. */
    }
  }
}
