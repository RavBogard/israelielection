import type { Metadata } from "next";
import Link from "next/link";
import Changes from "@/components/Changes";
import data from "@/data/material-changes.json";
export const metadata:Metadata={title:"What changed",description:"A dated before-and-after log of material election developments, model changes and corrections, with sources, affected tools and local bookmarks."};
export default function Page(){return <div className="wrap"><header className="page-head"><h1>What changed?</h1><p className="standfirst">Follow the change, its evidence and what it means for a tool or page. Filter by topic or date, and save entries for later.</p><p>{data.provenance}</p><p><Link href="/news">Headlines and daily briefings</Link> · <Link href="/corrections">Correction register</Link></p></header><Changes /></div>;}
