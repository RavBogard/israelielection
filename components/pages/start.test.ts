import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { LANGS, editionPath } from "@/lib/i18n";
import { journeyText } from "@/lib/i18n/journeys";
import { referenceText } from "@/lib/i18n/reference";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
const state = vi.hoisted(() => ({
  context: null as SharedSeatContext | null,
  query: new URLSearchParams("route=five&step=0"),
}));
vi.mock("@/lib/seat-context-server", () => ({
  seatContextForRender: async () => state.context,
}));
vi.mock("@/lib/reference/catalog", () => ({
  translatedTool: (_id: string, lang: string, data: unknown) => ({
    data,
    state: lang === "en" ? "original" : "pending",
    contentLang: "en",
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => state.query,
}));
vi.mock("@/components/seat-context/SeatContextProvider", () => ({
  useSeatContext: () => ({ context: state.context, cadence: null }),
}));
vi.mock("@/components/seat-context/CurrentParliament", () => ({
  default: () => createElement("div", { "data-current-allocation": true }),
}));
import StartPage from "./StartPage";
import VotingRightsGuide from "../VotingRightsGuide";

describe("seven-language learning routes", () => {
  it("localizes controls and keeps unreviewed source text explicitly original", async () => {
    state.context = null;
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(await StartPage({ lang })),
        t = journeyText(lang);
      expect(html).toContain(t.title);
      expect(html).toContain(t.next);
      expect(html).toContain(t.check);
      expect(html).toContain(
        editionPath("/start?route=five&amp;step=1#journey-step", lang),
      );
      if (lang !== "en") {
        expect(html).toContain(referenceText(lang).pending);
        expect(html).toContain('lang="en"');
        expect(html).toContain('lang="en" dir="auto"');
        expect(html).toContain("original=en");
      }
    }
  });
  it("shows unavailable current evidence without substituting a saved campaign forecast", async () => {
    state.context = null;
    const html = renderToStaticMarkup(await StartPage({ lang: "he" }));
    expect(html).not.toContain("data-current-allocation");
    expect(html).not.toContain("saved polling average");
    state.context = {
      ...campaignContext(),
      seatStatus: "official",
      evidenceStage: "official",
      basis: "official_seats",
    };
    const official = renderToStaticMarkup(await StartPage({ lang: "he" }));
    expect(official).toContain("data-current-allocation");
    expect(official).toContain("/he/government");
    state.context = null;
  });
  it("preserves every legal source and makes the voting matrix keyboard reachable", () => {
    const html = renderToStaticMarkup(
      createElement(VotingRightsGuide, { lang: "ar" }),
    );
    expect(html).toContain('role="region" tabindex="0"');
    expect(html).toContain("BasicLawTheKnesset.pdf");
    expect(html).toContain("knesset25-elections-info");
    expect(html).toContain('dateTime="2026-10-05"');
    expect(html).toContain("/ar/how-it-works/voting");
  });
});
