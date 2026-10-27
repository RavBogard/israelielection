import { makeRecord, makeSource } from "./records";
import { recordHash } from "./hash";
import { contentHash, type CaptureArchive } from "./captures";
import type { PoliticalRecordRepository } from "./types";
export const CBS_URL =
  "https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false&last=2&lang=en";
export type CbsObservation = {
  seriesId: 120010;
  name: string;
  period: string;
  monthlyPercent: number;
  annualPercent: number;
  baseDescription: string;
  indexValue: number;
  releaseDate: null;
};
/** Observation month is not its release/retrieval date; base periods and units are preserved. */
export function parseCbs(body: unknown, now: string): CbsObservation[] {
  if (!body || typeof body !== "object") throw new Error("cbs_schema_invalid");
  const value = body as {
    month?: unknown;
    quarter?: unknown;
    paging?: { next_url?: unknown };
  };
  if (
    !Array.isArray(value.month) ||
    value.month.length !== 1 ||
    value.quarter !== null ||
    value.paging?.next_url !== null
  )
    throw new Error("cbs_schema_invalid");
  const series = value.month[0];
  if (
    series.code !== 120010 ||
    typeof series.name !== "string" ||
    !series.name ||
    !Array.isArray(series.date) ||
    !series.date.length ||
    series.date.length > 100
  )
    throw new Error("cbs_series_invalid");
  const periods = new Set<string>();
  return series.date.map((row: Record<string, unknown>) => {
    const year = row.year,
      month = row.month,
      base = row.currBase as { baseDesc?: unknown; value?: unknown } | null;
    if (
      !Number.isInteger(year) ||
      Number(year) < 1948 ||
      Number(year) > 2100 ||
      !Number.isInteger(month) ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      typeof row.percent !== "number" ||
      !Number.isFinite(row.percent) ||
      typeof row.percentYear !== "number" ||
      !Number.isFinite(row.percentYear) ||
      !base ||
      typeof base.baseDesc !== "string" ||
      !base.baseDesc ||
      typeof base.value !== "number" ||
      !Number.isFinite(base.value) ||
      base.value <= 0
    )
      throw new Error("cbs_observation_invalid");
    const period = `${year}-${String(month).padStart(2, "0")}`;
    if (period > now.slice(0, 7) || periods.has(period))
      throw new Error("cbs_period_invalid");
    periods.add(period);
    return {
      seriesId: 120010,
      name: series.name,
      period,
      monthlyPercent: row.percent,
      annualPercent: row.percentYear,
      baseDescription: base.baseDesc,
      indexValue: base.value,
      releaseDate: null,
    };
  });
}
export async function collectCbs(
  repository: PoliticalRecordRepository,
  archive: CaptureArchive | null,
  now = new Date().toISOString(),
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(CBS_URL, {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: {
      "User-Agent":
        "IsraeliElection source collector (+https://www.israelielection.org)",
      Accept: "application/json",
    },
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    throw new Error("cbs_source_unavailable");
  const body = await response.text();
  if (Buffer.byteLength(body) > 500000) throw new Error("cbs_payload_oversize");
  const observations = parseCbs(JSON.parse(body), now);
  const source = makeSource({
    sourceId: "cbs:price:120010",
    publisher: "Israel Central Bureau of Statistics",
    title: "Consumer Price Index - General",
    captureHash: contentHash(Buffer.from(body)),
    url: CBS_URL,
    authority: "cbs",
    observedAt: now,
    publishedAt: null,
  });
  const capture = archive
    ? await archive.put(source, Buffer.from(body), "application/json")
    : null;
  const records = [];
  for (const observation of observations) {
    const recordId = `indicator:cbs:120010:${observation.period}`;
    const previous = await repository.getLatest(recordId);
    if (previous && recordHash(previous.payload) === recordHash(observation))
      continue;
    records.push(
      makeRecord({
        recordId,
        kind: "indicator_observation",
        electionId: null,
        effectiveAt: null,
        observedAt: now,
        status: "confirmed",
        evidenceClass: "primary_confirmed",
        previousRevisionId: previous?.revisionId ?? null,
        payload: observation,
        provenance: {
          sourceIds: [source.revisionId],
          captureIds: capture ? [capture.captureId] : [],
          missingCapture: !capture,
          parserVersion: "cbs-price-v1",
        },
      }),
    );
  }
  const result = await repository.append({
    records,
    sources: [source],
    captures: capture ? [capture] : [],
    outbox: [],
  });
  return {
    status: "stored",
    seriesId: 120010,
    observations: observations.length,
    revisions: result.records,
    revisionIds: records.map((record) => record.revisionId),
    privateArchive: capture ? "available" : "unconfigured",
  };
}
