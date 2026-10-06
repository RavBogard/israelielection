#!/usr/bin/env node
/**
 * Hebrew overlays for the party positions (docs/planning/2026-10-06-hebrew/OVERLAYS.md):
 *   data/he/positions/<issue>.json      key "_" (title, question, note, columnNote, stances.N.label) and party id (text)
 *   data/he/comparison-questions.json   key = question key (label, question, note, stances.N.label, answerSources.<p>.text, unstated.<p>.text)
 *   data/he/gaza-security-evidence.json key "_" (as positions, plus unstated.<p>.text) and party id (text)
 *
 * Usage:
 *   node scripts/he/positions-check.mjs           validate (exit 1 on any problem)
 *   node scripts/he/positions-check.mjs --write   set every `src` from the current English, then validate
 *
 * `src` uses srcHash and field paths use fieldAt, both imported from lib/i18n/localize.ts (Node strips the types),
 * so the hash and the path semantics are the ones the pages use.
 * Checks: every overlay key and field path exists in English, src matches, text is non-empty Hebrew,
 * only text/src/translated/machine are present, `translated` is only ever true, rows whose English basis is
 * "unstated" open with "לא הביעה עמדה בפומבי". It also lists English fields with no Hebrew yet (coverage, not an error).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { srcHash, fieldAt } from "../../lib/i18n/localize.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WRITE = process.argv.includes("--write");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const UNSTATED_OPENING = "לא הביעה עמדה בפומבי";
const HEBREW = /[֐-׿]/;
const ALLOWED = new Set(["text", "src", "translated", "machine"]);

/** English item for an overlay key, plus the fields that should carry Hebrew (for coverage). */
function positionsTargets(en) {
  const items = new Map();
  items.set("_", { item: en, basis: undefined });
  for (const row of en.rows ?? []) items.set(row.party, { item: row, basis: row.basis });
  return items;
}
function positionsExpected(en, withUnstated) {
  const out = [];
  for (const f of ["title", "question", "note", "columnNote"]) if (typeof en[f] === "string") out.push(["_", f]);
  (en.stances ?? []).forEach((_, i) => out.push(["_", `stances.${i}.label`]));
  if (withUnstated) for (const p of Object.keys(en.unstated ?? {})) out.push(["_", `unstated.${p}.text`]);
  for (const row of en.rows ?? []) if (typeof row.text === "string" && row.text.trim()) out.push([row.party, "text"]);
  return out;
}
function questionsTargets(en) {
  const items = new Map();
  for (const q of en.questions) items.set(q.key, { item: q });
  return items;
}
function questionsExpected(en) {
  const out = [];
  for (const q of en.questions) {
    for (const f of ["label", "question", "note"]) if (typeof q[f] === "string") out.push([q.key, f]);
    (q.stances ?? []).forEach((_, i) => out.push([q.key, `stances.${i}.label`]));
    for (const p of Object.keys(q.answerSources ?? {})) out.push([q.key, `answerSources.${p}.text`]);
    for (const p of Object.keys(q.unstated ?? {})) out.push([q.key, `unstated.${p}.text`]);
  }
  return out;
}

const ISSUES = ["courts", "economy", "haredi-draft", "palestinian-state", "religion-state", "war-hostages", "west-bank"];
const FILES = [
  ...ISSUES.map((i) => ({ en: `data/positions/${i}.json`, he: `data/he/positions/${i}.json`, targets: positionsTargets, expected: (e) => positionsExpected(e, false) })),
  { en: "data/comparison-questions.json", he: "data/he/comparison-questions.json", targets: questionsTargets, expected: questionsExpected },
  { en: "data/gaza-security-evidence.json", he: "data/he/gaza-security-evidence.json", targets: positionsTargets, expected: (e) => positionsExpected(e, true) },
];

let problems = 0;
const problem = (file, key, field, msg) => {
  problems++;
  console.log(`  PROBLEM ${file} [${key}] ${field}: ${msg}`);
};

for (const f of FILES) {
  const en = read(f.en);
  const he = read(f.he);
  const targets = f.targets(en);
  let fields = 0;
  let translated = 0;
  for (const [key, entry] of Object.entries(he)) {
    const t = targets.get(key);
    if (!t) {
      problem(f.he, key, "*", "no such item in English");
      continue;
    }
    for (const [field, h] of Object.entries(entry)) {
      fields++;
      const english = fieldAt(t.item, field);
      if (english === undefined) {
        problem(f.he, key, field, "no such English field (orphan)");
        continue;
      }
      for (const k of Object.keys(h)) if (!ALLOWED.has(k)) problem(f.he, key, field, `unexpected property "${k}"`);
      if (WRITE) h.src = srcHash(english);
      if (h.src !== srcHash(english)) problem(f.he, key, field, `stale src ${h.src}, expected ${srcHash(english)}`);
      if (typeof h.text !== "string" || !h.text.trim()) problem(f.he, key, field, "empty text");
      else if (!HEBREW.test(h.text)) problem(f.he, key, field, "text has no Hebrew");
      if ("translated" in h && h.translated !== true) problem(f.he, key, field, "translated must be true or absent");
      if (h.translated) translated++;
      if (field === "text" && t.basis === "unstated" && !h.text.startsWith(UNSTATED_OPENING)) problem(f.he, key, field, `basis "unstated" row must open with "${UNSTATED_OPENING}"`);
    }
  }
  const missing = f.expected(en).filter(([k, fld]) => !he[k]?.[fld]);
  if (WRITE) fs.writeFileSync(path.join(ROOT, f.he), JSON.stringify(he, null, 2) + "\n");
  console.log(`${f.he}: ${fields} fields (${translated} translated quotes), ${missing.length} English fields without Hebrew${missing.length ? ": " + missing.map(([k, fld]) => `${k}.${fld}`).join(", ") : ""}`);
}

console.log(problems ? `\n${problems} problem(s).` : "\nAll Hebrew position overlays valid.");
process.exit(problems ? 1 : 0);
