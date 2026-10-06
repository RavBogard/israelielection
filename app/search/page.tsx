import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import { Suspense } from "react";
import SiteSearch from "@/components/SiteSearch";
import { communityIndex, guideIndex, issueIndex } from "@/lib/content";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { BLOC_ORDER, blocTotals } from "@/lib/polls";
import { anchorOf, type Glossary } from "@/lib/glossary";
import {NAV,NAV_GROUPS} from "@/lib/site";
import { figureLine, type SearchEntry } from "@/lib/search";
import glossaryJson from "@/data/glossary.json";
import aliasesJson from "@/data/search-aliases.json";
import "@/components/interactives.css";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = { title: "Search", description: "Find parties, leaders, issues, guides and election terms, including alternate names and transliterations.", alternates: alternates("/search") };
export default async function Page() {
  const aliases = aliasesJson as Record<string, string[]>;
  // Seat lines from the current average, so a search for a party or bloc answers with its number first.
  const asOf = averagePoll.published ? shortDate(averagePoll.published) : null, totals = blocTotals(averagePoll, parties);
  const figure = (name: string, id: string) => { const r = averagePoll.results[id]; return asOf && r ? figureLine(name, r.belowThreshold || r.seats === 0 ? "below" : r.seats, asOf) : undefined; };
  const entries: SearchEntry[] = parties.map((p) => ({ href: `/parties/${p.id}`, title: p.name, description: `${p.leader}. ${p.who[0]?.text ?? ""}`, kind: "party", aliases: [p.short, p.leader, ...(p.names ?? []).map((n) => n.name), ...(aliases[`/parties/${p.id}`] ?? [])], figure: figure(p.name, p.id) }));
  for (const id of BLOC_ORDER) {
    const b = blocs.find((x) => x.id === id)!, members = parties.filter((p) => p.bloc === id).map((p) => p.name);
    entries.push({ href: "/polls", title: b.label, description: `A grouping, not a coalition agreement: ${members.join(", ")}. Summed in the average of ${mainPolls.length} current polls.`, kind: "bloc", aliases: aliases[`bloc:${id}`] ?? [], figure: asOf ? figureLine(b.label, totals[id], asOf) : undefined });
  }
  for (const [kind, index] of [["issue", await issueIndex()], ["community", await communityIndex()], ["guide", await guideIndex()]] as const) {
    for (const a of index) entries.push({ href: a.href, title: a.meta.title, description: a.meta.dek, kind, aliases: aliases[a.href] ?? [] });
  }
  for (const t of (glossaryJson as Glossary).terms) entries.push({ href: `/glossary#${anchorOf(t.term)}`, title: t.term, description: t.def, kind: "glossary", aliases: [t.hebrew ?? "", t.say ?? ""] });
  for (const n of NAV) entries.push({href:n.href,title:n.label,description:n.description,kind:"resource",aliases:[...(aliases[n.href]??[]),...(n.aliases??[]),...(n.short?[n.short]:[]),...NAV_GROUPS.filter(g=>g.items.some(item=>item.href===n.href)).map(g=>g.label),...(n.href==="/resources"?["resources","tools","directory","site map"]:[])]});
  return <div className="wrap ix"><PageHead title="Search" standfirst="Find the party, question or word you came for." /><Suspense fallback={<p>Loading search…</p>}><SiteSearch entries={entries} /></Suspense></div>;
}
