import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChangesPage from "./ChangesPage";
import { LANGS } from "@/lib/i18n";
import { referenceText } from "@/lib/i18n/reference";
import { briefingEvidenceLabel } from "@/lib/i18n/briefing";
import type { GlobalNotices } from "@/lib/political-record/global-notices";
it("all seven editions show only their reviewed notice with source/time/revision and explicit pending instead of fallback", () => {
  for (const lang of LANGS) {
    const notices: GlobalNotices = {
      state: "available",
      complete: true,
      notices: [
        {
          recordId: "notice:cbs",
          revisionId: "a".repeat(64),
          previousRevisionId: null,
          observedAt: "2026-10-27T00:47:36.758Z",
          state: "reviewed",
          evidenceClasses: ["primary_confirmed"],
          content: {
            subject: `Reviewed ${lang}`,
            text: `Qualified ${lang}: 105.3 index; -0.5%; 1.6%.`,
          },
          sources: [
            {
              id: "cbs",
              publisher: "CBS",
              title: "Consumer Price Index",
              url: "https://api.cbs.gov.il/index/data/price?id=120010",
              publishedAt: null,
              observedAt: "2026-10-27T00:47:36.758Z",
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(
      createElement(ChangesPage, { lang, notices }),
    );
    expect(html).toContain(`Reviewed ${lang}`);
    expect(html).toContain('href="https://api.cbs.gov.il/');
    expect(html).toContain(`id="revision-${"a".repeat(64)}"`);
    expect(html).toContain('dateTime="2026-10-27T00:47:36.758Z"');
    notices.notices[0] = {
      ...notices.notices[0],
      state: "pending",
      content: null,
      sources: [],
    };
    const pending = renderToStaticMarkup(
      createElement(ChangesPage, { lang, notices }),
    );
    expect(pending).toContain(referenceText(lang).pending);
    expect(pending).not.toContain("Qualified");
    expect(pending).not.toContain("Reviewed");
  }
});
it("never upgrades pure analysis, mixed reporting, or missing classes to primary confirmation", () => {
  for (const lang of LANGS)
    for (const classes of [
      ["attributed_analysis"],
      ["primary_confirmed", "reported_corroborated", "attributed_analysis"],
      [],
      ["unknown_class"],
    ]) {
      const notices: GlobalNotices = {
        state: "available",
        complete: true,
        notices: [
          {
            recordId: "notice",
            revisionId: "b".repeat(64),
            previousRevisionId: null,
            observedAt: "2026-10-27T00:47:36.758Z",
            state: "reviewed",
            evidenceClasses: classes,
            content: { subject: "Reviewed", text: "Source-qualified content." },
            sources: [],
          },
        ],
      };
      const html = renderToStaticMarkup(
        createElement(ChangesPage, { lang, notices }),
      );
      if (classes.includes("attributed_analysis"))
        expect(html).toContain(
          briefingEvidenceLabel(lang, "attributed_perspective"),
        );
      if (classes.includes("reported_corroborated"))
        expect(html).toContain(
          briefingEvidenceLabel(lang, "corroborated_reporting"),
        );
      expect(html.includes('data-evidence-class="primary_confirmed"')).toBe(
        classes.includes("primary_confirmed"),
      );
      if (!classes.length || classes[0] === "unknown_class")
        expect(html).not.toContain("data-evidence-class");
    }
});
