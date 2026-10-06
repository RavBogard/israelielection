import type { Metadata } from "next";
import Link from "next/link";
import Changes from "@/components/Changes";
import data from "@/data/material-changes.json";
import PageHead from "@/components/PageHead";
export const metadata:Metadata={title:"What changed",description:"A dated before-and-after log of material election developments, model changes and corrections, with sources, affected tools and local bookmarks."};
export default function Page(){return <div className="wrap"><PageHead title="What changed?" standfirst="Follow the change, its evidence and what it means for a tool or page. Filter by topic or date, and save entries for later."><p>{data.provenance}</p><p><Link href="/news">Headlines and daily briefings</Link>, and the <Link href="/corrections">correction register</Link></p></PageHead><Changes /></div>;}
