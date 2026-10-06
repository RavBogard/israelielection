import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeRace from "./HomeRace";
import { LangProvider } from "@/lib/i18n/lang";
import { averagePoll, blocs, parties } from "@/lib/data";
import { homeRaceModel } from "@/lib/home-race";

const cell0 = (html: string) => html.match(/<rect data-cell="0" data-bloc="net" class="c" x="(\d+)" y="(\d+)"/)!.slice(1).map(Number);

describe("the home mosaic", () => {
  it("fills from the top left in English", () => {
    const html = renderToStaticMarkup(createElement(HomeRace, { model: homeRaceModel(averagePoll, parties, blocs) }));
    expect(cell0(html)).toEqual([1, 1]);
    expect(html).toContain('<text class="rl" x="149"');
    expect(html).toContain("Choose a bloc to see its parties.");
  });
  it("fills from the top right in Hebrew, 61 on the left, words in Hebrew", () => {
    const html = renderToStaticMarkup(createElement(LangProvider, { lang: "he" }, createElement(HomeRace, { model: homeRaceModel(averagePoll, parties, blocs, "he") })));
    expect(cell0(html)).toEqual([153, 1]);
    expect(html).toMatch(/<text class="rl" x="15" [^>]*text-anchor="end"/);
    expect(html).toContain("בחרו גוש כדי לראות את המפלגות שבו.");
    expect(html).not.toMatch(/seats short of|Show parties/);
  });
});
