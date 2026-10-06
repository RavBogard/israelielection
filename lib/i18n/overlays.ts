import type { Lang } from "./index";
import { localize, localizeText, type HeField, type HeOverlay, type Localized } from "./localize";
import partiesHe from "@/data/he/parties.json";
import questionsHe from "@/data/he/comparison-questions.json";
import pledgesHe from "@/data/he/pledge-rules.json";
import scenariosHe from "@/data/he/coalition-scenarios.json";
import governmentHe from "@/data/he/outgoing-government.json";
import pollstersHe from "@/data/he/pollsters.json";
import gazaHe from "@/data/he/gaza-security-evidence.json";
import voterBaseHe from "@/data/he/voter-base.json";
import resultsHe from "@/data/he/results.json";
import courtsHe from "@/data/he/positions/courts.json";
import economyHe from "@/data/he/positions/economy.json";
import draftHe from "@/data/he/positions/haredi-draft.json";
import stateHe from "@/data/he/positions/palestinian-state.json";
import religionHe from "@/data/he/positions/religion-state.json";
import warHe from "@/data/he/positions/war-hostages.json";
import westBankHe from "@/data/he/positions/west-bank.json";

/**
 * Every Hebrew data overlay, and the key each English file is read by (docs/planning/2026-10-06-hebrew/OVERLAYS.md).
 * Pages read data through these helpers, never the overlay files directly, so the keys live in one place.
 * Item key → field path (as lib/i18n/localize fieldAt reads it) → { text, src, machine?, translated? }.
 */
const as = (o: unknown) => o as HeOverlay;
export const OVERLAYS = {
  parties: as(partiesHe),
  questions: as(questionsHe),
  pledges: as(pledgesHe),
  scenarios: as(scenariosHe),
  government: as(governmentHe),
  pollsters: as(pollstersHe),
  gaza: as(gazaHe),
  voterBase: as(voterBaseHe),
  results: as(resultsHe),
  positions: {
    courts: as(courtsHe),
    economy: as(economyHe),
    "haredi-draft": as(draftHe),
    "palestinian-state": as(stateHe),
    "religion-state": as(religionHe),
    "war-hostages": as(warHe),
    "west-bank": as(westBankHe),
  } as Record<string, HeOverlay>,
};

/** A party field ("name", "short", "leader", "who.0.text", "issues.draft.text", "bios.1.text", "quote.text"...). Key: party id. */
export const partyText = (party: { id: string }, field: string, lang: Lang): Localized => localize(party, field, OVERLAYS.parties, lang);

/** A bloc's label. Key in data/he/parties.json: "bloc:<id>", field "label". */
export const blocText = (bloc: { id: string; label: string }, lang: Lang): Localized =>
  localize({ id: `bloc:${bloc.id}`, label: bloc.label }, "label", OVERLAYS.parties, lang);

/** An issue's short label (parties.json `issues`). Key: "issue:<key>", field "label". */
export const issueText = (issue: { key: string; label: string }, lang: Lang): Localized =>
  localize({ id: `issue:${issue.key}`, label: issue.label }, "label", OVERLAYS.parties, lang);

/** A comparison question field ("label", "question", "note", "stances.0.label", "answerSources.<party>.text", "unstated.<party>.text"). Key: question key. */
export const questionText = (q: { key: string }, field: string, lang: Lang): Localized =>
  localize({ ...q, id: q.key }, field, OVERLAYS.questions, lang);

/**
 * A positions file field. File-level fields ("title", "question", "note", "stances.0.label") use key "_";
 * a row's text uses key = the row's party id, field "text". `issue` is the file name without .json.
 */
export function positionText(issue: string, item: object, field: string, lang: Lang, party?: string): Localized {
  return localize({ ...item, id: party ?? "_" }, field, OVERLAYS.positions[issue], lang);
}

/** A pledge rule's message. Key: rule id, field "message". */
export const pledgeText = (rule: { id: string; message: string }, lang: Lang): Localized => localize(rule, "message", OVERLAYS.pledges, lang);

/** A coalition scenario field ("title", "agenda", "obstacles", "leadership"). Key: scenario id. */
export const scenarioText = (s: { id: string }, field: string, lang: Lang): Localized => localize(s, field, OVERLAYS.scenarios, lang);

/** An outgoing-government field ("title", "seatsNote", "status", "events.0.text"...). Key: "_". */
export const governmentText = (g: object, field: string, lang: Lang): Localized => localize({ ...g, id: "_" }, field, OVERLAYS.government, lang);

/** A pollster or outlet name as Israelis say it ("Channel 12" → "חדשות 12"). Key: the English name, field "name". */
export const pollsterText = (name: string, lang: Lang): Localized => localize({ id: name, name }, "name", OVERLAYS.pollsters, lang);

/** Any other English string with an overlay entry under a known key. */
export const overlayText = (english: string, he: HeField | undefined, lang: Lang): Localized => localizeText(english, he, lang);
