import Link from "next/link";
import { blocs, parties } from "@/lib/data";
import { BLOC_ORDER, blocTotals } from "@/lib/polls";
import { exitTime } from "@/lib/results-phase";
import type { PartyResult, ResultsConfig } from "@/lib/results";
import type { Poll, PollsConfig } from "@/lib/types";
import { editionPath, type Lang } from "@/lib/i18n";
import { EXIT_TABLE } from "@/lib/i18n/exit-table";
import { partyColor } from "@/lib/party-colors";
import { splitExits } from "@/lib/exit-split";
import { blocName, listName, pollsterName, T } from "./names";
import AirTime from "./AirTime";
import NowSeats, { NowSeatsKey } from "@/components/NowSeats";
import { NOW_SEATS } from "@/lib/i18n/now-seats";
import "./exit-table.css";

type Lists = PartyResult[] | null | undefined;

/** One table: a column per broadcaster (its latest version and air time), a row per list, then the bloc totals. */
function Table({ polls, lists, updated, config, lang, testId }: { polls: Poll[]; lists?: Lists; updated: Set<string>; config: ResultsConfig; lang: Lang; testId: string }) {
  const x = EXIT_TABLE[lang];
  const counted = (id: string) => lists?.find((l) => l.partyId === id)?.seats ?? 0;
  const reported = (id: string) => polls.some((p) => p.results[id]) || counted(id) > 0;
  const top = (id: string) => Math.max(0, counted(id), ...polls.map((p) => p.results[id]?.seats ?? 0));
  const rows = parties.filter((p) => reported(p.id)).sort((a, b) => top(b.id) - top(a.id));
  const totals = polls.map((p) => blocTotals(p, parties));
  const countBloc = (b: string) => (lists ?? []).reduce((n, l) => n + (parties.find((p) => p.id === l.partyId)?.bloc === b ? l.seats : 0), 0);
  const cell = (p: Poll, id: string) => {
    const r = p.results[id];
    if (!r)
      return (
        <td key={p.id} className="num">
          <span aria-hidden="true">–</span>
          <span className="xt-sr">{x.notReported}</span>
        </td>
      );
    if (r.belowThreshold || !r.seats)
      return (
        <td key={p.id} className="num xt-below" data-below="true">
          {x.below}
        </td>
      );
    return (
      <td key={p.id} className="num">
        {r.seats}
      </td>
    );
  };
  return (
    <div className="xt-scroll">
      <table className="xt-table" data-testid={testId}>
        <caption className="xt-sr">{x.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{x.list}</th>
            {polls.map((p) => (
              <th key={p.id} scope="col" className="num" data-pollster={p.pollster}>
                <span className="xt-ch">
                  <T v={pollsterName(p.pollster, lang)} lang={lang} />
                </span>
                <AirTime at={exitTime(p, config)} lang={lang} updated={updated.has(p.pollster)} />
              </th>
            ))}
            {lists && (
              <th scope="col" className="num">
                <span className="xt-ch">{x.countSoFar}</span>
              </th>
            )}
            <th scope="col" className="num xt-now-h" data-testid={`${testId}-now-h`}>
              <span className="xt-ch">{NOW_SEATS[lang].col}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((party) => (
            <tr key={party.id}>
              <th scope="row">
                <span className="xt-sw" style={{ background: partyColor(party.id) }} aria-hidden="true" />
                <Link href={editionPath(`/parties/${party.id}`, lang) ?? `/parties/${party.id}`}>
                  <T v={listName(party, lang)} lang={lang} />
                </Link>
              </th>
              {polls.map((p) => cell(p, party.id))}
              {lists && <td className={`num${counted(party.id) ? "" : " xt-below"}`}>{counted(party.id) || x.below}</td>}
              <td className="num xt-now">
                <NowSeats id={party.id} lang={lang} bare />
              </td>
            </tr>
          ))}
        </tbody>
        <tbody className="xt-blocs" data-testid={`${testId}-blocs`}>
          <tr>
            <th scope="colgroup" colSpan={polls.length + 2 + (lists ? 1 : 0)} className="xt-blocs-h">
              {x.blocs}
            </th>
          </tr>
          {BLOC_ORDER.map((b) => {
            const bloc = blocs.find((q) => q.id === b)!;
            return (
              <tr key={b}>
                <th scope="row">
                  <span className="xt-sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />
                  <T v={blocName(bloc, lang)} lang={lang} />
                </th>
                {totals.map((t, i) => (
                  <td key={polls[i].id} className={`num${t[b] >= 61 ? " xt-maj" : ""}`}>
                    {t[b]}
                  </td>
                ))}
                {lists && <td className="num">{countBloc(b)}</td>}
                <td className="xt-now" />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The channels' exit polls as a compact table (home, under the hero; /results, at the top): each broadcaster's latest
 * version only. Pollsters in `pollsConfig.withoutVariant` (Channel 14, i24NEWS) get their own labelled table below,
 * never a column in the main one. `polls` is every poll; renders nothing before any exit poll airs.
 */
export default function ExitPollTable({
  polls,
  pollsConfig,
  config,
  lang,
  lists,
  more = false,
}: {
  polls: Poll[];
  pollsConfig: Pick<PollsConfig, "withoutVariant">;
  config: ResultsConfig;
  lang: Lang;
  lists?: Lists;
  more?: boolean;
}) {
  const { main, apart, updated } = splitExits(polls, pollsConfig);
  if (!main.length && !apart.length) return null;
  const x = EXIT_TABLE[lang];
  const names = new Intl.ListFormat(lang, { type: "conjunction" }).format(apart.map((p) => pollsterName(p.pollster, lang).text));
  return (
    <section className="xt" aria-labelledby="xt-h" data-testid="exit-poll-table">
      <h2 id="xt-h" className="sec-h">
        {x.h}
      </h2>
      {main.length > 0 && <Table polls={main} lists={lists} updated={updated} config={config} lang={lang} testId="exit-main" />}
      {main.length > 0 && <NowSeatsKey lang={lang} />}
      <p className="xt-caution" data-testid="exit-caution">
        {x.caution}
        {more && (
          <>
            {" "}
            <Link href={editionPath("/results", lang) ?? "/results"}>{x.more}</Link>
          </>
        )}
      </p>
      {apart.length > 0 && (
        <div className="xt-apart" data-testid="exit-apart">
          <h3 className="sec-h3">{x.apart(names)}</h3>
          <Table polls={apart} updated={updated} config={config} lang={lang} testId="exit-apart-table" />
        </div>
      )}
    </section>
  );
}
