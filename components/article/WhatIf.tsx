import { partyText, blocText } from "@/lib/i18n/overlays";
import type { Lang } from "@/lib/i18n";
import builder from "@/lib/i18n/builder";
import ThresholdWhatIf, {
  type WhatIfParty,
} from "@/components/ThresholdWhatIf";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { resultsConfig } from "@/lib/results-live";
import { seatsIn } from "@/lib/polls";
import { thresholdSeats } from "@/lib/watch";

/** The threshold what-if for the seats guide, fed from the current average on the server. */
export default function WhatIf({ lang = "en" }: { lang?: Lang } = {}) {
  const edge = thresholdSeats(resultsConfig.threshold) + 1.5;
  const list: WhatIfParty[] = parties
    .filter((p) => p.coalitionCard !== "hidden")
    .map((p) => {
      const seats = seatsIn(averagePoll, p.id) ?? 0;
      return {
        id: p.id,
        name: partyText(p, "name", lang).text,
        bloc: p.bloc,
        letters: lettersOf[p.id] ?? null,
        seats: Math.round(seats * 10) / 10,
        near: (seats > 0 && seats <= edge) || p.coalitionCard === "out",
      };
    });
  const agreements = resultsConfig.agreements
    .filter((a) => a.status === "signed" && a.parties.length === 2)
    .map((a) => [a.parties[0], a.parties[1]] as [string, string]);
  return (
    <ThresholdWhatIf
      parties={list}
      blocs={blocs.map((b) => ({ ...b, label: blocText(b, lang).text }))}
      threshold={resultsConfig.threshold}
      agreements={agreements}
      pollsLabel={
        lang === "en"
          ? `the average of the latest ${mainPolls.length} polls (${averagePoll.published})`
          : builder[lang].averagePhrase(mainPolls.length) +
            ` (${averagePoll.published})`
      }
    />
  );
}
