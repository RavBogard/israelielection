import { Client } from "pg";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { ownerAliasUpdates } from "../../lib/political-record/owner-rotation";
import { recordHash } from "../../lib/political-record/hash";
const envFile = ".vercel/platform-services.private.env",
  runtimeFile = ".vercel/platform-runtime.private.env",
  configFile = ".vercel/platform-storage-rehearsal.private.json",
  receiptFile = ".vercel/platform-owner-rotation.receipt.json";
let stage = "configuration";
async function connect(value: string) {
  const client = new Client({
    connectionString: value,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end().catch(() => {});
    throw error;
  }
}
async function authRejected(value: string) {
  try {
    const client = await connect(value);
    await client.end();
    return false;
  } catch (error) {
    return ["28P01", "28000"].includes(
      String((error as { code?: string }).code),
    );
  }
}
function check(value: unknown, code: string): asserts value {
  if (!value) throw Error(code);
}
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        rotations: 0,
        requires:
          "--run --target=preview; approved new-project owner credentials and existing restricted-runtime qualification",
      }),
    );
    return;
  }
  check(
    process.argv.includes("--target=preview") &&
      process.env.VERCEL_ENV === "preview",
    "preview_only",
  );
  let previous: { status?: string } | null = null;
  try {
    previous = JSON.parse(await readFile(receiptFile, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  check(
    previous?.status !== "passed",
    "owner_already_rotated_receipt_preserved",
  );
  const raw = await readFile(envFile, "utf8"),
    values = parseEnv(raw),
    runtimeRaw = await readFile(runtimeFile, "utf8"),
    configRaw = await readFile(configFile, "utf8");
  const config = JSON.parse(configRaw) as {
      role: string;
      databases: Record<string, string>;
    },
    runtimeUrl = parseEnv(runtimeRaw).POLITICAL_RECORD_DATABASE_URL;
  const original = values.POLITICAL_RECORD_DATABASE_URL_UNPOOLED;
  check(original && runtimeUrl, "owner_and_runtime_credentials_required");
  const owner = new URL(original),
    runtime = new URL(runtimeUrl),
    ownerName = decodeURIComponent(owner.username);
  check(
    owner.hostname.endsWith(".neon.tech") &&
      owner.hostname === runtime.hostname &&
      /^[a-zA-Z0-9_-]{1,63}$/.test(ownerName) &&
      ownerName !== config.role &&
      decodeURIComponent(runtime.username) === config.role &&
      decodeURIComponent(runtime.pathname.slice(1)) ===
        config.databases.runtime,
    "approved_new_project_binding_required",
  );
  const pooled = Object.values(values).find((value) => {
    if (typeof value !== "string") return false;
    if (!/^postgres(?:ql)?:\/\//.test(value)) return false;
    const url = new URL(value);
    return (
      url.hostname.replace(/-pooler(?=\.)/, "") === owner.hostname &&
      url.hostname.includes("-pooler.") &&
      decodeURIComponent(url.username) === ownerName &&
      decodeURIComponent(url.password) === decodeURIComponent(owner.password)
    );
  });
  check(pooled, "original_pooled_owner_url_required");
  const client = await connect(original);
  const password = randomBytes(32).toString("base64url"),
    next = new URL(original);
  next.password = password;
  const updated = ownerAliasUpdates(raw, original, password);
  try {
    const identity = (await client.query("SELECT current_user who")).rows[0];
    check(identity.who === ownerName, "owner_identity_mismatch");
    const databases = (
      await client.query(
        "SELECT count(*)::int n FROM pg_database WHERE datname=ANY($1::text[]) AND pg_get_userbyid(datdba)=$2",
        [Object.values(config.databases), ownerName],
      )
    ).rows[0];
    check(databases.n === 3, "new_project_owned_databases_required");
    // Retain recoverable new credentials privately before the single irreversible password operation.
    await writeFile(
      ".vercel/platform-owner-rotation.private.env",
      `POLITICAL_RECORD_DATABASE_URL_UNPOOLED=${JSON.stringify(next.toString())}\n`,
      { mode: 0o600 },
    );
    await writeFile(
      ".vercel/platform-owner-prior.private.env",
      `OLD_OWNER_DIRECT_URL=${JSON.stringify(original)}\nOLD_OWNER_POOLED_URL=${JSON.stringify(pooled)}\n`,
      { mode: 0o600 },
    );
    stage = "rotate_owner_password";
    await client.query(`ALTER ROLE "${ownerName}" PASSWORD '${password}'`);
  } finally {
    await client.end();
  }
  stage = "verify_new_owner";
  const fresh = await connect(next.toString());
  try {
    check(
      (await fresh.query("SELECT current_user who")).rows[0].who === ownerName,
      "new_owner_login_failed",
    );
  } finally {
    await fresh.end();
  }
  stage = "update_operator_aliases";
  check(
    (await readFile(envFile, "utf8")) === raw,
    "operator_env_changed_during_rotation_use_private_recovery_file",
  );
  await writeFile(envFile, updated.content, { mode: 0o600 });
  check(
    parseEnv(await readFile(envFile, "utf8")).POLITICAL_RECORD_BLOB_TOKEN ===
      values.POLITICAL_RECORD_BLOB_TOKEN,
    "blob_alias_changed",
  );
  stage = "verify_old_credentials_rejected";
  let directRejected = false,
    pooledRejected = false;
  for (
    let attempt = 0;
    attempt < 6 && (!directRejected || !pooledRejected);
    attempt++
  ) {
    directRejected = await authRejected(original);
    pooledRejected = await authRejected(pooled);
    if (!directRejected || !pooledRejected)
      await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  check(
    directRejected && pooledRejected,
    "old_owner_authentication_not_rejected",
  );
  stage = "verify_runtime_unchanged";
  const restricted = await connect(runtimeUrl);
  try {
    const identity = (
      await restricted.query(
        "SELECT current_user who,pg_has_role(current_user,'neon_superuser','MEMBER') elevated",
      )
    ).rows[0];
    check(
      identity.who === config.role && !identity.elevated,
      "restricted_runtime_changed",
    );
  } finally {
    await restricted.end();
  }
  check(
    recordHash(await readFile(runtimeFile, "utf8")) ===
      recordHash(runtimeRaw) &&
      recordHash(await readFile(configFile, "utf8")) === recordHash(configRaw),
    "restricted_private_configuration_changed",
  );
  const receipt = {
    status: "passed",
    checkedAt: new Date().toISOString(),
    scope: "new_preview_neon_owner_only",
    newOwnerWorks: true,
    oldDirectRejected: directRejected,
    oldPooledRejected: pooledRejected,
    restrictedRuntimeWorks: true,
    restrictedConfigurationUnchanged: true,
    blobAliasUnchanged: true,
    aliasesUpdated: updated.keys.length,
    existingSessionsTerminated: false,
    productionWrites: 0,
    emailSends: 0,
    flagsChanged: false,
    schedulesChanged: false,
  };
  await writeFile(receiptFile, JSON.stringify(receipt, null, 2), {
    mode: 0o600,
  });
  console.log(JSON.stringify(receipt));
}
main().catch(async (error) => {
  const category =
    error instanceof Error && /^[a-z_]{1,100}$/.test(error.message)
      ? error.message
      : "owner_rotation_failed";
  const receipt = { status: "failed", stage, category, secretsLogged: false };
  let file = receiptFile;
  try {
    if (JSON.parse(await readFile(receiptFile, "utf8")).status === "passed")
      file = ".vercel/platform-owner-rotation.last-attempt.receipt.json";
  } catch {}
  await writeFile(file, JSON.stringify(receipt, null, 2), {
    mode: 0o600,
  }).catch(() => {});
  console.error(JSON.stringify(receipt));
  process.exitCode = 1;
});
