import { describe, it, expect } from "vitest";
import {
  validateRenderedTranslation,
  type SourceDocument,
  type TranslationDocument,
} from "./translations";
const source = {
  id: "test",
  path: "/test",
  file: "test",
  title: "Test",
  checked: "2026-10-26",
  links: [],
  numbers: [],
  revision: "revision",
  blocks: [
    {
      id: "b",
      kind: "text",
      text: "Votes are not passed to anyone.",
      names: [],
      negated: true,
    },
  ],
} satisfies SourceDocument;
describe("German negative morphology guard", () => {
  it("recognizes Hebrew not-yet without accepting an affirmative statement", () => {
    const candidate = (text: string) => ({id:"test",lang:"he",sourceRevision:"revision",publishedAt:"2026-10-26T00:00:00Z",status:"published",blocks:[{id:"b",text}]}) as TranslationDocument;
    expect(() => validateRenderedTranslation(candidate("סוכם; טרם נחתם"),source)).not.toThrow();
    expect(() => validateRenderedTranslation(candidate("סוכם; נחתם"),source)).toThrow("rendered_negation_missing");
  });
  for (const text of [
    "Stimmen werden an niemanden weitergegeben.",
    "Niemand erhält diese Stimmen.",
    "Daraus erhält die Liste nichts.",
    "Die Stimmen gehen keineswegs an eine andere Liste.",
  ])
    it(text, () => {
      expect(() =>
        validateRenderedTranslation(
          {
            id: "test",
            lang: "de",
            sourceRevision: "revision",
            publishedAt: "2026-10-26T00:00:00Z",
            status: "published",
            blocks: [{ id: "b", text }],
          } as TranslationDocument,
          source,
        ),
      ).not.toThrow();
    });
  it("still rejects an omitted negative claim before semantic review", () => {
    expect(() =>
      validateRenderedTranslation(
        {
          id: "test",
          lang: "de",
          sourceRevision: "revision",
          publishedAt: "2026-10-26T00:00:00Z",
          status: "published",
          blocks: [
            {
              id: "b",
              text: "Die Stimmen werden an andere Listen weitergegeben.",
            },
          ],
        } as TranslationDocument,
        source,
      ),
    ).toThrow("rendered_negation_missing");
  });
});
