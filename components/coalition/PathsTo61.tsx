"use client";

import { Fragment, useMemo, useState } from "react";
import SeatBar, { type SeatBarSegment } from "../SeatBar";
import { partyColor, partyInk } from "@/lib/party-colors";
import { pathsTo61, supportPaths, type Path, type SupportPath } from "@/lib/paths-to-61";
import { MAJORITY } from "@/lib/coalition";
import type { Party, PledgeRule, Poll } from "@/lib/types";
import builder from "@/lib/i18n/builder";
import { useLang } from "@/lib/i18n/lang";
import { partyText } from "@/lib/i18n/overlay-text";
import { Loc } from "./Loc";

/** Outside support: the list's colour, hatched (supporting, not in the cabinet). */
export const supportFill = (c: string) => `repeating-linear-gradient(135deg, ${c} 0 3px, color-mix(in srgb, ${c} 28%, var(--sheet)) 3px 6px)`;

const PAGE = 6;

/**
 * Paths to 61: the Builder's opening figure. Every minimal winning combination of lists in the selected
 * poll (lib/paths-to-61.ts), one SeatBar each, with pledge conflicts from the declarative rules counted and
 * notched on the lists they name. Clear paths first, then those with a conflict, numbered as one list.
 * Tapping a row loads it into the builder.
 */
export default function PathsTo61({ poll, parties, rules, pollName, sn, onLoad, open }: {
  poll: Poll; parties: Party[]; rules: PledgeRule[]; pollName: string; sn: (n: number) => string;
  onLoad: (cabinet: string[], support: string[]) => void; open: boolean;
}) {
  const lang = useLang();
  const T = builder[lang];
  const all = useMemo(() => pathsTo61(poll, parties, rules), [poll, parties, rules]);
  const helped = useMemo(() => supportPaths(all, parties, rules, poll), [all, parties, rules, poll]);
  const [likud, setLikud] = useState(true);
  const [clean, setClean] = useState(false);
  const [n, setN] = useState(PAGE);
  const [m, setM] = useState(PAGE);
  const by = (p: Path) => p.ids.includes("likud") === likud;
  const side = all.filter(by);
  const rows = clean ? side.filter((p) => !p.conflicts.length) : side;
  const sideHelped = helped.filter((s) => [...s.cabinet, ...s.support].includes("likud") === likud);
  const nameOf = (id: string) => { const p = parties.find((x) => x.id === id); return p ? partyText(p, "name", lang).text : id; };
  const shortOf = (id: string) => { const p = parties.find((x) => x.id === id); return p ? partyText(p, "short", lang).text : id; };
  /** The names in a path, each marked when it falls back to English, joined by commas. */
  const names = (ids: string[]) => ids.map((id, i) => { const p = parties.find((x) => x.id === id); return <Fragment key={id}>{i > 0 && ", "}{p ? <Loc v={partyText(p, "name", lang)} page={lang} /> : id}</Fragment>; });
  const seats = (id: string) => poll.results[id]?.seats ?? 0;
  const seg = (id: string, notch: boolean, hatched = false): SeatBarSegment => ({
    key: id, seats: seats(id), color: hatched ? supportFill(partyColor(id)) : partyColor(id), ink: partyInk(id),
    label: hatched ? undefined : shortOf(id), title: `${nameOf(id)}: ${sn(seats(id))}`, className: notch ? "pc-x" : undefined,
  });
  const pick = (v: boolean, set: (b: boolean) => void) => () => { set(v); setN(PAGE); setM(PAGE); };
  const withL = all.filter((p) => p.ids.includes("likud"));
  const withoutL = all.filter((p) => !p.ids.includes("likud"));
  const cleanCount = side.filter((p) => !p.conflicts.length).length;
  const shown = rows.slice(0, n);
  const shownClear = shown.filter((p) => !p.conflicts.length);
  const shownHit = shown.filter((p) => p.conflicts.length);
  const row = (p: Path) => (
    <li key={p.ids.join()}>
      <button type="button" className="path" onClick={() => onLoad(p.ids, [])}>
        <span className="pn">{lang === "en" ? p.ids.map(nameOf).join(", ") : names(p.ids)}</span>
        <span className="pv"><b>{sn(p.seats)}</b> {T.pathSeats}</span>
        <SeatBar size="m" className="sb-fit" segments={p.ids.map((id) => seg(id, p.conflictIds.includes(id)))} />
        <span className={`pc${p.conflicts.length ? " on" : ""}`}>
          {p.conflicts.length ? T.pathConflicts(p.conflicts.length, p.conflictIds.map(nameOf)) : T.pathClear}
        </span>
      </button>
    </li>
  );

  return (
    <details className="paths" open={open}>
      <summary>
        <h2 className="sec-h3">{T.pathsHead(MAJORITY)}</h2>
        <span className="hint">{T.pathsWays(all.length)}</span>
      </summary>
      <p className="fig-note">{T.pathsLead(MAJORITY, pollName)}</p>
      <div className="path-ctl">
        <div className="seg" role="group" aria-label={T.likudGroup}>
          <button type="button" aria-pressed={likud} onClick={pick(true, setLikud)}>{T.withLikud}<small>{T.nPaths(withL.length)}</small></button>
          <button type="button" aria-pressed={!likud} onClick={pick(false, setLikud)}>{T.withoutLikud}<small>{T.nPaths(withoutL.length)}</small></button>
        </div>
        <div className="seg" role="group" aria-label={T.conflictGroup}>
          <button type="button" aria-pressed={!clean} onClick={pick(false, setClean)}>{T.everyPath}<small>{side.length}</small></button>
          <button type="button" aria-pressed={clean} disabled={!clean && cleanCount === 0} onClick={pick(true, setClean)}>{T.noConflict}<small>{cleanCount}</small></button>
        </div>
      </div>
      {rows.length ? (
        <>
          {!clean && !cleanCount && <p className="path-break">{T.noneClear(likud)}</p>}
          {shownClear.length > 0 && <ol className="path-list">{shownClear.map(row)}</ol>}
          {shownHit.length > 0 && (
            <>
              {shownClear.length > 0 && <p className="path-break">{T.withConflict(side.length - cleanCount)}</p>}
              <ol className="path-list" start={shownClear.length + 1}>{shownHit.map(row)}</ol>
            </>
          )}
        </>
      ) : (
        <p className="empty">{T.noPath(likud, MAJORITY, clean)}</p>
      )}
      {rows.length > n && (
        <p className="path-more">
          <button type="button" className="btn" onClick={() => setN(n + 10)}>{T.showMore(Math.min(10, rows.length - n))}</button>
          <span>{T.showing(n, rows.length)}</span>
        </p>
      )}
      <p className="fig-key path-key">
        <span><i className="k k-tick" />{T.keyMajority(MAJORITY)}</span>
        <span><i className="k k-notch" />{T.keyNotch}</span>
        <span><i className="k k-hatch" />{T.keyHatched}</span>
      </p>
      <p className="fig-note">{T.pathsMethod(MAJORITY)}</p>
      {sideHelped.length > 0 && (
        <details className="path-support">
          <summary>{T.supportHead} <span className="hint">{T.supportHint(sideHelped.length, likud)}</span></summary>
          <p className="fig-note">{T.supportNote}</p>
          <ol className="path-list">
            {sideHelped.slice(0, m).map((s: SupportPath) => (
              <li key={`${s.cabinet.join()}|${s.support.join()}`}>
                <button type="button" className="path" onClick={() => onLoad(s.cabinet, s.support)}>
                  <span className="pn">{T.supportNames(s.cabinet.map(nameOf), s.support.map(nameOf))}</span>
                  <span className="pv"><b>{sn(s.seats)}</b> {T.supportFor}</span>
                  <SeatBar size="m" className="sb-fit" segments={[...s.cabinet.map((id) => seg(id, false)), ...s.support.map((id) => seg(id, false, true))]} />
                  <span className="pc">{T.supportSplit(sn(s.cabinetSeats), sn(s.supportSeats))}</span>
                </button>
              </li>
            ))}
          </ol>
          {sideHelped.length > m && (
            <p className="path-more">
              <button type="button" className="btn" onClick={() => setM(m + 10)}>{T.showMore(Math.min(10, sideHelped.length - m))}</button>
              <span>{T.showing(m, sideHelped.length)}</span>
            </p>
          )}
        </details>
      )}
    </details>
  );
}
