import type { Metadata } from "next";
import Link from "next/link";
import PartyHistory from "@/components/PartyHistory";
import PartyLanes from "@/components/history/PartyLanes";
import data from "@/data/party-history.json";
import "@/components/PartyHistory.css";

export const metadata: Metadata = { title: "Party family tree", description: "Trace the parties behind Israel's 2026 lists: shared ballots, mergers, splits and leaders' moves, from Labor and Likud to B'Yachad and the Joint List." };

export default function Page() {
  return (
    <div className="wrap party-history-page">
      <header className="page-head">
        <h1>The party family tree</h1>
        <p className="standfirst">Names change, parties share ballots, and leaders leave: the organizational history behind each 2026 list.</p>
      </header>
      <PartyLanes />
      <div className="history-key">
        <p>
          <strong>Read the relationship, not only the line.</strong> An electoral alliance puts separate parties on one ballot. A party merger joins their organizations. A Knesset
          faction is their parliamentary grouping after an election. A leader can move without moving a whole party.
        </p>
        <p>{data.scope}</p>
        <p>
          Historical vote shares belong to the lists that actually ran. Blue and White in 2019, for example, included parties absent from Gantz&apos;s 2026 list; comparing the
          name alone would compare different electorates. See the <Link href="/vote-map">historical vote map</Link>, the <Link href="/timeline">election timeline</Link>, the{" "}
          <Link href="/parties">Party Map</Link> and the <Link href="/ballot">full ballot directory</Link>.
        </p>
      </div>
      <PartyHistory />
    </div>
  );
}
