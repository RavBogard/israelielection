import { fingerprint } from "../election-lifecycle/core";
import { electionByLegacyDate } from "./registry";
import type { PoliticalEvent } from "../election-lifecycle/types";
export type FormationIdentity = {
  electionId: string;
  personId: string | null;
  proposalId: string | null;
  mandateAttemptId: string | null;
  basis: "source_assignment" | "unresolved" | "explicit_reference";
};
export type VerifiedPerson = {
  id: string;
  aliases: string[];
  sourceIds: string[];
};
export type VerifiedMandateAttempt = {
  id: string;
  electionId: string;
  nomineePersonId: string;
  assignmentEventIds: string[];
};
export function resolvePerson(
  label: string | null,
  registry: readonly VerifiedPerson[],
) {
  if (!label) return null;
  const matches = registry.filter(
    (p) => p.sourceIds.length && p.aliases.includes(label),
  );
  return matches.length === 1 ? matches[0].id : null;
}
/** No inferred attempt numbers, candidate alias guesses, or implicit government proposals. */
export function formationIdentity(
  event: Pick<
    PoliticalEvent,
    | "type"
    | "election"
    | "person"
    | "effectiveAt"
    | "mandateKind"
    | "sources"
    | "status"
  > & { id?: string },
  people: readonly VerifiedPerson[] = [],
  attempts: readonly VerifiedMandateAttempt[] = [],
): FormationIdentity {
  const election = electionByLegacyDate(event.election);
  if (!election) throw new Error("unregistered_election");
  const assignment =
    event.type === "mandate" &&
    event.status === "confirmed" &&
    !!event.person &&
    event.sources.some((s) => s.authority === "president");
  const personId = resolvePerson(event.person, people);
  const matching = attempts.filter(
    (attempt) =>
      assignment &&
      attempt.electionId === election.id &&
      attempt.nomineePersonId === personId &&
      !!event.id &&
      attempt.assignmentEventIds.includes(event.id),
  );
  return {
    electionId: election.id,
    personId,
    proposalId: null,
    mandateAttemptId: matching.length === 1 ? matching[0].id : null,
    basis: matching.length === 1 ? "source_assignment" : "unresolved",
  };
}
export type GovernmentProposal = {
  id: string;
  electionId: string;
  nomineePersonId: string;
  mandateAttemptId: string | null;
  sourceEventIds: string[];
  evidenceBasis: "explicit_proposal";
  identityAnchor: {
    kind: "source_issued_id" | "initiating_event";
    value: string;
  };
};
export function explicitProposal(input: Omit<GovernmentProposal, "id">) {
  if (
    !input.sourceEventIds.length ||
    !input.nomineePersonId ||
    input.evidenceBasis !== "explicit_proposal" ||
    !input.identityAnchor?.value ||
    !["source_issued_id", "initiating_event"].includes(
      input.identityAnchor.kind,
    )
  )
    throw new Error("proposal_evidence_required");
  return {
    ...input,
    id: `proposal-${fingerprint({ electionId: input.electionId, identityAnchor: input.identityAnchor, mandateAttemptId: input.mandateAttemptId })}`,
  };
}
