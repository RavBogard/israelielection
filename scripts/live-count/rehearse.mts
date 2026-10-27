/** Preview rehearsal: after capture.mts --replay wrote a partial count, run the forecast worker here against the
 * preview stores (so the run uses this branch's code) and print what the seat context would become. */
import { configuredStore } from "../../lib/live-forecast/store";
import { runWorker } from "../../lib/live-forecast/worker";
import { countSnapshot } from "../../lib/election-lifecycle/bridge";
import partyData from "../../data/parties.json";
if ((process.env.ELECTION_LIFECYCLE_NAMESPACE ?? process.env.VERCEL_ENV) !== "preview") throw new Error("preview only");
const store = configuredStore();
if (!store) throw new Error("no store");
const now = new Date().toISOString();
console.log(JSON.stringify(await runWorker(store, "rehearsal:" + now, now)));
const live = (await store.read())!;
const e = live.countEstimate;
const bloc = (seats: Record<string, number>) => {
  const out: Record<string, number> = {};
  for (const p of partyData.parties) if (seats[p.id]) out[p.bloc] = (out[p.bloc] ?? 0) + seats[p.id];
  return out;
};
const ctx = countSnapshot(live, now, true);
console.log(JSON.stringify({ mode: e?.mode, coverage: e?.coverage.votes.toFixed(3), localities: e?.coverage.localitiesReporting, countBlocs: e && bloc(e.seats), exitBlocs: live.representativePoint && bloc(live.representativePoint.seats), seatContext: ctx?.basis ?? "exit (no count context)" }));
