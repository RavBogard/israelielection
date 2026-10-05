import "./seatgrid.css";

export type Segment = {
  id: string;
  /** Seats, may be fractional (poll averages); cells are allocated by largest remainder. */
  seats: number;
  /** CSS colour, usually `var(--b-net)` etc. */
  color: string;
  label: string;
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
 * the 61st, the one that makes a majority.
 */
export default function SeatGrid({
  segments,
  variant = "hero",
  animate = false,
  labelRule = false,
  title,
  className,
}: {
  segments: Segment[];
  variant?: "hero" | "meter";
  /** Fill in on first paint (home page only). */
  animate?: boolean;
  /** Print "61" beside the rule. */
  labelRule?: boolean;
  title?: string;
  className?: string;
}) {
  const counts = allocate(segments);
  const U = 12, C = 10;
  const cells: React.ReactNode[] = [];
  let i = 0;
  segments.forEach((s, k) => {
    for (let n = 0; n < counts[k]; n++, i++) {
      cells.push(
        <rect
          key={i}
          className="c"
          x={(i % COLS) * U + 1}
          y={Math.floor(i / COLS) * U + 1}
          width={C}
          height={C}
          fill={s.color}
          style={animate ? { animationDelay: `${i * 6}ms` } : undefined}
        >
          <title>{`${s.label}, seat ${i + 1}`}</title>
        </rect>
      );
    }
  });
  const filled = i;
  for (; i < TOTAL; i++) {
    cells.push(<rect key={i} className="e" x={(i % COLS) * U + 1} y={Math.floor(i / COLS) * U + 1} width={C} height={C} />);
  }
  const W = COLS * U, ruleY = 5 * U, extra = labelRule ? 20 : 0;
  const label =
    title ?? `${segments.map((s) => `${s.label} ${Math.round(s.seats * 10) / 10}`).join(", ")}; ${MAJORITY} of ${TOTAL} is a majority`;
  return (
    <svg
      viewBox={`0 0 ${W + extra} ${ROWS * U}`}
      className={`sg sg-${variant}${animate ? " sg-anim" : ""}${filled >= MAJORITY ? " sg-maj" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={label}
    >
      {cells}
      <line className="rule" x1={0} x2={W + (labelRule ? 3 : 0)} y1={ruleY} y2={ruleY} />
      {labelRule && (
        <text className="rl" x={W + 5} y={ruleY + 2.4} dominantBaseline="middle">
          61
        </text>
      )}
    </svg>
  );
}
