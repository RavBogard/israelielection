import type { Pool, PoolClient } from "pg";
import { recordHash } from "./hash";
import { contentHash } from "./captures";
import type { PrivateCaptureRef } from "./types";

const TABLES = [
  "subscribers",
  "subscription_tokens",
  "deliveries",
  "publication_fanout",
  "webhook_receipts",
] as const;
const ORDER = [
  "id",
  "token_hash",
  "id",
  "publication_revision_id,locale",
  "id",
];
type PrivateData = {
  version: 1;
  kind: "private_subscription_export";
  tables: {
    name: (typeof TABLES)[number];
    columns: string[];
    rows: Record<string, unknown>[];
  }[];
};
export type PrivateBackup = { data: PrivateData; sha256: string };
async function columns(client: PoolClient, name: string) {
  return (
    await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='political_private' AND table_name=$1 ORDER BY ordinal_position",
      [name],
    )
  ).rows.map((row) => String(row.column_name));
}
/** Contains ciphertext/token hashes and consent metadata. Never a public download. */
export async function exportSubscriptions(
  pool: Pick<Pool, "connect">,
): Promise<PrivateBackup> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const tables: PrivateData["tables"] = [];
    for (const [i, name] of TABLES.entries()) {
      const names = await columns(client, name);
      if (!names.length) throw Error("private_export_schema_missing");
      tables.push({
        name,
        columns: names,
        rows: (
          await client.query(
            `SELECT * FROM political_private.${name} ORDER BY ${ORDER[i]}`,
          )
        ).rows,
      });
    }
    await client.query("COMMIT");
    const data = JSON.parse(
      JSON.stringify({
        version: 1,
        kind: "private_subscription_export",
        tables,
      }),
    ) as PrivateData;
    return { data, sha256: recordHash(data) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
/** Requires a migrated, empty private target and its already restored core FK records. */
export async function restoreSubscriptions(
  pool: Pick<Pool, "connect">,
  backup: PrivateBackup,
) {
  if (
    backup.data.version !== 1 ||
    backup.data.kind !== "private_subscription_export" ||
    recordHash(backup.data) !== backup.sha256 ||
    recordHash(backup.data.tables.map((t) => t.name)) !== recordHash(TABLES)
  )
    throw Error("private_backup_invalid");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const table of backup.data.tables) {
      if (
        recordHash(table.columns) !==
        recordHash(await columns(client, table.name))
      )
        throw Error("private_backup_schema_mismatch");
      if (
        (
          await client.query(
            `SELECT count(*)::int n FROM political_private.${table.name}`,
          )
        ).rows[0].n !== 0
      )
        throw Error("private_restore_target_not_empty");
    }
    for (const table of backup.data.tables)
      for (const row of table.rows) {
        const names = table.columns.map((name) => `"${name}"`).join(",");
        await client.query(
          `INSERT INTO political_private.${table.name} (${names}) VALUES (${table.columns.map((_, i) => `$${i + 1}`).join(",")})`,
          table.columns.map((name) =>
            Array.isArray(row[name]) ? JSON.stringify(row[name]) : row[name],
          ),
        );
      }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export type RecoveryManifest = {
  version: 1;
  prefix: string;
  objects: { captureId: string; hash: string; bytes: number; key: string }[];
};
export function recoveryPrefix(id: string) {
  if (!/^[a-f0-9]{12}$/.test(id)) throw Error("recovery_namespace_invalid");
  return `private-recovery/${id}`;
}
/** Reads ONLY copied recovery objects; deliberately cannot fall back to original keys. */
export async function readRecoveredCapture(
  ref: PrivateCaptureRef,
  manifest: RecoveryManifest,
  expectedManifestHash: string,
  get: (key: string) => Promise<Uint8Array>,
) {
  if (
    manifest.version !== 1 ||
    recordHash(manifest) !== expectedManifestHash ||
    !/^private-recovery\/[a-f0-9]{12}$/.test(manifest.prefix)
  )
    throw Error("recovery_manifest_invalid");
  const row = manifest.objects.find((item) => item.captureId === ref.captureId);
  if (
    !row ||
    row.hash !== ref.contentSha256 ||
    row.bytes !== ref.byteLength ||
    row.key !== `${manifest.prefix}/${row.hash}`
  )
    throw Error("recovery_capture_binding_invalid");
  const body = await get(row.key);
  if (body.length !== ref.byteLength || contentHash(body) !== ref.contentSha256)
    throw Error("recovery_capture_corrupt");
  return body;
}
