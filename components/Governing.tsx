import Link from "next/link";
import type { ReactNode } from "react";
import { cohesion, compareHref, dependence, dependenceText, readingText, type IssueReading, type StanceMap } from "@/lib/cohesion";
import { AXES } from "@/lib/compare";
import type { Party, Poll } from "@/lib/types";

/*
 * Can they govern together? In the Builder's panel: for the chosen parties, each of the seven issues
 * with a small strip glyph (one slot per stance, the parties as squares in theirs, the quiet at the
 * end) and its reading; then how much a majority depends on each partner; then the pledge notes the
 * Builder already shows; then the way to the full comparison. Nothing here is a score.
 */

const COUNT = ["none", "one", "two", "three", "four", "five", "six", "seven"];

/** The strip at thumbnail scale: stance slots left to right, parties as squares stacked two wide in their slot. */
function Glyph({ r, map, partyOf }: { r: IssueReading; map: StanceMap; partyOf: (id: string) => Party | undefined }) {
  const slots = map[r.key].stances.length ? map[r.key].stances.map((s) => r.groups.find((g) => g.stance.id === s.id)?.parties ?? []) : [r.unsorted];
  const quiet = [...r.declined, ...r.none];
  const cols = quiet.length ? [...slots, quiet] : slots;
  const U = 7, G = 1.5, SLOT = 2 * U + G, GAP = 5;
  const rows = Math.max(1, ...cols.map((c) => Math.ceil(c.length / 2)));
  const W = cols.length * SLOT + (cols.length - 1) * GAP, H = rows * (U + G) - G;
  return (
    <svg className="gly" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {cols.map((ids, ci) => {
        const x0 = ci * (SLOT + GAP);
        const isQuiet = quiet.length > 0 && ci === cols.length - 1;
        return (
          <g key={ci}>
            {ids.length === 0 && <rect className="slot" x={x0} y={H - U} width={SLOT} height={U} />}
            {ids.map((id, i) => {
              const p = partyOf(id);
              const x = x0 + (i % 2) * (U + G), y = H - U - Math.floor(i / 2) * (U + G);
              return <rect key={id} className={isQuiet ? "quiet" : undefined} x={x} y={y} width={U} height={U} style={isQuiet ? undefined : { fill: `var(--b-${p?.bloc ?? "mid"})` }} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function Governing({ sel, parties, poll, map, children }: { sel: Set<string>; parties: Party[]; poll: Poll; map: StanceMap; children?: ReactNode }) {
  const ids = parties.filter((p) => sel.has(p.id)).map((p) => p.id);
  const partyOf = (id: string) => parties.find((p) => p.id === id);
  const nameOf = (id: string) => partyOf(id)?.name ?? id;
  if (ids.length < 2) {
    return (
      <section className="together" aria-labelledby="together-h">
        <h3 id="together-h">Can they govern together?</h3>
        <p className="empty">Add a second party to see where they agree and where they split.</p>
        {children}
      </section>
    );
  }
  const c = cohesion(AXES, map, ids);
  const sorted = c.agree + c.split + c.silent;
  const unsorted = c.issues.length - sorted;
  const sum =
    sorted === 0
      ? "Positions are recorded for these parties but not yet sorted into stances."
      : [c.agree ? `Agree on ${COUNT[c.agree]} ${c.agree === 1 ? "issue" : "issues"}` : null, c.split ? `${c.agree ? "split" : "Split"} on ${COUNT[c.split]}` : null, c.silent ? `${c.agree || c.split ? "nothing" : "Nothing"} recorded on ${COUNT[c.silent]}` : null]
          .filter(Boolean)
          .join(", ") +
        " of the seven." +
        (unsorted ? ` The other ${unsorted === 1 ? "one is" : `${COUNT[unsorted]} are`} not yet sorted into stances.` : "");
  const dep = dependenceText(dependence(sel, parties, poll), nameOf);
  return (
    <section className="together" aria-labelledby="together-h">
      <h3 id="together-h">Can they govern together?</h3>
      <p className="sum">{sum}</p>
      <ol className="rows">
        {c.issues.map((r) => {
          const label = AXES.find((a) => a.key === r.key)!.label;
          return (
            <li key={r.key} className={r.verdict}>
              <Link href={`${compareHref(ids)}#issue-${r.key}`}>
                <span className="lbl">{label}</span>
                <Glyph r={r} map={map} partyOf={partyOf} />
                <span className="read">{readingText(r, nameOf)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {dep && <p className="dep">{dep}</p>}
      {children}
      <p className="more">
        <Link href={compareHref(ids)}>Compare these parties in their own words</Link>
      </p>
    </section>
  );
}
