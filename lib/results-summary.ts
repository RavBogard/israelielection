import type { CountSummary } from "@/app/api/count/route";
/** Transport errors keep the visible last-known count, explicitly marked stale. */
export function nextCountSummary(previous: CountSummary | null, incoming: CountSummary | null, attemptedAt: string): CountSummary | null {
  if (incoming?.state === "open") return incoming;
  if (incoming?.state === "closed") return incoming;
  return previous?.state === "open" ? { ...previous, freshness: "stale", attemptedAt } : incoming;
}
