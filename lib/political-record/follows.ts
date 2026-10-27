import { partyText, issueText } from "../i18n/overlays";
import { ui } from "../i18n/ui";
import { LANGS, type Lang } from "../i18n";
import parties from "../../data/parties.json";
import places from "../../public/vote-map/places.json";
import { ISSUES } from "../articles";
export type Follows = { parties: string[]; issues: string[]; places: string[] };
export type DeliveryChannels = {
  dailyDigest: boolean;
  majorEvents: boolean;
  corrections: boolean;
};
export type DistributionKind = "daily_digest" | "major_event" | "correction";
export const EMPTY_FOLLOWS: Follows = { parties: [], issues: [], places: [] };
const known = {
  parties: new Set(parties.parties.map((party) => party.id)),
  issues: new Set<string>(ISSUES),
  places: new Set(Object.keys(places)),
};
export function validateFollows(value: unknown): Follows {
  const row = value as Follows;
  if (
    !row ||
    typeof row !== "object" ||
    Array.isArray(row) ||
    Object.keys(row).some(
      (key) => !["parties", "issues", "places"].includes(key),
    )
  )
    throw new Error("invalid_follows");
  for (const key of ["parties", "issues", "places"] as const) {
    if (
      !Array.isArray(row[key]) ||
      row[key].length > 20 ||
      new Set(row[key]).size !== row[key].length ||
      row[key].some((id) => typeof id !== "string" || !known[key].has(id))
    )
      throw new Error("invalid_follows");
  }
  return {
    parties: row.parties.toSorted(),
    issues: row.issues.toSorted(),
    places: row.places.toSorted(),
  };
}
export function validateChannels(value: unknown): DeliveryChannels {
  const row = value as DeliveryChannels;
  if (
    !row ||
    typeof row !== "object" ||
    Array.isArray(row) ||
    Object.keys(row).length !== 3 ||
    ![row.dailyDigest, row.majorEvents, row.corrections].every(
      (value) => typeof value === "boolean",
    )
  )
    throw new Error("invalid_delivery");
  return {
    dailyDigest: row.dailyDigest,
    majorEvents: row.majorEvents,
    corrections: row.corrections,
  };
}
export function selectedDistribution(
  topics: string[],
  follows: unknown,
  delivery: unknown,
) {
  return {
    follows:
      follows === undefined || follows === null
        ? structuredClone(EMPTY_FOLLOWS)
        : validateFollows(follows),
    delivery:
      delivery === undefined || delivery === null
        ? {
            dailyDigest: topics.includes("digest"),
            majorEvents: topics.some((topic) => topic !== "digest"),
            corrections: true,
          }
        : validateChannels(delivery),
    preferenceVersion:
      (delivery === undefined || delivery === null) &&
      (follows === undefined || follows === null)
        ? 1
        : 2,
  };
}
export function publicationDistribution(data: Record<string, unknown>) {
  if (
    data.delivery !== undefined &&
    !["daily_digest", "digest", "major_event", "correction"].includes(
      String(data.delivery),
    )
  )
    throw new Error("invalid_publication_delivery");
  if (
    data.correctsRevisionId !== undefined &&
    (typeof data.correctsRevisionId !== "string" ||
      !/^[a-f0-9]{64}$/.test(data.correctsRevisionId))
  )
    throw new Error("invalid_correction_revision");
  if (
    data.delivery === "correction" &&
    typeof data.correctsRevisionId !== "string"
  )
    throw new Error("invalid_correction_revision");
  const digestDate =
    typeof data.digestDate === "string" ? data.digestDate : null;
  if (
    (digestDate &&
      (!/^20\d{2}-\d{2}-\d{2}$/.test(digestDate) ||
        new Date(digestDate + "T12:00:00Z").toISOString().slice(0, 10) !==
          digestDate)) ||
    (data.delivery === "daily_digest" && !digestDate)
  )
    throw new Error("invalid_digest_date");
  const kind: DistributionKind =
    typeof data.correctsRevisionId === "string"
      ? "correction"
      : data.delivery === "daily_digest" || data.delivery === "digest"
        ? "daily_digest"
        : "major_event";
  const follows =
    data.follows === undefined
      ? structuredClone(EMPTY_FOLLOWS)
      : validateFollows(data.follows);
  const topics = Array.isArray(data.topics)
    ? data.topics.filter(
        (topic): topic is string =>
          typeof topic === "string" &&
          ["digest", "results", "formation", "policies"].includes(topic),
      )
    : [];
  return { kind, follows, topics, digestDate };
}
export function matchesDistribution(
  selected: { topics: string[]; follows: Follows; delivery: DeliveryChannels },
  publication: ReturnType<typeof publicationDistribution>,
  previousRecipient = false,
) {
  const channel =
    publication.kind === "daily_digest"
      ? selected.delivery.dailyDigest
      : publication.kind === "major_event"
        ? selected.delivery.majorEvents
        : selected.delivery.corrections;
  const relevant =
    selected.topics.some((topic) => publication.topics.includes(topic)) ||
    (["parties", "issues", "places"] as const).some((key) =>
      selected.follows[key].some((id) => publication.follows[key].includes(id)),
    );
  return (
    channel &&
    (relevant || (publication.kind === "correction" && previousRecipient))
  );
}
export function followCatalog(kind: string, query: string, lang: string) {
  if (
    !["party", "issue", "place"].includes(kind) ||
    !["en", "he", "ar", "fa", "de", "fr", "zh"].includes(lang) ||
    query.length > 100
  )
    throw new Error("invalid_catalog_query");
  const selectedLang = lang as Lang;
  const issueKeys: Record<string, string> = {
    "haredi-draft": "draft",
    courts: "courts",
    "war-hostages": "war",
    "west-bank": "wb",
    "religion-state": "relig",
    economy: "econ",
  };
  const rows =
    kind === "party"
      ? parties.parties.map((party) => {
          const label = partyText(party, "name", selectedLang);
          return {
            id: party.id,
            label: label.text,
            labelLocale: label.lang,
            aliases: LANGS.flatMap((language) => [
              partyText(party, "name", language).text,
              partyText(party, "short", language).text,
              partyText(party, "leader", language).text,
            ]),
          };
        })
      : kind === "issue"
        ? ISSUES.map((id) => {
            const issue = parties.issues.find(
              (row) => row.key === issueKeys[id],
            );
            const english = issue?.label ?? "Palestinian state";
            const localized = (language: Lang) =>
              issue
                ? issueText(issue, language)
                : {
                    text: ui(language, english),
                    lang: ui(language, english) === english ? "en" : language,
                  };
            const label = localized(selectedLang);
            return {
              id,
              label: label.text,
              labelLocale: label.lang,
              aliases: LANGS.map((language) => localized(language).text),
            };
          })
        : Object.entries(places).map(([id, value]) => ({
            id,
            label: value[0] as string,
            labelLocale: "en",
            aliases: [],
          }));
  const normalized = query.trim().toLocaleLowerCase();
  return rows
    .filter(
      (row) =>
        !normalized ||
        [row.id, row.label, ...row.aliases].some((alias) =>
          alias.toLocaleLowerCase().includes(normalized),
        ),
    )
    .slice(0, 50)
    .map(({ aliases, ...row }) => {
      void aliases;
      return { ...row, kind, sourceLocale: "en" };
    });
}
