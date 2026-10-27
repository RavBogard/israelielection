import Link from "next/link";
import "@/components/article/article.css";
import Timeline from "@/components/Timeline";
import results from "@/data/results.json";
import timelineJson from "@/data/timeline.json";
import { decadeOf, type Source, type Timeline as Data } from "@/lib/timeline";
import PageHead from "@/components/PageHead";

import { translatedTool } from "@/lib/reference/catalog";
import { editionPath, type Lang } from "@/lib/i18n";
import { historyText, historicalDate } from "@/lib/i18n/history";

function Cite({ s, lang }: { s: Source; lang: Lang }) {
  return (
    <a href={s.url}>
      {s.name}
      {s.date ? `, ${historicalDate(s.date, lang)}` : ""}
    </a>
  );
}

export default function TimelinePage({ lang = "en" }: { lang?: Lang }) {
  const edition = translatedTool("tools:timeline", lang, timelineJson),
    data = edition.data as Data,
    t = historyText(lang),
    date = (value: string) => historicalDate(value, lang);

  const decades = [...new Set(data.events.map((e) => decadeOf(e.date)))];
  return (
    <div
      className="wrap article-page timeline-page"
      data-historical-edition="2026"
      data-historical-view="timeline"
    >
      <PageHead title={t.timelineTitle} standfirst={t.timelineIntro} />
      <p className="note">{t.archive}</p>
      {lang !== "en" && edition.state !== "ready" && (
        <p className="note" role="status">
          {t.original}
        </p>
      )}

      <Timeline
        data={data}
        electionDay={results.election}
        lang={lang}
        contentLang={edition.contentLang}
      />
      <p className="tl-checked">
        {t.checked}: <time dateTime={data.checked}>{date(data.checked)}</time>
      </p>

      <div className="article-grid solo">
        <article className="article tl-list">
          <div className="body">
            <h2>{t.allEvents}</h2>
            {decades.map((d) => (
              <section key={d} aria-label={d}>
                <h3>
                  {d.slice(0, -1)}–{Number(d.slice(0, -1)) + 9}
                </h3>
                <ol>
                  {data.events
                    .filter((e) => decadeOf(e.date) === d)
                    .map((e) => (
                      <li key={e.date + e.title}>
                        <span className="d">{date(e.date)}</span>
                        <br />
                        <span lang={edition.contentLang} dir="auto">
                          <span className="t">{e.title}.</span> {e.text}
                        </span>{" "}
                        <span className="s">
                          (<Cite s={e.source} lang={lang} />)
                        </span>
                      </li>
                    ))}
                </ol>
              </section>
            ))}

            <h2>{t.elections}</h2>
            <p>
              <Link href={editionPath("/how-it-works/seats", lang)!}>
                {t.seats}
              </Link>{" "}
              ·{" "}
              <Link
                href={editionPath("/how-it-works/forming-a-government", lang)!}
              >
                {t.outcome}
              </Link>
            </p>
            <div className="tl-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t.election}</th>
                    <th scope="col">{t.largest}</th>
                    <th scope="col">{t.second}</th>
                    <th scope="col">{t.turnout}</th>
                    <th scope="col">{t.outcome}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.elections.map((e) => (
                    <tr key={e.date}>
                      <th scope="row">
                        {date(e.date)}
                        <br />
                        <span className="s">
                          {t.election} {e.knesset}
                        </span>
                      </th>
                      <td>
                        <span lang={edition.contentLang} dir="auto">
                          {e.first.list}
                        </span>{" "}
                        {e.first.seats}
                      </td>
                      <td>
                        <span lang={edition.contentLang} dir="auto">
                          {e.second.list}
                        </span>{" "}
                        {e.second.seats}
                      </td>
                      <td>
                        {e.turnout !== undefined
                          ? `${e.turnout.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td lang={edition.contentLang} dir="auto">
                        {e.outcome}{" "}
                        <span className="s">
                          (<Cite s={e.source} lang={lang} />
                          {e.outcomeSource && (
                            <>
                              ; <Cite s={e.outcomeSource} lang={lang} />
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

            <h2>{t.primeMinisters}</h2>
            <div className="tl-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t.primeMinisters}</th>
                    <th scope="col">{t.party}</th>
                    <th scope="col">{t.from}</th>
                    <th scope="col">{t.to}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.governments.map((g) => (
                    <tr key={g.from}>
                      <th scope="row">
                        {g.pm}{" "}
                        <span className="s">
                          (<Cite s={g.source} lang={lang} />)
                        </span>
                      </th>
                      <td>{g.party}</td>
                      <td>{date(g.from)}</td>
                      <td>{g.to ? date(g.to) : t.asRecorded}</td>
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
