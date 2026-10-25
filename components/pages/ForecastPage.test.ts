import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ForecastPage from "./ForecastPage";
import { LangProvider } from "@/lib/i18n/lang";
import { forecast, forecastPoll } from "@/lib/forecast";
import { blocTotals } from "@/lib/polls";
import { parties } from "@/lib/data";
import FORECAST from "@/lib/i18n/forecast";

const totals = blocTotals(forecastPoll, parties);
const cellText = (row: string) => [...row.matchAll(/<td\b[^>]*>(.*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
afterEach(() => vi.unstubAllEnvs());

describe.each(["en", "he", "ar", "fa", "de", "fr", "zh"] as const)("%s forecast display", (lang) => {
  it("shows party totals as the forecast, with the bloc median explicitly separate", () => {
    const html = renderToStaticMarkup(createElement(LangProvider, { lang }, createElement(ForecastPage, { lang })));
    const table = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/)![0];
    const rows = [...table.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].map((m) => m[0]);
    expect(table).toContain(FORECAST[lang].prediction.cols.median);
    const opposition = rows.find((r) => r.includes("var(--b-opp)"))!;
    expect(cellText(opposition).slice(0, 2)).toEqual([String(totals.opp), String(forecast.blocs.opp.median)]);
    const headlineTotal = rows.slice(1).reduce((sum, row) => sum + Number(cellText(row)[0]), 0);
    expect(headlineTotal).toBe(120);
    const bar = html.match(/class="sb-seg pn-seg pn-seg-opp"[^>]*>[\s\S]*?<\/span>/)![0];
    expect(bar).toContain(`<b>${totals.opp}</b>`);
    const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)];
    const history = tables.at(-1)![0];
    const lastRow = [...history.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].at(-1)![0];
    expect(cellText(lastRow).slice(1, 5)).toEqual([totals.net, totals.opp, totals.arab, totals.mid].map(String));
  });
});

it("renders the homepage opposition headline and majority gap from the same party total", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("RESULTS_NOW", "2026-10-25T12:00:00+02:00");
  const { default: HomePage } = await import("./HomePage");
  const page = await HomePage({ lang: "en", revalidate: 60 });
  const html = renderToStaticMarkup(createElement(LangProvider, { lang: "en" }, page));
  const row = html.match(/class="race-row[^\"]*"[^>]*>[\s\S]*?var\(--b-opp\)[\s\S]*?class="race-row-caption"[\s\S]*?<\/button>/)?.[0];
  expect(row).toBeDefined();
  expect(row).toContain(`class="race-value">${totals.opp}<small>`);
  expect(row).toContain(`${61 - totals.opp}`);
});
