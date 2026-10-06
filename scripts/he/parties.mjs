// Hebrew parties overlay (data/he/parties.json): stamp `src` hashes and validate against data/parties.json.
//
//   node scripts/he/parties.mjs            validate only (exit 1 on any problem)
//   node scripts/he/parties.mjs --stamp    fill `src` where it is empty or missing, then validate
//   node scripts/he/parties.mjs --restamp  recompute every `src` from the current English (only after rereading the Hebrew!)
//
// Contract: docs/planning/2026-10-06-hebrew/OVERLAYS.md. Keys: party id, "bloc:<id>" (field "label"), "issue:<key>" (field "label").
// Hashes come from srcHash in lib/i18n/localize.ts (Node strips the TypeScript types on import).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { srcHash, fieldAt } from "../../lib/i18n/localize.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const enPath = root + "data/parties.json";
const hePath = root + "data/he/parties.json";
const en = JSON.parse(readFileSync(enPath, "utf8"));
const he = JSON.parse(readFileSync(hePath, "utf8"));
const mode = process.argv[2] ?? "";

/** The English item each overlay key answers to. */
const items = new Map();
for (const p of en.parties) items.set(p.id, p);
for (const b of en.blocs) items.set(`bloc:${b.id}`, { id: `bloc:${b.id}`, label: b.label });
for (const i of en.issues) items.set(`issue:${i.key}`, { id: `issue:${i.key}`, label: i.label });

/** Every rendered English text field of a party (sources, ids, slots and tags are not rendered as prose). */
function renderedFields(p) {
  const out = [];
  const add = (path) => { const v = fieldAt(p, path); if (typeof v === "string" && v.trim()) out.push(path); };
  for (const f of ["name", "short", "leader", "surplusLine", "status", "thin"]) add(f);
  for (const list of ["who", "voters", "pledges"]) (p[list] ?? []).forEach((_, n) => add(`${list}.${n}.text`));
  for (const k of Object.keys(p.issues ?? {})) add(`issues.${k}.text`);
  (p.names ?? []).forEach((_, n) => { add(`names.${n}.name`); add(`names.${n}.note`); });
  (p.bios ?? []).forEach((_, n) => { add(`bios.${n}.name`); add(`bios.${n}.text`); });
  add("surplusPartner.text"); add("quote.text"); add("quote.speaker");
  return out;
}

const problems = [];
let stamped = 0, fields = 0, translated = 0;
for (const [key, entry] of Object.entries(he)) {
  const item = items.get(key);
  if (!item) { problems.push(`${key}: no such English item`); continue; }
  for (const [path, f] of Object.entries(entry)) {
    fields++;
    const english = fieldAt(item, path);
    if (english === undefined) { problems.push(`${key} ${path}: no such English field`); continue; }
    if (!f || typeof f.text !== "string" || !f.text.trim()) problems.push(`${key} ${path}: empty Hebrew`);
    if (/[‎‏‪-‮]/.test(f.text ?? "")) problems.push(`${key} ${path}: bidi control character in text`);
    if (/[A-Za-z]{4,}/.test(f.text ?? "") && !/(JTA|ynet|IsraelEd|E1)/.test(f.text)) problems.push(`${key} ${path}: Latin text left in Hebrew (check)`);
    if (mode === "--restamp" || (mode === "--stamp" && !f.src)) { f.src = srcHash(english); stamped++; }
    if (f.src !== srcHash(english)) problems.push(`${key} ${path}: stale src (English changed since the Hebrew was written)`);
    if (f.machine) problems.push(`${key} ${path}: machine flag on hand-written Hebrew`);
    if (f.translated) { translated++; if (path !== "quote.text") problems.push(`${key} ${path}: translated flag outside quote.text (check)`); }
  }
}

// Coverage: every rendered English field should have Hebrew.
const missing = [];
for (const [key, item] of items) {
  const paths = key.includes(":") ? ["label"] : renderedFields(item);
  for (const path of paths) if (!he[key]?.[path]) missing.push(`${key} ${path}`);
}

if (stamped) writeFileSync(hePath, JSON.stringify(he, null, 2) + "\n", "utf8");
console.log(`data/he/parties.json: ${Object.keys(he).length} keys, ${fields} fields, ${translated} flagged translated, ${stamped} src stamped.`);
if (missing.length) console.log(`Missing Hebrew for ${missing.length} rendered fields:\n  ` + missing.join("\n  "));
if (problems.length) { console.error(`${problems.length} problems:\n  ` + problems.join("\n  ")); process.exit(1); }
if (missing.length) process.exit(1);
console.log("OK: every key and field exists in the English, every src is current, no empty text, full coverage.");
