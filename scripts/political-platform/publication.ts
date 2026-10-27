/** Private preview authoring: read an independently reviewed artifact, never source facts from public input. */
import { readFile } from "node:fs/promises";
import { configuredPoliticalRecords } from "../../lib/political-record/postgres";
import { configuredCaptureArchive } from "../../lib/political-record/blob";
import {
  storeReviewedPublicationEdition,
  type IndependentReview,
} from "../../lib/political-record/publications";
import type { EmailLocale } from "../../lib/political-record/email";
async function main() {
  const input = process.argv
      .find((argument) => argument.startsWith("--input="))
      ?.slice(8),
    target = process.argv
      .find((argument) => argument.startsWith("--target="))
      ?.slice(9);
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify({
        status: "dry_run",
        requires:
          "private --input artifact, --run --target=preview|development, configured private archive",
      }),
    );
    return;
  }
  if (
    !input ||
    !["preview", "development"].includes(target ?? "") ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  )
    throw new Error("preview_authoring_only");
  const repository = configuredPoliticalRecords();
  if (!repository) throw new Error("store_unconfigured");
  try {
    const artifact = JSON.parse(await readFile(input, "utf8")) as {
      publicationRevisionId: string;
      locale: EmailLocale;
      content: unknown;
      review: IndependentReview;
    };
    const edition = await storeReviewedPublicationEdition(
      repository,
      artifact.publicationRevisionId,
      artifact.locale,
      artifact.content,
      artifact.review,
      configuredCaptureArchive(),
      new Date().toISOString(),
    );
    console.log(
      JSON.stringify({
        status: "stored",
        editionRevisionId: edition.revisionId,
      }),
    );
  } finally {
    try {
      await repository.close();
    } catch {
      /* No private diagnostics. */
    }
  }
}
main().catch(() => {
  console.error(
    "publication_not_promoted; private artifact/provider/source details withheld",
  );
  process.exitCode = 1;
});
