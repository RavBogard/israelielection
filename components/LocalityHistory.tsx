"use client";
import { isCurrentElectionRef } from "@/lib/political-record/elections";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HISTORY_ELECTIONS, localityHistory } from "@/lib/locality-history";
import { editionPath, type Lang } from "@/lib/i18n";
import { mapText, mapMessage, mapDate } from "@/lib/i18n/vote-map";
import type { VoteMapElection } from "@/lib/votemap";
import type { MapMode } from "@/lib/votemap-visual";
export default function LocalityHistory({
  code,
  name,
  election,
  list,
  mode = "single",
  current,
  geographyRevision,
  lang = "en",
}: {
  code: number;
  name: string;
  election: string;
  list: string;
  mode?: MapMode;
  current?: VoteMapElection;
  geographyRevision?: string;
  lang?: Lang;
}) {
  const [files, setFiles] = useState<VoteMapElection[]>([]),
    [error, setError] = useState(false),
    t = mapText(lang);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    Promise.all(
      HISTORY_ELECTIONS.map(async (id) => {
        const res = await fetch(`/vote-map/${id}.json`, {
          signal: controller.signal,
        });
        if (!res.ok) throw Error("history_unavailable");
        return res.json() as Promise<VoteMapElection>;
      }),
    )
      .then((data) => {
        if (active) setFiles(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  const exportHref = editionPath(
    `/export/locality?${new URLSearchParams({ locality: String(code), election, list, mode, ...(isCurrentElectionRef(election) && geographyRevision ? { geography: geographyRevision } : {}) })}`,
    lang,
  )!;
  const number = (n: number) => n.toLocaleString("en-US"),
    share = (n: number | null | undefined) =>
      n == null ? t.notAvailable : `${(n * 100).toFixed(2)}%`;
  return (
    <section className="vm-history" aria-labelledby="vm-history-h">
      <h2 id="vm-history-h">
        <bdi lang="en">{name}</bdi>: {t.history}
      </h2>
      <p>{mapMessage(t.historyNote, code)}</p>
      <p>
        <Link href={exportHref}>{t.export}</Link>
      </p>
      {error ? (
        <p role="status">{t.historyError}</p>
      ) : !files.length ? (
        <p role="status">{t.historyLoading}</p>
      ) : (
        <div
          className="vm-tw"
          role="region"
          aria-label={t.history}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>{t.election}</th>
                <th>{t.eligible}</th>
                <th>
                  {t.voted} / {t.valid}
                </th>
                <th>{t.turnout}</th>
                <th>{t.originalLists}</th>
                <th>{t.source}</th>
              </tr>
            </thead>
            <tbody>
              {localityHistory(current ? [...files, current] : files, code).map(
                ({ election: e, row, turnout, lists }) => (
                  <tr key={e.id}>
                    <th scope="row">
                      <time dateTime={e.date}>{mapDate(e.date, lang)}</time>
                    </th>
                    <td>{row ? number(row[1]) : t.notAvailable}</td>
                    <td>
                      {row
                        ? `${number(row[2])} / ${number(row[3])}`
                        : t.notAvailable}
                    </td>
                    <td>{share(turnout)}</td>
                    <td>
                      {row ? (
                        <details>
                          <summary>
                            <bdi lang="en">{lists[0]?.name ?? ""}</bdi>
                            {lists[0] ? `: ${share(lists[0].share)}. ` : ""}
                            {t.allLists}
                          </summary>
                          <ul>
                            {lists.map((l) => (
                              <li key={l.letters}>
                                <bdi lang="en">{l.name}</bdi> (
                                <bdi>{l.letters}</bdi>): {number(l.votes)},{" "}
                                {share(l.share)}
                              </li>
                            ))}
                            <li>
                              {t.other}:{" "}
                              {number(
                                row[3] - lists.reduce((n, l) => n + l.votes, 0),
                              )}
                            </li>
                          </ul>
                        </details>
                      ) : (
                        t.noRow
                      )}
                    </td>
                    <td>
                      <a href={e.source.csv}>{t.localSource}</a>
                      <br />
                      {t.fetched}:{" "}
                      <time dateTime={e.source.fetched}>
                        {mapDate(e.source.fetched, lang)}
                      </time>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
