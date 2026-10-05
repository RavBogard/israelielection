import type { Metadata } from "next";
import { Suspense } from "react";
import GuidedJourney from "@/components/GuidedJourney";
import "@/components/interactives.css";
export const metadata: Metadata = { title: "Start here", description: "A five-minute introduction, a route through the parties, or a path to leading an election discussion." };
export default function Page() { return <div className="wrap ix"><header className="page-head"><h1>Start here</h1><p className="standfirst">A short path through the election. Choose the time and question you have.</p></header><Suspense fallback={<p>Loading learning routes…</p>}><GuidedJourney /></Suspense></div>; }
