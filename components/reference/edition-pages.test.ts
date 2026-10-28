import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ELECTIONS } from "@/lib/political-record/registry";
import { buildGlobalProjection } from "@/lib/political-record/global-model";
const data = vi.hoisted(() => ({ model: {} as Record<string, unknown> }));
vi.mock("@/lib/reference/read-model", async (original) => ({
  ...(await original<typeof import("@/lib/reference/read-model")>()),
  referenceReadModel: async () => data.model,
}));
vi.mock("@/lib/count-log", () => ({ countLogRows: async () => [] }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/elections",
  useRouter: () => ({ refresh() {} }),
  notFound: () => {
    throw Error("not_found");
  },
  permanentRedirect: (to: string) => {
    throw Error(`redirect:${to}`);
  },
}));
import ReferenceHub from "./ReferenceHub";
const context = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  election: ELECTIONS[0].id,
  revision: "rev-final",
  snapshotRevision: "rev-final",
  sequence: 9,
  updatedAt: "2026-11-04T10:00:00Z",
  pointSeats: { likud: 60, unknown: 60 },
  parties: [{ id: "unknown", label: "Unprofiled list", profiled: false }],
  sourceRefs: [],
  publishedAt: "2026-11-04T10:00:00Z",
  observedAt: "2026-11-04T10:00:00Z",
  correctionOf: null,
  basis: "official_seats",
  pointMethod: "published_official_allocation",
  seatStatus: "official",
  evidenceStage: "official",
  freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
  statutoryPublication: { publishedOn: "2026-11-04" },
  ...over,
});
const model = (c: unknown) => ({
  global: { ...buildGlobalProjection([], [], "2026-11-04T00:00:00Z", null, false), storageState: "unconfigured" },
  elections: ELECTIONS,
  lifecycle: { election: ELECTIONS[0].id, seatContext: c, politics: { events: [] }, alternatives: [] },
  recordHistory: [],
});
const render = async (id: string, lang: "en" | "he" = "en") => renderToStaticMarkup(await ReferenceHub({ kind: "edition", lang, id }));

describe("edition pages", () => {
  it("freezes the current edition once the seats are official", async () => {
    data.model = model(context());
    const html = await render(ELECTIONS[0].id);
    expect(html).toContain('data-testid="edition-frozen"');
    expect(html).toContain("certified November 4, 2026");
    expect(html).toContain("rev-final");
    expect(html).not.toMatch(/>Current</);
    expect(html).toContain('data-testid="export-links"');
  });
  it("keeps the live basis while the count is open", async () => {
    data.model = model(context({ seatStatus: "estimated", basis: "partial_count", evidenceStage: "counting", statutoryPublication: undefined }));
    const html = await render(ELECTIONS[0].id);
    expect(html).not.toContain('data-testid="edition-frozen"');
  });
  it("localizes the election date", async () => {
    data.model = model(context());
    const html = await render(ELECTIONS[0].id, "he");
    expect(html).toContain("27 באוקטובר 2026");
    expect(html).not.toContain(`: ${ELECTIONS[0].electionDay}`);
  });
  it("redirects public aliases to the canonical id", async () => {
    data.model = model(context());
    await expect(render("2026")).rejects.toThrow(`redirect:/elections/${ELECTIONS[0].id}`);
    await expect(render("26")).rejects.toThrow(`redirect:/elections/${ELECTIONS[0].id}`);
    await expect(render("2022")).rejects.toThrow("redirect:/elections/il-knesset-25");
    await expect(render("nonsense")).rejects.toThrow("not_found");
  });
  it("renders the 2019 to 2022 archive editions from the committee files", async () => {
    data.model = model(context());
    for (const id of ["il-knesset-21", "il-knesset-22", "il-knesset-23", "il-knesset-24", "il-knesset-25"]) {
      const html = await render(id);
      expect(html).toContain(`data-archive-edition="${id}"`);
      expect(html).toContain("bechirot.gov.il");
      expect(html).toContain("/vote-map?election=");
    }
  });
  it("lists the archive editions beside the current one", async () => {
    data.model = model(context());
    const html = renderToStaticMarkup(await ReferenceHub({ kind: "elections", lang: "en" }));
    for (const term of [21, 22, 23, 24, 25, 26]) expect(html).toContain(`/elections/il-knesset-${term}`);
  });
});
