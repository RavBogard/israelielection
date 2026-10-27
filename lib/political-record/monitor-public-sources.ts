import { emptyLedger } from "../election-lifecycle/resolver";
import type { ElectionLifecycleSnapshot } from "../election-lifecycle/types";
import { sourceAvailabilityChecks } from "./monitor-sources";
import type { MonitorCheck } from "./monitor-types";
/** CI reads stored public facts only. No secret headers, source collection or private response logging. */
export async function publicStoredSourceChecks(
  now: string,
  fetcher: typeof fetch = fetch,
): Promise<MonitorCheck[]> {
  try {
    const response = await fetcher(
      "https://www.israelielection.org/api/election-lifecycle",
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) throw Error("stored_read_failed");
    const body = (await response.json()) as ElectionLifecycleSnapshot;
    if (
      body.schemaVersion !== 1 ||
      !Array.isArray(body.health) ||
      !Array.isArray(body.politics?.events)
    )
      throw Error("stored_read_invalid");
    const ledger = emptyLedger();
    ledger.events = body.politics.events;
    ledger.health = body.health;
    return sourceAvailabilityChecks(ledger, now, true);
  } catch {
    return [
      {
        id: "sources:public_stored_status",
        scope: "platform",
        state: "unavailable",
        checkedAt: now,
        reasonCode: "stored_source_status_unavailable",
        attempts: 1,
        subjects: ["source_coverage"],
      },
    ];
  }
}
