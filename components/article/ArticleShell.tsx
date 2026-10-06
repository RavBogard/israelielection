import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import "./article.css";
import type { ArticleMeta } from "@/lib/articles";
import CorrectionLink from "../CorrectionLink";
import { Chart } from "./Article";
import { LEAD_CHARTS } from "./leads";

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
  lead,
}: {
  meta: ArticleMeta;
  Body: ComponentType<{ components?: Record<string, ComponentType<{ id: string }>> }>;
  section: Sibling;
  siblings?: Sibling[];
  current?: string;
  /** A signed note set before the body, in the author's voice (About only). */
  foreword?: ReactNode;
  /** The page's lead figure, set right under the title so the graphic comes before the prose. */
  lead?: ReactNode;
}) {
  const leadChart = !lead && current ? LEAD_CHARTS[current] : undefined;
  // The lead chart moves to the top, so the body leaves it out where the copy places it.
  const components = leadChart ? { Chart: ({ id }: { id: string }) => (id === leadChart ? null : <Chart id={id} />) } : undefined;
  return (
    <div className="wrap article-page">
      <div className={`article-grid${siblings.length ? "" : " solo"}`}>
        <article className="article">
          <p className="kicker">
            <Link href={section.href}>{section.title}</Link>
          </p>
          <h1>{meta.title}</h1>
          <p className="dek">{meta.dek}</p>
          {lead ?? (leadChart && <div className="lead-fig"><Chart id={leadChart} /></div>)}
          <p className="checked">Facts checked {DATE.format(new Date(meta.checked))}. Every number shows its source and date.</p>
          {foreword}
          <div className="body">
            <Body components={components} />
          </div>
          {current && current.startsWith("/issues/") && <p className="article-export"><Link href={`/export/issue?issue=${({"haredi-draft":"draft",courts:"courts","war-hostages":"war","west-bank":"wb","religion-state":"relig",economy:"econ","palestinian-state":"pstate"} as Record<string,string>)[current.split("/").at(-1)!] ?? ""}`}>Print or export recorded party positions on this issue</Link></p>}
          <p className="article-correction"><CorrectionLink page={current} /> · <Link href="/corrections">Correction history and verification</Link></p>
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
