import { getLiveForecast, liveForecastEnabled } from "@/lib/live-forecast/server";
import { getCountEstimate } from "@/lib/live-forecast/count-estimate";
export const runtime = "nodejs";
export async function GET() {
  const snapshot = await getLiveForecast();
  return Response.json({ ...snapshot, countEstimate: await getCountEstimate(snapshot), enabled: liveForecastEnabled() }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
