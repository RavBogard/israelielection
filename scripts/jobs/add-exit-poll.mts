/**
 * Election-night fallback for the exit polls, if Wikipedia is slow or its table changes shape: adds one channel's
 * exit poll by hand. Run from the Polls workflow's "Run workflow" form (pollster + seats), or locally:
 *
 *   tsx scripts/jobs/add-exit-poll.mts --pollster "Channel 12" --seats "likud=30,yashar=20,shas=9,..." [--url https://...] [--firm Midgam]
 *
 * Seats are party ids from data/parties.json; a list missing from --seats is shown as not reported. The poll must
 * pass the same validator as every other (120 seats, known parties, whitelisted pollster). A second run for the same
 * channel with different numbers is kept as a revision, as the import job does.
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { exitVersion } from "../../lib/pollimport";
import { validatePolls } from "../../lib/validate";
import type { PartiesFile, Poll, PollsFile } from "../../lib/types";

const args = process.argv.slice(2);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const readJson = <T,>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

const pollster = opt("--pollster")?.trim() || fail("--pollster is required (Kan 11, Channel 12, Channel 13 or Channel 14).");
const seatsArg = opt("--seats")?.trim() || fail("--seats is required: likud=30,shas=10,...");
const night = readJson<{ election: string; pollsClose: string }>("data/results.json");
const file = readJson<PollsFile>("data/polls.json");
const ids = new Set(readJson<PartiesFile>("data/parties.json").parties.map((p) => p.id));

const results: Poll["results"] = {};
for (const part of seatsArg.split(/[,\s]+/).filter(Boolean)) {
  const [id, n] = part.split("=");
  if (!id || n === undefined || !/^\d+$/.test(n)) fail(`Can't read "${part}": write id=seats, e.g. likud=30.`);
  results[id] = Number(n) === 0 ? { seats: 0, belowThreshold: true } : { seats: Number(n) };
}

const now = new Date().toISOString();
const slug = pollster.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const draft: Poll = {
  id: `${slug}-exit-${night.election}`, pollster, firm: opt("--firm") ?? null, fieldwork: night.election.replace(/^(\d{4})-10-(\d{2})$/, (_, y, d) => `Oct ${Number(d)}, ${y}`),
  published: night.election, via: null, url: opt("--url") ?? null, n: null, margin: null,
  note: "Exit poll entered by hand on election night.", results, combined: [],
  kind: "exit", broadcastAt: file.polls.some((p) => p.kind === "exit" && p.pollster === pollster) ? now : night.pollsClose,
};
const poll = exitVersion(draft, file.polls, now);
if (!poll) {
  console.log(`${pollster}'s latest exit poll already has these numbers; nothing to add.`);
  process.exit(0);
}
const today = now.slice(0, 10) < night.election ? night.election : now.slice(0, 10);
const problems = validatePolls([poll], file.polls, file.config, ids, today);
if (problems.length) fail(`Not added:\n${problems.map((p) => `- ${p.rule}: ${p.detail}`).join("\n")}`);

writeFileSync("data/polls.json", JSON.stringify({ ...file, polls: [...file.polls, poll] }, null, 2) + "\n");
const line = `Added ${pollster} exit poll (${poll.id}, aired ${poll.broadcastAt}): ${Object.entries(results).map(([id, r]) => `${id} ${r.seats}`).join(", ")}`;
console.log(line);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `added=1\nline=${line}\n`);
