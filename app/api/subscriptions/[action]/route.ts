import { subscriptionRoute } from "@/lib/political-record/subscription-routes";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return subscriptionRoute(request, (await context.params).action);
}
