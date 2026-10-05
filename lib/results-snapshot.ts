import { createHash } from "node:crypto";
import { resultsOpen, type Count, type ResultsConfig } from "./results";
export type ResultsSnapshot = { version: 1; election: string; sourceUrl: string; capturedAt: string; sourceUpdatedAt: string | null; hash: string; count: Count };
export type SnapshotStore = { current: ResultsSnapshot | null; previous: ResultsSnapshot | null };
const integer = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
export function validCount(value: unknown): value is Count {
  if (!value || typeof value !== "object") return false;
  const c = value as Count;
  if (![c.eligible, c.voted, c.invalid, c.valid, c.localities].every(integer) || !c.valid || c.voted !== c.valid + c.invalid || !c.votes || typeof c.votes !== "object" || Array.isArray(c.votes)) return false;
  if (!Object.keys(c.votes).length || !Object.values(c.votes).every(integer) || Object.values(c.votes).reduce((a, b) => a + b, 0) !== c.valid) return false;
  if (c.envelopes && (typeof c.envelopes.present !== "boolean" || !integer(c.envelopes.voted) || !integer(c.envelopes.valid) || c.envelopes.valid > c.envelopes.voted || c.envelopes.voted > c.voted || c.envelopes.valid > c.valid)) return false;
  return c.voted - (c.envelopes?.voted ?? 0) <= c.eligible && (c.localities > 0 || !!c.envelopes?.present);
}
export function countHash(count: Count): string {
  return createHash("sha256").update(JSON.stringify({ eligible: count.eligible, voted: count.voted, invalid: count.invalid, valid: count.valid, localities: count.localities, envelopes: count.envelopes ?? null, votes: Object.fromEntries(Object.entries(count.votes).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) })).digest("hex");
}
export function validSnapshot(value: unknown, config: ResultsConfig, now = Date.now()): value is ResultsSnapshot {
  if (!resultsOpen(config, now) || !value || typeof value !== "object") return false;
  const s = value as ResultsSnapshot; const captured = Date.parse(s.capturedAt);
  return s.version === 1 && s.election === config.election && s.sourceUrl === config.source.url && Number.isFinite(captured) && captured >= Date.parse(config.pollsClose) && captured <= now && validCount(s.count) && s.hash === countHash(s.count) && (s.sourceUpdatedAt === null || typeof s.sourceUpdatedAt === "string" && Number.isFinite(Date.parse(s.sourceUpdatedAt)) && Date.parse(s.sourceUpdatedAt) <= captured);
}
export function makeSnapshot(count: Count, config: ResultsConfig, capturedAt: string, sourceUpdatedAt: string | null): ResultsSnapshot {
  return { version: 1, election: config.election, sourceUrl: config.source.url, capturedAt, sourceUpdatedAt, count, hash: countHash(count) };
}
export function savedSnapshots(store: unknown, config: ResultsConfig, now = Date.now()): ResultsSnapshot[] {
  if (!store || typeof store !== "object") return [];
  const s = store as SnapshotStore;
  return [s.current, s.previous].filter((v): v is ResultsSnapshot => validSnapshot(v, config, now)).sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));
}
/** Persist only a genuinely acquired current-election count; unchanged payload retains the previous distinct count. */
export function rotateSnapshot(store: SnapshotStore, incoming: unknown, config: ResultsConfig, now = Date.now()): SnapshotStore | null {
  if (!incoming || typeof incoming !== "object") return null;
  const response = incoming as { state?: string; fixture?: boolean; snapshot?: unknown };
  if (response.state !== "fresh" || response.fixture || !validSnapshot(response.snapshot, config, now)) return null;
  const current = savedSnapshots(store, config, now)[0] ?? null;
  if (current && Date.parse(response.snapshot.capturedAt) < Date.parse(current.capturedAt)) return null;
  if (current?.hash === response.snapshot.hash) return null;
  return { current: response.snapshot, previous: current?.hash === response.snapshot.hash ? savedSnapshots(store, config, now).find((s) => s.hash !== current.hash) ?? null : current };
}
