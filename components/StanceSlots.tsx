import "./stance-slots.css";

/** One slot of the strip: the lists that gave this answer, each a square in its own colour; `quiet` is the end slot for no answer. */
export type SlotColumn = { marks: { key: string; color: string }[]; quiet?: boolean };

/**
 * The shared stance mark (Builder's "Can they govern together?" and the profile's stance tiles): one slot per answer,
 * left to right in the issue's order, each list a square in its slot, stacked two wide; an empty slot is a 1px outline,
 * and lists with no answer sit in the quiet slot at the end.
 */
export default function StanceSlots({ cols }: { cols: SlotColumn[] }) {
  if (!cols.length) return null;
  const U = 7, G = 1.5, SLOT = 2 * U + G, GAP = 5;
  const rows = Math.max(1, ...cols.map((c) => Math.ceil(c.marks.length / 2)));
  const W = cols.length * SLOT + (cols.length - 1) * GAP, H = rows * (U + G) - G;
  return (
    <svg className="gly" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {cols.map((c, ci) => {
        const x0 = ci * (SLOT + GAP);
        return (
          <g key={ci}>
            {c.marks.length === 0 && <rect className="slot" x={x0 + 0.5} y={H - U + 0.5} width={SLOT - 1} height={U - 1} />}
            {c.marks.map((m, i) => (
              <rect key={m.key} className={c.quiet ? "quiet" : undefined} x={x0 + (i % 2) * (U + G)} y={H - U - Math.floor(i / 2) * (U + G)} width={U} height={U} style={c.quiet ? undefined : { fill: m.color }} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
