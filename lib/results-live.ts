import configJson from "@/data/results.json";
import storedJson from "@/data/results-snapshot.json";
import { parseExpc, resultsOpen, type Count, type ResultsConfig } from "./results";
import { makeSnapshot, savedSnapshots, validCount, type ResultsSnapshot } from "./results-snapshot";
export const resultsConfig = configJson as ResultsConfig;
export type Live =
  | { state: "closed" }
  | { state: "error"; fetchedAt: string }
  | { state: "open"; count: Count; fetchedAt: string; attemptedAt: string; freshness: "fresh" | "stale"; sourceUpdatedAt: string | null; snapshot: ResultsSnapshot; previous: ResultsSnapshot | null; fixture?: boolean };
export type CountOptions = { now?: number; store?: unknown; fetcher?: typeof fetch; config?: ResultsConfig };
/** Fresh acquisition must bypass Next's response cache; the small public endpoints provide CDN sharing. */
export async function fetchCount(_revalidate = 60, options: CountOptions = {}): Promise<Live> {
  void _revalidate; // Retained for existing call sites; freshness requires uncached source acquisition.
  const now = options.now ?? Date.now(); const cfg = options.config ?? resultsConfig; const attemptedAt = new Date(now).toISOString();
  const saved = savedSnapshots(options.store ?? storedJson, cfg, now);
  if (process.env.NODE_ENV === "development" && process.env.RESULTS_FIXTURE && !options.fetcher) {
    const { readFileSync } = await import("node:fs"); const count = parseExpc(readFileSync(process.env.RESULTS_FIXTURE, "utf8"));
    return { state: "open", count, fetchedAt: attemptedAt, attemptedAt, freshness: "fresh", sourceUpdatedAt: null, snapshot: makeSnapshot(count, cfg, attemptedAt, null), previous: null, fixture: true };
  }
  if (!resultsOpen(cfg, now)) return { state: "closed" };
  try {
    const response = await (options.fetcher ?? fetch)(cfg.source.url, { cache: "no-store", signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; israelielection.org results reader; +https://www.israelielection.org)" } });
    if (!response.ok) throw new Error("Source unavailable");
    const count = parseExpc(await response.text()); if (!validCount(count)) throw new Error("Count not usable");
    const acquired = options.now === undefined ? new Date().toISOString() : attemptedAt;
    const modified = response.headers.get("last-modified"); const sourceTime = modified ? Date.parse(modified) : NaN;
    const sourceUpdatedAt = Number.isFinite(sourceTime) && sourceTime <= Date.parse(acquired) ? new Date(sourceTime).toISOString() : null;
    const snapshot = makeSnapshot(count, cfg, acquired, sourceUpdatedAt);
    return { state: "open", count, fetchedAt: acquired, attemptedAt, freshness: "fresh", sourceUpdatedAt, snapshot, previous: saved.find((s) => s.hash !== snapshot.hash) ?? null };
  } catch {
    if (!saved.length) return { state: "error", fetchedAt: attemptedAt };
    const snapshot = saved[0];
    return { state: "open", count: snapshot.count, fetchedAt: snapshot.capturedAt, attemptedAt, freshness: "stale", sourceUpdatedAt: snapshot.sourceUpdatedAt, snapshot, previous: saved.find((s) => s.hash !== snapshot.hash) ?? null };
  }
}
