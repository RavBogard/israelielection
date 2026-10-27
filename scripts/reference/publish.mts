import { sourceRevision } from "../../lib/reference/source.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import {
  validateTranslation,
  type TranslationDocument,
} from "../../lib/reference/translations";
import { generationDocuments } from "../../lib/reference/catalog";
const input = process.argv[2];
if (!input)
  throw Error(
    "Provide a translation JSON file; validation is the default, --publish saves a validated revision",
  );
const document = JSON.parse(readFileSync(input, "utf8")) as TranslationDocument;
const source = generationDocuments.find((s) => s.id === document.id);
if (!source) throw Error("unknown_source");
if (sourceRevision(readFileSync(source.file)) !== source.revision)
  throw Error("source_revision_changed");
validateTranslation(document, source);
if (process.argv.includes("--publish")) {
  const target = "lib/reference/published-translations.json",
    ledger = JSON.parse(readFileSync(target, "utf8"));
  if (
    ledger.documents.some(
      (d: TranslationDocument) =>
        d.id === document.id &&
        d.lang === document.lang &&
        d.sourceRevision === document.sourceRevision &&
        d.publishedAt === document.publishedAt,
    )
  )
    throw Error("duplicate_translation");
  ledger.documents.push(document);
  writeFileSync(target, JSON.stringify(ledger, null, 2) + "\n");
}
console.log(
  JSON.stringify({
    id: document.id,
    lang: document.lang,
    sourceRevision: document.sourceRevision,
    status: document.status,
    published: process.argv.includes("--publish"),
  }),
);
