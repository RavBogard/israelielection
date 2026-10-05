import type { Metadata } from "next";
import "@/components/article/article.css";
import Compare from "@/components/Compare";
import stateFile from "@/data/positions/palestinian-state.json";
import { averagePoll, parties } from "@/lib/data";
import { cellsFor, defaultSelection, type CompareParty, type PositionRow } from "@/lib/compare";
import { lettersOf } from "@/lib/letters";

export const metadata: Metadata = {
  title: "Compare the parties",
  description:
    "Pick two to four of the parties running on October 27, 2026 and read their stated positions side by side on seven issues, each with its source.",
};

const stateRows = stateFile.rows as PositionRow[];

const pickable: CompareParty[] = parties
  .filter((p) => p.coalitionCard !== "hidden")
  .map((p) => ({ id: p.id, name: p.name, bloc: p.bloc, letters: lettersOf[p.id] ?? null, cells: cellsFor(p, stateRows) }));

const defaults = defaultSelection(
  pickable.map((p) => p.id),
  averagePoll.results
);

export default function Page() {
  return (
    <div className="wrap article-page">
      <header className="page-head">
        <h1>Compare the parties</h1>
        <p className="standfirst">
          Pick two to four parties to set their stated positions side by side: the Haredi draft, the courts, the war, the West Bank, religion and
          state, the economy and a Palestinian state. Every position carries its source.
        </p>
      </header>

      <Compare parties={pickable} defaults={defaults} />
      <p className="note">{stateFile.columnNote}</p>
    </div>
  );
}
