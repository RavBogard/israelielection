import { subscriptionRoute } from "@/lib/political-record/subscription-routes";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return subscriptionRoute(request);
}
