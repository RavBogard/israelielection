import { cadenceFresh, cadenceMetadata } from "./cadence";
import forecast from "../../data/forecast.json";
import parties from "../../data/parties.json";
import {
  ELECTION,
  ELECTION_END,
  fingerprint,
  POLLS_CLOSE,
  validSeats,
} from "./core";
import type {
  ElectionLifecycleSnapshot,
  LifecycleLedger,
  PoliticalEvent,
  Politics,
  SharedSeatContext,
  SourceHealth,
} from "./types";
export function campaignContext(
  now = new Date().toISOString(),
): SharedSeatContext {
  const pointSeats = Object.fromEntries(
    Object.entries(forecast.lists).map(([id, l]) => [id, l.point]),
  );
  if (!validSeats(pointSeats))
    throw new Error("Saved campaign forecast is not a coherent parliament");
  const snapshotRevision = fingerprint(forecast),
    observedAt = forecast.generatedAt,
    revision = fingerprint({ basis: "campaign_forecast", snapshotRevision });
  return {
    schemaVersion: 1,
    election: ELECTION,
    revision,
    snapshotRevision,
    sequence: 0,
    updatedAt: observedAt,
    evidenceStage: "campaign",
    basis: "campaign_forecast",
    seatStatus: "estimated",
    pointMethod: "campaign_point",
    pointSeats,
    parties: parties.parties
      .filter((p) => p.id in pointSeats)
      .map((p) => ({ id: p.id, label: p.short, profiled: true, bloc: p.bloc })),
    sourceRefs: [
      {
        id: "campaign-forecast",
        publisher: "Israeli Election",
        title: forecast.final
          ? "Final campaign forecast"
          : "Saved provisional campaign forecast",
        url: "https://www.israelielection.org/forecast",
        authority: "model",
        publishedAt: observedAt,
        observedAt,
        captureHash: snapshotRevision,
      },
    ],
    publishedAt: observedAt,
    observedAt,
    correctionOf: null,
    freshness: {
      status: Date.parse(now) < Date.parse(POLLS_CLOSE) ? "current" : "waiting",
      checkedAt: null,
      lastAttemptAt: null,
    },
    reasonCodes: [
      Date.parse(now) < Date.parse(POLLS_CLOSE)
        ? "before_close"
        : "awaiting_exit",
    ],
  };
}
const mostRecent = (a: SharedSeatContext, b: SharedSeatContext) =>
  Date.parse(b.publishedAt ?? b.observedAt) -
    Date.parse(a.publishedAt ?? a.observedAt) ||
  b.sequence - a.sequence ||
  b.revision.localeCompare(a.revision);
export function selectSeats(
  snapshots: SharedSeatContext[],
  now: string,
  prior?: SharedSeatContext | null,
): SharedSeatContext {
  const compatible = (s: SharedSeatContext) =>
    s.schemaVersion === 1 &&
    s.election === ELECTION &&
    validSeats(s.pointSeats) &&
    Date.parse(s.observedAt) <= Date.parse(now);
  const valid = snapshots.filter(compatible);
  const official = valid
    .filter(
      (s) =>
        s.basis === "official_seats" &&
        s.seatStatus === "official" &&
        Date.parse(now) >= Date.parse(POLLS_CLOSE),
    )
    .at(-1);
  if (official) return official;
  if (
    prior?.basis === "official_seats" &&
    compatible(prior) &&
    Date.parse(now) >= Date.parse(POLLS_CLOSE)
  )
    return prior;
  if (Date.parse(now) >= Date.parse(POLLS_CLOSE)) {
    const projection = valid
      .filter(
        (s) =>
          s.basis === "live_projection" &&
          s.pointMethod === "representative_joint_draw",
      )
      .sort(mostRecent)[0];
    const exit = valid
      .filter((s) => s.basis === "named_exit")
      .sort(mostRecent)[0];
    if (projection && exit)
      return mostRecent(projection, exit) <= 0 ? projection : exit;
    if (projection || exit) return projection ?? exit!;
  }
  const savedCampaign = valid
    .filter((s) => s.basis === "campaign_forecast")
    .sort(mostRecent)[0];
  if (savedCampaign) return savedCampaign;
  return prior &&
    prior.basis !== "partial_count" &&
    compatible(prior) &&
    (prior.basis === "campaign_forecast" ||
      Date.parse(now) >= Date.parse(POLLS_CLOSE))
    ? prior
    : campaignContext(now);
}
/** Public current politics is regenerated from the internal ledger on every read. Never serialize withheld records. */
export function publicPolitics(
  events: PoliticalEvent[],
  health: SourceHealth[],
  now: string,
): Politics {
  const good = new Set(
    health
      .filter(
        (h) =>
          h.status === "healthy" &&
          cadenceFresh(
            now,
            h.lastSuccessfulAt ?? h.checkedAt,
            h.checkedAt,
            h.status !== "healthy",
          ),
      )
      .map((h) => h.sourceId),
  );
  const active = events.filter(
    (e) =>
      e.election === ELECTION &&
      e.status === "confirmed" &&
      Date.parse(e.effectiveAt) <= Date.parse(now) &&
      e.sources.length &&
      e.sources.every((s) => good.has(s.id)),
  );
  // Supersession applies even if the correcting source is unavailable: never revive an older claim.
  const superseded = new Set(
    events.map((e) => e.supersedes).filter((s): s is string => !!s),
  );
  const visible = active
    .filter((e) => !superseded.has(e.id))
    .sort((a, b) => Date.parse(a.effectiveAt) - Date.parse(b.effectiveAt));
  const mandate = visible.filter((e) => e.type === "mandate").at(-1);
  const persons = [
    ...new Set(
      visible
        .filter(
          (e) =>
            e.person &&
            [
              "mandate",
              "recommendation",
              "confidence_commitment",
              "party_position",
            ].includes(e.type),
        )
        .map((e) => e.person!),
    ),
  ];
  const proposals = persons.map((person) => {
    const id = fingerprint({ person });
    const decisions = parties.parties.map((p) => {
      const e = visible
        .filter(
          (e) =>
            e.person === person &&
            ((e.type === "party_position" &&
              e.positionScope === "confidence") ||
              e.type === "confidence_commitment") &&
            e.partyIds.includes(p.id),
        )
        .at(-1);
      return {
        partyId: p.id,
        decision: e?.decision ?? ("undecided" as const),
        sourceEventIds: e ? [e.id] : [],
      };
    });
    return { id, person, decisions };
  });
  let activeProposalId = mandate?.person
    ? fingerprint({ person: mandate.person })
    : null;
  let decisions =
    proposals.find((p) => p.id === activeProposalId)?.decisions ??
    parties.parties.map((p) => ({
      partyId: p.id,
      decision: "undecided" as const,
      sourceEventIds: [],
    }));
  let clock: Politics["clock"] = null;
  if (mandate?.mandateKind) {
    const baseDays = mandate.mandateKind === "final" ? 14 : 28;
    const raw = visible.filter(
      (e) =>
        e.type === "extension" &&
        e.person === mandate.person &&
        Date.parse(e.effectiveAt) >= Date.parse(mandate.effectiveAt),
    );
    const extensions = [
      ...new Map(
        raw.map((e) => [
          fingerprint({
            date: e.effectiveAt,
            person: e.person,
            duration: e.durationDays,
            mode: e.extensionMode,
          }),
          e,
        ]),
      ).values(),
    ];
    let extra = 0;
    const usable =
      mandate.mandateKind === "first" &&
      extensions.every(
        (e) => e.extensionMode && e.durationDays != null && e.durationDays > 0,
      );
    if (usable)
      for (const e of extensions)
        extra =
          e.extensionMode === "total"
            ? e.durationDays!
            : extra + e.durationDays!;
    if ((!extensions.length || usable) && extra <= 14)
      clock = {
        kind: extensions.length ? "extension" : "mandate",
        anchorAt: mandate.effectiveAt,
        deadlineAt: new Date(
          Date.parse(mandate.effectiveAt) + (baseDays + extra) * 86400000,
        ).toISOString(),
        sourceEventIds: [mandate.id, ...extensions.map((e) => e.id)],
        holder: mandate.person,
      };
  }
  if (
    mandate &&
    visible.some(
      (e) =>
        e.type === "confidence_vote" &&
        e.person === mandate.person &&
        e.voteOutcome &&
        Date.parse(e.effectiveAt) >= Date.parse(mandate.effectiveAt),
    )
  )
    clock = null;
  const transitionTypes = new Set([
    "mandate",
    "government_formed",
    "mandate_returned",
    "mandate_failed",
    "government_ended",
    "election_called",
  ]);
  const transitionLog = events
    .filter(
      (e) =>
        e.election === ELECTION &&
        ["confirmed", "disputed"].includes(e.status) &&
        !superseded.has(e.id) &&
        transitionTypes.has(e.type) &&
        (!mandate ||
          !["mandate_returned", "mandate_failed"].includes(e.type) ||
          (e.person === mandate.person &&
            Date.parse(e.effectiveAt) >= Date.parse(mandate.effectiveAt))) &&
        Date.parse(e.effectiveAt) <= Date.parse(now),
    )
    .sort((a, b) => Date.parse(a.effectiveAt) - Date.parse(b.effectiveAt));
  const latestTransition = transitionLog.at(-1);
  const qualifiedTransition =
    latestTransition && visible.some((e) => e.id === latestTransition.id)
      ? latestTransition
      : null;
  const formationState: NonNullable<Politics["formationState"]> =
    latestTransition && !qualifiedTransition
      ? "unknown"
      : qualifiedTransition?.type === "government_formed"
        ? "governing"
        : qualifiedTransition?.type === "government_ended"
          ? "government_ended"
          : qualifiedTransition?.type === "election_called"
            ? "new_election"
            : qualifiedTransition &&
                ["mandate_returned", "mandate_failed"].includes(
                  qualifiedTransition.type,
                )
              ? "attempt_ended"
              : mandate
                ? "forming"
                : "awaiting_assignment";
  const formed = formationState === "governing";
  if (
    ["unknown", "attempt_ended", "government_ended", "new_election"].includes(
      formationState,
    )
  ) {
    clock = null;
    activeProposalId = null;
    decisions = parties.parties.map((p) => ({
      partyId: p.id,
      decision: "undecided" as const,
      sourceEventIds: [],
    }));
  }
  if (formed) clock = null;
  const withheldCount =
    events.filter(
      (e) =>
        (e.status === "confirmed" || e.status === "disputed") &&
        !superseded.has(e.id),
    ).length - visible.length;
  return {
    formationState,
    activeProposalId,
    proposals,
    activeStages: [...new Set(visible.map((e) => e.type))],
    events: visible,
    decisions,
    clock,
    withheldCount: Math.max(0, withheldCount),
    status:
      formationState === "unknown"
        ? "source_unavailable"
        : formed
          ? "formed"
          : visible.length
            ? "active"
            : withheldCount
              ? "source_unavailable"
              : "waiting",
  };
}
export function resolveLifecycle(
  ledger: LifecycleLedger,
  now = new Date().toISOString(),
): ElectionLifecycleSnapshot {
  const seats = selectSeats(
    ledger.seatSnapshots,
    now,
    ledger.current?.seatContext,
  );
  const complete =
    seats.seatStatus === "official" ||
    Date.parse(now) >= Date.parse(ELECTION_END);
  const reasonCodes = [...seats.reasonCodes];
  const matching = ledger.health.filter((h) =>
    seats.sourceRefs.some((s) => s.id === h.sourceId),
  );
  const unavailable = matching.some(
    (h) =>
      (h.status !== "healthy" && h.status !== "complete") ||
      (h.status === "healthy" &&
        !cadenceFresh(now, h.lastSuccessfulAt ?? h.checkedAt, h.checkedAt)),
  );
  const checkedAt =
    matching
      .map((h) => h.checkedAt)
      .sort()
      .at(-1) ?? seats.freshness.checkedAt;
  const lastAttemptAt = checkedAt;
  const seatContext = {
    ...seats,
    freshness: {
      status:
        seats.seatStatus === "official"
          ? ("complete" as const)
          : unavailable
            ? ("stale" as const)
            : complete
              ? ("complete" as const)
              : seats.freshness.status,
      checkedAt,
      lastAttemptAt,
    },
    reasonCodes: [
      ...new Set([
        ...reasonCodes,
        ...(unavailable
          ? [
              seats.seatStatus === "official"
                ? ("official_retained" as const)
                : ("source_unavailable" as const),
            ]
          : []),
        ...(complete ? ["completed_archive" as const] : []),
      ]),
    ],
  };
  const politics = publicPolitics(ledger.events, ledger.health, now);
  if (
    !politics.clock &&
    !politics.events.some(
      (e) => e.type === "mandate" || e.type === "government_formed",
    ) &&
    !ledger.events.some(
      (e) =>
        e.type === "mandate" &&
        e.status !== "retracted" &&
        e.status !== "superseded",
    ) &&
    seats.seatStatus === "official" &&
    seats.statutoryPublication &&
    !unavailable &&
    Date.parse(now) <
      Date.parse(seats.statutoryPublication.publishedOn) + 8 * 86400000
  )
    politics.clock = {
      kind: "publication_to_assignment",
      anchorAt: seats.statutoryPublication.publishedOn,
      deadlineAt: new Date(
        Date.parse(seats.statutoryPublication.publishedOn) + 7 * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      sourceEventIds: [`cec-publication:${seats.revision}`],
      holder: null,
    };
  const alternatives = ledger.seatSnapshots
    .filter((s) => validSeats(s.pointSeats))
    .map((s) => ({
      revision: s.revision,
      basis: s.basis,
      publishedAt: s.publishedAt,
      labelKey: s.basis,
      sourceRefs: s.sourceRefs,
    }));
  const archive = {
    electionForecast: complete ? ("complete" as const) : ("active" as const),
    completedAt: complete
      ? seats.seatStatus === "official"
        ? seats.observedAt
        : ELECTION_END
      : null,
  };
  const revision = fingerprint({
    seatRevision: seats.revision,
    politics,
    archive,
    geographyRevision: ledger.geography?.revision ?? null,
  });
  return {
    cadence: cadenceMetadata(
      now,
      ledger.health
        .filter((h) => h.status === "healthy")
        .map((h) => h.lastSuccessfulAt ?? h.checkedAt)
        .sort()
        .at(-1) ?? null,
      ledger.health
        .map((h) => h.checkedAt)
        .sort()
        .at(-1) ?? null,
      ledger.health.length > 0 &&
        ledger.health.every(
          (h) =>
            (h.status !== "healthy" && h.status !== "complete") ||
            (h.status === "healthy" &&
              !cadenceFresh(
                now,
                h.lastSuccessfulAt ?? h.checkedAt,
                h.checkedAt,
              )),
        ),
    ),
    selection: {
      mode: "current",
      seatRevision: seatContext.revision,
      politics: "current",
    },
    schemaVersion: 1,
    election: ELECTION,
    revision,
    sequence: ledger.current?.sequence ?? 0,
    updatedAt:
      ledger.current?.revision === revision ? ledger.current.updatedAt : now,
    seatContext,
    alternatives,
    politics,
    health: ledger.health,
    archive,
    geographyRevision: ledger.geography?.revision ?? null,
  };
}
export function emptyLedger(): LifecycleLedger {
  return {
    extractionCache: {},
    seatSnapshots: [campaignContext()],
    events: [],
    health: [],
    captures: [],
    current: null,
    geography: null,
  };
}
