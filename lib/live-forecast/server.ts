import baseline from "../../data/live-forecast.json";
import type { LiveForecastSnapshot } from "./types";
import { configuredStore } from "./store";
export const liveForecastEnabled = () => process.env.LIVE_FORECAST_ENABLED === "true";
export const getBaselineSnapshot = (): LiveForecastSnapshot => structuredClone(baseline) as LiveForecastSnapshot;
export async function getLiveForecast(): Promise<LiveForecastSnapshot> {
  const fallback = getBaselineSnapshot(), store = configuredStore();
  if (!liveForecastEnabled() || !store) return fallback;
  try {
    const [snapshot, health] = await Promise.all([store.read(), store.health()]);
    if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.experimental !== true || !snapshot.diagnostics.stable || snapshot.prior.sha256 !== fallback.prior.sha256 || snapshot.modelVersion !== fallback.modelVersion || snapshot.scenarioVersion !== fallback.scenarioVersion) return { ...fallback, freshness: { status: health?.error ? "stale" : "baseline", lastAttemptAt: health?.lastAttemptAt ?? null, lastSuccessfulAcquisitionAt: health?.lastSuccessfulAcquisitionAt ?? null }, changeReason: health?.error ? "acquisition_failed" : "baseline" };
    const last = health?.lastSuccessfulAcquisitionAt ?? snapshot.freshness.lastSuccessfulAcquisitionAt;
    return { ...snapshot, freshness: { lastAttemptAt: health?.lastAttemptAt ?? snapshot.freshness.lastAttemptAt, lastSuccessfulAcquisitionAt: last, status: last && Date.now() - Date.parse(last) > 300000 ? "stale" : snapshot.freshness.status }, changeReason: health?.error ? "acquisition_failed" : snapshot.changeReason };
  } catch { return { ...fallback, freshness: { ...fallback.freshness, status: "stale" }, changeReason: "acquisition_failed" }; }
}
