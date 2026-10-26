import { getLiveForecast, liveForecastEnabled } from "@/lib/live-forecast/server";
export const runtime = "nodejs";
export async function GET() {
  return Response.json({ ...await getLiveForecast(), enabled: liveForecastEnabled() }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
