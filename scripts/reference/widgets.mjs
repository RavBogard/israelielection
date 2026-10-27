import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { sourceRevision } from "../../lib/reference/source.mjs";
import { invariants } from "./source-blocks.mjs";
import { numericTokens } from "../../lib/reference/numeric.mjs";
const documents = readdirSync("data/charts")
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((file) => {
    const path = "data/charts/" + file,
      raw = readFileSync(path),
      charts = JSON.parse(raw),
      blocks = [];
    for (const [id, chart] of Object.entries(charts)) {
      const add = (field, text) => {
        if (typeof text !== "string" || !text.trim() || !/\p{L}/u.test(text))
          return;
        blocks.push({
          id:
            "chart-label-" +
            createHash("sha256")
              .update(id + "." + field)
              .digest("hex")
              .slice(0, 16),
          kind: "text",
          field: id + "." + field,
          text,
          ...invariants(text),
          negated:
            invariants(text).negated || /\b(?:none|without)\b/i.test(text),
        });
      };
      for (const key of ["title", "question", "note", "unit"])
        add(key, chart[key]);
      chart.columns?.forEach((value, i) => add("columns." + i, value));
      chart.rows.forEach((row, i) => {
        for (const key of ["label", "display"])
          add("rows." + i + "." + key, row[key]);
        row.cells?.forEach((value, j) =>
          add("rows." + i + ".cells." + j, value),
        );
      });
    }
    return {
      id: "charts:" + file.slice(0, -5),
      path: "/reference",
      file: path,
      revision: sourceRevision(raw),
      title: "Chart labels: " + file.slice(0, -5),
      checked: "Source dates are retained in the original chart data.",
      blocks,
      links: [
        ...new Set(
          blocks.flatMap((b) => b.text.match(/https?:\/\/[^\s)"<>]+/g) ?? []),
        ),
      ].sort(),
      numbers: blocks.flatMap((b) => numericTokens(b.text)).sort(),
    };
  });
const output = JSON.stringify({ schemaVersion: 1, documents }, null, 2) + "\n",
  target = "lib/reference/widget-manifest.json";
if (process.argv.includes("--write")) writeFileSync(target, output);
else if (readFileSync(target, "utf8") !== output)
  throw Error("widget_manifest_stale");
console.log(
  JSON.stringify({
    documents: documents.length,
    labels: documents.reduce((sum, d) => sum + d.blocks.length, 0),
    validated: true,
  }),
);
