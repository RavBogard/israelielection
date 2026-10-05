import { fetchCount } from "@/lib/results-live";
export const dynamic = "force-dynamic";
/** Public, validated full count for the durable capture job. Fixture data can never leave this endpoint. */
export async function GET() {
  const live = await fetchCount();
  const body = live.state !== "open" ? { state: live.state } : live.fixture ? { state: "fixture", fixture: true } : { state: live.freshness, snapshot: live.snapshot };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
