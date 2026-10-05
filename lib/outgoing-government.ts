/**
 * The government in office until the next one is sworn in, from
 * data/outgoing-government.json: the 2022 coalition, each change to it since,
 * and its status now. `with` is the Coalition Builder link's party set.
 */
import data from "@/data/outgoing-government.json";
import type { Source } from "./formation";

export type { Source };

export type GovernmentEvent = {
  date: string;
  text: string;
  /** Seats formally in the coalition after the step; null when the step did not set a count or the count is disputed (see seatsText). */
  seatsAfter: number | null;
  /** The count in words when sources give no single number, e.g. "62 or 63". */
  seatsText?: string;
  source: Source;
};

export type OutgoingGovernment = {
  checked: string;
  title: string;
  /** Party ids for the Builder's ?with= link: the 2022 parties that have a poll figure. */
  with: string[];
  seats2022: number;
  seatsNote: string;
  events: GovernmentEvent[];
  status: { text: string; date: string; sources: Source[] };
  noam: { text: string; source: Source };
};

export const outgoingGovernment = data as OutgoingGovernment;

/** The Builder link for the 2022 coalition's parties on the poll average. */
export const outgoingHref = (g: OutgoingGovernment = outgoingGovernment) => `/coalition-builder?with=${g.with.join(",")}&poll=avg`;

/** True when a Builder selection is exactly the 2022 coalition's set. */
export const isOutgoingSet = (ids: Iterable<string>, g: OutgoingGovernment = outgoingGovernment) => {
  const s = new Set(ids);
  return s.size === g.with.length && g.with.every((id) => s.has(id));
};
