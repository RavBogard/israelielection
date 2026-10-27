import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeRace from "./HomeRace";
import { LangProvider } from "@/lib/i18n/lang";
import { averagePoll, mainPolls, blocs, parties } from "@/lib/data";
import { forecast, forecastPoll } from "@/lib/forecast";
import { campaignContext } from "@/lib/election-lifecycle/resolver";
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
  it("offers the forecast first, then the average, then each pollster's newest poll on a second row", () => {
    const avg = homeRaceModel(averagePoll, parties, blocs), fc = homeRaceModel(forecastPoll, parties, blocs);
    const latest = mainPolls.map((p) => ({ id: p.id, label: p.pollster, detail: p.published, model: homeRaceModel(p, parties, blocs), heading: `${p.pollster} poll`, source: `${p.pollster} source` }));
    const options = [
      { id: "forecast", label: "Forecast", detail: "50,000 runs", model: fc, heading: "Forecast model", source: "forecast source", forecast: { blocs: forecast.blocs, majority: forecast.majority } },
      { id: "avg", label: "Site average", detail: "9 polls", model: avg, heading: "Average of 9 polls", source: "avg source" },
      { id: "latest", label: "Latest polls", detail: `${mainPolls.length} pollsters`, model: avg, variants: latest, variantsLabel: "Which poll" },
    ];
    const html = renderToStaticMarkup(createElement(HomeRace, { options }));
    expect(html).toContain('aria-label="Seats from"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Forecast<small>50,000 runs<\/small>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Site average<small>9 polls<\/small>/);
    expect(html).toContain("Forecast model");
    expect(html).toContain("forecast source");
    expect(html).toContain("of runs");
    expect(html).not.toContain('aria-label="Which poll"');
    expect(fc.kind).toBe("forecast");
    expect(fc.rows.every((r) => !r.incomplete)).toBe(true);
    expect(fc.rows.every((r) => Number.isInteger(r.seats))).toBe(true);
    // The latest-polls option shows its newest poll by default, with one chip per pollster.
    const latestFirst = renderToStaticMarkup(createElement(HomeRace, { options: [options[2], options[0]] }));
    expect(latestFirst).toContain('aria-label="Which poll"');
    expect(latestFirst.match(/class="race-sub"[\s\S]*?<\/div>/)![0].match(/<button/g)).toHaveLength(mainPolls.length);
    expect(latestFirst).toContain(`${mainPolls[0].pollster} poll`);
    expect(latestFirst).toContain(`${mainPolls[0].pollster} source`);
    expect(latest[0].model.kind).toBe("poll");
    expect(latest[0].model.rows.every((r) => !r.incomplete)).toBe(true);
  });
});


describe("evidence choices", () => {
  const model = homeRaceModel(forecastPoll, parties, blocs);
  const options = [
    { id: "current", label: "Current", model },
    { id: "forecast", label: "Election forecast", model },
    { id: "avg", label: "Polling average", model },
  ];
  it("does not offer the saved forecast twice before qualified election evidence", () => {
    const html = renderToStaticMarkup(createElement(HomeRace, {options, currentContext: campaignContext()}));
    expect(html).not.toContain('>Current<');
    expect(html).toContain('aria-pressed="true">Election forecast');
    expect(html).toContain('>Polling average<');
  });
  it.each(["named_exit", "live_projection", "official_seats"] as const)("names %s accurately and retains campaign comparisons", (basis) => {
    const context = {...campaignContext(), basis};
    const html = renderToStaticMarkup(createElement(HomeRace, {options, currentContext: context}));
    const label = {named_exit:"Exit poll",live_projection:"Our live forecast",official_seats:"Official seats (Central Elections Committee)"}[basis];
    expect(html).toContain(`aria-pressed="true">${label}`);
    expect(html).not.toContain('>Current<');
    expect(html).toContain('>Election forecast<');
    expect(html).toContain('>Polling average<');
  });
});
