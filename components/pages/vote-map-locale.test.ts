import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import VoteMapPage from "./VoteMapPage";
import { leaderText } from "@/components/VoteMap";
import { LANGS } from "@/lib/i18n";
import { mapText, mapMessage, mapDate } from "@/lib/i18n/vote-map";
import { voteMix } from "@/lib/votemap-visual";
import { historicalElections } from "@/lib/votemap-data";
import { alternates } from "@/lib/canonical";
const election = {
  ...historicalElections[4],
  lists: historicalElections[4].lists.slice(0, 2),
};
describe("vote-map editions", () => {
  for (const lang of LANGS)
    it(`${lang} has full deterministic copy and honest original evidence`, () => {
      const t = mapText(lang);
      expect(
        Object.values(t).every(
          (value) => typeof value === "string" && value.length > 0,
        ),
      ).toBe(true);
      expect(mapMessage(t.markers, 2, 5, 1)).not.toMatch(/\{\d+\}/);
      expect(leaderText(null, lang)).toBe(t.noValid);
      expect(
        leaderText(voteMix(election, [1, 100, 100, 100, 30, 25]), lang),
      ).toBe(t.unresolved);
      expect(
        leaderText(voteMix(election, [1, 100, 100, 100, 45, 45]), lang),
      ).toContain("45.0%");
      const html = renderToStaticMarkup(createElement(VoteMapPage, { lang }));
      expect(html).toContain(t.title);
      if (lang === "he") {
        // The Hebrew guide is written in Hebrew, so it carries the sources instead of the pending note.
        expect(html).toContain("https://votes25.bechirot.gov.il/nationalresults");
        expect(html).not.toContain("/vote-map?original=en");
      } else if (lang !== "en") expect(html).toContain("/vote-map?original=en");
      else {
        expect(html).toContain(
          "https://votes25.bechirot.gov.il/nationalresults",
        );
        expect(html).not.toContain("expected about a week");
      }
    });
  it("keeps missing dates unknown and does not advertise untranslated source-prose alternates", () => {
    expect(mapDate("invalid", "he")).toBe(mapText("he").notAvailable);
    expect(alternates("/vote-map")?.languages).toBeUndefined();
  });
});
