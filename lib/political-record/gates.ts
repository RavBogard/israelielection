export type Capability =
  | "workspace"
  | "exit_forecast"
  | "official_seats"
  | "formation"
  | "count_informed_odds"
  | "durable_shadow"
  | "public_api"
  | "subscriptions";
export type GateCheck = {
  id: string;
  state: "pass" | "blocked" | "unknown";
  evidenceRefs: string[];
};
const REQUIRED: Record<Capability, string[]> = {
  workspace: [
    "election_identity",
    "confirmed_date",
    "isolated_namespace",
    "core_seven_locales",
    "qualified_source_configuration",
    "archive_routing",
  ],
  exit_forecast: [
    "frozen_prior",
    "joint_model_validation",
    "qualified_exit_source",
  ],
  official_seats: ["cec_election_contract", "published_official_allocation"],
  formation: [
    "authority_registry",
    "qualified_primary_extraction",
    "claim_revalidation_sla",
  ],
  count_informed_odds: [
    "reporting_semantics",
    "remaining_vote_validation",
    "historical_replay",
    "probability_calibration",
  ],
  durable_shadow: [
    "database_configured",
    "schema_installed",
    "private_archive_configured",
    "shadow_comparison",
  ],
  public_api: [
    "stable_schema",
    "correction_manifest",
    "rate_limit_policy",
    "export_rights",
  ],
  subscriptions: [
    "publication_revisions",
    "confirmed_consent",
    "unsubscribe_suppression",
    "delivery_idempotency",
  ],
};
/** Evidence-backed per-capability readiness; unknown never silently becomes ready. */
export function capabilityGate(capability: Capability, checks: GateCheck[]) {
  const missing = REQUIRED[capability].filter(
    (id) =>
      !checks.some(
        (c) => c.id === id && c.state === "pass" && c.evidenceRefs.length > 0,
      ),
  );
  return { capability, ready: missing.length === 0, blockers: missing };
}
