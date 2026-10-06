import type { Metadata } from "next";
import { Suspense } from "react";
import SiteSearch from "@/components/SiteSearch";
import { communityIndex, guideIndex, issueIndex } from "@/lib/content";
import { parties } from "@/lib/data";
import { anchorOf, type Glossary } from "@/lib/glossary";
import {NAV,NAV_GROUPS} from "@/lib/site";
import type { SearchEntry } from "@/lib/search";
import glossaryJson from "@/data/glossary.json";
import aliasesJson from "@/data/search-aliases.json";
import "@/components/interactives.css";

export const metadata: Metadata = { title: "Search", description: "Find parties, leaders, issues, guides and election terms, including alternate names and transliterations." };
export default async function Page() {
  const aliases = aliasesJson as Record<string, string[]>;
  const entries: SearchEntry[] = parties.map((p) => ({ href: `/parties/${p.id}`, title: p.name, description: `${p.leader}. ${p.who[0]?.text ?? ""}`, kind: "party", aliases: [p.short, p.leader, ...(p.names ?? []).map((n) => n.name), ...(aliases[`/parties/${p.id}`] ?? [])] }));
  for (const [kind, index] of [["issue", await issueIndex()], ["community", await communityIndex()], ["guide", await guideIndex()]] as const) {
    for (const a of index) entries.push({ href: a.href, title: a.meta.title, description: a.meta.dek, kind, aliases: aliases[a.href] ?? [] });
  }
  for (const t of (glossaryJson as Glossary).terms) entries.push({ href: `/glossary#${anchorOf(t.term)}`, title: t.term, description: t.def, kind: "glossary", aliases: [t.hebrew ?? "", t.say ?? ""] });
  for (const n of NAV) entries.push({href:n.href,title:n.label,description:n.description,kind:"resource",aliases:[...(aliases[n.href]??[]),...NAV_GROUPS.filter(g=>g.items.some(item=>item.href===n.href)).map(g=>g.label),...(n.href==="/resources"?["resources","tools","directory","site map"]:[])]});
  return <div className="wrap ix"><header className="page-head"><h1>Search</h1><p className="standfirst">Find the party, question or word you came for.</p></header><Suspense fallback={<p>Loading search…</p>}><SiteSearch entries={entries} /></Suspense></div>;
}
