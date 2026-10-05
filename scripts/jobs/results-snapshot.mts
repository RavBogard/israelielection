/** Run against the deployed validated endpoint: the CEC CDN rejects GitHub runner requests. */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import configJson from "../../data/results.json";
import { captureAllowed } from "../../lib/results-capture";
import { rotateSnapshot, type SnapshotStore } from "../../lib/results-snapshot";
import type { ResultsConfig } from "../../lib/results";
const cfg = configJson as ResultsConfig;
const now = Date.now(); const manual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
let changed = false;
if (!captureAllowed(cfg.pollsClose, now, manual)) console.log("Outside the permitted count-capture window; no request made.");
else {
  const response = await fetch("https://www.israelielection.org/api/results-snapshot", { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Snapshot endpoint unavailable: HTTP ${response.status}`);
  const store = JSON.parse(readFileSync("data/results-snapshot.json", "utf8")) as SnapshotStore;
  const next = rotateSnapshot(store, await response.json(), cfg, Date.now());
  if (next) { writeFileSync("data/results-snapshot.json", `${JSON.stringify(next, null, 2)}\n`); changed = true; console.log(`Captured distinct validated count ${next.current!.hash.slice(0, 12)}.`); }
  else console.log("No new valid fresh count; saved snapshots retained.");
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
