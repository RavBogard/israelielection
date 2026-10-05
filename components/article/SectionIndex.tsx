import Link from "next/link";
import "./article.css";

/** The landing page of a section: a short intro, then each page's title and dek. */
export default function SectionIndex({
  title,
  intro,
  items,
  extra,
}: {
  title: string;
  intro: string;
  items: { href: string; title: string; dek: string }[];
  extra?: { href: string; title: string; dek: string; label: string };
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
              <p>{s.dek}</p>
            </li>
          ))}
        </ul>
        {extra && (
          <div className="extra">
            <p className="lbl">{extra.label}</p>
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
