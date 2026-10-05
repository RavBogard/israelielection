import type { Metadata } from "next";
import EmbedFooter from "@/components/EmbedFooter";
import {partyColor,blocColorStrip,PARTY_COLOR_NOTE} from "@/lib/party-colors";
import Link from "next/link";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY } from "@/lib/coalition";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";
import { blocTotals } from "@/lib/polls";
import type { BlocId } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Seats by bloc (embed)",
  robots: { index: false },
};

/** Blocs in the order they fill the grid, as on the home page. */
const GRID_ORDER: BlocId[] = ["net", "mid", "opp", "arab"];

export default function Page() {
  const totals = blocTotals(averagePoll, parties);
  const ordered = GRID_ORDER.map((id) => blocs.find((b) => b.id === id)!).map((b) => ({ ...b, seats: totals[b.id] }));
  const segments = ordered.flatMap((b)=>parties.filter((p)=>p.bloc===b.id&&(averagePoll.results[p.id]?.seats??0)>0).map((p)=>({id:p.id,seats:averagePoll.results[p.id].seats,color:partyColor(p.id),label:p.name,href:`/parties?party=${p.id}`})));
  const asOf = mediumDate(mainPolls[0].published);
  return (
    <>
      <h1 className="embed-head">The 120 seats by bloc</h1>
      <p className="embed-sub">
        The normalized coalition average of the latest {mainPolls.length} polls. {MAJORITY} seats is an absolute majority.
      </p>
      <div className="embed-grid">
        <SeatGrid segments={segments} labelRule />
        <div>
          <dl className="blocs">
            {ordered.map((b) => (
              <div key={b.id}>
                <dt>
                  <span className="sw" style={{ background: blocColorStrip(b.id) }} />
                  {b.label}
                </dt>
                <dd>{fmt(Math.round(b.seats * 10) / 10)}</dd>
              </div>
            ))}
          </dl>
          <p className="note">Seats can be fractional in an average. The heavy rule marks 60 seats; the next one is the 61st.</p>
        </div>
      </div>
      <p className="note">{PARTY_COLOR_NOTE} <Link href="/parties">Party Map and color key</Link>.</p>
      <EmbedFooter dateLine={`Polls to ${asOf}`} />
    </>
  );
}
