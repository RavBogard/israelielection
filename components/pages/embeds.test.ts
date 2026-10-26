import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
import { contextToPoll } from "@/lib/seat-context";
import { LANGS, isRtl } from "@/lib/i18n";
import { EMBEDS } from "@/lib/i18n/embeds";
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), context: vi.fn() }));
vi.mock("@/lib/seat-selection", () => ({
  resolveSeatSelection: mocks.resolve,
}));
vi.mock("@/lib/seat-context-server", () => ({
  seatContextForRender: mocks.context,
}));
vi.mock("@/components/seat-context/SeatBasis", () => ({
  default: ({ context, pinned }: { context: unknown; pinned: boolean }) =>
    createElement(
      "p",
      { "data-pinned": pinned },
      context ? "Basis" : "Unavailable",
    ),
}));
vi.mock("@/components/CoalitionBuilder", () => ({
  default: () => createElement("p", null, "Builder"),
}));
import EmbedPage from "./EmbedPage";
describe("localized embeds keep evidence and original unknown lists", () => {
  it("renders120 coherent seats, neutral unknown group and localized basis in every edition", async () => {
    const context = {
      ...campaignContext(),
      pointSeats: { likud: 60, unprofiled: 60 },
      parties: [
        { id: "likud", label: "Likud", profiled: true },
        { id: "unprofiled", label: "Source list", profiled: false },
      ],
    };
    mocks.resolve.mockResolvedValue({ context, poll: contextToPoll(context) });
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(
        await EmbedPage({
          kind: "grid",
          lang,
          searchParams: Promise.resolve({ context: "saved" }),
        }),
      );
      expect(html).toContain(EMBEDS[lang].grid);
      expect(html).toContain(EMBEDS[lang].other);
      expect(html).toContain("Source list");
      expect(html).toContain(`dir="${isRtl(lang) ? "rtl" : "ltr"}"`);
      expect(html).toContain('data-pinned="true"');
      expect(html).not.toContain("/parties/unprofiled");
    }
  });
  it("never substitutes an average when a pinned selection is missing", async () => {
    mocks.resolve.mockResolvedValue(null);
    const html = renderToStaticMarkup(
      await EmbedPage({
        kind: "grid",
        lang: "en",
        searchParams: Promise.resolve({ context: "missing" }),
      }),
    );
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("<svg");
  });
  it("labels the fixed comparison historical and does not request current evidence", async () => {
    mocks.resolve.mockClear();
    const html = renderToStaticMarkup(
      await EmbedPage({
        kind: "average",
        lang: "fr",
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain(EMBEDS.fr.averageNote);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it("keeps a missing current builder unavailable rather than reusing campaign data", async () => {
    mocks.context.mockResolvedValue(null);
    const html = renderToStaticMarkup(
      await EmbedPage({
        kind: "builder",
        lang: "he",
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("Builder");
  });
});
