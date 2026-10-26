import { expect, it } from "vitest";
import { emptyLedger } from "./resolver";
import { revalidationPlan, sourceCoverage } from "./readiness";
import type { PoliticalEvent, SourceRef } from "./types";
const now = "2026-11-04T12:00:00Z";
it("deduplicates active articles and spends revalidation budget on the oldest cadence deadlines", () => {
  const ledger = emptyLedger();
  ledger.health.push({
    sourceId: "party",
    authority: "party",
    status: "healthy",
    checkedAt: now,
    lastSuccessfulAt: now,
    reason: null,
  });
  for (let n = 0; n < 15; n++) {
    const ref: SourceRef = {
      id: `party:${n}`,
      publisher: "Primary party",
      title: "Statement",
      url: `https://example.org/${n}`,
      authority: "party",
      publishedAt: now,
      observedAt: now,
      captureHash: "a".repeat(64),
    };
    ledger.events.push({
      id: `e${n}`,
      sources: [ref],
      status: "confirmed",
    } as PoliticalEvent);
    ledger.health.push({
      sourceId: ref.id,
      authority: "party",
      status: "healthy",
      checkedAt: now,
      lastSuccessfulAt:
        n === 14 ? "2026-11-03T06:00:00Z" : "2026-11-04T09:00:00Z",
      reason: null,
    });
  }
  ledger.events.push({ ...ledger.events[0], id: "duplicate" });
  const plan = revalidationPlan(ledger, "party", now, 4);
  expect(plan.all).toHaveLength(15);
  expect(plan.selected).toHaveLength(4);
  expect(plan.selected[0].ref.id).toBe("party:14");
  expect(sourceCoverage(ledger, "party", now, 2)).toMatchObject({
    activeArticles: 15,
    checkedArticles: 15,
    extractionPending: 2,
    state: "incomplete",
  });
  ledger.health[1].checkedAt = "2026-11-04T09:00:00Z";
  expect(sourceCoverage(ledger, "party", now)).toMatchObject({
    checkedArticles: 14,
    state: "incomplete",
  });
});
it("does not certify zero-article inaccessible or unchecked sources", () => {
  const ledger = emptyLedger();
  expect(sourceCoverage(ledger, "party", now).state).toBe("unchecked");
  ledger.health.push({
    sourceId: "party",
    authority: "party",
    status: "unavailable",
    checkedAt: now,
    lastSuccessfulAt: null,
    reason: "source_unavailable",
  });
  expect(sourceCoverage(ledger, "party", now).state).toBe("unavailable");
  ledger.health[0].status = "healthy";
  expect(sourceCoverage(ledger, "party", now).state).toBe("checked");
});
