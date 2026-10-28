import { electionByLegacyDate } from "@/lib/political-record/elections";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
/** Early seat snapshots carry the election day instead of the canonical id. */
export function canonicalSeatEdition(id: string) {
  return electionByLegacyDate(id)?.id ?? id;
}
export function authoritativeEdition(body: {
  currentElectionId?: unknown;
  workspaceState?: unknown;
}) {
  return (body.workspaceState === "available" ||
    body.workspaceState === "disabled") &&
    typeof body.currentElectionId === "string" &&
    /^il-knesset-[1-9]\d*$/.test(body.currentElectionId)
    ? body.currentElectionId
    : null;
}
export function blocksCurrentContext(
  context: SharedSeatContext | null,
  id: string | null,
) {
  return !!id && (!context || canonicalSeatEdition(context.election) !== id);
}

export function initialContextWins(
  initial: SharedSeatContext | null | undefined,
  current: SharedSeatContext | null | undefined,
) {
  return (
    !!initial &&
    (!current ||
      (canonicalSeatEdition(initial.election) ===
        canonicalSeatEdition(current.election) &&
        initial.sequence > current.sequence))
  );
}
export function compatibleInitialEdition(
  initial: SharedSeatContext,
  authoritativeId: string | null,
) {
  return (
    !authoritativeId ||
    canonicalSeatEdition(initial.election) === authoritativeId
  );
}
