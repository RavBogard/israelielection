type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectValue)
    : {};
const primitive = (value: unknown) =>
  value === null || ["string", "number", "boolean"].includes(typeof value);
function fields(value: unknown, keys: string[]) {
  const row = object(value);
  return Object.fromEntries(
    keys
      .filter(
        (key) =>
          Object.hasOwn(row, key) &&
          (primitive(row[key]) ||
            (Array.isArray(row[key]) &&
              (row[key] as unknown[]).every(primitive))),
      )
      .map((key) => [key, row[key]]),
  );
}
function source(value: unknown) {
  return fields(value, [
    "id",
    "publisher",
    "title",
    "url",
    "authority",
    "publishedAt",
    "observedAt",
  ]);
}
function event(value: unknown) {
  const row = object(value);
  return {
    ...fields(row, [
      "id",
      "revision",
      "type",
      "election",
      "effectiveAt",
      "publishedAt",
      "observedAt",
      "partyIds",
      "person",
      "decision",
      "positionScope",
      "proposalId",
      "mandateKind",
      "extensionMode",
      "voteOutcome",
      "durationDays",
      "status",
      "supersedes",
      "templateKey",
    ]),
    sources: Array.isArray(row.sources) ? row.sources.map(source) : [],
  };
}
/** Explicit per-kind public schema: unknown fields and unknown kinds never gain export rights. */
export function projectPublic(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(projectPublic);
  const row = object(value);
  if (typeof row.kind === "string") {
    const envelope = fields(row, [
      "schemaVersion",
      "revisionId",
      "recordId",
      "kind",
      "electionId",
      "effectiveAt",
      "observedAt",
      "status",
      "evidenceClass",
      "previousRevisionId",
      "currentState",
    ]);
    const payload = object(row.payload);
    let visible: ObjectValue = {};
    if (payload.withheld === true) visible = { withheld: true };
    else if (row.kind === "event")
      visible = {
        event: event(payload.event),
        identity: fields(payload.identity, [
          "electionId",
          "personId",
          "proposalId",
          "mandateAttemptId",
          "basis",
        ]),
      };
    else if (row.kind === "publication")
      visible = {
        ...fields(payload, [
          "category",
          "titleKey",
          "recordRevisionIds",
          "currentTextUnavailable",
        ]),
        data: fields(payload.data, [
          "topics",
          "delivery",
          "correctsRevisionId",
        ]),
      };
    else if (row.kind === "edition")
      visible = fields(payload, [
        "publicationRevisionId",
        "locale",
        "state",
        "translatedFromRevisionId",
      ]);
    else if (row.kind === "indicator_observation")
      visible = fields(payload, [
        "seriesId",
        "name",
        "period",
        "monthlyPercent",
        "annualPercent",
        "baseDescription",
        "indexValue",
        "releaseDate",
      ]);
    return {
      ...envelope,
      payload: visible,
      provenance: fields(row.provenance, [
        "sourceIds",
        "legacyRevision",
        "missingCapture",
        "parserVersion",
      ]),
    };
  }
  if (typeof row.type === "string" && typeof row.revision === "string")
    return event(row);
  if (row.recordType === "party_reference")
    return fields(row, [
      "id",
      "partyId",
      "name",
      "short",
      "recordType",
      "electionId",
    ]);
  if (row.jurisdiction === "IL" && row.chamber === "knesset")
    return fields(row, [
      "id",
      "jurisdiction",
      "chamber",
      "termNumber",
      "electionDay",
      "timeZone",
      "pollsClose",
      "modelArchiveAt",
      "seats",
      "sourceConfigVersion",
    ]);
  return {};
}
