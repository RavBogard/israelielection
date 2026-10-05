/**
 * Daily party-text updates: the last day's headlines → Gemini → grounding check → edits to
 * data/parties.json. Grounded proposals are written in place (the workflow tests and commits
 * them to main); single-outlet leader/status changes go to --review-out for a PR instead.
 *
 *   tsx scripts/jobs/party-proposals.mts [--date YYYY-MM-DD] [--skip-keys file]
 *     [--report auto.md] [--review-out parties.json] [--review-report review.md] [--dry-run]
 *
 * --skip-keys: one proposal key per line (from open PRs), so nothing is proposed twice.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { GEMINI_MODEL } from "../../lib/ai";
import { generateJson } from "../../lib/gemini";
import { fetchNews } from "../../lib/news";
import {
  PROPOSAL_SCHEMA, applyProposals, checkProposals, needsReview, proposalKey, proposalPrompt,
  type Proposal, type ProposalDraft,
} from "../../lib/proposals";
import type { PartiesFile } from "../../lib/types";

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const date = opt("--date") ?? new Date().toISOString().slice(0, 10);
const dry = args.includes("--dry-run");
const output = (k: string, v: string | number) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
const FILE = "data/parties.json";

const file = JSON.parse(readFileSync(FILE, "utf8")) as PartiesFile;
const skipFile = opt("--skip-keys");
const skip = new Set(skipFile && existsSync(skipFile) ? readFileSync(skipFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : []);

const news = await fetchNews({ sinceHours: 26 });
const items = news.items.slice(0, 80);
console.log(`${items.length} headlines${news.failed.length ? `; feeds that failed: ${news.failed.join(", ")}` : ""}`);
if (items.length < 4) {
  console.log("Too few headlines; no proposals.");
  output("auto", 0);
  output("review", 0);
  process.exit(0);
}

const draft = await generateJson<ProposalDraft>(proposalPrompt(items, file.parties, date), PROPOSAL_SCHEMA, { temperature: 0.1 });
const { kept, dropped } = checkProposals(draft, items, file.parties);
const fresh = kept.filter((p) => !skip.has(proposalKey(p)));
console.log(`${draft.proposals?.length ?? 0} drafted, ${kept.length} grounded, ${kept.length - fresh.length} already in an open PR, ${dropped.length} dropped.`);
for (const d of dropped) console.log(`  dropped: “${d.text}” (${d.reason})`);

const auto = fresh.filter((p) => !needsReview(p));
const review = fresh.filter(needsReview);
const updated = applyProposals(file, auto, date);
if (auto.length && !dry) writeFileSync(FILE, JSON.stringify(updated, null, 2) + "\n");
const reviewOut = opt("--review-out");
if (review.length && reviewOut && !dry) writeFileSync(reviewOut, JSON.stringify(applyProposals(updated, review, date), null, 2) + "\n");

const name = (id: string) => file.parties.find((p) => p.id === id)!.name;
const label = { leader: "Leader", status: "Status", surplusPartner: "Surplus agreement", addPledge: "New pledge" } as const;
const block = (p: Proposal) => [
  `### ${name(p.party)}: ${label[p.field]}`,
  `**New:** ${p.text}`,
  `**Why:** ${p.why}`,
  `**Sources:** ${p.items.map((i) => `[${i.outlet}: ${i.title}](${i.url})`).join("; ")}`,
  p.field === "surplusPartner" ? "_The election-night seat estimate reads the agreements in `data/results.json`; update it to match._" : "",
  `<!-- key: ${proposalKey(p)} -->`,
  "",
];
const droppedMd = dropped.length
  ? `<details><summary>Dropped by the source check (${dropped.length})</summary>\n\n${dropped.map((d) => `- “${d.text}” (${d.reason})`).join("\n")}\n</details>`
  : "";
const autoMd = [
  `**Party register updated automatically** (${GEMINI_MODEL}, headlines of ${date}). Live on the next deploy. To undo, revert the commit “party register: ${date}” or edit \`${FILE}\`.`,
  "",
  ...auto.flatMap(block),
  droppedMd,
].join("\n");
const reviewMd = [
  `Proposed by the daily job (${GEMINI_MODEL}) from the headlines of ${date}. A leader or status change reported by only one outlet waits for you: **merge to publish, close to reject.**`,
  "",
  ...review.flatMap(block),
].join("\n");

console.log(auto.length ? autoMd : "No automatic updates.");
console.log(review.length ? reviewMd : "Nothing for review.");
const out = opt("--report");
if (out && auto.length) writeFileSync(out, autoMd + "\n");
const rout = opt("--review-report");
if (rout && review.length) writeFileSync(rout, reviewMd + "\n");
output("auto", auto.length);
output("review", review.length);
