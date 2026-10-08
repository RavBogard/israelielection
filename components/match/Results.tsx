"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import SeatGrid, { MAJORITY } from "@/components/SeatGrid";
import { rankParties, WEIGHTS, type Answers, type PartyScore } from "@/lib/match";
import type { MatchData, MatchParty, MatchQuestion } from "./types";

/** A list counts as close when it matches at least this share. */
const CLOSE = 0.7;
const pct = (m: number) => `${Math.round(m * 100)}%`;
const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");

export default function Results({ data, answers, deeperDone, onEdit, onDeeper, onRestart }: {
  data: MatchData;
  answers: Answers;
  deeperDone: boolean;
  onEdit: () => void;
  onDeeper: () => void;
  onRestart: () => void;
}) {
  const asked = data.questions.filter((q) => answers[q.key]);
  const ids = data.parties.map((p) => p.id);
  const { ranked, thin } = useMemo(() => rankParties(ids, data.questions, answers), [data, answers]); // eslint-disable-line react-hooks/exhaustive-deps
  const party = (id: string) => data.parties.find((p) => p.id === id)!;
  const close = ranked.filter((s) => s.match! >= CLOSE);
  const closeSeats = close.reduce((t, s) => t + party(s.id).seats, 0);
  const [copied, setCopied] = useState(false);

  // Your Knesset: the polling average with the close lists first, in their colours, and every other seat grey.
  const segments = [
    ...close.filter((s) => party(s.id).seats > 0).map((s) => ({ id: s.id, seats: party(s.id).seats, color: party(s.id).color, label: `${party(s.id).name}, ${pct(s.match!)} match` })),
    { id: "rest", seats: Math.max(0, 120 - closeSeats), color: "var(--line-2)", label: "Lists further from you" },
  ];
  const gap = MAJORITY - closeSeats;
  const top = ranked.slice(0, 3);

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <div className="mr">
      <figure className="mr-knesset">
        <SeatGrid segments={segments} labelRule title={`Your Knesset: lists matching you at ${pct(CLOSE)} or more hold ${one(closeSeats)} of 120 seats in the polling average; ${MAJORITY} make a majority.`} />
        <figcaption>
          <h2 className="mr-lead">
            {close.length === 0
              ? <>No list matches you at {pct(CLOSE)} or more.</>
              : <>Lists that match you at {pct(CLOSE)} or more hold <b>{one(closeSeats)}</b> seats in the polling average{gap > 0 ? <>, {one(gap)} short of the {MAJORITY} that make a government.</> : <>, enough for the {MAJORITY} that make a government.</>}</>}
          </h2>
          {close.length > 0 && (
            <ul className="mr-key fig-key">
              {close.map((s) => (
                <li key={s.id}><i style={{ background: party(s.id).color }} />{party(s.id).short} <b>{pct(s.match!)}</b></li>
              ))}
              <li><i className="rest" />Further from you</li>
            </ul>
          )}
          <p className="fig-note">The grid is the Knesset as the polls see it today; your closest lists are drawn in colour. Your answers set the colours, not the seats.</p>
          <p className="fig-src">Seats: polling average{data.asOf ? `, ${data.asOf}` : ""}, <Link href="/polls">Polls</Link>. Positions: <Link href="/compare">Compare positions</Link>, with every list&apos;s sources.</p>
          <div className="mr-actions">
            <button type="button" className="btn" onClick={onEdit}>Change answers</button>
            {!deeperDone && <button type="button" className="btn" onClick={onDeeper}>Answer 8 more questions</button>}
            <button type="button" className="btn" onClick={copy}>{copied ? "Link copied" : "Copy link to these results"}</button>
          </div>
        </figcaption>
      </figure>

      <h2 className="sec-h">How every list matches you</h2>
      <p className="fig-note mr-basis">On the {asked.length} question{asked.length === 1 ? "" : "s"} you answered. Open a list to see where it stands on each.</p>
      <ol className="mr-list">
        {ranked.map((s, i) => <Row key={s.id} s={s} rank={i + 1} p={party(s.id)} questions={data.questions} answers={answers} />)}
      </ol>
      {thin.length > 0 && (
        <>
          <h3 className="mr-sub">Too little on record to place</h3>
          <p className="fig-note">These lists have a recorded answer on fewer than half the questions you answered.</p>
          <ul className="mr-thin">
            {thin.map((s) => <li key={s.id} style={{ "--fill": party(s.id).color } as CSSProperties}><Link href={`/parties/${s.id}`}>{party(s.id).name}</Link> <span>on {s.both} of {s.asked}</span></li>)}
          </ul>
        </>
      )}

      <h2 className="sec-h">If you were voting in Israel</h2>
      <p className="note">Israelis do not only ask which list they agree with. Here is what a voter whose closest lists were these would weigh.</p>
      <div className="mr-weigh">
        {top.map((s) => <Weigh key={s.id} s={s} p={party(s.id)} data={data} />)}
      </div>
      {sameBloc(top.map((s) => party(s.id)), data)}
      <div className="mr-explain">
        <section>
          <h3>The threshold</h3>
          <p>A list needs 3.25% of valid votes, about four seats, to enter the Knesset. Votes for a list that falls short elect no one, so supporters of a small list near the line weigh whether it will pass.</p>
        </section>
        <section>
          <h3>Blocs, not only lists</h3>
          <p>No list has ever won 61 seats alone. After the vote the president asks the member of Knesset with the best chance of forming a government, so many voters think about which bloc reaches 61 as much as which list they like best.</p>
        </section>
        <section>
          <h3>The biggest list and its partners</h3>
          <p>Some voters move to the largest list in their bloc so that it finishes first; others move to a smaller partner to keep it above the threshold. The two pulls run in opposite directions, and campaigns argue over both.</p>
        </section>
        <section>
          <h3>Surplus-vote agreements</h3>
          <p>Two lists can sign an agreement so their leftover votes are pooled when the last seats are shared out. It can move a seat between them, and it counts only if both lists pass the threshold.</p>
        </section>
      </div>
      <p className="fig-src">
        <Link href="/how-it-works">How the vote and the count work</Link>. Try your closest lists in the <Link href={`/coalition-builder?with=${top.filter((s) => party(s.id).seats > 0).map((s) => s.id).join(",")}`}>Coalition Builder</Link>.
      </p>

      <details className="mr-method">
        <summary>How the match works</summary>
        <p>Each answer sits on the scale Compare uses, from one end of the debate to the other. A list scores 100% on a question when it gave your answer and 0% when it sits at the far end, weighted by how much you said the question matters (a little counts {WEIGHTS[0]}, matters {WEIGHTS[1]}, a deal-breaker {WEIGHTS[2]}). The economy question is about priorities that can coexist, so only the same answer counts.</p>
        <p>A list with no recorded answer on a question is left out of that question rather than counted against it; a list that has answered fewer than half of your questions is listed apart. Answers marked from the record were read from votes and statements because the list did not answer a questionnaire.</p>
        <p>This shows how close the lists&apos; recorded positions are to your answers. It is not advice on how to vote, and the site endorses no list. Your answers stay in your browser and in this page&apos;s link; nothing is stored.</p>
        <p><button type="button" className="btn" onClick={onRestart}>Start again</button></p>
      </details>
    </div>
  );
}

function Row({ s, rank, p, questions, answers }: { s: PartyScore; rank: number; p: MatchParty; questions: MatchQuestion[]; answers: Answers }) {
  return (
    <li className={`mr-row${p.below ? " out" : ""}`} style={{ "--fill": p.color, "--fill-ink": p.ink } as CSSProperties}>
      <details>
        <summary>
          <span className="mr-rank">{rank}</span>
          <span className="mr-name"><b>{p.name}</b><small>{p.leader}</small></span>
          <span className="mr-bar" aria-hidden="true"><i style={{ width: pct(s.match!) }} /></span>
          <span className="mr-pct">{pct(s.match!)}</span>
          <span className="mr-cov">on {s.both} of {s.asked}</span>
          {s.clashes.length > 0 && <span className="mr-clash">Far from you on a deal-breaker: {s.clashes.map((k) => questions.find((q) => q.key === k)!.label).join(", ")}</span>}
        </summary>
        <div className="mr-detail">
          {s.questions.map((qs) => {
            const q = questions.find((x) => x.key === qs.key)!;
            const mine = q.stances.find((x) => x.id === answers[q.key]!.stance)!;
            const cell = qs.cell;
            const theirs = cell?.kind === "stance" ? q.stances.find((x) => x.id === cell.stance) : undefined;
            const said = q.said[p.id];
            return (
              <div key={q.key} className="mr-q">
                <p className="mr-q-label">{q.label}</p>
                <Track q={q} mine={mine.id} theirs={theirs?.id} color={p.color} />
                <p className="mr-q-read">
                  You: {mine.label}. {theirs ? <>{p.short}: {q.stanceLabels[theirs.id]}{cell?.kind === "stance" && cell.unstated ? " (not said publicly; from the record)" : cell?.kind === "stance" && cell.record ? " (from the record)" : ""}.</> : <>{p.short}: {cell?.kind === "declined" ? "declined to answer" : "no position on record"}.</>}
                </p>
                {said && theirs && <p className="mr-said">{said.text} <span className="fig-src">{said.url ? <a href={said.url} rel="noopener">{said.source}</a> : said.source}{said.date ? `, ${said.date}` : ""}</span></p>}
              </div>
            );
          })}
          <p><Link href={`/parties/${p.id}`}>Open the {p.name} profile</Link></p>
        </div>
      </details>
    </li>
  );
}

/** The question's scale as a strip of its answers' shades, with the reader's mark above and the list's below. */
function Track({ q, mine, theirs, color }: { q: MatchQuestion; mine: string; theirs?: string; color: string }) {
  return (
    <div className={`mr-track${q.scale ? "" : " unordered"}`} style={{ "--n": q.stances.length } as CSSProperties} aria-hidden="true">
      {q.stances.map((s) => (
        <span key={s.id} className="mr-step" style={{ background: s.color }}>
          {s.id === mine && <i className="you">You</i>}
          {s.id === theirs && <i className="them" style={{ background: color }} />}
        </span>
      ))}
    </div>
  );
}

function Weigh({ s, p, data }: { s: PartyScore; p: MatchParty; data: MatchData }) {
  const bloc = data.blocs.find((b) => b.id === p.bloc)!;
  const [k, n] = p.passing;
  const blocGap = MAJORITY - bloc.seats;
  return (
    <article className={`mr-w${p.below ? " out" : ""}`} style={{ "--fill": p.color } as CSSProperties}>
      <h3>{p.name} <span>{pct(s.match!)}</span></h3>
      <dl>
        <dt>Polls</dt>
        <dd>{p.below || p.seats === 0 ? "Below the threshold in the polling average" : `${p.seatsText} seats in the polling average`}{n > 0 && k < n ? `; passes the threshold in ${k} of ${n} current polls` : n > 0 ? `; passes the threshold in every current poll` : ""}.</dd>
        <dt>Bloc</dt>
        <dd>{bloc.label}: {one(bloc.seats)} seats in the average{p.bloc === "net" || p.bloc === "opp" ? (blocGap > 0 ? `, ${one(blocGap)} short of ${MAJORITY}` : `, past ${MAJORITY}`) : ""}.</dd>
        <dt>Surplus</dt>
        <dd>{p.surplus ?? "No surplus agreement found."}</dd>
        {p.pledge && (<><dt>Pledge</dt><dd>{p.pledge.text} <span className="fig-src">{p.pledge.source}</span></dd></>)}
      </dl>
    </article>
  );
}

function sameBloc(top: MatchParty[], data: MatchData) {
  if (top.length < 2) return null;
  const b = top[0].bloc;
  if (!top.every((p) => p.bloc === b)) return <p className="fig-note mr-bloc-line">Your closest lists sit in different blocs, so they would pull a vote toward different governments.</p>;
  const label = data.blocs.find((x) => x.id === b)!.label;
  return <p className="fig-note mr-bloc-line">Your closest lists all sit in one bloc: {label}. A vote for any of them adds to the same bloc&apos;s seats.</p>;
}
