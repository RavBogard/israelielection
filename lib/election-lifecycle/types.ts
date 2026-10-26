import type { CadenceMetadata } from "./cadence";
export type EvidenceStage = "campaign" | "exit" | "counting" | "official";
export type SeatBasis =
  | "campaign_forecast"
  | "named_exit"
  | "live_projection"
  | "partial_count"
  | "official_seats";
export type PointMethod =
  | "campaign_point"
  | "published_named_exit"
  | "representative_joint_draw"
  | "partial_count_allocation"
  | "published_official_allocation";
export type ReasonCode =
  | "before_close"
  | "awaiting_exit"
  | "source_unavailable"
  | "source_invalid"
  | "source_conflict"
  | "count_projection_gated"
  | "official_retained"
  | "completed_archive"
  | "pinned_unavailable"
  | "disabled"
  | "unknown_party"
  | "awaiting_official";
export type Authority =
  "cec" | "president" | "knesset" | "party" | "joint" | "broadcaster" | "model";
export type SourceRef = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  authority: Authority;
  publishedAt: string | null;
  observedAt: string;
  captureHash: string;
  partyIds?: string[];
};
export type ProviderFailureCategory =
  | "provider_auth"
  | "provider_billing"
  | "provider_quota"
  | "provider_schema"
  | "provider_model"
  | "provider_transient"
  | "provider_request"
  | "provider_unconfigured";
export type SourceHealth = {
  sourceId: string;
  authority: Authority;
  status: "healthy" | "unavailable" | "invalid" | "disputed" | "complete";
  checkedAt: string;
  lastSuccessfulAt: string | null;
  reason: ReasonCode | null;
  diagnostic?: {
    stage: "extraction";
    code: ProviderFailureCategory;
    httpStatus: number | null;
    providerStatus: string | null;
  };
};
export type Interval = { lo: number; median: number; hi: number };
export type SharedSeatContext = {
  schemaVersion: 1;
  election: string;
  revision: string;
  snapshotRevision: string;
  sequence: number;
  updatedAt: string;
  evidenceStage: EvidenceStage;
  basis: SeatBasis;
  seatStatus: "estimated" | "provisional" | "official";
  pointMethod: PointMethod;
  pointSeats: Record<string, number>;
  parties: {
    id: string;
    label: string;
    profiled: boolean;
    letters?: string;
    bloc?: string;
  }[];
  sourceRefs: SourceRef[];
  publishedAt: string | null;
  observedAt: string;
  correctionOf: string | null;
  uncertainty?: {
    snapshotRevision: string;
    intervalLevel: 0.8;
    partyIntervals: Record<string, Interval>;
    jointPoint: {
      method: PointMethod;
      snapshotRevision: string;
      drawIndex?: number;
    };
  };
  freshness: {
    status: "current" | "waiting" | "stale" | "complete";
    checkedAt: string | null;
    lastAttemptAt: string | null;
  };
  reasonCodes: ReasonCode[];
  officialVotes?: { valid: number; byParty: Record<string, number> };
  statutoryPublication?: {
    publishedOn: string;
    source: SourceRef;
    evidenceQuote: string;
  };
};
export type EventType =
  | "talks"
  | "party_position"
  | "consultation"
  | "recommendation"
  | "mandate"
  | "extension"
  | "agreement"
  | "confidence_commitment"
  | "confidence_vote"
  | "government_formed"
  | "mandate_returned"
  | "mandate_failed"
  | "government_ended"
  | "election_called";
export type PartyDecision =
  "cabinet" | "support" | "abstain" | "oppose" | "undecided";
export type PoliticalEvent = {
  id: string;
  revision: string;
  claimKey: string;
  type: EventType;
  election: string;
  effectiveAt: string;
  publishedAt: string | null;
  observedAt: string;
  partyIds: string[];
  person: string | null;
  decision: PartyDecision | null;
  positionScope?: "cabinet" | "confidence" | "recommendation";
  proposalId?: string | null;
  mandateKind?: "first" | "second" | "final" | null;
  extensionMode?: "additional" | "total" | null;
  voteOutcome?: "passed" | "failed" | null;
  durationDays: number | null;
  status: "confirmed" | "reported" | "disputed" | "superseded" | "retracted";
  sources: SourceRef[];
  evidenceQuote: string;
  supersedes: string | null;
  templateKey: EventType;
};
export type FormationClock = {
  kind: "publication_to_assignment" | "mandate" | "extension";
  anchorAt: string;
  deadlineAt: string;
  sourceEventIds: string[];
  holder: string | null;
};
export type ProposalDecision = {
  partyId: string;
  decision: PartyDecision;
  sourceEventIds: string[];
};
export type Politics = {
  formationState?: "awaiting_assignment"|"forming"|"attempt_ended"|"governing"|"government_ended"|"new_election"|"unknown";
  activeProposalId: string | null;
  proposals: { id: string; person: string; decisions: ProposalDecision[] }[];
  activeStages: EventType[];
  events: PoliticalEvent[];
  decisions: {
    partyId: string;
    decision: PartyDecision;
    sourceEventIds: string[];
  }[];
  clock: FormationClock | null;
  withheldCount: number;
  status: "waiting" | "active" | "formed" | "source_unavailable";
};
export type Alternative = {
  revision: string;
  basis: SeatBasis;
  publishedAt: string | null;
  labelKey: SeatBasis;
  sourceRefs: SourceRef[];
};
export type ElectionLifecycleSnapshot = {
  cadence?: CadenceMetadata;
  selection: {
    mode: "current" | "pinned";
    seatRevision: string;
    politics: "current";
  };
  schemaVersion: 1;
  election: string;
  revision: string;
  sequence: number;
  updatedAt: string;
  seatContext: SharedSeatContext;
  alternatives: Alternative[];
  politics: Politics;
  health: SourceHealth[];
  archive: {
    electionForecast: "active" | "complete";
    completedAt: string | null;
  };
  geographyRevision: string | null;
};
export type SeatContextResult =
  | {
      state: "ready";
      context: SharedSeatContext;
      lifecycle: ElectionLifecycleSnapshot;
    }
  | {
      state: "unavailable";
      reason: "pinned_unavailable" | "source_unavailable";
      revision: string;
    };
export type LifecycleSelection = { revision?: string };
/** Internal only; never serialize this ledger as the current public politics payload. */
export type LifecycleLedger = {
  briefings?: {
    date: string;
    generatedAt: string;
    seatRevision: string;
    eventIds: string[];
  }[];
  extractionCache: Record<string, string>;
  extractionPending?: string[];
  seatSnapshots: SharedSeatContext[];
  events: PoliticalEvent[];
  health: SourceHealth[];
  captures: {
    source: SourceRef;
    body: string;
    importAudit?: {
      operator: string;
      capturedAt: string;
      sourceUrl: string;
      target: string;
      kind: "captured_primary";
    };
  }[];
  current: ElectionLifecycleSnapshot | null;
  geography: GeographySnapshot | null;
};
export type GeographySnapshot = {
  schemaVersion: 1;
  election: string;
  revision: string;
  observedAt: string;
  source: SourceRef;
  complete: boolean;
  coverage: "unknown" | "documented_complete";
  lists: { id: string; letters: string; name: string }[];
  rows: {
    code: number;
    eligible: number;
    voted: number;
    valid: number;
    votes: Record<string, number>;
  }[];
  envelopes: { valid: number; votes: Record<string, number> };
  totals: { eligible: number; voted: number; valid: number };
  officialSeatRevision: string | null;
};
