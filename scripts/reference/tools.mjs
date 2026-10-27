import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { sourceRevision } from "../../lib/reference/source.mjs";
import { invariants } from "./source-blocks.mjs";
const definitions = [
  {
    id: "tools:glossary",
    file: "data/glossary.json",
    path: "/glossary",
    title: "Election glossary",
    fields: [/^terms\.\d+\.(?:term|def)$/],
  },
  {
    id: "tools:quiz",
    file: "data/quiz.json",
    path: "/match",
    title: "Party match questions",
    fields: [
      /^(?:core|deeper)\.\d+\.(?:prompt|context)$/,
      /^(?:core|deeper)\.\d+\.options\.[^.]+$/,
    ],
  },
  {
    id: "tools:journeys",
    file: "data/journeys.json",
    path: "/start",
    title: "Guided learning routes",
    fields: [
      /^steps\.[^.]+\.(?:title|text|link|question|explanation)$/,
      /^steps\.[^.]+\.options\.\d+$/,
      /^routes\.\d+\.(?:title|description|nextLabel)$/,
    ],
  },
  {
    id: "tools:voting-rights",
    file: "data/voting-rights.json",
    path: "/start",
    title: "Voting-rights reference matrix",
    fields: [/^rows\.\d+\.(?:status|location|national|municipal|detail)$/],
  },
];
const documents = definitions.map((definition) => {
  const raw = readFileSync(definition.file),
    data = JSON.parse(raw),
    blocks = [];
  function walk(value, path = []) {
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value))
        walk(child, [...path, key]);
      return;
    }
    const field = path.join(".");
    if (
      typeof value !== "string" ||
      !definition.fields.some((pattern) => pattern.test(field))
    )
      return;
    blocks.push({
      id:
        "tool-text-" +
        createHash("sha256")
          .update(definition.id + ":" + field)
          .digest("hex")
          .slice(0, 16),
      kind: "text",
      field,
      text: value,
      ...invariants(value),
    });
  }
  walk(data);
  return {
    id: definition.id,
    file: definition.file,
    path: definition.path,
    title: definition.title,
    revision: sourceRevision(raw),
    checked:
      data.checked ?? "Evidence dates remain in the linked source records.",
    blocks,
    links: [...new Set(blocks.flatMap((b) => b.links))].sort(),
    numbers: blocks.flatMap((b) => b.numbers).sort(),
  };
});
const output = JSON.stringify({ schemaVersion: 1, documents }, null, 2) + "\n",
  target = "lib/reference/tool-manifest.json";
if (process.argv.includes("--write")) writeFileSync(target, output);
else if (readFileSync(target, "utf8") !== output)
  throw Error("tool_manifest_stale");
console.log(
  JSON.stringify({
    documents: documents.length,
    blocks: documents.reduce((n, d) => n + d.blocks.length, 0),
    validated: true,
  }),
);
