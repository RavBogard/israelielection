import type { Metadata } from "next";
import "@/components/article/article.css";
import Compare, { type CompareParty, type Preset } from "@/components/Compare";
import { averagePoll, blocs, parties } from "@/lib/data";
import { AXES, defaultSelection } from "@/lib/compare";
import { ISSUES } from "@/lib/positions";
import { lettersOf } from "@/lib/letters";
import { outgoingGovernment } from "@/lib/outgoing-government";

export const metadata: Metadata = {
  title: "Compare the parties",
  description:
    "Pick any of the parties running on October 27, 2026 and see where they agree, where they split and who has said nothing on seven issues, in their own sourced words.",
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

const issueList = AXES.map((a) => ({ key: a.key, label: a.label, file: ISSUES[a.key] }));

export default function Page() {
  return (
    <div className="wrap article-page">
      <header className="page-head">
        <h1>Compare the parties</h1>
        <p className="standfirst">
          Pick any set of parties and see where they stand on seven issues: the Haredi draft, the courts, the October 7 inquiry, the West Bank,
          religion and state, the economy and a Palestinian state. Parties that agree pile up together; parties that split stand apart. Every
          position carries its source.
        </p>
      </header>

      <Compare parties={pickable} blocs={blocs} issues={issueList} presets={presets} defaults={defaults} />
    </div>
  );
}
