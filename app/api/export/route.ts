import type { NextRequest } from "next/server";
import { buildExport } from "@/lib/export-data";
import { exportCsv } from "@/lib/export";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest) { const q=new URLSearchParams(req.nextUrl.searchParams); const kind=q.get("kind")??""; q.delete("kind"); const model=await buildExport(kind,q); if(!model)return Response.json({error:"No valid export selection"},{status:400}); return new Response(exportCsv(model),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="israel-votes-${["issue","coalition","locality"].includes(kind)?kind:"selection"}.csv"`,"Cache-Control":"no-store"}}); }
