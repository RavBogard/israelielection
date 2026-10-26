import parties from "../../data/parties.json";
import heNames from "../../data/he/parties.json";
import { ELECTION, fingerprint, iso, POLLS_CLOSE } from "./core";
import { textOf } from "./html";
import type { EventType, PoliticalEvent, SourceRef } from "./types";
export type EventCandidate = {
  type: EventType;
  effectiveAt: string;
  partyIds: string[];
  person: string | null;
  decision: PoliticalEvent["decision"];
  positionScope?: PoliticalEvent["positionScope"];
  mandateKind?: PoliticalEvent["mandateKind"];
  extensionMode?: PoliticalEvent["extensionMode"];
  voteOutcome?: PoliticalEvent["voteOutcome"];
  durationDays: number | null;
  evidenceQuote: string;
  supersedes: string | null;
};
const he = heNames as Record<
  string,
  { name?: { text: string }; short?: { text: string } }
>;
const action: Record<EventType, RegExp> = {
  mandate_returned: /returned.{0,50}mandate|mandate.{0,50}returned|החזיר.{0,30}מנדט|החזירה.{0,30}מנדט/i,
  mandate_failed: /failed to form|unable to form|לא הצליח.{0,30}להרכיב|לא עלה ביד.{0,30}להרכיב/i,
  government_ended: /government.{0,50}(?:ended|resigned|dissolved)|הממשלה.{0,30}(?:התפטרה|סיימה|נפלה)/i,
  election_called: /elections?.{0,60}(?:called|scheduled|approved)|(?:called|scheduled).{0,40}elections?|בחירות.{0,40}(?:נקבעו|הוקדמו)|(?:אישרה|אישר).{0,40}בחירות/i,
  talks: /talks|negotiat|שיחות|משא ומתן/i,
  party_position:
    /will|support|join|oppose|נתמוך|נצביע|נשב|ניכנס|לא.*נשב|לא.*ניכנס/i,
  consultation: /consult|התייעצ/i,
  recommendation: /recommend|המליצ|ממליצ/i,
  mandate: /assign|task.*form|הטיל|מטיל/i,
  extension: /extend|extension|האריכ|האריך|הארכה/i,
  agreement: /signed|נחתם|חתמו|חתם/i,
  confidence_commitment: /confidence|אמון/i,
  confidence_vote: /confidence|אמון/i,
  government_formed: /sworn|swearing|constituted|הושבע|כוננה|כינון הממשלה/i,
};
const allowed: Record<EventType, SourceRef["authority"][]> = {
  mandate_returned: ["president"],
  mandate_failed: ["president"],
  government_ended: ["knesset"],
  election_called: ["knesset", "cec"],
  talks: ["president", "knesset", "party", "joint"],
  party_position: ["party", "joint"],
  consultation: ["president"],
  recommendation: ["president", "party"],
  mandate: ["president"],
  extension: ["president"],
  agreement: ["knesset", "joint"],
  confidence_commitment: ["party", "joint"],
  confidence_vote: ["knesset"],
  government_formed: ["knesset"],
};
/** Extraction is untrusted. Exact original evidence, actor/date checks and type-specific authority are mandatory. */
export function validateEvent(
  candidate: EventCandidate,
  source: SourceRef,
  article: string,
  now: string,
): PoliticalEvent | null {
  const c = candidate;
  if (
    !c ||
    !Object.hasOwn(allowed, c.type) ||
    !allowed[c.type].includes(source.authority) ||
    !iso(c.effectiveAt) ||
    Date.parse(c.effectiveAt) > Date.parse(now) ||
    Date.parse(c.effectiveAt) < Date.parse(POLLS_CLOSE) - 86400000
  )
    return null;
  if (
    (c.positionScope != null &&
      !["cabinet", "confidence", "recommendation"].includes(c.positionScope)) ||
    (c.mandateKind != null &&
      !["first", "second", "final"].includes(c.mandateKind)) ||
    (c.extensionMode != null &&
      !["additional", "total"].includes(c.extensionMode)) ||
    (c.voteOutcome != null && !["passed", "failed"].includes(c.voteOutcome))
  )
    return null;
  const quote = textOf(c.evidenceQuote ?? ""),
    body = textOf(article);
  if (
    quote.length < 30 ||
    quote.length > 2500 ||
    !body.includes(quote) ||
    !action[c.type].test(quote) ||
    /\b(?:may|might|could|expected to|will be assigned)\b|עשוי|צפוי|ייתכן|אם י|טרם/i.test(
      quote,
    )
  )
    return null;
  // An extraction may not turn an undated sentence into a dated event.
  const occurredTypes = [
    "mandate",
    "extension",
    "agreement",
    "confidence_vote",
    "government_formed",
    "mandate_returned", "mandate_failed", "government_ended", "election_called",
  ];
  if (
    occurredTypes.includes(c.type) &&
    /will be|will sign|to be sworn|no agreement|not signed|not sworn|did not vote|no vote|לא נחתם|לא הושבע|לא הצביע|תושבע|יושבע|ייחתם|יחתמו|יוארך/i.test(
      quote,
    )
  )
    return null;
  const mentionedYears = [...quote.matchAll(/\b(20\d{2})\b/g)].map((m) =>
    Number(m[1]),
  );
  if (
    mentionedYears.some((year) => year < 2026) &&
    !mentionedYears.includes(2026)
  )
    return null;
  if (
    !["party_position", "confidence_commitment"].includes(c.type) &&
    (c.decision !== null || c.positionScope != null)
  )
    return null;
  if (c.type !== "mandate" && c.mandateKind != null) return null;
  if (
    c.type !== "extension" &&
    (c.durationDays !== null || c.extensionMode != null)
  )
    return null;
  const day = c.effectiveAt.slice(0, 10);
  const [year, month, date] = day.split("-");
  const explicit = [
    day,
    `${Number(date)}.${Number(month)}.${year}`,
    `${date}.${month}.${year}`,
    `${Number(date)}/${Number(month)}/${year}`,
  ].some((d) => quote.includes(d));
  if (
    (!source.publishedAt || day !== source.publishedAt.slice(0, 10)) &&
    !explicit
  )
    return null;
  if (
    !Array.isArray(c.partyIds) ||
    new Set(c.partyIds).size !== c.partyIds.length
  )
    return null;
  for (const id of c.partyIds) {
    const p = parties.parties.find((p) => p.id === id);
    if (!p) return null;
    const aliases = [
      p.name,
      p.short,
      he[id]?.name?.text,
      he[id]?.short?.text,
    ].filter((s): s is string => !!s);
    if (!aliases.some((a) => quote.includes(a))) return null;
  }
  if (
    source.authority === "party" &&
    (!c.partyIds.length ||
      c.partyIds.some((id) => !source.partyIds?.includes(id)))
  )
    return null;
  if (
    ["mandate", "extension", "mandate_returned", "mandate_failed"].includes(c.type) &&
    (!c.person || !quote.includes(c.person))
  )
    return null;
  if (
    c.type === "extension" &&
    (!Number.isInteger(c.durationDays) ||
      c.durationDays! <= 0 ||
      c.durationDays! > 14 ||
      !quote.includes(String(c.durationDays)))
  )
    return null;
  if (
    c.type === "mandate" &&
    !/form.*government|government.*form|הרכבת הממשלה/i.test(quote)
  )
    return null;
  if (
    c.type === "agreement" &&
    (c.partyIds.length < 2 || !/(?:coalition|קואליציונ)/i.test(quote))
  )
    return null;
  if (
    c.decision &&
    !["cabinet", "support", "abstain", "oppose", "undecided"].includes(
      c.decision,
    )
  )
    return null;
  if (c.type === "confidence_commitment" && !c.partyIds.length) return null;
  if (
    c.type === "confidence_vote" &&
    !/voted|vote.*(?:passed|approved|rejected)|הצביע|אישרה|אישר|בעד|נגד/i.test(
      quote,
    )
  )
    return null;
  if (c.person && !quote.includes(c.person)) return null;
  if (c.type === "confidence_commitment" && !c.person) return null;
  if (c.positionScope === "cabinet" && c.decision === "oppose") return null;
  if (c.type === "mandate" && c.mandateKind) {
    const labels = {
      first: /first|ראשו/i,
      second: /second|שני/i,
      final: /final|14.day|14 ימים|אחרו/i,
    };
    if (!labels[c.mandateKind]?.test(quote)) return null;
  }
  if (c.type === "extension" && c.extensionMode) {
    const mode =
      c.extensionMode === "additional" ? /additional|נוספ/i : /total|בסך|בסה/i;
    if (!mode.test(quote)) return null;
  }
  if (c.decision && c.decision !== "undecided") {
    const language = {
      support: /support|vote for|נתמוך|נצביע בעד|תומכ/i,
      oppose: /oppose|vote against|נצביע נגד|מתנגד/i,
      abstain: /abstain|נימנע|נמנע/i,
      cabinet:
        /join.{0,30}government|government.{0,30}join|נשב.{0,30}ממשל|ניכנס.{0,30}ממשל|בקואליציה/i,
    };
    if (!language[c.decision].test(quote)) return null;
    if (
      (c.decision === "support" || c.decision === "cabinet") &&
      /not support|won.t support|not join|לא נתמוך|לא נשב|לא ניכנס|נצביע נגד|oppose/i.test(
        quote,
      )
    )
      return null;
  }
  if (c.type !== "confidence_vote" && c.voteOutcome != null) return null;
  if (
    c.voteOutcome === "passed" &&
    !/passed|approved|accepted|הביעה אמון|אישרה|אישר/i.test(quote)
  )
    return null;
  if (
    c.voteOutcome === "failed" &&
    !/rejected|failed|לא הביעה|לא זכתה/i.test(quote)
  )
    return null;
  const stable = {
    type: c.type,
    election: ELECTION,
    effectiveAt: c.effectiveAt,
    partyIds: [...c.partyIds].sort(),
    person: c.person,
    decision: c.decision,
    positionScope: c.positionScope,
    proposalId: c.person ? fingerprint({ person: c.person }) : null,
    mandateKind: c.mandateKind ?? null,
    extensionMode: c.extensionMode ?? null,
    voteOutcome: c.voteOutcome ?? null,
    durationDays: c.durationDays,
  };
  const revision = fingerprint({
      ...stable,
      quote,
      sourceHash: source.captureHash,
    }),
    id = revision,
    claimKey = fingerprint({
      type: c.type,
      partyIds: stable.partyIds,
      person: c.person,
      effectiveAt: c.effectiveAt,
      sourceId: source.id,
      scope: c.positionScope,
    });
  return {
    ...stable,
    id,
    revision,
    claimKey,
    publishedAt: source.publishedAt,
    observedAt: source.observedAt,
    status: "confirmed",
    sources: [source],
    evidenceQuote: quote,
    supersedes:
      c.supersedes &&
      /^[a-f0-9]{64}$/.test(c.supersedes) &&
      /retract|reverse|withdraw|changed|instead|חזר|חזרה|חוזר|במקום|שינה|שינתה|ביטל|מבטל/i.test(
        quote,
      )
        ? c.supersedes
        : null,
    templateKey: c.type,
  };
}
/** Contradictory current statements from the same actor/time are withheld until an explicit correction resolves them. */
export function mergeEvents(
  previous: PoliticalEvent[],
  incoming: PoliticalEvent[],
): PoliticalEvent[] {
  const identity = (e: PoliticalEvent) =>
    fingerprint({
      type: e.type,
      parties: e.partyIds,
      person: e.person,
      scope: e.positionScope,
    });
  const out = previous.map((e) => ({ ...e }));
  for (const event0 of incoming) {
    const event = { ...event0 };
    if (
      out.some(
        (e) =>
          e.revision === event.revision ||
          (identity(e) === identity(event) &&
            e.decision === event.decision &&
            e.evidenceQuote === event.evidenceQuote),
      )
    )
      continue;
    if (event.supersedes) {
      const target = out.find((e) => e.id === event.supersedes);
      if (
        !target ||
        identity(target) !== identity(event) ||
        Date.parse(event.effectiveAt) < Date.parse(target.effectiveAt) ||
        !/retract|reverse|withdraw|changed|instead|חזר|חזרה|חוזר|במקום|שינה|שינתה|ביטל|מבטל/i.test(
          event.evidenceQuote,
        )
      )
        event.supersedes = null;
      else
        for (const old of out)
          if (
            identity(old) === identity(event) &&
            Date.parse(old.effectiveAt) <= Date.parse(event.effectiveAt)
          )
            old.status = "superseded";
    }
    out.push(event);
  }
  const current = out.filter(
    (e) => e.status === "confirmed" || e.status === "disputed",
  );
  for (const e of current) {
    const conflict = current.some(
      (other) =>
        other.id !== e.id &&
        identity(other) === identity(e) &&
        other.decision !== e.decision,
    );
    if (conflict) e.status = "disputed";
  }
  return out;
}
