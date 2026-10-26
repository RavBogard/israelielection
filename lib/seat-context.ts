import type { SharedSeatContext } from "./election-lifecycle/types";
import type { Party, Poll } from "./types";

export const CONTEXT_POLL_PREFIX = "seat-context:";
export const isContextPoll = (poll: Poll) =>
  poll.id.startsWith(CONTEXT_POLL_PREFIX);

export function coherentSeats(context: SharedSeatContext): boolean {
  const seats = Object.values(context.pointSeats);
  return (
    seats.length > 0 &&
    seats.every((n) => Number.isInteger(n) && n >= 0) &&
    seats.reduce((sum, n) => sum + n, 0) === 120
  );
}

/** Compatibility only: publication/freshness labels must come from the context, never this pseudo-poll's date. */
export function contextToPoll(context: SharedSeatContext): Poll {
  if (!coherentSeats(context))
    throw new Error(
      "Seat context must contain one coherent 120-seat allocation",
    );
  return {
    id: `${CONTEXT_POLL_PREFIX}${context.snapshotRevision}`,
    pollster: context.basis,
    firm: null,
    fieldwork: null,
    published: (context.publishedAt ?? context.observedAt).slice(0, 10),
    via: null,
    url: context.sourceRefs[0]?.url ?? null,
    n: null,
    margin: null,
    note: null,
    results: Object.fromEntries(
      Object.entries(context.pointSeats).map(([id, seats]) => [
        id,
        { seats, belowThreshold: seats === 0 },
      ]),
    ),
    combined: [],
  };
}

export function unmappedLists(
  context: SharedSeatContext,
  parties: Pick<Party, "id">[],
) {
  const known = new Set(parties.map((party) => party.id));
  return Object.entries(context.pointSeats)
    .filter(([id, seats]) => seats > 0 && !known.has(id))
    .map(([id, seats]) => ({
      id,
      seats,
      label: context.parties.find((party) => party.id === id)?.label ?? id,
    }));
}

export function changedSeats(
  previous: SharedSeatContext,
  next: SharedSeatContext,
) {
  return [
    ...new Set([
      ...Object.keys(previous.pointSeats),
      ...Object.keys(next.pointSeats),
    ]),
  ].flatMap((id) => {
    const before = previous.pointSeats[id] ?? 0,
      after = next.pointSeats[id] ?? 0;
    return before === after
      ? []
      : [{ id, before, after, change: after - before }];
  });
}

/** A correction can have an older source timestamp; publication sequence orders delivery. */
export function acceptsSeatContext(
  previous: SharedSeatContext | null,
  next: SharedSeatContext,
) {
  return (
    coherentSeats(next) &&
    (!previous ||
      (next.election === previous.election &&
        (next.sequence > previous.sequence ||
          (next.sequence === previous.sequence &&
            Date.parse(next.updatedAt) >= Date.parse(previous.updatedAt)))))
  );
}

export function pinnedSeatHref(
  href: string,
  context: SharedSeatContext,
): string {
  const url = new URL(href, "https://www.israelielection.org");
  url.searchParams.set("context", context.revision);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function contextRoleTotals(
  context: SharedSeatContext,
  cabinet: Set<string>,
  roles: Record<string, "support" | "abstain">,
) {
  let yes = 0,
    no = 0,
    abstain = 0,
    cabinetSeats = 0;
  for (const [id, seats] of Object.entries(context.pointSeats)) {
    if (cabinet.has(id)) {
      yes += seats;
      cabinetSeats += seats;
    } else if (roles[id] === "support") yes += seats;
    else if (roles[id] === "abstain") abstain += seats;
    else no += seats;
  }
  return {
    yes,
    no,
    abstain,
    cabinet: cabinetSeats,
    complete: coherentSeats(context),
    passes: cabinetSeats > 0 && yes > no,
  };
}

/** Pivotal only within the displayed hypothetical vote, including unprofiled elected lists. */
export function contextVoteDependence(
  context: SharedSeatContext,
  cabinet: Set<string>,
  roles: Record<string, "support" | "abstain">,
) {
  if (!contextRoleTotals(context, cabinet, roles).passes) return [];
  return Object.keys(context.pointSeats)
    .filter((id) => cabinet.has(id) || roles[id] === "support")
    .filter((id) => {
      const remaining = new Set(cabinet);
      remaining.delete(id);
      const other = { ...roles };
      delete other[id];
      return !contextRoleTotals(context, remaining, other).passes;
    });
}
