import type { ElectionLifecycleSnapshot } from "./types";
export function phaseBriefingGuidance(
  snapshot: ElectionLifecycleSnapshot | null,
) {
  if (!snapshot)
    return "Lifecycle source status is unavailable. Do not assume that the site is still in the campaign, that official results were published, or that a government formed. Use dated headline attribution; missing authoritative confirmation remains unknown. Treat formation claims as attributed unconfirmed reporting, never infer agreement, confidence or an installed government.";
  const topic =
    snapshot.politics.status === "formed"
      ? "representation, the recorded government and policy consequences"
      : snapshot.seatContext.seatStatus === "official"
        ? "published representation, coalition scenarios and sourced formation developments"
        : snapshot.seatContext.evidenceStage === "campaign"
          ? "campaign developments and voter-relevant events"
          : "validated exit estimates, the incomplete count and attributed coalition talks";
  return `Current context revision ${snapshot.revision}; seat basis ${snapshot.seatContext.basis}; official seats ${snapshot.seatContext.seatStatus === "official"}; source freshness ${snapshot.seatContext.freshness.status}. Lead with ${topic}. Historical polls/forecasts remain historical after voting. Do not state unresolved election probabilities after official seats. Confirmed visible political event references: ${JSON.stringify(snapshot.politics.events.map((e) => ({ id: e.id, type: e.type, partyIds: e.partyIds, person: e.person, decision: e.decision, positionScope: e.positionScope, effectiveAt: e.effectiveAt, sourceUrls: e.sources.map((s) => s.url) })))}. This context selects framing; every published sentence still needs its numbered headline evidence. A headline alone never confirms a mandate, agreement, confidence commitment or cast vote not confirmed in this visible context: keep such reporting attributed and unconfirmed. Talks are not agreement; recommendation is not confidence; commitment is not a cast vote; agreement is not an installed government. Do not reconstruct or present withheld, disputed or withdrawn claims as confirmed. Unknown decisions stay unknown.`;
}
