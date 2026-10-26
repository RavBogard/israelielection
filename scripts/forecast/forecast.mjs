/**
 * The site's forecast: the daily run of scripts/forecast/model.mjs over data/polls.json, data/parties.json,
 * data/results.json and scripts/forecast/calibration.json; writes data/forecast.json and appends to
 * data/forecast-history.json. Seeded, so the same inputs give the same output. The reasoning is in
 * docs/research/polls-method/2026-10-23-forecast-algorithm.md; the evidence in docs/research/polls-method/round1/.
 *
 * Runs daily until the vote (the polls job reruns it after every import). Every run whose figures differ from
 * the last is appended to the history, so each day's prediction stays on the record. `--final` marks the run
 * final; once data/forecast.json is final, later runs are refused unless `--force`, so exit polls and the count
 * never overwrite the prediction they are scored against. Sensitivity runs (any FC_* env var, or FILBER=1) print
 * and write nothing.
 */
import fs from "node:fs";
import { forecast } from "./model.mjs";
import { campaignWritePolicy } from "./write-policy.mjs";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const FINAL = process.argv.includes("--final"), FORCE = process.argv.includes("--force");
const envOpts = {}; for (const [k, v] of Object.entries(process.env)) if (k.startsWith("FC_")) { const key = k.slice(3).replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([A-Z])/, (c) => c.toLowerCase()); envOpts[key] = v === "true" ? true : v === "false" ? false : v === "null" ? null : Number.isFinite(Number(v)) ? Number(v) : v; }
if (process.env.FILBER === "1") envOpts.includeAll = true;
const SENSITIVITY = Object.keys(envOpts).length > 0;
const electionConfig = read("data/results.json");
const writePolicy = campaignWritePolicy({ now: Date.now(), pollsClose: electionConfig.pollsClose, sensitivity: SENSITIVITY, final: FINAL, historicalOverride: process.argv.includes("--allow-historical-regeneration") });
if (!writePolicy.allowed) { console.error(`Campaign forecast write refused: ${writePolicy.reason}. The existing record is retained. Historical regeneration requires --allow-historical-regeneration and cannot register a new final prediction after close.`); process.exit(1); }
const previous = fs.existsSync("data/forecast.json") ? read("data/forecast.json") : null;
if (previous?.final && !FORCE && !SENSITIVITY) { console.log(`data/forecast.json is final (${previous.generated}); not regenerated. Pass --force to override.`); process.exit(0); }
const { polls, config } = read("data/polls.json");
const parties = (read("data/parties.json").parties ?? read("data/parties.json")).map((p) => ({ id: p.id, bloc: p.bloc }));
const results = electionConfig;
const cal = read("scripts/forecast/calibration.json");
// The surplus-vote agreements: every pair in data/results.json (the five the committee published Oct 19).
const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);

const out0 = forecast({ polls, config, parties, agreements, cal, opts: envOpts });
const now = new Date();
const out = {
  generated: now.toISOString().slice(0, 10), generatedAt: now.toISOString(), final: FINAL, election: results.election, runs: out0.runs, seed: out0.seed,
  method: `scripts/forecast/model.mjs (version ${out0.parameters.version}); docs/research/polls-method/2026-10-23-forecast-algorithm.md`,
  inputs: out0.inputs, parameters: out0.parameters, blocs: out0.blocs, majority: out0.majority, netLargerThanOpp: out0.netLargerThanOpp, largestList: out0.largestList, lists: out0.lists,
  scoring: "Score on the official result: per-list absolute seat error of `point`; bloc absolute error two ways, both reported: blocs.*.listSum (the headline bloc total, the sum of the bloc's list points, shown on the site and compared with the averages) and blocs.*.point (version 3: the median of the bloc's simulated total, round2/G); threshold calls right (`call`, i.e. passes >= 50, and the list passed, or not and it failed); whether the outcome with the highest probability in `majority` occurred. Compare with the two site averages scored the same way.",
};
if (!SENSITIVITY) {
  fs.writeFileSync("data/forecast.json", JSON.stringify(out, null, 2) + "\n");
  // Version 2 on the same polls, so the two versions are scored on the same data (round2/R-red-team.md, finding 3).
  const v2 = forecast({ polls, config, parties, agreements, cal, opts: { v2: true } });
  fs.writeFileSync("data/forecast-v2.json", JSON.stringify({ generated: out.generated, generatedAt: out.generatedAt, final: FINAL, election: results.election, runs: v2.runs, seed: v2.seed, method: "scripts/forecast/model.mjs opts.v2 (version 2's rules, 2026-10-24), run on the same polls as data/forecast.json and scored beside it", inputs: v2.inputs, parameters: v2.parameters, blocs: v2.blocs, majority: v2.majority, netLargerThanOpp: v2.netLargerThanOpp, largestList: v2.largestList, lists: v2.lists, scoring: "As version 2 was pre-registered: per-list absolute seat error of `point`; bloc absolute error of blocs.*.point = the sum of the bloc's list points; threshold calls (`call`); the modal majority outcome." }, null, 2) + "\n");
  // The record: one entry per run whose inputs, parameters or figures changed.
  const historyFile = "data/forecast-history.json";
  const history = fs.existsSync(historyFile) ? read(historyFile) : { about: "Every forecast run that changed the figures, oldest first; the last entry is data/forecast.json. Scored together after the vote.", runs: [] };
  const entry = { generated: out.generated, generatedAt: out.generatedAt, final: out.final, polls: out.inputs.field.map((p) => p.id), parameters: out.parameters, blocs: Object.fromEntries(Object.entries(out.blocs).map(([b, v]) => [b, v.point])), blocListSums: Object.fromEntries(Object.entries(out.blocs).map(([b, v]) => [b, v.listSum])), majority: out.majority, largestList: out.largestList, lists: Object.fromEntries(Object.entries(out.lists).map(([id, l]) => [id, { point: l.point, passes: l.passes }])) };
  const last = history.runs.at(-1), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const changed = !last || !same({ ...last, generated: 0, generatedAt: 0, final: 0 }, { ...entry, generated: 0, generatedAt: 0, final: 0 }) || last.final !== entry.final;
  if (changed) history.runs.push(entry); else history.runs[history.runs.length - 1] = { ...last, generatedAt: entry.generatedAt, generated: entry.generated };
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2) + "\n");
  console.log(`${changed ? "figures changed: recorded" : "figures unchanged"}; ${history.runs.length} run${history.runs.length === 1 ? "" : "s"} on record${FINAL ? "; FINAL" : ""}`);
}
console.log(JSON.stringify({ parameters: out.parameters, blocs: out.blocs, majority: out.majority, netLargerThanOpp: out.netLargerThanOpp, largestList: out.largestList }));
console.table(Object.entries(out.lists).map(([id, l]) => ({ id, ...l })));
