import forecastJson from "@/data/forecast.json";
import type { Poll } from "./types";

/** data/forecast.json: the output of scripts/forecast/forecast.mjs, committed before the vote and scored after it. */
export type Forecast = {
  generated: string;
  generatedAt?: string;
  /** The run the prediction is scored against; once true, the script refuses to regenerate. */
  final?: boolean;
  election: string;
  runs: number;
  seed: number;
  method: string;
  inputs: { field: { id: string; pollster: string; firm?: string | null; published: string; n: number | null; weight?: number }[]; checks: { id: string; pollster: string; published: string }[]; agreements: string[][]; withdrawn?: string[] };
  /** scripts/forecast/model.mjs DEFAULTS, as run (version 2 from 2026-10-24; version 3 adds the swing, blocPoint and sectorTurnout fields). */
  parameters: { version?: number; windowDays?: number; fieldOnly: boolean; firmWeights?: boolean; sharesMethod?: string; unprintedBelowShare?: number; listPriors?: Record<string, number | string>; sectorTurnout?: { name: string; lists: string[]; logShift: number; alphaPts: number; sdLog: number }[]; leanSeats: number; leanNetOfShas?: boolean; historicalResidualSeats: number; swing?: string; swingScaleSeats?: number | null; swingDf?: number | null; blocSdSeats: number | null; blocPoint?: string; listSdPointsAt8pct: number; listSdFloorPoints?: number; zeroSumWithinBloc?: boolean; arabSwingSdSeats?: number; consolidateSdSeats: number; fringeShare?: number; pointRule?: string };
  /** `point` is scored: version 3 the median of the bloc's simulated total (version 2: the sum of its list points); `listSum` the sum of the list points, `median` the median, both reported. */
  blocs: Record<"net" | "opp" | "mid" | "arab", { point: number; listSum?: number; median?: number; mean: number; lo: number; hi: number }>;
  /** Share of runs, in whole percent: the Netanyahu bloc at 61+, the anti-Netanyahu Zionist bloc at 61+, neither. */
  majority: { net: number; oppZionist: number; neither: number; oppWithArabAndMid: number };
  netLargerThanOpp: number;
  largestList: Record<string, number>;
  /** `prior`: the list's class prior in vote-share points; `call`: passes >= 50, the threshold call that is scored. */
  lists: Record<string, { share: number; prior?: number; point: number; mean: number; lo: number; hi: number; passes: number; call?: boolean }>;
  scoring: string;
};

export const forecast = forecastJson as Forecast;
export const FORECAST_ID = "forecast";

/**
 * The forecast's central seats as a pseudo-poll, so the polls page and the Coalition Builder can count
 * with it beside the two averages. Whole seats that add to 120 (the allocation of the central vote
 * shares); a list the central allocation leaves under the threshold is marked below.
 */
export const forecastPoll: Poll = {
  id: FORECAST_ID,
  pollster: "Forecast",
  firm: null,
  fieldwork: null,
  published: forecast.generated,
  via: null,
  url: null,
  n: null,
  margin: null,
  note: `Central seats of the site's forecast model (${forecast.runs.toLocaleString("en")} simulated elections over ${forecast.inputs.field.length} polls), generated ${forecast.generated}.`,
  results: Object.fromEntries(Object.entries(forecast.lists).map(([id, l]) => [id, l.point === 0 ? { seats: 0, belowThreshold: true } : { seats: l.point }])),
  combined: [],
};
