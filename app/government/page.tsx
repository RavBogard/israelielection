import type { Metadata } from "next";
import Link from "next/link";
import "@/components/article/article.css";
import "@/components/government.css";
import formationJson from "@/data/formation.json";
import { type Formation, type Milestone, withDates } from "@/lib/formation";
import { mediumDate } from "@/lib/format";

const formation = withDates(formationJson as Formation);

export const metadata: Metadata = {
  title: "Forming a government",
  description:
    "The clock on forming Israel's next government after the October 27, 2026 election: each step Basic Law: The Government allows, its time limit, and where the process stands.",
};

// Daily: the step we are in changes with the calendar; the data changes by commit.
export const revalidate = 3600;

const DAY = 86_400_000;
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);

/** The date line for a milestone: what happened, or the latest the law allows, or the rule until the results are in. */
function when(m: Milestone): { label: string; date: string | null; kind: "done" | "latest" | "rule" | "skipped" } {
  if (m.status === "skipped") return { label: "Not needed", date: null, kind: "skipped" };
  if (m.actual) return { label: m.status === "extended" ? "Extended" : "Done", date: m.actual, kind: "done" };
  if (m.latest) return { label: m.earliest && m.earliest !== m.latest ? "Between" : "At the latest", date: m.latest, kind: "latest" };
  return { label: "", date: null, kind: "rule" };
}

/** Where the process stands: the first step not yet done, or the end. */
function current(ms: Milestone[]): string | null {
  const open = ms.find((m) => m.status === "upcoming" && !m.actual);
  return open?.id ?? null;
}

export default function Page() {
  const f = formation;
  const now = today();
  const sinceVote = daysBetween(f.electionDay, now);
  const published = f.milestones.find((m) => m.id === "results")?.actual ?? null;
  const main = f.milestones.filter((m) => m.id !== "new-election");
  const alt = f.milestones.find((m) => m.id === "new-election")!;
  const cur = current(main);

  return (
    <div className="wrap article-page gov">
      <header className="page-head">
        <h1>{f.title}</h1>
        <p className="standfirst">{f.standfirst}</p>
        <p className="note">
          Checked {mediumDate(f.checked)}. Time limits from <a href={f.rulesSource.url}>Basic Law: The Government, arts. 7 to 13</a>.
        </p>
      </header>

      <section className="gov-today" aria-label="Where the process stands">
        {sinceVote < 0 ? (
          <p>
            <b>{-sinceVote === 1 ? "One day" : `${-sinceVote} days`} to the vote.</b> The clock below has no calendar dates until the committee publishes the official results; each
            step shows the limit the law sets instead.
          </p>
        ) : published ? (
          <p>
            <b>Day {sinceVote} since the vote</b>, day {daysBetween(published, now)} since the official results. The law&apos;s longest path ends{" "}
            {mediumDate(f.milestones.find((m) => m.id === "third-period")?.latest ?? published)}.
          </p>
        ) : (
          <p>
            <b>Day {sinceVote} since the vote.</b> The clock starts when the committee publishes the official results, expected about a week after election day.
          </p>
        )}
      </section>

      <ol className="gov-steps">
        {main.map((m, i) => {
          const w = when(m);
          const isCur = m.id === cur && sinceVote >= 0;
          return (
            <li key={m.id} className={`step ${m.status}${isCur ? " current" : ""}`} aria-current={isCur ? "step" : undefined}>
              <div className="num">{i + 1}</div>
              <div className="body">
                <h2>{m.title}</h2>
                <p className="when">
                  {w.kind === "done" && (
                    <>
                      {w.label} <time dateTime={w.date!}>{mediumDate(w.date!)}</time>
                    </>
                  )}
                  {w.kind === "latest" && (
                    <>
                      {m.earliest === m.latest ? (
                        <time dateTime={w.date!}>{mediumDate(w.date!)}</time>
                      ) : m.earliest ? (
                        <>
                          Between <time dateTime={m.earliest}>{mediumDate(m.earliest)}</time> and <time dateTime={w.date!}>{mediumDate(w.date!)}</time>
                        </>
                      ) : (
                        <>
                          At the latest <time dateTime={w.date!}>{mediumDate(w.date!)}</time>
                        </>
                      )}
                    </>
                  )}
                  {w.kind === "skipped" && w.label}
                  {w.kind === "rule" && m.note}
                  {isCur && <span className="now">Now</span>}
                </p>
                <p className="rule">{m.rule}</p>
                {m.who && <p className="who">{m.who}</p>}
                {w.kind !== "rule" && m.note && <p className="note">{m.note}</p>}
                <p className="src">
                  <a href={m.source.url}>{m.source.name}</a>
                  {m.source.date && <>, {m.source.date}</>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="gov-alt" aria-labelledby="alt-h">
        <h2 id="alt-h">{alt.title}</h2>
        <p className="when">{alt.latest ? <>At the latest {mediumDate(alt.latest)}</> : alt.note}</p>
        <p className="rule">{alt.rule}</p>
        <p className="src">
          <a href={alt.source.url}>{alt.source.name}</a>
          {alt.source.date && <>, {alt.source.date}</>}
        </p>
      </section>

      <p className="gov-more">
        How the steps work, with the record since 1996: <Link href="/how-it-works/forming-a-government">Forming a government</Link>. Try the arithmetic yourself:{" "}
        <Link href="/coalition-builder">Coalition Builder</Link>.
      </p>
    </div>
  );
}
