import type { Live } from "@/lib/results-live";
const time = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value));
export default function ResultsFreshness({ live }: { live: Extract<Live, { state: "open" }> }) {
  return <aside className={`rs-freshness ${live.freshness}${live.freshness === "stale" ? " callout" : ""}`} aria-label="Count freshness">
    {live.fixture && <p><b>Local rehearsal fixture, not the 2026 count.</b></p>}
    <p><b>{live.freshness === "stale" ? "Saved count; the update is unavailable." : "Latest successful source fetch."}</b> Captured {time(live.fetchedAt)}. {live.sourceUpdatedAt ? `Source file timestamp: ${time(live.sourceUpdatedAt)}.` : "The source file does not provide a verified update time."}{live.freshness === "stale" && ` Last update attempt: ${time(live.attemptedAt)}.`}</p>
    <p>Partial count; seats are this site’s estimate, not the committee’s official allocation. Double envelopes: {live.count.envelopes ? live.count.envelopes.present ? `${live.count.envelopes.valid.toLocaleString("en-US")} valid votes included; may still be incomplete` : "not yet present in this file" : "status not recorded"}.</p>
  </aside>;
}
