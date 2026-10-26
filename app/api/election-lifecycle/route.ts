import { getElectionLifecycle } from "@/lib/election-lifecycle/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    revision = q.get("revision") ?? undefined;
  const snapshot = await getElectionLifecycle({ revision });
  if (!snapshot)
    return Response.json(
      {
        state: "unavailable",
        reason: revision ? "pinned_unavailable" : "source_unavailable",
        revision,
      },
      {
        status: revision ? 404 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  const body =
    q.get("view") === "seats"
      ? {
          selection: snapshot.selection,
          schemaVersion: snapshot.schemaVersion,
          election: snapshot.election,
          revision: snapshot.revision,
          sequence: snapshot.sequence,
          updatedAt: snapshot.updatedAt,
          seatContext: snapshot.seatContext,
          alternatives: snapshot.alternatives,
          health: snapshot.health,
          archive: snapshot.archive,
        }
      : snapshot;
  // Full politics is never shared-cacheable: source withdrawal must remove claims, decisions and derived clocks.
  return Response.json(body, {
    headers: {
      "Cache-Control":
        q.get("view") === "seats"
          ? "public, max-age=0, s-maxage=30"
          : "no-store",
    },
  });
}
