import { createElement } from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LANGS } from "./i18n";
import { briefingSentence } from "./briefing-locale";
import { sentenceHash } from "./briefing-verified";
import BriefingEvidence from "@/components/reference/BriefingEvidence";
import type { Briefing } from "./briefing";
const sentence = {
  text: "61 seats",
  sourceHash: sentenceHash("61 seats"),
  translations: {
    he: {
      text: "61 מנדטים",
      sourceHash: sentenceHash("61 seats"),
      model: "test",
      reviewed: true as const,
    },
  },
  sources: [],
};
describe("revision-bound briefing editions", () => {
  it("does not display stale translations after actual English text changes", () => {
    expect(briefingSentence(sentence, "he").text).toBe("61 מנדטים");
    expect(
      briefingSentence({ ...sentence, text: "62 seats" }, "he").text,
    ).toBeNull();
  });
  it("marks legacy Hebrew separately from independently verified translations", () => {
    expect(
      briefingSentence({ text: "old", textHe: "ישן", sources: [] }, "he").state,
    ).toBe("legacy");
  });
  it("renders explicit localized pending state and original link in every missing edition", () => {
    for (const lang of LANGS.filter((l) => l !== "en")) {
      const markup = renderToStaticMarkup(
        createElement(BriefingEvidence, {
          briefing: {
            date: "2026-10-26",
            generatedAt: "2026-10-26T00:00:00Z",
            model: "test",
            sentences: [{ text: "English source", sources: [] }],
            dropped: [],
          } as Briefing,
          lang,
        }),
      );
      expect(markup).toContain("?original=en");
      expect(markup).not.toContain("English source");
    }
  });
});
