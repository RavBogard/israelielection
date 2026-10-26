/** Public projected archives only; source captures, subscriber state and credentials are never exported. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
async function main() {
  const origin = process.env.PUBLIC_ARCHIVE_SITE_ORIGIN,
    directory = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6),
    collection =
      process.argv.find((arg) => arg.startsWith("--collection="))?.slice(13) ??
      "events",
    election = process.argv
      .find((arg) => arg.startsWith("--election="))
      ?.slice(11);
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        requires:
          "PUBLIC_ARCHIVE_SITE_ORIGIN, --out, --collection, --election, --run",
      }),
    );
    return;
  }
  if (
    !origin ||
    !directory ||
    !["events", "elections", "entities", "publications"].includes(collection) ||
    !/^il-knesset-\d+$/.test(election ?? "")
  )
    throw new Error("archive_config_invalid");
  const base = new URL(origin);
  if (
    base.protocol !== "https:" ||
    base.pathname !== "/" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error("archive_origin_invalid");
  const root = path.resolve(directory);
  await mkdir(root, { recursive: true });
  let next: string | null =
      `${base.origin}/api/v2/bulk/${collection}?view=history&election=${election}`,
    count = 0;
  const parts = [];
  while (next && count < 1000) {
    const url = new URL(next);
    if (
      url.origin !== base.origin ||
      url.pathname !== `/api/v2/bulk/${collection}`
    )
      throw new Error("archive_link_invalid");
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("archive_unavailable");
    const manifest = (await response.json()) as {
      downloadUrl: string;
      sha256: string;
      nextManifestUrl: string | null;
      asOfCursor: string;
    };
    const download = new URL(manifest.downloadUrl);
    if (download.origin !== base.origin || download.pathname !== url.pathname)
      throw new Error("archive_download_invalid");
    const data = await fetch(download, {
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!data.ok) throw new Error("archive_part_unavailable");
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== manifest.sha256)
      throw new Error("archive_digest_mismatch");
    const filename = `part-${String(++count).padStart(5, "0")}.ndjson`;
    await writeFile(path.join(root, filename), bytes, { flag: "wx" });
    parts.push({ filename, ...manifest });
    next = manifest.nextManifestUrl;
  }
  if (next) throw new Error("archive_part_limit_incomplete");
  await writeFile(
    path.join(root, "manifest.json"),
    JSON.stringify(
      {
        schemaVersion: 2,
        electionId: election,
        collection,
        complete: true,
        parts,
      },
      null,
      2,
    ),
    { flag: "wx" },
  );
  console.log(JSON.stringify({ status: "exported", parts: count }));
}
main().catch(() => {
  console.error(
    "archive_incomplete; inspect/retry in a fresh directory, no complete manifest emitted",
  );
  process.exitCode = 1;
});
