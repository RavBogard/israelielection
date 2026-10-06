import type { Metadata } from "next";
import Link from "next/link";
import "@/components/article/article.css";
import Timeline from "@/components/Timeline";
import results from "@/data/results.json";
import timelineJson from "@/data/timeline.json";
import { decadeOf, longDate, type Source, type Timeline as Data } from "@/lib/timeline";

const data = timelineJson as Data;

export const metadata: Metadata = {
  title: "Timeline, 1977–2026",
  description: "Israeli politics from Likud's first win in 1977 to the 2026 election: every Knesset election, every prime minister, and the events that shaped the vote.",
};

const when = (d: string) => (/^\d{4}-\d\d-\d\d$/.test(d) ? longDate(d) : d);
function Cite({ s }: { s: Source }) {
  return (
    <a href={s.url}>
      {s.name}
      {s.date ? `, ${when(s.date)}` : ""}
    </a>
  );
}

export default function Page() {
  const decades = [...new Set(data.events.map((e) => decadeOf(e.date)))];
  return (
    <div className="wrap article-page timeline-page">
      <header className="page-head">
        <h1>Timeline, 1977–2026</h1>
        <p className="standfirst">Every prime minister, every Knesset election and {data.events.length} events since Likud&apos;s first win. Drag along the line.</p>
      </header>

      <Timeline data={data} electionDay={results.election} />
      <p className="tl-checked">Facts checked {longDate(data.checked)}; each event links its source.</p>

      <div className="article-grid solo">
        <article className="article tl-list">
          <div className="body">
            <h2>Every event</h2>
            {decades.map((d) => (
              <section key={d} aria-label={d}>
                <h3>{d}</h3>
                <ol>
                  {data.events
                    .filter((e) => decadeOf(e.date) === d)
                    .map((e) => (
                      <li key={e.date + e.title}>
                        <span className="d">{longDate(e.date)}</span>
                        <br />
                        <span className="t">{e.title}.</span> {e.text}{" "}
                        <span className="s">
                          (<Cite s={e.source} />)
                        </span>
                      </li>
                    ))}
                </ol>
              </section>
            ))}

            <h2>Knesset elections</h2>
            <p>
              The two largest lists in each election, by seats of 120. How seats are won, and why the largest list does not always govern:{" "}
              <Link href="/how-it-works/seats">From votes to seats</Link> and <Link href="/how-it-works/forming-a-government">Forming a government</Link>.
            </p>
            <div className="tl-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Election</th>
                    <th scope="col">Largest list</th>
                    <th scope="col">Second</th>
                    <th scope="col">Turnout</th>
                    <th scope="col">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {data.elections.map((e) => (
                    <tr key={e.date}>
                      <th scope="row">
                        {longDate(e.date)}
                        <br />
                        <span className="s">Knesset {e.knesset}</span>
                      </th>
                      <td>
                        {e.first.list} {e.first.seats}
                      </td>
                      <td>
                        {e.second.list} {e.second.seats}
                      </td>
                      <td>{e.turnout !== undefined ? `${e.turnout.toFixed(1)}%` : "—"}</td>
                      <td>
                        {e.outcome}{" "}
                        <span className="s">
                          (<Cite s={e.source} />
                          {e.outcomeSource && (
                            <>
                              ; <Cite s={e.outcomeSource} />
                            </>
                          )}
                          )
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Prime ministers</h2>
            <div className="tl-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Prime minister</th>
                    <th scope="col">Party</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                  </tr>
                </thead>
                <tbody>
                  {data.governments.map((g) => (
                    <tr key={g.from}>
                      <th scope="row">
                        {g.pm} <span className="s">(<Cite s={g.source} />)</span>
                      </th>
                      <td>{g.party}</td>
                      <td>{longDate(g.from)}</td>
                      <td>{g.to ? longDate(g.to) : "In office"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
