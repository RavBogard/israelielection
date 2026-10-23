import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeRace from "./HomeRace";
import { LangProvider } from "@/lib/i18n/lang";
import { averagePoll, blocs, parties } from "@/lib/data";
import { forecast, forecastPoll } from "@/lib/forecast";
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
  it("offers the averages and the forecast as a segmented control, the site average first", () => {
    const avg = homeRaceModel(averagePoll, parties, blocs), fc = homeRaceModel(forecastPoll, parties, blocs);
    const html = renderToStaticMarkup(createElement(HomeRace, { options: [
      { id: "avg", label: "Site average", detail: "9 polls", model: avg, heading: "Average of 9 polls", source: "avg source" },
      { id: "forecast", label: "Forecast", detail: "50,000 runs", model: fc, heading: "Forecast model", source: "forecast source", forecast: { blocs: forecast.blocs, majority: forecast.majority } },
    ] }));
    expect(html).toContain('aria-label="Seats from"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Site average<small>9 polls<\/small>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Forecast<small>50,000 runs<\/small>/);
    expect(html).toContain("Average of 9 polls");
    expect(html).toContain("avg source");
    expect(html).not.toContain("of runs");
    expect(fc.kind).toBe("forecast");
    expect(fc.rows.every((r) => !r.incomplete)).toBe(true);
    expect(fc.rows.every((r) => Number.isInteger(r.seats))).toBe(true);
  });
});
