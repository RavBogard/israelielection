import type { Briefing } from "../briefing";
import type { BriefingEvidenceBundle } from "../briefing-archive";
import {
  validateAtomicClaims,
  validateClaimReview,
  sentenceHash,
  claimHash,
  publicClaimEvidence,
} from "../briefing-verified";
import { numericTokens } from "../reference/numeric.mjs";
import { allowedNewsUrl } from "../briefing-acquisition";
import { contentHash, type CaptureArchive } from "./captures";
import { recordHash } from "./hash";
import { makeRecord, makeSource, publicationIntent } from "./records";
import { EMAIL_LOCALES, type EmailLocale } from "./email";
import { storeReviewedPublicationEdition } from "./publications";
import type {
  PoliticalRecordRepository,
  PoliticalRecord,
  SourceRecord,
  PrivateCaptureRef,
} from "./types";

/** Replay actual archived review evidence; a public `reviewed:true` marker alone is insufficient. */
export async function replayBriefing(
  briefing: Briefing,
  archive: CaptureArchive,
) {
  const hash = briefing.capture?.captureHash;
  if (
    briefing.evidenceVersion !== 2 ||
    !briefing.capture?.privateStored ||
    briefing.capture.state !== "archived" ||
    !hash ||
    !/^[a-f0-9]{64}$/.test(hash) ||
    !archive.readHash
  )
    throw new Error("briefing_private_bundle_required");
  const bytes = await archive.readHash(hash);
  if (contentHash(bytes) !== hash || bytes.length > 3000000)
    throw new Error("briefing_bundle_invalid");
  const bundle = JSON.parse(
    new TextDecoder().decode(bytes),
  ) as BriefingEvidenceBundle;
  if (
    bundle.date !== briefing.date ||
    bundle.model !== briefing.model ||
    !/^20\d{2}-\d{2}-\d{2}$/.test(bundle.date)
  )
    throw new Error("briefing_bundle_mismatch");
  validateAtomicClaims(bundle.claims, bundle.articles);
  const reviews = bundle.claims.map((c) =>
    bundle.review.find((r) => r.id === c.id)!,
  );
  validateClaimReview(bundle.claims, reviews);
  if (briefing.sentences.length !== bundle.claims.length)
    throw new Error("briefing_sentence_mismatch");
  for (const article of bundle.articles)
    if (
      !allowedNewsUrl(article.url) ||
      sentenceHash(article.body) !== article.bodyHash
    )
      throw new Error("briefing_article_invalid");
  for (const [i, claim] of bundle.claims.entries()) {
    const sentence = briefing.sentences[i];
    if (
      sentence.claimId !== claim.id ||
      sentence.text !== claim.text ||
      sentence.sourceHash !== sentenceHash(claim.text) ||
      sentence.kind !== claim.kind ||
      sentence.evidenceClass !==
        (claim.kind === "attributed_perspective"
          ? "attributed_perspective"
          : "corroborated_reporting") ||
      recordHash(sentence.evidence) !==
        recordHash(publicClaimEvidence(claim, bundle.articles)) ||
      !briefing.verification?.claims.some(
        (r) =>
          r.id === claim.id &&
          r.contentHash === claimHash(claim) &&
          r.supported &&
          r.atomic &&
          r.attributionPreserved &&
          r.noAddedInference,
      )
    )
      throw new Error("briefing_sentence_mismatch");
  }
  const locales = new Map<EmailLocale, string[]>([
    ["en", bundle.claims.map((c) => c.text)],
  ]);
  for (const translation of bundle.translations ?? []) {
    const locale = translation.locale;
    if (
      locale === "en" ||
      !EMAIL_LOCALES.includes(locale) ||
      locales.has(locale)
    )
      continue;
    if (
      translation.sentences.length !== bundle.claims.length ||
      translation.review.length !== bundle.claims.length
    )
      continue;
    const valid = translation.sentences.every((row, i) => {
      const claim = bundle.claims[i],
        review = translation.review[i],
        publicRow = briefing.sentences[i].translations?.[locale];
      return (
        row.id === claim.id &&
        row.sourceHash === sentenceHash(claim.text) &&
        !!row.text &&
        !/<|https?:\/\//.test(row.text) &&
        recordHash(numericTokens(row.text, locale)) ===
          recordHash(numericTokens(claim.text)) &&
        review.id === row.id &&
        review.supported === true &&
        review.complete === true &&
        review.attributionPreserved === true &&
        publicRow?.reviewed === true &&
        publicRow.sourceHash === row.sourceHash &&
        publicRow.text === row.text &&
        publicRow.model === translation.model
      );
    });
    if (valid)
      locales.set(
        locale,
        translation.sentences.map((row) => row.text),
      );
  }
  return { bundle, bytes, hash, locales };
}

const subjects: Record<EmailLocale, string> = {
  en: "Daily briefing — attributed reporting",
  he: "תדריך יומי — דיווחים מיוחסים",
  ar: "إحاطة يومية — تقارير منسوبة",
  fa: "گزارش روزانه — گزارش‌های منسوب",
  de: "Tagesüberblick — zugeschriebene Berichte",
  fr: "Point quotidien — informations attribuées",
  zh: "每日简报 — 注明来源的报道",
};

/** Default-off caller supplies real private archive. A date is one digest identity, not a new send on retry. */
export async function promoteReviewedBriefing(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive,
  briefing: Briefing,
) {
  const proof = await replayBriefing(briefing, archive),
    now = briefing.generatedAt;
  const recordId = `briefing:${briefing.date}`,
    previous = await repository.getLatest(recordId);
  if (
    previous &&
    previous.payload.bundleHash !== proof.hash &&
    Date.parse(previous.observedAt) >= Date.parse(now)
  )
    throw new Error("briefing_revision_out_of_order");
  const bundleSource = makeSource({
    sourceId: `briefing-evidence:${briefing.date}`,
    publisher: "Israeli Election",
    title: "Reviewed reporting evidence",
    url: `https://www.israelielection.org/news/${briefing.date}`,
    authority: "briefing_evidence",
    captureHash: proof.hash,
    observedAt: now,
    publishedAt: now,
  });
  const bundleCapture = await archive.put(
    bundleSource,
    proof.bytes,
    "application/json",
  );
  const sources: SourceRecord[] = [],
    captures: PrivateCaptureRef[] = [],
    facts: PoliticalRecord[] = [];
  for (const claim of proof.bundle.claims) {
    const claimSources = [],
      claimCaptures = [];
    for (const citation of claim.citations) {
      const article = proof.bundle.articles[citation.source - 1];
      const source = makeSource({
        sourceId: `news:${recordHash(article.url)}`,
        publisher: article.outlet,
        title: article.title,
        url: article.url,
        authority: "newsroom_reporting",
        captureHash: article.bodyHash,
        observedAt: article.capturedAt,
        publishedAt: article.published,
      });
      const capture = await archive.put(
        source,
        Buffer.from(article.body),
        "text/plain",
      );
      sources.push(source);
      captures.push(capture);
      claimSources.push(source.revisionId);
      claimCaptures.push(capture.captureId);
    }
    const id = `${recordId}:claim:${claim.id}`,
      old = await repository.getLatest(id);
    const stable = {
      text: claim.text,
      classification:
        claim.kind === "attributed_perspective"
          ? "attributed_analysis"
          : "reported_corroborated",
      claimHash: claimHash(claim),
      bundleHash: proof.hash,
    };
    const fact =
      old && recordHash(old.payload) === recordHash(stable)
        ? old
        : makeRecord({
            recordId: id,
            kind: "claim",
            electionId: null,
            effectiveAt: now,
            observedAt: now,
            status: "reported",
            evidenceClass:
              claim.kind === "attributed_perspective"
                ? "attributed_analysis"
                : "reported_corroborated",
            previousRevisionId: old?.revisionId ?? null,
            payload: stable,
            provenance: {
              sourceIds: [
                ...new Set([...claimSources, bundleSource.revisionId]),
              ],
              captureIds: [
                ...new Set([...claimCaptures, bundleCapture.captureId]),
              ],
              parserVersion: "reviewed-briefing-claim-v1",
            },
          });
    facts.push(fact);
  }
  const payload = {
    category: "attributed_interpretation",
    titleKey: "daily_briefing",
    recordRevisionIds: facts.map((f) => f.revisionId),
    data: {
      topics: ["digest"],
      delivery:
        previous && previous.payload.bundleHash !== proof.hash
          ? "correction"
          : "daily_digest",
      digestDate: briefing.date,
      ...(previous && previous.payload.bundleHash !== proof.hash
        ? { correctsRevisionId: previous.revisionId }
        : {}),
    },
    bundleHash: proof.hash,
    classification: facts.some(
      (fact) => fact.evidenceClass === "attributed_analysis",
    )
      ? "attributed_analysis"
      : "reported_corroborated",
  };
  const publication =
    previous?.payload.bundleHash === proof.hash
      ? previous
      : makeRecord({
          recordId,
          kind: "publication",
          electionId: null,
          effectiveAt: now,
          observedAt: now,
          status: "confirmed",
          evidenceClass: facts.some(
            (fact) => fact.evidenceClass === "attributed_analysis",
          )
            ? "attributed_analysis"
            : "reported_corroborated",
          previousRevisionId: previous?.revisionId ?? null,
          payload,
          provenance: {
            sourceIds: [bundleSource.revisionId],
            captureIds: [bundleCapture.captureId],
            parserVersion: "reviewed-briefing-publication-v1",
          },
        });
  const priorFacts =
    previous && Array.isArray(previous.payload.recordRevisionIds)
      ? await Promise.all(
          (previous.payload.recordRevisionIds as string[]).map((id) =>
            repository.getRevision(id),
          ),
        )
      : [];
  const removed =
    previous && previous.revisionId !== publication.revisionId
      ? priorFacts
          .filter((record): record is NonNullable<typeof record> => !!record)
          .filter(
            (r) =>
              r.recordId.startsWith(recordId + ":claim:") &&
              !facts.some((f) => f.recordId === r.recordId) &&
              r.status !== "withdrawn",
          )
          .map((r) =>
            makeRecord({
              ...r,
              observedAt: now,
              status: "withdrawn",
              previousRevisionId: r.revisionId,
            }),
          )
      : [];
  const committed = await repository.compareAndAppend(
    {
      records: [...facts, ...removed, publication],
      sources: [...sources, bundleSource],
      captures: [...captures, bundleCapture],
      outbox: [
        publicationIntent(
          publication,
          publication.previousRevisionId
            ? "record_corrected"
            : "publication_committed",
        ),
      ],
    },
    { recordId, revisionId: previous?.revisionId ?? null },
  );
  if (committed.conflict) throw new Error("briefing_concurrent_revision");
  const ready = [];
  const failedLocales: EmailLocale[] = [];
  for (const [locale, texts] of proof.locales) {
    const content = {
      subject: `${subjects[locale]} · ${briefing.date}`,
      text: texts
        .map(
          (text, i) =>
            `${text}\n${[...new Set(proof.bundle.claims[i].citations.map((citation) => proof.bundle.articles[citation.source - 1]).map((article) => `${article.outlet}: ${article.url}`))].join("\n")}`,
        )
        .join("\n\n"),
    };
    const review = {
      decision: "approve" as const,
      publicationRevisionId: publication.revisionId,
      locale,
      contentHash: recordHash(content),
      factRevisionIds: facts.map((f) => f.revisionId),
      generationRunId: `briefing-generation:${proof.hash}:${locale}`,
      reviewRunId: `briefing-independent-review:${proof.hash}:${locale}`,
      provider: "existing-private-briefing-review",
      model: proof.bundle.model,
    };
    try {
      await storeReviewedPublicationEdition(
        repository,
        publication.revisionId,
        locale,
        content,
        review,
        archive,
        now,
      );
      ready.push(locale);
    } catch {
      failedLocales.push(locale);
    }
  }
  return {
    status: "promoted",
    revision: publication.revisionId,
    locales: ready,
    failedLocales,
  };
}
