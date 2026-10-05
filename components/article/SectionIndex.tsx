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
    <div className="article sindex">
      <h1>{title}</h1>
      <p className="dek">{intro}</p>
      <ol className="items">
        {items.map((s, i) => (
          <li key={s.href}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2>
                <Link href={s.href}>{s.title}</Link>
              </h2>
              <p>{s.dek}</p>
            </div>
          </li>
        ))}
      </ol>
      {extra && (
        <div className="extra">
          <p className="kicker">{extra.label}</p>
          <h2>
            <Link href={extra.href}>{extra.title}</Link>
          </h2>
          <p>{extra.dek}</p>
        </div>
      )}
    </div>
  );
}
