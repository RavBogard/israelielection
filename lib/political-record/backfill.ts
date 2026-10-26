import type { LifecycleLedger, SourceRef } from "../election-lifecycle/types";
import { currentElection } from "./registry";
import { formationIdentity } from "./identity";
import { makeRecord, makeSource } from "./records";
import type { CaptureArchive } from "./captures";
import type { RecordBatch, PoliticalRecord } from "./types";

/** Import legacy evidence honestly: an absent raw capture remains explicitly missing. */
export async function lifecycleBatch(
  ledger: LifecycleLedger,
  archive?: CaptureArchive,
): Promise<RecordBatch> {
  const batch: RecordBatch = {
    records: [],
    sources: [],
    captures: [],
    outbox: [],
  };
  const election = currentElection();
  if (
    [
      ...ledger.events,
      ...ledger.seatSnapshots,
      ...(ledger.current ? [ledger.current] : []),
    ].some((item) => item.election !== election.electionDay)
  )
    throw new Error("legacy_election_scope_mismatch");
  const sourceOf = (ref: SourceRef) =>
    makeSource({
      sourceId: ref.id,
      publisher: ref.publisher,
      title: ref.title,
      captureHash: ref.captureHash,
      url: ref.url,
      authority: ref.authority,
      observedAt: ref.observedAt,
      publishedAt: ref.publishedAt,
    });
  const refs = [
    ...ledger.captures.map((c) => c.source),
    ...ledger.events.flatMap((e) => e.sources),
    ...ledger.seatSnapshots.flatMap((s) => s.sourceRefs),
  ];
  const sources = new Map(
    refs.map((ref) => {
      const source = sourceOf(ref);
      return [source.revisionId, { source, ref }];
    }),
  );
  for (const { source, ref } of sources.values()) {
    batch.sources.push(source);
    const captured = ledger.captures.find(
      (c) =>
        c.source.id === ref.id &&
        c.source.captureHash === ref.captureHash &&
        c.source.observedAt === ref.observedAt,
    );
    if (archive && captured)
      batch.captures.push(
        await archive.put(source, Buffer.from(captured.body), "text/html"),
      );
  }
  const base = {
    electionId: election.id,
    previousRevisionId: null,
    evidenceClass: "legacy_import" as const,
  };
  const provenance = (legacyRevision: string, refs: SourceRef[]) => {
    const sourceRevisions = [
      ...new Set(refs.map((ref) => sourceOf(ref).revisionId)),
    ];
    const captures = batch.captures
      .filter((c) => sourceRevisions.includes(c.sourceRevisionId))
      .map((c) => c.captureId);
    return {
      sourceIds: sourceRevisions,
      captureIds: captures,
      missingCapture: captures.length < sourceRevisions.length,
      legacyRevision,
    };
  };
  for (const event of ledger.events) {
    const status: PoliticalRecord["status"] =
      event.status === "retracted"
        ? "withdrawn"
        : event.status === "superseded"
          ? "corrected"
          : event.status;
    batch.records.push(
      makeRecord({
        ...base,
        recordId: `legacy-event:${event.id}`,
        kind: "event",
        effectiveAt: event.effectiveAt,
        observedAt: event.observedAt,
        status,
        payload: { event, identity: formationIdentity(event) },
        provenance: provenance(event.revision, event.sources),
      }),
    );
  }
  for (const snapshot of ledger.seatSnapshots)
    batch.records.push(
      makeRecord({
        ...base,
        recordId: `seat:${snapshot.revision}`,
        kind: "snapshot",
        effectiveAt: snapshot.publishedAt,
        observedAt: snapshot.observedAt,
        status: "confirmed",
        payload: { snapshot },
        provenance: provenance(snapshot.revision, snapshot.sourceRefs),
      }),
    );
  return batch;
}
