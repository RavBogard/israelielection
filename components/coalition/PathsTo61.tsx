"use client";

import { useMemo, useState } from "react";
import SeatBar, { type SeatBarSegment } from "../SeatBar";
import { partyColor, partyInk } from "@/lib/party-colors";
import { pathsTo61, supportPaths, type Path, type SupportPath } from "@/lib/paths-to-61";
import { MAJORITY } from "@/lib/coalition";
import type { Party, PledgeRule, Poll } from "@/lib/types";

/** Outside support: the list's colour, hatched (supporting, not in the cabinet). */
export const supportFill = (c: string) => `repeating-linear-gradient(135deg, ${c} 0 3px, color-mix(in srgb, ${c} 28%, var(--sheet)) 3px 6px)`;

const PAGE = 6;

/**
 * Paths to 61: the Builder's opening figure. Every minimal winning combination of lists in the selected
 * poll (lib/paths-to-61.ts), one SeatBar each, with pledge conflicts from the declarative rules counted and
 * notched on the lists they name. Tapping a row loads it into the builder.
 */
export default function PathsTo61({ poll, parties, rules, pollName, sn, onLoad, open }: {
  poll: Poll; parties: Party[]; rules: PledgeRule[]; pollName: string; sn: (n: number) => string;
  onLoad: (cabinet: string[], support: string[]) => void; open: boolean;
}) {
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
  const nameOf = (id: string) => parties.find((p) => p.id === id)?.name ?? id;
  const shortOf = (id: string) => parties.find((p) => p.id === id)?.short ?? id;
  const seats = (id: string) => poll.results[id]?.seats ?? 0;
  const seg = (id: string, notch: boolean, hatched = false): SeatBarSegment => ({
    key: id, seats: seats(id), color: hatched ? supportFill(partyColor(id)) : partyColor(id), ink: partyInk(id),
    label: hatched ? undefined : shortOf(id), title: `${nameOf(id)}: ${sn(seats(id))}`, className: notch ? "pc-x" : undefined,
  });
  const pick = (v: boolean, set: (b: boolean) => void) => () => { set(v); setN(PAGE); setM(PAGE); };
  const withL = all.filter((p) => p.ids.includes("likud"));
  const withoutL = all.filter((p) => !p.ids.includes("likud"));
  const cleanCount = side.filter((p) => !p.conflicts.length).length;

  return (
    <details className="paths" open={open}>
      <summary>
        <h2 className="sec-h3">Paths to {MAJORITY}</h2>
        <span className="hint">{all.length} ways</span>
      </summary>
      <p className="fig-note">Every smallest set of lists that reaches {MAJORITY} in {pollName}: drop any one list and it falls short. Fewest lists first, then most seats. Tap one to load it.</p>
      <div className="path-ctl">
        <div className="seg" role="group" aria-label="Likud in the path">
          <button type="button" aria-pressed={likud} onClick={pick(true, setLikud)}>With Likud<small>{withL.length} paths</small></button>
          <button type="button" aria-pressed={!likud} onClick={pick(false, setLikud)}>Without Likud<small>{withoutL.length} paths</small></button>
        </div>
        <div className="seg" role="group" aria-label="Pledge conflicts">
          <button type="button" aria-pressed={!clean} onClick={pick(false, setClean)}>Every path<small>{side.length}</small></button>
          <button type="button" aria-pressed={clean} onClick={pick(true, setClean)}>No pledge conflict<small>{cleanCount}</small></button>
        </div>
      </div>
      {rows.length ? (
        <ol className="path-list">
          {rows.slice(0, n).map((p) => (
            <li key={p.ids.join()}>
              <button type="button" className="path" onClick={() => onLoad(p.ids, [])}>
                <span className="pn">{p.ids.map(nameOf).join(", ")}</span>
                <span className="pv"><b>{sn(p.seats)}</b> seats</span>
                <SeatBar size="m" className="sb-fit" segments={p.ids.map((id) => seg(id, p.conflictIds.includes(id)))} />
                <span className={`pc${p.conflicts.length ? " on" : ""}`}>
                  {p.conflicts.length ? `${p.conflicts.length} pledge conflict${p.conflicts.length > 1 ? "s" : ""}, naming ${p.conflictIds.map(nameOf).join(", ")}` : "No pledge conflict"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">No path {likud ? "with" : "without"} Likud reaches {MAJORITY} here{clean ? " without a pledge conflict" : ""}.</p>
      )}
      {rows.length > n && (
        <p className="path-more">
          <button type="button" className="btn" onClick={() => setN(n + 10)}>Show {Math.min(10, rows.length - n)} more</button>
          <span>Showing {n} of {rows.length}</span>
        </p>
      )}
      <p className="fig-key path-key">
        <span><i className="k k-tick" />{MAJORITY}, a majority</span>
        <span><i className="k k-notch" />Notched corner: a list named in a recorded pledge conflict</span>
        <span><i className="k k-hatch" />Hatched: outside support, not in the cabinet</span>
      </p>
      {sideHelped.length > 0 && (
        <details className="path-support">
          <summary>With outside support <span className="hint">{sideHelped.length} {likud ? "with" : "without"} Likud</span></summary>
          <p className="fig-note">Paths above with a pledge conflict, rearranged: the fewest seats move from the cabinet to outside support so the cabinet clears every recorded pledge, and the first vote counts the same seats for. A pledge not to join a cabinet is not a promise of outside support; this is arithmetic, not a forecast.</p>
          <ol className="path-list">
            {sideHelped.slice(0, m).map((s: SupportPath) => (
              <li key={`${s.cabinet.join()}|${s.support.join()}`}>
                <button type="button" className="path" onClick={() => onLoad(s.cabinet, s.support)}>
                  <span className="pn">{s.cabinet.map(nameOf).join(", ")}; outside support: {s.support.map(nameOf).join(", ")}</span>
                  <span className="pv"><b>{sn(s.seats)}</b> for</span>
                  <SeatBar size="m" className="sb-fit" segments={[...s.cabinet.map((id) => seg(id, false)), ...s.support.map((id) => seg(id, false, true))]} />
                  <span className="pc">Cabinet {sn(s.cabinetSeats)}, outside support {sn(s.supportSeats)}</span>
                </button>
              </li>
            ))}
          </ol>
          {sideHelped.length > m && (
            <p className="path-more">
              <button type="button" className="btn" onClick={() => setM(m + 10)}>Show {Math.min(10, sideHelped.length - m)} more</button>
              <span>Showing {m} of {sideHelped.length}</span>
            </p>
          )}
        </details>
      )}
    </details>
  );
}
