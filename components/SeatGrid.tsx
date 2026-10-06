import type { Lang } from "@/lib/i18n";
import chrome from "@/lib/i18n/chrome";
import "./seatgrid.css";

export type Segment = {
  id: string;
  /** Seats, may be fractional (poll averages); cells are allocated by largest remainder. */
  seats: number;
  /** CSS colour, usually `var(--b-net)` etc. */
  color: string;
  label: string;
  /** Optional destination: the segment's cells form one accessible SVG link. */
  href?: string;
};

export const COLS = 12, ROWS = 10, TOTAL = 120, MAJORITY = 61;

/** Whole cells per segment, adding to at most 120, by largest remainder. */
export function allocate(segments: Segment[], total = TOTAL): number[] {
  const want = segments.map((s) => Math.max(0, s.seats));
  const sum = want.reduce((a, b) => a + b, 0);
  const scale = sum > total ? total / sum : 1;
  const exact = want.map((w) => w * scale);
  const floor = exact.map(Math.floor);
  let left = Math.min(total, Math.round(sum)) - floor.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => ({ i, r: e - floor[i] })).sort((a, b) => b.r - a.r);
  for (const { i } of order) {
    if (left <= 0) break;
    floor[i]++;
    left--;
  }
  return floor;
}

/**
 * 120 seats as a grid, twelve across, filled in order from the top left. The heavy rule sits
 * under the fifth row: everything above it is 60 seats, so the first cell of the sixth row is
 * the 61st, the one that makes a majority. `rtl` (the Hebrew edition) fills from the top right instead, with
 * "61" left of the rule: SVG ignores dir, so the grid is mirrored here. `lang` words the default labels.
 */
export default function SeatGrid({
  segments,
  variant = "hero",
  animate = false,
  labelRule = false,
  title,
  className,
  rtl = false,
  lang = "en",
}: {
  segments: Segment[];
  variant?: "hero" | "meter";
  /** Fill in on first paint (home page only). */
  animate?: boolean;
  /** Print "61" beside the rule. */
  labelRule?: boolean;
  title?: string;
  className?: string;
  /** Fill from the top right (Hebrew reading order). */
  rtl?: boolean;
  lang?: Lang;
}) {
  const t = chrome[lang].grid;
  const counts = allocate(segments);
  const U = 12, C = 10, extra = labelRule ? 20 : 0;
  /** A cell's x: twelve across from the left, or from the right with the label's room on the left. */
  const cx = (i: number) => (rtl ? extra + (COLS - 1 - (i % COLS)) * U + 1 : (i % COLS) * U + 1);
  const cells: React.ReactNode[] = [];
  let i = 0;
  segments.forEach((s, k) => {
    const segmentCells: React.ReactNode[] = [];
    for (let n = 0; n < counts[k]; n++, i++) {
      segmentCells.push(
        <rect
          key={i}
          className="c"
          x={cx(i)}
          y={Math.floor(i / COLS) * U + 1}
          width={C}
          height={C}
          fill={s.color}
          style={animate ? { animationDelay: `${i * 6}ms` } : undefined}
        >
          <title>{s.href ? t.shown(s.label, Math.round(s.seats * 10) / 10, i + 1) : t.seat(s.label, i + 1)}</title>
        </rect>
      );
    }
    if (s.href && segmentCells.length) {
      const name = t.explore(s.label, Math.round(s.seats * 10) / 10);
      cells.push(<a key={s.id} href={s.href} className="seat-party-link" tabIndex={0} aria-label={name}><title>{name}</title>{segmentCells}</a>);
    } else cells.push(...segmentCells);
  });
  const filled = i;
  for (; i < TOTAL; i++) {
    cells.push(<rect key={i} className="e" x={cx(i)} y={Math.floor(i / COLS) * U + 1} width={C} height={C} />);
  }
  const W = COLS * U, ruleY = 5 * U;
  const label =
    title ?? `${segments.map((s) => `${s.label} ${Math.round(s.seats * 10) / 10}`).join(", ")}; ${t.majority(MAJORITY, TOTAL)}`;
  return (
    <svg
      viewBox={`0 0 ${W + extra} ${ROWS * U}`}
      className={`sg sg-${variant}${animate ? " sg-anim" : ""}${filled >= MAJORITY ? " sg-maj" : ""}${className ? ` ${className}` : ""}`}
      role={segments.some((s) => s.href) ? "group" : "img"}
      aria-label={label}
    >
      {cells}
      {rtl ? (
        <line className="rule" x1={extra - (labelRule ? 3 : 0)} x2={extra + W} y1={ruleY} y2={ruleY} />
      ) : (
        <line className="rule" x1={0} x2={W + (labelRule ? 3 : 0)} y1={ruleY} y2={ruleY} />
      )}
      {labelRule && (
        <text className="rl" x={rtl ? extra - 5 : W + 5} y={ruleY + 2.4} dominantBaseline="middle" textAnchor={rtl ? "end" : undefined} direction={rtl ? "ltr" : undefined}>
          61
        </text>
      )}
    </svg>
  );
}
