import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TimelinePage from "./TimelinePage";
import PartyHistoryPage from "./PartyHistoryPage";
import { LANGS, editionPath } from "@/lib/i18n";
import {
  historyText,
  historicalDate,
  historicalMonth,
  historyKind,
} from "@/lib/i18n/history";
import { historyPartyLabels, historicalMetadata } from "@/lib/history-pages";
import { filterHistories, histories } from "@/lib/party-history";
import { governmentAt, monthOf } from "@/lib/timeline";
import timeline from "@/data/timeline.json";
import partyHistory from "@/data/party-history.json";
it("all seven historical editions localize controls and dates, preserve records/anchors, and explicitly label pending factual originals", () => {
  const before = JSON.stringify({ timeline, partyHistory });
  for (const lang of LANGS) {
    const t = historyText(lang),
      time = renderToStaticMarkup(createElement(TimelinePage, { lang })),
      family = renderToStaticMarkup(createElement(PartyHistoryPage, { lang }));
    for (const value of Object.values(t)) expect(value).toBeTruthy();
    expect(time).toContain(t.previous);
    expect(time).toContain(t.next);
    expect(time).toContain('type="range"');
    expect(time).toContain(t.archive);
    expect(time).not.toContain("In office");
    expect(family).toContain(t.find);
    expect(family).toContain(t.branch);
    expect(family).toContain('id="likud"');
    expect(family).toContain(editionPath("/parties/likud", lang)!);
    expect(family).toContain(editionPath("/ballot#likud", lang)!);
    if (lang !== "en") {
      // The timeline is translated in every edition; party histories still show their English originals.
      expect(time).not.toContain(t.original);
      expect(time).toContain(`lang="${lang}"`);
      expect(historicalMetadata("timeline", lang).robots).toBeUndefined();
      expect(family).toContain(t.original);
      expect(historicalMetadata("party-history", lang).robots).toEqual({
        index: false,
        follow: true,
      });
    }
    expect(time).toContain("1977");
    expect(family).toContain("https://en.idi.org.il/");
  }
  expect(JSON.stringify({ timeline, partyHistory })).toBe(before);
});
it("party search recognizes reviewed current labels in every script and preserves canonical family filters after data translation", () => {
  for (const lang of LANGS) {
    const labels = historyPartyLabels(lang),
      aliases = Object.fromEntries(
        Object.entries(labels).map(([id, label]) => [id, label.aliases]),
      );
    expect(
      filterHistories("all", labels.likud.name, histories, aliases).map(
        (row) => row.id,
      ),
    ).toContain("likud");
  }
  const copied = structuredClone(histories);
  copied.find((row) => row.id === "dem")!.family = "Translated family";
  expect(
    filterHistories("Labor and Meretz", "Meretz", copied).map((row) => row.id),
  ).toContain("dem");
  expect(filterHistories("Haredi parties", "Meretz", copied)).toEqual([]);
  expect(historyKind("unknown", "he")).toBe("unknown");
});
it("calendar localization never changes Gregorian chronology and closed historical terms do not extend into a gap", () => {
  for (const lang of LANGS) {
    expect(historicalDate("2026-10-05", lang)).toBeTruthy();
    expect(historicalMonth(0, lang)).toBeTruthy();
  }
  expect(historicalDate("1988–1992", "fa")).toBe("1988–1992");
  const government = {
    pm: "Fixture",
    party: "Fixture",
    from: "2000-01-01",
    to: "2001-01-01",
    source: { name: "Fixture", url: "https://example.invalid/", date: "" },
  };
  expect(governmentAt([government], monthOf("2001-02-01"))).toBeUndefined();
  expect(governmentAt([government], monthOf("2000-02-01"))).toBe(government);
});
