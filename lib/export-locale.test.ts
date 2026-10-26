import { describe, it, expect } from "vitest";
import { LANGS } from "./i18n";
import { localizeExport } from "./export-locale";
import { EXPORTS, exportHeader } from "./i18n/exports";
import { exportCsv, type SourcedExport } from "./export";
const source: SourcedExport = {
  title: "Selected coalition arrangement",
  asOf: "2026-10-28",
  headers: ["List", "Assigned role", "Seats"],
  rows: [
    ["Likud", "Outside support", 61],
    ["Original list", "Hypothetical abstention", null],
  ],
  assumptions: ["Original method note"],
  sources: [{ label: "CEC", url: "https://example.org/source" }],
  view: "/coalition-builder?context=saved&support=likud&abstain=new",
};
describe("localized sourced exports", () => {
  it("localizes structural labels but keeps values, source URLs, roles and seat pin", () => {
    for (const lang of LANGS) {
      const model = localizeExport(source, "coalition", lang);
      expect(model.headers[2]).toBe(exportHeader("Seats", lang));
      expect(model.rows[0][2]).toBe(61);
      expect(model.rows[1][2]).toBeNull();
      expect(model.view).toContain("context=saved&support=likud&abstain=new");
      expect(model.sources).toEqual(source.sources);
      expect(exportCsv(model)).toContain(EXPORTS[lang].unknown);
      if (lang !== "en") {
        expect(model.originalEvidence).toBe(true);
        expect(exportCsv(model)).toContain(EXPORTS[lang].original);
        expect(model.rows[0][1]).not.toBe("Outside support");
      }
    }
  });
  it("does not translate historical list identity or mutate the source model", () => {
    const model = localizeExport(source, "locality", "he");
    expect(model.rows[0][0]).toBe("Likud");
    expect(source.headers[2]).toBe("Seats");
    expect(source.rows[0][1]).toBe("Outside support");
  });
  it("keeps CSV formula protection after localization", () => {
    const model = localizeExport(
      { ...source, rows: [["=HYPERLINK(bad)", null, 0]] },
      "locality",
      "zh",
    );
    expect(exportCsv(model)).toContain("'=HYPERLINK(bad)");
    expect(exportCsv(model)).toContain('"0"');
  });
});
