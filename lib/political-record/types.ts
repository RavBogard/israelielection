/** Canonical, language-independent core. These records are separate from current Redis projections. */
export type RecordKind =
  | "election"
  | "entity"
  | "proposal"
  | "mandate_attempt"
  | "claim"
  | "event"
  | "snapshot"
  | "publication"
  | "edition"
  | "source_health"
  | "parliamentary_membership"
  | "bill"
  | "bill_version"
  | "roll_call"
  | "indicator_observation";
export type EvidenceClass =
  | "primary_confirmed"
  | "reported_corroborated"
  | "legacy_import"
  | "model_output";
export type AssertionStatus =
  "confirmed" | "reported" | "disputed" | "corrected" | "withdrawn" | "unknown";
export type Provenance = {
  sourceIds: string[];
  captureIds: string[];
  legacyRevision?: string;
  missingCapture?: boolean;
  evidenceQuote?: string;
  parserVersion?: string;
};
export type PoliticalRecord<T = Record<string, unknown>> = {
  schemaVersion: 1;
  revisionId: string;
  recordId: string;
  kind: RecordKind;
  electionId: string | null;
  effectiveAt: string | null;
  observedAt: string;
  status: AssertionStatus;
  evidenceClass: EvidenceClass;
  previousRevisionId: string | null;
  payload: T;
  provenance: Provenance;
};
export type PublicationPayload = {
  category: "fact_change" | "historical_context" | "attributed_interpretation";
  recordRevisionIds: string[];
  titleKey: string;
  data: Record<string, unknown>;
};
export type EditionPayload = {
  publicationRevisionId: string;
  locale: "en" | "he" | "ar" | "fa" | "de" | "fr" | "zh";
  state: "ready" | "stale" | "failed";
  translatedFromRevisionId: string;
  content: Record<string, unknown>;
};
/** An outbox intent contains no subscriber addresses; delivery workers resolve private recipient groups later. */
export type OutboxIntent = {
  id: string;
  topic:
    | "publication_committed"
    | "record_corrected"
    | "edition_ready"
    | "readiness_blocked";
  aggregateRevisionId: string;
  createdAt: string;
  payload: Record<string, unknown>;
};
export type SourceRecord = {
  revisionId: string;
  sourceId: string;
  publisher: string;
  title: string;
  captureHash: string;
  url: string;
  authority: string;
  observedAt: string;
  publishedAt: string | null;
};
export type PrivateCaptureRef = {
  captureId: string;
  contentSha256: string;
  sourceRevisionId: string;
  storageKey: string;
  mediaType: string;
  byteLength: number;
  observedAt: string;
};
export type RecordBatch = {
  records: PoliticalRecord[];
  sources: SourceRecord[];
  captures: PrivateCaptureRef[];
  outbox: OutboxIntent[];
};
export interface PoliticalRecordRepository {
  append(
    batch: RecordBatch,
  ): Promise<{ records: number; captures: number; outbox: number }>;
  getRevision(revisionId: string): Promise<PoliticalRecord | null>;
  getLatest(recordId: string): Promise<PoliticalRecord | null>;
  listRevisions(query: {
    electionId?: string;
    kind?: RecordKind;
    after?: string;
    limit?: number;
  }): Promise<PoliticalRecord[]>;
  changes(
    after?: string,
    limit?: number,
  ): Promise<{ cursor: string; record: PoliticalRecord }[]>;
  latest(query: {
    electionId?: string;
    kind?: RecordKind;
    limit?: number;
  }): Promise<{
    asOfCursor: string;
    truncated: boolean;
    records: PoliticalRecord[];
  }>;
  close(): Promise<void>;
}
