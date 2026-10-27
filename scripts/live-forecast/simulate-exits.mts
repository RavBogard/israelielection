/** Runs the live model on the exit polls entered by hand in data/polls.json and prints the headline figures.
 * Usage: npx tsx scripts/live-forecast/simulate-exits.mts [now ISO, default 2026-10-27T23:30:00+02:00] */
import frozen from "../../data/live-forecast-prior.json";
import { buildSnapshot, modelRevision } from "../../lib/live-forecast/model";
import { manualExits, latestPublisherRevisions } from "../../lib/live-forecast/sources";
const now = process.argv[2] ?? "2026-10-27T23:30:00+02:00";
const exits = latestPublisherRevisions(manualExits(now));
const snapshot = buildSnapshot({
  prior: { version: frozen.version, sha256: frozen.sha256, generatedAt: frozen.forecast.generatedAt, final: frozen.forecast.final },
  revision: modelRevision(exits),
  now,
  exits,
});
const seat = (id: string) => snapshot.blocSeats?.find((b) => b.id === id)?.seats;
const fmt = (s?: { lo: number; median: number; hi: number }) => (s ? `${s.median} (${s.lo}-${s.hi})` : "n/a");
console.log(JSON.stringify({
  mode: snapshot.mode,
  modelVersion: snapshot.modelVersion,
  exits: exits.map((p) => `${p.pollster} ${p.broadcastAt}`),
  blocs: { net: fmt(seat("net")), opp: fmt(seat("opp")), arab: fmt(seat("arab")), mid: fmt(seat("mid")) },
  blocMargin: fmt(snapshot.blocMargin),
  likudLargest: snapshot.largestParty.find((p) => p.id === "likud")?.probability,
  netLead: snapshot.blocLead.find((p) => p.id === "net")?.probability,
  arrangements: Object.fromEntries(snapshot.arrangements.map((a) => [a.id, Math.round(a.probability * 1000) / 1000])),
  parties: Object.fromEntries(snapshot.partySeats.map((p) => [p.id, fmt(p.seats)])),
  thresholds: Object.fromEntries(snapshot.thresholds.map((t) => [t.id, Math.round(t.passProbability * 1000) / 1000])),
  stable: snapshot.diagnostics.stable,
}, null, 1));
