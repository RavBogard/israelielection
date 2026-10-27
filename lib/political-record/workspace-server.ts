import { cache } from "react";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { configuredPoliticalRecords } from "./postgres";
import { workspaceRegistry } from "./workspaces";
import { currentElection } from "./registry";
let lastGood: Awaited<ReturnType<typeof workspaceRegistry>> | null = null;
export const getWorkspaceRegistry = cache(async () => {
  if (process.env.POLITICAL_ELECTION_REGISTRY_ENABLED !== "true")
    return { state: "disabled" as const, registry: null };
  await connection();
  let repository: ReturnType<typeof configuredPoliticalRecords> = null;
  try {
    repository = configuredPoliticalRecords();
    if (!repository)
      return { state: "unavailable" as const, registry: lastGood };
    const registry = await workspaceRegistry(
      repository,
      new Date().toISOString(),
    );
    lastGood = structuredClone(registry);
    return { state: "available" as const, registry };
  } catch (error) {
    unstable_rethrow(error);
    return { state: "unavailable" as const, registry: lastGood };
  } finally {
    try {
      await repository?.close();
    } catch (error) {
      unstable_rethrow(error);
    }
  }
});
export async function activeWorkspaceId() {
  const result = await getWorkspaceRegistry();
  return result.state === "disabled"
    ? currentElection().id
    : (result.registry?.currentElectionId ?? null);
}
