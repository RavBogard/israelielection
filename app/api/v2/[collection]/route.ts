import { publicApi } from "@/lib/political-record/public-api";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ collection: string }> },
) {
  return publicApi(request, (await context.params).collection);
}
