// Fills `src` in the builder-data Hebrew overlays and validates them.
// Usage: node scripts/he/builder-data-check.mjs [--write]
//   --write  recompute every `src` from the current English and save the overlay files.
// Without --write it only checks: every key and field path exists in the English, src matches,
// no empty text, {and:...}/{comma:...} placeholders match the English, and every number in the English
// appears in the Hebrew (warning only). Exit code 1 on any error.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

/** Identical to srcHash in lib/i18n/localize.ts: FNV-1a 32-bit over UTF-16 code units, 8 hex chars. */
export function srcHash(english) {
  let h = 0x811c9dc5;
  for (let i = 0; i < english.length; i++) {
    h ^= english.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Identical to fieldAt in lib/i18n/localize.ts. */
function fieldAt(item, path) {
  let v = item;
  for (const key of path.split(".")) {
    if (v == null || typeof v !== "object") return undefined;
    v = v[key];
  }
  return typeof v === "string" ? v : undefined;
}

const polls = read("data/polls.json");
const pollsterNames = new Set(polls.config.pollsters);
for (const p of polls.polls) {
  if (p.pollster) pollsterNames.add(p.pollster);
  if (p.firm) pollsterNames.add(p.firm);
}
const scenarios = read("data/coalition-scenarios.json");
const voterBase = read("data/voter-base.json");

// overlay file → (item key → English item or undefined)
const FILES = {
  "data/he/pledge-rules.json": (() => {
    const m = new Map(read("data/pledge-rules.json").rules.map((r) => [r.id, r]));
    return (k) => m.get(k);
  })(),
  "data/he/coalition-scenarios.json": (() => {
    const m = new Map(scenarios.scenarios.map((s) => [s.id, s]));
    return (k) => (k === "historical" ? scenarios.historical : m.get(k));
  })(),
  "data/he/outgoing-government.json": (() => {
    const g = read("data/outgoing-government.json");
    return (k) => (k === "_" ? g : undefined);
  })(),
  "data/he/pollsters.json": (k) => (pollsterNames.has(k) ? { id: k, name: k } : undefined),
  "data/he/voter-base.json": (k) => voterBase.parties[k],
  "data/he/results.json": (() => {
    const r = read("data/results.json");
    return (k) => (k === "_" ? r : undefined);
  })(),
};

const write = process.argv.includes("--write");
const placeholders = (s) => (s.match(/\{(?:and|comma):[\w,]+\}/g) ?? []).sort().join(" ");
const numbers = (s) => s.match(/\d[\d,.]*\d|\d/g) ?? [];
let errors = 0;
let warnings = 0;
const err = (m) => { errors++; console.error("ERROR " + m); };
const warn = (m) => { warnings++; console.warn("warn  " + m); };

for (const [file, lookup] of Object.entries(FILES)) {
  const overlay = read(file);
  let fields = 0;
  let translated = 0;
  for (const [key, entry] of Object.entries(overlay)) {
    const item = lookup(key);
    if (!item) { err(`${file}: unknown item key "${key}"`); continue; }
    for (const [path, he] of Object.entries(entry)) {
      fields++;
      const english = fieldAt(item, path);
      if (english === undefined) { err(`${file}: ${key} has no English field "${path}"`); continue; }
      if (!he.text || !he.text.trim()) err(`${file}: ${key}.${path} has empty text`);
      if (/[A-Za-z]{4,}/.test(he.text.replace(/\{(?:and|comma):[\w,]+\}/g, "")) && !/i24NEWS|Panel4All|Next Data|ynet/.test(he.text)) warn(`${file}: ${key}.${path} contains Latin text: ${he.text}`);
      const want = srcHash(english);
      if (write) he.src = want;
      else if (he.src !== want) err(`${file}: ${key}.${path} src ${he.src} != ${want}`);
      if (placeholders(english) !== placeholders(he.text)) err(`${file}: ${key}.${path} placeholders differ: [${placeholders(english)}] vs [${placeholders(he.text)}]`);
      const heNums = new Set(numbers(he.text));
      for (const n of numbers(english)) if (!heNums.has(n)) warn(`${file}: ${key}.${path} number ${n} from the English is not in the Hebrew`);
      if (he.translated) translated++;
      for (const k of Object.keys(he)) if (!["text", "src", "translated", "machine"].includes(k)) err(`${file}: ${key}.${path} has unexpected key ${k}`);
    }
  }
  if (write) writeFileSync(join(root, file), JSON.stringify(overlay, null, 2) + "\n", "utf8");
  console.log(`${file}: ${Object.keys(overlay).length} items, ${fields} fields${translated ? `, ${translated} translated quotes` : ""}`);
}

// Pollster names that the pages may show but the overlay does not cover.
const pollsterOverlay = read("data/he/pollsters.json");
for (const n of pollsterNames) if (!pollsterOverlay[n]) err(`data/he/pollsters.json: missing "${n}"`);

console.log(`${errors} errors, ${warnings} warnings${write ? " (src written)" : ""}`);
process.exit(errors ? 1 : 0);
