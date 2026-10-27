import { expect, it } from "vitest";
import { parseEnv } from "node:util";
import { ownerAliasUpdates } from "./owner-rotation";
const old = "old-fixture-password",
  next = "n".repeat(43);
const direct = `postgresql://owner:${old}@ep-new.region.neon.tech/neondb?sslmode=require`;
const pooled = `postgresql://owner:${old}@ep-new-pooler.region.neon.tech/neondb?sslmode=require`;
const runtime =
  "postgresql://runtime:runtime-fixture@ep-new.region.neon.tech/platform_runtime_012345abcdef";
it("updates only matching new-project owner URL/password aliases", () => {
  const raw = `POLITICAL_RECORD_DATABASE_URL_UNPOOLED=${JSON.stringify(direct)}\nPOLITICAL_RECORD_DATABASE_URL=${JSON.stringify(pooled)}\nPOLITICAL_RECORD_PGPASSWORD=${old}\nPOLITICAL_RECORD_BLOB_TOKEN=blob-fixture\nPOLITICAL_RECORD_RUNTIME_URL=${JSON.stringify(runtime)}\nOTHER_URL=${JSON.stringify(direct)}\n`;
  const result = ownerAliasUpdates(raw, direct, next),
    values = parseEnv(result.content);
  expect(result.keys).toHaveLength(3);
  expect(
    decodeURIComponent(new URL(values.POLITICAL_RECORD_DATABASE_URL!).password),
  ).toBe(next);
  expect(values.POLITICAL_RECORD_PGPASSWORD).toBe(next);
  expect(values.POLITICAL_RECORD_RUNTIME_URL).toBe(runtime);
  expect(values.POLITICAL_RECORD_BLOB_TOKEN).toBe("blob-fixture");
  expect(values.OTHER_URL).toBe(direct);
});
it("never rewrites another project or a restricted runtime password", () => {
  const other = direct.replace("ep-new", "ep-other");
  const raw = `POLITICAL_RECORD_DATABASE_URL_UNPOOLED=${JSON.stringify(direct)}\nPOLITICAL_RECORD_OTHER_URL=${JSON.stringify(other)}\nPOLITICAL_RECORD_RUNTIME_URL=${JSON.stringify(runtime)}`;
  const result = parseEnv(ownerAliasUpdates(raw, direct, next).content);
  expect(result.POLITICAL_RECORD_OTHER_URL).toBe(other);
  expect(result.POLITICAL_RECORD_RUNTIME_URL).toBe(runtime);
});
it("requires a valid generated password and retained operator URL", () => {
  expect(() => ownerAliasUpdates("", direct, next)).toThrow(
    "operator_owner_url_missing",
  );
  expect(() =>
    ownerAliasUpdates(
      `POLITICAL_RECORD_DATABASE_URL_UNPOOLED=${direct}`,
      direct,
      "unsafe'password",
    ),
  ).toThrow("rotation_password_format_invalid");
});
