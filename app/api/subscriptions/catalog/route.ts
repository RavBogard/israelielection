import { followCatalog } from "@/lib/political-record/follows";
import { sharedLimit } from "@/lib/political-record/rate-limit";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (process.env.SUBSCRIPTIONS_ENABLED !== "true")
    return Response.json({ error: "not_found" }, { status: 404 });
  const budget = await sharedLimit("subscriptions:catalog", 300, 60);
  if (!budget.allowed)
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(budget.retryAfter) } },
    );
  const query = new URL(request.url).searchParams;
  try {
    return Response.json(
      {
        schemaVersion: 1,
        options: followCatalog(
          query.get("kind") ?? "party",
          query.get("q") ?? "",
          query.get("lang") ?? "en",
        ),
        limit: 50,
        scope: "reference_only",
      },
      { headers: { "Cache-Control": "public,max-age=300" } },
    );
  } catch {
    return Response.json({ error: "invalid_catalog_query" }, { status: 400 });
  }
}
