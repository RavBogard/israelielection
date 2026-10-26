import { bulkApi } from "@/lib/political-record/bulk";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(
  request: Request,
  context: { params: Promise<{ collection: string }> },
) {
  return bulkApi(request, (await context.params).collection);
}
