import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LANGS } from "@/lib/i18n";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
import { resourcesText } from "@/lib/i18n/resources";
const state = vi.hoisted(() => ({
  context: null as ReturnType<typeof campaignContext> | null,
}));
vi.mock("@/lib/seat-context-server", () => ({
  seatContextForRender: async () => state.context,
}));
vi.mock("@/components/seat-context/SeatBasis", () => ({ default: () => null }));
import ResourcesPage, { resourceTiles } from "./ResourcesPage";
describe("resource directory editions", () => {
  for (const lang of LANGS)
    it(`localizes ${lang} navigation and dated facts`, async () => {
      state.context = null;
      const html = renderToStaticMarkup(await ResourcesPage({ lang }));
      expect(html).toContain(resourcesText(lang).title);
      expect(html).toContain(resourcesText(lang).currentUnavailable);
      expect(html).toContain(
        `href="${lang === "en" ? "" : "/" + lang}/coalition-builder"`,
      );
      expect(html).toContain(
        `href="${lang === "en" ? "" : "/" + lang}/corrections"`,
      );
      expect(html).not.toContain("Campaign archive:");
      expect(html).not.toContain("Outgoing coalition at");
    });
  it("does not substitute a 2026 campaign diagram when current evidence is unavailable", () => {
    const unavailable = resourceTiles(null, "en");
    expect(
      renderToStaticMarkup(
        createElement("div", null, unavailable["/parties"].fig),
      ),
    ).not.toContain("gm-");
    expect(unavailable["/coalition-builder"].caption).toBe(
      resourcesText("en").currentUnavailable,
    );
    const current = resourceTiles(campaignContext(), "en");
    expect(current["/coalition-builder"].caption).not.toBe(
      resourcesText("en").currentUnavailable,
    );
    expect(current["/ballot"].caption).toContain("saved 2026");
    expect(current["/vote-map"].caption).toContain("2022 results");
  });
});
