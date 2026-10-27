import type { Lang } from "@/lib/i18n";
import type { LiveForecastText } from "@/lib/i18n/live-forecast";
import type { LiveForecastSnapshot } from "@/lib/live-forecast/types";
import type { CadenceMetadata } from "@/lib/election-lifecycle/cadence";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";

export type ForecastParty = {
  name: string;
  lang: Lang;
  color: string;
  bloc?: string;
};
export type ForecastScenario = {
  id: string;
  title: string;
  titleLang: Lang;
  href: string;
  roles: { label: string; names: string }[];
  warnings: { text: string; lang: Lang; source: string }[];
  sourceUrl: string;
};
export type ForecastProps = {
  initial: LiveForecastSnapshot | null;
  cadence?: CadenceMetadata;
  context?: SharedSeatContext | null;
  lang: Lang;
  text: LiveForecastText;
  names: Record<string, ForecastParty>;
  scenarios: ForecastScenario[];
  compact?: boolean;
  archived?: boolean;
};

/** Extreme values remain probabilistic even when rounded to a whole percent. */
export function probability(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 1) return "—";
  if (value < 0.01) return "<1%";
  if (value > 0.99) return ">99%";
  return `${Math.round(value * 100)}%`;
}

/** Stable input-only ordering: no clock, impact score, or source-health change can reshuffle the watchlist. */
export const primaryThresholds = (snapshot: LiveForecastSnapshot) =>
  [...snapshot.thresholds].sort(
    (a, b) =>
      Math.abs(a.passProbability - 0.5) - Math.abs(b.passProbability - 0.5) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
export function exactBlocs(
  context: SharedSeatContext,
  names: Record<string, ForecastParty>,
) {
  const seats = { net: 0, opp: 0, mid:0, arab: 0, other: 0 };
  for (const [id, n] of Object.entries(context.pointSeats)) {
    const bloc = names[id]?.bloc;
    seats[
      bloc === "net" || bloc === "opp" || bloc === "mid" || bloc === "arab" ? bloc : "other"
    ] += n;
  }
  return Object.entries(seats).map(([id, n]) => ({
    id,
    seats: { lo: n, median: n, hi: n },
  }));
}
type SeatRow = { id: string; seats: { lo: number; median: number; hi: number } };
/**
 * Headline figures are the shared 120-seat parliament the grid shows (Daniel, 2026-10-27: one consistent best
 * estimate everywhere), with the simulations' 80% range beside them. Bloc and list medians need not sum to 120,
 * so a median headline could disagree with the grid by a seat. The range widens only if the point falls outside it.
 */
export function headlineRows(rows: SeatRow[], point: Record<string, number> | null): SeatRow[] {
  if (!point) return rows;
  return rows.map((row) => {
    const n = point[row.id];
    if (n === undefined) return row;
    return { ...row, seats: { lo: Math.min(row.seats.lo, n), median: n, hi: Math.max(row.seats.hi, n) } };
  });
}
export function pointBlocs(context: SharedSeatContext, names: Record<string, ForecastParty>): Record<string, number> {
  return Object.fromEntries(exactBlocs(context, names).map((row) => [row.id, row.seats.median]));
}
/** A missing field is a gap, not permission to join or backfill neighboring projections. */
export function numericHistorySegments(history:LiveForecastSnapshot["history"],id:string){
 const segments:{at:number;seats:number}[][]=[];let current:{at:number;seats:number}[]=[];
 for(const point of history){const row=point.blocSeats?.find(row=>row.id===id);if(!row){if(current.length)segments.push(current);current=[];}else current.push({at:Date.parse(point.generatedAt),seats:row.seats.median});}
 if(current.length)segments.push(current);return segments;
}

/** Resolve by generation time, never by arrival order. Equal revisions may carry newer health. */
export function acceptSnapshot(
  current: LiveForecastSnapshot | null,
  next: LiveForecastSnapshot,
): boolean {
  return (
    next.schemaVersion === 1 &&
    next.experimental === true &&
    next.diagnostics?.stable === true &&
    Number.isFinite(Date.parse(next.generatedAt)) &&
    (!current ||
      Date.parse(next.generatedAt) >= Date.parse(current.generatedAt))
  );
}

export function mergeSnapshot(
  current: LiveForecastSnapshot | null,
  next: LiveForecastSnapshot,
): LiveForecastSnapshot | null {
  if (acceptSnapshot(current, next)) return next;
  if (current && next.changeReason === "acquisition_failed")
    return {
      ...current,
      freshness: {
        ...current.freshness,
        status: "stale",
        lastAttemptAt: next.freshness.lastAttemptAt,
      },
      changeReason: "acquisition_failed",
    };
  return current;
}
