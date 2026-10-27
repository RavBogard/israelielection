import type { Pool } from "pg";
import { recordHash } from "./hash";

export const STORAGE_MIGRATIONS = [
  "001-political-record.sql",
  "002-subscriptions.sql",
  "003-platform-workspaces.sql",
  "004-distribution.sql",
  "005-operations.sql",
  "006-publication-evidence.sql",
];
export const CORE_TABLES = [
  "source_revisions",
  "private_captures",
  "record_revisions",
  "outbox_intents",
] as const;
export type LogicalExport = {
  schemaVersion: 1;
  kind: "private_logical_core_export";
  tables: {
    name: (typeof CORE_TABLES)[number];
    columns: string[];
    rows: Record<string, unknown>[];
  }[];
};
export function rehearsalIdentifier(value: string) {
  if (!/^platform_(?:qa|restore|runtime|app)_[a-f0-9]{12}$/.test(value))
    throw Error("rehearsal_identifier_invalid");
  return `"${value}"`;
}
/** Restricted runtime is not an owner/migrator and cannot mutate historical facts. */
export function runtimeGrants(database: string, role: string) {
  const db = rehearsalIdentifier(database),
    app = rehearsalIdentifier(role);
  return `REVOKE ALL ON DATABASE ${db} FROM PUBLIC;
GRANT CONNECT ON DATABASE ${db} TO ${app};
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA political_record, political_private FROM PUBLIC;
GRANT USAGE ON SCHEMA political_record, political_private TO ${app};
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA political_record TO ${app};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA political_record TO ${app};
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA political_private TO ${app};
REVOKE UPDATE ON political_private.operation_incident_events FROM ${app};`;
}
/** A consistent application logical export, not a provider snapshot/PITR claim. Stored privately. */
export async function exportCore(
  pool: Pick<Pool, "connect">,
): Promise<LogicalExport> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const tables: LogicalExport["tables"] = [];
    for (const name of CORE_TABLES) {
      const columns = (
        await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema='political_record' AND table_name=$1 ORDER BY ordinal_position",
          [name],
        )
      ).rows.map((row) => String(row.column_name));
      if (!columns.length) throw Error("export_schema_missing");
      const primary =
        name === "private_captures"
          ? "capture_id"
          : name === "outbox_intents"
            ? "id"
            : "revision_id";
      const rows = (
        await client.query(
          `SELECT * FROM political_record.${name} ORDER BY ${primary}`,
        )
      ).rows;
      tables.push({ name, columns, rows });
    }
    await client.query("COMMIT");
    return JSON.parse(
      JSON.stringify({
        schemaVersion: 1,
        kind: "private_logical_core_export",
        tables,
      }),
    ) as LogicalExport;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function restoreCore(
  pool: Pick<Pool, "connect">,
  backup: LogicalExport,
) {
  if (
    backup.schemaVersion !== 1 ||
    backup.kind !== "private_logical_core_export" ||
    recordHash(backup.tables.map((t) => t.name)) !== recordHash(CORE_TABLES)
  )
    throw Error("restore_format_invalid");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of backup.tables) {
      if (table.columns.some((column) => !/^[a-z_][a-z0-9_]*$/.test(column)))
        throw Error("restore_column_invalid");
      const count = await client.query(
        `SELECT count(*)::int n FROM political_record.${table.name}`,
      );
      if (count.rows[0].n !== 0) throw Error("restore_target_not_empty");
      const columns = table.columns.map((column) => `"${column}"`).join(",");
      const placeholders = table.columns.map((_, i) => `$${i + 1}`).join(",");
      for (const row of table.rows)
        await client.query(
          `INSERT INTO political_record.${table.name} (${columns}) ${table.name === "record_revisions" ? "OVERRIDING SYSTEM VALUE" : ""} VALUES (${placeholders})`,
          table.columns.map((column) => row[column]),
        );
    }
    await client.query(
      "SELECT setval(pg_get_serial_sequence('political_record.record_revisions','insertion_cursor'),GREATEST(COALESCE(max(insertion_cursor),0),1),count(*)>0) FROM political_record.record_revisions",
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export function exportReceipt(backup: LogicalExport) {
  return {
    kind: backup.kind,
    hash: recordHash(backup),
    tables: backup.tables.map((table) => ({
      name: table.name,
      rows: table.rows.length,
      hash: recordHash(table),
    })),
  };
}
