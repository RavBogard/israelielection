import registry from "../../data/election-lifecycle-sources.json";
import parties from "../../data/parties.json";
import { sourceCoverage } from "../election-lifecycle/readiness";
import type { LifecycleLedger } from "../election-lifecycle/types";
import { currentElection } from "./registry";
/** Signed/private operational response only. No signatures, credentials, captures or political assertions. */
export function readinessDiagnostic(ledger: LifecycleLedger, now: string) {
  const coverage = registry.sources.map((source) => ({
    ...sourceCoverage(
      ledger,
      source.id,
      now,
      (ledger.extractionPending ?? []).filter((id) =>
        id.startsWith(source.id + ":"),
      ).length,
    ),
    partyIds: source.partyIds,
  }));
  return {
    schemaVersion: 1,
    electionId: currentElection().id,
    checkedAt: now,
    durableStore: process.env.POLITICAL_RECORD_DATABASE_URL
      ? "configured_unverified"
      : "unconfigured",
    privateArchive: "unconfigured",
    countModel: "validation_gated",
    revalidationCapability: {
      ready: coverage.every(
        (c) => c.state === "checked" && c.overdueArticles === 0,
      ),
      blockers: coverage
        .filter((c) => c.state !== "checked" || c.overdueArticles > 0)
        .map((c) => c.sourceId),
    },
    coverage,
    partyCoverage: parties.parties.map((party) => {
      const sources = coverage.filter((source) =>
        source.partyIds.some((id) => id === party.id),
      );
      return {
        partyId: party.id,
        sourceIds: sources.map((source) => source.sourceId),
        state: !sources.length
          ? "unconfigured"
          : sources.some((source) => source.state === "checked")
            ? "checked"
            : sources.some((source) => source.state === "incomplete")
              ? "incomplete"
              : "unavailable",
      };
    }),
  };
}
