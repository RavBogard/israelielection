import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import Glossary from "../Glossary";
import GlossaryPage from "./GlossaryPage";
import { LANGS } from "@/lib/i18n";
import { glossaryText } from "@/lib/i18n/glossary";
import data from "@/data/glossary.json";
vi.mock("@/lib/reference/catalog", async (original) => ({
  ...(await original<object>()),
  translatedTool: (_id: string, lang: string, original: unknown) => ({
    data: original,
    state: lang === "en" ? "original" : "pending",
    contentLang: "en",
  }),
}));
describe("glossary editions", () => {
  it("renders all controls in seven languages with explicit original definitions and every source", async () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(await GlossaryPage({ lang })),
        t = glossaryText(lang);
      expect(html).toContain(t.title);
      expect(html).toContain(t.find);
      expect(html).toContain(t.historical);
      expect(html).toContain('id="knesset"');
      for (const term of data.terms)
        expect(html).toContain(term.source.url.replaceAll("&", "&amp;"));
      if (lang !== "en") expect(html).toContain("/glossary?original=en");
    }
  });
  it("preserves the original shared anchor when a reviewed translated term is displayed", () => {
    const html = renderToStaticMarkup(
      createElement(Glossary, {
        data: {
          checked: data.checked,
          terms: [
            {
              id: "electoral-threshold",
              originalTerm: "Electoral threshold",
              term: "אחוז החסימה",
              def: "הגדרה מתורגמת",
              source: {
                name: "Source",
                url: "https://example.test/evidence",
                date: "2026-10-05",
              },
            },
          ],
        },
        labels: {},
        lang: "he",
        contentLang: "he",
      }),
    );
    expect(html).toContain('id="electoral-threshold"');
    expect(html).not.toContain('id=""');
    expect(html).toContain('href="#gl-group-א"');
    expect(html).toContain('lang="he" dir="auto"');
    expect(html).toContain('lang="en" dir="ltr"');
  });
});
