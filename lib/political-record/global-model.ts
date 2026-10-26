import registry from "../../data/election-lifecycle-sources.json";
import {
  qualifiedBase,
  qualifiedSources,
  qualifiedIndicator,
  validateMembership,
  validateBill,
  validateGovernment,
  type QualifiedIndicator,
  type QualifiedMembership,
  type QualifiedBill,
  type QualifiedGovernment,
  type QualifiedRow,
} from "./domain";
import {
  validateCommitment,
  validateRubric,
  assessCommitment,
  type CommitmentView,
  type QualifiedMeasurement,
} from "./commitments";
import type {
  PoliticalRecord,
  PoliticalRecordRepository,
  RecordKind,
  SourceRecord,
} from "./types";
import type { ParliamentContract } from "./parliament";
export type GlobalProjection = {
  asOfCursor: string | null;
  complete: boolean;
  indicators: QualifiedIndicator[];
  commitments: CommitmentView[];
  governmentRecords: QualifiedGovernment[];
  incumbent: {
    state: "last_confirmed" | "unknown";
    record: QualifiedGovernment | null;
  };
  parliament: {
    state: "qualified" | "unavailable";
    memberships: QualifiedMembership[];
    bills: QualifiedBill[];
    sourceStatus: "qualified_records" | "no_qualified_source";
  };
  rejectedRecordIds: string[];
};
function primaryHost(source: SourceRecord) {
  const url = new URL(source.url);
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (source.authority === "cbs") return url.hostname === "api.cbs.gov.il";
  if (source.authority === "knesset")
    return /(^|\.)knesset\.gov\.il$/.test(url.hostname);
  return registry.sources.some(
    (item) =>
      item.authority === source.authority && item.hosts.includes(url.hostname),
  );
}
const titleOf = (record: PoliticalRecord) =>
  typeof record.payload.title === "string"
    ? record.payload.title
    : typeof (record.payload.event as { type?: unknown } | undefined)?.type ===
        "string"
      ? String((record.payload.event as { type: string }).type)
      : record.recordId;
/** Typed source qualification, separate from election selection and from current political visibility. */
export function buildGlobalProjection(
  records: PoliticalRecord[],
  sources: SourceRecord[],
  now: string,
  asOfCursor: string | null,
  complete: boolean,
): GlobalProjection {
  const result: GlobalProjection = {
    asOfCursor,
    complete,
    indicators: [],
    commitments: [],
    governmentRecords: [],
    incumbent: { state: "unknown", record: null },
    parliament: {
      state: "unavailable",
      memberships: [],
      bills: [],
      sourceStatus: "no_qualified_source",
    },
    rejectedRecordIds: [],
  };
  const current = new Map(records.map((record) => [record.revisionId, record]));
  const evidence = (
    record: PoliticalRecord,
    authorities: string[],
  ): QualifiedRow | null => {
    const refs = qualifiedSources(record, sources, authorities);
    if (!refs || refs.some((source) => !primaryHost(source))) return null;
    return qualifiedBase(record, refs, titleOf(record));
  };
  for (const record of records) {
    if (record.electionId !== null || record.status !== "confirmed") continue;
    try {
      if (record.kind === "indicator_observation") {
        const row = qualifiedIndicator(record, sources);
        if (row) result.indicators.push(row);
        else result.rejectedRecordIds.push(record.recordId);
      } else if (
        ["parliamentary_membership", "bill_version", "government"].includes(
          record.kind,
        )
      ) {
        const contract = current.get(String(record.payload.contractRevisionId));
        const p = contract?.payload as unknown as
          ParliamentContract | undefined;
        const proofSources = contract?.provenance.sourceIds.map((id) =>
          sources.find((source) => source.revisionId === id),
        );
        if (
          record.provenance.parserVersion !== "knesset-normalized-v1" ||
          contract?.kind !== "source_contract" ||
          contract.status !== "confirmed" ||
          !p ||
          p.rehearsal ||
          p.kind !== record.kind ||
          !p.schemaHash ||
          !p.semanticProofs.length ||
          !proofSources?.length ||
          proofSources.some(
            (source) =>
              !source || source.authority !== "knesset" || !primaryHost(source),
          )
        )
          throw new Error("unqualified_contract");
        const base = evidence(record, ["knesset"]);
        if (!base) throw new Error("unqualified_source");
        if (record.kind === "parliamentary_membership") {
          const value = validateMembership(record.payload.value);
          result.parliament.memberships.push({
            ...base,
            ...value,
            title: value.personName,
          });
        } else if (record.kind === "bill_version") {
          const value = validateBill(record.payload.value);
          result.parliament.bills.push({
            ...base,
            ...value,
            title: value.title,
          });
        } else {
          const value = validateGovernment(record.payload.value);
          result.governmentRecords.push({
            ...base,
            ...value,
            title: value.title,
          });
        }
      }
    } catch {
      result.rejectedRecordIds.push(record.recordId);
    }
  }
  const measurements: QualifiedMeasurement[] = result.indicators.flatMap(
    (row) => [
      {
        revisionId: row.revisionId,
        metricId: "cbs:120010:index",
        scopeId: "IL",
        unit: `index:${row.baseDescription}`,
        value: row.indexValue,
        period: row.period,
        observedAt: row.observedAt,
        qualified: true,
      },
      {
        revisionId: row.revisionId,
        metricId: "cbs:120010:monthly_percent",
        scopeId: "IL",
        unit: "percent",
        value: row.monthlyPercent,
        period: row.period,
        observedAt: row.observedAt,
        qualified: true,
      },
      {
        revisionId: row.revisionId,
        metricId: "cbs:120010:annual_percent",
        scopeId: "IL",
        unit: "percent",
        value: row.annualPercent,
        period: row.period,
        observedAt: row.observedAt,
        qualified: true,
      },
    ],
  );
  for (const record of records.filter(
    (record) => record.kind === "commitment" && record.status === "confirmed",
  )) {
    try {
      const value = validateCommitment(record.payload);
      const chainEvidence = value.chain.map((link) => {
        const linked = current.get(link.recordRevisionId),
          authorities =
            link.stage === "promise"
              ? ["party", "joint", "knesset"]
              : link.stage === "agreement"
                ? ["joint", "knesset"]
                : link.stage === "outcome"
                  ? ["cbs"]
                  : ["knesset"];
        const base = linked ? evidence(linked, authorities) : null;
        return {
          ...link,
          qualified: !!base,
          title: base?.title ?? null,
          sources: base?.sources ?? [],
        };
      });
      const promise = chainEvidence.find(
        (link) => link.stage === "promise" && link.qualified,
      );
      if (!promise) {
        result.rejectedRecordIds.push(record.recordId);
        continue;
      }
      const rubricRecord = records.find(
        (r) =>
          r.kind === "commitment_rubric" &&
          r.status === "confirmed" &&
          r.payload.commitmentId === value.commitmentId,
      );
      let rubric = null;
      if (rubricRecord) {
        try {
          const candidate = validateRubric(rubricRecord.payload),
            method = current.get(candidate.methodologyRevisionId);
          if (method?.kind === "methodology" && method.status === "confirmed")
            rubric = candidate;
        } catch {
          /* Preserve the sourced chain without rating it. */
        }
      }
      result.commitments.push({
        ...qualifiedBase(record, [], value.title),
        ...value,
        sources: promise.sources,
        captureState: record.provenance.missingCapture ? "missing" : "retained",
        chainEvidence,
        rubric,
        assessment: assessCommitment(rubric, measurements, now),
      });
    } catch {
      result.rejectedRecordIds.push(record.recordId);
    }
  }
  result.indicators.sort(
    (a, b) =>
      b.period.localeCompare(a.period) || a.recordId.localeCompare(b.recordId),
  );
  result.governmentRecords.sort(
    (a, b) =>
      Date.parse(b.startedAt) - Date.parse(a.startedAt) ||
      Date.parse(b.observedAt) - Date.parse(a.observedAt),
  );
  const last = result.governmentRecords[0];
  if (last && last.state !== "ended")
    result.incumbent = { state: "last_confirmed", record: last };
  if (result.parliament.memberships.length || result.parliament.bills.length) {
    result.parliament.state = "qualified";
    result.parliament.sourceStatus = "qualified_records";
  }
  return result;
}
export async function loadGlobalProjection(
  repository: PoliticalRecordRepository,
  now: string,
) {
  const kinds: RecordKind[] = [
    "indicator_observation",
    "parliamentary_membership",
    "bill_version",
    "government",
    "source_contract",
    "commitment",
    "commitment_rubric",
    "methodology",
  ];
  const first = await repository.latest({ globalOnly: true, limit: 1 });
  const windows = await Promise.all(
    kinds.map((kind) =>
      repository.latest({
        globalOnly: true,
        kind,
        asOfCursor: first.asOfCursor,
        limit: 200,
      }),
    ),
  );
  const records = windows.flatMap((window) => window.records);
  const missing = [
    ...new Set(
      records
        .filter((record) => record.kind === "commitment")
        .flatMap((record) => {
          try {
            return validateCommitment(record.payload).chain.map(
              (link) => link.recordRevisionId,
            );
          } catch {
            return [];
          }
        }),
    ),
  ].filter((id) => !records.some((record) => record.revisionId === id));
  for (const id of missing.slice(0, 100)) {
    const record = await repository.getRevision(id);
    if (record) {
      const latest = await repository.getLatest(record.recordId);
      if (latest?.revisionId === record.revisionId) records.push(record);
    }
  }
  const sourceIds = [
    ...new Set(records.flatMap((record) => record.provenance.sourceIds)),
  ];
  const sources = await repository.getSources(sourceIds);
  return buildGlobalProjection(
    records,
    sources,
    now,
    first.asOfCursor,
    !windows.some((window) => window.truncated) && missing.length <= 100,
  );
}
