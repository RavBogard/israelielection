import type { Metadata } from "next";
import Link from "next/link";
import PartyHistory from "@/components/PartyHistory";
export const metadata: Metadata = { title: "Party family tree", description: "Trace the parties behind Israel's 2026 lists: shared ballots, mergers, splits and leaders' moves, from Labor and Likud to B'Yachad and the Joint List." };
export default function Page() { return <div className="wrap"><header className="page-head"><h1>The party family tree</h1><p className="standfirst">Names change, parties share ballots, and leaders leave. Follow the organizational history behind today&apos;s lists.</p><p><Link href="/parties">Party Map</Link> · <Link href="/timeline">Election timeline</Link> · <Link href="/ballot">Full ballot directory</Link></p></header><PartyHistory /></div>; }
