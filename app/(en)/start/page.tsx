import SeatBasis from "@/components/seat-context/SeatBasis";
import { seatContextForRender } from "@/lib/seat-context-server";
import CurrentParliament from "@/components/seat-context/CurrentParliament";
import { forecastPresentation } from "@/components/live-forecast/LiveForecast";
import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import { Suspense } from "react";
import "@/components/interactives.css";
import "@/components/results.css";
import "@/components/article/article.css";
import GuidedJourney from "@/components/GuidedJourney";
import SeatGrid from "@/components/SeatGrid";
import VotingRightsGuide from "@/components/VotingRightsGuide";
import { SplitMini } from "@/components/article/Article";
import PollThresholdWatch from "@/components/results/ThresholdWatch";
import { averagePoll, parties } from "@/lib/data";
import { partyColor } from "@/lib/party-colors";
import type { BlocId } from "@/lib/types";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = { title: "Start here", description: "A five-minute introduction to Israel's election, or a route through the parties, each step with a figure from the site.", alternates: alternates("/start") };

const ORDER: BlocId[] = ["net", "mid", "opp", "arab"];
const seats = (id: string) => averagePoll.results[id]?.seats ?? 0;
const segments = ORDER.flatMap((b) => parties.filter((p) => p.bloc === b && seats(p.id) > 0).map((p) => ({ id: p.id, seats: seats(p.id), color: partyColor(p.id), label: p.name, href: `/parties/${p.id}` })));

export default async function Page() {
  const context = await seatContextForRender();
  const figures = {
    voters: <VotingRightsGuide />,
    seats: context ? <CurrentParliament initial={context} lang="en" compact {...forecastPresentation("en")}/> : <div className="rs"><PollThresholdWatch /></div>,
    parties: context ? <CurrentParliament initial={context} lang="en" compact {...forecastPresentation("en")}/> : <SeatBasis context={null} lang="en"/>,
    govern: context ? <CurrentParliament initial={context} lang="en" compact {...forecastPresentation("en")}/> : (
      <figure className="js-grid">
        <figcaption className="js-h">Campaign example: the120 seats in the saved polling average;61 is a majority</figcaption>
        <SeatGrid segments={segments} labelRule />
      </figure>
    ),
    compare: <div className="sindex"><SplitMini issue="courts" /></div>,
  };
  return (
    <div className="wrap ix">
      <SeatBasis context={context} lang="en"/><PageHead title="Start here" standfirst="A short path through the election, one figure at a time." />
      <Suspense fallback={<p>Loading the routes…</p>}>
        <GuidedJourney figures={figures} />
      </Suspense>
    </div>
  );
}
