import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/components/interactives.css";
import "@/components/news.css";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import PageHead from "@/components/PageHead";
import Sentences from "../Sentences";

const briefings = briefingsJson as Briefing[];
const LONG = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const label = (date: string) => LONG.format(new Date(`${date}T12:00:00Z`));

export function generateStaticParams() {
  return briefings.map((b) => ({ date: b.date }));
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const b = briefings.find((x) => x.date === date);
  if (!b) return { title: "Briefing" };
  return {
    title: `Briefing, ${label(b.date)}`,
    alternates: alternates(`/news/${b.date}`),
    description: b.sentences[0]?.text ?? "The daily briefing on Israel's 2026 election, every sentence sourced.",
  };
}

/** One day's briefing at its own address, so a day can be linked, quoted and found again. */
export default async function Page({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const i = briefings.findIndex((x) => x.date === date);
  if (i < 0) notFound();
  const b = briefings[i];
  const newer = briefings[i - 1];
  const older = briefings[i + 1];
  return (
    <div className="ix nw">
      <div className="wrap">
        <PageHead title={<>Briefing, {label(b.date)}</>} standfirst={<>What changed in Israel&apos;s 2026 election that day, in a few sentences. Each sentence links the report it rests on.</>}>
          <p className="ph-meta">
            Written by an AI model ({b.model}) from the day&apos;s headlines at {IL.format(new Date(b.generatedAt))} Israel time; sentences that could not be matched to a
            source were removed automatically. <Link href="/news">Today&apos;s briefing and the latest headlines</Link>
          </p>
        </PageHead>
        <section className="nw-brief nw-brief-page" aria-label="The briefing">
          <div className="nw-sentences">
            <Sentences b={b} topics level={2} />
          </div>
        </section>
        <nav className="nw-pager" aria-label="Other days">
          {older && <Link href={`/news/${older.date}`}>Earlier: {label(older.date)}</Link>}
          {newer && <Link href={`/news/${newer.date}`}>Later: {label(newer.date)}</Link>}
        </nav>
      </div>
    </div>
  );
}
