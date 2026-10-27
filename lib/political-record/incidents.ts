import { Pool } from "pg";
import { recordHash } from "./hash";
import { safeCheck, type MonitorReport } from "./monitor-types";
import type { SqlPool } from "./postgres";
export class IncidentStore {
  constructor(
    private pool: SqlPool,
    private namespace = process.env.PLATFORM_MONITOR_NAMESPACE ??
      process.env.VERCEL_ENV ??
      "development",
  ) {
    if (!/^[a-zA-Z0-9:_-]{1,80}$/.test(namespace))
      throw new Error("monitor_namespace_invalid");
  }
  async record(report: MonitorReport) {
    if (
      report.schemaVersion !== 1 ||
      !/^[a-zA-Z0-9:_./-]{1,180}$/.test(report.runId) ||
      report.checks.length > 100
    )
      throw new Error("monitor_report_invalid");
    const checks = report.checks.map(safeCheck),
      client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      let transitions = 0,
        observations = 0;
      for (const check of checks) {
        const id = recordHash({
            namespace: this.namespace,
            scope: check.scope,
            subject: check.id,
          }),
          receiptId = recordHash({
            namespace: this.namespace,
            runId: report.runId,
            checkId: check.id,
          });
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
        const received = await client.query(
          "INSERT INTO political_private.operation_receipts(id,observed_at,namespace) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",
          [receiptId, check.checkedAt, this.namespace],
        );
        if (!received.rows.length) continue;
        observations++;
        const lastCheck = (
          await client.query(
            "SELECT * FROM political_private.operation_checks WHERE id=$1",
            [id],
          )
        ).rows[0];
        if (
          lastCheck &&
          Date.parse(String(lastCheck.observed_at)) >
            Date.parse(check.checkedAt)
        )
          continue;
        await client.query(
          "INSERT INTO political_private.operation_checks(id,observed_at,payload,namespace) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET observed_at=$2,payload=$3",
          [id, check.checkedAt, JSON.stringify(check), this.namespace],
        );
        const previous = (
          await client.query(
            "SELECT * FROM political_private.operation_incidents WHERE id=$1 FOR UPDATE",
            [id],
          )
        ).rows[0];
        if (
          previous &&
          Date.parse(String(previous.last_seen_at)) >
            Date.parse(check.checkedAt)
        )
          continue;
        const lastHealthy = (
          lastCheck?.payload as { state?: unknown } | undefined
        )?.state;
        const healthy = ["healthy_new", "healthy_no_new", "settled"].includes(
            check.state,
          ),
          state = healthy ? "resolved" : "open",
          severity = ["unavailable", "stale"].includes(check.state)
            ? "error"
            : "warning";
        if (!previous && healthy) continue;
        const changed =
          !previous ||
          previous.state !== state ||
          previous.reason_code !== check.reasonCode;
        await client.query(
          "INSERT INTO political_private.operation_incidents(id,scope,subject_id,state,severity,reason_code,first_seen_at,last_seen_at,resolved_at,failures,last_confirmed_healthy_at,last_observation,namespace) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET state=$4,severity=$5,reason_code=$6,last_seen_at=$7,resolved_at=$8,failures=CASE WHEN $4='open' THEN political_private.operation_incidents.failures+1 ELSE political_private.operation_incidents.failures END,last_confirmed_healthy_at=CASE WHEN $4='resolved' THEN $7 ELSE political_private.operation_incidents.last_confirmed_healthy_at END,last_observation=$11",
          [
            id,
            check.scope,
            check.id,
            state,
            severity,
            check.reasonCode,
            check.checkedAt,
            healthy ? check.checkedAt : null,
            healthy ? 0 : 1,
            healthy
              ? check.checkedAt
              : ["healthy_new", "healthy_no_new", "settled"].includes(
                    String(lastHealthy),
                  )
                ? lastCheck!.observed_at
                : null,
            JSON.stringify(check),
            this.namespace,
          ],
        );
        if (changed) {
          const transition = !previous
            ? "opened"
            : healthy
              ? "resolved"
              : "changed";
          await client.query(
            "INSERT INTO political_private.operation_incident_events(id,incident_id,observed_at,transition,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
            [
              recordHash({ receiptId, transition }),
              id,
              check.checkedAt,
              transition,
              JSON.stringify(check),
            ],
          );
          transitions++;
        }
      }
      await client.query("COMMIT");
      return { status: "stored", observations, transitions };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async status() {
    const client = await this.pool.connect();
    try {
      const rows = (
        await client.query(
          "SELECT subject_id,scope,state,severity,reason_code,last_seen_at,last_confirmed_healthy_at,failures FROM political_private.operation_incidents WHERE namespace=$1 ORDER BY state,last_seen_at DESC LIMIT 101",
          [this.namespace],
        )
      ).rows;
      const checks = (
        await client.query(
          "SELECT payload FROM political_private.operation_checks WHERE namespace=$1 ORDER BY observed_at DESC LIMIT 101",
          [this.namespace],
        )
      ).rows.map((row) =>
        safeCheck(row.payload as Parameters<typeof safeCheck>[0]),
      );
      return {
        status: "available",
        namespace: this.namespace,
        complete: checks.length <= 100 && rows.length <= 100,
        checks: checks.slice(0, 100),
        incidents: rows.slice(0, 100).map((row) => ({
          id: String(row.subject_id),
          scope: String(row.scope),
          state: String(row.state),
          severity: String(row.severity),
          reasonCode: String(row.reason_code),
          lastSeenAt: new Date(row.last_seen_at as string).toISOString(),
          lastConfirmedHealthyAt: row.last_confirmed_healthy_at
            ? new Date(row.last_confirmed_healthy_at as string).toISOString()
            : null,
          failures: Number(row.failures),
        })),
      };
    } finally {
      client.release();
    }
  }
  async close() {
    await this.pool.end();
  }
}
export function configuredIncidentStore() {
  if (
    process.env.PLATFORM_MONITOR_STORE_ENABLED !== "true" ||
    !process.env.POLITICAL_RECORD_DATABASE_URL
  )
    return null;
  const url = new URL(process.env.POLITICAL_RECORD_DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("monitor_store_unconfigured");
  return new IncidentStore(
    new Pool({
      connectionString: url.href,
      max: 1,
      connectionTimeoutMillis: 1500,
      statement_timeout: 5000,
      query_timeout: 6500,
    }),
  );
}
