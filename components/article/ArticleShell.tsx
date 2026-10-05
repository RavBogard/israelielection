import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import "./article.css";
import type { ArticleMeta } from "@/lib/articles";

const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export type Sibling = { href: string; title: string };

/**
 * The frame of every reference page: the section it belongs to, title, dek, check date and
 * body in a reading column, with the rest of the section in a rail beside it on wide screens.
 */
export default function ArticleShell({
  meta,
  Body,
  section,
  siblings = [],
  current,
  foreword,
}: {
  meta: ArticleMeta;
  Body: ComponentType;
  section: Sibling;
  siblings?: Sibling[];
  current?: string;
  /** A signed note set before the body, in the author's voice (About only). */
  foreword?: ReactNode;
}) {
  return (
    <div className="wrap article-page">
      <div className={`article-grid${siblings.length ? "" : " solo"}`}>
        <article className="article">
          <p className="kicker">
            <Link href={section.href}>{section.title}</Link>
          </p>
          <h1>{meta.title}</h1>
          <p className="dek">{meta.dek}</p>
          <p className="checked">Facts checked {DATE.format(new Date(meta.checked))}. Every number shows its source and date.</p>
          {foreword}
          <div className="body">
            <Body />
          </div>
        </article>
        {siblings.length > 0 && (
          <nav className="rail" aria-label={`More in ${section.title}`}>
            <p className="lbl">
              <Link href={section.href}>{section.title}</Link>
            </p>
            <ol>
              {siblings.map((s) => (
                <li key={s.href}>{s.href === current ? <span aria-current="page">{s.title}</span> : <Link href={s.href}>{s.title}</Link>}</li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}
