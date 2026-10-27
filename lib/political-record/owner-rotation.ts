import { parseEnv } from "node:util";
export function ownerAliasUpdates(
  raw: string,
  ownerUrl: string,
  password: string,
) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(password))
    throw Error("rotation_password_format_invalid");
  const owner = new URL(ownerUrl),
    oldPassword = decodeURIComponent(owner.password),
    username = decodeURIComponent(owner.username);
  const host = (value: string) => value.replace(/-pooler(?=\.)/, "");
  const parsed = parseEnv(raw),
    updates = new Map<string, string>();
  for (const [key, value] of Object.entries(parsed)) {
    if (!key.startsWith("POLITICAL_RECORD_") || typeof value !== "string")
      continue;
    if (/(?:PGPASSWORD|POSTGRES_PASSWORD)$/.test(key) && value === oldPassword)
      updates.set(key, password);
    if (!/^postgres(?:ql)?:\/\//.test(value)) continue;
    const url = new URL(value);
    if (
      host(url.hostname) !== host(owner.hostname) ||
      decodeURIComponent(url.username) !== username ||
      decodeURIComponent(url.password) !== oldPassword
    )
      continue;
    url.password = password;
    updates.set(key, url.toString());
  }
  if (!updates.has("POLITICAL_RECORD_DATABASE_URL_UNPOOLED"))
    throw Error("operator_owner_url_missing");
  const content = raw
    .split(/\r?\n/)
    .map((line) => {
      const key = line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1];
      return key && updates.has(key)
        ? `${key}=${JSON.stringify(updates.get(key))}`
        : line;
    })
    .join("\n");
  return { content, keys: [...updates.keys()] };
}
