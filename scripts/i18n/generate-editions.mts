/** Explicit authoring tool, never run during builds or page requests.
 * Seeds Arabic/Persian static copy with Google Translate; review generated copy before release.
 * Usage: npx tsx scripts/i18n/generate-editions.mts [ar|fa]
 * Public site text only. Placeholders, URLs, numbers and data source hashes are preserved.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import ts from "typescript";
import { fieldAt, srcHash } from "../../lib/i18n/localize";

const areas = { chrome: "Chrome", home: "HomeText", polls: "PollsText", builder: "BuilderText", compare: "CompareText", profile: "ProfileText", results: "ResultsText" };
const languages = process.argv[2] ? [process.argv[2]] : ["ar", "fa"];
if (languages.some(l => l !== "ar" && l !== "fa")) throw new Error("Use ar or fa");
const read = (p: string) => fs.readFileSync(p, "utf8");
const json = (p: string) => JSON.parse(read(p));
const write = (p: string, s: string) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const printer = ts.createPrinter({ removeComments: true });

function initializer(area: string) {
  const sf = ts.createSourceFile(area, read(`lib/i18n/${area}.ts`), ts.ScriptTarget.Latest, true);
  let value: ts.Expression | undefined;
  function visit(n: ts.Node) { if (ts.isVariableDeclaration(n) && n.name.getText(sf) === "en") value = n.initializer; ts.forEachChild(n, visit); }
  visit(sf);
  if (!value) throw new Error(`No English dictionary: ${area}`);
  return { sf, value };
}
function visible(n: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): boolean {
  if (!/[A-Za-z]/.test(n.text) || /^(?:https?:|\/|#[a-z]|en-US$)/.test(n.text)) return false;
  const p = n.parent;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p)) && p.name === n) return false;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return false;
  if (ts.isElementAccessExpression(p) || ts.isLiteralTypeNode(p)) return false;
  return true;
}
function template(n: ts.TemplateExpression) { return n.head.text + n.templateSpans.map((s, i) => `ZXPH${i}XZ${s.literal.text}`).join(""); }
const messages = new Set<string>();
function collect(n: ts.Node) {
  if (ts.isTemplateExpression(n)) { messages.add(template(n)); n.templateSpans.forEach(s => collect(s.expression)); return; }
  if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && visible(n)) messages.add(n.text);
  ts.forEachChild(n, collect);
}
for (const area of Object.keys(areas)) collect(initializer(area).value);
function scan(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { if (!["ar", "fa", "he"].includes(entry.name)) scan(file); continue; }
    if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
    const sf = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
    function visit(n: ts.Node) {
      if (ts.isCallExpression(n) && n.expression.getText(sf) === "ui" && n.arguments[1] && ts.isStringLiteral(n.arguments[1])) messages.add(n.arguments[1].text);
      ts.forEachChild(n, visit);
    }
    visit(sf);
  }
}
scan("lib"); scan("components"); scan("app");
const runtimeMessages = new Set(messages);
// Nav copy is selected dynamically from the canonical English catalog.
const { NAV_GROUPS, NAV_UTILITIES } = await import("../../lib/site");
for (const group of NAV_GROUPS) {
  messages.add(group.label); runtimeMessages.add(group.label);
  for (const item of group.items) for (const s of [item.label, item.short, item.description]) if (s) { messages.add(s); runtimeMessages.add(s); }
}
for (const item of NAV_UTILITIES) for (const s of [item.label, item.short, item.description]) if (s) { messages.add(s); runtimeMessages.add(s); }
const short = initializer("compare-short");
collect(short.value);
function shortMessages(n: ts.Node) { if (ts.isStringLiteral(n) && visible(n)) runtimeMessages.add(n.text); ts.forEachChild(n, shortMessages); }
shortMessages(short.value);

// Additional labels used outside the main dictionaries, populated by runtime ui() calls.
const extraFile = "scripts/i18n/extra-messages.json";
if (fs.existsSync(extraFile)) for (const s of json(extraFile)) messages.add(s);

const files = fs.readdirSync("data/he", { withFileTypes: true }).flatMap(d => d.isDirectory() ? fs.readdirSync(`data/he/${d.name}`).map(f => `${d.name}/${f}`) : [d.name]).filter(f => f.endsWith(".json"));
function englishFor(file: string, key: string): unknown {
  if (file === "pollsters.json") return { name: key };
  const d = json(`data/${file}`);
  if (key === "_") return d;
  if (file === "parties.json") {
    if (key.startsWith("bloc:")) return d.blocs.find((b: { id: string }) => b.id === key.slice(5));
    if (key.startsWith("issue:")) return d.issues.find((b: { key: string }) => b.key === key.slice(6));
    return d.parties.find((p: { id: string }) => p.id === key);
  }
  if (file.startsWith("positions/") || file === "gaza-security-evidence.json") return d.rows.find((r: { party: string }) => r.party === key);
  if (file === "comparison-questions.json") return d.questions.find((q: { key: string }) => q.key === key);
  if (file === "pledge-rules.json") return d.rules.find((r: { id: string }) => r.id === key);
  if (file === "coalition-scenarios.json") return key === "historical" ? d.historical : d.scenarios.find((s: { id: string }) => s.id === key);
  if (file === "voter-base.json") return d.parties?.[key];
}
for (const file of files) for (const [key, fields] of Object.entries(json(`data/he/${file}`))) for (const field of Object.keys(fields as object)) {
  const text = fieldAt(englishFor(file, key), field);
  if (text) messages.add(text);
}

function protect(s: string, numbers = true) {
  const values: string[] = [];
  const re = numbers ? /ZXPH\d+XZ|\]\([^)]*\)|https?:\/\/[^\s]+|\{[^{}\n]+\}|\d+(?:[.,:]\d+)*/g : /ZXPH\d+XZ|\]\([^)]*\)|https?:\/\/[^\s]+|\{[^{}\n]+\}/g;
  const text = s.replace(re, value => { values.push(value); return `<x${values.length - 1}>`; });
  return { text, restore: (s: string) => {
    s = s.replace(/<\s*x\s*(\d+)\s*>/gi, (_, i: string) => `<x${i}>`);
    for (let i = 0; i < values.length; i++) {
      const token = `<x${i}>`;
      if (!s.includes(token)) throw new Error(`Translation lost ${token}: ${JSON.stringify({ original: text, output: s })}`);
      s = s.replaceAll(token, values[i]);
    }
    return s.replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) - (d <= "٩" ? 0x660 : 0x6f0)));
  } };
}

for (const lang of languages) {
  const cacheFile = path.join(os.tmpdir(), `israelielection-${lang}-translations.json`);
  const persistedMessages = `lib/i18n/${lang}/messages.json`;
  const cache: Record<string, string> = { ...(fs.existsSync(cacheFile) ? json(cacheFile) : {}), ...(fs.existsSync(persistedMessages) ? json(persistedMessages) : {}) };
  // Recover reviewed static translations without depending on a machine-local cache.
  for (const file of files) {
    const saved = `data/${lang}/${file}`;
    if (!fs.existsSync(saved)) continue;
    for (const [key, fields] of Object.entries(json(saved))) for (const [field, value] of Object.entries(fields as Record<string, { text: string; src: string }>)) {
      const english = fieldAt(englishFor(file, key), field);
      if (english && value.src === srcHash(english)) cache[english] = value.text;
    }
  }
  const overridesFile = `scripts/i18n/${lang}-overrides.json`;
  const overrides: Record<string, string> = fs.existsSync(overridesFile) ? json(overridesFile) : {};
  Object.assign(cache, overrides);
  for (const s of messages) if (!/[A-Za-z]/.test(s.replace(/ZXPH\d+XZ|\{\d+\}/g, ""))) cache[s] = s;
  if (process.argv.includes("--pending")) {
    const pending = [...messages].filter(s => !cache[s]);
    write(path.join(os.tmpdir(), `israelielection-${lang}-pending.json`), JSON.stringify(pending, null, 2));
    console.log(`${lang}: ${pending.length} messages pending`);
    continue;
  }
  const pending = [...messages].filter(s => !cache[s]);
  if (process.argv.includes("--offline") && pending.length) throw new Error(`${lang}: ${pending.length} new messages need translation; run without --offline or add overrides.`);
  let completed = 0;
  async function translateOne(source: string): Promise<string> {
    async function request(q: string) {
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      for (const [k, v] of Object.entries({ client: "gtx", sl: "en", tl: lang, dt: "t", q })) url.searchParams.set(k, v);
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
      const result = await response.json() as [([string, string])[]];
      return result[0].map(r => r[0]).join("");
    }
    const natural = protect(source, false);
    const nums = (s: string) => (s.replace(/(?<=\d)[,٬](?=\d)/g, "").match(/\d+(?:[.:]\d+)*/g) ?? []).sort().join("|");
    try {
      const restored = natural.restore(await request(natural.text));
      if (nums(restored) === nums(source)) return restored;
    } catch { /* Retry protected segments; never save a damaged placeholder. */ }
    const protectedSource = protect(source);
    const chunks = protectedSource.text.split(/(<x\d+>)/);
    const out: string[] = [];
    for (const chunk of chunks) {
      if (/^<x\d+>$/.test(chunk) || !/[A-Za-z]/.test(chunk)) out.push(chunk);
      else out.push((chunk.match(/^\s*/)?.[0] ?? "") + (await request(chunk.trim())).trim() + (chunk.match(/\s*$/)?.[0] ?? ""));
    }
    return protectedSource.restore(out.join(""));
  }
  while (pending.length) {
    const batch: string[] = [];
    let length = 0;
    while (pending.length && (length < 2800 || !batch.length)) { const s = pending.shift()!; batch.push(s); length += s.length; }
    const protectedBatch = batch.map(s => protect(s));
    const q = protectedBatch.map((s, i) => `ZXMSG${i}XZ\n${s.text}`).join("\n");
    let error: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = new URL("https://translate.googleapis.com/translate_a/single");
        for (const [k, v] of Object.entries({ client: "gtx", sl: "en", tl: lang, dt: "t", q })) url.searchParams.set(k, v);
        const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
        const result = await response.json() as [([string, string])[]];
        const output = result[0].map(r => r[0]).join("");
        const pieces = output.split(/ZXMSG\s*\d+XZ\s*\n?/).slice(1);
        if (pieces.length !== batch.length) throw new Error(`Translation boundaries: ${pieces.length}/${batch.length}`);
        const restored = await Promise.all(pieces.map(async (s, i) => {
          const lead = batch[i].match(/^\s*/)?.[0] ?? "", tail = batch[i].match(/\s*$/)?.[0] ?? "";
          try { return lead + protectedBatch[i].restore(s.trim()) + tail; }
          catch { return lead + await translateOne(batch[i]) + tail; }
        }));
        batch.forEach((s, i) => { cache[s] = restored[i]; });
        error = undefined;
        break;
      } catch (e) { error = e; await new Promise(r => setTimeout(r, 500 * (attempt + 1))); }
    }
    if (error && batch.length > 1) {
      // Retry a smaller request: long adjacent placeholders sometimes confuse the service.
      pending.unshift(...batch);
      const first = pending.shift()!;
      const one = protect(first, false);
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      for (const [k, v] of Object.entries({ client: "gtx", sl: "en", tl: lang, dt: "t", q: one.text })) url.searchParams.set(k, v);
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
      const result = await response.json() as [([string, string])[]];
      const restored = one.restore(result[0].map(r => r[0]).join(""));
      const nums = (s: string) => (s.replace(/(?<=\d)[,٬](?=\d)/g, "").match(/\d+(?:[.:]\d+)*/g) ?? []).sort().join("|");
      if (nums(restored) !== nums(first)) throw new Error(`Numbers changed in ${first}`);
      cache[first] = restored;
      fs.writeFileSync(cacheFile, JSON.stringify(cache));
      continue;
    }
    if (error) throw error;
    completed += batch.length;
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    if (completed % 100 < batch.length || !pending.length) console.log(`${lang}: ${completed} translated, ${pending.length} remaining`);
  }
  const tr = (s: string) => lang === "fa" ? (cache[s] ?? s).replaceAll("صندلی", "کرسی").replaceAll("مهمانی", "حزب") : (cache[s] ?? s).replaceAll("حفلات", "أحزاب").replaceAll("الحفلات", "الأحزاب");
  let area = "";
  function transform(n: ts.Node, context: ts.TransformationContext): ts.Node {
    if (ts.isPropertyAssignment(n)) {
      const key = n.name.getText();
      const manual: Record<string, string> = lang === "ar" ? {
        inEnglish: "(بالإنجليزية)", english: "(بالإنجليزية)", machine: "ترجمة آلية",
        pollsLine: "جميع استطلاعات الرأي ومصادرها", profiles: "بيانات الأحزاب: المصادر والتواريخ مذكورة بجانب كل بند.", bios: "السير الذاتية: المصادر مذكورة في صفحات الأحزاب.",
      } : {
        inEnglish: "(به انگلیسی)", english: "(به انگلیسی)", machine: "ترجمهٔ ماشینی",
        pollsLine: "همهٔ نظرسنجی‌ها و منابع آن‌ها", profiles: "اطلاعات احزاب: منابع و تاریخ‌ها در کنار هر مورد آمده است.", bios: "زندگی‌نامه‌ها: منابع در صفحات احزاب آمده است.",
      };
      if (manual[key] && ((area === "chrome" && key === "inEnglish") || (area === "home" && ["english", "machine"].includes(key)) || (area === "profile" && ["pollsLine", "profiles", "bios"].includes(key)))) return ts.factory.updatePropertyAssignment(n, n.name, ts.factory.createStringLiteral(manual[key]));
    }
    if (ts.isTemplateExpression(n)) {
      const text = tr(template(n));
      const chunks = text.split(/ZXPH\d+XZ/), tokens = [...text.matchAll(/ZXPH(\d+)XZ/g)];
      if (tokens.length !== n.templateSpans.length || new Set(tokens.map(t => t[1])).size !== tokens.length) throw new Error("Template placeholders changed");
      return ts.factory.createTemplateExpression(ts.factory.createTemplateHead(chunks[0]), tokens.map((t, i) => ts.factory.createTemplateSpan(transform(n.templateSpans[Number(t[1])].expression, context) as ts.Expression, i === tokens.length - 1 ? ts.factory.createTemplateTail(chunks[i + 1]) : ts.factory.createTemplateMiddle(chunks[i + 1]))));
    }
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && visible(n)) return ts.factory.createStringLiteral(tr(n.text));
    return ts.visitEachChild(n, child => transform(child, context), context);
  }
  for (const [name, type] of Object.entries(areas)) {
    area = name;
    const { sf, value } = initializer(name);
    let helpers = "";
    if (area === "home") helpers += "type Bits = (string | number)[];\n";
    if (area === "compare" || area === "profile") helpers += 'import type { AxisKey } from "@/lib/compare";\n';
    if (area === "builder") {
      helpers += `import type { RoleKey, VerdictKey } from "../builder";\nconst COUNT = ${JSON.stringify(Array.from({length:11}, (_,i) => String(i)))};\n`;
      helpers += `const orList = (names: string[]) => new Intl.ListFormat("${lang}", { type: "disjunction" }).format(names);\n`;
      helpers += 'const lowerFirst = (s: string) => s;\n';
    }
    const transformed = ts.transform(value, [context => node => transform(node, context) as ts.Expression]);
    const printed = printer.printNode(ts.EmitHint.Expression, transformed.transformed[0], sf)
      .replace(/\\u([0-9A-Fa-f]{4})/g, (raw, hex: string) => parseInt(hex, 16) >= 0x590 ? String.fromCharCode(parseInt(hex, 16)) : raw)
      .replace("majorityTail: (_k: number)", "majorityTail: ()");
    write(`lib/i18n/${lang}/${area}.ts`, `// Static machine translation; regenerate explicitly with scripts/i18n/generate-editions.mts.\nimport type { ${type} } from "../${area}";\n${helpers}const en: ${type} = ${printed};\nexport default en;\n`);
    transformed.dispose();
  }
  write(`lib/i18n/${lang}/messages.json`, JSON.stringify(Object.fromEntries([...runtimeMessages].map(s => [s, tr(s)])), null, 2) + "\n");
  for (const file of files) {
    const out: Record<string, Record<string, unknown>> = {};
    for (const [key, fields] of Object.entries(json(`data/he/${file}`))) {
      for (const field of Object.keys(fields as object)) {
        const english = fieldAt(englishFor(file, key), field);
        if (!english || !cache[english]) continue;
        (out[key] ??= {})[field] = { text: tr(english), src: srcHash(english), machine: true, ...(field === "quote.text" ? { translated: true } : {}) };
      }
    }
    write(`data/${lang}/${file}`, JSON.stringify(out, null, 2) + "\n");
  }
  console.log(`${lang}: saved seven dictionaries and ${files.length} data overlays`);
}
