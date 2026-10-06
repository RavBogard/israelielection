import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import ArticleShell from "@/components/article/ArticleShell";
import Body, { meta } from "@/content/about.mdx";
import note from "@/data/home-note.json";
import { mediumDate } from "@/lib/format";

export const metadata: Metadata = { title: meta.title, description: meta.dek, alternates: alternates("/about") };

/** Daniel's signed note, approved 2026-10-05 for the home page and moved here when the home page was cut down. */
function Foreword() {
  if (!note.text) return null;
  return (
    <aside className="foreword" aria-label="A note from Daniel">
      {note.text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      <p className="sig">
        {note.signed}
        {note.date && <>, {mediumDate(note.date)}</>}
      </p>
    </aside>
  );
}

export default function Page() {
  return <ArticleShell meta={meta} Body={Body} section={{ href: "/", title: "Israel Votes 2026" }} foreword={<Foreword />} />;
}
