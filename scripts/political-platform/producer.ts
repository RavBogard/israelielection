import {
  runPublicationProducer,
  queueReviewedBriefing,
} from "../../lib/political-record/producer";
import { readFile } from "node:fs/promises";
import type { Briefing } from "../../lib/briefing";
async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        writes: 0,
        sends: 0,
        requires:
          "--run --target=preview; configured private database/archive and explicit producer flag",
      }),
    );
    return;
  }
  const target = process.argv
    .find((arg) => arg.startsWith("--target="))
    ?.slice(9);
  if (
    !["preview", "development"].includes(target ?? "") ||
    process.env.VERCEL_ENV === "production"
  )
    throw Error("preview_or_development_only");
  const file = process.argv
    .find((arg) => arg.startsWith("--briefing="))
    ?.slice(11);
  const result = file
    ? await queueReviewedBriefing(
        JSON.parse(await readFile(file, "utf8")) as Briefing,
      )
    : await runPublicationProducer();
  console.log(JSON.stringify({ ...result, sends: 0 }));
}
main().catch(() => {
  console.error(
    "publication_producer_unavailable; private diagnostic details withheld",
  );
  process.exitCode = 1;
});
