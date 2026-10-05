import type { Metadata } from "next";
import EmbedFooter from "@/components/EmbedFooter";
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
  const segments = ordered.map((b) => ({ id: b.id, seats: b.seats, color: `var(--b-${b.id})`, label: b.label }));
  const asOf = mediumDate(mainPolls[0].published);
  return (
    <>
      <h1 className="embed-head">The 120 seats by bloc</h1>
      <p className="embed-sub">
        The average of the latest {mainPolls.length} polls. A government needs {MAJORITY}.
      </p>
      <div className="embed-grid">
        <SeatGrid segments={segments} labelRule />
        <div>
          <dl className="blocs">
            {ordered.map((b) => (
              <div key={b.id}>
                <dt>
                  <span className="sw" style={{ background: `var(--b-${b.id})` }} />
                  {b.label}
                </dt>
                <dd>{fmt(Math.round(b.seats * 10) / 10)}</dd>
              </div>
            ))}
          </dl>
          <p className="note">Seats can be fractional in an average. The heavy rule marks 60 seats; the next one is the 61st.</p>
        </div>
      </div>
      <EmbedFooter dateLine={`Polls to ${asOf}`} />
    </>
  );
}
