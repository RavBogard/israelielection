import type { Lang } from "./index";
import { localize, localizeText, type HeField, type HeOverlay, type Localized } from "./localize";

/**
 * The overlay helpers without the overlay data, so English client bundles never carry the Hebrew (~110 KB).
 * Shared and client modules import from here; `OVERLAYS` starts empty and is filled once per module instance by
 * lib/i18n/overlays.ts (server components, tests, scripts) or lib/i18n/HebrewProvider.tsx (the Hebrew root layout's
 * client bundle). English never reads it: every helper returns the English unless lang is "he".
 */
export type Overlays = {
  parties: HeOverlay;
  questions: HeOverlay;
  pledges: HeOverlay;
  scenarios: HeOverlay;
  government: HeOverlay;
  pollsters: HeOverlay;
  gaza: HeOverlay;
  voterBase: HeOverlay;
  results: HeOverlay;
  positions: Record<string, HeOverlay>;
};

/** Every Hebrew data overlay by the key each English file is read by (docs/planning/2026-10-06-hebrew/OVERLAYS.md). */
export const OVERLAYS: Overlays = { parties: {}, questions: {}, pledges: {}, scenarios: {}, government: {}, pollsters: {}, gaza: {}, voterBase: {}, results: {}, positions: {} };

/** Fills OVERLAYS (idempotent: the data is static). Called at module load by the two data entry points only. */
export function setOverlays(data: Overlays): void {
  Object.assign(OVERLAYS, data);
}

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
