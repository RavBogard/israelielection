import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGS, isRtl } from "@/lib/i18n";
import { LIVE_FORECAST } from "@/lib/i18n/live-forecast";
import { DASHBOARD } from "@/lib/i18n/election-dashboard";
import { getBaselineSnapshot } from "@/lib/live-forecast/server";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { ForecastDisplay } from "./ForecastClient";
import LiveForecast, { forecastPresentation } from "./LiveForecast";
import {
  acceptSnapshot,
  exactBlocs,
  mergeSnapshot,
  numericHistorySegments,
  primaryThresholds,
  probability,
} from "./presentation";
const official: SharedSeatContext = {
  schemaVersion: 1,
  election: "2026-10-27",
  revision: "a".repeat(64),
  snapshotRevision: "b".repeat(64),
  sequence: 3,
  updatedAt: "2026-10-29T12:00:00Z",
  evidenceStage: "official",
  basis: "official_seats",
  seatStatus: "official",
  pointMethod: "published_official_allocation",
  pointSeats: { likud: 55, yashar: 55, new: 10 },
  parties: [
    { id: "likud", label:"Likud", profiled: true },
    { id: "yashar", label:"Yashar", profiled: true },
    { id: "new", label: "New list", profiled: false },
  ],
  sourceRefs: [],
  publishedAt: "2026-10-29",
  observedAt: "2026-10-29T12:00:00Z",
  correctionOf: null,
  freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
  reasonCodes: [],
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe.each(LANGS)("%s public election dashboard", (lang) => {
  it("renders three data questions with numeric ranges and no coalition odds", () => {
    const t = LIVE_FORECAST[lang],
      d = DASHBOARD[lang],
      html = renderToStaticMarkup(
        createElement(ForecastDisplay, {
          initial: getBaselineSnapshot(),
          lang,
          ...forecastPresentation(lang),
        }),
      );
    for (const question of [t.ahead, d.blocs, d.thresholds])
      expect(html).toContain(question);
    expect(html.match(/class="lf-question"/g) ?? []).toHaveLength(3);
    expect(html).toContain(`dir="${isRtl(lang) ? "rtl" : "ltr"}"`);
    for (const text of [
      t.pm,
      t.interval,
      d.marginal,
      d.all,
      t.dataTable,
      t.provisionalPrior,
    ])
      expect(html).toContain(text);
    expect(html).not.toContain(t.paths);
    expect(html).not.toContain(t.conditional);
    expect(html).not.toContain(t.association);
    expect(html).not.toContain("poll=forecast");
    expect(html).not.toContain("lf-impact");
    expect(html).not.toContain("NaN");
  });
  it("replaces uncertainty with exact official winners/blocs and watched outcomes", () => {
    const props = forecastPresentation(lang),
      html = renderToStaticMarkup(
        createElement(ForecastDisplay, {
          initial: getBaselineSnapshot(),
          context: official,
          lang,
          ...props,
        }),
      );
    expect(html).toContain(DASHBOARD[lang].winners);
    expect(html).toContain(DASHBOARD[lang].watched);
    expect(html).not.toContain(props.text.aheadChance);
    expect(html).not.toContain('class="lf-margin"');
    expect(
      exactBlocs(official, props.names).reduce(
        (n, row) => n + row.seats.median,
        0,
      ),
    ).toBe(120);
    expect(
      exactBlocs(official, props.names).find((row) => row.id === "other")?.seats
        .median,
    ).toBe(10);
  });
});
it("keeps the feature off unless explicitly enabled", async () => {
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
  vi.stubEnv("LIVE_FORECAST_ENABLED", "false");
  expect(await LiveForecast({ lang: "en" })).toBeNull();
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  expect(await LiveForecast({ lang: "en" })).not.toBeNull();
});
it("uses whole percentages without claiming certainty", () => {
  expect(
    [0, 0.001, 0.01, 0.573, 0.99, 0.999, 1, NaN, -1].map(probability),
  ).toEqual(["<1%", "<1%", "1%", "57%", "99%", ">99%", ">99%", "—", "—"]);
});
it("retains the last good forecast across out-of-order and failed baseline responses", () => {
  const baseline = getBaselineSnapshot(),
    live = {
      ...baseline,
      generatedAt: "2026-10-27T21:00:00Z",
      mode: "exit" as const,
    };
  expect(acceptSnapshot(live, baseline)).toBe(false);
  expect(
    acceptSnapshot(live, {
      ...live,
      diagnostics: { ...live.diagnostics, stable: false },
    }),
  ).toBe(false);
  const failed = {
      ...baseline,
      changeReason: "acquisition_failed" as const,
      freshness: {
        ...baseline.freshness,
        lastAttemptAt: "2026-10-27T21:02:00Z",
      },
    },
    retained = mergeSnapshot(live, failed)!;
  expect(retained.mode).toBe("exit");
  expect(retained.generatedAt).toBe(live.generatedAt);
  expect(retained.freshness.status).toBe("stale");
});
it("shows unknown and failed refresh states while retaining numeric evidence", () => {
  const props = { lang: "en" as const, ...forecastPresentation("en") };
  expect(
    renderToStaticMarkup(
      createElement(ForecastDisplay, { ...props, initial: null }),
    ),
  ).toContain(LIVE_FORECAST.en.unknown);
  const initial = getBaselineSnapshot();
  initial.freshness.status = "stale";
  const html = renderToStaticMarkup(
    createElement(ForecastDisplay, { ...props, initial, refreshError: true }),
  );
  expect(html).toContain(LIVE_FORECAST.en.error);
  expect(html).toContain(initial.generatedAt);
});
it("ranks exactly three closest-to50 risks with deterministic ID ties and no health reshuffle", () => {
  const initial = getBaselineSnapshot(),
    row = initial.thresholds[0];
  initial.thresholds = [
    { ...row, id: "z", passProbability: 0.5 },
    { ...row, id: "a", passProbability: 0.5 },
    { ...row, id: "b", passProbability: 0.4 },
    { ...row, id: "c", passProbability: 0.999 },
  ];
  expect(
    primaryThresholds(initial)
      .slice(0, 3)
      .map((r) => r.id),
  ).toEqual(["a", "z", "b"]);
  const later = {
    ...initial,
    generatedAt: "2026-10-29T23:00:00Z",
    freshness: { ...initial.freshness, status: "stale" as const },
  };
  expect(primaryThresholds(later).map((r) => r.id)).toEqual(
    primaryThresholds(initial).map((r) => r.id),
  );
  const html = renderToStaticMarkup(
    createElement(ForecastDisplay, {
      initial,
      lang: "en",
      compact: true,
      ...forecastPresentation("en"),
    }),
  );
  expect(html.match(/data-threshold-id=/g) ?? []).toHaveLength(3);
  expect(html).toContain("#lf-all-thresholds");
  expect(html).not.toContain("lf-impact");
});
it("plots only recorded numeric history and leaves old missing data absent", () => {
  const initial = getBaselineSnapshot(),
    blocs = initial.blocSeats ?? [
      { id: "net" as const, seats: { lo: 49, median: 53, hi: 57 } },
    ],
    point = {
      generatedAt: initial.generatedAt,
      revision: "old",
      mode: initial.mode,
      arrangements: [],
    };
  initial.history = [
    point,
    { ...point, revision: "numeric1", blocSeats: blocs },
    {
      ...point,
      revision: "numeric2",
      generatedAt: "2026-10-27T21:00:00Z",
      blocSeats: blocs,
    },
  ];
  const html = renderToStaticMarkup(
    createElement(ForecastDisplay, {
      initial,
      lang: "en",
      ...forecastPresentation("en"),
    }),
  );
  expect(html).toContain("polyline");
  expect(html).toContain(DASHBOARD.en.numericMissing);
  expect(html).toContain(DASHBOARD.en.historyCaption);
 expect(html).toContain(DASHBOARD.en.largestHistory);expect(html).toContain(DASHBOARD.en.thresholdHistory);
 expect(numericHistorySegments([initial.history[1],point,initial.history[2]],"net").map(segment=>segment.length)).toEqual([1,1]);
  expect(html).not.toContain("Chance initial vote passes");
  expect(html).toContain("—");
});
it("archives after the election window without calling preofficial estimates final", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-03T00:01:00Z"));
  vi.stubEnv("LIVE_FORECAST_ENABLED", "true");
  vi.stubEnv("ELECTION_LIFECYCLE_ENABLED", "false");
  const view = await LiveForecast({ lang: "en" }),
    html = renderToStaticMarkup(view);
  expect(html).toContain(DASHBOARD.en.archive);
  expect(html).toContain("lf-history");
  expect(html).not.toContain(DASHBOARD.en.officialHero);
});

it("keeps known between-bloc lists separate from unknown elected lists",()=>{const rows=exactBlocs({...official,pointSeats:{likud:50,yashar:50,res:5,new:15}},forecastPresentation("en").names);expect(rows.find(row=>row.id==="mid")?.seats.median).toBe(5);expect(rows.find(row=>row.id==="other")?.seats.median).toBe(15);expect(rows.reduce((n,row)=>n+row.seats.median,0)).toBe(120);});
