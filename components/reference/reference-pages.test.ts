import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ELECTIONS } from "@/lib/political-record/registry";
import { LANGS, editionPath } from "@/lib/i18n";
import { referenceText } from "@/lib/i18n/reference";
import { buildGlobalProjection } from "@/lib/political-record/global-model";
const data = vi.hoisted(() => ({ model: {} as Record<string, unknown> }));
vi.mock("@/lib/reference/read-model", async (original) => ({
  ...(await original<typeof import("@/lib/reference/read-model")>()),
  referenceReadModel: async () => data.model,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/parliament",
  useRouter: () => ({ refresh() {} }),
  notFound: () => {
    throw Error("not_found");
  },
}));
import ReferenceHub from "./ReferenceHub";
import { referenceMetadata } from "@/lib/reference/metadata";
const context = {
  schemaVersion: 1,
  election: ELECTIONS[0].electionDay,
  revision: "test",
  snapshotRevision: "test",
  sequence: 1,
  updatedAt: "2026-10-26T00:00:00Z",
  pointSeats: { likud: 60, unknown: 60 },
  parties: [{ id: "unknown", label: "Unprofiled list", profiled: false }],
  sourceRefs: [],
  publishedAt: null,
  observedAt: "2026-10-26T00:00:00Z",
  correctionOf: null,
  basis: "campaign_forecast",
  pointMethod: "campaign_point",
  seatStatus: "estimated",
  evidenceStage: "campaign",
  freshness: { status: "current", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
};
const model = () => ({
  global: {
    ...buildGlobalProjection([], [], "2026-10-26T00:00:00Z", null, false),
    storageState: "unconfigured",
  },
  elections: ELECTIONS,
  lifecycle: {
    election: ELECTIONS[0].electionDay,
    seatContext: context,
    politics: { events: [] },
    alternatives: [],
  },
  recordHistory: [],
});
describe("lasting reference surfaces", () => {
  it("does not claim forecast allocation is current sitting membership", async () => {
    data.model = model();
    const html = renderToStaticMarkup(
      await ReferenceHub({ kind: "parliament", lang: "en" }),
    );
    expect(html).toContain(referenceText("en").noMembership);
    expect(html).toContain(referenceText("en").electionAllocation);
    expect(html).toContain("Unprofiled list");
    expect(html).toContain("Estimate");
  });
  for (const lang of LANGS)
    it(`provides ${lang} policy routes without inventing implementation outcomes`, async () => {
      data.model = model();
      const html = renderToStaticMarkup(
        await ReferenceHub({ kind: "policies", lang }),
      );
      expect(html).toContain(`<h1>${referenceText(lang).policies}</h1>`);
      expect(html).toContain(editionPath("/policies/courts", lang));
      expect(html).toContain(referenceText(lang).policyNote);
    });
  it("returns unknown editions explicitly rather than showing the current seats", async () => {
    data.model = model();
    await expect(
      ReferenceHub({ kind: "edition", lang: "en", id: "il-knesset-999" }),
    ).rejects.toThrow("not_found");
  });
  it("marks pending reference translations noindex without announcing them as ready alternates", () => {
    const metadata = referenceMetadata("/about", "fa");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.languages).toBeUndefined();
  });
});
