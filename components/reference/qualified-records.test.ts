import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildGlobalProjection,
  type GlobalProjection,
} from "@/lib/political-record/global-model";
import { LANGS } from "@/lib/i18n";
import { recordText, recordState } from "@/lib/i18n/records";
import QualifiedRecords from "./QualifiedRecords";
const source = {
  revisionId: "source",
  sourceId: "source",
  publisher: "Source publisher",
  title: "Original evidence",
  url: "https://example.org/evidence",
  authority: "knesset",
  publishedAt: "2026-01-01T00:00:00Z",
  observedAt: "2026-01-02T00:00:00Z",
};
const row = {
  recordId: "record",
  revisionId: "revision",
  title: "Source record title",
  observedAt: source.observedAt,
  effectiveAt: null,
  sources: [source],
  captureState: "retained" as const,
};
export const recordFixture = (): GlobalProjection => ({
  ...buildGlobalProjection([], [], "2026-10-26T00:00:00Z", null, false),
  indicators: [
    {
      ...row,
      revisionId: "indicator",
      seriesId: 120010,
      period: "2026-09",
      monthlyPercent: 0.2,
      annualPercent: 1.9,
      indexValue: 103.4,
      baseDescription: "2024 = 100",
      releaseDate: null,
      units: { index: "index", percent: "percent" },
      causation: "not_established",
    },
  ],
  commitments: [
    {
      ...row,
      revisionId: "commitment",
      commitmentId: "promise",
      actorIds: ["person"],
      chain: [{ stage: "promise", recordRevisionId: "promise" }],
      chainEvidence: [
        {
          stage: "promise",
          recordRevisionId: "promise",
          qualified: true,
          title: "Original promise",
          sources: [source],
        },
      ],
      rubric: {
        version: "1.2",
        commitmentId: "promise",
        metricId: "measured_quantity",
        scopeId: "national",
        unit: "percent",
        baseline: {
          value: 20,
          observationRevisionId: "baseline",
          period: "2026-01",
        },
        target: { comparison: "gte", value: 25, tolerance: 0.1 },
        deadlineAt: "2027-01-01T00:00:00Z",
        assessmentPeriod: "2026-12",
        methodologyRevisionId: "method",
      },
      assessment: {
        state: "not_yet_due",
        reason: "deadline_pending",
        rubricVersion: "1.2",
        measurementRevisionIds: [],
        causation: "not_established",
      },
    },
  ],
  parliament: {
    state: "qualified",
    sourceStatus: "qualified_records",
    memberships: [
      {
        ...row,
        revisionId: "membership",
        termId: "il-knesset-25",
        personId: "member",
        personName: "Recorded Person",
        partyId: null,
        role: "member",
        startedAt: "2025-01-01",
        endedAt: null,
        documentId: "membership_doc",
      },
    ],
    bills: [
      {
        ...row,
        revisionId: "bill",
        billId: "bill",
        title: "Recorded bill",
        termId: "il-knesset-25",
        stage: "first_reading_passed",
        occurredAt: "2026-01-01",
        documentUrl: source.url,
        supersedesDocumentId: null,
        documentId: "bill_doc",
      },
    ],
  },
});
describe("qualified global record displays", () => {
  it("renders available member/bill records without calling election seats membership", () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(
        createElement(QualifiedRecords, {
          global: recordFixture(),
          lang,
          view: "parliament",
        }),
      );
      expect(html).toContain("Recorded Person");
      expect(html).toContain("il-knesset-25");
      expect(html).toContain("2025-01-01");
      expect(html).toContain(recordState("first_reading_passed", lang));
      expect(html).toContain(recordText(lang).partial);
      expect(html).not.toContain("120");
      expect(html).not.toContain("<svg");
    }
  });
  it("shows exact indicator units/base, missing release, source receipts and no causal claim", () => {
    const html = renderToStaticMarkup(
      createElement(QualifiedRecords, {
        global: recordFixture(),
        lang: "en",
        view: "policies",
      }),
    );
    for (const value of [
      "0.2%",
      "1.9%",
      "103.4",
      "2024 = 100",
      "2026-09",
      recordText("en").noRelease,
      recordText("en").noCause,
      source.url,
    ])
      expect(html).toContain(value);
  });
  it("not-yet-due remains distinct from failure with a full versioned rubric and chain", () => {
    const html = renderToStaticMarkup(
      createElement(QualifiedRecords, {
        global: recordFixture(),
        lang: "he",
        view: "policies",
      }),
    );
    for (const value of [
      recordState("not_yet_due", "he"),
      "1.2",
      "2027-01-01",
      "2026-12",
      "Original promise",
      "25",
      "20",
      "0.1",
      "measured_quantity",
      "national",
    ])
      expect(html).toContain(value);
    expect(html).not.toContain(recordState("target_not_met", "he"));
  });
  it("keeps unconfigured data explicitly empty, never inventing an incumbent or outcomes", () => {
    const empty = buildGlobalProjection(
      [],
      [],
      "2026-10-26T00:00:00Z",
      null,
      false,
    );
    expect(
      renderToStaticMarkup(
        createElement(QualifiedRecords, {
          global: empty,
          lang: "fr",
          view: "government",
        }),
      ),
    ).toContain(recordText("fr").noIncumbent);
    expect(
      renderToStaticMarkup(
        createElement(QualifiedRecords, {
          global: empty,
          lang: "ar",
          view: "policies",
        }),
      ),
    ).toContain(recordText("ar").empty);
  });
});
