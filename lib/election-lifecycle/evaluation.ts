import campaign from "../../data/election-lifecycle-campaign.json";
import { fingerprint } from "./core";
import type { SharedSeatContext } from "./types";
export type Evaluation = {
  officialRevision: string;
  predictionRevision: string;
  label: "forecast" | "forecast_v2" | "average" | "average_without_checks";
  registration: "registered" | "provisional";
  generatedAt: string;
  listMae: number;
  listErrors: Record<string, number>;
  thresholdCorrect: number;
  thresholdTotal: number;
  unexpectedElected: { id: string; seats: number }[];
  fullParliamentMae: number;
  majority: {
    predicted: string[];
    actual: string;
    correct: boolean;
    probabilityOfActual: number;
  } | null;
  blocs: Record<
    string,
    {
      actual: number;
      listSum: number;
      listSumError: number;
      point: number | null;
      pointError: number | null;
    }
  >;
};
type Meta = {
  label: Evaluation["label"];
  registration: Evaluation["registration"];
  generatedAt: string;
  predictionRevision: string;
  blocPoints?: Record<string, number>;
  thresholdCalls?: Record<string, boolean>;
  majority?: { net: number; oppZionist: number; neither: number };
  partyBlocs?: Record<string, string>;
};
export function evaluateSeats(
  predicted: Record<string, number>,
  actual: SharedSeatContext,
  meta: Meta,
): Evaluation {
  if (actual.seatStatus !== "official" || actual.basis !== "official_seats")
    throw new Error("official_result_required");
  const ids = Object.keys(predicted),
    allIds = [...new Set([...ids, ...Object.keys(actual.pointSeats)])];
  const errors = Object.fromEntries(
    ids.map((id) => [id, predicted[id] - (actual.pointSeats[id] ?? 0)]),
  );
  const partyBlocs =
    meta.partyBlocs ?? (campaign.partyBlocs as Record<string, string>);
  const blocs = Object.fromEntries(
    ["net", "opp", "mid", "arab"].map((bloc) => {
      const members = Object.keys(partyBlocs).filter(
          (id) => partyBlocs[id] === bloc,
        ),
        result = members.reduce((n, id) => n + (actual.pointSeats[id] ?? 0), 0),
        listSum = members.reduce((n, id) => n + (predicted[id] ?? 0), 0),
        point = meta.blocPoints?.[bloc] ?? null;
      return [
        bloc,
        {
          actual: result,
          listSum,
          listSumError: listSum - result,
          point,
          pointError: point == null ? null : point - result,
        },
      ];
    }),
  );
  const actualOutcome =
    blocs.net.actual >= 61
      ? "net"
      : blocs.opp.actual >= 61
        ? "oppZionist"
        : "neither";
  const maximum = meta.majority
    ? Math.max(
        meta.majority.net,
        meta.majority.oppZionist,
        meta.majority.neither,
      )
    : 0;
  const majority = meta.majority
    ? {
        predicted: Object.entries(meta.majority)
          .filter(([, p]) => p === maximum)
          .map(([id]) => id),
        actual: actualOutcome,
        correct:
          (meta.majority as Record<string, number>)[actualOutcome] === maximum,
        probabilityOfActual:
          (meta.majority as Record<string, number>)[actualOutcome] / 100,
      }
    : null;
  return {
    officialRevision: actual.revision,
    predictionRevision: meta.predictionRevision,
    label: meta.label,
    registration: meta.registration,
    generatedAt: meta.generatedAt,
    listMae:
      Object.values(errors).reduce((n, e) => n + Math.abs(e), 0) / ids.length,
    listErrors: errors,
    thresholdCorrect: ids.filter(
      (id) =>
        (meta.thresholdCalls?.[id] ?? predicted[id] > 0) ===
        (actual.pointSeats[id] ?? 0) > 0,
    ).length,
    thresholdTotal: ids.length,
    unexpectedElected: Object.entries(actual.pointSeats)
      .filter(([id, n]) => !(id in predicted) && n > 0)
      .map(([id, seats]) => ({ id, seats })),
    fullParliamentMae:
      allIds.reduce(
        (n, id) =>
          n + Math.abs((predicted[id] ?? 0) - (actual.pointSeats[id] ?? 0)),
        0,
      ) / allIds.length,
    majority,
    blocs,
  };
}
export function evaluationsFor(actual: SharedSeatContext): Evaluation[] {
  const result: Evaluation[] = [];
  for (const [label, f] of [
    ["forecast", campaign.forecast],
    ["forecast_v2", campaign.v2],
  ] as const) {
    result.push(
      evaluateSeats(
        Object.fromEntries(
          Object.entries(f.lists).map(([id, l]) => [id, l.point]),
        ),
        actual,
        {
          label,
          registration: f.final ? "registered" : "provisional",
          generatedAt: f.generatedAt,
          predictionRevision: fingerprint(f),
          blocPoints: Object.fromEntries(
            Object.entries(f.blocs).map(([id, b]) => [id, b.point]),
          ),
          thresholdCalls: Object.fromEntries(
            Object.entries(f.lists).map(([id, l]) => [
              id,
              (l as { call?: boolean }).call ?? l.passes >= 50,
            ]),
          ),
          majority: f.majority,
          partyBlocs: campaign.partyBlocs,
        },
      ),
    );
  }
  for (const item of campaign.averages) {
    const poll = item.poll;
    result.push(
      evaluateSeats(
        Object.fromEntries(
          Object.entries(poll.results).map(([id, r]) => [id, r.seats]),
        ),
        actual,
        {
          label: item.label as Evaluation["label"],
          registration: "provisional",
          generatedAt: poll.published,
          predictionRevision: fingerprint(item),
          partyBlocs: campaign.partyBlocs,
        },
      ),
    );
  }
  return result;
}

/**
 * The forecast scorecard (Daniel, 2026-10-28): the locked pre-election forecast (data/forecast.json, final:true)
 * against the official seats, beside the final poll averages and each broadcaster's last exit poll. Null until the
 * shared seat context is official, so nothing built on it can show early, and null if the forecast was never locked.
 */
type Bloc = "net" | "opp" | "mid" | "arab";
const SCORE_BLOCS: readonly Bloc[] = ["net", "opp", "mid", "arab"];
type SeatsLike = { seats: number; belowThreshold?: boolean };
export type LockedForecast = {
  generatedAt?: string;
  generated: string;
  final?: boolean;
  blocs: Record<Bloc, { point: number; listSum?: number; lo: number; hi: number }>;
  largestList: Record<string, number>;
  lists: Record<string, { point: number; lo: number; hi: number; passes: number; call?: boolean }>;
};
export type ScoredPrediction = {
  kind: "forecast" | "average" | "average_without_checks" | "exit";
  id: string;
  pollster: string | null;
  /** Channel 14 and i24NEWS: shown apart, never part of the forecast or the averages. */
  apart: boolean;
  published: string;
  listMae: number;
  blocErrors: Record<Bloc, number>;
  thresholdCorrect: number;
  thresholdTotal: number;
  largest: string[];
  largestRight: boolean;
};
export type ScoredList = { id: string; bloc: string | null; point: number; lo: number; hi: number; actual: number; error: number; inside: boolean; call: boolean; passed: boolean; callRight: boolean };
export type ScoredBloc = { id: Bloc; point: number; lo: number; hi: number; actual: number; error: number; inside: boolean };
export type ForecastScorecard = {
  officialRevision: string;
  certifiedOn: string;
  forecastGeneratedAt: string;
  lists: ScoredList[];
  blocs: ScoredBloc[];
  coverage: { lists: { inside: number; total: number }; blocs: { inside: number; total: number } };
  threshold: { correct: number; total: number; missed: string[] };
  largest: { called: string; chance: number; actual: string[]; right: boolean };
  rows: ScoredPrediction[];
};
const leaders = (seats: Record<string, number>) => {
  const top = Math.max(0, ...Object.values(seats));
  return top > 0 ? Object.keys(seats).filter((id) => seats[id] === top).sort() : [];
};
export function forecastScorecard(
  actual: SharedSeatContext | null,
  inputs: {
    forecast: LockedForecast;
    averages: { kind: "average" | "average_without_checks"; id: string; published: string; results: Record<string, SeatsLike> }[];
    exits: { id: string; pollster: string; published: string; broadcastAt?: string; results: Record<string, SeatsLike> }[];
    apartPollsters: readonly string[];
    partyBlocs?: Record<string, string>;
  },
): ForecastScorecard | null {
  if (!actual || actual.seatStatus !== "official" || actual.basis !== "official_seats") return null;
  const f = inputs.forecast;
  if (!f.final) return null;
  const partyBlocs = inputs.partyBlocs ?? (campaign.partyBlocs as Record<string, string>);
  const blocOf = (id: string) => partyBlocs[id] ?? actual.parties.find((p) => p.id === id)?.bloc ?? null;
  const seatsOf = (id: string) => actual.pointSeats[id] ?? 0;
  const ids = [...new Set([...Object.keys(f.lists), ...Object.keys(actual.pointSeats).filter((id) => seatsOf(id) > 0)])];
  const lists: ScoredList[] = ids.map((id) => {
    const l = f.lists[id] ?? { point: 0, lo: 0, hi: 0, passes: 0, call: false };
    const a = seatsOf(id), call = l.call ?? l.passes >= 50, passed = a > 0;
    return { id, bloc: blocOf(id), point: l.point, lo: l.lo, hi: l.hi, actual: a, error: l.point - a, inside: a >= l.lo && a <= l.hi, call, passed, callRight: call === passed };
  });
  const blocActual = (b: Bloc) => ids.filter((id) => blocOf(id) === b).reduce((n, id) => n + seatsOf(id), 0);
  const blocs: ScoredBloc[] = SCORE_BLOCS.map((id) => {
    const b = f.blocs[id], point = b.listSum ?? b.point, a = blocActual(id);
    return { id, point, lo: b.lo, hi: b.hi, actual: a, error: point - a, inside: a >= b.lo && a <= b.hi };
  });
  const actualLeaders = leaders(Object.fromEntries(ids.map((id) => [id, seatsOf(id)])));
  const [called, chance] = Object.entries(f.largestList).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  const score = (
    kind: ScoredPrediction["kind"],
    id: string,
    pollster: string | null,
    published: string,
    seats: Record<string, number>,
    passes: (id: string) => boolean,
  ): ScoredPrediction => {
    const largest = leaders(seats);
    return {
      kind, id, pollster, published,
      apart: pollster != null && inputs.apartPollsters.includes(pollster),
      listMae: ids.reduce((n, x) => n + Math.abs((seats[x] ?? 0) - seatsOf(x)), 0) / ids.length,
      blocErrors: Object.fromEntries(SCORE_BLOCS.map((b) => [b, ids.filter((x) => blocOf(x) === b).reduce((n, x) => n + (seats[x] ?? 0), 0) - blocActual(b)])) as Record<Bloc, number>,
      thresholdCorrect: ids.filter((x) => passes(x) === seatsOf(x) > 0).length,
      thresholdTotal: ids.length,
      largest,
      largestRight: largest.length > 0 && largest.every((x) => actualLeaders.includes(x)),
    };
  };
  const pollSeats = (r: Record<string, SeatsLike>) => Object.fromEntries(Object.entries(r).map(([id, x]) => [id, x.seats]));
  const pollPasses = (r: Record<string, SeatsLike>) => (id: string) => (r[id]?.seats ?? 0) > 0 && !r[id]?.belowThreshold;
  const rows: ScoredPrediction[] = [
    score("forecast", "forecast", null, f.generatedAt ?? f.generated, Object.fromEntries(lists.map((l) => [l.id, l.point])), (id) => lists.find((l) => l.id === id)!.call),
    ...inputs.averages.map((a) => score(a.kind, a.id, null, a.published, pollSeats(a.results), pollPasses(a.results))),
    ...inputs.exits.map((e) => score("exit", e.id, e.pollster, e.broadcastAt ?? e.published, pollSeats(e.results), pollPasses(e.results))),
  ];
  return {
    officialRevision: actual.revision,
    certifiedOn: actual.statutoryPublication?.publishedOn ?? (actual.publishedAt ?? actual.observedAt).slice(0, 10),
    forecastGeneratedAt: f.generatedAt ?? f.generated,
    lists,
    blocs,
    coverage: {
      lists: { inside: lists.filter((l) => l.inside).length, total: lists.length },
      blocs: { inside: blocs.filter((b) => b.inside).length, total: blocs.length },
    },
    threshold: { correct: lists.filter((l) => l.callRight).length, total: lists.length, missed: lists.filter((l) => !l.callRight).map((l) => l.id) },
    largest: { called, chance, actual: actualLeaders, right: actualLeaders.includes(called) },
    rows,
  };
}
