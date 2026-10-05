// Temporary: can Vercel reach the committee's results file? Removed after one check.
export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, string> = {};
  for (const u of ["https://media26.bechirot.gov.il/files/expc.csv", "https://media26.bechirot.gov.il/files/expb.csv"]) {
    try {
      const r = await fetch(u, { cache: "no-store" });
      out[u] = `${r.status} ${(await r.text()).length} bytes ${process.env.VERCEL_REGION ?? ""}`;
    } catch (e) {
      out[u] = `error ${(e as Error).message}`;
    }
  }
  return Response.json(out);
}
