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
import { countView } from "@/lib/count-view";

const WHEN = (lang: Lang, at: string) =>
  new Intl.DateTimeFormat(lang, { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(at));

/**
 * The threshold what-if for the seats guide, fed on the server from the committee's count (vote shares and the
 * 3.25% line, provisional) and, with no count saved, from the poll average.
 */
export default async function WhatIf({ lang = "en" }: { lang?: Lang } = {}) {
  const view = await countView();
  const edge = thresholdSeats(resultsConfig.threshold) + 1.5;
  const EDGE_SHARE = 0.045;
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
        near: view ? ((view.shares[p.id] ?? 0) > 0 && (view.shares[p.id] ?? 0) <= EDGE_SHARE) || p.coalitionCard === "out" : (seats > 0 && seats <= edge) || p.coalitionCard === "out",
        share: view ? (view.shares[p.id] ?? 0) : null,
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
      basis={view ? "count" : "poll"}
      pollsLabel={
        view
          ? `${builder[lang].countPhrase(false)} (${WHEN(lang, view.at)})`
          : lang === "en"
          ? `the average of the latest ${mainPolls.length} polls (${averagePoll.published})`
          : builder[lang].averagePhrase(mainPolls.length) +
            ` (${averagePoll.published})`
      }
    />
  );
}
