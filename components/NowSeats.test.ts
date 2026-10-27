import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { allPolls, pollsData } from "@/lib/data";
import { LANGS } from "@/lib/i18n";
import { NOW_SEATS } from "@/lib/i18n/now-seats";
import { outgoingSeats, outgoingSeatsData } from "@/lib/outgoing-seats";
import { resultsConfig } from "@/lib/results-live";
import NowSeats, { nowComponents } from "./NowSeats";
import ExitPollTable from "./results/ExitPollTable";

const chip = (id: string, lang: (typeof LANGS)[number] = "en") => renderToStaticMarkup(createElement(NowSeats, { id, lang }));
const nowOf = (html: string) => [...html.matchAll(/data-now="([^"]+)"/g)].map((m) => m[1]);

describe("NowSeats", () => {
  it("carries each list's outgoing seats, and 'new' for a list with none", () => {
    for (const [id, l] of Object.entries(outgoingSeatsData.lists)) {
      const html = chip(id);
      expect(html).toContain('data-testid="now-seats"');
      expect(nowOf(html)).toEqual([l.seats ? String(l.seats) : "new"]);
    }
  });

  it("renders nothing for an id with no outgoing record", () => {
    expect(chip("not-a-list")).toBe("");
  });

  it("names a merged list's factions in its accessible text, in every edition", () => {
    expect(nowComponents("likud", "en")).toBe("Likud 32 + New Hope 4");
    expect(nowComponents("shas", "en")).toBeNull();
    for (const lang of LANGS) {
      const html = chip("likud", lang);
      expect(html).toContain(nowComponents("likud", lang)!);
      expect(NOW_SEATS[lang].chip(36)).toContain("36");
    }
  });

  it("adds one Now column to the exit-poll table, matching each row's list", () => {
    const exits = allPolls.filter((p) => p.kind === "exit");
    if (!exits.length) return;
    const html = renderToStaticMarkup(createElement(ExitPollTable, { polls: allPolls, pollsConfig: pollsData.config, config: resultsConfig, lang: "en" }));
    expect(html.match(/data-testid="exit-main-now-h"/g)?.length ?? 0).toBeLessThanOrEqual(1);
    expect(html).toContain('data-testid="now-seats-key"');
    const rows = [...html.matchAll(/href="\/parties\/([a-z]+)"[\s\S]*?data-now="([^"]+)"/g)];
    expect(rows.length).toBeGreaterThan(0);
    for (const [, id, now] of rows) expect(now).toBe(outgoingSeats(id) ? String(outgoingSeats(id)) : "new");
  });
});
