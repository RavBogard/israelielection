import type { CSSProperties, ReactNode } from "react";
import "./seatbar.css";

export type SeatBarSegment = {
  key: string;
  seats: number;
  /** Fill: a bloc, party or stance colour (CSS colour or var). */
  color: string;
  /** Text colour on the fill, when the segment carries a label. */
  ink?: string;
  /** Printed inside the segment (a seat figure, an answer's number). */
  label?: ReactNode;
  title?: string;
  className?: string;
  /** Extra inline style for the segment (e.g. a label's padding moved clear of the 61 tick). */
  style?: CSSProperties;
};

/**
 * The Knesset as one horizontal bar: segments sized by seats out of `total`, the empty track in cell,
 * and the 2px ink tick at `majority`, the only heavy rule on the site. `rest` draws the remainder as its
 * own segment (hatched means cannot or absent). Without `label` the bar is decorative (aria-hidden), for
 * figures whose numbers are already in text beside it.
 * Sizes: s 10px (meters), m 22px (index minis), l 34px (issue split), xl 44px (the polls bloc bar).
 */
export default function SeatBar({ segments, total = 120, majority = 61, size = "s", rest, label, className }: {
  segments: SeatBarSegment[];
  total?: number;
  majority?: number | null;
  size?: "s" | "m" | "l" | "xl";
  rest?: { title?: string; hatch?: boolean };
  label?: string;
  className?: string;
}) {
  const w = (n: number) => `${(n / total) * 100}%`;
  const remainder = Math.max(0, total - segments.reduce((a, s) => a + Math.max(0, s.seats), 0));
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <span className={`seatbar sb-${size}${className ? ` ${className}` : ""}`} {...a11y}>
      {segments.filter((s) => s.seats > 0).map((s) => (
        <span key={s.key} className={`sb-seg${s.className ? ` ${s.className}` : ""}`} style={{ ...s.style, width: w(s.seats), background: s.color, color: s.ink }} title={s.title}>
          {s.label != null && <b>{s.label}</b>}
        </span>
      ))}
      {rest && remainder > 0 && <span className={`sb-seg sb-rest${rest.hatch ? " sb-hatch" : ""}`} style={{ width: w(remainder) }} title={rest.title} />}
      {majority != null && <i className="sb-maj" style={{ left: w(majority) }} aria-hidden="true" />}
    </span>
  );
}
