export function homeEditionBoundary(workspace: {
  state: "disabled" | "available" | "unavailable";
  registry: { currentElectionId: string | null } | null;
}) {
  if (workspace.state === "disabled")
    return { state: "legacy" as const, id: "il-knesset-26" };
  if (
    workspace.state === "unavailable" ||
    !workspace.registry?.currentElectionId
  )
    return { state: "unavailable" as const, id: null };
  return {
    state:
      workspace.registry.currentElectionId === "il-knesset-26"
        ? ("legacy" as const)
        : ("other" as const),
    id: workspace.registry.currentElectionId,
  };
}
