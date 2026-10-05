/**
 * Teach scenario cards, data/teach-scenarios.json: real line-ups (formed before, proposed, polled
 * as a bloc or pledged against), each with one sourced fact, one thing to do in the Builder and
 * one question. The prose never states a seat total; scenarioNumbers computes it from the polls.
 */
import { MAJORITY, tally } from "./coalition";
import type { Party, Poll } from "./types";

export type ScenarioSource = { name: string; date: string; url: string };

export type Scenario = {
  id: string;
  title: string;
  with: string[];
  lead: string;
  notice: string;
  question: string;
  /** "threshold": show how often each list clears the threshold instead of the line-up's seat total. */
  show?: "threshold";
  sources: ScenarioSource[];
};

export type ScenariosFile = { checked: string; scenarios: Scenario[] };

export type ScenarioNumbers = {
  /** Seats in the poll average, rounded to a whole seat. */
  average: number;
  /** Fewest and most seats across the latest polls. */
  low: number;
  high: number;
  /** How many of the latest polls give the line-up 61 or more. */
  reaching: number;
  polls: number;
};

export function scenarioNumbers(ids: string[], parties: Party[], averagePoll: Poll, polls: Poll[]): ScenarioNumbers {
  const sel = new Set(ids);
  const each = polls.map((p) => tally(sel, parties, p).total);
  return {
    average: Math.round(tally(sel, parties, averagePoll).total),
    low: Math.round(Math.min(...each)),
    high: Math.round(Math.max(...each)),
    reaching: each.filter((t) => t >= MAJORITY).length,
    polls: polls.length,
  };
}

/** "54 seats in the poll average, 7 short of 61; 51 to 58 across the latest 7 polls, none reaching 61." */
export function readNumbers(n: ScenarioNumbers): string {
  const avg = n.average >= MAJORITY ? `${n.average} seats in the poll average, a majority` : `${n.average} seats in the poll average, ${MAJORITY - n.average} short of ${MAJORITY}`;
  const range = n.low === n.high ? `${n.low} in each of the latest ${n.polls} polls` : `${n.low} to ${n.high} across the latest ${n.polls} polls`;
  const reach = n.reaching === 0 ? `none reaching ${MAJORITY}` : n.reaching === n.polls ? `all reaching ${MAJORITY}` : `${n.reaching} reaching ${MAJORITY}`;
  return `${avg}; ${range}, ${reach}.`;
}

/** How many of the latest polls give a list seats (it clears the 3.25% threshold). */
export function clears(id: string, polls: Poll[]): number {
  return polls.filter((p) => {
    const r = p.results[id];
    return r !== undefined && !r.belowThreshold && r.seats > 0;
  }).length;
}

/** "clears the threshold in 4 of the latest 7 polls" */
export const readClears = (k: number, n: number) =>
  k === 0 ? `below the threshold in all of the latest ${n} polls` : k === n ? `clears the threshold in all of the latest ${n} polls` : `clears the threshold in ${k} of the latest ${n} polls`;

export const builderHref = (ids: string[]) => `/coalition-builder?with=${ids.join(",")}&poll=avg`;
