import { blocs, parties } from "@/lib/data";
import { results } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";

// The count in one small JSON for the masthead strip: refreshed every minute once polls close.
export const revalidate = 60;

export type CountSummary =
  | { state: "closed" | "error" }
  | {
      state: "open";
      fetchedAt: string;
      valid: number;
      localities: number;
      turnout: number | null;
      blocs: { id: string; label: string; seats: number }[];
    };

export async function GET() {
  const live = await fetchCount(revalidate);
  let body: CountSummary;
  if (live.state !== "open") body = { state: live.state };
  else {
    const r = results(live.count, resultsConfig);
    const seatsOf = (bloc: string) =>
      r.lists.filter((l) => parties.find((p) => p.id === l.partyId)?.bloc === bloc).reduce((s, l) => s + l.seats, 0);
    body = {
      state: "open",
      fetchedAt: live.fetchedAt,
      valid: live.count.valid,
      localities: live.count.localities,
      turnout: live.count.eligible ? live.count.voted / live.count.eligible : null,
      blocs: blocs.map((b) => ({ id: b.id, label: b.label, seats: seatsOf(b.id) })),
    };
  }
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
}
