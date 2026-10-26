export type LiveSource = { id: string; publisher: string; transport: "direct" | "wikipedia" | "official"; url: string; revision: string; publishedAt: string | null; observedAt: string; status: "valid" | "unavailable" | "rejected"; note?: string };
export type Interval = { lo: number; median: number; hi: number };
export type LiveForecastSnapshot = {
  schemaVersion: 1; modelVersion: string; scenarioVersion: string; revision: string;
  generatedAt: string; mode: "prior" | "exit" | "count"; experimental: true;
  prior: { version: string; sha256: string; generatedAt: string; final: boolean };
  freshness: { status: "current" | "stale" | "baseline"; lastSuccessfulAcquisitionAt: string | null; lastAttemptAt: string | null };
  sources: LiveSource[];
  largestParty: { id: string; probability: number }[];
  partySeats: { id: string; seats: Interval }[];
  blocMargin: Interval;
  changeReason: "baseline" | "source_revision" | "source_unchanged" | "acquisition_failed";
  history: { generatedAt: string; revision: string; mode: "prior" | "exit" | "count"; arrangements: { id: string; probability: number }[] }[];
  blocLead: { id: string; probability: number }[];
  arrangements: { id: string; probability: number; mcError: number; yes: Interval; no: Interval; margin: Interval }[];
  thresholds: { id: string; passProbability: number; impact: { scenarioId: string; passSuccess: number; failSuccess: number; difference: number }[]; score: number; sufficientSupport: boolean }[];
  diagnostics: { runs: number; seed: number; stable: boolean; countGate: "blocked" | "validated"; limitations: string[] };
};
