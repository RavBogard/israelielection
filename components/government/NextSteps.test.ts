import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import NextSteps from "./NextSteps";
import { NEXT_STEPS } from "@/lib/i18n/government-next";

const snap = { seatContext: { seatStatus: "estimated" }, politics: { events: [], clock: null } } as never;

describe("NextSteps", () => {
  it("renders four steps in every edition, the first one next and dated as expected", () => {
    for (const lang of Object.keys(NEXT_STEPS) as (keyof typeof NEXT_STEPS)[]) {
      const html = renderToStaticMarkup(createElement(NextSteps, { snapshot: snap, lang }));
      expect(html.match(/data-step=/g)).toHaveLength(4);
      expect(html).toContain('data-step="envelopes" data-state="next"');
      expect(html).toContain("2026");
    }
  });
});
