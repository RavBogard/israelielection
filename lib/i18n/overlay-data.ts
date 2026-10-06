import type { HeOverlay } from "./localize";
import type { Overlays } from "./overlay-text";
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
