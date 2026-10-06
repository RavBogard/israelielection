"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchEntries, type SearchEntry } from "@/lib/search";
import "./search.css";
const KINDS = [["all", "Everything"], ["party", "Parties and leaders"], ["issue", "Issues"], ["community", "Communities"], ["guide", "Guides"], ["glossary", "Glossary"], ["resource", "Tools and teaching"]];
const LABELS = { party: "Current list", issue: "Issue", community: "Community", guide: "Guide", glossary: "Glossary term", resource: "Tool or resource" };
export default function SiteSearch({ entries }: { entries: SearchEntry[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const urlQuery = params.get("q") ?? "";
  const requestedKind = params.get("type") ?? "all";
  const urlKind = KINDS.some(([id]) => id === requestedKind) ? requestedKind : "all";
  const [query, setQuery] = useState(urlQuery);
  const [kind, setKind] = useState(urlKind);
  // Browser history and shared URLs are external state; typing itself never navigates.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQuery(urlQuery); setKind(urlKind); }, [urlQuery, urlKind]);
  const results = useMemo(() => searchEntries(entries, query, kind), [entries, query, kind]);
  const shown = query.trim() ? results : (kind === "all" ? ["/start", "/parties", "/compare", "/polls", "/glossary"].flatMap((href) => results.filter((r) => r.entry.href === href)) : results).slice(0, 6);
  function search(value = query, category = kind) {
    setQuery(value); setKind(category);
    const next = new URLSearchParams();
    if (value.trim()) next.set("q", value.trim());
    if (category !== "all") next.set("type", category);
    if (next.toString() !== params.toString()) router.push(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  return <div className="site-search">
    <form className="search-controls" role="search" onSubmit={(event) => { event.preventDefault(); search(); }}>
      <label>Search the site<input type="search" name="q" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Party, leader, issue or unfamiliar word" /></label>
      <label>Look in<select name="type" value={kind} onChange={(event) => search(query, event.target.value)}>{KINDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <button type="submit">Search</button>{(query || kind !== "all") && <button type="button" onClick={() => search("", "all")}>Clear</button>}
    </form>
    <p role="status" aria-live="polite">{query.trim() ? <>{results.length} {results.length === 1 ? "result" : "results"} for “{query}”.</> : "A few useful starting points. Type to search the full site."}</p>
    {!query.trim() && <p className="note">Try <button type="button" className="suggestion" onClick={() => search("Lieberman")}>Lieberman</button>, <button type="button" className="suggestion" onClick={() => search("Meretz")}>Meretz</button> or <button type="button" className="suggestion" onClick={() => search("threshold")}>threshold</button>. Hebrew names work too.</p>}
    {!results.length && <p>No matches. Try a shorter spelling, clear the category filter, or <Link href="/glossary">browse the glossary</Link>.</p>}
    <ul className="search-results">{shown.map(({ entry, matchedAlias }) => <li key={entry.href}><span className="lbl">{LABELS[entry.kind]}</span><h2><Link href={entry.href}>{entry.title}</Link></h2><p>{entry.description.length > 180 ? `${entry.description.slice(0, 177).replace(/\s+\S*$/, "")}…` : entry.description}</p>{matchedAlias && entry.kind === "party" && <p className="note">“{matchedAlias}” is a name or historical connection discussed in this current list’s profile. Earlier parties and today’s electoral list can differ.</p>}</li>)}</ul>
  </div>;
}
