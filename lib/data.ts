import partiesJson from "@/data/parties.json";
import pollsJson from "@/data/polls.json";
import rulesJson from "@/data/pledge-rules.json";
import { averageAsPoll, byNewest, currentPolls, withoutVariantPolls } from "./polls";
import type { BlocId, PartiesFile, PledgeRulesFile, PollsFile } from "./types";

export const partiesData = partiesJson as PartiesFile;
export const pollsData = pollsJson as PollsFile;
export const pledgeRules = (rulesJson as PledgeRulesFile).rules;

export const parties = partiesData.parties;
export const blocs = partiesData.blocs;
export const blocLabel = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;

/** Every poll since dissolution, newest first. */
export const allPolls = [...pollsData.polls].sort(byNewest);

/** Each pollster's latest current poll, every whitelisted firm included: feeds averages and the Coalition Builder. */
export const mainPolls = currentPolls(pollsData.polls, pollsData.config);
/** The same polls minus `config.withoutVariant` (Shlomo Filber's firms): the second average. */
export const variantPolls = withoutVariantPolls(mainPolls, pollsData.config);

/** The current average as a pseudo-poll (the Coalition Builder's default). */
export const averagePoll = averageAsPoll(mainPolls, parties.map((p) => p.id));

/** The later of the two data files' update dates. */
export const dataUpdated = [partiesData.updated, pollsData.updated].sort().at(-1)!;
