"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { anchorOf, filterTerms, initialOf, type Glossary as GlossaryData } from "@/lib/glossary";
import { longDate } from "@/lib/timeline";
import aliases from "@/data/glossary-aliases.json";

export default function Glossary({ data, labels }: { data: GlossaryData; labels: Record<string, string> }) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => {
    const showTarget = () => { setTarget(decodeURIComponent(window.location.hash.slice(1))); setQuery(""); };
    showTarget(); window.addEventListener("hashchange", showTarget);
    return () => window.removeEventListener("hashchange", showTarget);
  }, []);
  const terms = filterTerms(data.terms, query, aliases);
  const letters = [...new Set(terms.map((t) => initialOf(t.term)))];
  const when = (d: string) => /^\d{4}-\d\d-\d\d$/.test(d) ? longDate(d) : d;
  return <>
    <div className="gl-filter"><label htmlFor="glossary-filter">Find a term, Hebrew name or alternate spelling</label><div><input id="glossary-filter" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setTarget(""); }} placeholder="For example: threshold or haredi" />{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}</div><p role="status" aria-live="polite">{terms.length} {terms.length === 1 ? "term" : "terms"}{query && <> matching “{query}”</>}.</p></div>
    {!terms.length && <p>No matching terms. Try a shorter spelling or clear the filter to browse.</p>}
    <nav className="gl-az" aria-label="Jump to a letter">{letters.map((l) => <a key={l} href={`#${l.toLowerCase()}`}>{l}</a>)}</nav>
    <div className="body">{letters.map((letter) => <section key={letter} id={letter.toLowerCase()} className="gl-letter" aria-label={letter}><h2>{letter}</h2><dl className="gl">{terms.filter((t) => initialOf(t.term) === letter).map((term) => <div key={term.term} id={anchorOf(term.term)} className={target === anchorOf(term.term) ? "gl-target" : undefined}><dt>{term.term}{term.hebrew && <span className="he" lang="he" dir="rtl">{term.hebrew}</span>}{term.say && <span className="say">{term.say}</span>}</dt><dd>{term.def} <span className="src">(<a href={term.source.url}>{term.source.name}{term.source.date && `, ${when(term.source.date)}`}</a>)</span>{term.see?.length ? <span className="see"> See {term.see.map((href, i) => <span key={href}>{i > 0 && ", "}<Link href={href}>{labels[href] ?? href}</Link></span>)}.</span> : null}</dd></div>)}</dl></section>)}</div>
  </>;
}
