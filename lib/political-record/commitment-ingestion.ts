import registry from "../../data/election-lifecycle-sources.json";
import { makeRecord, makeSource } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import {
  validateCommitment,
  validateRubric,
  type CommitmentPayload,
  type CommitmentRubric,
} from "./commitments";
import { textOf } from "../election-lifecycle/html";
import type { PoliticalRecordRepository } from "./types";

/** Internal captured-primary import: no arbitrary public write path or inferred promise. */
export async function ingestPromise(
  repository: PoliticalRecordRepository,
  input: {
    id: string;
    title: string;
    actorId: string;
    sourceId: string;
    url: string;
    quote: string;
    body: string;
    publishedAt: string;
  },
  archive: CaptureArchive | null,
  now: string,
) {
  const sourceConfig = registry.sources.find(
    (source) => source.id === input.sourceId,
  );
  const url = new URL(input.url);
  if (
    !sourceConfig ||
    sourceConfig.authority !== "party" ||
    !(sourceConfig.partyIds as string[]).includes(input.actorId) ||
    !sourceConfig.hosts.includes(url.hostname) ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !input.id ||
    input.title.length > 300 ||
    input.quote.length < 30 ||
    !textOf(input.body).includes(input.quote) ||
    !Number.isFinite(Date.parse(input.publishedAt)) ||
    Date.parse(input.publishedAt) > Date.parse(now)
  )
    throw new Error("promise_source_unqualified");
  const source = makeSource({
    sourceId: input.sourceId,
    publisher: sourceConfig.publisher,
    title: input.title,
    url: input.url,
    authority: "party",
    publishedAt: input.publishedAt,
    observedAt: now,
    captureHash: contentHash(Buffer.from(input.body)),
  });
  const previous = await repository.getLatest(`promise:${input.id}`);
  const payload = {
    title: input.title,
    actorId: input.actorId,
    quote: input.quote,
  };
  if (
    previous &&
    recordHash(previous.payload) === recordHash(payload) &&
    previous.provenance.sourceIds.includes(source.revisionId)
  )
    return previous;
  const capture = archive
    ? await archive.put(source, Buffer.from(input.body), "text/html")
    : null;
  const record = makeRecord({
    recordId: `promise:${input.id}`,
    kind: "claim",
    electionId: null,
    effectiveAt: input.publishedAt,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "primary_confirmed",
    previousRevisionId: previous?.revisionId ?? null,
    payload,
    provenance: {
      sourceIds: [source.revisionId],
      captureIds: capture ? [capture.captureId] : [],
      missingCapture: !capture,
      parserVersion: "captured-promise-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: [source],
    captures: capture ? [capture] : [],
    outbox: [],
  });
  return record;
}
export async function saveCommitment(
  repository: PoliticalRecordRepository,
  input: CommitmentPayload,
  now: string,
) {
  const value = validateCommitment(input),
    links = await Promise.all(
      value.chain.map((link) => repository.getRevision(link.recordRevisionId)),
    );
  if (links.some((record) => !record || record.status !== "confirmed"))
    throw new Error("commitment_evidence_missing");
  const promise = links.find(
    (record, index) =>
      value.chain[index].stage === "promise" &&
      record?.provenance.parserVersion === "captured-promise-v1" &&
      value.actorIds.includes(String(record.payload.actorId)),
  );
  if (!promise) throw new Error("commitment_promise_unqualified");
  const previous = await repository.getLatest(
    `commitment:${value.commitmentId}`,
  );
  if (previous && recordHash(previous.payload) === recordHash(value))
    return previous;
  const record = makeRecord({
    recordId: `commitment:${value.commitmentId}`,
    kind: "commitment",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: value,
    provenance: {
      sourceIds: [
        ...new Set(links.flatMap((record) => record!.provenance.sourceIds)),
      ],
      captureIds: [
        ...new Set(links.flatMap((record) => record!.provenance.captureIds)),
      ],
      missingCapture: links.some((record) => record!.provenance.missingCapture),
      parserVersion: "commitment-chain-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: [],
    captures: [],
    outbox: [],
  });
  return record;
}
/** Rubrics are explicit versioned methodology, never inferred automatically from a policy outcome. */
export async function saveCommitmentRubric(
  repository: PoliticalRecordRepository,
  input: CommitmentRubric,
  now: string,
) {
  const value = validateRubric(input),
    method = await repository.getRevision(value.methodologyRevisionId),
    baseline = await repository.getRevision(
      value.baseline.observationRevisionId,
    ),
    commitment = await repository.getLatest(`commitment:${value.commitmentId}`);
  if (
    !commitment ||
    method?.kind !== "methodology" ||
    method.status !== "confirmed" ||
    baseline?.kind !== "indicator_observation" ||
    baseline.status !== "confirmed"
  )
    throw new Error("rubric_evidence_unqualified");
  const previous = await repository.getLatest(
    `commitment-rubric:${value.commitmentId}`,
  );
  if (previous && recordHash(previous.payload) === recordHash(value))
    return previous;
  if (previous?.payload.version === value.version)
    throw new Error("rubric_version_must_change");
  const record = makeRecord({
    recordId: `commitment-rubric:${value.commitmentId}`,
    kind: "commitment_rubric",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: value,
    provenance: {
      sourceIds: [],
      captureIds: [],
      parserVersion: "commitment-rubric-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: [],
    captures: [],
    outbox: [],
  });
  return record;
}
