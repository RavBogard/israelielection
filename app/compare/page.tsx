import type { Metadata } from "next";
import "@/components/article/article.css";
import Compare, { type CompareParty, type Preset } from "@/components/Compare";
import { averagePoll, blocs, parties } from "@/lib/data";
import { defaultSelection } from "@/lib/compare";
import { comparisonIssues } from "@/lib/positions";
import { lettersOf } from "@/lib/letters";
import { outgoingGovernment } from "@/lib/outgoing-government";

export const metadata: Metadata = {
  title: "Compare the parties",
  description:
    "Compare parties' recorded answers on governing policy, including Gaza, with dates, sources and missing evidence kept visible.",
};

const pickable: CompareParty[] = parties
  .filter((p) => p.coalitionCard !== "hidden")
  .map((p) => ({ id: p.id, name: p.name, bloc: p.bloc, letters: lettersOf[p.id] ?? null, seats: averagePoll.results[p.id]?.seats ?? null }));

const ids = pickable.map((p) => p.id);
const defaults = defaultSelection(ids, averagePoll.results);

/** The sets a reader is likely to ask about. The core opposition lists are the four Jewish-majority lists polled into the Knesset. */
const CORE_OPPOSITION = ["yashar", "byachad", "dem", "yb"];
const presets: Preset[] = [
  { label: "Netanyahu's bloc", ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "net") },
  { label: "the anti-Netanyahu bloc", ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "opp") },
  { label: "the four core opposition lists", ids: CORE_OPPOSITION.filter((id) => ids.includes(id)) },
  { label: "the outgoing government", ids: outgoingGovernment.with.filter((id) => ids.includes(id)) },
  { label: "every list", ids },
];

const issueList = comparisonIssues();

export default function Page() {
  return (
    <div className="wrap article-page">
      <header className="page-head">
        <h1>Compare the parties</h1>
        <p className="standfirst">
          Pick any set of parties and compare their recorded answers on the draft, courts, October 7 inquiry, West Bank, religion and state,
          economy, Palestinian statehood and Gaza. Narrow questions separate compatible aims from different proposals. Missing evidence remains visible.
        </p>
      </header>

      <Compare parties={pickable} blocs={blocs} issues={issueList} presets={presets} defaults={defaults} />
    </div>
  );
}
