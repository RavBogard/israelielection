import type { HeOverlay } from "../localize";
import type { Overlays } from "../overlay-text";
import partiesEdition from "@/data/zh/parties.json";
import questionsEdition from "@/data/zh/comparison-questions.json";
import pledgesEdition from "@/data/zh/pledge-rules.json";
import scenariosEdition from "@/data/zh/coalition-scenarios.json";
import governmentEdition from "@/data/zh/outgoing-government.json";
import pollstersEdition from "@/data/zh/pollsters.json";
import gazaEdition from "@/data/zh/gaza-security-evidence.json";
import voterBaseEdition from "@/data/zh/voter-base.json";
import resultsEdition from "@/data/zh/results.json";
import courtsEdition from "@/data/zh/positions/courts.json";
import economyEdition from "@/data/zh/positions/economy.json";
import draftEdition from "@/data/zh/positions/haredi-draft.json";
import stateEdition from "@/data/zh/positions/palestinian-state.json";
import religionEdition from "@/data/zh/positions/religion-state.json";
import warEdition from "@/data/zh/positions/war-hostages.json";
import westBankEdition from "@/data/zh/positions/west-bank.json";

/**
 * This edition's data overlay files (data/zh/**). Imported only by lib/i18n/overlays.ts (server) and
 * lib/i18n/zh/Provider.tsx (this edition's root layout), never by code that English client bundles reach.
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
