import { recordHash } from "./hash";
import { lifecycleBatch } from "./backfill";
import type { LifecycleLedger } from "../election-lifecycle/types";
import type { PoliticalRecordRepository } from "./types";
import type { CaptureArchive } from "./captures";
/** Explicit shadow operation. Never promotes Postgres or rolls back the Redis publication. */
export async function shadowLifecycle(
  repository: PoliticalRecordRepository,
  ledger: LifecycleLedger,
  archive?: CaptureArchive,
) {
  const batch = await lifecycleBatch(ledger, archive);
  const inserted = await repository.append(batch);
  const mismatches: string[] = [];
  for (const expected of batch.records) {
    const actual = await repository.getRevision(expected.revisionId);
    // SQL timestamps normalize the envelope; compare factual payload and provenance without changing legacy revisions.
    if (
      !actual ||
      recordHash(actual.payload) !== recordHash(expected.payload) ||
      recordHash(actual.provenance) !== recordHash(expected.provenance) ||
      actual.electionId !== expected.electionId
    )
      mismatches.push(expected.revisionId);
  }
  return {
    inserted,
    compared: batch.records.length,
    mismatches,
    ready: mismatches.length === 0,
    privateArchive: archive ? "configured" : "unconfigured",
  };
}
