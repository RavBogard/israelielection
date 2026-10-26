/** Internal preview/development rehearsal runner. Production runs use the existing signed worker. */
import { collectPlatformSources } from "../../lib/political-record/operations";
import { runSubscriptionWorker } from "../../lib/political-record/subscription-routes";
async function main() {
  const mode = process.argv[2],
    target = process.argv
      .find((argument) => argument.startsWith("--target="))
      ?.slice(9);
  if (!["collect", "deliver"].includes(mode)) throw new Error("unknown_mode");
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        mode,
        requires:
          "explicit --run --target=development|preview and configured capability flags",
      }),
    );
    return;
  }
  if (
    !["development", "preview"].includes(target ?? "") ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  )
    throw new Error("production_cli_forbidden");
  const result =
    mode === "collect"
      ? await collectPlatformSources()
      : await runSubscriptionWorker();
  console.log(JSON.stringify(result));
}
main().catch(() => {
  console.error(
    "platform_operation_unavailable; no private recipient/source/provider details emitted",
  );
  process.exitCode = 1;
});
