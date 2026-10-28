import { currentElection } from "@/lib/political-record/elections";
export function homeEditionBoundary(workspace: {
  state: "disabled" | "available" | "unavailable";
  registry: { currentElectionId: string | null } | null;
}) {
  if (workspace.state === "disabled")
    return { state: "legacy" as const, id: currentElection().id };
  if (
    workspace.state === "unavailable" ||
    !workspace.registry?.currentElectionId
  )
    return { state: "unavailable" as const, id: null };
  return {
    state:
      workspace.registry.currentElectionId === currentElection().id
        ? ("legacy" as const)
        : ("other" as const),
    id: workspace.registry.currentElectionId,
  };
}
