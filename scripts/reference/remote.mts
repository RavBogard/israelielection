import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { generationDocuments } from "../../lib/reference/catalog";
import {
  validateTranslation,
  type TranslationDocument,
} from "../../lib/reference/translations";
import { referenceRemoteTarget } from "../../lib/reference/remote-target";
const arg = (key: string) => {
  const i = process.argv.indexOf(key);
  return i < 0 ? undefined : process.argv[i + 1];
};
const url = arg("--url"),
  id = arg("--id"),
  lang = arg("--lang") as TranslationDocument["lang"],
  out = arg("--out");
if (
  !url ||
  !id ||
  !out ||
  !generationDocuments.some((s) => s.id === id) ||
  !["he", "ar", "fa", "de", "fr", "zh"].includes(lang)
)
  throw Error(
    "Provide --url --id --lang --out with a registered source and locale",
  );
const { destination, signingSubject } = referenceRemoteTarget(
  url,
  arg("--subject-url"),
);
const key = process.env.QSTASH_CURRENT_SIGNING_KEY;
if (!key) throw Error("signing_key_unconfigured");
const reviewFile = arg("--review");
const candidate = reviewFile
  ? JSON.parse(readFileSync(reviewFile, "utf8"))
  : null;
if (candidate && (candidate.id !== id || candidate.lang !== lang))
  throw Error("candidate_identity_mismatch");
const raw = JSON.stringify(
    candidate
      ? {
          mode: "review",
          id,
          lang,
          sourceRevision: candidate.sourceRevision,
          blocks: candidate.blocks,
        }
      : { mode: "generate", id, lang },
  ),
  now = Math.floor(Date.now() / 1000),
  head = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ),
  claims = Buffer.from(
    JSON.stringify({
      iss: "Upstash",
      sub: signingSubject.href,
      nbf: now - 5,
      exp: now + 360,
      jti: randomUUID(),
      body: createHash("sha256").update(raw).digest("base64url"),
    }),
  ).toString("base64url"),
  signature = createHmac("sha256", key)
    .update(head + "." + claims)
    .digest("base64url");
const response = await fetch(destination, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Upstash-Signature": head + "." + claims + "." + signature,
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : {}),
  },
  body: raw,
  signal: AbortSignal.timeout(290000),
});
let body;
try {
  body = await response.json();
} catch {
  throw Error(`worker_http_${response.status}_invalid_json`);
}
const stem = join(resolve(out), `${id.replaceAll(":", "-")}.${lang}`);
mkdirSync(dirname(stem), { recursive: true });
if (!response.ok) {
  if (body.candidate)
    writeFileSync(
      stem + ".candidate.private.json",
      JSON.stringify(body.candidate, null, 2) + "\n",
    );
  const report = {
    id,
    lang,
    http: response.status,
    state: body.state,
    code: body.code,
    diagnostic: body.diagnostic,
    usage: body.usage ?? [],
    writes: body.writes,
  };
  writeFileSync(
    stem + ".rejected.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  process.exitCode = 1;
} else {
  const source = generationDocuments.find((s) => s.id === id)!;
  validateTranslation(body.translation, source);
  if (body.writes !== 0) throw Error("unexpected_remote_write");
  const file = stem + `.${source.revision.slice(0, 12)}.json`;
  writeFileSync(file, JSON.stringify(body.translation, null, 2) + "\n");
  const report = {
    id,
    lang,
    http: response.status,
    state: body.state,
    sourceRevision: source.revision,
    blocks: body.translation.blocks.length,
    usage: body.usage ?? [],
    widgets: body.widgets,
    writes: 0,
    file,
  };
  writeFileSync(stem + ".report.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
}
