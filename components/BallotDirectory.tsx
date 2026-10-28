"use client";
import { isCurrentElectionRef } from "@/lib/political-record/elections";

import { useSeatContext } from "./seat-context/SeatContextProvider";
import SeatBasis from "./seat-context/SeatBasis";
import ListStatusChip from "./list-status/ListStatusChip";
import { useListShares } from "./list-status/ListSharesProvider";
import { percentText, shareOf, votesOf } from "@/lib/list-status";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import { fill } from "@/lib/i18n/post-count";
import UnprofiledLists from "./election-readiness/UnprofiledLists";
import { ballotSeat } from "./election-readiness/model";
import { useState } from "react";
import Link from "next/link";
import {
  ballotLists,
  filterBallot,
  orderSlips,
  type SlipOrder,
} from "@/lib/ballot";
import { seatFigure } from "@/lib/polls";
import { partyColor, partyInk } from "@/lib/party-colors";
import data from "@/data/ballot-directory.json";
import { editionPath, type Lang } from "@/lib/i18n";
import { partyDirectoryText } from "@/lib/i18n/party-directory";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import chrome from "@/lib/i18n/chrome";
import type { BallotLabel } from "@/lib/ballot-locale";
import { recordDate } from "@/lib/reference/record-format";
import "./BallotDirectory.css";

/** A spaced dash in a list name stays with the word before it, so it never starts a line on its own. */
const keepDash = (name: string) => name.replace(/ ([—–]) /g, " $1 ");
/** On a slip, the part of a name after a spaced dash is its second line. */
const slipName = (name: string) => {
  const m = / [—–] /.exec(name);
  return m ? (
    <>
      {name.slice(0, m.index)}
      <span className="bd-sub">{name.slice(m.index + 3)}</span>
    </>
  ) : (
    name
  );
};

/**
 * The ballot tray first: all 38 published slips as one wall, the lists that win seats in the
 * polling average in their own colour with their seats, every other slip plain, so the reader
 * sees how many lists run and how few the polls count. Then the searchable directory.
 */
export default function BallotDirectory({
  lang = "en",
  labels = {},
}: {
  lang?: Lang;
  labels?: Record<string, BallotLabel>;
}) {
  const t = partyDirectoryText(lang),
    R = POST_RECORDS[lang],
    href = (path: string) => editionPath(path, lang) ?? path;
  const name = (l: (typeof ballotLists)[number]) =>
    labels[l.id]?.name ?? { text: l.name, lang: "en" as const };
  const { context: currentContext } = useSeatContext();
  const shares = useListShares();
  // This immutable roster belongs to the 26th election, even when another term is active.
  const context =
    currentContext &&
    isCurrentElectionRef(currentContext.election)
      ? currentContext
      : null;
  const seatsOf = (list: (typeof ballotLists)[number]) =>
    ballotSeat(context, list);
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<"all" | "profiled" | "other">("all");
  const [order, setOrder] = useState<SlipOrder>("roster");
  const shown = filterBallot(
    ballotLists,
    query,
    coverage,
    Object.fromEntries(
      Object.entries(labels).map(([id, label]) => [id, label.aliases]),
    ),
  );
  const polled = ballotLists.filter((l) => (seatsOf(l) ?? 0) > 0).length;
  return (
    <section className="ballot-directory">
      {context ? (
        <SeatBasis context={context} lang={lang} share />
      ) : (
        <p className="bd-snapshot-note" role="note">
          {t.sourceDates}: 2026. {R.ballotNote}
        </p>
      )}
      {context && (
        <p className="bd-snapshot-note" role="note">
          {context.seatStatus === "official" ? R.ballotNoteOfficial : R.ballotNote}
        </p>
      )}
      {lang !== "en" && (
        <p>
          {t.sourceNotice}{" "}
          <Link href="/ballot?original=en" hrefLang="en">
            {t.original}
          </Link>
          .
        </p>
      )}
      <figure className="bd-tray">
        <figcaption className="bd-head">
          <span className="bd-h">
            {t.tray}: {ballotLists.length}
            {context && (
              <>
                . {t.holding}: <b>{polled}</b>
              </>
            )}
          </span>
          <div className="seg bd-order" role="group" aria-label={t.order}>
            {(
              [
                ["roster", t.rosterOrder],
                ["polled", t.seatsFirst],
              ] as const
            ).map(([k, t]) => (
              <button
                key={k}
                type="button"
                aria-pressed={order === k}
                onClick={() => setOrder(k)}
              >
                {t}
              </button>
            ))}
          </div>
        </figcaption>
        <ol className="bd-wall">
          {orderSlips(ballotLists, (l) => seatsOf(l) ?? 0, order).map((l) => {
            const s = seatsOf(l) ?? 0;
            const c = l.profile ? partyColor(l.profile) : null;
            return (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={`bd-slip${s > 0 ? " polled" : ""}`}
                  style={
                    s > 0 && c
                      ? {
                          ["--c" as string]: c,
                          ["--ci" as string]: partyInk(l.profile!),
                        }
                      : undefined
                  }
                  title={`${name(l).text}${s > 0 ? `: ${seatFigure(s)} ${t.seats}` : ""}`}
                >
                  <span className="bd-letters" lang="he" dir="rtl">
                    {l.letters}
                  </span>
                  <span className="bd-name" lang={name(l).lang} dir="auto">
                    {slipName(name(l).text)}
                  </span>
                  {s > 0 && <span className="bd-seats">{seatFigure(s)}</span>}
                </a>
              </li>
            );
          })}
        </ol>
        <p className="fig-src bd-src">
          {t.trayNote} {order === "roster" ? t.rosterOrder : t.seatsFirst}.
        </p>
      </figure>

      {context && (
        <UnprofiledLists
          lang={lang}
          knownIds={ballotLists.map((l) => l.profile ?? l.id)}
        />
      )}
      <div className="ballot-controls">
        <label>
          {t.find}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={t.searchHint}
          />
        </label>
        <label>
          {t.coverage}
          <select
            value={coverage}
            onChange={(e) => setCoverage(e.target.value as typeof coverage)}
          >
            <option value="all">{t.all}</option>
            <option value="profiled">{t.profiled}</option>
            <option value="other">{t.other}</option>
          </select>
        </label>
      </div>
      <p className="bd-count" aria-live="polite">
        {t.showingLists}: {shown.length} / {ballotLists.length}.
      </p>
      <ol className="ballot-grid">
        {shown.map((l) => (
          <li key={l.id} id={l.id}>
            <span className="ballot-letters" lang="he" dir="rtl">
              {l.letters}
            </span>
            <div>
              <h2 lang={name(l).lang} dir="auto">
                {keepDash(name(l).text)}
              </h2>
              <p className="bd-he" lang="he" dir="rtl">
                {l.hebrew}
              </p>
              {context && (
                <p className="bd-votes" data-testid="ballot-votes">
                  {(() => {
                    const ids = { party: l.profile, letters: l.letters };
                    const v = votesOf(ids, shares, context);
                    const pct = shareOf(ids, shares, context);
                    return v === null || pct === null ? R.votesNone : fill(context.seatStatus === "official" ? R.votesOfficial : R.votesSoFar, { v: v.toLocaleString(lang === "en" ? "en-US" : lang === "he" ? "he-IL" : lang === "ar" ? "ar-u-nu-latn" : lang === "fa" ? "fa-u-nu-latn" : lang === "de" ? "de-DE" : lang === "fr" ? "fr-FR" : "zh-CN"), p: percentText(pct, lang) });
                  })()}
                </p>
              )}
              {context && (
                <p>
                  <ListStatusChip seats={seatsOf(l) ?? 0} seatStatus={context.seatStatus} pct={shareOf({ party: l.profile, letters: l.letters }, shares, context)} lang={lang} />
                </p>
              )}
              <p>
                {l.leader ? (
                  <>
                    {t.leader}:{" "}
                    <span lang={labels[l.id]?.leader?.lang ?? "en"} dir="auto">
                      {labels[l.id]?.leader?.text ?? l.leader}
                    </span>
                    .
                  </>
                ) : (
                  t.noLeader
                )}
              </p>
              <p className="bd-links">
                <a href={l.source} hrefLang="he">
                  {t.official}
                </a>
                {l.profile && (
                  <>
                    {" "}
                    <Link href={href(`/parties/${l.profile}`)}>
                      {t.profile}
                    </Link>{" "}
                    <Link href={`/party-history#${l.profile}`} hrefLang="en">
                      {t.history}
                      {lang !== "en" && ` ${chrome[lang].inEnglish}`}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p role="status">{t.noMatch}</p>}
      <div className="bd-foot">
        <p>{t.distinction}</p>
        <p>
          {t.sourceDates}. {LIFECYCLE[lang].published}:{" "}
          <time dateTime={data.sourceUpdated}>
            {recordDate(data.sourceUpdated, lang)}
          </time>
          . {LIFECYCLE[lang].checked}:{" "}
          <time dateTime={data.checked}>{recordDate(data.checked, lang)}</time>.{" "}
          {LIFECYCLE[lang].source}:{" "}
          <a href={data.source} hrefLang="he">
            {t.cec}
          </a>
          ,{" "}
          <a href={data.approvedSlips} hrefLang="he">
            {t.slips}
          </a>
          ,{" "}
          <a href="https://www.gov.il/en/pages/time--table-26" hrefLang="en">
            {t.timetable}
            {lang !== "en" && ` ${chrome[lang].inEnglish}`}
          </a>
          .<Link href={href("/parties")}>{t.map}</Link>,{" "}
          <Link href="/party-history" hrefLang="en">
            {t.familyTree}
            {lang !== "en" && ` ${chrome[lang].inEnglish}`}
          </Link>
          , <Link href={href("/how-it-works/voting")}>{t.voting}</Link>.
        </p>
      </div>
    </section>
  );
}
