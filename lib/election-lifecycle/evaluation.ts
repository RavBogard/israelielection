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
