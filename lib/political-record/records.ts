import { recordHash } from "./hash";
import type {
  PoliticalRecord,
  OutboxIntent,
  RecordBatch,
  SourceRecord,
  PrivateCaptureRef,
} from "./types";
export function makeSource(
  input: Omit<SourceRecord, "revisionId">,
): SourceRecord {
  const source = {
    ...input,
    observedAt: new Date(input.observedAt).toISOString(),
    publishedAt: input.publishedAt
      ? new Date(input.publishedAt).toISOString()
      : null,
  };
  return { ...source, revisionId: recordHash(source) };
}
export function makeCapture(
  input: Omit<PrivateCaptureRef, "captureId">,
): PrivateCaptureRef {
  const capture = {
    ...input,
    observedAt: new Date(input.observedAt).toISOString(),
  };
  return { ...capture, captureId: recordHash(capture) };
}
export function makeRecord<T extends Record<string, unknown>>(
  input: Omit<PoliticalRecord<T>, "revisionId" | "schemaVersion">,
): PoliticalRecord<T> {
  const record = {
    ...input,
    schemaVersion: 1 as const,
    observedAt: new Date(input.observedAt).toISOString(),
    effectiveAt: input.effectiveAt
      ? new Date(input.effectiveAt).toISOString()
      : null,
  };
  delete (record as Partial<PoliticalRecord>).revisionId;
  return { ...record, revisionId: recordHash(record) };
}
export function publicationIntent(
  record: PoliticalRecord,
  topic: OutboxIntent["topic"],
): OutboxIntent {
  if (!["publication", "edition", "event", "claim"].includes(record.kind))
    throw new Error("outbox_record_kind_invalid");
  const value = {
    topic,
    aggregateRevisionId: record.revisionId,
    createdAt: record.observedAt,
    payload: { electionId: record.electionId, recordId: record.recordId },
  };
  return { ...value, id: recordHash(value) };
}
export function validateBatch(batch: RecordBatch) {
  for (const source of batch.sources) {
    const { revisionId, ...content } = source;
    const url = new URL(source.url);
    if (
      recordHash(content) !== revisionId ||
      !/^[a-f0-9]{64}$/.test(source.captureHash) ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !source.sourceId ||
      !source.authority ||
      !Number.isFinite(Date.parse(source.observedAt)) ||
      (source.publishedAt !== null &&
        !Number.isFinite(Date.parse(source.publishedAt)))
    )
      throw new Error("source_integrity_failed");
  }
  for (const capture of batch.captures) {
    const { captureId, ...content } = capture;
    if (
      recordHash(content) !== captureId ||
      !/^[a-f0-9]{64}$/.test(capture.contentSha256) ||
      !/^[a-f0-9]{64}$/.test(capture.sourceRevisionId) ||
      !/^private\/[a-zA-Z0-9/_-]+$/.test(capture.storageKey) ||
      !Number.isSafeInteger(capture.byteLength) ||
      capture.byteLength <= 0 ||
      !capture.mediaType ||
      !Number.isFinite(Date.parse(capture.observedAt))
    )
      throw new Error("capture_integrity_failed");
  }
  for (const record of batch.records) {
    const { revisionId, ...content } = record;
    if (
      !/^[a-f0-9]{64}$/.test(revisionId) ||
      recordHash(content) !== revisionId ||
      !record.recordId ||
      !Number.isFinite(Date.parse(record.observedAt)) ||
      (record.effectiveAt !== null &&
        !Number.isFinite(Date.parse(record.effectiveAt)))
    )
      throw new Error("record_integrity_failed");
  }
  for (const intent of batch.outbox) {
    const { id, ...content } = intent;
    if (
      recordHash(content) !== id ||
      /"(?:email|emailAddress|recipientAddress|recipients)"\s*:/i.test(
        JSON.stringify(intent.payload),
      )
    )
      throw new Error("outbox_integrity_failed");
  }
}
