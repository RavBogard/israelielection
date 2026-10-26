import { readCountRecord } from "../election-lifecycle/count-store";
import frozen from "../../data/live-forecast-prior.json";
import { parseLocalitySnapshot } from "./geography";
import { hash } from "./model";
import type { LiveSource } from "./types";
/** Acquisition is useful for health and audit, but this feed's locality coverage semantics are not verified. */
export async function acquireOfficial(now: string): Promise<LiveSource> {
  const base: LiveSource = {
    id: "official-count",
    publisher: "Central Elections Committee",
    transport: "official",
    url: frozen.inputs.results.source.url,
    revision: "unavailable",
    publishedAt: null,
    observedAt: now,
    status: "unavailable",
  };
  if (Date.parse(now) < Date.parse(frozen.inputs.results.pollsClose))
    return { ...base, note: "Preclose official test data is not fetched" };
  try {
    const record = await readCountRecord();
    if (!record?.raw || record.health.error || !record.current)
      throw new Error("No usable durable count");
    const csv = record.raw;
    if (csv.length > 10000000) throw new Error("Official count oversized");
    const rows = parseLocalitySnapshot(csv, frozen.inputs.results.letters);
    return {
      ...base,
      revision: hash(rows),
      status: "rejected",
      note: "Count acquired, but odds exclude it: counted/total-station coverage or completed-locality flags are not verified",
    };
  } catch {
    return {
      ...base,
      note: "Official count unavailable or invalid; odds retain their prior/exit inputs",
    };
  }
}
