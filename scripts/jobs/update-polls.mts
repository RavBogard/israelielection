/**
 * Polls job. Reads Wikipedia's 2026 seat-projection tables, validates every new poll, and
 * merges the ones that pass into data/polls.json. Polls that fail go to a review file the
 * workflow turns into a pull request for Daniel. On election night the rows dated election day
 * (or shaded as exit polls) come in as exit polls, each revision a new version (lib/pollimport.ts).
 *
 *   tsx scripts/jobs/update-polls.mts [--wikitext file] [--include-review] [--report out.md]
 *
 * --include-review also merges the failing polls (used on the review-PR branch only).
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { importFromWikitext, type WikiSources } from "../../lib/pollimport";
import type { PartiesFile, Poll, PollsFile } from "../../lib/types";

const UA = "israelielection.org polls job (https://github.com/RavBogard/israelielection)";
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function fetchWikitext(page: string): Promise<{ text: string; revision: number }> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query", prop: "revisions", rvprop: "content|ids", rvslots: "main",
    formatversion: "2", format: "json", titles: page,
  }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const j = await res.json();
  const rev = j.query.pages[0].revisions[0];
  return { text: rev.slots.main.content, revision: rev.revid };
}

const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const today = new Date().toISOString().slice(0, 10);

const pollsFile = readJson<PollsFile>("data/polls.json");
const parties = readJson<PartiesFile>("data/parties.json");
// Election day and the close come from the results config: rows on that day are imported as exit polls.
const night = readJson<{ election: string; pollsClose: string }>("data/results.json");
const src: WikiSources = { ...readJson<{ wikipedia: WikiSources }>("data/poll-sources.json").wikipedia, election: night.election, pollsClose: night.pollsClose };

const local = opt("--wikitext");
const { text, revision } = local ? { text: readFileSync(local, "utf8"), revision: "local" } : await fetchWikitext(src.page);
const report = importFromWikitext(text, revision, src, pollsFile, new Set(parties.parties.map((p) => p.id)), today, new Date().toISOString());

const merged: Poll[] = [...pollsFile.polls, ...report.accepted];
if (args.includes("--include-review")) merged.push(...report.review.map((r) => r.poll));
if (merged.length !== pollsFile.polls.length) {
  writeFileSync("data/polls.json", JSON.stringify({ ...pollsFile, updated: today, polls: merged }, null, 2) + "\n");
}

const seats = (p: Poll) =>
  Object.entries(p.results).map(([id, r]) => `${id} ${r.belowThreshold ? `below${r.pct ? ` (${r.pct})` : ""}` : r.seats}`).join(", ");
const lines = [
  `Wikipedia revision ${revision} ([page](https://en.wikipedia.org/wiki/${encodeURIComponent(src.page.replace(/ /g, "_"))})), run ${today}.`,
  "",
  `- Merged automatically: ${report.accepted.length}${report.accepted.map((p) => `\n  - ${p.pollster}, ${p.published}`).join("")}`,
  `- Need review: ${report.review.length}`,
  `- Blocked tables: ${report.blockers.length}`,
];
for (const b of report.blockers) lines.push("", `**Blocked:** ${b}`);
for (const { poll, problems } of report.review) {
  lines.push("", `### ${poll.pollster}, ${poll.published} (${poll.firm ?? "firm not given"})`);
  for (const pr of problems) lines.push(`- **${pr.rule}:** ${pr.detail}`);
  lines.push(`- Readings: ${seats(poll)}`, `- Source: ${poll.url ?? "none in the Wikipedia citation"}`);
}
if (report.review.length || report.blockers.length) {
  lines.push(
    "",
    "Merging this PR adds the polls above as they are. To reject one instead, add its key (`Pollster|YYYY-MM-DD`) to `ignore` in `data/poll-sources.json`. To accept a new pollster, add it to `config.pollsters` in `data/polls.json`."
  );
}
const md = lines.join("\n");
const out = opt("--report");
if (out) writeFileSync(out, md + "\n");
console.log(md);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `accepted=${report.accepted.length}\nreview=${report.review.length}\nblockers=${report.blockers.length}\n`);
}
