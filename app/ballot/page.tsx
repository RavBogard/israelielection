import type { Metadata } from "next";
import Link from "next/link";
import BallotDirectory from "@/components/BallotDirectory";

export const metadata: Metadata = { title: "Ballot directory — all 38 published lists", description: "All 38 lists in the Central Elections Committee's published 2026 submitted roster: English names, original Hebrew, letters and official candidate links, with publication status." };
export default function Page() { return <div className="wrap"><header className="page-head"><h1>The ballot directory</h1><p className="standfirst">The published roster extends well beyond the parties in the polls. Find every listed entry here, with its official name and source.</p><p><Link href="/parties">Party Map</Link> · <Link href="/party-history">Party history</Link> · <Link href="/how-it-works/voting">How to vote</Link></p></header><BallotDirectory /></div>; }
