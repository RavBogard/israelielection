import { qualifiedIndicator } from "./domain";
import { makeRecord, makeSource, publicationIntent } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import { EMAIL_LOCALES, type EmailLocale } from "./email";
import { deliveryFactEligible } from "./eligibility";
import { publicationDistribution } from "./follows";
import type { PoliticalRecord, PoliticalRecordRepository } from "./types";
export type PublicationContent = { subject: string; text: string };
export type IndependentReview = {
  decision: "approve" | "reject";
  publicationRevisionId: string;
  locale: EmailLocale;
  contentHash: string;
  factRevisionIds: string[];
  generationRunId: string;
  reviewRunId: string;
  provider: string;
  model: string;
  verificationCaptureId?: string;
};
const editionId = (revision: string, locale: string) =>
  `publication-edition:${revision}:${locale}`;
function validContent(value: unknown): PublicationContent {
  const content = value as PublicationContent;
  if (
    !content ||
    typeof content.subject !== "string" ||
    !content.subject.trim() ||
    content.subject.length > 200 ||
    /[\r\n]/.test(content.subject) ||
    typeof content.text !== "string" ||
    !content.text.trim() ||
    content.text.length > 30000
  )
    throw new Error("publication_content_invalid");
  return { subject: content.subject, text: content.text };
}
async function evidence(
  repository: PoliticalRecordRepository,
  publication: PoliticalRecord,
  now: string,
  live: boolean,
  eligible: typeof deliveryFactEligible,
) {
  const ids = publication.payload.recordRevisionIds;
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 10 ||
    ids.some((id) => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id))
  )
    return null;
  const records = [];
  for (const id of ids) {
    const record = await repository.getRevision(id as string);
    if (
      !record ||
      !(
        (record.status === "confirmed" &&
          record.evidenceClass === "primary_confirmed") ||
        (record.status === "reported" &&
          ["reported_corroborated", "attributed_analysis"].includes(
            record.evidenceClass,
          ) &&
          record.provenance.parserVersion === "reviewed-briefing-claim-v1")
      ) ||
      record.provenance.missingCapture ||
      !record.provenance.sourceIds.length ||
      !record.provenance.captureIds.length
    )
      return null;
    if (live) {
      const latest = await repository.getLatest(record.recordId);
      if (
        latest?.revisionId !== record.revisionId ||
        !(await eligible(record, now))
      )
        return null;
    }
    const refs = await repository.getSources(record.provenance.sourceIds);
    if (
      refs.length !== record.provenance.sourceIds.length ||
      (record.kind === "indicator_observation" &&
        !qualifiedIndicator(record, refs))
    )
      return null;
    for (const captureId of record.provenance.captureIds) {
      const capture = await repository.getCapture(captureId);
      if (
        !capture ||
        !record.provenance.sourceIds.includes(capture.sourceRevisionId) ||
        refs.find((source) => source.revisionId === capture.sourceRevisionId)
          ?.captureHash !== capture.contentSha256
      )
        return null;
    }
    records.push(record);
  }
  return records;
}
/** Private authoring boundary; public APIs never create reviews, editions or source captures. */
export async function storeReviewedPublicationEdition(
  repository: PoliticalRecordRepository,
  publicationRevisionId: string,
  locale: EmailLocale,
  rawContent: unknown,
  review: IndependentReview,
  archive: CaptureArchive | null,
  now: string,
  eligible: typeof deliveryFactEligible = deliveryFactEligible,
) {
  if (!archive) throw new Error("publication_private_archive_required");
  const content = validContent(rawContent),
    publication = await repository.getRevision(publicationRevisionId);
  if (
    !EMAIL_LOCALES.includes(locale) ||
    publication?.kind !== "publication" ||
    publication.status !== "confirmed" ||
    (await repository.getLatest(publication.recordId))?.revisionId !==
      publicationRevisionId
  )
    throw new Error("publication_unqualified");
  const facts = await evidence(repository, publication, now, true, eligible);
  if (!facts) throw new Error("publication_evidence_unavailable");
  publicationDistribution(
    (publication.payload.data as Record<string, unknown>) ?? {},
  );
  if (
    review.decision !== "approve" ||
    review.publicationRevisionId !== publicationRevisionId ||
    review.locale !== locale ||
    review.contentHash !== recordHash(content) ||
    recordHash([...review.factRevisionIds].sort()) !==
      recordHash(facts.map((fact) => fact.revisionId).sort()) ||
    !review.generationRunId ||
    !review.reviewRunId ||
    review.generationRunId === review.reviewRunId ||
    !review.provider ||
    !review.model
  )
    throw new Error("publication_review_unqualified");
  const reviewIdentity = `review:${publicationRevisionId}:${locale}:${recordHash(review)}`;
  const previousReview = await repository.getLatest(reviewIdentity);
  if (previousReview && previousReview.status !== "confirmed")
    throw new Error("publication_review_revoked");
  const previous = await repository.getLatest(
    editionId(publicationRevisionId, locale),
  );
  if (
    previous?.status === "confirmed" &&
    previousReview?.revisionId === previous.payload.reviewRevisionId &&
    recordHash(previous.payload.content) === recordHash(content) &&
    previous.payload.translatedFromRevisionId === publicationRevisionId &&
    previous.payload.state === "ready"
  )
    return previous;
  const body = Buffer.from(
      JSON.stringify({ content, review, eligibilityCheckedAt: now }),
    ),
    source = makeSource({
      sourceId: `publication-review:${publicationRevisionId}:${locale}`,
      publisher: "Israeli Election",
      title: "Independent publication review",
      url: `https://www.israelvotes.org/api/v2/publications?revision=${publicationRevisionId}`,
      authority: "publication_review",
      captureHash: contentHash(body),
      observedAt: now,
      publishedAt: null,
    });
  const capture = await archive.put(source, body, "application/json");
  const reviewRecord = makeRecord({
    recordId: reviewIdentity,
    kind: "publication_review",
    electionId: publication.electionId,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: null,
    payload: { ...review, eligibilityCheckedAt: now },
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: [capture.captureId],
      parserVersion: "independent-publication-review-v1",
    },
  });
  const edition = makeRecord({
    recordId: editionId(publicationRevisionId, locale),
    kind: "edition",
    electionId: publication.electionId,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: {
      publicationRevisionId,
      translatedFromRevisionId: publicationRevisionId,
      locale,
      state: "ready",
      content,
      reviewRevisionId: reviewRecord.revisionId,
    },
    provenance: {
      sourceIds: facts.flatMap((fact) => fact.provenance.sourceIds),
      captureIds: [capture.captureId],
      parserVersion: "publication-edition-v1",
    },
  });
  await repository.append({
    records: [reviewRecord, edition],
    sources: [source],
    captures: [capture],
    outbox: [
      publicationIntent(
        publication,
        typeof (publication.payload.data as { correctsRevisionId?: unknown })
          ?.correctsRevisionId === "string"
          ? "record_corrected"
          : "publication_committed",
      ),
      publicationIntent(edition, "edition_ready"),
    ],
  });
  return edition;
}
/** Every current request rechecks exact facts; an ETag can never rescue a withdrawn claim. */
export async function projectPublication(
  repository: PoliticalRecordRepository,
  publication: PoliticalRecord,
  locale: EmailLocale,
  now: string,
  view: "latest" | "history",
  eligible: typeof deliveryFactEligible = deliveryFactEligible,
): Promise<
  PoliticalRecord & { currentState: boolean; historicalState?: string }
> {
  const hidden = {
    ...publication,
    payload: {
      category: publication.payload.category,
      recordRevisionIds: publication.payload.recordRevisionIds,
      currentTextUnavailable: true,
    },
    currentState: false,
  };
  const latest = await repository.getLatest(publication.recordId);
  if (
    view === "latest" &&
    (latest?.revisionId !== publication.revisionId ||
      publication.status !== "confirmed")
  )
    return hidden;
  const edition = await repository.getLatest(
    editionId(publication.revisionId, locale),
  );
  if (
    edition?.kind !== "edition" ||
    edition.status !== "confirmed" ||
    edition.provenance.parserVersion !== "publication-edition-v1" ||
    edition.payload.publicationRevisionId !== publication.revisionId ||
    edition.payload.translatedFromRevisionId !== publication.revisionId ||
    edition.payload.locale !== locale ||
    edition.payload.state !== "ready"
  )
    return hidden;
  const review = await repository.getRevision(
    String(edition.payload.reviewRevisionId),
  );
  let content: PublicationContent;
  try {
    content = validContent(edition.payload.content);
  } catch {
    return hidden;
  }
  if (
    review?.kind !== "publication_review" ||
    review.status !== "confirmed" ||
    review.provenance.parserVersion !== "independent-publication-review-v1" ||
    !review.provenance.captureIds.length ||
    review.payload.decision !== "approve" ||
    review.payload.publicationRevisionId !== publication.revisionId ||
    review.payload.locale !== locale ||
    review.payload.contentHash !== recordHash(content) ||
    !review.payload.eligibilityCheckedAt ||
    !Array.isArray(review.payload.factRevisionIds) ||
    review.payload.factRevisionIds.some((id) => typeof id !== "string")
  )
    return hidden;
  if (
    view === "latest" &&
    (await repository.getLatest(review.recordId))?.revisionId !==
      review.revisionId
  )
    return hidden;
  const facts = await evidence(
    repository,
    publication,
    now,
    view === "latest",
    eligible,
  );
  if (
    !facts ||
    recordHash(facts.map((fact) => fact.revisionId).sort()) !==
      recordHash((review.payload.factRevisionIds as string[]).toSorted())
  )
    return hidden;
  for (const id of review.provenance.captureIds)
    if (!(await repository.getCapture(id))) return hidden;
  const sources = await repository.getSources([
    ...new Set(facts.flatMap((fact) => fact.provenance.sourceIds)),
  ]);
  let dependencyState: string | null = null;
  if (view === "history") {
    for (const fact of facts) {
      const current = await repository.getLatest(fact.recordId);
      if (current?.revisionId !== fact.revisionId)
        dependencyState =
          current?.status === "withdrawn"
            ? "dependency_withdrawn"
            : current?.status === "disputed"
              ? "dependency_disputed"
              : "dependency_corrected";
    }
  }
  return {
    ...publication,
    currentState: view === "latest",
    historicalState:
      view === "history"
        ? (dependencyState ??
          (latest?.status !== "confirmed"
            ? latest?.status
            : latest?.revisionId !== publication.revisionId
              ? "corrected"
              : "confirmed"))
        : undefined,
    payload: {
      ...publication.payload,
      currentTextUnavailable: false,
      content,
      locale,
      editionRevisionId: edition.revisionId,
      sourceRefs: sources.map((source) => ({
        id: source.sourceId,
        publisher: source.publisher,
        url: source.url,
        title: source.title,
        authority: source.authority,
        publishedAt: source.publishedAt,
        observedAt: source.observedAt,
      })),
      evidenceClasses: [...new Set(facts.map((fact) => fact.evidenceClass))],
      classifications: [
        ...new Set(
          facts
            .map((fact) => fact.payload.classification)
            .filter((value) => typeof value === "string"),
        ),
      ],
    },
  };
}
