import type { HeOverlay } from "../localize";
import type { Overlays } from "../overlay-text";
import partiesEdition from "@/data/de/parties.json";
import questionsEdition from "@/data/de/comparison-questions.json";
import pledgesEdition from "@/data/de/pledge-rules.json";
import scenariosEdition from "@/data/de/coalition-scenarios.json";
import governmentEdition from "@/data/de/outgoing-government.json";
import pollstersEdition from "@/data/de/pollsters.json";
import gazaEdition from "@/data/de/gaza-security-evidence.json";
import voterBaseEdition from "@/data/de/voter-base.json";
import resultsEdition from "@/data/de/results.json";
import courtsEdition from "@/data/de/positions/courts.json";
import economyEdition from "@/data/de/positions/economy.json";
import draftEdition from "@/data/de/positions/haredi-draft.json";
import stateEdition from "@/data/de/positions/palestinian-state.json";
import religionEdition from "@/data/de/positions/religion-state.json";
import warEdition from "@/data/de/positions/war-hostages.json";
import westBankEdition from "@/data/de/positions/west-bank.json";

/**
 * This edition's data overlay files (data/de/**). Imported only by lib/i18n/overlays.ts (server) and
 * lib/i18n/de/Provider.tsx (this edition's root layout), never by code that English client bundles reach.
 * Item key → field path (as lib/i18n/localize fieldAt reads it) → { text, src, machine?, translated? }.
 */
const as = (o: unknown) => o as HeOverlay;
export const OVERLAY_DATA: Overlays = {
  parties: as(partiesEdition),
  questions: as(questionsEdition),
  pledges: as(pledgesEdition),
  scenarios: as(scenariosEdition),
  government: as(governmentEdition),
  pollsters: as(pollstersEdition),
  gaza: as(gazaEdition),
  voterBase: as(voterBaseEdition),
  results: as(resultsEdition),
  positions: {
    courts: as(courtsEdition),
    economy: as(economyEdition),
    "haredi-draft": as(draftEdition),
    "palestinian-state": as(stateEdition),
    "religion-state": as(religionEdition),
    "war-hostages": as(warEdition),
    "west-bank": as(westBankEdition),
  },
};
