import Link from "next/link";
import type { ReactNode } from "react";
import { cohesion, compareHref, dependence, dependenceText, readingText, type IssueReading, type StanceMap } from "@/lib/cohesion";
import { AXES } from "@/lib/compare";
import type { Party, Poll } from "@/lib/types";
import { partyColor } from "@/lib/party-colors";
import StanceSlots, { type SlotColumn } from "./StanceSlots";

/*
 * Can they govern together? In the Builder's panel: for the chosen parties, each of the seven issues
 * with a small strip glyph (one slot per stance, the parties as squares in theirs, the quiet at the
 * end) and its reading; then how much a majority depends on each partner; then the pledge notes the
 * Builder already shows; then the way to the full comparison. Nothing here is a score.
 */


/** The strip at thumbnail scale: stance slots left to right, parties as squares stacked two wide in their slot. */
function Glyph({ r, map }: { r: IssueReading; map: StanceMap }) {
  const slots = map[r.key].stances.length ? map[r.key].stances.map((s) => r.groups.find((g) => g.stance.id === s.id)?.parties ?? []) : [r.unsorted];
  const quiet = [...r.declined, ...r.none];
  const cols: SlotColumn[] = slots.map((ids) => ({ marks: ids.map((id) => ({ key: id, color: partyColor(id) })) }));
  if (quiet.length) cols.push({ quiet: true, marks: quiet.map((id) => ({ key: id, color: "" })) });
  return <StanceSlots cols={cols} />;
}

export default function Governing({ sel, parties, poll, map, children, withOutsideSupport = false }: { sel: Set<string>; parties: Party[]; poll: Poll; map: StanceMap; children?: ReactNode; withOutsideSupport?: boolean }) {
  const ids = parties.filter((p) => sel.has(p.id)).map((p) => p.id);
  const partyOf = (id: string) => parties.find((p) => p.id === id);
  const nameOf = (id: string) => partyOf(id)?.name ?? id;
  if (ids.length < 2) {
    return (
      <section className="together" aria-labelledby="together-h">
        <h3 id="together-h" className="sec-h3">Can they govern together?</h3>
        <p className="empty">Add a second party to see where they agree and where they split.</p>
        {children}
      </section>
    );
  }
  const c = cohesion(Object.keys(map).map((key) => ({ key })), map, ids);
  const incomplete = c.issues.filter((r) => r.known < r.selected || r.verdict === "unsorted").length;
  const sum = `${c.agree} shared recorded positions; ${c.split} questions with different recorded positions; ${incomplete} with incomplete or non-comparable evidence.`;
  const dep = dependenceText(dependence(sel, parties, poll), nameOf);
  return (
    <section className="together" aria-labelledby="together-h">
      <h3 id="together-h" className="sec-h3">Can they govern together?</h3>
      {withOutsideSupport && <p className="note">These policy rows include cabinet parties and hypothetical outside supporters. Abstainers are not treated as policy partners.</p>}
      <p className="sum">{sum}</p>
      <p className="note">These are selected policy questions, not a stability forecast. Questions are not equally important, and differences may be negotiable. Partial evidence never counts as coalition-wide agreement.</p>
      <ol className="rows">
        {c.issues.map((r) => {
          const label = map[r.key].label ?? AXES.find((a) => a.key === r.key)?.label ?? r.key;
          return (
            <li key={r.key} className={r.verdict}>
              <Link href={`${compareHref(ids)}#issue-${r.key}`}>
                <span className="lbl">{label}</span>
                <Glyph r={r} map={map} />
                <span className="read">{readingText(r, nameOf)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {dep && <p className="dep">61-seat backing: {dep}</p>}
      {children}
      <p className="more">
        <Link href={compareHref(ids)}>Compare these parties in their own words</Link>
      </p>
    </section>
  );
}
