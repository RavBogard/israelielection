import { currentElection } from "@/lib/political-record/elections";
/** The current election's day, from the one config (data/election.json). */
export const ELECTION_DAY = currentElection().electionDay;
export function daysUntil(iso: string) {
  return Math.ceil(
    (Date.parse(`${iso}T00:00:00+02:00`) - Date.now()) / 86400000,
  );
}
