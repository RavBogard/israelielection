import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import "@/components/interactives.css";
import "@/components/results.css";
import ResultsFreshness from "@/components/ResultsFreshness";
import ResultsRefresh from "@/components/ResultsRefresh";
import ResultsChanges from "@/components/ResultsChanges";
import PollThresholdWatch from "@/components/results/ThresholdWatch";
import { partyColor } from "@/lib/party-colors";
import SeatGrid from "@/components/SeatGrid";
import { MAJORITY, KNESSET } from "@/lib/coalition";
import { averagePoll, blocs, exitPolls, mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { BLOC_ORDER, BLOC_SEAT_ORDER, pollLabel, seatFigure, seatsIn } from "@/lib/polls";
import type { Count, PartyResult } from "@/lib/results";
import { pollWatch, thresholdSeats, thresholdWatch } from "@/lib/watch";
import { countedTurnout, results, versusAverage } from "@/lib/results";
import { fetchCount, resultsNow, resultsConfig as cfg } from "@/lib/results-live";
import { averageLabel, night, PRIOR_ROLL, priorRollLabel, sections, type Counted, type Night, type Section } from "@/lib/results-phase";
import PageHead from "@/components/PageHead";
import PhaseStrip from "@/components/results/PhaseStrip";
import ExitPollBars from "@/components/results/ExitPollBars";
import type { Lang } from "@/lib/i18n";
import { partyText } from "@/lib/i18n/overlays";
import resultsText from "@/lib/i18n/results";
import { blocName, configText, listName, T } from "@/components/results/names";
import { edHref, rich } from "@/components/results/rich";

/**
 * The election-night page, /results and /he/results. Every word is in lib/i18n/results.ts; the Hebrew is written for an
 * Israeli election-night desk, not translated. Data text (sources, notes) goes through the overlays and shows in English,
 * marked lang="en", until data/he/results.json has it.
 */

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const num = (x: number) => Math.round(x).toLocaleString("en-US");
const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
// Hebrew: Israel time is the reader's own, so it is not named; day first, 24-hour (STYLE.md).
const HE_DAY = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", weekday: "long", day: "numeric", month: "long" });
const HE_STAMP = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const IL_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** A moment as the page prints it: English "Oct 27, 10:00 PM"; Hebrew "27.10, 22:00", or with `long` "יום שלישי, 27 באוקטובר, 22:00". */
const when = (d: Date, lang: Lang, long = false) => (lang === "en" ? IL.format(d) : long ? `${HE_DAY.format(d)}, ${IL_TIME.format(d)}` : HE_STAMP.format(d));
const byId = (id: string | null) => parties.find((p) => p.id === id);
const name = (id: string, lang: Lang) => listName(byId(id) ?? { id, name: id }, lang);
const pairName = (ids: string[], lang: Lang) =>
  lang === "en" ? ids.map((id) => byId(id)?.name ?? id).join(" and ") : resultsText.he.method.pair(name(ids[0], lang).text, name(ids[1], lang).text);
/** A table row's swatch, spaced from the name on the inline end side (English keeps its physical margin). */
const swatch = (id: string, lang: Lang) => (lang === "he" ? { background: partyColor(id), marginInlineEnd: 8 } : { background: partyColor(id), marginRight: 8 });
/** A signed figure; in Hebrew it runs left to right inside the line. */
const bdi = (s: string, lang: Lang): ReactNode => (lang === "he" ? <bdi dir="ltr">{s}</bdi> : s);

function Letters({ lang }: { lang: Lang }) {
  const t = resultsText[lang].letters;
  const rows = Object.entries(cfg.letters)
    .map(([letters, id]) => ({ letters, p: byId(id)! }))
    .sort((a, b) => blocs.findIndex((x) => x.id === a.p.bloc) - blocs.findIndex((x) => x.id === b.p.bloc));
  return (
    <>
      <h2 className="sec-h">{t.h}</h2>
      <p className="note">{t.note(rows.length)}</p>
      <div className="table-scroll">
        <table className="data-table letters-table">
          <thead>
            <tr><th>{t.th.letters}</th><th>{t.th.list}</th><th>{t.th.leader}</th></tr>
          </thead>
          <tbody>
            {rows.map(({ letters, p }) => (
              <tr key={letters}>
                <td className="rs-heb" lang="he" dir="rtl">{letters}</td>
                <td><span className="sw" style={{ background: partyColor(p.id) }} /><Link href={edHref(`/parties/${p.id}`, lang)}><T v={listName(p, lang)} lang={lang} /></Link></td>
                <td><T v={lang === "en" ? { text: p.leader, lang: "en" } : partyText(p, "leader", lang)} lang={lang} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fig-src" style={{ marginTop: 10 }}>{t.source}<T v={configText(cfg, "lettersSource", lang)} lang={lang} /></p>
    </>
  );
}

function Method({ lang }: { lang: Lang }) {
  const t = resultsText[lang].method;
  const pairs = cfg.agreements.map((a) => pairName(a.parties, lang)).join(t.pairSep);
  return (
    <>
      <h2 className="sec-h">{t.h}</h2>
      <ol className="note rs-steps">
        <li>{t.threshold(String(cfg.threshold * 100))}</li>
        <li>{t.share(KNESSET)}</li>
        <li>{t.surplus(pairs)}</li>
        <li>{rich(t.majority(MAJORITY), lang)}</li>
      </ol>
      <p className="fig-src">
        <T v={configText(cfg, "thresholdSource", lang)} lang={lang} />
        {t.agreements}
        {cfg.agreements.map((a, i) => (
          <Fragment key={i}>{i > 0 && t.pairSep}{pairName(a.parties, lang)}, <T v={{ text: a.source, lang: "en" }} lang={lang} /></Fragment>
        ))}
        . <T v={configText(cfg, "agreementsNote", lang)} lang={lang} />
      </p>
    </>
  );
}

/** Before the count: when it starts, what the exit polls are worth, and which lists sit near the threshold. */
function WhatToWatch({ closed, lang }: { closed: boolean; lang: Lang }) {
  const t = resultsText[lang].watch;
  const close = new Date(cfg.pollsClose);
  const near = pollWatch(averagePoll, parties, cfg.threshold);
  const seats = thresholdSeats(cfg.threshold);
  return (
    <section className="rs-watch" aria-labelledby="watch-h">
      <h2 id="watch-h" className="sec-h">
        {t.h}
      </h2>
      <dl>
        <div>
          <dt>{t.closeDt(when(close, lang, true), ET.format(close))}</dt>
          <dd>{rich(t.closeDd, lang)}</dd>
        </div>
        <div>
          <dt>{t.thresholdDt(String(cfg.threshold * 100), seats)}</dt>
          <dd>
            {t.thresholdDd(closed)}
            <ul className="rs-near">
              {near.map(({ party, seats }) => (
                <li key={party.id}>
                  <span className="sw" style={{ background: partyColor(party.id) }} />
                  <Link href={edHref(`/parties/${party.id}`, lang)}><T v={listName(party, lang)} lang={lang} /></Link>
                  <span className="v">{seats ? t.nearSeats(seats, seatFigure(seats)) : t.nearNone}</span>
                </li>
              ))}
            </ul>
            {t.thresholdAfter(seats)}
          </dd>
        </div>
        <div>
          <dt>{t.envelopesDt}</dt>
          <dd>{rich(t.envelopesDd, lang)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** The channels' exit polls beside the count, once they air; before that, one line saying they will appear. */
function ExitPolls({ lists, lang }: { lists: PartyResult[] | null; lang: Lang }) {
  const t = resultsText[lang].exitTable;
  if (!exitPolls.length)
    return lists ? null : (
      <p className="note rs-exit-note">
        {t.pending}
      </p>
    );
  const rows = parties.filter((p) => exitPolls.some((e) => (seatsIn(e, p.id) ?? 0) > 0) || (lists?.find((l) => l.partyId === p.id)?.seats ?? 0) > 0);
  const close = new Date(cfg.pollsClose);
  return (
    <section className="rs-exit" aria-labelledby="exit-h">
      <h2 id="exit-h" className="sec-h">
        {t.h(!!lists)}
      </h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.list}</th>
              {exitPolls.map((e) => (
                <th key={e.id} className="num">
                  {pollLabel(e, lang)}
                </th>
              ))}
              {lists && <th className="num">{t.countSoFar}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="sw" style={swatch(p.id, lang)} />
                  <Link href={edHref(`/parties/${p.id}`, lang)}><T v={listName(p, lang)} lang={lang} /></Link>
                </td>
                {exitPolls.map((e) => {
                  const v = seatsIn(e, p.id);
                  return (
                    <td key={e.id} className={`num${v ? "" : " below"}`}>
                      {v || t.below}
                    </td>
                  );
                })}
                {lists && <td className="num">{lists.find((l) => l.partyId === p.id)?.seats || t.below}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fig-src" style={{ marginTop: 10 }}>
        {t.source(lang === "en" ? IL.format(close) : IL_TIME.format(close), exitPolls.map((e) => `${pollLabel(e, lang)}, ${mediumDate(e.published, lang)}`).join(t.pollSep))}
      </p>
    </section>
  );
}

/** During the count: the lists within half a point of the threshold, and what crossing is worth. */
function ThresholdWatch({ count, lang }: { count: Count; lang: Lang }) {
  const t = resultsText[lang].thresholdCount;
  const rows = thresholdWatch(count, cfg);
  return (
    <section className="rs-watch" aria-labelledby="tw-h">
      <h2 id="tw-h" className="sec-h">
        {t.h}
      </h2>
      <p className="note">{t.note(String(cfg.threshold * 100), num(count.valid * cfg.threshold))}</p>
      {rows.length ? (
        <ul className="rs-near">
          {rows.map((w) => {
            const p = byId(w.partyId)!;
            return (
              <li key={w.partyId}>
                <span className="sw" style={{ background: partyColor(p.id) }} />
                <Link href={edHref(`/parties/${p.id}`, lang)}><T v={listName(p, lang)} lang={lang} /></Link>
                <span className="v">{t.row(pct(w.pct), num(Math.abs(w.margin)), w.passing, w.seatsAtThreshold)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="note">{t.none}</p>
      )}
    </section>
  );
}

const signed = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n < 0 ? `−${(-n).toFixed(1)}` : "0");
const DASH = "–";

/** The election-night board, drawn the same before polls close (hatched, awaiting the count) and during it, so nothing moves on the night. */
function Board({ count, counted, early, avgLabel, lang }: { count: Count | null; counted: Counted | null; early: boolean; avgLabel: string; lang: Lang }) {
  const t = resultsText[lang].board;
  const r = count ? results(count, cfg) : null;
  const toLetter = Object.fromEntries(Object.entries(cfg.letters).map(([l, id]) => [id, l]));
  const blocSeats = [...blocs]
    .sort((a, b) => BLOC_SEAT_ORDER.indexOf(a.id) - BLOC_SEAT_ORDER.indexOf(b.id))
    .map((b) => ({ ...b, name: blocName(b, lang), seats: r ? r.lists.filter((l) => byId(l.partyId)?.bloc === b.id).reduce((s, l) => s + l.seats, 0) : null }));
  const others = r ? r.lists.filter((l) => !l.partyId) : [];
  const untrackedSeats = others.reduce((s, l) => s + l.seats, 0);
  const segments = r
    ? [
        ...blocSeats.filter((b) => b.seats).map((b) => ({ id: b.id, seats: b.seats!, color: `var(--b-${b.id})`, label: b.name.text })),
        ...(untrackedSeats ? [{ id: "other", seats: untrackedSeats, color: "var(--line-2)", label: t.otherLists }] : []),
      ]
    : [];
  const vs = versusAverage(Object.values(cfg.letters), averagePoll, r?.lists ?? null);
  const rows = r
    ? r.lists.filter((l) => l.partyId).map((l) => ({ l: l as PartyResult | null, v: vs.find((x) => x.partyId === l.partyId)! }))
    : [...vs].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1)).map((v) => ({ l: null as PartyResult | null, v }));
  const share = counted?.share ?? null;
  const pc = share !== null ? `${(share * 100).toFixed(1)}%` : "";
  const turnout = count ? countedTurnout(count) : null;
  const wait = (k: string, c = "") => <td key={k} className={`num rs-wait${c ? ` ${c}` : ""}`}><span className="sr-only">{t.awaiting}</span><span aria-hidden="true">{DASH}</span></td>;
  const seatCell = (l: PartyResult | null, c: string) => (l ? <td className={`num ${c}${l.seats ? "" : " below"}`}>{l.seats || t.below}</td> : wait(c, c));
  const flag = t.earlyFlag(pc);
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <pattern id="rs-hatch" width="2.5" height="2.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2.5" height="2.5" className="rs-h-bg" />
            <line x1="0" y1="0" x2="0" y2="2.5" className="rs-h-ln" />
          </pattern>
        </defs>
      </svg>
      {early && r && <p className="rs-early-flag"><b>{flag[0]}</b>{flag[1]}</p>}
      <section className={`rs-count${r ? "" : " rs-await"}${early && r ? " rs-early" : ""}`} aria-label={t.aria(!!(early && r))}>
        <div className="rs-grid">
          <SeatGrid segments={segments} labelRule rtl={lang === "he"} title={r ? t.gridTitle(early, MAJORITY) : t.gridAwait(KNESSET, MAJORITY)} />
        </div>
        <div>
          <ul className="rs-legend">
            {[...blocSeats].sort((a, b) => BLOC_ORDER.indexOf(a.id) - BLOC_ORDER.indexOf(b.id)).map((b) => (
              <li key={b.id}><span className="sw" style={{ background: `var(--b-${b.id})` }} /><T v={b.name} lang={lang} /> {b.seats === null ? <span className="rs-await-v">{t.awaiting}</span> : <b>{b.seats}</b>}</li>
            ))}
            {untrackedSeats > 0 && <li><span className="sw" style={{ background: "var(--line-2)" }} />{t.otherLists} <b>{untrackedSeats}</b></li>}
          </ul>
          <div className="rs-counted">
            <p className="rs-counted-h">{share !== null ? <>{t.countedH}<b>{pc}</b></> : t.countedNone}</p>
            <div className={`rs-counted-bar${share === null ? " none" : ""}`} role="img" aria-label={share !== null ? t.countedAria(pc) : t.countedAriaNone}>
              {share !== null && <i style={{ width: `${share * 100}%` }} />}
            </div>
            <p className="fig-note">
              {!count ? t.awaitCount : t.tally(num(count.valid), num(count.localities), turnout !== null ? `${(turnout * 100).toFixed(1)}%` : null)}
              {counted?.basis === "prior" && t.prior(priorRollLabel(lang), num(PRIOR_ROLL.eligible))}
            </p>
          </div>
          {r && <p className="note" style={{ marginTop: 14 }}><Link href={edHref("/coalition-builder", lang) + "?poll=results"}>{t.build}</Link></p>}
        </div>
      </section>

      <h2 className="sec-h">{t.byList}</h2>
      <div className="table-scroll">
        <table className="data-table list-table">
          <thead>
            <tr><th>{t.th.list}</th><th className="num lt-seat-m">{t.th.seats}</th><th className="lt-let">{t.th.letters}</th><th className="num">{t.th.votes}</th><th className="num">{t.th.share}</th><th className="num lt-seat">{t.th.seats}</th><th className="num">{avgLabel}</th><th className="num">{t.th.diff}</th></tr>
          </thead>
          <tbody>
            {rows.map(({ l, v }) => {
              const p = byId(v.partyId)!;
              return (
                <tr key={v.partyId}>
                  <td><span className="sw" style={swatch(p.id, lang)} /><Link href={edHref(`/parties/${p.id}`, lang)}><T v={listName(p, lang)} lang={lang} /></Link></td>
                  {seatCell(l, "lt-seat-m")}
                  <td className="rs-heb lt-let" lang="he" dir="rtl">{toLetter[p.id]}</td>
                  {l ? <td className="num">{num(l.votes)}</td> : wait("v")}
                  {l ? <td className="num">{pct(l.pct)}</td> : wait("p")}
                  {seatCell(l, "lt-seat")}
                  <td className={`num${v.avg ? "" : " below"}`}>{v.avg === null ? DASH : v.avg ? seatFigure(v.avg) : t.below}</td>
                  {v.diff === null ? wait("d") : <td className="num">{bdi(signed(v.diff), lang)}</td>}
                </tr>
              );
            })}
            <tr>
              <td>{t.others(r ? others.length : null)}</td>
              {r ? <td className="num lt-seat-m">{untrackedSeats || DASH}</td> : wait("lt-seat-m", "lt-seat-m")}
              <td className="lt-let" />
              {r ? <td className="num">{num(others.reduce((s, l) => s + l.votes, 0))}</td> : wait("v")}
              {r ? <td className="num">{pct(others.reduce((s, l) => s + l.pct, 0))}</td> : wait("p")}
              {r ? <td className="num lt-seat">{untrackedSeats || DASH}</td> : wait("lt-seat", "lt-seat")}
              <td className="num">{DASH}</td>
              <td className="num">{DASH}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="fig-src" style={{ marginTop: 10 }}>
        {r ? t.srcThreshold(num(r.alloc.thresholdVotes), String(cfg.threshold * 100)) : t.srcHatched}
        {t.srcAverage(avgLabel, mainPolls.length, mediumDate(mainPolls[0].published, lang))}
        <a href={cfg.source.url}><T v={configText(cfg, "source.label", lang)} lang={lang} /></a>.
        {r && r.unknownLetters.length > 0 && untrackedSeats > 0 && t.srcUntracked}
      </p>
    </>
  );
}

/** The standfirst once polls close and no count is usable: waiting for the first file, or a real failure. */
function noCount(n: Night, at: string, lang: Lang): string {
  const t = resultsText[lang].standfirst;
  const time = IL_TIME.format(new Date(at));
  if (n.status === "waiting") return t.waiting(time);
  if (n.reason === "unusable") return t.unusable(time);
  return t.unreachable(time);
}

/** The page body for both editions. `revalidate` is the route's, passed through to the count fetch. */
export default async function ResultsPage({ lang, revalidate }: { lang: Lang; revalidate: number }) {
  const t = resultsText[lang];
  const now = resultsNow();
  const live = await fetchCount(revalidate, { now });
  const n = night(live, cfg, now);
  const close = new Date(cfg.pollsClose);
  const refresh = <ResultsRefresh pollsClose={cfg.pollsClose} button={n.phase !== "before"} />;
  const avgLabel = averageLabel(cfg, mainPolls[0].published, now, lang);
  const count = live.state === "open" ? live.count : null;
  const r = count ? results(count, cfg) : null;
  const captured = live.state === "open" ? new Date(live.fetchedAt) : null;
  const standfirst = live.state === "closed"
    ? t.standfirst.closed(when(close, lang, true), ET.format(close))
    : live.state === "error"
      ? noCount(n, live.fetchedAt, lang)
      : t.standfirst.open(live.freshness === "stale" ? t.standfirst.stale : n.phase === "early" ? t.standfirst.early : t.standfirst.count, when(captured!, lang), ET.format(captured!));
  const names = Object.fromEntries(parties.map((p) => [p.id, listName(p, lang).text]));
  const part: Record<Section, ReactNode> = {
    exit: <ExitPollBars key="exit" config={cfg} lang={lang} />,
    board: <Board key="board" count={count} counted={n.counted} early={n.phase === "early"} avgLabel={avgLabel} lang={lang} />,
    freshness: live.state === "open" && <ResultsFreshness key="freshness" live={live} lang={lang} />,
    changes: live.state === "open" && <ResultsChanges key="changes" current={live.snapshot} previous={live.previous} config={cfg} names={names} lang={lang} />,
    threshold: count && <ThresholdWatch key="threshold" count={count} lang={lang} />,
    pollWatch: <PollThresholdWatch key="pollWatch" closed={n.phase !== "before"} lang={lang} />,
    watch: <WhatToWatch key="watch" closed={n.phase !== "before"} lang={lang} />,
    exitTable: (n.phase === "before" || exitPolls.length > 0) && <ExitPolls key="exitTable" lists={r?.lists ?? null} lang={lang} />,
    letters: <Letters key="letters" lang={lang} />,
    method: <Method key="method" lang={lang} />,
  };
  return (
    <div className="ix rs">
      <div className="wrap">
        <PageHead title={t.title} aside={n.phase === "before" ? undefined : refresh} standfirst={standfirst}>
          {n.phase === "before" && refresh}
          <PhaseStrip phase={n.phase} lang={lang} />
        </PageHead>
        {sections(n.phase).map((k) => part[k])}
      </div>
    </div>
  );
}

