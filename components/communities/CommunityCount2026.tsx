"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSeatContext } from "@/components/seat-context/SeatContextProvider";
import type { CommunityCountResponse } from "@/lib/community-count";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { EXIT_LINE } from "@/lib/i18n/exit-line";
import { fill } from "@/lib/i18n/post-count";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import "./community-count.css";

/** Names by ballot letters (the CEC file's own columns), in the edition's language; the town names stay as the vote map spells them. */
export type CommunityNames = Record<string, string>;

const pct = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang), { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
const when = (iso: string, lang: Lang) => {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(locale(lang), { dateStyle: "medium", timeZone: "Asia/Jerusalem" }).format(d);
  const time = new Intl.DateTimeFormat(locale(lang), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jerusalem" }).format(d);
  return `${date}, ${time} ${EXIT_LINE[lang].israelTime}`;
};

/**
 * A community's towns in the 2026 count so far: the lists' shares of valid votes, combined and town by town, with the
 * file's time and the share of voters counted. Provisional until the shared seat context says official, then it says so.
 * Reads the stored count through /api/community-count; if that has nothing, it says so rather than showing a figure.
 */
export default function CommunityCount2026({ slug, lang, names, combinedOnly }: { slug: string; lang: Lang; names: CommunityNames; combinedOnly: boolean }) {
  const T = POST_RECORDS[lang];
  const { context } = useSeatContext();
  const official = context?.seatStatus === "official";
  const [data, setData] = useState<CommunityCountResponse | "loading">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/community-count?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<CommunityCountResponse>)
      .then(setData)
      .catch((e) => { if (!controller.signal.aborted) setData({ state: "unavailable", reason: "no_count" }); void e; });
    return () => controller.abort();
  }, [slug]);
  return (
    <section className="cc" aria-labelledby={`cc-h-${slug}`} data-testid="community-count" data-provisional={official ? "false" : "true"}>
      <h2 id={`cc-h-${slug}`}>{official ? T.commTitleOfficial : T.commTitle}</h2>
      {data === "loading" ? (
        <p role="status">{T.commLoading}</p>
      ) : data.state === "unavailable" ? (
        <p role="status" data-testid="community-count-unavailable">{T.commUnavailable}</p>
      ) : (
        <>
          <p>{official ? T.commIntroOfficial : T.commIntro}</p>
          <div className="table-scroll" tabIndex={0} role="region" aria-label={official ? T.commTitleOfficial : T.commTitle}>
            <table className="data-table cc-table">
              <thead>
                <tr>
                  <th scope="col">{T.commList}</th>
                  <th scope="col" className="num">{T.commCombined}</th>
                  {!combinedOnly && data.block.towns.map((town) => <th key={town.code} scope="col" className="num" lang="en" dir="ltr">{town.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.block.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{names[row.letters] ?? row.letters}</th>
                    <td className="num"><bdi dir="ltr">{pct(row.share, lang)}</bdi></td>
                    {!combinedOnly && row.perTown.map((v, i) => <td key={data.block.towns[i].code} className="num">{v === null ? <span className="cc-na">{T.commNotCounted}</span> : <bdi dir="ltr">{pct(v, lang)}</bdi>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fig-src">
            {fill(T.commTowns, { k: data.block.counted, n: data.block.towns.length })}.{" "}
            {fill(official ? T.commSourceOfficial : T.commSource, { when: when(data.fileTime, lang), pct: pct(data.countedShare, lang) })}{" "}
            <Link href={editionPath("/vote-map?election=2026", lang) ?? "/vote-map?election=2026"}>{T.commMap}</Link>
          </p>
        </>
      )}
    </section>
  );
}
