import { createHash } from "node:crypto";
import { forecast } from "../../scripts/forecast/model.mjs";
import frozen from "../../data/live-forecast-prior.json";
const { pollFile, partyFile, results, calibration } = frozen.inputs;
import scenarios from "../../data/coalition-scenarios.json";
import exitCalibrationFile from "../../data/exit-poll-calibration.json";
import type { Poll } from "../types";
import type { Interval, LiveForecastSnapshot, LiveSource } from "./types";

export const MODEL_VERSION = "live-v3-joint-blocs";
/** Bump on any change to model code: it enters the input revision, so the next cycle recomputes even when no
 * source changed. MODEL_VERSION stays, since stored snapshots are checked against the committed fallback's version. */
export const MODEL_CODE_REVISION = "2026-10-27.3-grid-spare-seats";

export type ExitCalibration = {
  elections: { date: string; field: number; result: number }[];
  partyMeanAbsSeats: number;
  shrinkagePseudoElections: number;
};
/** The exit-poll likelihood, fitted to the record of TV exit polls against results (docs/research/exit-polls,
 * derived by scripts/live-forecast/exit-history.mjs). The averaged main-channel exit polls missed the Netanyahu
 * bloc by a mean of about +0.6 seats over six elections (three under, three over) with a spread of about two
 * seats, so the lean is that mean shrunk toward zero by a no-bias prior worth `shrinkagePseudoElections`
 * elections, and the swing's scale and degrees of freedom come from the same record through the campaign
 * model's Student-t rule (resid × √(1 + 1/n), max(3, n − 1) df) with every election weighted equally. */
export function exitLikelihood(cal: ExitCalibration = exitCalibrationFile) {
  const misses = cal.elections.map((e) => e.result - e.field);
  const n = misses.length;
  if (!n || !Number.isFinite(cal.partyMeanAbsSeats) || cal.partyMeanAbsSeats <= 0)
    throw new Error("Exit-poll calibration record is empty or malformed");
  const meanMiss = misses.reduce((a, b) => a + b, 0) / n;
  const lean = (meanMiss * n) / (n + Math.max(0, cal.shrinkagePseudoElections));
  const resid = Math.sqrt(misses.reduce((s, x) => s + (x - meanMiss) ** 2, 0) / n);
  return {
    elections: cal.elections.map((e) => ({ ...e, shasError: 0 })),
    n,
    meanMiss,
    lean,
    resid,
    partyMeanAbsSeats: cal.partyMeanAbsSeats,
  };
}
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, x]) => [k, canonical(x)]),
        )
      : v;
export const hash = (value: unknown) =>
  createHash("sha256")
    .update(
      typeof value === "string" ? value : JSON.stringify(canonical(value)),
    )
    .digest("hex");
export const SCENARIO_VERSION = hash(scenarios.scenarios).slice(0, 16);
export const modelRevision = (exits: Poll[]) =>
  hash({
    prior: frozen.sha256,
    inputs: frozen.inputSha256,
    model: MODEL_VERSION,
    code: MODEL_CODE_REVISION,
    exitCalibration: hash(exitCalibrationFile),
    scenarios: SCENARIO_VERSION,
    exits: exits
      .map((p) => ({
        publisher: p.pollster,
        results: p.results,
        combined: p.combined,
      }))
      .sort((a, b) => a.publisher.localeCompare(b.publisher)),
  });
export type Draws = Record<string, ArrayLike<number>>;
const interval = (values: number[]): Interval => {
  const a = values.toSorted((x, y) => x - y);
  return {
    lo: a[Math.floor(a.length * 0.1)],
    median: a[Math.floor(a.length * 0.5)],
    hi: a[Math.min(a.length - 1, Math.floor(a.length * 0.9))],
  };
};
// Jeffreys smoothing avoids asserting certainty from a finite simulation, without altering exhaustive categories.
const probability = (n: number, total: number) => (n + 0.5) / (total + 1);

export function summarizeDraws(seats: Draws, blocs: Draws) {
  const ids = Object.keys(seats),
    n = seats[ids[0]]?.length ?? 0;
  if (!n || ids.some((id) => seats[id].length !== n))
    throw new Error("Missing or unequal joint draws");
  const first: Record<string, number> = Object.fromEntries(
    [...ids, "tie"].map((id) => [id, 0]),
  );
  const lead = { net: 0, opp: 0, tie: 0 };
  const yes = scenarios.scenarios.map(() => [] as number[]),
    no = scenarios.scenarios.map(() => [] as number[]);
  const success = scenarios.scenarios.map(() => [] as number[]);
  for (let i = 0; i < n; i++) {
    if (
      ids.some((id) => !Number.isInteger(seats[id][i]) || seats[id][i] < 0) ||
      ids.reduce((s, id) => s + seats[id][i], 0) !== 120
    )
      throw new Error("Invalid 120-seat joint draw");
    const max = Math.max(...ids.map((id) => seats[id][i])),
      winners = ids.filter((id) => seats[id][i] === max);
    first[winners.length === 1 ? winners[0] : "tie"]++;
    lead[
      blocs.net[i] > blocs.opp[i]
        ? "net"
        : blocs.net[i] < blocs.opp[i]
          ? "opp"
          : "tie"
    ]++;
    scenarios.scenarios.forEach((s, k) => {
      const roles = new Set([...s.cabinet, ...s.support, ...s.abstain]);
      const y = [...s.cabinet, ...s.support].reduce(
        (v, id) => v + (seats[id]?.[i] ?? 0),
        0,
      );
      const o = ids
        .filter((id) => !roles.has(id))
        .reduce((v, id) => v + seats[id][i], 0);
      yes[k].push(y);
      no[k].push(o);
      success[k].push(y > o ? 1 : 0);
    });
  }
  const categorical = (counts: Record<string, number>) =>
    Object.entries(counts).map(([id, count]) => ({
      id,
      probability: count / n,
    }));
  const arrangements = scenarios.scenarios.map((s, k) => {
    const p = probability(
      success[k].reduce((a, b) => a + b, 0),
      n,
    );
    return {
      id: s.id,
      probability: p,
      mcError: Math.sqrt((p * (1 - p)) / n),
      yes: interval(yes[k]),
      no: interval(no[k]),
      margin: interval(yes[k].map((v, i) => v - no[k][i])),
    };
  });
  const thresholds = ids
    .map((id) => {
      const pass = Array.from({ length: n }, (_, i) => seats[id][i] > 0),
        passes = pass.filter(Boolean).length;
      const sufficientSupport = passes >= 200 && n - passes >= 200;
      const impact = sufficientSupport
        ? scenarios.scenarios.map((s, k) => {
            let a = 0,
              b = 0;
            pass.forEach((p, i) => {
              if (p) a += success[k][i];
              else b += success[k][i];
            });
            const passSuccess = probability(a, passes),
              failSuccess = probability(b, n - passes);
            return {
              scenarioId: s.id,
              passSuccess,
              failSuccess,
              difference: passSuccess - failSuccess,
            };
          })
        : [];
      const passProbability = probability(passes, n);
      return {
        id,
        passProbability,
        sufficientSupport,
        impact,
        score:
          4 *
          passProbability *
          (1 - passProbability) *
          Math.max(0, ...impact.map((x) => Math.abs(x.difference))),
      };
    })
    .sort((a, b) => b.score - a.score);
  // Split-half diagnostic catches unstable summaries and bad weights; this is Monte Carlo precision, not model calibration.
  const stable =
    n >= 10000 &&
    success.every((s) => {
      const half = Math.floor(n / 2);
      return (
        Math.abs(
          s.slice(0, half).reduce((a, b) => a + b, 0) / half -
            s.slice(half).reduce((a, b) => a + b, 0) / (n - half),
        ) < 0.035
      );
    });
  const partyBloc = Object.fromEntries(
    ids.map((p) => {
      const b = partyFile.parties.find((x) => x.id === p)?.bloc;
      return [p, b && ["net", "opp", "mid", "arab"].includes(b) ? b : "other"];
    }),
  );
  const blocSeats = (["net", "opp", "mid", "arab", "other"] as const).map(
    (id) => ({
      id,
      seats: interval(
        Array.from({ length: n }, (_, i) =>
          ids
            .filter((p) => partyBloc[p] === id)
            .reduce((sum, p) => sum + seats[p][i], 0),
        ),
      ),
    }),
  );
  return {
    blocSeats,
    largestParty: categorical(first),
    partySeats: ids.map((id) => ({
      id,
      seats: interval(Array.from(seats[id])),
    })),
    blocMargin: interval(
      Array.from({ length: n }, (_, i) => blocs.net[i] - blocs.opp[i]),
    ),
    blocLead: categorical(lead),
    arrangements,
    thresholds,
    stable,
  };
}

export function representativeJointDraw(seats: Draws) {
  const ids = Object.keys(seats),
    n = seats[ids[0]]?.length ?? 0;
  if (!n) throw new Error("Missing joint draws");
  // The draw that best matches the published central figures: bloc totals closest to the bloc medians first
  // (so the grid agrees with the headline bloc numbers), then lists closest to their medians, then to their means.
  const means = Object.fromEntries(
    ids.map((id) => [id, Array.from(seats[id]).reduce((a, b) => a + b, 0) / n]),
  );
  const medians = Object.fromEntries(ids.map((id) => [id, interval(Array.from(seats[id])).median]));
  const blocOf = Object.fromEntries(
    ids.map((p) => {
      const b = partyFile.parties.find((x) => x.id === p)?.bloc;
      return [p, b && ["net", "opp", "mid", "arab"].includes(b) ? b : "other"];
    }),
  );
  const blocIds = [...new Set(Object.values(blocOf))];
  const blocAt = (bloc: string, i: number) => ids.reduce((s, id) => (blocOf[id] === bloc ? s + seats[id][i] : s), 0);
  const blocMedian = Object.fromEntries(
    blocIds.map((b) => [b, interval(Array.from({ length: n }, (_, i) => blocAt(b, i))).median]),
  );
  // Bloc medians need not sum to 120: among draws equally close to them, the spare seats go to the blocs whose
  // means sit furthest above their medians (closest to the bloc means), before any list-level tie-break.
  const blocMean = Object.fromEntries(
    blocIds.map((b) => [b, Array.from({ length: n }, (_, i) => blocAt(b, i)).reduce((a, x) => a + x, 0) / n]),
  );
  let drawIndex = 0,
    best = Infinity;
  for (let i = 0; i < n; i++) {
    const loss =
      1e6 * blocIds.reduce((v, b) => v + Math.abs(blocAt(b, i) - blocMedian[b]), 0) +
      1e5 * blocIds.reduce((v, b) => v + Math.abs(blocAt(b, i) - blocMean[b]), 0) +
      1e3 * ids.reduce((v, id) => v + Math.abs(seats[id][i] - medians[id]), 0) +
      ids.reduce((v, id) => v + Math.abs(seats[id][i] - means[id]), 0);
    if (loss < best) {
      best = loss;
      drawIndex = i;
    }
  }
  return {
    method: "representative_joint_draw" as const,
    drawIndex,
    seats: Object.fromEntries(ids.map((id) => [id, seats[id][drawIndex]])),
  };
}

export function buildSnapshot({
  prior,
  revision,
  now,
  exits = [],
  sources = [],
  runs = 30000,
}: {
  prior: LiveForecastSnapshot["prior"];
  revision: string;
  now: string;
  exits?: Poll[];
  sources?: LiveSource[];
  runs?: number;
}): LiveForecastSnapshot {
  // Exit estimates: the publishers are averaged with shared correlated uncertainty (no independent poll
  // multiplication); the bloc lean, swing scale and per-list error come from the exit-poll record, the sector
  // noise from the campaign model with its mean shifts off. Channel 14 and i24NEWS stay out (sources.ts).
  const polls = exits.length
    ? exits.map((p) => ({ ...p, kind: undefined }))
    : pollFile.polls;
  const exitFit = exits.length ? exitLikelihood() : null;
  const liveCalibration = exitFit
    ? {
        ...calibration,
        elections: exitFit.elections,
        perListError: {
          about: "Averaged main-channel exit polls, 2013-2022: mean absolute seat error per list (docs/research/exit-polls/summary.json).",
          meanAbsSeats: exitFit.partyMeanAbsSeats,
        },
        sectorTurnout: {
          ...calibration.sectorTurnout,
          sectors: calibration.sectorTurnout.sectors.map((s) => ({
            ...s,
            logShift: 0,
            alphaPts: 0,
          })),
        },
      }
    : calibration;
  const out = forecast({
    polls,
    config: pollFile.config,
    parties: partyFile.parties,
    agreements: [...results.agreements, ...results.unconfirmedAgreements].map(
      (a) => a.parties,
    ),
    cal: liveCalibration,
    opts: {
      keepRuns: true,
      runs,
      seed: 20261027,
      ...(exitFit
        ? { lean: exitFit.lean, priors: false, leanHalfLife: Number.POSITIVE_INFINITY }
        : {}),
    },
  });
  if (!out.seatRuns || !out.blocRuns)
    throw new Error("Joint draws unavailable");
  const summary = summarizeDraws(out.seatRuns, out.blocRuns);
  return {
    schemaVersion: 1,
    modelVersion: MODEL_VERSION,
    scenarioVersion: SCENARIO_VERSION,
    revision,
    generatedAt: now,
    mode: exits.length ? "exit" : "prior",
    experimental: true,
    prior,
    freshness: {
      status: sources.some((s) => s.status === "valid")
        ? "current"
        : "baseline",
      lastSuccessfulAcquisitionAt: sources.some((s) => s.status === "valid")
        ? now
        : null,
      lastAttemptAt: now,
    },
    sources,
    blocSeats: summary.blocSeats,
    largestParty: summary.largestParty,
    partySeats: summary.partySeats,
    representativePoint: representativeJointDraw(out.seatRuns),
    blocMargin: summary.blocMargin,
    changeReason: exits.length ? "source_revision" : "baseline",
    history: [],
    blocLead: summary.blocLead,
    arrangements: summary.arrangements,
    thresholds: summary.thresholds,
    diagnostics: {
      runs,
      seed: out.seed,
      stable: summary.stable,
      countGate: "blocked",
      limitations: [
        "Experimental conditional arithmetic, not probabilities that parties agree to govern.",
        "Threshold comparisons are conditional associations, not causal effects.",
        "Exit-poll bloc lean, swing scale and per-list error are fitted to six elections of TV exit polls (2013-2022, September 2019 unavailable); sector noise is still the campaign model's.",
        "Official count publication is blocked pending source semantics and verified reporting-coverage metadata and replay checks.",
        "Direct Channel13 timeline extraction is supported; complete structured N12/Kan ingestion remains unverified, with validated Wikipedia as fallback.",
        "Special envelopes remain separate from geographic turnout.",
      ],
    },
  };
}
