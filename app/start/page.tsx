import type { Metadata } from "next";
import { Suspense } from "react";
import "@/components/interactives.css";
import "@/components/results.css";
import "@/components/article/article.css";
import GuidedJourney from "@/components/GuidedJourney";
import SeatGrid from "@/components/SeatGrid";
import VotingRightsGuide from "@/components/VotingRightsGuide";
import { SplitMini } from "@/components/article/Article";
import PollThresholdWatch from "@/components/results/ThresholdWatch";
import { averagePoll, blocs, parties } from "@/lib/data";
import { partyColor } from "@/lib/party-colors";
import { blocTotals } from "@/lib/polls";
import type { BlocId } from "@/lib/types";

export const metadata: Metadata = { title: "Start here", description: "A five-minute introduction to Israel's election, or a route through the parties, each step with a figure from the site." };

const ORDER: BlocId[] = ["net", "mid", "opp", "arab"];
const seats = (id: string) => averagePoll.results[id]?.seats ?? 0;
const segments = ORDER.flatMap((b) => parties.filter((p) => p.bloc === b && seats(p.id) > 0).map((p) => ({ id: p.id, seats: seats(p.id), color: partyColor(p.id), label: p.name, href: `/parties/${p.id}` })));

/** "A party is not a bloc": each bloc as a bar of the separate lists it groups, in their own colours. */
function BlocStack() {
  const totals = blocTotals(averagePoll, parties);
  const max = Math.max(...ORDER.map((b) => totals[b]));
  return (
    <figure className="js-blocs">
      <figcaption className="js-h">Each bloc is several lists, each its own ballot choice</figcaption>
      {ORDER.map((b) => (
        <div key={b} className="js-bloc">
          <p className="js-lab">{blocs.find((x) => x.id === b)!.label} <b>{Math.round(totals[b] * 10) / 10}</b></p>
          <div className="js-bar" style={{ width: `${(totals[b] / max) * 100}%` }}>
            {parties.filter((p) => p.bloc === b && seats(p.id) > 0).sort((x, y) => seats(y.id) - seats(x.id)).map((p) => (
              <span key={p.id} style={{ flexGrow: seats(p.id), background: partyColor(p.id) }} title={`${p.name}: ${Math.round(seats(p.id) * 10) / 10} seats`} />
            ))}
          </div>
        </div>
      ))}
      <p className="js-src">Seats in the polling average, scaled to 120. Hover a segment for the list.</p>
    </figure>
  );
}

export default function Page() {
  const figures = {
    voters: <VotingRightsGuide />,
    seats: <div className="rs"><PollThresholdWatch /></div>,
    parties: <BlocStack />,
    govern: (
      <figure className="js-grid">
        <figcaption className="js-h">The 120 seats in the polling average; 61 is a majority</figcaption>
        <SeatGrid segments={segments} labelRule />
      </figure>
    ),
    compare: <div className="sindex"><SplitMini issue="courts" /></div>,
  };
  return (
    <div className="wrap ix">
      <header className="page-head">
        <h1>Start here</h1>
        <p className="standfirst">A short path through the election, one figure at a time.</p>
      </header>
      <Suspense fallback={<p>Loading the routes…</p>}>
        <GuidedJourney figures={figures} />
      </Suspense>
    </div>
  );
}
