import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { referenceDocuments } from "../../lib/reference/catalog";
import ledgerJson from "../../lib/reference/published-translations.json";
import type { TranslationDocument } from "../../lib/reference/translations";
import {
  referenceBatchPlan,
  canStartReferenceEdition,
} from "../../lib/reference/batch";
import { generateReferenceTranslation } from "../../lib/reference/generation";
const arg = (key: string) => {
  const at = process.argv.indexOf(key);
  return at < 0 ? undefined : process.argv[at + 1];
};
const out = arg("--out"),
  maxEditions = Number(arg("--max-editions")),
  maxMinutes = Number(arg("--max-minutes"));
if (!out) throw Error("batch_output_required");
const ids =
    arg("--ids") === "all"
      ? referenceDocuments.map((s) => s.id)
      : (arg("--ids") ?? "").split(",").filter(Boolean),
  langs = (arg("--langs") ?? "").split(",").filter(Boolean);
const plan = referenceBatchPlan(
  referenceDocuments,
  ledgerJson.documents as TranslationDocument[],
  { ids, langs, maxEditions, maxMinutes },
);
const deadline = Date.now() + maxMinutes * 60000,
  folder = resolve(out),
  validated = join(folder, "validated");
mkdirSync(validated, { recursive: true });
const results: {
  id: string;
  lang: string;
  status: "validated" | "rejected" | "deferred";
  usage?: object[];
  code?: string;
  sourceRevision?: string;
  diagnostic?: Record<string, unknown>;
}[] = [];
let cursor = 0;
async function worker() {
  while (cursor < plan.selected.length) {
    if (!canStartReferenceEdition(deadline, Date.now())) return;
    const item = plan.selected[cursor++];
    try {
      const result = await generateReferenceTranslation(
          item.id,
          item.lang,
          true,
        ),
        translation = result.translation;
      writeFileSync(
        join(
          validated,
          `${item.id.replaceAll(":", "-")}.${item.lang}.${translation.sourceRevision.slice(0, 12)}.json`,
        ),
        JSON.stringify(translation, null, 2) + "\n",
      );
      results.push({
        ...item,
        status: "validated",
        sourceRevision: translation.sourceRevision,
        usage: result.usage,
      });
      console.log(
        JSON.stringify({ ...item, status: "validated", usage: result.usage }),
      );
    } catch (error) {
      const failure = error as {
        message?: string;
        usage?: object[];
        diagnostic?: Record<string, unknown>;
      };
      const code = /^[a-z0-9_]{1,80}$/.test(failure.message ?? "")
        ? failure.message
        : "translation_failed";
      results.push({
        ...item,
        status: "rejected",
        code,
        usage: failure.usage ?? [],
        diagnostic: failure.diagnostic,
      });
      console.log(
        JSON.stringify({
          ...item,
          status: "rejected",
          code,
          usage: failure.usage ?? [],
          diagnostic: failure.diagnostic,
        }),
      );
    }
  }
}
await Promise.all([worker(), worker()]);
for (const item of [...plan.selected.slice(cursor), ...plan.deferred])
  results.push({ ...item, status: "deferred" });
const summary = {
  generatedAt: new Date().toISOString(),
  concurrency: 2,
  perEditionSeconds: 540,
  maxMinutes,
  maxEditions,
  skipped: plan.skipped,
  results,
  publicWrites: 0,
};
writeFileSync(
  join(folder, "summary.json"),
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    validated: results.filter((r) => r.status === "validated").length,
    rejected: results.filter((r) => r.status === "rejected").length,
    deferred: results.filter((r) => r.status === "deferred").length,
    skipped: plan.skipped.length,
    publicWrites: 0,
  }),
);
