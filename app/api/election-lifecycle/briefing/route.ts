import { getElectionLifecycle } from "@/lib/election-lifecycle/server";
import { lifecycleStore } from "@/lib/election-lifecycle/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [current, ledger] = await Promise.all([
      getElectionLifecycle(),
      lifecycleStore()?.load(),
    ]);
    const latest = ledger?.briefings?.at(-1);
    if (!current || !latest)
      return Response.json(
        { state: "waiting" },
        { headers: { "Cache-Control": "no-store" } },
      );
    const allowed = new Set(latest.eventIds);
    return Response.json(
      {
        state: "ready",
        date: latest.date,
        generatedAt: latest.generatedAt,
        seatRevision: latest.seatRevision,
        events: current.politics.events.filter((e) => allowed.has(e.id)),
        withheldCount: latest.eventIds.filter(
          (id) => !current.politics.events.some((e) => e.id === id),
        ).length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { state: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
