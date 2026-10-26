import { createHash } from "node:crypto";
export const ELECTION = "2026-10-27";
export const POLLS_CLOSE = "2026-10-27T20:00:00Z";
export const ELECTION_END = "2026-11-03T00:00:00Z";
function canonical(v: unknown): unknown {
  return Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, x]) => [k, canonical(x)]),
        )
      : v;
}
export const fingerprint = (v: unknown) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : JSON.stringify(canonical(v)))
    .digest("hex");
export const validSeats = (v: Record<string, number>) =>
  Object.keys(v).length > 0 &&
  Object.values(v).every((n) => Number.isSafeInteger(n) && n >= 0) &&
  Object.values(v).reduce((a, b) => a + b, 0) === 120;
export const iso = (s: unknown): s is string =>
  typeof s === "string" && Number.isFinite(Date.parse(s));
export const lifecycleEnabled = () =>
  process.env.ELECTION_LIFECYCLE_ENABLED === "true";
export const officialEnabled = () =>
  process.env.ELECTION_OFFICIAL_ENABLED === "true";
export const formationEnabled = () =>
  process.env.ELECTION_FORMATION_ENABLED === "true";
