import type { QualifiedRow } from "./domain";
export const COMMITMENT_STAGES = [
  "promise",
  "agreement",
  "action",
  "implementation",
  "outcome",
] as const;
export type CommitmentStage = (typeof COMMITMENT_STAGES)[number];
export type CommitmentPayload = {
  commitmentId: string;
  title: string;
  actorIds: string[];
  chain: { stage: CommitmentStage; recordRevisionId: string }[];
};
export type CommitmentRubric = {
  version: string;
  commitmentId: string;
  metricId: string;
  scopeId: string;
  unit: string;
  baseline: { value: number; observationRevisionId: string; period: string };
  target: {
    comparison: "gte" | "lte" | "equal";
    value: number;
    tolerance: number;
  };
  deadlineAt: string;
  assessmentPeriod: string;
  methodologyRevisionId: string;
};
export type QualifiedMeasurement = {
  revisionId: string;
  metricId: string;
  scopeId: string;
  unit: string;
  value: number;
  period: string;
  observedAt: string;
  qualified: boolean;
};
export type CommitmentAssessment = {
  state:
    | "not_assessable"
    | "not_yet_due"
    | "target_met"
    | "target_not_met"
    | "mixed_evidence";
  reason:
    | "missing_rubric"
    | "missing_qualified_baseline"
    | "deadline_pending"
    | "missing_qualified_measurement"
    | "conflicting_measurements"
    | "measured_against_rubric";
  rubricVersion: string | null;
  measurementRevisionIds: string[];
  causation: "not_established";
};
export type CommitmentView = QualifiedRow &
  CommitmentPayload & {
    chainEvidence: {
      stage: CommitmentStage;
      recordRevisionId: string;
      qualified: boolean;
      title: string | null;
      sources: QualifiedRow["sources"];
    }[];
    rubric: CommitmentRubric | null;
    assessment: CommitmentAssessment;
  };
export function validateCommitment(value: unknown): CommitmentPayload {
  const p = value as CommitmentPayload;
  if (
    !p ||
    typeof p.commitmentId !== "string" ||
    !p.commitmentId ||
    typeof p.title !== "string" ||
    !p.title ||
    p.title.length > 300 ||
    !Array.isArray(p.actorIds) ||
    !p.actorIds.length ||
    p.actorIds.some((id) => typeof id !== "string" || !id) ||
    !Array.isArray(p.chain) ||
    !p.chain.length ||
    p.chain.some(
      (link) =>
        !COMMITMENT_STAGES.includes(link.stage) ||
        !/^[a-f0-9]{64}$/.test(link.recordRevisionId),
    ) ||
    !p.chain.some((link) => link.stage === "promise")
  )
    throw new Error("commitment_schema_invalid");
  return p;
}
export function validateRubric(value: unknown): CommitmentRubric {
  const r = value as CommitmentRubric;
  if (
    !r ||
    ![r.version, r.commitmentId, r.metricId, r.scopeId, r.unit].every(
      (value) => typeof value === "string" && value.length > 0,
    ) ||
    !r.baseline ||
    !Number.isFinite(r.baseline.value) ||
    !/^[a-f0-9]{64}$/.test(r.baseline.observationRevisionId) ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.baseline.period) ||
    !r.target ||
    !["gte", "lte", "equal"].includes(r.target.comparison) ||
    !Number.isFinite(r.target.value) ||
    !Number.isFinite(r.target.tolerance) ||
    r.target.tolerance < 0 ||
    !Number.isFinite(Date.parse(r.deadlineAt)) ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.assessmentPeriod) ||
    !/^[a-f0-9]{64}$/.test(r.methodologyRevisionId)
  )
    throw new Error("commitment_rubric_invalid");
  return r;
}
/** A deadline alone never creates a failed promise; outcome comparisons never establish causation. */
export function assessCommitment(
  rubric: CommitmentRubric | null,
  measurements: QualifiedMeasurement[],
  now: string,
): CommitmentAssessment {
  const answer = (
    state: CommitmentAssessment["state"],
    reason: CommitmentAssessment["reason"],
    ids: string[] = [],
  ): CommitmentAssessment => ({
    state,
    reason,
    rubricVersion: rubric?.version ?? null,
    measurementRevisionIds: ids,
    causation: "not_established",
  });
  if (!rubric) return answer("not_assessable", "missing_rubric");
  validateRubric(rubric);
  const qualified = measurements.filter(
    (m) =>
      m.qualified &&
      m.metricId === rubric.metricId &&
      m.scopeId === rubric.scopeId &&
      m.unit === rubric.unit &&
      Number.isFinite(m.value) &&
      Date.parse(m.observedAt) <= Date.parse(now),
  );
  const baseline = qualified.find(
    (m) =>
      m.revisionId === rubric.baseline.observationRevisionId &&
      m.period === rubric.baseline.period &&
      m.value === rubric.baseline.value,
  );
  if (!baseline) return answer("not_assessable", "missing_qualified_baseline");
  if (Date.parse(now) < Date.parse(rubric.deadlineAt))
    return answer("not_yet_due", "deadline_pending", [baseline.revisionId]);
  const observations = qualified.filter(
    (m) => m.period === rubric.assessmentPeriod,
  );
  if (!observations.length)
    return answer("not_assessable", "missing_qualified_measurement", [
      baseline.revisionId,
    ]);
  const ids = observations.map((m) => m.revisionId);
  if (new Set(observations.map((m) => m.value)).size > 1)
    return answer("mixed_evidence", "conflicting_measurements", ids);
  const value = observations[0].value,
    target = rubric.target;
  const met =
    target.comparison === "gte"
      ? value + target.tolerance >= target.value
      : target.comparison === "lte"
        ? value - target.tolerance <= target.value
        : Math.abs(value - target.value) <= target.tolerance;
  return answer(
    met ? "target_met" : "target_not_met",
    "measured_against_rubric",
    ids,
  );
}
