/**
 * Checks scripts/forecast/backtest/data-full/*.json (agent D1, round 2):
 *  1. every poll in data/<key>.json (28-day files) appears in data-full/<key>.json with identical results/combined
 *     (and reports any difference in id, pollster, firm, published, filber, note);
 *  2. lists, blocs, agreements and result objects equal the 28-day files';
 *  3. makeAllocator with the file's agreements and threshold reproduces every official seat count (2013 included);
 *  4. poll counts per election and per pollster (markdown table with --table).
 * Usage: node scripts/forecast/round2/D1/verify.mjs [--table]   (table cells: all polls (polls since the dissolution); ‡n = n Filber polls)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeAllocator } from "../../backtest/model.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../backtest");
const KEYS = ["2013-01", "2015-03", "2019-04", "2019-09", "2020-03", "2021-03", "2022-11"];
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const canon = (o) => JSON.stringify(o, Object.keys(o).sort());
let failures = 0;
const fail = (m) => { failures++; console.log("FAIL", m); };

const full = Object.fromEntries(KEYS.map((k) => [k, read(path.join(ROOT, "data-full", `${k}.json`))]));

console.log("## 1-2. 28-day files vs full files");
for (const k of KEYS.slice(1)) {
  const d28 = read(path.join(ROOT, "data", `${k}.json`)), f = full[k];
  for (const fld of ["lists", "blocs", "agreements", "result", "blocNote", "election", "threshold", "sources"])
    if (!same(d28[fld], f[fld])) fail(`${k}: ${fld} differs`);
  const byId = new Map(f.polls.map((p) => [p.id, p]));
  let found = 0; const other = [];
  for (const p of d28.polls) {
    // match by id; if the id moved (a same-day poll gained a 'b'), fall back to pollster + published + results
    let q = byId.get(p.id);
    if (!q || !same(q.results, p.results)) q = f.polls.find((x) => x.pollster === p.pollster && x.published === p.published && same(x.results, p.results)) ?? q;
    if (!q) { fail(`${k}: ${p.id} missing`); continue; }
    if (!same(q.results, p.results) || !same(q.combined, p.combined)) { fail(`${k}: ${p.id} results differ\n  28d ${canon(p.results)}\n  full ${canon(q.results)}`); continue; }
    found++;
    for (const fld of ["id", "pollster", "firm", "published", "fieldwork", "filber", "note", "n"]) if (!same(p[fld], q[fld])) other.push(`${p.id}.${fld}: ${JSON.stringify(p[fld])} -> ${JSON.stringify(q[fld])}`);
  }
  const cutoff = new Date(Date.parse(f.election) - 28 * 864e5).toISOString().slice(0, 10);
  const in28 = f.polls.filter((p) => p.published >= cutoff).length;
  console.log(`${k}: ${found}/${d28.polls.length} 28-day polls found with identical results; full file has ${in28} polls in the same 28 days, ${f.polls.length} in all`);
  for (const o of other) console.log("   field differs:", o);
}

console.log("\n## 3. makeAllocator reproduces the official seats");
for (const k of KEYS) {
  const f = full[k], ids = Object.keys(f.lists);
  const votes = Object.fromEntries(ids.map((id) => [id, f.result.lists[id].votes / f.result.validVotes]));
  const seats = makeAllocator(ids, f.agreements, f.threshold)(votes);
  const bad = ids.filter((id) => (seats[id] ?? 0) !== f.result.lists[id].seats);
  if (bad.length) fail(`${k}: allocator differs on ${bad.map((id) => `${id} ${seats[id] ?? 0} vs ${f.result.lists[id].seats}`).join(", ")}`);
  const noAgr = makeAllocator(ids, [], f.threshold)(votes);
  const moved = ids.filter((id) => (noAgr[id] ?? 0) !== f.result.lists[id].seats).map((id) => `${id} ${noAgr[id] ?? 0}`);
  console.log(`${k}: threshold ${f.threshold}, ${ids.length} lists, ${bad.length ? "MISMATCH" : "all seats exact"}; without agreements: ${moved.join(", ") || "same"}`);
}

console.log("\n## 4. Counts");
const ext = new Set();
for (const k of KEYS) {
  const f = full[k];
  const sinceDiss = f.polls.filter((p) => p.published >= f.dissolved).length;
  const ids = new Set(Object.keys(f.lists)), oth = new Set(Object.keys(f.otherLists));
  for (const p of f.polls) for (const id of [...Object.keys(p.results), ...p.combined.flatMap((c) => c.parties)]) if (!ids.has(id) && !oth.has(id)) ext.add(`${k}:${id}`);
  const off = f.polls.filter((p) => p.note && p.note.startsWith("Seats as printed")).length;
  console.log(`${k}: ${f.polls.length} polls (${sinceDiss} since dissolution ${f.dissolved}), ${new Set(f.polls.map((p) => p.pollster)).size} pollsters, ${f.polls.filter((p) => p.filber).length} Filber, ${off} not summing to 120, ${f.polls.filter((p) => p.combined.length).length} with combined cells, first ${f.polls.at(-1).published}, last ${f.polls[0].published}`);
}
if (ext.size) fail(`ids in polls not in lists/otherLists: ${[...ext].join(", ")}`);

if (process.argv.includes("--table")) {
  const names = [...new Set(KEYS.flatMap((k) => full[k].polls.map((p) => p.pollster)))].sort((a, b) => a.localeCompare(b));
  console.log("\n| Pollster (outlet) | " + KEYS.join(" | ") + " | All |");
  console.log("|---|" + KEYS.map(() => "---:").join("|") + "|---:|");
  const tot = Object.fromEntries(KEYS.map((k) => [k, 0]));
  const cell = (ps, k) => { const a = ps.length, b = ps.filter((p) => p.published >= full[k].dissolved).length; return a ? `${a} (${b})` : ""; };
  const totD = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for (const n of names) {
    const sel = KEYS.map((k) => full[k].polls.filter((p) => p.pollster === n));
    sel.forEach((x, i) => { tot[KEYS[i]] += x.length; totD[KEYS[i]] += x.filter((p) => p.published >= full[KEYS[i]].dissolved).length; });
    const fil = sel.flat().filter((p) => p.filber).length;
    console.log(`| ${n}${fil ? ` ‡${fil}` : ""} | ${sel.map((x, i) => cell(x, KEYS[i])).join(" | ")} | ${sel.flat().length} |`);
  }
  console.log(`| **All** | ${KEYS.map((k) => `${tot[k]} (${totD[k]})`).join(" | ")} | ${Object.values(tot).reduce((a, b) => a + b)} |`);
  const firms = [...new Set(KEYS.flatMap((k) => full[k].polls.map((p) => p.firm ?? "(none)")))].sort((a, b) => a.localeCompare(b));
  console.log("\n| Firm | " + KEYS.join(" | ") + " | All |");
  console.log("|---|" + KEYS.map(() => "---:").join("|") + "|---:|");
  for (const n of firms) {
    const sel = KEYS.map((k) => full[k].polls.filter((p) => (p.firm ?? "(none)") === n));
    console.log(`| ${n} | ${sel.map((x, i) => cell(x, KEYS[i])).join(" | ")} | ${sel.flat().length} |`);
  }
}
console.log(failures ? `\n${failures} FAILURES` : "\nAll checks passed.");
process.exitCode = failures ? 1 : 0;
