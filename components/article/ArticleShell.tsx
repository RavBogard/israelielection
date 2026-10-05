import Link from "next/link";
import type { ComponentType } from "react";
import "./article.css";
import type { ArticleMeta } from "@/lib/articles";

const DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export type Sibling = { href: string; title: string };

/** The frame of every reference page: section link, title, dek, check date, body, and the rest of the section. */
export default function ArticleShell({
  meta,
  Body,
  section,
  siblings = [],
  current,
}: {
  meta: ArticleMeta;
  Body: ComponentType;
  section: Sibling;
  siblings?: Sibling[];
  current?: string;
}) {
  return (
    <div className="article">
      <p className="kicker">
        <Link href={section.href}>{section.title}</Link>
      </p>
      <h1>{meta.title}</h1>
      <p className="dek">{meta.dek}</p>
      <p className="checked">Facts checked {DATE.format(new Date(meta.checked))}. Every number shows its source and date.</p>
      <div className="body">
        <Body />
      </div>
      {siblings.length > 0 && (
        <nav className="more" aria-label={section.title}>
          <p className="kicker">{section.title}</p>
          <ul>
            {siblings.map((s) => (
              <li key={s.href}>{s.href === current ? <span aria-current="page">{s.title}</span> : <Link href={s.href}>{s.title}</Link>}</li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
