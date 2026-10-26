import { getElectionLifecycle } from "@/lib/election-lifecycle/server";
import { evaluationsFor } from "@/lib/election-lifecycle/evaluation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const revision =
      new URL(request.url).searchParams.get("revision") ?? undefined,
    current = await getElectionLifecycle({ revision });
  if (!current)
    return Response.json(
      { state: "unavailable", reason: "pinned_unavailable" },
      { status: 404 },
    );
  if (current.seatContext.seatStatus !== "official")
    return Response.json(
      { state: "awaiting_official", evaluations: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  return Response.json(
    {
      state: "ready",
      officialRevision: current.seatContext.revision,
      evaluations: evaluationsFor(current.seatContext),
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } },
  );
}
