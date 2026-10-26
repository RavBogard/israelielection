import { resolveSeatSelection } from "@/lib/seat-selection";
import SeatBasis from "@/components/seat-context/SeatBasis";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import EmbedFooter from "@/components/EmbedFooter";
import {partyColor,blocColorStrip,PARTY_COLOR_NOTE} from "@/lib/party-colors";
import Link from "next/link";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY } from "@/lib/coalition";
import { blocs, mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { BLOC_ORDER, blocTotals, seatFigure } from "@/lib/polls";
import type { BlocId } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Seats by bloc (embed)",
  robots: { index: false },
  alternates: alternates("/embed/grid"),
};

/** Blocs in the order they fill the grid, as on the home page. */
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query=await searchParams;const q=new URLSearchParams(Object.entries(query).filter((entry):entry is [string,string]=>typeof entry[1]==="string"));
  const selection=await resolveSeatSelection(q);if(!selection)return <SeatBasis context={null} lang="en" pinned/>;const context=selection.context,poll=selection.poll;
  const totals = blocTotals(poll, parties);
  const ordered = GRID_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => ({ ...b, seats: totals[b.id] }));
  const segments = ordered.flatMap((b)=>parties.filter((p)=>p.bloc===b.id&&(poll.results[p.id]?.seats??0)>0).map((p)=>({id:p.id,seats:poll.results[p.id].seats,color:partyColor(p.id),label:p.name,href:`/parties?party=${p.id}`})));
  for(const [id,result] of Object.entries(poll.results)) if(result.seats>0&&!parties.some(p=>p.id===id)) segments.push({id,seats:result.seats,color:"#777777",label:context?.parties.find(p=>p.id===id)?.label??id,href:"/government"});
  const asOf = mediumDate(mainPolls[0].published);
  return (
    <>
      <h1 className="embed-head">The 120 seats by bloc</h1>
      <p className="embed-sub">
        {context ? `${LIFECYCLE.en[context.basis]} · ${LIFECYCLE.en[context.seatStatus]}.` : `Selected seat evidence.`} {MAJORITY} seats is an absolute majority.
      </p>
      {context && <SeatBasis context={context} lang="en" pinned={!!query.context} share/>}
      <div className="embed-grid">
        <SeatGrid segments={segments} labelRule />
        <div>
          <dl className="blocs">
            {BLOC_ORDER.map((id) => ordered.find((b) => b.id === id)!).map((b) => (
              <div key={b.id}>
                <dt>
                  <span className="sw" style={{ background: blocColorStrip(b.id) }} />
                  {b.label}
                </dt>
                <dd>{seatFigure(b.seats)}</dd>
              </div>
            ))}
          </dl>
          <p className="fig-note">The heavy rule marks 60 seats; the next one is the 61st.</p>
        </div>
      </div>
      <p className="fig-note">{PARTY_COLOR_NOTE} <Link href="/parties">Party Map and color key</Link>.</p>
      <EmbedFooter dateLine={context ? `${LIFECYCLE.en[context.basis]} · ${context.publishedAt??LIFECYCLE.en.noTime}` : `Polls to ${asOf}`} />
    </>
  );
}
