import Link from "next/link";
import { compareHref, dependence, dependenceText, type StanceMap } from "@/lib/cohesion";
import { governing, governingSummary, rowText, type GovRow, type Unstated, type UnstatedMap } from "@/lib/coalition-governing";
import { AXES } from "@/lib/compare";
import type { Party, Poll } from "@/lib/types";
import { partyColor } from "@/lib/party-colors";
import StanceSlots, { type SlotColumn } from "./StanceSlots";

/*
 * Can they govern together? In the Builder's panel: one line on the questions every chosen party has
 * answered, then (folded) each question with two or more answers as a stance strip and its reading, the
 * thin ones in one quiet line, then how much a majority depends on each partner. Nothing here is a score.
 */

/** The strip at thumbnail scale: stance slots left to right, parties as squares (faded when not said publicly), the unanswered at the end. */
function Glyph({ r, map }: { r: GovRow; map: StanceMap }) {
  const cols: SlotColumn[] = map[r.key].stances.map((s) => ({
    marks: r.answers.filter((a) => a.stance === s.id).map((a) => ({ key: a.id, color: a.unstated ? `color-mix(in srgb, ${partyColor(a.id)} 40%, transparent)` : partyColor(a.id) })),
  }));
  if (r.missing.length) cols.push({ quiet: true, marks: r.missing.map((id) => ({ key: id, color: "" })) });
  return <StanceSlots cols={cols} />;
}

const basis = (u: Unstated) => `${u.text} ${u.source}${u.date ? `, ${u.date}` : ""}`;

export default function Governing({ sel, parties, poll, map, unstated = {}, withOutsideSupport = false }: { sel: Set<string>; parties: Party[]; poll: Poll; map: StanceMap; unstated?: UnstatedMap; withOutsideSupport?: boolean }) {
  const ids = parties.filter((p) => sel.has(p.id)).map((p) => p.id);
  const nameOf = (id: string) => parties.find((p) => p.id === id)?.name ?? id;
  const labelOf = (key: string) => map[key].label ?? AXES.find((a) => a.key === key)?.label ?? key;
  if (ids.length < 2) {
    return (
      <section className="together" aria-labelledby="together-h">
        <h3 id="together-h" className="sec-h3">Can they govern together?</h3>
        <p className="empty">Add a second party to see where they agree and where they split.</p>
      </section>
    );
  }
  const g = governing(map, unstated, ids);
  const shown = g.rows.filter((r) => r.reach === "every" || r.reach === "some").sort((a, b) => (a.reach === "every" ? 0 : 1) - (b.reach === "every" ? 0 : 1));
  const thin = g.rows.filter((r) => r.reach === "thin");
  const unsorted = g.rows.filter((r) => r.reach === "unsorted");
  const dep = dependenceText(dependence(sel, parties, poll), nameOf);
  return (
    <section className="together" aria-labelledby="together-h">
      <h3 id="together-h" className="sec-h3">Can they govern together?</h3>
      <details className="gov-fold">
        <summary><span className="sum">{governingSummary(g)}</span><span className="hint">Questions</span></summary>
        {withOutsideSupport && <p className="note">These rows include cabinet parties and hypothetical outside supporters. Abstainers are not treated as policy partners.</p>}
        {shown.length > 0 && (
          <ol className="rows">
            {shown.map((r) => {
              const quiet = r.answers.filter((a) => a.unstated);
              return (
                <li key={r.key} className={r.reach}>
                  <Link href={`${compareHref(ids)}#issue-${r.key}`}>
                    <span className="lbl">{labelOf(r.key)}</span>
                    <Glyph r={r} map={map} />
                    <span className="read">{rowText(r, nameOf, ids.length)}</span>
                  </Link>
                  {quiet.map((a) => (
                    <details key={a.id} className="uns" title={basis(a.unstated!)}>
                      <summary>Not said publicly: {nameOf(a.id)}</summary>
                      <p>
                        {a.unstated!.text}{" "}
                        {a.unstated!.url ? <a href={a.unstated!.url}>{a.unstated!.source}</a> : a.unstated!.source}
                        {a.unstated!.date ? `, ${a.unstated!.date}` : ""}
                      </p>
                    </details>
                  ))}
                </li>
              );
            })}
          </ol>
        )}
        {thin.length > 0 && <p className="thin">Not enough answers ({thin.length}): {thin.map((r) => labelOf(r.key)).join("; ")}.</p>}
        {unsorted.length > 0 && <p className="thin">Priorities that can coexist, not compared: {unsorted.map((r) => labelOf(r.key)).join("; ")}.</p>}
        <p className="fig-note">Selected policy questions, not a stability forecast. Questions are not equally important and differences may be negotiable. A faded square is a position the party holds but has not said publicly.</p>
      </details>
      {dep && <p className="dep">61-seat backing: {dep}</p>}
      <p className="more">
        <Link href={compareHref(ids)}>Compare these parties in their own words</Link>
      </p>
    </section>
  );
}
