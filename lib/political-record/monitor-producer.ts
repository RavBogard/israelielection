import { configuredPoliticalRecords } from "./postgres";
import type { MonitorCheck } from "./monitor-types";
/** Private SQL inputs become categorical public CI signals, never drafts or claim identifiers. */
export async function publicationProducerChecks(
  now: string,
): Promise<MonitorCheck[]> {
  let repo: ReturnType<typeof configuredPoliticalRecords> = null;
  const base = {
    id: "platform:publication_producer",
    scope: "platform" as const,
    checkedAt: now,
    attempts: 1,
    subjects: ["publication_producer"],
  };
  try {
    repo = configuredPoliticalRecords();
    if (!repo)
      return [
        {
          ...base,
          state: "unconfigured",
          reasonCode: "producer_store_unconfigured",
        },
      ];
    const window = {
      records: await repo.producerJobs(100, true, now),
      truncated: false,
    };
    const jobs = window.records.filter(
      (row) => row.provenance.parserVersion === "private-publication-job-v1",
    );
    const failed = jobs.find(
      (row) => row.payload.errorCode && row.payload.stage !== "done",
    );
    if (failed)
      return [
        {
          ...base,
          state: "unavailable",
          reasonCode: [
            "provider_billing",
            "provider_quota",
            "provider_unconfigured",
            "provider_unavailable",
          ].includes(String(failed.payload.errorCode))
            ? String(failed.payload.errorCode)
            : "publication_review_blocked",
        },
      ];
    if (
      jobs.some(
        (row) =>
          ["queued", "review"].includes(String(row.payload.stage)) &&
          Date.parse(now) - Date.parse(String(row.payload.nextAt)) > 15 * 60000,
      )
    )
      return [
        { ...base, state: "stale", reasonCode: "producer_checkpoint_overdue" },
      ];
    return [
      {
        ...base,
        state: window.truncated ? "unknown" : "healthy_no_new",
        reasonCode: window.truncated
          ? "producer_coverage_incomplete"
          : "producer_no_unresolved_failure",
      },
    ];
  } catch {
    return [
      {
        ...base,
        state: "unavailable",
        reasonCode: "producer_status_unavailable",
      },
    ];
  } finally {
    try {
      await repo?.close();
    } catch {
      /* Redacted signal remains valid. */
    }
  }
}
