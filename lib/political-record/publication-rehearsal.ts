import { CBS_URL, parseCbs } from "./cbs";
import { qualifiedIndicator } from "./domain";
import type { CaptureArchive } from "./captures";
import { contentHash } from "./captures";
import { EMAIL_LOCALES, type EmailLocale } from "./email";
import { recordHash } from "./hash";
import { makeRecord } from "./records";
import { registerLivePublicationInputs } from "./producer";
import type { PoliticalRecordRepository } from "./types";

/** Private explicit preparation only: existing real collector data, no supplied facts/URLs/model calls. */
export async function prepareStoredCbsRehearsal(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive,
  locale: EmailLocale,
  now: string,
) {
  if (!EMAIL_LOCALES.includes(locale)) throw Error("rehearsal_locale_invalid");
  const window = await repository.latest({
    kind: "indicator_observation",
    globalOnly: true,
    limit: 200,
  });
  if (window.truncated) throw Error("rehearsal_indicator_window_incomplete");
  const fact = window.records
    .filter((record) => record.recordId.startsWith("indicator:cbs:120010:"))
    .sort((a, b) =>
      String(b.payload.period).localeCompare(String(a.payload.period)),
    )[0];
  if (
    !fact ||
    fact.status !== "confirmed" ||
    fact.evidenceClass !== "primary_confirmed" ||
    fact.provenance.parserVersion !== "cbs-price-v1" ||
    fact.provenance.missingCapture ||
    fact.provenance.sourceIds.length !== 1 ||
    fact.provenance.captureIds.length !== 1 ||
    Date.parse(now) - Date.parse(fact.observedAt) < 0 ||
    Date.parse(now) - Date.parse(fact.observedAt) > 3600000
  )
    throw Error("recent_actual_cbs_capture_required");
  const sources = await repository.getSources(fact.provenance.sourceIds);
  if (
    sources.length !== 1 ||
    sources[0].url !== CBS_URL ||
    sources[0].sourceId !== "cbs:price:120010" ||
    sources[0].authority !== "cbs" ||
    !qualifiedIndicator(fact, sources)
  )
    throw Error("actual_cbs_source_required");
  const capture = await repository.getCapture(fact.provenance.captureIds[0]);
  if (
    !capture ||
    capture.sourceRevisionId !== sources[0].revisionId ||
    capture.contentSha256 !== sources[0].captureHash ||
    capture.byteLength > 500000
  )
    throw Error("actual_cbs_private_capture_required");
  const bytes = await archive.read(capture);
  if (
    contentHash(bytes) !== capture.contentSha256 ||
    !parseCbs(JSON.parse(new TextDecoder().decode(bytes)), now).some(
      (observation) => recordHash(observation) === recordHash(fact.payload),
    )
  )
    throw Error("actual_cbs_raw_observation_mismatch");
  // Seeding an ordinary live watermark still emits no automatic initial alerts.
  await registerLivePublicationInputs(repository, "cbs", [], now);
  const recordId = `producer:primary:${fact.revisionId}:${locale}`;
  const result = await repository.compareAndAppend(
    {
      records: [
        makeRecord({
          recordId,
          kind: "source_health",
          electionId: null,
          effectiveAt: null,
          observedAt: now,
          status: "unknown",
          evidenceClass: "model_output",
          previousRevisionId: null,
          payload: {
            mode: "primary",
            stage: "queued",
            attempts: 0,
            nextAt: now,
            factRevisionId: fact.revisionId,
            locale,
          },
          provenance: {
            sourceIds: [],
            captureIds: [],
            parserVersion: "private-publication-job-v1",
          },
        }),
      ],
      sources: [],
      captures: [],
      outbox: [],
    },
    { recordId, revisionId: null },
  );
  return {
    status: result.conflict ? "already_prepared" : "prepared",
    locale,
    factRevisionId: fact.revisionId,
    period: String(fact.payload.period),
    captureHash: capture.contentSha256,
    providerCalls: 0,
    sends: 0,
  };
}
