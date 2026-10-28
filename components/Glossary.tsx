"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  anchorOf,
  filterTerms,
  initialOf,
  sortKey,
  type Glossary as GlossaryData,
} from "@/lib/glossary";
import { longDate } from "@/lib/format";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { glossaryText } from "@/lib/i18n/glossary";
import aliases from "@/data/glossary-aliases.json";
import ThresholdVotes from "@/components/glossary/ThresholdVotes";
/** The one term that carries a live figure: the 2026 threshold in votes. */
const THRESHOLD_ID = anchorOf("Electoral threshold");
export type GlossaryLabel = { text: string; lang: Lang };
export default function Glossary({
  data,
  labels,
  lang = "en",
  contentLang = "en",
}: {
  data: GlossaryData;
  labels: Record<string, string | GlossaryLabel>;
  lang?: Lang;
  contentLang?: Lang;
}) {
  const [query, setQuery] = useState(""),
    [target, setTarget] = useState(""),
    t = glossaryText(lang);
  useEffect(() => {
    const show = () => {
      let hash = window.location.hash.slice(1);
      try {
        hash = decodeURIComponent(hash);
      } catch {}
      setTarget(hash);
      setQuery("");
    };
    show();
    window.addEventListener("hashchange", show);
    return () => window.removeEventListener("hashchange", show);
  }, []);
  const collator = new Intl.Collator(locale(contentLang));
  const terms = filterTerms(data.terms, query, aliases).toSorted((a, b) =>
    collator.compare(
      contentLang === "en" ? sortKey(a.term) : a.term,
      contentLang === "en" ? sortKey(b.term) : b.term,
    ),
  );
  const initial = (term: string) =>
    contentLang === "en"
      ? initialOf(term)
      : ([...term.replace(/^\P{L}+/u, "")][0]?.toLocaleUpperCase(contentLang) ??
        "?");
  const letters = [...new Set(terms.map((term) => initial(term.term)))],
    groupId = (letter: string) =>
      contentLang === "en" ? letter.toLowerCase() : "gl-group-" + letter;
  const when = (date: string) =>
    /^\d{4}-\d\d-\d\d$/.test(date) ? longDate(date, lang) : date;
  return (
    <>
      <div className="gl-filter">
        <label htmlFor="glossary-filter">{t.find}</label>
        <div>
          <input
            id="glossary-filter"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setTarget("");
            }}
            placeholder={t.hint}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              {t.clear}
            </button>
          )}
        </div>
        <p role="status" aria-live="polite">
          {t.matches}:{" "}
          <bdi dir="ltr">
            {terms.length} / {data.terms.length}
          </bdi>
        </p>
      </div>
      {!terms.length && <p>{t.empty}</p>}
      <nav className="gl-az" aria-label={t.jump}>
        {letters.map((letter) => (
          <a key={letter} href={`#${groupId(letter)}`} lang={contentLang}>
            {letter}
          </a>
        ))}
      </nav>
      <div className="body">
        {letters.map((letter) => (
          <section
            key={letter}
            id={groupId(letter)}
            className="gl-letter"
            aria-label={letter}
          >
            <h2 lang={contentLang}>{letter}</h2>
            <dl className="gl">
              {terms
                .filter((term) => initial(term.term) === letter)
                .map((term) => {
                  const id =
                    term.id ?? anchorOf(term.originalTerm ?? term.term);
                  return (
                    <div
                      key={id}
                      id={id}
                      className={target === id ? "gl-target" : undefined}
                    >
                      <dt>
                        <span lang={contentLang} dir="auto">
                          {term.term}
                        </span>
                        {term.originalTerm &&
                          term.originalTerm !== term.term && (
                            <small lang="en" dir="ltr">
                              {" "}
                              ({term.originalTerm})
                            </small>
                          )}
                        {term.hebrew && (
                          <span className="he" lang="he" dir="rtl">
                            {term.hebrew}
                          </span>
                        )}
                        {term.say && (
                          <span className="say" lang="en" dir="ltr">
                            {term.say}
                          </span>
                        )}
                      </dt>
                      <dd>
                        <span lang={contentLang} dir="auto">
                          {term.def}
                        </span>
                        {id === THRESHOLD_ID && <ThresholdVotes lang={lang} />}{" "}
                        <span className="fig-src">
                          ({t.source}:{" "}
                          <a href={term.source.url}>
                            <span lang="en" dir="ltr">
                              {term.source.name}
                            </span>
                            {term.source.date && (
                              <>, {when(term.source.date)}</>
                            )}
                          </a>
                          )
                        </span>
                        {term.see?.length ? (
                          <span className="see">
                            {t.see}:{" "}
                            {term.see.map((href, i) => {
                              const label = labels[href],
                                text =
                                  typeof label === "string"
                                    ? label
                                    : (label?.text ?? href),
                                labelLang =
                                  typeof label === "string"
                                    ? "en"
                                    : (label?.lang ?? "en");
                              return (
                                <span key={href}>
                                  {i > 0 && ", "}
                                  <Link
                                    href={editionPath(href, lang) ?? href}
                                    lang={labelLang}
                                    dir="auto"
                                  >
                                    {text}
                                  </Link>
                                </span>
                              );
                            })}
                            .
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
