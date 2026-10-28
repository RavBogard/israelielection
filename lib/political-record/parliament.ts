import { XMLParser } from "fast-xml-parser";
import { makeRecord, makeSource } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import {
  validateMembership,
  validateBill,
  validateGovernment,
  type MembershipPayload,
  type BillPayload,
  type GovernmentPayload,
} from "./domain";
import type { PoliticalRecordRepository, SourceRecord } from "./types";
export const KNESSET_METADATA_URL =
  "https://knesset.gov.il/OdataV4/ParliamentInfo/$metadata";
export type ParliamentKind =
  "parliamentary_membership" | "bill_version" | "government";
export type ParliamentContract = {
  id: string;
  version: string;
  kind: ParliamentKind;
  entityName: string;
  entityType: string;
  dataUrl: string;
  fields: Record<
    string,
    { field: string; values?: Record<string, string | null> }
  >;
  schemaHash: string;
  semanticProofs: {
    sourceRevisionId: string;
    quote: string;
    normalizedField: string;
  }[];
  rehearsal: boolean;
};
type ContractInput = Omit<
  ParliamentContract,
  "schemaHash" | "semanticProofs"
> & {
  documentation: { url: string; quote: string; normalizedField: string }[];
};
function allowedUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !/(^|\.)knesset\.gov\.il$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    url.hash
  )
    throw new Error("parliament_source_not_allowed");
  return url;
}
function schemaFields(xml: string, entityType: string) {
  if (!/<(?:\w+:)?Edmx\b/.test(xml) || /<html/i.test(xml))
    throw new Error("parliament_metadata_unqualified");
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    removeNSPrefix: true,
  }).parse(xml);
  const visit = (value: unknown): Record<string, string> | null => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    if (!value || typeof value !== "object") return null;
    const row = value as Record<string, unknown>;
    if (row["@Name"] === entityType && row.Property) {
      const props = Array.isArray(row.Property) ? row.Property : [row.Property];
      return Object.fromEntries(
        props.map((p) => [String(p["@Name"]), String(p["@Type"])]),
      );
    }
    for (const child of Object.values(row)) {
      const found = visit(child);
      if (found) return found;
    }
    return null;
  };
  const fields = visit(parsed);
  if (!fields) throw new Error("parliament_entity_unqualified");
  return fields;
}
function contractSchema(
  xml: string,
  input: Pick<ParliamentContract, "entityType" | "fields">,
) {
  const fields = schemaFields(xml, input.entityType),
    selected = Object.values(input.fields).map((mapping) => [
      mapping.field,
      fields[mapping.field],
    ]);
  if (selected.some(([, type]) => !type))
    throw new Error("parliament_fields_unqualified");
  return recordHash({
    entityType: input.entityType,
    fields: selected.toSorted(([a], [b]) => a.localeCompare(b)),
  });
}
async function acquire(url: string, fetcher: typeof fetch) {
  allowedUrl(url);
  const response = await fetcher(url, {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent":
        "IsraeliElection primary parliament collector (+https://www.israelvotes.org)",
    },
  });
  if (!response.ok) throw new Error("parliament_source_unavailable");
  const body = await response.text();
  if (body.length > 3000000) throw new Error("parliament_response_oversize");
  return { body, type: response.headers.get("content-type") ?? "" };
}
/** Qualification requires actual metadata and primary documentation for every mapped semantic field. */
export async function qualifyParliamentContract(
  input: ContractInput,
  now: string,
  fetcher: typeof fetch = fetch,
) {
  allowedUrl(input.dataUrl);
  if (
    !["parliamentary_membership", "bill_version", "government"].includes(
      input.kind,
    ) ||
    !input.id ||
    !input.version ||
    !Object.keys(input.fields).length ||
    (input.rehearsal && process.env.VERCEL_ENV === "production")
  )
    throw new Error("parliament_contract_invalid");
  const metadata = await acquire(KNESSET_METADATA_URL, fetcher),
    schemaHash = contractSchema(metadata.body, input);
  const sources: SourceRecord[] = [
    makeSource({
      sourceId: "knesset:odata:metadata",
      publisher: "Knesset",
      title: "OData schema",
      captureHash: contentHash(Buffer.from(metadata.body)),
      url: KNESSET_METADATA_URL,
      authority: "knesset",
      observedAt: now,
      publishedAt: null,
    }),
  ];
  const captures = [
    { source: sources[0], body: metadata.body, mediaType: metadata.type },
  ];
  const semanticProofs: ParliamentContract["semanticProofs"] = [];
  for (const normalizedField of Object.keys(input.fields)) {
    const proof = input.documentation.find(
      (item) => item.normalizedField === normalizedField,
    );
    if (
      !proof ||
      proof.quote.length < 20 ||
      !proof.quote.includes(input.fields[normalizedField].field)
    )
      throw new Error("parliament_semantics_unqualified");
    const document = await acquire(proof.url, fetcher);
    if (!document.body.includes(proof.quote))
      throw new Error("parliament_semantics_unqualified");
    const source = makeSource({
      sourceId: `knesset:documentation:${recordHash(proof.url)}`,
      publisher: "Knesset",
      title: "Field definition",
      captureHash: contentHash(Buffer.from(document.body)),
      url: proof.url,
      authority: "knesset",
      observedAt: now,
      publishedAt: null,
    });
    sources.push(source);
    captures.push({ source, body: document.body, mediaType: document.type });
    semanticProofs.push({
      sourceRevisionId: source.revisionId,
      quote: proof.quote,
      normalizedField,
    });
  }
  const { documentation, ...definition } = input;
  void documentation;
  return {
    contract: { ...definition, schemaHash, semanticProofs },
    sources,
    captures,
  };
}
export function normalizeParliamentPage(
  body: unknown,
  contract: ParliamentContract,
) {
  const value = body as { value?: unknown; "@odata.nextLink"?: unknown };
  if (!value || !Array.isArray(value.value) || value.value.length > 1000)
    throw new Error("parliament_data_unqualified");
  const next = value["@odata.nextLink"];
  if (
    next !== undefined &&
    next !== null &&
    (typeof next !== "string" ||
      allowedUrl(next).origin !== new URL(contract.dataUrl).origin ||
      allowedUrl(next).pathname !== new URL(contract.dataUrl).pathname)
  )
    throw new Error("parliament_next_page_unqualified");
  const rows = value.value.map((row) => {
    if (!row || typeof row !== "object")
      throw new Error("parliament_row_invalid");
    const normalized: Record<string, unknown> = {};
    for (const [key, mapping] of Object.entries(contract.fields)) {
      if (!Object.hasOwn(row, mapping.field))
        throw new Error("parliament_field_missing");
      const raw = (row as Record<string, unknown>)[mapping.field];
      if (mapping.values) {
        if (!Object.hasOwn(mapping.values, String(raw)))
          throw new Error("parliament_enum_unqualified");
        normalized[key] = mapping.values[String(raw)];
      } else normalized[key] = raw;
    }
    return contract.kind === "parliamentary_membership"
      ? validateMembership(normalized)
      : contract.kind === "bill_version"
        ? validateBill(normalized)
        : validateGovernment(normalized);
  });
  return {
    rows,
    nextUrl: typeof next === "string" ? next : null,
    complete: !next,
  };
}
export async function storeParliamentContract(
  repository: PoliticalRecordRepository,
  input: ContractInput,
  archive: CaptureArchive | null,
  now: string,
  fetcher: typeof fetch = fetch,
) {
  const qualified = await qualifyParliamentContract(input, now, fetcher);
  const captures = archive
    ? await Promise.all(
        qualified.captures.map((c) =>
          archive.put(
            c.source,
            Buffer.from(c.body),
            c.mediaType || "text/plain",
          ),
        ),
      )
    : [];
  const previous = await repository.getLatest(`source-contract:${input.id}`);
  const record = makeRecord({
    recordId: `source-contract:${input.id}`,
    kind: "source_contract",
    electionId: null,
    effectiveAt: null,
    observedAt: now,
    status: "confirmed",
    evidenceClass: "model_output",
    previousRevisionId: previous?.revisionId ?? null,
    payload: qualified.contract,
    provenance: {
      sourceIds: qualified.sources.map((source) => source.revisionId),
      captureIds: captures.map((capture) => capture.captureId),
      missingCapture: !archive,
      parserVersion: "parliament-contract-v1",
    },
  });
  await repository.append({
    records: [record],
    sources: qualified.sources,
    captures,
    outbox: [],
  });
  return record;
}
export async function collectParliament(
  repository: PoliticalRecordRepository,
  contractRecordId: string,
  archive: CaptureArchive | null,
  now: string,
  fetcher: typeof fetch = fetch,
) {
  const contractRecord = await repository.getLatest(contractRecordId);
  if (
    !contractRecord ||
    contractRecord.kind !== "source_contract" ||
    contractRecord.status !== "confirmed" ||
    contractRecord.provenance.parserVersion !== "parliament-contract-v1"
  )
    throw new Error("parliament_contract_unavailable");
  const contract = contractRecord.payload as unknown as ParliamentContract;
  if (contract.rehearsal && process.env.VERCEL_ENV === "production")
    throw new Error("parliament_rehearsal_forbidden");
  const metadata = await acquire(KNESSET_METADATA_URL, fetcher);
  if (contractSchema(metadata.body, contract) !== contract.schemaHash)
    throw new Error("parliament_schema_changed");
  const cursorId = `parliament-cursor:${contract.id}`,
    cursor = await repository.getLatest(cursorId);
  const dataUrl =
    cursor?.payload.contractRevisionId === contractRecord.revisionId &&
    typeof cursor.payload.nextUrl === "string"
      ? cursor.payload.nextUrl
      : contract.dataUrl;
  if (
    allowedUrl(dataUrl).origin !== new URL(contract.dataUrl).origin ||
    new URL(dataUrl).pathname !== new URL(contract.dataUrl).pathname
  )
    throw new Error("parliament_cursor_invalid");
  const acquired = await acquire(dataUrl, fetcher);
  if (!acquired.type.includes("application/json"))
    throw new Error("parliament_data_unqualified");
  const page = normalizeParliamentPage(JSON.parse(acquired.body), contract);
  const source = makeSource({
    sourceId: `knesset:odata:${contract.id}`,
    publisher: "Knesset",
    title: contract.entityName,
    captureHash: contentHash(Buffer.from(acquired.body)),
    url: dataUrl,
    authority: "knesset",
    observedAt: now,
    publishedAt: null,
  });
  const capture = archive
    ? await archive.put(source, Buffer.from(acquired.body), "application/json")
    : null;
  const records = [];
  for (const value of page.rows) {
    const identity =
      contract.kind === "parliamentary_membership"
        ? `membership:${(value as MembershipPayload).termId}:${(value as MembershipPayload).personId}:${(value as MembershipPayload).documentId}`
        : contract.kind === "bill_version"
          ? `bill-document:${(value as BillPayload).billId}:${(value as BillPayload).documentId}`
          : `government:${(value as GovernmentPayload).governmentId}`;
    const previous = await repository.getLatest(identity),
      payload = { value, contractRevisionId: contractRecord.revisionId };
    if (previous && recordHash(previous.payload) === recordHash(payload))
      continue;
    records.push(
      makeRecord({
        recordId: identity,
        kind: contract.kind,
        electionId: null,
        effectiveAt:
          contract.kind === "bill_version"
            ? (value as BillPayload).occurredAt
            : (value as MembershipPayload | GovernmentPayload).startedAt,
        observedAt: now,
        status: "confirmed",
        evidenceClass: "primary_confirmed",
        previousRevisionId: previous?.revisionId ?? null,
        payload,
        provenance: {
          sourceIds: [source.revisionId],
          captureIds: capture ? [capture.captureId] : [],
          missingCapture: !capture,
          parserVersion: "knesset-normalized-v1",
        },
      }),
    );
  }
  records.push(
    makeRecord({
      recordId: cursorId,
      kind: "source_health",
      electionId: null,
      effectiveAt: null,
      observedAt: now,
      status: "confirmed",
      evidenceClass: "model_output",
      previousRevisionId: cursor?.revisionId ?? null,
      payload: {
        contractRevisionId: contractRecord.revisionId,
        nextUrl: page.nextUrl,
        complete: page.complete,
      },
      provenance: {
        sourceIds: [source.revisionId],
        captureIds: [],
        parserVersion: "parliament-cursor-v1",
      },
    }),
  );
  await repository.append({
    records,
    sources: [source],
    captures: capture ? [capture] : [],
    outbox: [],
  });
  return {
    status: "stored",
    records: records.length,
    complete: page.complete,
    nextUrl: page.nextUrl,
    rehearsal: contract.rehearsal,
  };
}
