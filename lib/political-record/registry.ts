import { recordHash } from "./hash";
export type ElectionDefinition = {
  id: string;
  jurisdiction: "IL";
  chamber: "knesset";
  termNumber: number;
  electionDay: string;
  timeZone: "Asia/Jerusalem";
  pollsClose: string;
  modelArchiveAt: string;
  seats: 120;
  sourceConfigVersion: string;
};
export const ELECTIONS: readonly ElectionDefinition[] = Object.freeze([
  Object.freeze({
    id: "il-knesset-26",
    jurisdiction: "IL",
    chamber: "knesset",
    termNumber: 26,
    electionDay: "2026-10-27",
    timeZone: "Asia/Jerusalem",
    pollsClose: "2026-10-27T20:00:00Z",
    modelArchiveAt: "2026-11-03T00:00:00Z",
    seats: 120,
    sourceConfigVersion: "2026-v1",
  }),
]);
export const currentElection = () => ELECTIONS[0];
export function electionById(id: string) {
  return ELECTIONS.find((e) => e.id === id) ?? null;
}
export function electionByLegacyDate(date: string) {
  return ELECTIONS.find((e) => e.electionDay === date) ?? null;
}
export function validateElectionDefinition(value: ElectionDefinition) {
  if (
    !/^il-knesset-[1-9]\d*$/.test(value.id) ||
    value.id !== `il-knesset-${value.termNumber}` ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.electionDay) ||
    value.seats !== 120 ||
    !Number.isFinite(Date.parse(value.pollsClose)) ||
    !Number.isFinite(Date.parse(value.modelArchiveAt)) ||
    Date.parse(value.modelArchiveAt) <= Date.parse(value.pollsClose) ||
    !value.sourceConfigVersion
  )
    throw new Error("invalid_election_definition");
  return value;
}
/** Stable namespace is parliamentary-term identity, not year; rapid repeat elections cannot collide. */
export function electionScope(id: string) {
  if (!/^il-knesset-[1-9]\d*$/.test(id)) throw new Error("invalid_election_id");
  return `political-record:v1:${id}:`;
}
export function revisionId(value: unknown) {
  return recordHash(value);
}
