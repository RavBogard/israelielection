import ThresholdWhatIf, { type WhatIfParty } from "@/components/ThresholdWhatIf";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { resultsConfig } from "@/lib/results-live";
import { seatsIn } from "@/lib/polls";
import { thresholdSeats } from "@/lib/watch";

/** The threshold what-if for the seats guide, fed from the current average on the server. */
export default function WhatIf() {
  const edge = thresholdSeats(resultsConfig.threshold) + 1.5;
  const list: WhatIfParty[] = parties
    .filter((p) => p.coalitionCard !== "hidden")
    .map((p) => {
      const seats = seatsIn(averagePoll, p.id) ?? 0;
      return { id: p.id, name: p.name, bloc: p.bloc, letters: lettersOf[p.id] ?? null, seats: Math.round(seats * 10) / 10, near: (seats > 0 && seats <= edge) || p.coalitionCard === "out" };
    });
  const agreements = resultsConfig.agreements.filter((a) => a.status === "signed" && a.parties.length === 2).map((a) => [a.parties[0], a.parties[1]] as [string, string]);
  return <ThresholdWhatIf parties={list} blocs={blocs} threshold={resultsConfig.threshold} agreements={agreements} pollsLabel={`the average of the latest ${mainPolls.length} polls`} />;
}
