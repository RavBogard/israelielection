import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LANGS } from "@/lib/i18n";
import { correctionText } from "@/lib/i18n/corrections";
import { correctionEmail, correctionHref, reportText } from "@/lib/corrections";
import data from "@/data/corrections.json";
import channel from "@/data/correction-channel.json";
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams("url=%2Fcompare%3Fp%3Dlikud%2Cshas%23draft"),
}));
vi.mock("@/lib/reference/catalog", async (original) => ({
  ...(await original<object>()),
  translatedTool: (_id: string, lang: string, original: unknown) => ({
    data: original,
    state: lang === "en" ? "original" : "pending",
    contentLang: "en",
  }),
}));
import CorrectionsPage from "./CorrectionsPage";
describe("localized correction tools", () => {
  it("renders seven genuine forms with honest unsent states and preserved register identities/sources", () => {
    for (const lang of LANGS) {
      const t = correctionText(lang),
        html = renderToStaticMarkup(CorrectionsPage({ lang }));
      expect(
        Object.values(t).every(
          (value) => typeof value === "string" && value.length > 0,
        ),
      ).toBe(true);
      for (const value of [
        t.report,
        t.claim,
        t.copy,
        t.download,
        t.preview,
        t.privacy,
        t.methodNote,
      ])
        expect(html).toContain(value.replaceAll("'", "&#x27;"));
      expect(html).toContain('dir="ltr"');
      expect(html).toContain("p=likud,shas#draft");
      for (const entry of data.entries) {
        expect(html).toContain(`id="${entry.id}"`);
        for (const evidence of entry.evidence)
          expect(html).toContain(evidence.url);
      }
      if (lang !== "en") expect(html).toContain("/corrections?original=en");
    }
  });
  it("localizes generated drafts and preserves the approved recipient and exact contextual assumptions", () => {
    const report = {
      page: "/coalition-builder?with=likud&support=shas&context=immutable#result",
      claim: "61 & 60",
      proposed: "Correct this",
      evidence: "https://example.test/?a=1&b=2",
    };
    for (const lang of LANGS) {
      const t = correctionText(lang),
        draft = new URL(correctionEmail(channel.email, report, lang)!);
      expect(draft.pathname).toBe(channel.email);
      expect(draft.searchParams.get("subject")).toBe(t.subject);
      const body = draft.searchParams.get("body")!;
      expect(body).toContain(t.draftNotice);
      expect(body).toContain(
        "with=likud&support=shas&context=immutable#result",
      );
      expect(body).toContain("61 & 60");
      expect(reportText(report, lang)).toBe(body);
      expect(correctionHref(report.page, lang)).toContain(
        `${lang === "en" ? "" : "/" + lang}/corrections?url=`,
      );
    }
  });
});
