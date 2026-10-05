import type { Metadata } from "next";
import Link from "next/link";
import "@/components/article/article.css";
import "@/components/glossary.css";
import glossaryJson from "@/data/glossary.json";
import { communityIndex, guideIndex, issueIndex } from "@/lib/content";
import { anchorOf, initialOf, type Glossary } from "@/lib/glossary";
import { longDate } from "@/lib/timeline";

const data = glossaryJson as Glossary;

export const metadata: Metadata = {
  title: "Glossary",
  description: "The words an American reader meets in coverage of Israel's 2026 election, from the Knesset and the threshold to masorti, Area C and the reasonableness standard.",
};

/** Link text for the section pages a term points to; article titles are added from their meta. */
const LABEL: Record<string, string> = {
  "/vote-map": "Vote map",
  "/results": "Results",
  "/polls": "Polls",
  "/parties": "Party Map",
  "/american-lens": "The American lens",
  "/timeline": "Timeline",
};

const when = (d: string) => (/^\d{4}-\d\d-\d\d$/.test(d) ? longDate(d) : d);

export default async function Page() {
  const label: Record<string, string> = { ...LABEL };
  for (const a of [...(await guideIndex()), ...(await issueIndex()), ...(await communityIndex())]) label[a.href] = a.meta.title;
  const letters = [...new Set(data.terms.map((t) => initialOf(t.term)))];
  return (
    <div className="wrap article-page glossary-page">
      <header className="page-head">
        <h1>Glossary</h1>
        <p className="standfirst">
          {data.terms.length} words an American reader meets in coverage of the election, each with its source. Hebrew is given where the Hebrew word
          is the one used in English.
        </p>
        <p className="note">Definitions checked {longDate(data.checked)}.</p>
      </header>
      <div className="article-grid solo">
        <article className="article">
          <nav className="gl-az" aria-label="Jump to a letter">
            {letters.map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`}>
                {l}
              </a>
            ))}
          </nav>
          <div className="body">
            {letters.map((l) => (
              <section key={l} id={l.toLowerCase()} className="gl-letter" aria-label={l}>
                <h2>{l}</h2>
                <dl className="gl">
                  {data.terms
                    .filter((t) => initialOf(t.term) === l)
                    .map((t) => (
                      <div key={t.term} id={anchorOf(t.term)}>
                        <dt>
                          {t.term}
                          {t.hebrew && (
                            <span className="he" lang="he" dir="rtl">
                              {t.hebrew}
                            </span>
                          )}
                          {t.say && <span className="say">{t.say}</span>}
                        </dt>
                        <dd>
                          {t.def}{" "}
                          <span className="src">
                            (
                            <a href={t.source.url}>
                              {t.source.name}
                              {t.source.date ? `, ${when(t.source.date)}` : ""}
                            </a>
                            )
                          </span>
                          {t.see && t.see.length > 0 && (
                            <span className="see">
                              {" "}
                              See{" "}
                              {t.see.map((h, i) => (
                                <span key={h}>
                                  {i > 0 && ", "}
                                  <Link href={h}>{label[h] ?? h}</Link>
                                </span>
                              ))}
                              .
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
