"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchEntries, type SearchEntry } from "@/lib/search";
import { searchText } from "@/lib/i18n/search";
import { referenceText } from "@/lib/i18n/reference";
import type { Lang } from "@/lib/i18n";
import "./search.css";
export default function SiteSearch({
  entries,
  lang = "en",
  tools = [],
}: {
  entries: SearchEntry[];
  lang?: Lang;
  tools?: { href: string; label: string }[];
}) {
  const t = searchText(lang),
    params = useSearchParams(),
    router = useRouter(),
    path = usePathname();
  const kinds = [
      ["all", t.all],
      ["party", t.parties],
      ["issue", t.issues],
      ["community", t.communities],
      ["guide", t.guides],
      ["glossary", t.glossary],
      ["resource", t.tools],
    ],
    labels = {
      party: t.party,
      bloc: t.bloc,
      issue: t.issue,
      community: t.community,
      guide: t.guide,
      glossary: t.term,
      resource: t.tool,
    };
  const urlQuery = params.get("q") ?? "",
    requested = params.get("type") ?? "all",
    urlKind = kinds.some(([id]) => id === requested) ? requested : "all";
  const [query, setQuery] = useState(urlQuery),
    [kind, setKind] = useState(urlKind);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser history is an external input
    setQuery(urlQuery);
    setKind(urlKind);
  }, [urlQuery, urlKind]);
  const results = useMemo(
      () => searchEntries(entries, query, kind),
      [entries, query, kind],
    ),
    browsing = !query.trim() && kind === "all",
    shown = browsing ? [] : query.trim() ? results : results.slice(0, 6);
  function search(value = query, category = kind) {
    setQuery(value);
    setKind(category);
    const next = new URLSearchParams();
    if (value.trim()) next.set("q", value.trim());
    if (category !== "all") next.set("type", category);
    if (next.toString() !== params.toString())
      router.push(`${path}${next.size ? "?" + next : ""}`, { scroll: false });
  }
  return (
    <div className="site-search">
      <form
        className="search-controls"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <label>
          {t.label}
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.placeholder}
          />
        </label>
        <label>
          {t.look}
          <select
            name="type"
            value={kind}
            onChange={(event) => search(query, event.target.value)}
          >
            {kinds.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t.title}</button>
        {(query || kind !== "all") && (
          <button type="button" onClick={() => search("", "all")}>
            {t.clear}
          </button>
        )}
      </form>
      <p role="status" aria-live="polite">
        {query.trim() ? (
          <>
            {results.length} {t.results}: “{query}”.
          </>
        ) : (
          t.browse
        )}
      </p>
      {browsing && (
        <ul className="search-tools" aria-label={t.main}>
          {tools.map((n) => (
            <li key={n.href}>
              <Link href={n.href}>{n.label}</Link>
            </li>
          ))}
        </ul>
      )}
      {!results.length && <p>{t.none}</p>}
      <ul className="search-results">
        {shown.map(({ entry, matchedAlias }) => (
          <li key={`${entry.kind}${entry.href}`}>
            <h2 className={entry.figure ? "search-figure" : undefined}>
              <Link
                href={entry.href}
                lang={entry.contentLang}
                dir={entry.contentLang === "en" ? "ltr" : undefined}
              >
                {entry.figure ?? entry.title}
              </Link>
            </h2>
            <p lang={entry.contentLang}>
              {entry.description}{" "}
              <span className="search-kind">{labels[entry.kind]}</span>
            </p>
            {entry.translationPending && (
              <p className="note">{referenceText(lang).pending}</p>
            )}
            {matchedAlias && entry.kind === "party" && (
              <p className="note">
                “{matchedAlias}”. {t.alias}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
