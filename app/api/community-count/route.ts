import { readCountRecord } from "@/lib/election-lifecycle/count-store";
import { communityCount } from "@/lib/community-count";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** GET /api/community-count?slug=haredim: that community's towns in the stored 2026 count. Reads the saved record only. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  let record = null;
  try {
    record = await readCountRecord();
  } catch {
    return Response.json({ state: "unavailable", reason: "no_count" }, { status: 503 });
  }
  const body = communityCount(slug, record);
  return Response.json(body, {
    status: body.state === "ready" ? 200 : body.reason === "unknown_community" ? 404 : 503,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}
