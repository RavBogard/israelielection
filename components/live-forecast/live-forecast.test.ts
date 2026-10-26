import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGS, isRtl } from "@/lib/i18n";
import { LIVE_FORECAST } from "@/lib/i18n/live-forecast";
import { getBaselineSnapshot } from "@/lib/live-forecast/server";
import { ForecastDisplay } from "./ForecastClient";
import LiveForecast, { forecastPresentation } from "./LiveForecast";
import { acceptSnapshot, mergeSnapshot, primaryThresholds, probability } from "./presentation";

afterEach(() => {vi.unstubAllEnvs();vi.useRealTimers();});

describe.each(LANGS)("%s live balance", (lang) => {
  it("renders three equally ranked questions, actual prior and conditional semantics", () => {
    const text = LIVE_FORECAST[lang];
    const html = renderToStaticMarkup(createElement(ForecastDisplay, { initial: getBaselineSnapshot(), lang, ...forecastPresentation(lang) }));
    for (const question of [text.ahead, text.paths, text.changes]) expect(html).toContain(question);
    expect(html).toContain(`dir="${isRtl(lang) ? "rtl" : "ltr"}"`);
    expect(html).toContain(text.conditional);
    expect(html).toContain(text.pm);
    expect(html).toContain(text.interval);
    expect(html).toContain(text.association);
    expect(html).toContain(text.prior);
    expect(html).toContain(text.provisionalPrior);
    expect(html).toContain(text.dataTable);
    expect(html).toContain("poll=forecast");
    expect(html).toContain("support=raam");
    expect(html).toContain("abstain=jl");
    expect(html).toContain(text.baselineLink);
    expect(html).not.toContain("NaN");
  });
});

it("keeps the feature off unless explicitly enabled", async () => {
  vi.stubEnv("LIVE_FORECAST_ENABLED", "false");
  expect(await LiveForecast({ lang: "en" })).toBeNull();
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  expect(await LiveForecast({ lang: "en" })).not.toBeNull();
});

it("uses whole percentages without claiming certainty", () => {
  expect([0, .001, .01, .573, .99, .999, 1, NaN, -1].map(probability)).toEqual(["<1%", "<1%", "1%", "57%", "99%", ">99%", ">99%", "—", "—"]);
});

it("retains the last good forecast across out-of-order or failed baseline responses", () => {
  const baseline = getBaselineSnapshot();
  const live = { ...baseline, generatedAt: "2026-10-27T21:00:00Z", mode: "exit" as const };
  expect(acceptSnapshot(live, baseline)).toBe(false);
  expect(acceptSnapshot(live, { ...live, generatedAt: "2026-10-27T20:59:00Z" })).toBe(false);
  expect(acceptSnapshot(live, { ...live, diagnostics: { ...live.diagnostics, stable: false } })).toBe(false);
  expect(acceptSnapshot(live, { ...live, generatedAt: "bad date" })).toBe(false);
  expect(acceptSnapshot(baseline, live)).toBe(true);
  const failed = { ...baseline, changeReason: "acquisition_failed" as const, freshness: { ...baseline.freshness, lastAttemptAt: "2026-10-27T21:02:00Z" } };
  const retained = mergeSnapshot(live, failed)!;
  expect(retained.mode).toBe("exit");
  expect(retained.generatedAt).toBe(live.generatedAt);
  expect(retained.freshness.lastAttemptAt).toBe(failed.freshness.lastAttemptAt);
  expect(retained.freshness.status).toBe("stale");
});

it("shows unknown, stale and refresh failures without inventing input data", () => {
  const props = { lang: "en" as const, ...forecastPresentation("en") };
  const unknown = renderToStaticMarkup(createElement(ForecastDisplay, { ...props, initial: null }));
  expect(unknown).toContain(LIVE_FORECAST.en.unknown);
  const initial = getBaselineSnapshot();
  initial.freshness.status = "stale";
  const stale = renderToStaticMarkup(createElement(ForecastDisplay, { ...props, initial, refreshError: true }));
  expect(stale).toContain(LIVE_FORECAST.en.paused);
  expect(stale).toContain(LIVE_FORECAST.en.error);
  expect(stale).toContain(initial.generatedAt);
});

it("ranks active threshold uncertainty and suppresses unsupported conditional comparisons", () => {
  const initial = getBaselineSnapshot();
  const row = initial.thresholds[0];
  initial.thresholds = [{ ...row, id: "raam", score: .3, passProbability: .4, sufficientSupport: false }, { ...row, id: "rz", score: .8, passProbability: .5 }, { ...row, id: "likud", score: 2, passProbability: .999 }];
  expect(primaryThresholds(initial).map((risk) => risk.id)).toEqual(["rz", "raam"]);
  const html = renderToStaticMarkup(createElement(ForecastDisplay, { initial, lang: "en", ...forecastPresentation("en") }));
  expect(html).toContain(LIVE_FORECAST.en.insufficient);
  expect(html).toContain(LIVE_FORECAST.en.secondary);
});

it("renders only actual history points, with a matching accessible table", () => {
  const initial = getBaselineSnapshot();
  const point = { generatedAt: initial.generatedAt, revision: initial.revision, mode: initial.mode, arrangements: initial.arrangements.map(({ id, probability }) => ({ id, probability })) };
  initial.history = [point, { ...point, generatedAt: "2026-10-27T21:00:00Z", revision: "next", arrangements: point.arrangements.map((row) => ({ ...row, probability: .4 })) }];
  const html = renderToStaticMarkup(createElement(ForecastDisplay, { initial, lang: "en", ...forecastPresentation("en") }));
  expect(html).toContain("polyline");
  expect(html).toContain("2026-10-27T21:00:00Z");
  expect(html).toContain("40%");
  expect(html).toContain("<caption>");
});

it("archives the election forecast after its window even before official seats publish",async()=>{vi.useFakeTimers();vi.setSystemTime(new Date("2026-11-03T00:01:00Z"));vi.stubEnv("LIVE_FORECAST_ENABLED","true");vi.stubEnv("ELECTION_LIFECYCLE_ENABLED","false");const view=await LiveForecast({lang:"en"});expect(view?.type).toBe("details");const html=renderToStaticMarkup(view);expect(html).toContain("Saved campaign forecast");expect(html).toContain("lf-history");expect(html).not.toContain("Published election result");});
