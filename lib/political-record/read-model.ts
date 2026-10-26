import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { getElectionLifecycle } from "../election-lifecycle/server";
import { ELECTIONS, currentElection } from "./registry";
import { formationIdentity } from "./identity";
import { configuredPoliticalRecords } from "./postgres";
import type { PoliticalRecord } from "./types";

/** Server-only bridge. Reference content and live lifecycle remain available without Postgres. */
export const getPoliticalPlatformReadModel = cache(async () => {
  const lifecycle = await getElectionLifecycle();
  let storage: "unconfigured" | "available" | "unavailable" = "unconfigured";
  let records: PoliticalRecord[] = [];
  let asOfCursor: string | null = null,
    truncated = false;
  if (process.env.POLITICAL_RECORD_READ_ENABLED === "true") {
    let repository: ReturnType<typeof configuredPoliticalRecords> = null;
    try {
      repository = configuredPoliticalRecords();
      if (repository) {
        const current = await repository.latest({
          electionId: currentElection().id,
          limit: 200,
        });
        records = current.records;
        asOfCursor = current.asOfCursor;
        truncated = current.truncated;
        storage = "available";
      }
    } catch (error) {
      unstable_rethrow(error);
      storage = "unavailable";
    } finally {
      try {
        await repository?.close();
      } catch (error) {
        unstable_rethrow(error);
        storage = "unavailable";
        records = [];
      }
    }
  }
  return {
    schemaVersion: 1 as const,
    elections: ELECTIONS,
    currentElectionId: currentElection().id,
    storage: { state: storage, authority: "redis_lifecycle" as const },
    lifecycle,
    lifecycleState: lifecycle
      ? ("available" as const)
      : ("unavailable" as const),
    proposals: records.filter(
      (r) => r.kind === "proposal" && r.status === "confirmed",
    ),
    mandateAttempts: (lifecycle?.politics.events ?? [])
      .filter((e) => e.type === "mandate")
      .map((event) => ({ event, identity: formationIdentity(event) })),
    // Existing person-scoped decisions do not assert a distinct verified government proposal.
    legacyTargets: lifecycle?.politics.proposals ?? [],
    publications: records.filter(
      (r) => r.kind === "publication" && r.status === "confirmed",
    ),
    recordHistory: records.filter((r) => r.status !== "confirmed"),
    editions: records.filter((r) => r.kind === "edition"),
    policyRecords: records.filter((r) =>
      ["bill", "bill_version", "roll_call"].includes(r.kind),
    ),
    // Formal source qualification/publication promotion is a later capability gate.
    policyState: "reference_only" as const,
    recordWindow: {
      complete: !truncated,
      asOfCursor,
      limit: 200,
      purpose: "reference" as const,
    },
  };
});
export type PoliticalPlatformReadModel = Awaited<
  ReturnType<typeof getPoliticalPlatformReadModel>
>;
