import { lifecycleStore } from "@/lib/election-lifecycle/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const revision =
    new URL(request.url).searchParams.get("revision") ?? undefined;
  if (revision && !/^[a-f0-9]{64}$/.test(revision))
    return Response.json({ state: "unavailable" }, { status: 404 });
  try {
    const snapshot = await lifecycleStore()?.geography(revision);
    return snapshot
      ? Response.json(
          { state: "ready", snapshot },
          { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } },
        )
      : Response.json(
          { state: "unavailable", reason: "awaiting_validated_localities" },
          { status: 404 },
        );
  } catch {
    return Response.json(
      { state: "unavailable", reason: "source_unavailable" },
      { status: 503 },
    );
  }
}
