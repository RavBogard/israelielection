import { createHash } from "node:crypto";
import { currentElection } from "../political-record/registry";
export const ELECTION = currentElection().electionDay;
export const POLLS_CLOSE = currentElection().pollsClose;
export const ELECTION_END = currentElection().modelArchiveAt;
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
