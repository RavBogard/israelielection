import type { HeOverlay } from "../localize";
import type { Overlays } from "../overlay-text";
import partiesHe from "@/data/ar/parties.json";
import questionsHe from "@/data/ar/comparison-questions.json";
import pledgesHe from "@/data/ar/pledge-rules.json";
import scenariosHe from "@/data/ar/coalition-scenarios.json";
import governmentHe from "@/data/ar/outgoing-government.json";
import pollstersHe from "@/data/ar/pollsters.json";
import gazaHe from "@/data/ar/gaza-security-evidence.json";
import voterBaseHe from "@/data/ar/voter-base.json";
import resultsHe from "@/data/ar/results.json";
import courtsHe from "@/data/ar/positions/courts.json";
import economyHe from "@/data/ar/positions/economy.json";
import draftHe from "@/data/ar/positions/haredi-draft.json";
import stateHe from "@/data/ar/positions/palestinian-state.json";
import religionHe from "@/data/ar/positions/religion-state.json";
import warHe from "@/data/ar/positions/war-hostages.json";
import westBankHe from "@/data/ar/positions/west-bank.json";

/**
 * Every Hebrew data overlay file (data/he/**). Imported only by lib/i18n/overlays.ts (server) and
 * lib/i18n/HebrewProvider.tsx (the Hebrew root layout), never by code that English client bundles reach.
 * Item key → field path (as lib/i18n/localize fieldAt reads it) → { text, src, machine?, translated? }.
 */
const as = (o: unknown) => o as HeOverlay;
export const OVERLAY_DATA: Overlays = {
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
  },
};
