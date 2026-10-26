import frozen from "../../data/live-forecast-prior.json";
import { parseLocalitySnapshot } from "./geography";
import { hash } from "./model";
import type { LiveSource } from "./types";
/** Acquisition is useful for health and audit, but this feed's locality coverage semantics are not verified. */
export async function acquireOfficial(now: string): Promise<LiveSource> {
  const base: LiveSource = { id: "official-count", publisher: "Central Elections Committee", transport: "official", url: frozen.inputs.results.source.url, revision: "unavailable", publishedAt: null, observedAt: now, status: "unavailable" };
  if (Date.parse(now) < Date.parse(frozen.inputs.results.pollsClose)) return { ...base, note: "Preclose official test data is not fetched" };
  try {
    const response = await fetch(base.url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Official count unavailable");
    const csv = await response.text(); if (csv.length > 10000000) throw new Error("Official count oversized");
    const rows = parseLocalitySnapshot(csv, frozen.inputs.results.letters);
    return { ...base, revision: hash(rows), status: "rejected", note: "Count acquired, but odds exclude it: counted/total-station coverage or completed-locality flags are not verified" };
  } catch { return { ...base, note: "Official count unavailable or invalid; odds retain their prior/exit inputs" }; }
}
