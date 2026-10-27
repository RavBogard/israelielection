"use client";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import SeatGrid from "@/components/SeatGrid";
import { pinnedSeatHref } from "@/lib/seat-context";
import { rankParties, type Answers, type PartyScore } from "@/lib/match";
import { editionPath, isRtl, type Lang } from "@/lib/i18n";
import { matchText } from "@/lib/i18n/match";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import compareText from "@/lib/i18n/compare";
import type { MatchData, MatchParty, MatchQuestion } from "./types";
const CLOSE = 0.7;
const pct = (value: number) => `${Math.round(value * 100)}%`;
export default function Results({
  data,
  answers,
  deeperDone,
  onEdit,
  onDeeper,
  onRestart,
}: {
  data: MatchData;
  answers: Answers;
  deeperDone: boolean;
  onEdit: () => void;
  onDeeper: () => void;
  onRestart: () => void;
}) {
  const lang = data.lang ?? "en",
    t = matchText(lang),
    local = (href: string) => editionPath(href, lang) ?? href;
  const { ranked, thin } = useMemo(
    () =>
      rankParties(
        data.parties.map((p) => p.id),
        data.questions,
        answers,
      ),
    [data, answers],
  );
  const party = (id: string) => data.parties.find((p) => p.id === id)!,
    close = ranked.filter((s) => s.match! >= CLOSE),
    closeSeats = close.reduce((n, s) => n + party(s.id).seats, 0),
    top = ranked.slice(0, 3),
    [copied, setCopied] = useState(false);
  const segments = [
    ...close
      .filter((s) => party(s.id).seats > 0)
      .map((s) => ({
        id: s.id,
        seats: party(s.id).seats,
        color: party(s.id).color,
        label: `${party(s.id).name}: ${pct(s.match!)}`,
      })),
    {
      id: "rest",
      seats: Math.max(0, 120 - closeSeats),
      color: "var(--line-2)",
      label: t.other,
    },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const builder = local(
      `/coalition-builder?poll=current&with=${top
        .filter((s) => party(s.id).seats > 0)
        .map((s) => s.id)
        .join(",")}`,
    ),
    builderHref = data.context
      ? pinnedSeatHref(builder, data.context)
      : builder;
  return (
    <div className="mr">
      <figure className="mr-knesset">
        <SeatGrid
          segments={segments}
          lang={lang}
          rtl={isRtl(lang)}
          labelRule
          title={`${t.matching}: ${closeSeats} / 120. ${t.majorityNote}`}
        />
        <figcaption>
          <h2 className="mr-lead">
            {t.matching}:{" "}
            <bdi dir="ltr">
              <b>{closeSeats}</b> / 120
            </bdi>
          </h2>
          <ul className="mr-key fig-key">
            {close.map((s) => (
              <li key={s.id}>
                <i style={{ background: party(s.id).color }} />
                <span lang={party(s.id).nameLang}>
                  {party(s.id).short}
                </span>{" "}
                <b>{pct(s.match!)}</b>
              </li>
            ))}
            <li>
              <i className="rest" />
              {t.other}
            </li>
          </ul>
          <p className="fig-note">{t.gridNote}</p>
          <p className="fig-note">{t.majorityNote}</p>
          <p className="fig-src">
            {data.context && LIFECYCLE[lang][data.context.basis]}.{" "}
            <Link href={local("/compare")}>{t.compare}</Link>.
          </p>
          <div className="mr-actions">
            <button type="button" className="btn" onClick={onEdit}>
              {t.change}
            </button>
            {!deeperDone && (
              <button type="button" className="btn" onClick={onDeeper}>
                {t.more}
              </button>
            )}
            <button type="button" className="btn" onClick={copy}>
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </figcaption>
      </figure>
      <h2 className="sec-h">{t.ranking}</h2>
      <p className="fig-note">{t.sourceOriginal}</p>
      <ol className="mr-list">
        {ranked.map((s, i) => (
          <Row
            key={s.id}
            s={s}
            rank={i + 1}
            p={party(s.id)}
            questions={data.questions}
            answers={answers}
            lang={lang}
          />
        ))}
      </ol>
      {thin.length > 0 && (
        <>
          <h3 className="mr-sub">{t.thin}</h3>
          <p className="fig-note">{t.thinNote}</p>
          <ul className="mr-thin">
            {thin.map((s) => (
              <li
                key={s.id}
                style={{ "--fill": party(s.id).color } as CSSProperties}
              >
                <Link
                  href={local(`/parties/${s.id}`)}
                  lang={party(s.id).nameLang}
                >
                  {party(s.id).name}
                </Link>{" "}
                <span>
                  {t.coverage}: {s.both} / {s.asked}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="sec-h">{t.weigh}</h2>
      <p className="note">{t.noAdvice}</p>
      <div className="mr-weigh">
        {top.map((s) => {
          const p = party(s.id),
            bloc = data.blocs.find((b) => b.id === p.bloc);
          return (
            <article
              key={s.id}
              className={`mr-w${p.below ? " out" : ""}`}
              style={{ "--fill": p.color } as CSSProperties}
            >
              <h3>
                <span lang={p.nameLang}>{p.name}</span>
                <span>{pct(s.match!)}</span>
              </h3>
              <dl>
                <dt>{t.seats}</dt>
                <dd>{p.seats}</dd>
                <dt>{t.bloc}</dt>
                <dd>
                  {bloc?.label}: {bloc?.seats}
                </dd>
                <dt>{t.surplus}</dt>
                <dd lang={p.surplus ? p.surplusLang : lang} dir="auto">
                  {p.surplus ?? t.absent}
                </dd>
                {p.pledge && (
                  <>
                    <dt>{t.pledge}</dt>
                    <dd>
                      <span lang={p.pledgeLang} dir="auto">
                        {p.pledge.text}
                      </span>{" "}
                      <span className="fig-src" lang="en">
                        {p.pledge.source}
                      </span>
                    </dd>
                  </>
                )}
              </dl>
            </article>
          );
        })}
      </div>
      <div className="mr-explain">
        <section>
          <h3>{t.threshold}</h3>
          <p>{t.thresholdNote}</p>
        </section>
        <section>
          <h3>{t.bloc}</h3>
          <p>{t.formationNote}</p>
        </section>
        <section>
          <h3>{t.largest}</h3>
          <p>{t.strategicNote}</p>
        </section>
        <section>
          <h3>{t.surplus}</h3>
          <p>{t.surplusNote}</p>
        </section>
      </div>
      <p className="fig-src">
        <Link href={local("/how-it-works/forming-a-government")}>
          {t.guides}
        </Link>
        . <Link href={builderHref}>{t.builder}</Link>.
      </p>
      <details className="mr-method">
        <summary>{t.method}</summary>
        <p>{t.methodScale}</p>
        <p>{t.methodMissing}</p>
        <p>{t.noAdvice}</p>
        <p>{t.privacy}</p>
        <p>
          <button type="button" className="btn" onClick={onRestart}>
            {t.restart}
          </button>
        </p>
      </details>
    </div>
  );
}
function Row({
  s,
  rank,
  p,
  questions,
  answers,
  lang,
}: {
  s: PartyScore;
  rank: number;
  p: MatchParty;
  questions: MatchQuestion[];
  answers: Answers;
  lang: Lang;
}) {
  const t = matchText(lang),
    c = compareText[lang];
  return (
    <li
      className={`mr-row${p.below ? " out" : ""}`}
      style={{ "--fill": p.color, "--fill-ink": p.ink } as CSSProperties}
    >
      <details>
        <summary>
          <span className="mr-rank">{rank}</span>
          <span className="mr-name">
            <b lang={p.nameLang}>{p.name}</b>
            <small lang={p.leaderLang}>{p.leader}</small>
          </span>
          <span className="mr-bar" aria-hidden="true">
            <i style={{ width: pct(s.match!) }} />
          </span>
          <span className="mr-pct">{pct(s.match!)}</span>
          <span className="mr-cov">
            {t.coverage}: {s.both} / {s.asked}
          </span>
          {s.clashes.length > 0 && (
            <span className="mr-clash">
              {t.deal}:{" "}
              {s.clashes
                .map((key) => questions.find((q) => q.key === key)!.label)
                .join(", ")}
            </span>
          )}
        </summary>
        <div className="mr-detail">
          {s.questions.map((qs) => {
            const q = questions.find((q) => q.key === qs.key)!,
              mine = q.stances.find((x) => x.id === answers[q.key]!.stance)!,
              cell = qs.cell,
              theirs =
                cell?.kind === "stance"
                  ? q.stances.find((x) => x.id === cell.stance)
                  : undefined,
              said = q.said[p.id];
            return (
              <div key={q.key} className="mr-q">
                <p className="mr-q-label" lang={q.labelLang}>
                  {q.label}
                </p>
                <Track
                  q={q}
                  mine={mine.id}
                  theirs={theirs?.id}
                  color={p.color}
                  lang={lang}
                />
                <p className="mr-q-read">
                  {t.you}:{" "}
                  <span lang={q.textLang} dir="auto">
                    {mine.label}
                  </span>
                  . <span lang={p.nameLang}>{p.short}</span>:{" "}
                  {theirs ? (
                    <>
                      <span lang={q.stanceLang?.[theirs.id]} dir="auto">
                        {q.stanceLabels[theirs.id]}
                      </span>
                      {cell?.kind === "stance" && (cell.unstated || cell.record)
                        ? ` (${cell.unstated ? c.glyphs.unst : c.glyphs.rec})`
                        : ""}
                    </>
                  ) : cell?.kind === "declined" ? (
                    c.glyphs.declined
                  ) : (
                    t.noPosition
                  )}
                  .
                </p>
                {said && theirs && (
                  <>
                    <p className="mr-said" lang={said.lang ?? "en"} dir="auto">
                      {said.text}
                    </p>
                    <p className="fig-src">
                      {said.translated && <>{t.translatedQuote}. </>}
                      <span lang="en">
                        {said.url ? (
                          <a href={said.url} rel="noopener">
                            {said.source}
                          </a>
                        ) : (
                          said.source
                        )}
                        {said.date ? `, ${said.date}` : ""}
                      </span>
                    </p>
                  </>
                )}
              </div>
            );
          })}
          <p>
            <Link href={editionPath(`/parties/${p.id}`, lang)!}>
              {t.profile}
            </Link>
          </p>
        </div>
      </details>
    </li>
  );
}
function Track({
  q,
  mine,
  theirs,
  color,
  lang,
}: {
  q: MatchQuestion;
  mine: string;
  theirs?: string;
  color: string;
  lang: Lang;
}) {
  return (
    <div
      className={`mr-track${q.scale ? "" : " unordered"}`}
      style={{ "--n": q.stances.length } as CSSProperties}
      aria-hidden="true"
    >
      {q.stances.map((s) => (
        <span key={s.id} className="mr-step" style={{ background: s.color }}>
          {s.id === mine && <i className="you">{matchText(lang).you}</i>}
          {s.id === theirs && (
            <i className="them" style={{ background: color }} />
          )}
        </span>
      ))}
    </div>
  );
}
