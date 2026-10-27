import { expect, it } from "vitest";
import {
  validateEvent,
  type EventCandidate,
} from "../election-lifecycle/events";
import { publicPolitics } from "../election-lifecycle/resolver";
import type {
  PoliticalEvent,
  SourceRef,
  SourceHealth,
} from "../election-lifecycle/types";
const now = "2026-11-04T12:00:00Z";
const source: SourceRef = {
  id: "president:fixture",
  publisher: "President",
  title: "Fixture",
  url: "https://www.president.gov.il/fixture",
  authority: "president",
  publishedAt: now,
  observedAt: now,
  captureHash: "a".repeat(64),
};
const health = (ref: SourceRef): SourceHealth => ({
  sourceId: ref.id,
  authority: ref.authority,
  status: "healthy",
  checkedAt: now,
  lastSuccessfulAt: now,
  reason: null,
});
const candidate = (
  type: EventCandidate["type"],
  quote: string,
): EventCandidate => ({
  type,
  effectiveAt: now,
  partyIds: [],
  person: "Test Person",
  decision: null,
  durationDays: null,
  evidenceQuote: quote,
  supersedes: null,
});
it("accepts only a sourced completed mandate outcome, never a predicted or party-asserted failure", () => {
  const quote =
    "Test Person returned the mandate to form a government on 2026-11-04.";
  expect(
    validateEvent(candidate("mandate_returned", quote), source, quote, now)
      ?.type,
  ).toBe("mandate_returned");
  expect(
    validateEvent(
      candidate("mandate_returned", quote),
      { ...source, authority: "party", partyIds: [] },
      quote,
      now,
    ),
  ).toBeNull();
  const hypothetical =
    "Test Person may have returned the mandate to form a government on 2026-11-04.";
  expect(
    validateEvent(
      candidate("mandate_returned", hypothetical),
      source,
      hypothetical,
      now,
    ),
  ).toBeNull();
  expect(
    validateEvent(
      { ...candidate("mandate_returned", quote), decision: "cabinet" },
      source,
      quote,
      now,
    ),
  ).toBeNull();
});
it("stops an ended attempt clock and never resurrects an old government when a newer end is withheld", () => {
  const quote =
    "Test Person returned the mandate to form a government on 2026-11-04.";
  const ended = validateEvent(
    candidate("mandate_returned", quote),
    source,
    quote,
    now,
  )!;
  const mandate = {
    ...ended,
    id: "mandate",
    type: "mandate",
    effectiveAt: "2026-11-03T12:00:00Z",
    mandateKind: "first",
  } as PoliticalEvent;
  const result = publicPolitics([mandate, ended], [health(source)], now);
  expect(result.formationState).toBe("attempt_ended");
  expect(result.clock).toBeNull();
  expect(result.activeProposalId).toBeNull();
  expect(
    publicPolitics(
      [mandate, { ...ended, id: "other-person", person: "Other Person" }],
      [health(source)],
      now,
    ).formationState,
  ).toBe("forming");
  const knesset = {
    ...source,
    id: "knesset:fixture",
    authority: "knesset" as const,
  };
  const formed = {
    ...mandate,
    id: "formed",
    type: "government_formed",
    sources: [knesset],
  } as PoliticalEvent;
  const endedGovernment = {
    ...ended,
    id: "ended",
    type: "government_ended",
    sources: [knesset],
  } as PoliticalEvent;
  const unavailable = {
    ...health(knesset),
    status: "unavailable" as const,
    lastSuccessfulAt: null,
  };
  expect(
    publicPolitics([formed, endedGovernment], [unavailable], now),
  ).toMatchObject({
    formationState: "unknown",
    status: "source_unavailable",
    clock: null,
  });
});
