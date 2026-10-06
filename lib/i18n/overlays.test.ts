import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fieldAt, srcHash } from "./localize";
import { OVERLAYS } from "./overlays";

/**
 * Every Hebrew overlay answers to the current English: each field's `src` hash matches the English it was
 * written for. A failure means the English changed; rewrite the Hebrew (Daniel reviews) and rerun the writer's
 * check script with its stamp flag (scripts/he/). Keys that are not items (bloc:, issue:, "_") are checked too.
 */
const root = join(__dirname, "..", "..", "data");
const read = (f: string) => JSON.parse(readFileSync(join(root, f), "utf8"));

function englishFor(file: string, key: string): unknown {
  const d = read(file);
  if (key === "_") return d;
  if (file === "parties.json") {
    if (key.startsWith("bloc:")) return d.blocs.find((b: { id: string }) => b.id === key.slice(5));
    if (key.startsWith("issue:")) return d.issues.find((i: { key: string }) => i.key === key.slice(6));
    return d.parties.find((p: { id: string }) => p.id === key);
  }
  if (file.startsWith("positions/") || file === "gaza-security-evidence.json") return d.rows.find((r: { party: string }) => r.party === key);
  if (file === "comparison-questions.json") return d.questions.find((q: { key: string }) => q.key === key);
  if (file === "pledge-rules.json") return d.rules.find((r: { id: string }) => r.id === key);
  if (file === "coalition-scenarios.json") return key === "historical" ? d.historical : d.scenarios.find((s: { id: string }) => s.id === key);
  if (file === "voter-base.json") return d.parties?.[key];
  return undefined;
}

const FILES: [string, Record<string, Record<string, { text: string; src: string }>>][] = [
  ["parties.json", OVERLAYS.parties], ["comparison-questions.json", OVERLAYS.questions], ["pledge-rules.json", OVERLAYS.pledges],
  ["coalition-scenarios.json", OVERLAYS.scenarios], ["outgoing-government.json", OVERLAYS.government], ["gaza-security-evidence.json", OVERLAYS.gaza],
  ["voter-base.json", OVERLAYS.voterBase], ["results.json", OVERLAYS.results],
  ...readdirSync(join(root, "he", "positions")).map((f): [string, Record<string, Record<string, { text: string; src: string }>>] => [`positions/${f}`, OVERLAYS.positions[f.replace(/\.json$/, "")]]),
];

describe("Hebrew overlays", () => {
  for (const [file, overlay] of FILES) {
    it(`${file} answers to the current English`, () => {
      const problems: string[] = [];
      for (const [key, fields] of Object.entries(overlay)) {
        const item = englishFor(file, key);
        for (const [field, he] of Object.entries(fields)) {
          expect(he.text, `${file} ${key} ${field}`).toBeTruthy();
          const english = item === undefined ? undefined : fieldAt(item, field);
          if (english === undefined) problems.push(`${key} ${field}: no English`);
          else if (he.src !== srcHash(english)) problems.push(`${key} ${field}: stale`);
        }
      }
      expect(problems).toEqual([]);
    });
  }
});
