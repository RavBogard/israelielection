import { blocs, parties } from "@/lib/data";
import { countedTurnout, results } from "@/lib/results";
import { fetchCount, resultsNow, resultsConfig } from "@/lib/results-live";
import { night, type Phase } from "@/lib/results-phase";
export const dynamic = "force-dynamic";
export type CountSummary =
  | { state: "closed" | "error"; phase?: Phase }
  | { state: "open"; phase?: Phase; freshness: "fresh" | "stale"; fetchedAt: string; attemptedAt: string; sourceUpdatedAt: string | null; valid: number; localities: number; turnout: number | null; envelopes: boolean | null; blocs: { id: string; label: string; seats: number }[] };
export async function GET() {
  const now = resultsNow(); const live = await fetchCount(60, { now }); const { phase } = night(live, resultsConfig, now); let body: CountSummary;
  if (live.state !== "open") body = { state: live.state, phase };
  else {
    const r = results(live.count, resultsConfig);
    const seatsOf = (bloc: string) => r.lists.filter((l) => parties.find((p) => p.id === l.partyId)?.bloc === bloc).reduce((s, l) => s + l.seats, 0);
    body = { state: "open", phase, freshness: live.freshness, fetchedAt: live.fetchedAt, attemptedAt: live.attemptedAt, sourceUpdatedAt: live.sourceUpdatedAt, valid: live.count.valid, localities: live.count.localities, turnout: countedTurnout(live.count), envelopes: live.count.envelopes?.present ?? null, blocs: blocs.map((b) => ({ id: b.id, label: b.label, seats: seatsOf(b.id) })) };
  }
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } });
}
