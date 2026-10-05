/**
 * Daily briefing job: the last day's headlines → Gemini → source check → data/briefings/DATE.json.
 *
 *   tsx scripts/jobs/briefing.mts [--date YYYY-MM-DD] [--force] [--report out.md] [--dry-run]
 *
 * Kill switch (plan): delete the day's file and push; the site drops it on the next deploy.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { GEMINI_MODEL } from "../../lib/ai";
import { DRAFT_SCHEMA, briefingPrompt, checkDraft, type Briefing, type Draft } from "../../lib/briefing";
import { generateJson } from "../../lib/gemini";
import { fetchNews } from "../../lib/news";

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const date = opt("--date") ?? new Date().toISOString().slice(0, 10);
const file = `data/briefings/${date}.json`;
const output = (k: string, v: string | number) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

if (existsSync(file) && !args.includes("--force")) {
  console.log(`${file} exists; nothing to do.`);
  output("published", 0);
  process.exit(0);
}

let news = await fetchNews({ sinceHours: 24 });
if (news.items.length < 8) news = await fetchNews({ sinceHours: 36 });
const items = news.items.slice(0, 60);
console.log(`${items.length} headlines${news.failed.length ? `; feeds that failed: ${news.failed.join(", ")}` : ""}`);
if (items.length < 4) throw new Error("Too few headlines to write a briefing.");

let briefing: Briefing | null = null;
let problems: string[] = [];
for (let attempt = 1; attempt <= 2 && !briefing; attempt++) {
  const draft = await generateJson<Draft>(briefingPrompt(items, date), DRAFT_SCHEMA);
  ({ briefing, problems } = checkDraft(draft, items, { date, model: GEMINI_MODEL }));
  if (!briefing) console.log(`Attempt ${attempt} rejected: ${problems.join(" ")}`);
}

const repo = process.env.GITHUB_REPOSITORY ?? "RavBogard/israelielection";
let md: string;
if (briefing) {
  if (!args.includes("--dry-run")) {
    mkdirSync("data/briefings", { recursive: true });
    writeFileSync(file, JSON.stringify(briefing, null, 2) + "\n");
  }
  md = [
    `**Daily briefing, ${date}**: live at https://www.israelielection.org/news`,
    "",
    ...briefing.sentences.map((s) => `- ${s.text} (${s.sources.map((x) => `[${x.outlet}](${x.url})`).join(", ")})`),
    "",
    briefing.dropped.length ? `Removed by the source check: ${briefing.dropped.map((d) => `“${d.text}” (${d.reason})`).join("; ")}` : "",
    `To kill or correct it: edit or delete [\`${file}\`](https://github.com/${repo}/blob/main/${file}) and commit; the site updates on deploy.`,
  ].join("\n");
  output("published", 1);
} else {
  md = `**No briefing published for ${date}.** The draft failed the source check twice: ${problems.join(" ")}`;
  output("published", 0);
}
console.log(md);
const out = opt("--report");
if (out) writeFileSync(out, md + "\n");
