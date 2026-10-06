import type { Metadata } from "next";
import "@/components/article/article.css";
import Compare, { type CompareParty, type Preset } from "@/components/Compare";
import { matrixRows } from "@/components/compare/model";
import { averagePoll, blocs, parties } from "@/lib/data";
import { lettersOf } from "@/lib/letters";
import { outgoingGovernment } from "@/lib/outgoing-government";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = {
  title: "Compare the parties",
  description:
    "Every list's recorded answer on the draft, the courts, the October 7 inquiry, the West Bank, religion and state, the economy, a Palestinian state and Gaza, in one matrix, with the party's words, dates and sources.",
};

const pickable: CompareParty[] = parties
  .filter((p) => p.coalitionCard !== "hidden")
  .map((p) => ({ id: p.id, name: p.name, bloc: p.bloc, letters: lettersOf[p.id] ?? null, seats: averagePoll.results[p.id]?.seats ?? null, out: p.coalitionCard === "out" }));

const ids = pickable.map((p) => p.id);

/** The column sets a reader is likely to ask about. The core opposition lists are the four Jewish-majority lists polled into the Knesset. */
const CORE_OPPOSITION = ["yashar", "byachad", "dem", "yb"];
const presets: Preset[] = [
  { label: "Every list", ids },
  { label: "Netanyahu bloc", ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "net") },
  { label: "Anti-Netanyahu bloc", ids: ids.filter((id) => parties.find((p) => p.id === id)!.bloc === "opp") },
  { label: "Core opposition", ids: CORE_OPPOSITION.filter((id) => ids.includes(id)) },
  { label: "Outgoing government", ids: outgoingGovernment.with.filter((id) => ids.includes(id)) },
];

const rows = matrixRows(ids);

export default function Page() {
  return (
    <div className="wrap article-page">
      <PageHead title="Compare the parties" standfirst={<>
          Every list&apos;s recorded answer on the questions that divide this election, in one chart. Open a row for each party&apos;s own words.
        </>} />

      <Compare parties={pickable} blocs={blocs} rows={rows} presets={presets} defaults={ids} />
    </div>
  );
}
