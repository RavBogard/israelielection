import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/forecast", useRouter: () => ({ refresh() {} }) }));
import "@/lib/i18n/ar/register";
import "@/lib/i18n/fa/register";
import "@/lib/i18n/de/register";
import "@/lib/i18n/fr/register";
import "@/lib/i18n/zh/register";
import ForecastScorecard, { scorecardFor } from "./ForecastScorecard";
import { ForecastScoreNoteView } from "./ForecastScoreNote";
import { ThresholdVotesLine, thresholdVotes } from "@/components/glossary/ThresholdVotes";
import { forecastScorecard } from "@/lib/election-lifecycle/evaluation";
import { forecast } from "@/lib/forecast";
import { LANGS } from "@/lib/i18n";
import { SCORECARD } from "@/lib/i18n/scorecard";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";

const SEATS = { likud: 27, yashar: 21, byachad: 13, jl: 11, dem: 9, yb: 8, otzma: 6, raam: 7, shas: 6, utj: 6, rz: 6 };
const context = (over: Partial<SharedSeatContext> = {}): SharedSeatContext =>
  ({
    schemaVersion: 1,
    election: "fixture",
    revision: "rev-official",
    snapshotRevision: "rev-official",
    sequence: 9,
    updatedAt: "2026-11-04T10:00:00Z",
    pointSeats: SEATS,
    parties: [],
    sourceRefs: [],
    publishedAt: "2026-11-04T10:00:00Z",
    observedAt: "2026-11-04T10:00:00Z",
    correctionOf: null,
    basis: "official_seats",
    pointMethod: "published_official_allocation",
    seatStatus: "official",
    evidenceStage: "official",
    freshness: { status: "complete", checkedAt: null, lastAttemptAt: null },
    reasonCodes: [],
    statutoryPublication: { publishedOn: "2026-11-04" },
    ...over,
  }) as SharedSeatContext;
const provisional = context({ seatStatus: "provisional", basis: "partial_count" as SharedSeatContext["basis"], evidenceStage: "count" as SharedSeatContext["evidenceStage"], statutoryPublication: undefined });
const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("forecast scorecard", () => {
  it("is hidden until the seats are official", () => {
    expect(scorecardFor(null)).toBeNull();
    expect(scorecardFor(provisional)).toBeNull();
    for (const lang of LANGS) {
      expect(render(createElement(ForecastScorecard, { context: provisional, lang }))).toBe("");
      expect(render(createElement(ForecastScoreNoteView, { context: provisional, lang }))).toBe("");
    }
  });

  it("refuses a forecast that was never locked", () => {
    expect(forecastScorecard(context(), { forecast: { ...forecast, final: false }, averages: [], exits: [], apartPollsters: [] })).toBeNull();
  });

  it("scores the locked forecast and states the largest-list miss", () => {
    const s = scorecardFor(context())!;
    expect(s.forecastGeneratedAt).toBe(forecast.generatedAt);
    expect(s.largest).toMatchObject({ called: "yashar", chance: 57, actual: ["likud"], right: false });
    expect(s.lists.find((l) => l.id === "likud")).toMatchObject({ point: 21, actual: 27, error: -6, inside: false });
    expect(s.blocs.reduce((n, b) => n + b.actual, 0)).toBe(120);
    expect(s.rows.map((r) => r.kind).slice(0, 3)).toEqual(["forecast", "average", "average_without_checks"]);
    expect(s.rows.some((r) => r.kind === "exit" && r.apart)).toBe(true);
    expect(s.rows.filter((r) => r.kind === "exit" && !r.apart).length).toBeGreaterThan(0);
  });

  it("shows the scorecard and the about note once official, in every edition", () => {
    for (const lang of LANGS) {
      const html = render(createElement(ForecastScorecard, { context: context(), lang }));
      for (const id of ["forecast-scorecard", "scorecard-grid-forecast", "scorecard-grid-official", "scorecard-largest", "scorecard-lists", "scorecard-blocs", "scorecard-compare", "scorecard-apart", "scorecard-row-exit"]) expect(html).toContain(`data-testid="${id}"`);
      expect(html).toContain('id="scorecard"');
      const note = render(createElement(ForecastScoreNoteView, { context: context(), lang }));
      expect(note).toContain('data-testid="about-forecast-note"');
      expect(note).toContain("#scorecard");
    }
  });

  it("has every string in all seven editions", () => {
    const keys = Object.keys(SCORECARD.en).sort();
    for (const lang of LANGS) expect(Object.keys(SCORECARD[lang]).sort()).toEqual(keys);
  });
});

describe("glossary threshold in votes", () => {
  it("is 3.25% of valid votes, rounded up", () => {
    expect(thresholdVotes(4_000_000)).toBe(130_000);
    expect(thresholdVotes(1001)).toBe(33);
    expect(thresholdVotes(0)).toBeNull();
    expect(thresholdVotes(null)).toBeNull();
  });

  it("renders nothing without a figure, and marks provisional and official figures", () => {
    expect(render(createElement(ThresholdVotesLine, { value: null, lang: "en" }))).toBe("");
    for (const lang of LANGS) {
      expect(render(createElement(ThresholdVotesLine, { value: { votes: 150000, official: false }, lang }))).toContain('data-official="false"');
      expect(render(createElement(ThresholdVotesLine, { value: { votes: 150000, official: true }, lang }))).toContain('data-official="true"');
    }
  });
});
