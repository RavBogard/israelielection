import { randomUUID } from "node:crypto";
import { ELECTION_END, formationEnabled, officialEnabled } from "./core";
import { campaignContext, emptyLedger, resolveLifecycle } from "./resolver";
import { acquireLiveBridge, appendSnapshots } from "./bridge";
import { acquireOfficial, acquirePoliticalSources } from "./sources";
import { acquireGeography } from "./geography";
import { healthRecord } from "./acquisition";
import type { LifecycleStore } from "./store";
export type WorkerMode = "election" | "formation" | "briefing";
export async function runLifecycleWorker(
  store: LifecycleStore,
  delivery: string,
  mode: WorkerMode,
  now = new Date().toISOString(),
) {
  if (
    mode === "election" &&
    (Date.parse(now) < Date.parse("2026-10-26T00:00:00Z") ||
      Date.parse(now) >= Date.parse(ELECTION_END))
  )
    return { status: "outside_election_window" };
  if (mode !== "election" && !formationEnabled() && !officialEnabled())
    return { status: "formation_disabled" };
  if (await store.delivered(delivery)) return { status: "duplicate" };
  const token = randomUUID();
  if (!(await store.lock(token))) return { status: "busy" };
  try {
    if (await store.delivered(delivery)) return { status: "duplicate" };
    const ledger = (await store.load()) ?? emptyLedger();
    const [official, bridge, political] = await Promise.all([
      acquireOfficial(ledger, now),
      mode === "election"
        ? acquireLiveBridge(now)
        : Promise.resolve({ snapshots: [], health: [] }),
      mode !== "election"
        ? acquirePoliticalSources(ledger, now)
        : Promise.resolve({
            events: ledger.events,
            health: [],
            captures: [],
            extractionCache: ledger.extractionCache ?? {},
          }),
    ]);
    appendSnapshots(ledger, [
      ...(Date.parse(now) < Date.parse("2026-10-27T20:00:00Z")
        ? [campaignContext(now)]
        : []),
      ...bridge.snapshots,
      ...(official.snapshot ? [official.snapshot] : []),
    ]);
    ledger.events = political.events;
    ledger.extractionCache = political.extractionCache;
    ledger.captures.push(
      ...political.captures,
      ...(official.capture ? [official.capture] : []),
    );
    const byId = new Map(ledger.health.map((h) => [h.sourceId, h]));
    for (const h of [official.health, ...bridge.health, ...political.health])
      byId.set(h.sourceId, h);
    ledger.health = [...byId.values()];
    if (
      official.snapshot ||
      ledger.seatSnapshots.some((s) => s.basis === "official_seats")
    ) {
      try {
        const geo = await acquireGeography(
          now,
          official.snapshot ??
            ledger.seatSnapshots
              .filter((s) => s.basis === "official_seats")
              .at(-1) ??
            null,
        );
        if (geo) {
          ledger.geography = geo.snapshot;
          ledger.captures.push({ source: geo.snapshot.source, body: geo.body });
          byId.set(
            "cec-localities",
            healthRecord("cec-localities", "cec", "healthy", now),
          );
        }
      } catch {
        byId.set(
          "cec-localities",
          healthRecord(
            "cec-localities",
            "cec",
            "unavailable",
            now,
            byId.get("cec-localities"),
          ),
        );
      }
      ledger.health = [...byId.values()];
    }
    ledger.current = resolveLifecycle(ledger, now);
    if (mode === "briefing")
      ledger.briefings = [
        ...(ledger.briefings ?? []).filter((b) => b.date !== now.slice(0, 10)),
        {
          date: now.slice(0, 10),
          generatedAt: now,
          seatRevision: ledger.current.seatContext.revision,
          eventIds: ledger.current.politics.events.map((e) => e.id),
        },
      ].slice(-240);
    if (!(await store.publish(token, ledger, delivery, now)))
      throw new Error("publication_lock_expired");
    // Daily briefings are structured summaries of the same redacted public state; no separate inferred facts.
    return {
      status: "published",
      revision: ledger.current.revision,
      mode,
      briefing:
        mode === "briefing"
          ? {
              revision: ledger.current.revision,
              activeStages: ledger.current.politics.activeStages,
              confirmedPositions: ledger.current.politics.decisions,
              withheldCount: ledger.current.politics.withheldCount,
            }
          : undefined,
    };
  } finally {
    await store.unlock(token);
  }
}
