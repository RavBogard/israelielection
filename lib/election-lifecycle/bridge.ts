import { cadenceFresh } from "./cadence";
import { configuredStore } from "../live-forecast/store";
import partyData from "../../data/parties.json";
import { ELECTION, fingerprint, POLLS_CLOSE, validSeats } from "./core";
import type { LifecycleLedger, SharedSeatContext, SourceHealth } from "./types";
import type { LiveForecastSnapshot } from "../live-forecast/types";
/** Reads the already acquired durable exit inputs; viewers never fetch broadcasters or simulate. */
export async function acquireLiveBridge(now: string) {
  const store = configuredStore();
  if (!store || Date.parse(now) < Date.parse(POLLS_CLOSE))
    return {
      snapshots: [] as SharedSeatContext[],
      health: [] as SourceHealth[],
    };
  const live = await store.read();
  if (!live) return { snapshots: [], health: [] };
  const inputs = await store.inputs(live.revision),
    fresh = cadenceFresh(
      now,
      live.freshness.lastSuccessfulAcquisitionAt,
      live.freshness.lastAttemptAt,
      live.changeReason === "acquisition_failed",
    );
  const snapshots: SharedSeatContext[] = [],
    health: SourceHealth[] = [];
  for (const p of inputs?.exits ?? []) {
    const pointSeats = Object.fromEntries(
      Object.entries(p.results).map(([id, r]) => [id, r.seats]),
    );
    if (p.combined.length || !validSeats(pointSeats)) continue;
    const snapshotRevision = fingerprint({
        publisher: p.pollster,
        results: p.results,
      }),
      revision = fingerprint({ basis: "named_exit", snapshotRevision }),
      sourceId = `exit:${p.pollster}`;
    const source =
      live.sources.find(
        (s) => s.publisher === p.pollster && s.status === "valid",
      ) ??
      live.sources.find(
        (s) => s.transport === "wikipedia" && s.status === "valid",
      );
    const publishedAt =
        source?.transport === "wikipedia" ? null : (p.broadcastAt ?? null),
      observedAt =
        live.freshness.lastSuccessfulAcquisitionAt ?? live.generatedAt;
    snapshots.push({
      schemaVersion: 1,
      election: ELECTION,
      revision,
      snapshotRevision,
      sequence: 0,
      updatedAt: now,
      evidenceStage: live.sources.some(
        (s) => s.id === "official-count" && s.revision !== "unavailable",
      )
        ? "counting"
        : "exit",
      basis: "named_exit",
      seatStatus: "estimated",
      pointMethod: "published_named_exit",
      pointSeats,
      parties: partyData.parties
        .filter((p) => p.id in pointSeats)
        .map((p) => ({
          id: p.id,
          label: p.short,
          profiled: true,
          bloc: p.bloc,
        })),
      sourceRefs: [
        {
          id: sourceId,
          publisher: p.pollster,
          title: "Validated publisher exit estimate",
          url:
            p.url ?? source?.url ?? "https://www.israelvotes.org/results",
          authority: "broadcaster",
          publishedAt,
          observedAt,
          captureHash: snapshotRevision,
        },
      ],
      publishedAt,
      observedAt,
      correctionOf: null,
      freshness: {
        status: fresh ? "current" : "stale",
        checkedAt: live.freshness.lastSuccessfulAcquisitionAt,
        lastAttemptAt: live.freshness.lastAttemptAt,
      },
      reasonCodes: ["count_projection_gated"],
    });
    health.push({
      sourceId,
      authority: "broadcaster",
      status: fresh ? "healthy" : "unavailable",
      checkedAt: now,
      lastSuccessfulAt: live.freshness.lastSuccessfulAcquisitionAt,
      reason: fresh ? null : "source_unavailable",
    });
  }
  const point = live.representativePoint;
  if (
    live.mode !== "prior" &&
    point &&
    live.diagnostics.stable &&
    validSeats(point.seats) &&
    live.mode !== "count"
  ) {
    const revision = fingerprint({
        basis: "live_projection",
        snapshotRevision: live.revision,
        point,
      }),
      sourceId = "live-projection";
    snapshots.push({
      schemaVersion: 1,
      election: ELECTION,
      revision,
      snapshotRevision: live.revision,
      sequence: 0,
      updatedAt: now,
      evidenceStage: "exit",
      basis: "live_projection",
      seatStatus: "estimated",
      pointMethod: "representative_joint_draw",
      pointSeats: point.seats,
      parties: partyData.parties
        .filter((p) => p.id in point.seats)
        .map((p) => ({
          id: p.id,
          label: p.short,
          profiled: true,
          bloc: p.bloc,
        })),
      sourceRefs: [
        {
          id: sourceId,
          publisher: "Israeli Election",
          title: "Experimental exit-informed joint simulation",
          url: "https://www.israelvotes.org/results",
          authority: "model",
          publishedAt: live.generatedAt,
          observedAt: live.generatedAt,
          captureHash: live.revision,
        },
      ],
      publishedAt: live.generatedAt,
      observedAt: live.generatedAt,
      correctionOf: null,
      uncertainty: {
        snapshotRevision: live.revision,
        intervalLevel: 0.8,
        partyIntervals: Object.fromEntries(
          live.partySeats.map((p) => [p.id, p.seats]),
        ),
        jointPoint: {
          method: "representative_joint_draw",
          snapshotRevision: live.revision,
          drawIndex: point.drawIndex,
        },
      },
      freshness: {
        status: fresh ? "current" : "stale",
        checkedAt: live.freshness.lastSuccessfulAcquisitionAt,
        lastAttemptAt: live.freshness.lastAttemptAt,
      },
      reasonCodes: ["count_projection_gated"],
    });
    health.push({
      sourceId,
      authority: "model",
      status: fresh ? "healthy" : "unavailable",
      checkedAt: now,
      lastSuccessfulAt: live.freshness.lastSuccessfulAcquisitionAt,
      reason: fresh ? null : "source_unavailable",
    });
  }
  const count = countSnapshot(live, now, fresh);
  if (count) {
    snapshots.push(count);
    health.push({
      sourceId: "count-projection",
      authority: "model",
      status: fresh ? "healthy" : "unavailable",
      checkedAt: now,
      lastSuccessfulAt: live.freshness.lastSuccessfulAcquisitionAt,
      reason: fresh ? null : "source_unavailable",
    });
  }
  return { snapshots, health };
}
/**
 * Once enough of the expected vote is counted (the nowcast's own threshold, mode "count"), the count-informed
 * projection of the final result is the seat context; below it, nothing is emitted and exits keep the grid.
 */
export function countSnapshot(
  live: LiveForecastSnapshot,
  now: string,
  fresh: boolean,
): SharedSeatContext | null {
  const estimate = live.countEstimate;
  if (!estimate || estimate.mode !== "count" || !validSeats(estimate.seats))
    return null;
  const at = estimate.capturedAt ?? live.generatedAt;
  const snapshotRevision = fingerprint({
      basis: "count_projection",
      seats: estimate.seats,
      capturedAt: estimate.capturedAt,
      coverage: estimate.coverage.votes,
    }),
    revision = fingerprint({ basis: "partial_count", snapshotRevision });
  return {
    schemaVersion: 1,
    election: ELECTION,
    revision,
    snapshotRevision,
    sequence: 0,
    updatedAt: now,
    evidenceStage: "counting",
    basis: "partial_count",
    seatStatus: "estimated",
    pointMethod: "partial_count_allocation",
    pointSeats: estimate.seats,
    parties: partyData.parties
      .filter((p) => p.id in estimate.seats)
      .map((p) => ({ id: p.id, label: p.short, profiled: true, bloc: p.bloc })),
    sourceRefs: [
      {
        id: "count-projection",
        publisher: "Israeli Election",
        title: "Count-informed projection of the final result",
        url: "https://www.israelvotes.org/results",
        authority: "model",
        publishedAt: live.generatedAt,
        observedAt: at,
        captureHash: snapshotRevision,
      },
    ],
    publishedAt: live.generatedAt,
    observedAt: at,
    countSourceUpdatedAt: estimate.sourceUpdatedAt ?? null,
    countCoverage: estimate.coverage.votes,
    correctionOf: null,
    uncertainty: {
      snapshotRevision,
      intervalLevel: 0.8,
      partyIntervals: Object.fromEntries(
        Object.entries(estimate.seats).map(([id, median]) => [
          id,
          {
            lo: Math.min(median, estimate.intervals[id]?.lo ?? median),
            median,
            hi: Math.max(median, estimate.intervals[id]?.hi ?? median),
          },
        ]),
      ),
      jointPoint: { method: "partial_count_allocation", snapshotRevision },
    },
    freshness: {
      status: fresh ? "current" : "stale",
      checkedAt: live.freshness.lastSuccessfulAcquisitionAt,
      lastAttemptAt: live.freshness.lastAttemptAt,
    },
    reasonCodes: [],
  };
}
export function appendSnapshots(
  ledger: LifecycleLedger,
  incoming: SharedSeatContext[],
) {
  for (const s of incoming)
    if (!ledger.seatSnapshots.some((old) => old.revision === s.revision)) {
      if (s.basis === "official_seats") {
        const old = ledger.seatSnapshots
          .filter((s) => s.basis === "official_seats")
          .at(-1);
        if (old) s.correctionOf = old.revision;
      }
      ledger.seatSnapshots.push(s);
    }
  return ledger;
}
