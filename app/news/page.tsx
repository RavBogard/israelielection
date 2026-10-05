import type { Metadata } from "next";
import Link from "next/link";
import briefingsJson from "@/data/briefings/_index.json";
import "@/components/interactives.css";
import "@/components/news.css";
import type { Briefing } from "@/lib/briefing";
import { longDate } from "@/lib/format";
import { FEEDS, fetchNews } from "@/lib/news";

export const metadata: Metadata = {
  title: "News",
  description: "A daily briefing on what changed in Israel's 2026 election, every sentence sourced, plus the latest headlines from English-language outlets.",
};

// Headlines refresh every 15 minutes (plan).
export const revalidate = 900;

const briefings = briefingsJson as Briefing[];

const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

function Sentences({ b }: { b: Briefing }) {
  return (
    <>
      {b.sentences.map((s, i) => (
        <p key={i}>
          {s.text}{" "}
          {s.sources.map((src, j) => (
            <a key={j} className="cite" href={src.url} target="_blank" rel="noopener" title={src.title}>
              {src.outlet}
            </a>
          ))}
        </p>
      ))}
    </>
  );
}

export default async function Page() {
  const news = await fetchNews({ sinceHours: 72, revalidate });
  const latest = briefings[0];
  const outlets = [...new Set(FEEDS.map((f) => f.outlet))];
  return (
    <div className="ix nw">
      <div className="wrap">
        <header className="page-head">
          <h1>News</h1>
          <p className="standfirst">
            A short daily briefing on what changed, then the latest headlines from {outlets.length} English-language outlets.
          </p>
          <p className="note">{outlets.join(", ")}.</p>
        </header>

        <div className="nw-layout">
          <section className="nw-brief" id={latest?.date} aria-labelledby="brief-h">
            <p className="lbl">The daily briefing</p>
            {latest ? (
              <>
                <h2 id="brief-h">{longDate(latest.date)}</h2>
                <div className="nw-sentences">
                  <Sentences b={latest} />
                </div>
                <p className="src">
                  Written by an AI model ({latest.model}) from the day&apos;s headlines and published without editing. Each sentence links the
                  reports it draws on; sentences that could not be matched to a source were removed automatically.
                </p>
                {briefings.length > 1 && (
                  <details className="nw-archive">
                    <summary>Earlier briefings</summary>
                    {briefings.slice(1, 14).map((b) => (
                      <div key={b.date} className="nw-old">
                        <h3><Link href={`/news/${b.date}`}>{longDate(b.date)}</Link></h3>
                        <Sentences b={b} />
                      </div>
                    ))}
                  </details>
                )}
              </>
            ) : (
              <p className="nw-none">The first briefing will appear here after the next morning run.</p>
            )}
          </section>

          <section aria-labelledby="head-h">
            <h2 id="head-h" className="nw-h">Latest headlines</h2>
            <p className="src">
              Last 72 hours, newest first. Times are Israel time. Refreshed every 15 minutes; last fetched {ET.format(new Date(news.fetchedAt))}.
              {news.indexed.length > 0 && ` ${news.indexed.join(" and ")} via Bing News, because ${news.indexed.length > 1 ? "their own feeds block" : "its own feed blocks"} our server.`}
              {news.failed.length > 0 && ` Not reachable on this refresh: ${news.failed.join(", ")}.`}
            </p>
            <ol className="nw-list">
              {news.items.slice(0, 120).map((it) => (
                <li key={it.url}>
                  <span className="nw-meta">
                    <b>{it.outlet}</b>
                    <time dateTime={it.published}>{IL.format(new Date(it.published))}</time>
                  </span>
                  <a href={it.url} target="_blank" rel="noopener" className="nw-title">
                    {it.title}
                  </a>
                  {it.summary && <span className="nw-sum">{it.summary}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
