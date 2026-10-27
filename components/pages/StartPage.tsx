import SeatBasis from "@/components/seat-context/SeatBasis";
import { seatContextForRender } from "@/lib/seat-context-server";
import CurrentParliament from "@/components/seat-context/CurrentParliament";
import { forecastPresentation } from "@/components/live-forecast/LiveForecast";
import { Suspense } from "react";
import GuidedJourney from "@/components/GuidedJourney";
import VotingRightsGuide from "@/components/VotingRightsGuide";
import { Positions } from "@/components/article/Article";
import PageHead from "@/components/PageHead";
import { journeys } from "@/lib/journeys";
import { translatedTool } from "@/lib/reference/catalog";
import { journeyText } from "@/lib/i18n/journeys";
import type { Lang } from "@/lib/i18n";
import "@/components/interactives.css";
import "@/components/results.css";
import "@/components/article/article.css";

export default async function StartPage({ lang = "en" }: { lang?: Lang }) {
  const context = await seatContextForRender(),
    t = journeyText(lang),
    edition = translatedTool("tools:journeys", lang, journeys);
  const seats = context ? (
    <CurrentParliament
      initial={context}
      lang={lang}
      compact
      {...forecastPresentation(lang)}
    />
  ) : (
    <SeatBasis context={null} lang={lang} />
  );
  const figures = {
    voters: <VotingRightsGuide lang={lang} />,
    seats,
    parties: seats,
    govern: seats,
    compare: (
      <div className="sindex">
        <Positions issue="courts" lang={lang} />
      </div>
    ),
  };
  return (
    <div className="wrap ix">
      <SeatBasis context={context} lang={lang} />
      <PageHead title={t.title} standfirst={t.intro} />
      <Suspense fallback={<p>{t.loading}</p>}>
        <GuidedJourney
          figures={figures}
          lang={lang}
          copy={edition.data}
          contentLang={edition.contentLang}
          copyState={edition.state}
        />
      </Suspense>
    </div>
  );
}
