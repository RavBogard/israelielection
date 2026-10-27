import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sourceRevision } from "./source.mjs";
import {
  referenceDocuments,
  widgetDocuments,
  generationDocuments,
} from "./catalog";
import { Chart, Positions } from "@/components/article/Article";
import { allCharts } from "@/lib/articles";
import { LANGS } from "@/lib/i18n";
describe("trusted widget label editions", () => {
  it("registers21chart files independently of22prose documents and binds actualsource bytes", () => {
    expect(referenceDocuments).toHaveLength(22);
    expect(widgetDocuments).toHaveLength(21);
    expect(generationDocuments.length).toBeGreaterThanOrEqual(43);
    for (const doc of widgetDocuments) {
      expect(doc.revision).toBe(sourceRevision(readFileSync(doc.file)));
      expect(doc.blocks.length).toBeGreaterThan(0);
      expect(doc.blocks.every((b) => b.field && b.text)).toBe(true);
    }
  });
  it("changes visible labels while retaining original chart inputs and all numbers", () => {
    const charts = allCharts(),
      id = Object.keys(charts)[0],
      original = JSON.stringify(charts[id]),
      title = charts[id].title;
    const html = renderToStaticMarkup(
      createElement(Chart, {
        id,
        lang: "he",
        labels: { [title]: "כותרת מתורגמת" },
      }),
    );
    expect(html).toContain("כותרת מתורגמת");
    expect(JSON.stringify(charts[id])).toBe(original);
    expect(html).toContain(charts[id].url);
  });
  it("renders positions in every edition with actual fallback languages and source links", () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(
        createElement(Positions, { issue: "courts", lang }),
      );
      expect(html).toContain("/compare#issue-courts");
      expect(html).toContain("<figure");
      expect(html).toContain("https://");
    }
  });
});
