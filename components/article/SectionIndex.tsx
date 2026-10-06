import Link from "next/link";
import type { ReactNode } from "react";
import "./article.css";
import PageHead from "@/components/PageHead";

/** The landing page of a section: a short intro, then each page's title, its one-line dek, and a preview of its figure. */
export default function SectionIndex({
  title,
  intro,
  items,
  extra,
  foot,
  band,
}: {
  title: string;
  intro: string;
  items: { href: string; title: string; dek: string; figure?: ReactNode }[];
  extra?: { href: string; title: string; dek: string; label: string };
  /** A note on the whole section, set after the items rather than above them. */
  foot?: string;
  /** A figure band between the head and the items (How it works: the election on one page). */
  band?: ReactNode;
}) {
  return (
    <div className="wrap article-page">
      <div className="sindex">
        <PageHead title={title} standfirst={intro} />
        {band}
        <ul className="items">
          {items.map((s) => (
            <li key={s.href}>
              <h2>
                <Link href={s.href}>{s.title}</Link>
              </h2>
              <p>{s.dek}</p>
              {s.figure}
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
