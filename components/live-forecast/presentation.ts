import type { Lang } from "@/lib/i18n";
import type { LiveForecastText } from "@/lib/i18n/live-forecast";
import type { LiveForecastSnapshot } from "@/lib/live-forecast/types";

export type ForecastParty = { name: string; lang: Lang; color: string };
export type ForecastScenario = { id: string; title: string; titleLang: Lang; href: string; roles: { label: string; names: string }[]; warnings: { text: string; lang: Lang; source: string }[]; sourceUrl: string };
export type ForecastProps = { initial: LiveForecastSnapshot | null; lang: Lang; text: LiveForecastText; names: Record<string, ForecastParty>; scenarios: ForecastScenario[]; compact?: boolean };

/** Extreme values remain probabilistic even when rounded to a whole percent. */
export function probability(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 1) return "—";
  if (value < .01) return "<1%";
  if (value > .99) return ">99%";
  return `${Math.round(value * 100)}%`;
}

export const primaryThresholds = (snapshot: LiveForecastSnapshot) => snapshot.thresholds.filter((row) => row.passProbability > .01 && row.passProbability < .99).sort((a, b) => b.score - a.score);

/** Resolve by generation time, never by arrival order. Equal revisions may carry newer health. */
export function acceptSnapshot(current: LiveForecastSnapshot | null, next: LiveForecastSnapshot): boolean {
  return next.schemaVersion === 1 && next.experimental === true && next.diagnostics?.stable === true && Number.isFinite(Date.parse(next.generatedAt)) && (!current || Date.parse(next.generatedAt) >= Date.parse(current.generatedAt));
}

export function mergeSnapshot(current: LiveForecastSnapshot | null, next: LiveForecastSnapshot): LiveForecastSnapshot | null {
  if (acceptSnapshot(current, next)) return next;
  if (current && next.changeReason === "acquisition_failed") return { ...current, freshness: { ...current.freshness, status: "stale", lastAttemptAt: next.freshness.lastAttemptAt }, changeReason: "acquisition_failed" };
  return current;
}
