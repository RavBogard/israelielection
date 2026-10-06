export type BlocId = "net" | "opp" | "mid" | "arab";
export type IssueKey = "draft" | "courts" | "war" | "wb" | "relig" | "econ";
/** `noArabPledge`: lists whose leaders pledged to govern without Arab parties (not The Democrats, who said the opposite). */
export type Tag = "haredi" | "arab" | "zionistOpp" | "noArabPledge";

/** A sentence with the source it came from. */
export type Sourced = { text: string; source: string | null };

export type Party = {
  id: string;
  name: string;
  /** Column-header name for tables. */
  short: string;
  leader: string;
  bloc: BlocId;
  tags: Tag[];
  /** Set when the party is not polled into the Knesset (shown instead of seats). */
  status: string | null;
  coalitionCard: "active" | "out" | "hidden";
  surplusLine: string | null;
  who: Sourced[];
  thin: string | null;
  voters: Sourced[] | null;
  issues: Record<IssueKey, Sourced | null> | null;
  names: { slot: string; name: string; note: string | null }[] | null;
  namesSource: string | null;
  pledges: Sourced[] | null;
  surplusPartner: Sourced | null;
  quote: { text: string; speaker: string; source: string } | null;
  bios: { name: string; text: string }[] | null;
};

export type PartiesFile = {
  updated: string;
  provenance: string;
  bioSource: string;
  blocs: { id: BlocId; label: string }[];
  issues: { key: IssueKey; label: string }[];
  parties: Party[];
};

export type PollResult = {
  seats: number;
  belowThreshold?: boolean;
  pct?: string;
  /** Channel 14 figures whose date our register does not give. */
  dateUncertain?: boolean;
};

export type Poll = {
  resultState?: { freshness: "fresh" | "stale"; capturedAt: string; sourceUpdatedAt: string | null };
  id: string;
  pollster: string;
  firm: string | null;
  fieldwork: string | null;
  /** ISO date */
  published: string;
  via: string | null;
  url: string | null;
  n: number | null;
  margin: string | null;
  note: string | null;
  /** A party missing here was not reported separately by this poll. */
  results: Record<string, PollResult>;
  /** Seats reported only for a group of parties together. */
  combined: { parties: string[]; seats: number; note: string }[];
  /** "exit": an election-night exit poll. Shown in the Coalition Builder's picker, never averaged, exempt from the seat-move rule. */
  kind?: "exit";
  /** Exit polls: when this version aired (ISO date-time with offset); the close if absent. */
  broadcastAt?: string;
};

export type PollsConfig = {
  /** ISO date the Knesset dissolved; no earlier poll belongs in this file. */
  dissolved: string;
  /** A pollster's latest poll is "current" if published within this many days of the newest poll. */
  currentWindowDays: number;
  /**
   * Who is averaged, stated for readers. Every pollster on `pollsters` is in: a firm is in or out
   * by firm and stated method (sample size and method published), never by its results.
   */
  inclusionRule: string;
  /** A second average shown alongside the main one, leaving out these pollsters' polls. */
  withoutVariant: { label: string; note: string; pollsters: string[] };
  /** Validator: largest seat change allowed between consecutive polls by the same pollster. */
  maxSeatMove: number;
  /** Validator: publishers whose polls may be merged automatically. */
  pollsters: string[];
};

export type PollsFile = { updated: string; config: PollsConfig; polls: Poll[] };

export type Condition =
  | { party: string }
  /** The list sits in the cabinet; unlike `party`, never matched by outside support. */
  | { cabinet: string }
  | { tag: Tag }
  | { all: Condition[] }
  | { any: Condition[] };

export type PledgeRule = {
  id: string;
  kind: "pledge" | "condition";
  when: Condition;
  message: string;
  source: string;
  /** The pledge also rules out outside support: `party` and `tag` read the cabinet plus its outside support. */
  support?: boolean;
};

export type PledgeRulesFile = { updated: string; about: string; rules: PledgeRule[] };
