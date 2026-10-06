import Link from "next/link";
import type { ReactNode } from "react";
import "./article.css";

/** The landing page of a section: a short intro, then each page's title, its figure when it has one, and dek. */
export default function SectionIndex({
  title,
  intro,
  items,
  extra,
  foot,
}: {
  title: string;
  intro: string;
  items: { href: string; title: string; dek: string; figure?: ReactNode }[];
  extra?: { href: string; title: string; dek: string; label: string };
  /** A note on the whole section, set after the items rather than above them. */
  foot?: string;
}) {
  return (
    <div className="wrap article-page">
      <div className="sindex">
        <header className="page-head">
          <h1>{title}</h1>
          <p className="standfirst">{intro}</p>
        </header>
        <ul className="items">
          {items.map((s) => (
            <li key={s.href}>
              <h2>
                <Link href={s.href}>{s.title}</Link>
              </h2>
              {s.figure}
              <p>{s.dek}</p>
            </li>
          ))}
        </ul>
        {foot && <p className="sindex-foot">{foot}</p>}
        {extra && (
          <div className="extra">
            <h2>
              <Link href={extra.href}>{extra.title}</Link>
            </h2>
            <p>{extra.dek}</p>
          </div>
        )}
      </div>
    </div>
  );
}
