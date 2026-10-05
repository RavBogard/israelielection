import partiesJson from "@/data/parties.json";
import pollsJson from "@/data/polls.json";
import rulesJson from "@/data/pledge-rules.json";
import type { BlocId, PartiesFile, PledgeRulesFile, PollsFile } from "./types";

export const partiesData = partiesJson as PartiesFile;
export const pollsData = pollsJson as PollsFile;
export const pledgeRules = (rulesJson as PledgeRulesFile).rules;

export const parties = partiesData.parties;
export const blocs = partiesData.blocs;
export const blocLabel = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;

/** Polls that count toward averages and the coalition count. */
export const mainPolls = pollsData.polls.filter((p) => p.inAverage);
/** Polls shown for reference only (Channel 14). */
export const otherPolls = pollsData.polls.filter((p) => !p.inAverage);

/** The later of the two data files' update dates. */
export const dataUpdated = [partiesData.updated, pollsData.updated].sort().at(-1)!;
