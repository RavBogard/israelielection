export type BlocId = "net" | "opp" | "mid" | "arab";
export type IssueKey = "draft" | "courts" | "war" | "wb" | "relig" | "econ";
export type Tag = "haredi" | "arab" | "zionistOpp";

/** A sentence with the source it came from. */
export type Sourced = { text: string; source: string | null };

export type Party = {
  id: string;
  name: string;
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
  /** Counts toward averages and the Coalition Builder's poll picker. */
  inAverage: boolean;
  /** A party missing here was not reported separately by this poll. */
  results: Record<string, PollResult>;
  /** Seats reported only for a group of parties together. */
  combined: { parties: string[]; seats: number; note: string }[];
};

export type PollsFile = { updated: string; polls: Poll[] };

export type Condition =
  | { party: string }
  | { tag: Tag }
  | { all: Condition[] }
  | { any: Condition[] };

export type PledgeRule = {
  id: string;
  kind: "pledge" | "condition";
  when: Condition;
  message: string;
  source: string;
};

export type PledgeRulesFile = { updated: string; about: string; rules: PledgeRule[] };
