import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { homeEditionBoundary } from "./workspace-view";
const acquisition = vi.hoisted(() => vi.fn());
vi.mock("@/lib/political-record/workspace-server", () => ({
  getWorkspaceRegistry: async () => ({
    state: "available",
    registry: { currentElectionId: "il-knesset-27" },
  }),
}));
vi.mock("@/lib/results-live", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/results-live")>()),
  fetchCount: acquisition,
}));
import HomePage from "@/components/pages/HomePage";
import PendingEditionHome from "./PendingEditionHome";
import { LANGS } from "@/lib/i18n";
describe("future edition home boundary", () => {
  it("never renders or reads26count/model as current27 when new evidence is unavailable", async () => {
    const markup = renderToStaticMarkup(
      await HomePage({ lang: "en", revalidate: 30 }),
    );
    expect(acquisition).not.toHaveBeenCalled();
    expect(markup).toContain("/elections/il-knesset-27");
    expect(markup).toContain("/elections");
    expect(markup).not.toContain("race-pick");
    expect(markup).not.toContain("chance");
  });
  it("fails closed on unknown registry and preserves legacy default only when known", () => {
    expect(
      homeEditionBoundary({ state: "unavailable", registry: null }).state,
    ).toBe("unavailable");
    expect(
      homeEditionBoundary({
        state: "available",
        registry: { currentElectionId: "il-knesset-26" },
      }).state,
    ).toBe("legacy");
    expect(
      homeEditionBoundary({ state: "disabled", registry: null }).state,
    ).toBe("legacy");
  });
  it("keeps allseven pending editions localized and the120-seat frame explicitly unallocated", () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(
        createElement(PendingEditionHome, { lang, id: null }),
      );
      expect(html.match(/aria-hidden="true"/g)).toHaveLength(120);
      expect(html).toContain("/elections");
      expect(html).toContain("<h1");
    }
  });
});
