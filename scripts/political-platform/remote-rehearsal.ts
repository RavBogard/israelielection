import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  rehearsalRemoteRequest,
  rehearsalRemoteReceipt,
} from "../../lib/political-record/remote-rehearsal";
const arg = (key: string) => {
  const i = process.argv.indexOf(key);
  return i < 0 ? undefined : process.argv[i + 1];
};
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        writes: 0,
        requests: 0,
        requires:
          "--run --target preview --mode platform_collect|platform_publish --url exact-preview-worker --subject-url same-url --out ignored-receipt; POLITICAL_PLATFORM_PREVIEW_ORIGIN",
      }),
    );
    return;
  }
  if (arg("--target") !== "preview") throw Error("preview_only");
  const outputRoot = path.resolve(".vercel"),
    output = path.resolve(
      arg("--out") ?? ".vercel/platform-hosted-rehearsal.receipt.json",
    );
  if (!output.startsWith(outputRoot + path.sep) || !output.endsWith(".json"))
    throw Error("ignored_receipt_path_required");
  const request = rehearsalRemoteRequest({
    url: arg("--url") ?? "",
    subject: arg("--subject-url") ?? "",
    previewOrigin: process.env.POLITICAL_PLATFORM_PREVIEW_ORIGIN ?? "",
    environment: process.env.VERCEL_ENV ?? "",
    mode: arg("--mode") ?? "",
    key: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
    bypass:
      process.env.ELECTION_PREVIEW_PROTECTION_BYPASS ??
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  });
  const response = await fetch(request.destination, {
    method: "POST",
    headers: request.headers,
    body: request.body,
    redirect: "error",
    signal: AbortSignal.timeout(60000),
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* Never publish HTML/WAF/provider response content. */
  }
  const receipt = {
    checkedAt: new Date().toISOString(),
    mode: arg("--mode"),
    ...rehearsalRemoteReceipt(response.status, body),
    noAutomaticSchedulesCreated: true,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(receipt, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(receipt));
  const status =
    body && typeof body === "object"
      ? String((body as { status?: unknown }).status)
      : "";
  if (
    !response.ok ||
    !["stored", "review", "done", "idle", "waiting"].includes(status)
  )
    process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "owned_preview_remote_unavailable; signatures, credentials and raw responses withheld",
  );
  process.exitCode = 1;
});
