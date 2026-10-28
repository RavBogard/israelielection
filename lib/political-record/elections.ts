/** Pure election definitions: safe for client bundles (no node:crypto). Server code may keep importing ./registry. */
import config from "@/data/election.json";
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
    id: config.id,
    jurisdiction: "IL",
    chamber: "knesset",
    termNumber: config.termNumber,
    electionDay: config.electionDay,
    timeZone: "Asia/Jerusalem",
    pollsClose: config.pollsClose,
    modelArchiveAt: config.modelArchiveAt,
    seats: 120,
    sourceConfigVersion: config.sourceConfigVersion,
  } as ElectionDefinition),
]);
export const currentElection = () => ELECTIONS[0];
/** Timeline of the count windows for the current election (one config file: data/election.json). */
export const COUNT_TIMELINE = Object.freeze({
  pollsClose: Date.parse(config.pollsClose),
  regularStart: Date.parse(config.regularStart),
  countWindowEnd: Date.parse(config.countWindowEnd),
});
export function electionById(id: string) {
  return ELECTIONS.find((e) => e.id === id) ?? null;
}
export function electionByLegacyDate(date: string) {
  return ELECTIONS.find((e) => e.electionDay === date) ?? null;
}
/** Public aliases: the canonical id, the election day, the year of the election day ("2026") and the term number ("26"). */
export function electionByRef(ref: string | null | undefined) {
  if (!ref) return null;
  return (
    electionById(ref) ??
    electionByLegacyDate(ref) ??
    ELECTIONS.find(
      (e) => e.electionDay.slice(0, 4) === ref || String(e.termNumber) === ref,
    ) ??
    null
  );
}
/** True when the id, date or alias names the current election. */
export const isCurrentElectionRef = (ref: string | null | undefined) =>
  electionByRef(ref)?.id === currentElection().id;
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
