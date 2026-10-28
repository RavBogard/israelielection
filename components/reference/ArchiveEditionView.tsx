import Link from "next/link";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { PLATFORM_COPY } from "@/lib/i18n/platform-copy";
import { referenceText } from "@/lib/i18n/reference";
import type { ArchiveEdition } from "@/lib/archive-editions";

/** A read-only summary edition: the committee's final figures, the government that formed, and where each figure comes from. */
export default function ArchiveEditionView({ edition, lang }: { edition: ArchiveEdition; lang: Lang }) {
  const t = PLATFORM_COPY[lang],
    r = referenceText(lang),
    loc = locale(lang),
    href = (p: string) => editionPath(p, lang) ?? p,
    num = (n: number) => n.toLocaleString(loc),
    pct = (n: number, d = 1) => `${n.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d })}%`,
    day = (iso: string) => new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: "Asia/Jerusalem" }).format(new Date(`${iso}T12:00:00Z`));
  return (
    <section data-archive-edition={edition.id} aria-label={t.finalResult}>
      <p>{t.archiveNote}</p>
      <p>
        {r.electionDate}: <time dateTime={edition.electionDay}>{day(edition.electionDay)}</time>
      </p>
      <h2>{t.finalResult}</h2>
      <div className="export-table">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.colList}</th>
              <th scope="col">{t.colVotes}</th>
              <th scope="col">{t.colShare}</th>
              <th scope="col">{t.colSeats}</th>
            </tr>
          </thead>
          <tbody>
            {edition.lists.map((l) => (
              <tr key={l.name}>
                <th scope="row" lang="en" dir="ltr">{l.name}</th>
                <td>{num(l.votes)}</td>
                <td>{pct(l.sharePct)}</td>
                <td>{num(l.seats)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{t.noBloc}</p>
      <ul>
        <li>{t.turnout}: {pct(edition.turnoutPct)}</li>
        <li>{t.eligible}: {num(edition.national.eligible)}</li>
        <li>{t.voters}: {num(edition.national.voted)}</li>
        <li>{t.valid}: {num(edition.national.valid)}</li>
      </ul>
      {edition.government && (
        <>
          <h2>{t.government}</h2>
          <p lang="en" dir="ltr">{edition.government.text}</p>
          <p>
            <a href={edition.government.source.url}>{edition.government.source.name}{edition.government.source.date ? `, ${edition.government.source.date}` : ""}</a>
          </p>
        </>
      )}
      <h2>{t.sources}</h2>
      <ul>
        <li>
          <a href={edition.source.results}>{t.committeeResults}</a>, {t.filesFetched(day(edition.source.fetched))}
        </li>
        {edition.timelineSource && (
          <li>
            <a href={edition.timelineSource.url}>{edition.timelineSource.name}</a>
          </li>
        )}
      </ul>
      <p>
        <Link href={`${href("/vote-map")}?election=${edition.voteMapId}`}>{t.voteMap}</Link>
        {", "}
        <Link href={href("/timeline")}>{t.timelineRow}</Link>
      </p>
    </section>
  );
}
