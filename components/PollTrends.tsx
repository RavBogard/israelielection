"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { fmt, shortDate } from "@/lib/format";
import type { BlocId } from "@/lib/types";

export type TrendPanel = {
  id: string;
  name: string;
  bloc: BlocId;
  /** Running average at each poll date. */
  trend: { date: string; avg: number; n: number }[];
  /** Individual readings; `ref` = shown but not averaged (Channel 14). */
  dots: { date: string; seats: number; pollster: string; ref: boolean }[];
};

const H = 132, PAD = { l: 26, r: 10, t: 8, b: 20 };
const DAY = 86_400_000;

function Panel({ p, from, to, yMax }: { p: TrendPanel; from: string; to: string; yMax: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t0 = Date.parse(from), t1 = Date.parse(to);
  const x = (d: string) => PAD.l + ((Date.parse(d) - t0) / Math.max(DAY, t1 - t0)) * (w - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
  const color = `var(--b-${p.bloc})`;
  const last = p.trend.at(-1);
  const shown = hover !== null ? p.trend[hover] : last;
  const ticks = [0, 10, 20, 30].filter((v) => v <= yMax);
  const path = p.trend.map((pt, i) => `${i ? "L" : "M"}${x(pt.date).toFixed(1)},${y(pt.avg).toFixed(1)}`).join("");

  const nearest = (px: number) => {
    let best = 0, bd = Infinity;
    p.trend.forEach((pt, i) => {
      const d = Math.abs(x(pt.date) - px);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };

  return (
    <figure className="pt-panel">
      <figcaption>
        <span className="pt-name">
          <span className="sw" style={{ background: color }} />
          {p.name}
        </span>
        <span className="pt-read" aria-live="polite">
          {shown ? (
            <>
              <b>{fmt(Math.round(shown.avg * 10) / 10)}</b> avg, {shortDate(shown.date)}
            </>
          ) : (
            "no readings"
          )}
        </span>
      </figcaption>
      <div ref={ref} className="pt-plot">
        {w > 0 && (
          <svg
            width={w}
            height={H}
            role="img"
            aria-label={`${p.name}: running average ${last ? `${fmt(Math.round(last.avg * 10) / 10)} seats on ${shortDate(last.date)}` : "not available"}`}
            tabIndex={p.trend.length ? 0 : -1}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (p.trend.length) setHover(nearest(e.clientX - r.left));
            }}
            onPointerLeave={() => setHover(null)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (!p.trend.length) return;
              if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? p.trend.length) - 1)); }
              if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(p.trend.length - 1, (h ?? -1) + 1)); }
            }}
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={w - PAD.r} y1={y(v)} y2={y(v)} className="pt-grid" />
                <text x={PAD.l - 6} y={y(v)} className="pt-tick" textAnchor="end" dominantBaseline="middle">
                  {v}
                </text>
              </g>
            ))}
            <text x={PAD.l} y={H - 4} className="pt-tick">{shortDate(from)}</text>
            <text x={w - PAD.r} y={H - 4} className="pt-tick" textAnchor="end">{shortDate(to)}</text>
            {p.dots.map((d, i) =>
              d.ref ? (
                <circle key={i} cx={x(d.date)} cy={y(d.seats)} r={3.5} className="pt-dot-ref">
                  <title>{`${d.pollster}, ${shortDate(d.date)}: ${d.seats} (not averaged)`}</title>
                </circle>
              ) : (
                <circle key={i} cx={x(d.date)} cy={y(d.seats)} r={4} fill={color} className="pt-dot">
                  <title>{`${d.pollster}, ${shortDate(d.date)}: ${d.seats}`}</title>
                </circle>
              )
            )}
            <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && p.trend[hover] && (
              <>
                <line x1={x(p.trend[hover].date)} x2={x(p.trend[hover].date)} y1={PAD.t} y2={H - PAD.b} className="pt-cross" />
                <circle cx={x(p.trend[hover].date)} cy={y(p.trend[hover].avg)} r={5} fill={color} className="pt-dot" />
              </>
            )}
          </svg>
        )}
      </div>
    </figure>
  );
}

export default function PollTrends({ groups, from, to, yMax }: {
  groups: { bloc: BlocId; label: string; panels: TrendPanel[] }[];
  from: string;
  to: string;
  yMax: number;
}) {
  return (
    <div className="pt">
      <div className="pt-legend" aria-hidden="true">
        <span><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--ink-2)" /></svg> One poll (averaged)</span>
        <span><svg width="12" height="12"><circle cx="6" cy="6" r="3.5" className="pt-dot-ref" /></svg> Channel 14 (shown, not averaged)</span>
        <span><svg width="20" height="12"><line x1="1" x2="19" y1="6" y2="6" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" /></svg> Running average</span>
      </div>
      {groups.map((g) => (
        <section key={g.bloc} className="pt-group">
          <h3 className="lbl">
            <span className="sw" style={{ background: `var(--b-${g.bloc})` }} /> {g.label}
          </h3>
          <div className="pt-grid-wrap">
            {g.panels.map((p) => (
              <Panel key={p.id} p={p} from={from} to={to} yMax={yMax} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
