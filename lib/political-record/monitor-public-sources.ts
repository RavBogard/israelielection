import type { ElectionLifecycleSnapshot } from "../election-lifecycle/types";
import { safeCheck, type MonitorCheck } from "./monitor-types";
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
      !Array.isArray(body.sourceChecks) ||
      body.sourceChecks.length > 100
    )
      throw Error("stored_read_invalid");
    return body.sourceChecks.map(safeCheck);
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
