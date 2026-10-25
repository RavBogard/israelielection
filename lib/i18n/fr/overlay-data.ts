import type { HeOverlay } from "../localize";
import type { Overlays } from "../overlay-text";
import partiesEdition from "@/data/fr/parties.json";
import questionsEdition from "@/data/fr/comparison-questions.json";
import pledgesEdition from "@/data/fr/pledge-rules.json";
import scenariosEdition from "@/data/fr/coalition-scenarios.json";
import governmentEdition from "@/data/fr/outgoing-government.json";
import pollstersEdition from "@/data/fr/pollsters.json";
import gazaEdition from "@/data/fr/gaza-security-evidence.json";
import voterBaseEdition from "@/data/fr/voter-base.json";
import resultsEdition from "@/data/fr/results.json";
import courtsEdition from "@/data/fr/positions/courts.json";
import economyEdition from "@/data/fr/positions/economy.json";
import draftEdition from "@/data/fr/positions/haredi-draft.json";
import stateEdition from "@/data/fr/positions/palestinian-state.json";
import religionEdition from "@/data/fr/positions/religion-state.json";
import warEdition from "@/data/fr/positions/war-hostages.json";
import westBankEdition from "@/data/fr/positions/west-bank.json";

/**
 * This edition's data overlay files (data/fr/**). Imported only by lib/i18n/overlays.ts (server) and
 * lib/i18n/fr/Provider.tsx (this edition's root layout), never by code that English client bundles reach.
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
