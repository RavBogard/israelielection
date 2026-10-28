import { currentElection } from "./political-record/elections";
import type { GeographySnapshot } from "./election-lifecycle/types";
import type { SharedSeatContext } from "./election-lifecycle/types";
import type { VoteMapElection } from "./votemap";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-27" as "Oct 2026", the menu form the other vote-map elections use. */
export function monthYear(iso: string) {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
/** Current geography is offered only with documented completeness and reconciled official seats. */
export function geographyToElection(
  snapshot: GeographySnapshot,
  context?: SharedSeatContext | null,
): VoteMapElection | null {
  if (
    !context ||
    context.seatStatus !== "official" ||
    context.revision !== snapshot.officialSeatRevision
  )
    return null;
  if (
    snapshot.election !== currentElection().electionDay ||
    !snapshot.complete ||
    snapshot.coverage !== "documented_complete" ||
    !snapshot.officialSeatRevision ||
    !snapshot.rows.length
  )
    return null;
  const lists = snapshot.lists.map((list) => ({
    ...list,
    votes:
      snapshot.rows.reduce((n, row) => n + (row.votes[list.id] ?? 0), 0) +
      (snapshot.envelopes.votes[list.id] ?? 0),
    seats: context.pointSeats[list.id] ?? 0,
  }));
  if (lists.reduce((n,l)=>n+l.seats,0)!==120)return null;
  if (lists.reduce((n, l) => n + l.votes, 0) !== snapshot.totals.valid)
    return null;
  return {
    id: currentElection().id,
    label: `${monthYear(snapshot.election)} · official localities`,
    date: snapshot.election,
    knesset: currentElection().termNumber,
    source: {
      results: snapshot.source.url,
      csv: snapshot.source.url,
      sha256: snapshot.source.captureHash,
      fetched: snapshot.observedAt,
    },
    lists: lists.map(({ letters, name, votes, seats }) => ({
      letters,
      name,
      votes,
      seats,
    })),
    national: { ...snapshot.totals, other: 0 },
    envelopes: {
      valid: snapshot.envelopes.valid,
      votes: lists.map((l) => snapshot.envelopes.votes[l.id] ?? 0),
      other: 0,
    },
    rows: snapshot.rows.map((row) => [
      row.code,
      row.eligible,
      row.voted,
      row.valid,
      ...lists.map((l) => row.votes[l.id] ?? 0),
    ]),
  };
}
