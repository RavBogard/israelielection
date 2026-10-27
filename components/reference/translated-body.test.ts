import { it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TranslatedBody from "./TranslatedBody";
import type {
  SourceDocument,
  TranslationDocument,
} from "@/lib/reference/translations";
it("keeps reviewed prose in the native article frame, with one headline, standfirst and dated body", () => {
  const source: SourceDocument = {
    id: "test",
    path: "/test",
    file: "test.mdx",
    revision: "revision",
    title: "Original title",
    checked: "2026-10-05",
    links: [],
    numbers: [],
    blocks: ["title", "summary", "heading", "text"].map((kind, i) => ({
      id: String(i),
      kind,
      text: "Source text",
      names: [],
      negated: false,
    })),
  };
  const translation: TranslationDocument = {
    id: "test",
    lang: "he",
    sourceRevision: "revision",
    status: "published",
    publishedAt: "2026-10-26T00:00:00Z",
    blocks: ["כותרת", "מבוא", "כותרת משנה", "פסקת תוכן"].map((text, i) => ({
      id: String(i),
      text,
    })),
    review: {
      sourceRevision: "revision",
      contentHash: "render-fixture",
      model: "test",
      verdict: "supported",
      blocks: source.blocks.map((b) => ({
        id: b.id,
        supported: true,
        complete: true,
        negationPreserved: true,
        namesPreserved: true,
      })),
    },
  };
  const html = renderToStaticMarkup(
    createElement(TranslatedBody, { source, translation, lang: "he" }),
  );
  expect(html).toContain('class="article-grid solo"');
  expect(html).toContain('class="body"');
  expect(html).toContain('class="dek"');
  expect(html).toContain('dateTime="2026-10-05"');
  expect(html.match(/<h1/g)).toHaveLength(1);
  expect(html).toContain("<h2>כותרת משנה</h2>");
});
