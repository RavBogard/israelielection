import type { PoliticalRecord, SourceRecord } from "./types";
export type QualifiedSource = {
  revisionId: string;
  sourceId: string;
  publisher: string;
  title: string;
  url: string;
  authority: string;
  publishedAt: string | null;
  observedAt: string;
};
export type QualifiedRow = {
  recordId: string;
  revisionId: string;
  title: string;
  observedAt: string;
  effectiveAt: string | null;
  sources: QualifiedSource[];
  captureState: "retained" | "missing";
};
export type QualifiedIndicator = QualifiedRow & {
  seriesId: 120010;
  period: string;
  monthlyPercent: number;
  annualPercent: number;
  indexValue: number;
  baseDescription: string;
  releaseDate: null;
  units: { index: "index"; percent: "percent" };
  causation: "not_established";
};
export type MembershipPayload = {
  termId: string;
  personId: string;
  personName: string;
  partyId: string | null;
  role: "member" | "speaker" | "committee_chair";
  startedAt: string;
  endedAt: string | null;
  documentId: string;
};
export type BillPayload = {
  billId: string;
  title: string;
  termId: string;
  stage:
    | "introduced"
    | "preliminary_passed"
    | "first_reading_passed"
    | "committee"
    | "second_reading_passed"
    | "third_reading_passed"
    | "published_law"
    | "withdrawn"
    | "rejected";
  occurredAt: string;
  documentUrl: string;
  supersedesDocumentId: string | null;
  documentId: string;
};
export type GovernmentPayload = {
  governmentId: string;
  title: string;
  state: "formed" | "caretaker" | "ended";
  startedAt: string;
  endedAt: string | null;
  nomineePersonId: string | null;
  sourceEventIds: string[];
};
export type QualifiedMembership = QualifiedRow & MembershipPayload;
export type QualifiedBill = QualifiedRow & BillPayload;
export type QualifiedGovernment = QualifiedRow & GovernmentPayload;
export function qualifiedSources(
  record: PoliticalRecord,
  sources: SourceRecord[],
  authorities: string[],
) {
  if (
    record.status !== "confirmed" ||
    record.evidenceClass !== "primary_confirmed" ||
    !record.provenance.sourceIds.length
  )
    return null;
  const selected = record.provenance.sourceIds.map((id) =>
    sources.find((source) => source.revisionId === id),
  );
  if (
    selected.some(
      (source) => !source || !authorities.includes(source.authority),
    )
  )
    return null;
  return selected as SourceRecord[];
}
export function qualifiedBase(
  record: PoliticalRecord,
  sources: SourceRecord[],
  title: string,
): QualifiedRow {
  return {
    recordId: record.recordId,
    revisionId: record.revisionId,
    title,
    observedAt: record.observedAt,
    effectiveAt: record.effectiveAt,
    captureState: record.provenance.missingCapture ? "missing" : "retained",
    sources: sources.map((source) => ({
      revisionId: source.revisionId,
      sourceId: source.sourceId,
      publisher: source.publisher,
      title: source.title,
      url: source.url,
      authority: source.authority,
      publishedAt: source.publishedAt,
      observedAt: source.observedAt,
    })),
  };
}
export function qualifiedIndicator(
  record: PoliticalRecord,
  sources: SourceRecord[],
): QualifiedIndicator | null {
  if (
    record.kind !== "indicator_observation" ||
    record.electionId !== null ||
    record.provenance.parserVersion !== "cbs-price-v1"
  )
    return null;
  const refs = qualifiedSources(record, sources, ["cbs"]);
  if (
    !refs ||
    refs.some((source) => new URL(source.url).hostname !== "api.cbs.gov.il")
  )
    return null;
  const p = record.payload;
  if (
    p.seriesId !== 120010 ||
    typeof p.name !== "string" ||
    !p.name ||
    typeof p.period !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(p.period) ||
    typeof p.baseDescription !== "string" ||
    !p.baseDescription ||
    ![p.monthlyPercent, p.annualPercent, p.indexValue].every(
      (value) => typeof value === "number" && Number.isFinite(value),
    ) ||
    p.releaseDate !== null
  )
    return null;
  return {
    ...qualifiedBase(record, refs, p.name),
    seriesId: 120010,
    period: p.period,
    monthlyPercent: Number(p.monthlyPercent),
    annualPercent: Number(p.annualPercent),
    indexValue: Number(p.indexValue),
    baseDescription: p.baseDescription,
    releaseDate: null,
    units: { index: "index", percent: "percent" },
    causation: "not_established",
  };
}
export const isoTime = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
export const stableId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,180}$/.test(value);
export function validateMembership(value: unknown): MembershipPayload {
  const p = value as MembershipPayload;
  if (
    !p ||
    !stableId(p.termId) ||
    !stableId(p.personId) ||
    typeof p.personName !== "string" ||
    !p.personName ||
    p.personName.length > 200 ||
    (p.partyId !== null && !stableId(p.partyId)) ||
    !["member", "speaker", "committee_chair"].includes(p.role) ||
    !isoTime(p.startedAt) ||
    (p.endedAt !== null &&
      (!isoTime(p.endedAt) ||
        Date.parse(p.endedAt) < Date.parse(p.startedAt))) ||
    !stableId(p.documentId)
  )
    throw new Error("membership_schema_invalid");
  return p;
}
export function validateBill(value: unknown): BillPayload {
  const p = value as BillPayload;
  if (
    !p ||
    !stableId(p.billId) ||
    !stableId(p.termId) ||
    typeof p.title !== "string" ||
    !p.title ||
    p.title.length > 300 ||
    ![
      "introduced",
      "preliminary_passed",
      "first_reading_passed",
      "committee",
      "second_reading_passed",
      "third_reading_passed",
      "published_law",
      "withdrawn",
      "rejected",
    ].includes(p.stage) ||
    !isoTime(p.occurredAt) ||
    !stableId(p.documentId) ||
    (p.supersedesDocumentId !== null && !stableId(p.supersedesDocumentId))
  )
    throw new Error("bill_schema_invalid");
  const url = new URL(p.documentUrl);
  if (
    url.protocol !== "https:" ||
    !/(^|\.)knesset\.gov\.il$/.test(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error("bill_document_unqualified");
  return p;
}
export function validateGovernment(value: unknown): GovernmentPayload {
  const p = value as GovernmentPayload;
  if (
    !p ||
    !stableId(p.governmentId) ||
    typeof p.title !== "string" ||
    !p.title ||
    !["formed", "caretaker", "ended"].includes(p.state) ||
    !isoTime(p.startedAt) ||
    (p.endedAt !== null &&
      (!isoTime(p.endedAt) ||
        Date.parse(p.endedAt) < Date.parse(p.startedAt))) ||
    (p.nomineePersonId !== null && !stableId(p.nomineePersonId)) ||
    !Array.isArray(p.sourceEventIds) ||
    !p.sourceEventIds.length ||
    p.sourceEventIds.some((id) => !stableId(id))
  )
    throw new Error("government_schema_invalid");
  return p;
}
