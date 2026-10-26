import { POLLS_CLOSE } from "../election-lifecycle/core";
import registry from "../../data/election-lifecycle-sources.json";
import { cadenceMetadata } from "../election-lifecycle/cadence";
import { revalidationPlan } from "../election-lifecycle/readiness";
import type { LifecycleLedger } from "../election-lifecycle/types";
import type { MonitorCheck } from "./monitor-types";
export function sourceAvailabilityChecks(
  ledger: LifecycleLedger | null,
  now: string,
  enabled: boolean,
): MonitorCheck[] {
  if (!ledger)
    return [
      {
        id: "lifecycle:stored_read",
        scope: "platform",
        state: enabled
          ? Date.parse(now) < Date.parse(POLLS_CLOSE)
            ? "unknown"
            : "unavailable"
          : "unconfigured",
        checkedAt: now,
        reasonCode: enabled
          ? Date.parse(now) < Date.parse(POLLS_CLOSE)
            ? "acquisition_not_due"
            : "stored_state_unavailable"
          : "capability_disabled",
        attempts: 1,
        subjects: ["lifecycle"],
      },
    ];
  const checks: MonitorCheck[] = registry.sources.map((source) => {
    const health = ledger.health.filter(
        (row) =>
          row.sourceId === source.id ||
          row.sourceId.startsWith(source.id + ":"),
      ),
      index = health.find((row) => row.sourceId === source.id),
      base = {
        id: `source:${source.id}`,
        scope: "source" as const,
        checkedAt: now,
        attempts: 1,
        subjects: [source.id],
      };
    if (!enabled)
      return {
        ...base,
        state: "unconfigured",
        reasonCode: "capability_disabled",
      };
    if (health.some((row) => row.status === "disputed"))
      return {
        ...base,
        state: "disputed",
        reasonCode: "source_conflicting_claims",
      };
    const failed = health.find(
      (row) => row.status === "unavailable" || row.status === "invalid",
    );
    if (failed)
      return {
        ...base,
        state: "unavailable",
        reasonCode:
          failed.diagnostic?.code === "provider_billing"
            ? "provider_billing"
            : failed.diagnostic
              ? "extraction_provider_unavailable"
              : "primary_source_unavailable",
      };
    if (!index)
      return {
        ...base,
        state: "unconfigured",
        reasonCode: "no_acquisition_receipt",
      };
    if (index.status === "complete")
      return { ...base, state: "settled", reasonCode: "completed_archive" };
    const cadence = cadenceMetadata(
        now,
        index.lastSuccessfulAt,
        index.checkedAt,
        false,
      ),
      refs = revalidationPlan(ledger, source.id, now);
    if (
      Date.parse(now) > Date.parse(cadence.expiresAt) ||
      refs.all.some((ref) => Date.parse(now) > Date.parse(ref.expiresAt))
    )
      return {
        ...base,
        state: "stale",
        reasonCode: "revalidation_deadline_missed",
      };
    if (
      (ledger.extractionPending ?? []).some((id) =>
        id.startsWith(source.id + ":"),
      )
    )
      return { ...base, state: "unknown", reasonCode: "extraction_pending" };
    const newFact = ledger.events.some(
      (event) =>
        Date.parse(event.observedAt) === Date.parse(index.checkedAt) &&
        event.status === "confirmed" &&
        event.sources.some((ref) => ref.id.startsWith(source.id + ":")),
    );
    return {
      ...base,
      state: newFact ? "healthy_new" : "healthy_no_new",
      reasonCode: newFact ? "validated_change" : "checked_no_new_fact",
    };
  });
  checks.push({
    id: "model:count_informed_odds",
    scope: "platform",
    state: "validation_gated",
    checkedAt: now,
    reasonCode: "count_model_validation_required",
    attempts: 0,
    subjects: ["count_model"],
  });
  return checks;
}
export function groupedWarnings(checks: MonitorCheck[]) {
  const groups = new Map<
    string,
    { reasonCode: string; state: string; subjects: string[]; count: number }
  >();
  for (const check of checks.filter((row) =>
    [
      "unconfigured",
      "validation_gated",
      "unknown",
      "disputed",
      "stale",
      "unavailable",
    ].includes(row.state),
  )) {
    const key = `${check.state}:${check.reasonCode}`,
      group = groups.get(key) ?? {
        reasonCode: check.reasonCode,
        state: check.state,
        subjects: [],
        count: 0,
      };
    group.subjects.push(...check.subjects);
    group.count++;
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    subjects: [...new Set(group.subjects)].sort(),
  }));
}
