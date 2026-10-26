import { cadenceMetadata } from "./cadence";
import type { LifecycleLedger, SourceRef } from "./types";

export type SourceCoverage = {
  sourceId: string;
  activeArticles: number;
  checkedArticles: number;
  failedArticles: number;
  overdueArticles: number;
  extractionPending: number;
  oldestDueAt: string | null;
  indexStatus: "unchecked" | "healthy" | "unavailable";
  state: "unchecked" | "checked" | "incomplete" | "unavailable";
};
/** Unique article revalidation precedes discovery, ordered by the actual cadence deadline. */
export function revalidationPlan(
  ledger: LifecycleLedger,
  sourceId: string,
  now: string,
  budget = 12,
) {
  const refs = new Map<string, SourceRef>();
  for (const event of ledger.events) {
    if (event.status === "superseded" || event.status === "retracted") continue;
    for (const ref of event.sources)
      if (ref.id.startsWith(sourceId + ":")) refs.set(ref.url, ref);
  }
  const all = [...refs.values()]
    .map((ref) => {
      const health = ledger.health.find((h) => h.sourceId === ref.id);
      const cadence = cadenceMetadata(
        now,
        health?.lastSuccessfulAt ?? null,
        health?.checkedAt ?? null,
        !!health && health.status !== "healthy",
      );
      return {
        ref,
        dueAt: cadence.dueAt,
        expiresAt: cadence.expiresAt,
        failed: cadence.status === "failed",
      };
    })
    .sort(
      (a, b) =>
        Date.parse(a.expiresAt) - Date.parse(b.expiresAt) ||
        Number(b.failed) - Number(a.failed) ||
        a.ref.url.localeCompare(b.ref.url),
    );
  return { all, selected: all.slice(0, Math.max(0, Math.min(32, budget))) };
}

/** Private diagnostic: counts and IDs only, never raw captures or extracted assertions. */
export function sourceCoverage(
  ledger: LifecycleLedger,
  sourceId: string,
  now: string,
  pending = 0,
): SourceCoverage {
  const { all } = revalidationPlan(ledger, sourceId, now);
  const checked = all.filter(
    ({ ref }) =>
      ledger.health.find((h) => h.sourceId === ref.id)?.checkedAt === now,
  );
  const failed = checked.filter(
    ({ ref }) =>
      ledger.health.find((h) => h.sourceId === ref.id)?.status !== "healthy",
  );
  const index = ledger.health.find((h) => h.sourceId === sourceId);
  const indexStatus = !index
    ? "unchecked"
    : index.status === "healthy"
      ? "healthy"
      : "unavailable";
  return {
    sourceId,
    activeArticles: all.length,
    checkedArticles: checked.length,
    failedArticles: failed.length,
    overdueArticles: all.filter(
      (x) => Date.parse(now) > Date.parse(x.expiresAt),
    ).length,
    extractionPending: pending,
    oldestDueAt: all[0]?.dueAt ?? null,
    indexStatus,
    state:
      indexStatus === "unavailable" || failed.length
        ? "unavailable"
        : checked.length < all.length || pending
          ? "incomplete"
          : indexStatus === "unchecked"
            ? "unchecked"
            : "checked",
  };
}
