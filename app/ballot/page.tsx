import type { Metadata } from "next";
import BallotDirectory from "@/components/BallotDirectory";

export const metadata: Metadata = { title: "Ballot directory — all 38 published lists", description: "All 38 lists in the Central Elections Committee's published 2026 submitted roster: English names, original Hebrew, letters and official candidate links, with publication status." };

export default function Page() {
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>The ballot directory</h1>
        <p className="standfirst">Every list on the published roster, far more than the polls count, with its official name and source.</p>
      </header>
      <BallotDirectory />
    </div>
  );
}
