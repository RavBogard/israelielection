import "@/lib/i18n/overlays";
import "@/components/interactives.css";
import "@/components/coalition.css";
import "@/components/embed.css";
import Link from "next/link";
import { averagePoll, blocs, mainPolls, parties } from "@/lib/data";
import { EMBEDS } from "@/lib/i18n/embeds";
import { editionPath, isRtl, locale, type Lang } from "@/lib/i18n";
import { blocText, partyText } from "@/lib/i18n/overlay-text";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { blocTotals, seatFigure } from "@/lib/polls";
import { partyColor, blocColorStrip } from "@/lib/party-colors";
import { resolveSeatSelection } from "@/lib/seat-selection";
import { seatContextForRender } from "@/lib/seat-context-server";
import SeatGrid from "@/components/SeatGrid";
import SeatBasis from "@/components/seat-context/SeatBasis";
import CoalitionBuilder from "@/components/CoalitionBuilder";
import EmbedFooter from "@/components/EmbedFooter";

export type EmbedKind = "grid" | "average" | "builder";
export type EmbedQuery = Promise<Record<string, string | string[] | undefined>>;
export default async function EmbedPage({
  kind,
  lang,
  searchParams,
}: {
  kind: EmbedKind;
  lang: Lang;
  searchParams: EmbedQuery;
}) {
  const t = EMBEDS[lang],
    values = await searchParams;
  const q = new URLSearchParams(
    Object.entries(values).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const revision = q.get("context") ?? undefined;
  if (kind === "builder") {
    const context = await seatContextForRender(revision);
    if (!context)
      return <SeatBasis context={null} lang={lang} pinned={!!revision} />;
    return (
      <div className="embed-page ix">
        <CoalitionBuilder initialContext={context} pinned={!!revision} />
        <EmbedFooter
          lang={lang}
          path="/coalition-builder"
          asOf={context.countSourceUpdatedAt ?? context.updatedAt}
          dateLine={`${LIFECYCLE[lang][context.basis]}. ${LIFECYCLE[lang][context.seatStatus]}`}
        />
      </div>
    );
  }
  const selection =
    kind === "average"
      ? { poll: averagePoll, context: null }
      : await resolveSeatSelection(q);
  if (!selection)
    return <SeatBasis context={null} lang={lang} pinned={!!revision} />;
  const { poll, context } = selection;
  const name = (id: string) => {
    const p = parties.find((p) => p.id === id);
    return p
      ? partyText(p, "name", lang).text
      : (context?.parties.find((p) => p.id === id)?.label ?? id);
  };
  const ordered = ["net", "mid", "opp", "arab"].flatMap((id) =>
    parties.filter((p) => p.bloc === id).map((p) => p.id),
  );
  const ids = [
    ...ordered,
    ...Object.keys(poll.results).filter((id) => !ordered.includes(id)),
  ].filter((id) => (poll.results[id]?.seats ?? 0) > 0);
  const segments = ids.map((id) => ({
    id,
    seats: poll.results[id].seats,
    color: parties.some((p) => p.id === id) ? partyColor(id) : "#777777",
    label: name(id),
    href: editionPath(`/parties/${id}`, lang) ?? `/parties/${id}`,
  }));
  // Unprofiled lists remain in the 120-seat frame without a fabricated profile.
  for (const segment of segments)
    if (!parties.some((p) => p.id === segment.id))
      segment.href = editionPath("/government", lang) ?? "/government";
  const totals = blocTotals(poll, parties);
  const unknown = ids
    .filter((id) => !parties.some((p) => p.id === id))
    .reduce((n, id) => n + poll.results[id].seats, 0);
  const date = new Intl.DateTimeFormat(locale(lang), {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(poll.published));
  return (
    <div className="embed-page" lang={lang} dir={isRtl(lang) ? "rtl" : "ltr"}>
      <h1 className="embed-head">
        {t[kind]}
        {kind === "average" && (
          <>
            , <time dateTime={poll.published}>{date}</time>
          </>
        )}
      </h1>
      <p className="embed-sub">
        {kind === "average"
          ? t.averageNote
          : context
            ? `${LIFECYCLE[lang][context.basis]}. ${LIFECYCLE[lang][context.seatStatus]}.`
            : poll.pollster}{" "}
        {t.majority}
      </p>
      {context && (
        <SeatBasis context={context} lang={lang} pinned={!!revision} share />
      )}
      <div className="embed-grid">
        <SeatGrid segments={segments} lang={lang} rtl={isRtl(lang)} labelRule />
        <div>
          <dl className="blocs">
            {blocs.map((b) => (
              <div key={b.id}>
                <dt>
                  <span
                    className="sw"
                    style={{ background: blocColorStrip(b.id) }}
                  />
                  {blocText(b, lang).text}
                </dt>
                <dd>{seatFigure(totals[b.id])}</dd>
              </div>
            ))}
            {unknown > 0 && (
              <div>
                <dt>{t.other}</dt>
                <dd>{unknown}</dd>
              </div>
            )}
          </dl>
          <p className="fig-note">{t.rule}</p>
        </div>
      </div>
      <table className="embed-table">
        <thead>
          <tr>
            <th scope="col">{t.party}</th>
            <th scope="col">{t.bloc}</th>
            <th scope="col" className="num">
              {t.seats}
            </th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const party = parties.find((p) => p.id === id),
              bloc = blocs.find((b) => b.id === party?.bloc);
            return (
              <tr key={id}>
                <th scope="row">{name(id)}</th>
                <td>{bloc ? blocText(bloc, lang).text : t.other}</td>
                <td className="num">{seatFigure(poll.results[id].seats)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="fig-note">
        <Link href={editionPath("/parties", lang) ?? "/parties"}>{t.key}</Link>
      </p>
      <EmbedFooter
        lang={lang}
        path={kind === "average" ? "/polls" : "/results"}
        asOf={kind === "average" ? poll.published : context ? (context.countSourceUpdatedAt ?? context.updatedAt) : poll.published}
        dateLine={
          kind === "average"
            ? `${t.polls}: ${mainPolls.length}`
            : context
              ? `${LIFECYCLE[lang][context.basis]}. ${LIFECYCLE[lang][context.seatStatus]}`
              : poll.pollster
        }
      />
    </div>
  );
}
