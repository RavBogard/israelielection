import { lifecycleBatch } from "./backfill";
import { resolveLifecycle } from "../election-lifecycle/resolver";
import type { LifecycleLedger } from "../election-lifecycle/types";
import { makeRecord } from "./records";
import { recordHash } from "./hash";
import type { PoliticalRecordRepository } from "./types";
import type { CaptureArchive } from "./captures";

/** New qualified notice records do not change the evidence class of any legacy import. */
export async function stageLifecycleNotices(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive,
  ledger: LifecycleLedger,
  now: string,
) {
  const current = resolveLifecycle(ledger, now),
    batch = await lifecycleBatch(ledger, archive);
  const records = [];
  for (const record of batch.records) {
    if (record.provenance.missingCapture) continue;
    const event = record.payload.event as
      (typeof ledger.events)[number] | undefined;
    const snapshot = record.payload.snapshot as
      (typeof ledger.seatSnapshots)[number] | undefined;
    const acceptedEvent =
      event &&
      current.politics.events.some(
        (row) => row.id === event.id && row.revision === event.revision,
      );
    const acceptedSeats =
      snapshot?.basis === "official_seats" &&
      snapshot.seatStatus === "official" &&
      current.seatContext.revision === snapshot.revision;
    if (!acceptedEvent && !acceptedSeats) continue;
    const recordId = event
      ? `primary-event:${event.claimKey}`
      : `primary-official-seats:${record.electionId}`;
    const previous = await repository.getLatest(recordId);
    const payload = event ? { event } : { snapshot };
    const semanticHash = recordHash(
      event
        ? Object.fromEntries(
            Object.entries(event).filter(
              ([key]) =>
                ![
                  "id",
                  "revision",
                  "sources",
                  "observedAt",
                  "publishedAt",
                  "quote",
                ].includes(key),
            ),
          )
        : snapshot?.pointSeats,
    );
    if (previous?.payload.semanticHash === semanticHash) continue;
    records.push(
      makeRecord({
        ...record,
        recordId,
        observedAt: now,
        previousRevisionId: previous?.revisionId ?? null,
        evidenceClass: "primary_confirmed",
        payload: { ...payload, semanticHash },
        provenance: {
          ...record.provenance,
          parserVersion: "current-qualified-lifecycle-notice-v1",
        },
      }),
    );
  }
  if (records.length)
    await repository.append({ ...batch, records, outbox: [] });
  return {
    records: records.length,
    revisionIds: records.map((record) => record.revisionId),
  };
}
